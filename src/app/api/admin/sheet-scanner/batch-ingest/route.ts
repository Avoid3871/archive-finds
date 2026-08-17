import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

const DISCOVERED_PATH = path.join(process.cwd(), "scratch", "discovered_sheet_finds.json");
const REGISTRY_PATH = path.join(process.cwd(), "scratch", "sheet_ingestion_registry.json");
const CATALOG_PATH = path.join(process.cwd(), "src", "lib", "products", "sheetProducts.json");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const itemsToIngest: any[] = body.items || [];

    if (!itemsToIngest.length) {
      return NextResponse.json({ success: false, error: "No items provided to ingest" }, { status: 400 });
    }

    // Load existing catalog
    let catalog: any[] = [];
    if (fs.existsSync(CATALOG_PATH)) {
      try {
        catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf-8"));
      } catch (e) {}
    }

    // Load registry
    let registry: any = { processed_links: {}, blacklisted_links: [] };
    if (fs.existsSync(REGISTRY_PATH)) {
      try {
        registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8"));
      } catch (e) {}
    }

    const nextIdStart = catalog.length > 0 ? Math.max(...catalog.map((c) => parseInt(c.id) || 0)) + 1 : 1;
    const addedSlugs: string[] = [];

    itemsToIngest.forEach((it, idx) => {
      const id = (nextIdStart + idx).toString();
      const slug = it.slug || `${it.brand}-${it.title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      
      let finalImg = it.imageUrl || it.localImage || "";
      const publicProductsDir = path.join(process.cwd(), "public", "products");
      const targetPng = path.join(publicProductsDir, `${slug}.png`);

      if (finalImg && !fs.existsSync(targetPng)) {
        const cleanRel = finalImg.replace(/^\/+/, "");
        const localSource = path.join(process.cwd(), "public", cleanRel);
        if (fs.existsSync(localSource) && fs.statSync(localSource).isFile()) {
          try {
            fs.copyFileSync(localSource, targetPng);
            finalImg = `/products/${slug}.png`;
          } catch (e) {}
        }
      }

      const newProduct = {
        id,
        title: it.title,
        brand: it.brand || "Archive Collection",
        category: it.category || "Outerwear",
        price: it.sourcePrice || it.price || 49.0,
        priceUSD: it.sourcePrice || it.price || 49.0,
        priceCNY: it.priceCNY || Math.round((it.sourcePrice || 49.0) / 0.14815),
        estimatedRetail: it.estimatedRetail || Math.round((it.sourcePrice || 49.0) * 8.5),
        imageUrl: finalImg || `/products/${slug}.png`,
        localImage: finalImg || `/products/${slug}.png`,
        sugargooUrl: it.sugargooUrl || it.affiliateLink || "",
        directStoreLink: it.rawMarketUrl || it.directStoreLink || "",
        slug,
        status: "APPROVED",
        tags: [it.brand, it.category, "archive", "grail", it.sheetTab].filter(Boolean),
        createdAt: new Date().toISOString(),
      };

      catalog.push(newProduct);
      addedSlugs.push(slug);

      // Mark as INGESTED in registry
      const rawUrlLower = (it.rawMarketUrl || it.directStoreLink || "").toLowerCase().trim();
      if (rawUrlLower) {
        registry.processed_links[rawUrlLower] = {
          status: "INGESTED",
          slug,
          timestamp: new Date().toISOString(),
        };
      }
    });

    // Save catalog & registry
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), "utf-8");
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), "utf-8");

    // Remove ingested items from discovered queue
    if (fs.existsSync(DISCOVERED_PATH)) {
      try {
        let queue = JSON.parse(fs.readFileSync(DISCOVERED_PATH, "utf-8"));
        const ingestedIds = new Set(itemsToIngest.map((it) => it.id));
        const ingestedUrls = new Set(itemsToIngest.map((it) => (it.rawMarketUrl || "").toLowerCase()));
        queue = queue.filter((it: any) => !ingestedIds.has(it.id) && !ingestedUrls.has((it.rawMarketUrl || "").toLowerCase()));
        fs.writeFileSync(DISCOVERED_PATH, JSON.stringify(queue, null, 2), "utf-8");
      } catch (e) {}
    }

    // Fast background commit and push to main
    try {
      const commitMsg = `Auto-Deploy: Batch ingested ${itemsToIngest.length} pieces from Google Sheet`;
      const gitCmd = `git add -A && git commit -m "${commitMsg}" && git push origin main`;
      exec(gitCmd, { cwd: process.cwd() }, (err) => {
        if (err) console.warn("[BATCH-SYNC] Git Push Notice:", err.message);
        else console.log(`[BATCH-SYNC] Successfully pushed ${itemsToIngest.length} pieces to live store.`);
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      count: itemsToIngest.length,
      slugs: addedSlugs,
      message: `Successfully ingested ${itemsToIngest.length} pieces to the live catalog! Background sync triggered.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
