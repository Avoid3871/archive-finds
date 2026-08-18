import { NextRequest, NextResponse } from "next/server";

const VIRAL_HOOKS = [
  "Stop gatekeeping. Here are {count} archive grails you actually need in your wardrobe before they sell out completely 💀👇",
  "Why pay $800+ on Grailed when you can source these exact archival pieces directly? Top {count} underground finds this week 🔥👇",
  "The holy grail archive rotation. {count} museum-level pieces you probably didn't know you could still find 🧬👇",
  "{count} timeless archive silhouettes curated for the daily rotation. Clean cuts, vintage washes, zero gatekeeping ⚡👇",
  "Delete your other fashion bookmarks. {count} heavy-hitter archive grails with direct agent links & live pricing 🏷️👇",
  "If you like Rick Owens, Undercover or Balenciaga, you need to see these {count} archival pieces right now 🖤👇",
  "The best archive pieces nobody is talking about right now. Detailed breakdown & transparent pricing below 👇",
  "POV: You finally stopped overpaying on Grailed and found the ultimate archive spreadsheet 📂👇",
];

const VIRAL_CTAS = [
  "🔗 ALL 1-CLICK LINKS TO EVERY PIECE IN BIO (archive-finds.vercel.app)\n📌 SAVE THIS POST so you don't lose the exact batches & IDs!\n💬 Comment \"ARCHIVE\" and we'll DM you the direct links 📩",
  "🔗 TAP LINK IN BIO to browse the full archive spreadsheet: archive-finds.vercel.app\n📌 Save this before the links expire!\n💬 Which piece is your favorite? (1-{count}) 👇",
  "🔗 DIRECT LINK IN BIO: archive-finds.vercel.app\n📦 Supports Sugargoo, Superbuy, Mulebuy, CNfans & more with 1 click!\n↗️ Send this to someone whose wardrobe needs an upgrade.",
  "🔗 Direct 1-click links to all items in bio (archive-finds.vercel.app)\n📌 Save for your next haul.\n💬 Comment \"LINK\" for the direct spreadsheet.",
];

