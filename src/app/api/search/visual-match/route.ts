import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { recordAnalyticsEvent } from "@/lib/analytics/analyticsStore";
import { generateAgentUrl } from "@/lib/agents/agentConfig";

const CATALOG_PATH = path.join(process.cwd(), "src", "lib", "products", "sheetProducts.json");

function getApiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    ""
  );
}

interface VisualAnalysisResult {
  garmentCategory: string;
  identifiedPiece: string;
  likelyBrand: string;
  aesthetic: string;
  dominantColors: string[];
  keywords: string[];
  marketplaceSearchQuery: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, imageUrl, sampleLabel } = body;

    if (!imageBase64 && !imageUrl && !sampleLabel) {
      return NextResponse.json(
        { success: false, error: "Image data or URL is required for visual matching" },
        { status: 400 }
      );
    }

    // 1. Read Live Catalog
    let catalog: any[] = [];
    if (fs.existsSync(CATALOG_PATH)) {
      try {
        catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf-8"));
      } catch (e) {
        console.warn("Could not read catalog:", e);
      }
    }

    let analysis: VisualAnalysisResult = {
      garmentCategory: "Tops & Shirts",
      identifiedPiece: sampleLabel || "Archive Garment",
      likelyBrand: "Archive Collection",
      aesthetic: "Avant-Garde Gothic",
      dominantColors: ["Black", "Washed Charcoal"],
      keywords: ["archive", "designer", "streetwear"],
      marketplaceSearchQuery: sampleLabel || "Archive Fashion Grail",
    };

    const apiKey = getApiKey();

    // 2. If Gemini API Key exists and we have base64 or URL, call Gemini 1.5 Flash Vision
    if (apiKey && imageBase64) {
      try {
        // Strip data:image/...;base64, prefix if present
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
        const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const prompt = `You are a high-fashion luxury archive expert and personal stylist.
Analyze this clothing / footwear / archive fashion item photo with extreme precision.
Identify the exact piece, silhouette, designer house (e.g. Rick Owens, Balenciaga, Enfants Riches Déprimés, Vetements, Raf Simons, Undercover, Chrome Hearts, Maison Margiela, Number (N)ine, Stussy, etc.), season/runway era if recognizable, garment category, primary colors, styling tags, and Chinese marketplace search terms.

Return ONLY a valid JSON object in this EXACT structure, without markdown code fences or other text:
{
  "garmentCategory": "Hoodie" | "T-Shirt" | "Jackets & Coats" | "Pants & Denim" | "Shoes & Boots" | "Accessories",
  "identifiedPiece": "Exact descriptive model name (e.g. Rick Owens Mountain Zip-Up Hoodie or Balenciaga Ski Alaska Boots)",
  "likelyBrand": "Brand Name (e.g. Rick Owens)",
  "aesthetic": "e.g. Avant-Garde Gothic, Japanese Techwear, Distressed Punk, Cyberpunk",
  "dominantColors": ["Black", "Washed Gray"],
  "keywords": ["distressed", "waxed", "oversized", "heavyweight", "archive"],
  "marketplaceSearchQuery": "Optimized search terms for Weidian / Taobao"
}`;

        const payload = {
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType === "image/png" ? "image/png" : "image/jpeg",
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        };

        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const geminiData = await res.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (rawText) {
            const parsed = JSON.parse(rawText.replace(/```json/g, "").replace(/```/g, "").trim());
            if (parsed.garmentCategory) {
              analysis = {
                garmentCategory: parsed.garmentCategory || analysis.garmentCategory,
                identifiedPiece: parsed.identifiedPiece || analysis.identifiedPiece,
                likelyBrand: parsed.likelyBrand || analysis.likelyBrand,
                aesthetic: parsed.aesthetic || analysis.aesthetic,
                dominantColors: Array.isArray(parsed.dominantColors) ? parsed.dominantColors : analysis.dominantColors,
                keywords: Array.isArray(parsed.keywords) ? parsed.keywords : analysis.keywords,
                marketplaceSearchQuery: parsed.marketplaceSearchQuery || analysis.marketplaceSearchQuery,
              };
            }
          }
        }
      } catch (geminiError) {
        console.warn("Gemini vision analysis failed, using heuristic matching:", geminiError);
      }
    } else if (sampleLabel) {
      // Heuristic identification based on sample label
      const lower = sampleLabel.toLowerCase();
      if (lower.includes("rick owens") || lower.includes("mountain") || lower.includes("hoodie")) {
        analysis = {
          garmentCategory: "Hoodie",
          identifiedPiece: "Rick Owens Mountain Zip-Up Hoodie",
          likelyBrand: "Rick Owens",
          aesthetic: "Avant-Garde Gothic",
          dominantColors: ["Black", "Dark Charcoal"],
          keywords: ["mountain", "hoodie", "zip-up", "gothic", "rick owens"],
          marketplaceSearchQuery: "Rick Owens Mountain Hoodie RO",
        };
      } else if (lower.includes("balenciaga") || lower.includes("alaska") || lower.includes("boot")) {
        analysis = {
          garmentCategory: "Shoes & Boots",
          identifiedPiece: "Balenciaga Ski Alaska Puffer Boots",
          likelyBrand: "Balenciaga",
          aesthetic: "Chunky Cyberpunk",
          dominantColors: ["Black", "Charcoal"],
          keywords: ["alaska", "boots", "puffer", "balenciaga", "ski"],
          marketplaceSearchQuery: "Balenciaga Alaska Boots Ski",
        };
      } else if (lower.includes("erd") || lower.includes("punk")) {
        analysis = {
          garmentCategory: "T-Shirt",
          identifiedPiece: "Enfants Riches Déprimés Punk Graphic Tee",
          likelyBrand: "Enfants Riches Déprimés",
          aesthetic: "Distressed Punk Archive",
          dominantColors: ["Black", "Vintage Wash"],
          keywords: ["erd", "punk", "tee", "distressed", "vintage"],
          marketplaceSearchQuery: "ERD Enfants Riches Deprimes Punk Tee",
        };
      }
    }

    // 3. Compute Similarity Score & Match with Live Catalog Products
    const brandLower = analysis.likelyBrand.toLowerCase();
    const pieceLower = analysis.identifiedPiece.toLowerCase();
    const catLower = analysis.garmentCategory.toLowerCase();
    const keywordsLower = analysis.keywords.map((k) => k.toLowerCase());

    interface ScoredProduct {
      product: any;
      matchScore: number;
      matchReasons: string[];
      sugargooUrl: string;
      superbuyUrl: string;
      mulebuyUrl: string;
      cnfansUrl: string;
    }

    const scoredMatches: ScoredProduct[] = [];

    for (const item of catalog) {
      let score = 0;
      const reasons: string[] = [];

      const itemBrand = (item.brand || "").toLowerCase();
      const itemName = (item.name || item.title || "").toLowerCase();
      const itemCat = (item.category || "").toLowerCase();
      const itemDesc = (item.description || "").toLowerCase();
      const itemTags = (item.tags || []).map((t: string) => t.toLowerCase());

      // Brand match (up to 40 pts)
      if (itemBrand && brandLower && (itemBrand.includes(brandLower) || brandLower.includes(itemBrand))) {
        score += 40;
        reasons.push(`Matching Brand: ${item.brand}`);
      }

      // Exact title/name keyword match (up to 30 pts)
      const pieceTokens = pieceLower.split(/\s+/).filter((t) => t.length > 2);
      let tokenMatches = 0;
      for (const token of pieceTokens) {
        if (itemName.includes(token) || itemDesc.includes(token) || itemTags.includes(token)) {
          tokenMatches++;
        }
      }
      if (tokenMatches > 0) {
        const tokenScore = Math.min(30, tokenMatches * 10);
        score += tokenScore;
        reasons.push(`${tokenMatches} Keyword Match${tokenMatches > 1 ? "es" : ""}`);
      }

      // Category match (up to 20 pts)
      if (
        (catLower.includes("hoodie") && itemCat.includes("top")) ||
        (catLower.includes("shirt") && itemCat.includes("top")) ||
        (catLower.includes("boot") && itemCat.includes("foot")) ||
        (catLower.includes("shoe") && itemCat.includes("foot")) ||
        (catLower.includes("jacket") && itemCat.includes("outer")) ||
        (catLower.includes("denim") && itemCat.includes("bottom")) ||
        itemCat.includes(catLower) ||
        catLower.includes(itemCat)
      ) {
        score += 20;
        reasons.push(`Category: ${item.category || "Garment"}`);
      }

      // Aesthetic & Tag match (up to 10 pts)
      for (const kw of keywordsLower) {
        if (itemTags.includes(kw) || itemDesc.includes(kw) || itemName.includes(kw)) {
          score += 5;
        }
      }

      // Normalize score
      const finalScore = Math.min(99, Math.max(15, score));

      if (finalScore >= 35) {
        const rawStoreLink = item.directStoreLink || item.sourceUrl || "https://weidian.com";
        scoredMatches.push({
          product: {
            id: item.id,
            slug: item.slug,
            name: item.name || item.title,
            brand: item.brand,
            category: item.category,
            price: item.price || 0,
            imageUrl: item.imageUrl || item.localImage || "/products/placeholder.png",
            era: item.era || "2000s Archive",
            style: item.style || analysis.aesthetic,
            directStoreLink: item.directStoreLink,
          },
          matchScore: finalScore,
          matchReasons: reasons.slice(0, 3),
          sugargooUrl: generateAgentUrl("sugargoo", rawStoreLink),
          superbuyUrl: generateAgentUrl("superbuy", rawStoreLink),
          mulebuyUrl: generateAgentUrl("mulebuy", rawStoreLink),
          cnfansUrl: generateAgentUrl("cnfans", rawStoreLink),
        });
      }
    }

    // Sort by match score descending
    scoredMatches.sort((a, b) => b.matchScore - a.matchScore);

    // 4. Log Visual Search in Analytics (Demand Gap Tracker)
    const logQuery = `[Visual Match] ${analysis.identifiedPiece} (${analysis.likelyBrand})`;
    try {
      recordAnalyticsEvent({
        type: "search",
        query: logQuery,
        path: "/search?mode=grail_hunter",
      });
    } catch (e) {}

    // Fallback direct marketplace search links (Sugargoo Search)
    const encodedSearchQuery = encodeURIComponent(analysis.marketplaceSearchQuery || analysis.identifiedPiece);
    const marketplaceSearchLinks = {
      sugargooSearchUrl: `https://www.sugargoo.com/products?productLink=${encodedSearchQuery}&memberId=1325437696506389977`,
      superbuySearchUrl: `https://www.superbuy.com/en/page/search/?keywords=${encodedSearchQuery}&partnercode=wVam6e`,
      mulebuySearchUrl: `https://mulebuy.com/search/?keyword=${encodedSearchQuery}&ref=201493429`,
      cnfansSearchUrl: `https://cnfans.com/search/?keyword=${encodedSearchQuery}&ref=16313214`,
    };

    return NextResponse.json({
      success: true,
      analysis,
      matches: scoredMatches.slice(0, 6),
      totalMatches: scoredMatches.length,
      marketplaceSearchLinks,
      searchQuery: analysis.marketplaceSearchQuery,
    });
  } catch (error: any) {
    console.error("Visual search error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process visual search" },
      { status: 500 }
    );
  }
}