export function generateAllCaptionVariants(title: string, products: any[]): Record<string, string> {
  const brandNames = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));
  const cleanTitle = (title || "ARCHIVE FINDS").replace(/\\n/g, " ").replace(/\n/g, " ").trim();
  const count = products.length || 5;

  const productList = products
    .map((p, idx) => {
      const price = typeof p.price === "number" ? p.price : parseFloat(p.price) || 49;
      return `${String(idx + 1).padStart(2, "0")}. ${p.brand || "ARCHIVE"} - ${p.title || p.name || "Grail"} ($${price.toFixed(2)})`;
    })
    .join("\n");

  const brandHashtags = brandNames
    .map((b) => `#${b.toLowerCase().replace(/[^a-z0-9]/g, "")}`)
    .slice(0, 6)
    .join(" ");

  const baseHashtags = `#archivefashion #japanesestreetwear #grailed #streetwearinspo #outfitinspo #opiumfashion #avantgarde #designerfashion #archivefinds #fashiontiktok ${brandHashtags}`;

  // 1. Anti-Gatekeep & Viral Hook (Highest curiosity & shareability)
  const viralFomo = `🤫 Stop gatekeeping. Here are ${count} archive grails you actually need in your wardrobe before they sell out completely 💀👇

📁 ${cleanTitle}

${productList}

🔗 ALL 1-CLICK LINKS TO EVERY PIECE IN BIO (archive-finds.vercel.app)
📌 SAVE THIS POST so you don't lose the exact batches & IDs!
💬 Comment "ARCHIVE" and we'll DM you the direct links 📩

${baseHashtags}`;

  // 2. Grailed Resale Comparison (Price shock & value angle)
  const grailedComparison = `💸 Why pay $800+ on Grailed when you can source these exact archival pieces directly? 

🔥 TOP ${count} UNDERGROUND FINDS THIS WEEK:

${productList}

Every single piece is verified with direct community links & live pricing on our platform 🏷️
🔗 TAP LINK IN BIO to browse the full archive spreadsheet: archive-finds.vercel.app
📌 Save this before the links expire!
💬 Which piece are you copping? (1-${count}) 👇

${baseHashtags} #budgetfashion #grailedsteals`;

  // 3. Underground Lore & Niche Rotation (Fashion connoisseur angle)
  const undergroundLore = `📂 The holy grail archive rotation. ${count} museum-level pieces you probably didn't know existed 🧬👇

⚡ ${cleanTitle}

${productList}

Zero gatekeeping. Transparent agent links for Sugargoo, Superbuy, Mulebuy, CNfans & CSSBuy.
🔗 DIRECT LINK IN BIO: archive-finds.vercel.app
↗️ Send this to someone whose fashion taste needs an upgrade.

${baseHashtags} #archiverepository #undercover85 #rickowensarchive`;

  // 4. Minimalist / Clean Aesthetic (High aesthetic engagement)
  const minimalClean = `🖤 ${count} timeless archive silhouettes curated for the daily rotation. Clean cuts, heavy washes, zero gatekeeping ⚡

${productList}

🔗 Direct 1-click links to all items in bio (archive-finds.vercel.app)
📌 Save for your next haul.

${baseHashtags}`;

  // 5. Direct Agent Sourcing & Haul Builder (Action-oriented haul buyers)
  const haulSourcing = `🚨 Delete your other fashion bookmarks. ${count} heavy-hitter archive grails with verified links & live pricing 📦👇

🔥 ${cleanTitle}

${productList}

📦 Supports Sugargoo, Superbuy, Mulebuy, CNfans, Kakobuy & Hoobuy with 1 click!
🔗 HEAD TO LINK IN BIO: archive-finds.vercel.app
💬 Comment your favorite piece below (1-${count}) 👇

${baseHashtags} #haulbuilder #chinahaul #fashionfinds`;

  return {
    viral_fomo: viralFomo,
    grailed_comparison: grailedComparison,
    underground_lore: undergroundLore,
    minimal_clean: minimalClean,
    haul_sourcing: haulSourcing,
  };
}

export function generateRandomViralCaption(title: string, products: any[]): string {
  const cleanTitle = (title || "ARCHIVE FINDS").replace(/\\n/g, " ").replace(/\n/g, " ").trim();
  const count = products.length || 5;
  const brandNames = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));

  const productList = products
    .map((p, idx) => {
      const price = typeof p.price === "number" ? p.price : parseFloat(p.price) || 49;
      return `${String(idx + 1).padStart(2, "0")}. ${p.brand || "ARCHIVE"} - ${p.title || p.name || "Grail"} ($${price.toFixed(2)})`;
    })
    .join("\n");

  const brandHashtags = brandNames
    .map((b) => `#${b.toLowerCase().replace(/[^a-z0-9]/g, "")}`)
    .slice(0, 6)
    .join(" ");

  const baseHashtags = `#archivefashion #japanesestreetwear #grailed #streetwearinspo #outfitinspo #opiumfashion #avantgarde #designerfashion #archivefinds #fashiontiktok ${brandHashtags}`;

  const randomHook = VIRAL_HOOKS[Math.floor(Math.random() * VIRAL_HOOKS.length)].replace("{count}", String(count));
  const randomCta = VIRAL_CTAS[Math.floor(Math.random() * VIRAL_CTAS.length)].replace("{count}", String(count));

  return `${randomHook}

📁 ${cleanTitle}

${productList}

${randomCta}

${baseHashtags}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const title = body.title || "ARCHIVE SELECTION";
    const products = body.products || [];
    const style = body.style || "viral_fomo";

    const variants = generateAllCaptionVariants(title, products);
    const randomized = generateRandomViralCaption(title, products);

    return NextResponse.json({
      success: true,
      caption: variants[style] || randomized,
      randomized,
      variants,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
