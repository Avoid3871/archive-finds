import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import sharp from "sharp";

const PRODUCTS_PATH = path.join(process.cwd(), "src", "lib", "products", "sheetProducts.json");
const HISTORY_PATH = path.join(process.cwd(), "scratch", "slides_generation_history.json");
const OUTPUT_BASE_DIR = path.join(process.cwd(), "public", "slides", "generated");

const WIDTH = 1080;
const HEIGHT = 1920;

function escapeXml(unsafe: string): string {
  return String(unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function loadProductImageBuffer(product: any, targetWidth = 860, targetHeight = 1000): Promise<Buffer> {
  const possiblePaths = [
    product.localImage ? path.join(process.cwd(), "public", product.localImage.replace(/^\/+/, "")) : "",
    product.imageUrl ? path.join(process.cwd(), "public", product.imageUrl.replace(/^\/+/, "")) : "",
    path.join(process.cwd(), "public", "products", `${product.slug}.png`),
    path.join(process.cwd(), "public", "products", "sheet_previews", `${product.slug}.jpg`),
    path.join(process.cwd(), "public", "products", "sheet", "garment_r000_c00_001.jpg"),
  ].filter(Boolean);

  let validPath = "";
  for (const p of possiblePaths) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      validPath = p;
      break;
    }
  }

  if (validPath) {
    try {
      return await sharp(validPath)
        .resize(targetWidth, targetHeight, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer();
    } catch (e) {
      console.warn("Sharp error loading product image:", validPath, e);
    }
  }

  // Fallback transparent buffer
  return await sharp({
    create: { width: targetWidth, height: targetHeight, channels: 4, background: { r: 24, g: 24, b: 24, alpha: 1 } },
  })
    .png()
    .toBuffer();
}

function wrapWords(text: string, maxLen = 16): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const w of words) {
    if (!current) {
      current = w;
    } else if ((current + " " + w).length <= maxLen) {
      current += " " + w;
    } else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function formatCoverHeadline(rawTitle: string) {
  if (!rawTitle) {
    return {
      lines: ["ARCHIVE FINDS", "CURATED GRAILS"],
      fontSize: 68,
      lineHeight: 82,
      startY: 540,
    };
  }

  // 1. Unescape and normalize literal \n or \\n or real newlines
  const unescaped = rawTitle
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/[\n\r]+/g, "\n")
    .trim();

  const rawLines = unescaped.split("\n").map((l) => l.trim()).filter(Boolean);
  let finalLines: string[] = [];

  if (rawLines.length > 1) {
    // User explicitly split lines
    for (const line of rawLines) {
      if (line.length > 18) {
        finalLines.push(...wrapWords(line, 16));
      } else {
        finalLines.push(line);
      }
    }
  } else if (rawLines.length === 1) {
    // Single line - wrap if long
    const single = rawLines[0];
    if (single.length > 16) {
      finalLines = wrapWords(single, 15);
    } else {
      finalLines = [single];
    }
  } else {
    finalLines = ["ARCHIVE FINDS", "CURATED GRAILS"];
  }

  // Limit max lines to 4 to prevent vertical overflow
  if (finalLines.length > 4) {
    finalLines = finalLines.slice(0, 4);
  }

  const maxLineLen = Math.max(...finalLines.map((l) => l.length), 0);
  let fontSize = 72;
  let lineHeight = 86;
  let startY = 560;

  if (finalLines.length >= 4 || maxLineLen > 22) {
    fontSize = 44;
    lineHeight = 56;
    startY = 490;
  } else if (finalLines.length === 3 || maxLineLen > 16) {
    fontSize = 54;
    lineHeight = 68;
    startY = 510;
  } else if (finalLines.length === 2) {
    if (maxLineLen > 14) {
      fontSize = 60;
      lineHeight = 74;
      startY = 535;
    } else {
      fontSize = 70;
      lineHeight = 84;
      startY = 545;
    }
  } else {
    fontSize = 76;
    lineHeight = 90;
    startY = 580;
  }

  return {
    lines: finalLines.map((l) => escapeXml(l.toUpperCase())),
    fontSize,
    lineHeight,
    startY,
  };
}

function formatViralHeadline(product: any) {
  const brand = product.brand || "Archive Selection";
  let name = product.title || product.name || "Grail Piece";

  if (name.toLowerCase().startsWith(brand.toLowerCase())) {
    name = name.slice(brand.length).trim().replace(/^[-–—:]\s*/, "");
  }

  const cleanBrand = brand
    .split(" ")
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  const cleanName = name
    .split(" ")
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const maxLen = Math.max(cleanBrand.length, cleanName.length);
  let fontSize = 70;
  let lineHeight = 82;
  let startY = 380;

  if (maxLen > 24) {
    fontSize = 48;
    lineHeight = 58;
    startY = 355;
  } else if (maxLen > 18) {
    fontSize = 58;
    lineHeight = 70;
    startY = 368;
  }

  return {
    line1: cleanBrand,
    line2: cleanName.length > 28 ? cleanName.slice(0, 26) + "..." : cleanName,
    fontSize,
    lineHeight,
    startY,
  };
}

// -------------------------------------------------------------
// RENDERERS FOR ALL 3 STYLES
// -------------------------------------------------------------

// 1. VIRAL MINIMAL (Clean White)
async function renderViralMinimalCover(packDir: string, packId: string, title: string, count: number): Promise<string> {
  const headline = formatCoverHeadline(title);

  const svg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .sans { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 900; }
      .mono { font-family: 'Courier New', Courier, monospace, sans-serif; }
    </style>

    <rect x="420" y="360" width="240" height="48" fill="#000000" rx="24" />
    <text x="540" y="391" text-anchor="middle" fill="#ffffff" font-size="18" class="mono bold" letter-spacing="3">ARCHIVE FINDS</text>

    <text x="540" y="${headline.startY}" text-anchor="middle" fill="#000000" font-size="${headline.fontSize}" class="sans bold" letter-spacing="-1.5">
      ${headline.lines.map((l, i) => `<tspan x="540" dy="${i === 0 ? 0 : headline.lineHeight}">${l}</tspan>`).join("")}
    </text>

    <rect x="140" y="1120" width="800" height="340" fill="#f8f8f8" stroke="#ebebeb" stroke-width="2" rx="20" />
    <text x="540" y="1200" text-anchor="middle" fill="#000000" font-size="28" class="sans bold">CURATED SUGARGOO GRAILS (${count} PIECES)</text>
    <text x="540" y="1260" text-anchor="middle" fill="#666666" font-size="22" class="sans">Direct archive links &amp; transparent pricing</text>
    <text x="540" y="1320" text-anchor="middle" fill="#666666" font-size="22" class="sans">Zero gatekeeping • Updated daily</text>
    <text x="540" y="1400" text-anchor="middle" fill="#000000" font-size="24" class="mono bold">archive-finds.vercel.app</text>

    <rect x="240" y="1600" width="600" height="96" fill="#000000" rx="48" />
    <text x="540" y="1658" text-anchor="middle" fill="#ffffff" font-size="30" class="sans bold" letter-spacing="1">SWIPE TO SEE PIECES ➔</text>
  </svg>
  `;

  const fileName = `01_cover_viral_minimal.jpg`;
  const filePath = path.join(packDir, fileName);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: "#ffffff" },
  })
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 95 })
    .toFile(filePath);

  return `/slides/generated/${packId}/${fileName}`;
}

async function renderViralMinimalSlide(packDir: string, packId: string, slideIndex: number, totalSlides: number, product: any): Promise<string> {
  const headline = formatViralHeadline(product);
  const heroBuffer = await loadProductImageBuffer(product, 880, 1050);
  const priceVal = typeof product.price === "number" ? product.price : parseFloat(product.price) || 49;

  const svg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .sans { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 900; }
      .mono { font-family: 'Courier New', Courier, monospace, sans-serif; }
    </style>

    <text x="540" y="${headline.startY}" text-anchor="middle" fill="#000000" font-size="${headline.fontSize}" class="sans bold" letter-spacing="-1.5">
      <tspan x="540" dy="0">${escapeXml(headline.line1)}</tspan>
      <tspan x="540" dy="${headline.lineHeight}">${escapeXml(headline.line2)}</tspan>
    </text>

    <rect x="420" y="1660" width="240" height="42" fill="#000000" rx="21" />
    <text x="540" y="1687" text-anchor="middle" fill="#ffffff" font-size="16" class="sans bold" letter-spacing="1">
      $${priceVal.toFixed(2)} USD
    </text>

    <text x="540" y="1760" text-anchor="middle" fill="#999999" font-size="16" class="mono" letter-spacing="3">
      ARCHIVE FINDS • ${String(slideIndex).padStart(2, "0")}/${String(totalSlides).padStart(2, "0")}
    </text>
  </svg>
  `;

  const fileName = `${String(slideIndex).padStart(2, "0")}_${product.slug}_viral_minimal.jpg`;
  const filePath = path.join(packDir, fileName);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: "#ffffff" },
  })
    .composite([
      { input: heroBuffer, top: 580, left: 100 },
      { input: Buffer.from(svg), top: 0, left: 0 },
    ])
    .jpeg({ quality: 95 })
    .toFile(filePath);

  return `/slides/generated/${packId}/${fileName}`;
}

async function renderViralMinimalOutro(packDir: string, packId: string, slideIndex: number): Promise<string> {
  const svg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .sans { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 900; }
      .mono { font-family: 'Courier New', Courier, monospace, sans-serif; }
    </style>

    <text x="540" y="380" text-anchor="middle" fill="#000000" font-size="76" class="sans bold" letter-spacing="-2">
      <tspan x="540" dy="0">HOW TO GET</tspan>
      <tspan x="540" dy="88">THESE GRAILS</tspan>
    </text>

    <rect x="140" y="560" width="800" height="200" fill="#f8f8f8" stroke="#ebebeb" stroke-width="2" rx="16" />
    <text x="190" y="630" fill="#000000" font-size="32" class="sans bold">1. LINK IN BIO</text>
    <text x="190" y="690" fill="#666666" font-size="24" class="sans">Head to archive-finds.vercel.app</text>

    <rect x="140" y="800" width="800" height="200" fill="#f8f8f8" stroke="#ebebeb" stroke-width="2" rx="16" />
    <text x="190" y="870" fill="#000000" font-size="32" class="sans bold">2. FIND YOUR PIECE</text>
    <text x="190" y="930" fill="#666666" font-size="24" class="sans">Search any brand, category, or budget</text>

    <rect x="140" y="1040" width="800" height="200" fill="#f8f8f8" stroke="#ebebeb" stroke-width="2" rx="16" />
    <text x="190" y="1110" fill="#000000" font-size="32" class="sans bold">3. TAP 'VIEW ITEM'</text>
    <text x="190" y="1170" fill="#666666" font-size="24" class="sans">Direct Sugargoo 1-click procurement order</text>

    <rect x="140" y="1320" width="800" height="340" fill="#000000" rx="16" />
    <text x="540" y="1420" text-anchor="middle" fill="#ffffff" font-size="40" class="sans bold">SAVE THIS POST 📌</text>
    <text x="540" y="1480" text-anchor="middle" fill="#cccccc" font-size="24" class="sans">Never lose access to archive spreadsheet links</text>
    <text x="540" y="1570" text-anchor="middle" fill="#ffffff" font-size="28" class="mono bold" letter-spacing="2">@ARCHIVEFINDS // DAILY DROPS</text>
  </svg>
  `;

  const fileName = `${String(slideIndex).padStart(2, "0")}_outro_viral_minimal.jpg`;
  const filePath = path.join(packDir, fileName);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: "#ffffff" },
  })
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 95 })
    .toFile(filePath);

  return `/slides/generated/${packId}/${fileName}`;
}

// 2. EDITORIAL DARK HUD
async function renderEditorialDarkCover(packDir: string, packId: string, title: string, subtitle: string, count: number): Promise<string> {
  const headline = formatCoverHeadline(title);
  const edFontSize = Math.min(headline.fontSize, 56);
  const edLineHeight = Math.min(headline.lineHeight, 68);
  const edStartY = Math.min(headline.startY - 70, 480);

  const svg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .mono { font-family: 'Courier New', Courier, monospace, sans-serif; }
      .sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 900; }
    </style>

    <line x1="80" y1="120" x2="1000" y2="120" stroke="#262626" stroke-width="2" />
    <line x1="80" y1="1800" x2="1000" y2="1800" stroke="#262626" stroke-width="2" />

    <text x="120" y="170" fill="#888888" font-size="18" class="mono" letter-spacing="4">ARCHIVE FINDS // EDITORIAL</text>
    <text x="960" y="170" text-anchor="end" fill="#888888" font-size="18" class="mono" letter-spacing="3">SUGARGOO VERIFIED</text>

    <rect x="120" y="300" width="340" height="48" fill="#ffffff" rx="2" />
    <text x="290" y="332" text-anchor="middle" fill="#000000" font-size="18" class="mono bold" letter-spacing="3">CURATED GRAILS</text>

    <text x="120" y="${edStartY}" fill="#ffffff" font-size="${edFontSize}" class="sans bold" letter-spacing="-1.5">
      ${headline.lines.map((l, i) => `<tspan x="120" dy="${i === 0 ? 0 : edLineHeight}">${l}</tspan>`).join("")}
    </text>

    <text x="120" y="860" fill="#888888" font-size="26" class="sans">
      ${escapeXml(subtitle || "Handpicked high-fashion community spreadsheet finds with live stock verification.")}
    </text>

    <rect x="120" y="960" width="840" height="540" fill="#111111" stroke="#262626" stroke-width="2" rx="6" />
    <text x="160" y="1040" fill="#ffffff" font-size="24" class="mono bold" letter-spacing="2">CURATED SELECTION (${count} PIECES)</text>
    <line x1="160" y1="1070" x2="920" y2="1070" stroke="#262626" stroke-width="1" />

    <text x="160" y="1130" fill="#888888" font-size="20" class="mono" letter-spacing="1">✓ VERIFIED DIRECT SOURCE LINKS</text>
    <text x="160" y="1180" fill="#888888" font-size="20" class="mono" letter-spacing="1">✓ ACCURATE SOURCING ESTIMATES</text>
    <text x="160" y="1230" fill="#888888" font-size="20" class="mono" letter-spacing="1">✓ ONE-CLICK SUGARGOO PROCUREMENT</text>
    <text x="160" y="1280" fill="#888888" font-size="20" class="mono" letter-spacing="1">✓ NO GATEKEEPING // SOURCED DAILY</text>

    <line x1="160" y1="1340" x2="920" y2="1340" stroke="#262626" stroke-width="1" />
    <text x="160" y="1420" fill="#ffffff" font-size="32" class="mono bold" letter-spacing="1">ARCHIVE-FINDS.VERCEL.APP</text>

    <rect x="120" y="1600" width="840" height="120" fill="#161616" stroke="#262626" stroke-width="1" rx="4" />
    <text x="160" y="1670" fill="#ffffff" font-size="26" class="sans bold" letter-spacing="1">SWIPE TO EXPLORE GRAILS</text>
    <text x="920" y="1670" text-anchor="end" fill="#ffffff" font-size="32" class="sans bold">➔</text>
  </svg>
  `;

  const fileName = `01_cover_editorial_dark.jpg`;
  const filePath = path.join(packDir, fileName);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: "#0a0a0a" },
  })
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 95 })
    .toFile(filePath);

  return `/slides/generated/${packId}/${fileName}`;
}

async function renderEditorialDarkSlide(packDir: string, packId: string, slideIndex: number, totalSlides: number, product: any): Promise<string> {
  const heroBuffer = await loadProductImageBuffer(product, 840, 950);
  const brandName = escapeXml((product.brand || "ARCHIVE").toUpperCase());
  const pieceName = escapeXml((product.title || product.name || "PIECE").toUpperCase());
  const category = escapeXml((product.category || "OUTERWEAR").toUpperCase());
  const priceVal = typeof product.price === "number" ? product.price : parseFloat(product.price) || 49;
  const price = `$${priceVal.toFixed(2)} USD`;
  const slideNum = String(slideIndex).padStart(2, "0");
  const totalNum = String(totalSlides).padStart(2, "0");

  const svg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .mono { font-family: 'Courier New', Courier, monospace, sans-serif; }
      .sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 900; }
    </style>

    <line x1="80" y1="120" x2="1000" y2="120" stroke="#262626" stroke-width="2" />
    <text x="80" y="160" fill="#888888" font-size="16" class="mono" letter-spacing="4">ARCHIVE FINDS // ${slideNum} OF ${totalNum}</text>
    <text x="1000" y="160" text-anchor="end" fill="#888888" font-size="16" class="mono" letter-spacing="3">SUGARGOO VERIFIED</text>

    <text x="80" y="235" fill="#ffffff" font-size="50" class="sans bold" letter-spacing="-1">${brandName}</text>
    <text x="80" y="275" fill="#888888" font-size="20" class="mono" letter-spacing="2">[ ${category} ]</text>

    <rect x="96" y="320" width="888" height="980" fill="none" stroke="#333333" stroke-width="2" rx="4" />

    <rect x="80" y="1340" width="920" height="450" fill="#141414" stroke="#262626" stroke-width="2" rx="4" />
    <text x="120" y="1410" fill="#ffffff" font-size="34" class="sans bold" letter-spacing="-0.5">${pieceName.length > 34 ? pieceName.slice(0, 32) + "..." : pieceName}</text>
    <text x="120" y="1450" fill="#888888" font-size="18" class="mono" letter-spacing="1">CURATED ARCHIVE SELECTION</text>

    <line x1="120" y1="1490" x2="960" y2="1490" stroke="#262626" stroke-width="1" />
    <text x="120" y="1545" fill="#888888" font-size="16" class="mono" letter-spacing="2">ESTIMATED PROCURING PRICE</text>
    <text x="120" y="1605" fill="#ffffff" font-size="48" class="mono bold">${price}</text>

    <rect x="660" y="1530" width="300" height="64" fill="#ffffff" rx="2" />
    <text x="810" y="1570" text-anchor="middle" fill="#000000" font-size="18" class="mono bold" letter-spacing="2">SUGARGOO LINK</text>

    <line x1="120" y1="1660" x2="960" y2="1660" stroke="#262626" stroke-width="1" />
    <text x="120" y="1720" fill="#888888" font-size="16" class="mono" letter-spacing="3">LINK IN BIO TO ORDER PIECE</text>
    <text x="960" y="1720" text-anchor="end" fill="#ffffff" font-size="18" class="sans bold" letter-spacing="2">${slideIndex === totalSlides - 1 ? "LAST ➔" : "SWIPE ➔"}</text>
  </svg>
  `;

  const fileName = `${slideNum}_${product.slug}_editorial_dark.jpg`;
  const filePath = path.join(packDir, fileName);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: "#0a0a0a" },
  })
    .composite([
      { input: heroBuffer, top: 335, left: 120 },
      { input: Buffer.from(svg), top: 0, left: 0 },
    ])
    .jpeg({ quality: 95 })
    .toFile(filePath);

  return `/slides/generated/${packId}/${fileName}`;
}

async function renderEditorialDarkOutro(packDir: string, packId: string, slideIndex: number): Promise<string> {
  const svg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .mono { font-family: 'Courier New', Courier, monospace, sans-serif; }
      .sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 900; }
    </style>

    <line x1="80" y1="120" x2="1000" y2="120" stroke="#262626" stroke-width="2" />
    <line x1="80" y1="1800" x2="1000" y2="1800" stroke="#262626" stroke-width="2" />

    <text x="120" y="170" fill="#888888" font-size="18" class="mono" letter-spacing="4">ARCHIVE FINDS // HOW TO SOURCING</text>
    <text x="960" y="170" text-anchor="end" fill="#888888" font-size="18" class="mono" letter-spacing="3">FINAL STEP</text>

    <text x="120" y="300" fill="#ffffff" font-size="56" class="sans bold" letter-spacing="-1">HOW TO ORDER</text>
    <text x="120" y="360" fill="#ffffff" font-size="56" class="sans bold" letter-spacing="-1">THESE GRAILS:</text>

    <rect x="120" y="440" width="840" height="240" fill="#141414" stroke="#262626" stroke-width="2" rx="4" />
    <text x="160" y="500" fill="#888888" font-size="18" class="mono" letter-spacing="2">STEP 01</text>
    <text x="160" y="550" fill="#ffffff" font-size="32" class="sans bold">CLICK LINK IN BIO</text>
    <text x="160" y="600" fill="#888888" font-size="20" class="sans">Head to archive-finds.vercel.app directly from our profile.</text>

    <rect x="120" y="720" width="840" height="240" fill="#141414" stroke="#262626" stroke-width="2" rx="4" />
    <text x="160" y="780" fill="#888888" font-size="18" class="mono" letter-spacing="2">STEP 02</text>
    <text x="160" y="830" fill="#ffffff" font-size="32" class="sans bold">BROWSE 116+ VERIFIED PIECES</text>
    <text x="160" y="880" fill="#888888" font-size="20" class="sans">Search by designer, piece name, category, or price range.</text>

    <rect x="120" y="1000" width="840" height="240" fill="#141414" stroke="#262626" stroke-width="2" rx="4" />
    <text x="160" y="1060" fill="#888888" font-size="18" class="mono" letter-spacing="2">STEP 03</text>
    <text x="160" y="1110" fill="#ffffff" font-size="32" class="sans bold">TAP 'VIEW ITEM' FOR SUGARGOO</text>
    <text x="160" y="1160" fill="#888888" font-size="20" class="sans">Instant direct routing to buy with automated agent shipping.</text>

    <rect x="120" y="1320" width="840" height="380" fill="#ffffff" rx="6" />
    <text x="540" y="1420" text-anchor="middle" fill="#000000" font-size="38" class="sans bold" letter-spacing="-1">SAVE THIS POST 📌</text>
    <text x="540" y="1480" text-anchor="middle" fill="#000000" font-size="22" class="sans">Never lose access to rare designer archive spreadsheet finds.</text>
    <line x1="200" y1="1540" x2="880" y2="1540" stroke="#000000" stroke-width="1" stroke-opacity="0.2" />
    <text x="540" y="1620" text-anchor="middle" fill="#000000" font-size="28" class="mono bold" letter-spacing="2">@ARCHIVEFINDS // FOLLOW FOR DAILY DROPS</text>
  </svg>
  `;

  const fileName = `${String(slideIndex).padStart(2, "0")}_outro_editorial_dark.jpg`;
  const filePath = path.join(packDir, fileName);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: "#0a0a0a" },
  })
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 95 })
    .toFile(filePath);

  return `/slides/generated/${packId}/${fileName}`;
}

// 3. MINIMAL DARK
async function renderMinimalDarkCover(packDir: string, packId: string, title: string, count: number): Promise<string> {
  const headline = formatCoverHeadline(title);

  const svg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .sans { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 900; }
      .mono { font-family: 'Courier New', Courier, monospace, sans-serif; }
    </style>

    <rect x="420" y="360" width="240" height="48" fill="#ffffff" rx="24" />
    <text x="540" y="391" text-anchor="middle" fill="#000000" font-size="18" class="mono bold" letter-spacing="3">ARCHIVE FINDS</text>

    <text x="540" y="${headline.startY}" text-anchor="middle" fill="#ffffff" font-size="${headline.fontSize}" class="sans bold" letter-spacing="-1.5">
      ${headline.lines.map((l, i) => `<tspan x="540" dy="${i === 0 ? 0 : headline.lineHeight}">${l}</tspan>`).join("")}
    </text>

    <rect x="140" y="1120" width="800" height="340" fill="#141414" stroke="#262626" stroke-width="2" rx="20" />
    <text x="540" y="1200" text-anchor="middle" fill="#ffffff" font-size="28" class="sans bold">CURATED SUGARGOO GRAILS (${count} PIECES)</text>
    <text x="540" y="1260" text-anchor="middle" fill="#888888" font-size="22" class="sans">Direct archive links &amp; transparent pricing</text>
    <text x="540" y="1320" text-anchor="middle" fill="#888888" font-size="22" class="sans">Zero gatekeeping • Updated daily</text>
    <text x="540" y="1400" text-anchor="middle" fill="#ffffff" font-size="24" class="mono bold">archive-finds.vercel.app</text>

    <rect x="240" y="1600" width="600" height="96" fill="#ffffff" rx="48" />
    <text x="540" y="1658" text-anchor="middle" fill="#000000" font-size="30" class="sans bold" letter-spacing="1">SWIPE TO SEE PIECES ➔</text>
  </svg>
  `;

  const fileName = `01_cover_minimal_dark.jpg`;
  const filePath = path.join(packDir, fileName);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: "#0a0a0a" },
  })
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 95 })
    .toFile(filePath);

  return `/slides/generated/${packId}/${fileName}`;
}

async function renderMinimalDarkSlide(packDir: string, packId: string, slideIndex: number, totalSlides: number, product: any): Promise<string> {
  const headline = formatViralHeadline(product);
  const heroBuffer = await loadProductImageBuffer(product, 880, 1050);
  const priceVal = typeof product.price === "number" ? product.price : parseFloat(product.price) || 49;

  const svg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .sans { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 900; }
      .mono { font-family: 'Courier New', Courier, monospace, sans-serif; }
    </style>

    <text x="540" y="${headline.startY}" text-anchor="middle" fill="#ffffff" font-size="${headline.fontSize}" class="sans bold" letter-spacing="-1.5">
      <tspan x="540" dy="0">${escapeXml(headline.line1)}</tspan>
      <tspan x="540" dy="${headline.lineHeight}">${escapeXml(headline.line2)}</tspan>
    </text>

    <rect x="420" y="1660" width="240" height="42" fill="#ffffff" rx="21" />
    <text x="540" y="1687" text-anchor="middle" fill="#000000" font-size="16" class="sans bold" letter-spacing="1">
      $${priceVal.toFixed(2)} USD
    </text>

    <text x="540" y="1760" text-anchor="middle" fill="#666666" font-size="16" class="mono" letter-spacing="3">
      ARCHIVE FINDS • ${String(slideIndex).padStart(2, "0")}/${String(totalSlides).padStart(2, "0")}
    </text>
  </svg>
  `;

  const fileName = `${String(slideIndex).padStart(2, "0")}_${product.slug}_minimal_dark.jpg`;
  const filePath = path.join(packDir, fileName);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: "#0a0a0a" },
  })
    .composite([
      { input: heroBuffer, top: 580, left: 100 },
      { input: Buffer.from(svg), top: 0, left: 0 },
    ])
    .jpeg({ quality: 95 })
    .toFile(filePath);

  return `/slides/generated/${packId}/${fileName}`;
}

async function renderMinimalDarkOutro(packDir: string, packId: string, slideIndex: number): Promise<string> {
  const svg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .sans { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 900; }
      .mono { font-family: 'Courier New', Courier, monospace, sans-serif; }
    </style>

    <text x="540" y="380" text-anchor="middle" fill="#ffffff" font-size="76" class="sans bold" letter-spacing="-2">
      <tspan x="540" dy="0">HOW TO GET</tspan>
      <tspan x="540" dy="88">THESE GRAILS</tspan>
    </text>

    <rect x="140" y="560" width="800" height="200" fill="#141414" stroke="#262626" stroke-width="2" rx="16" />
    <text x="190" y="630" fill="#ffffff" font-size="32" class="sans bold">1. LINK IN BIO</text>
    <text x="190" y="690" fill="#888888" font-size="24" class="sans">Head to archive-finds.vercel.app</text>

    <rect x="140" y="800" width="800" height="200" fill="#141414" stroke="#262626" stroke-width="2" rx="16" />
    <text x="190" y="870" fill="#ffffff" font-size="32" class="sans bold">2. FIND YOUR PIECE</text>
    <text x="190" y="930" fill="#888888" font-size="24" class="sans">Search any brand, category, or budget</text>

    <rect x="140" y="1040" width="800" height="200" fill="#141414" stroke="#262626" stroke-width="2" rx="16" />
    <text x="190" y="1110" fill="#ffffff" font-size="32" class="sans bold">3. TAP 'VIEW ITEM'</text>
    <text x="190" y="1170" fill="#888888" font-size="24" class="sans">Direct Sugargoo 1-click procurement order</text>

    <rect x="140" y="1320" width="800" height="340" fill="#ffffff" rx="16" />
    <text x="540" y="1420" text-anchor="middle" fill="#000000" font-size="40" class="sans bold">SAVE THIS POST 📌</text>
    <text x="540" y="1480" text-anchor="middle" fill="#000000" font-size="24" class="sans">Never lose access to archive spreadsheet links</text>
    <text x="540" y="1570" text-anchor="middle" fill="#000000" font-size="28" class="mono bold" letter-spacing="2">@ARCHIVEFINDS // DAILY DROPS</text>
  </svg>
  `;

  const fileName = `${String(slideIndex).padStart(2, "0")}_outro_minimal_dark.jpg`;
  const filePath = path.join(packDir, fileName);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: "#0a0a0a" },
  })
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 95 })
    .toFile(filePath);

  return `/slides/generated/${packId}/${fileName}`;
}

// -------------------------------------------------------------
// VIRAL CAPTION ENGINE
// -------------------------------------------------------------
function generateViralCaption(title: string, products: any[]): string {
  const brandNames = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));
  const cleanTitle = title.replace(/\\n/g, " ").replace(/\n/g, " ");

  const productList = products
    .map((p, idx) => {
      const price = typeof p.price === "number" ? p.price : parseFloat(p.price) || 49;
      return `${idx + 1}. ${p.brand} - ${p.title || p.name} ($${price.toFixed(2)})`;
    })
    .join("\n");

  const brandHashtags = brandNames
    .map((b) => `#${b.toLowerCase().replace(/[^a-z0-9]/g, "")}`)
    .slice(0, 5)
    .join(" ");

  return `🔥 ${cleanTitle}

Curated from our verified community archive database. Direct 1-click Sugargoo links with transparent pricing and live stock tracking:

${productList}

🔗 LINK IN BIO to find and order every single piece (archive-finds.vercel.app)
📌 SAVE THIS POST so you don't lose the spreadsheet links!

#archivefashion #archivefinds #fashionreps #qualityreps #grailed #streetwear ${brandHashtags} #designerfashion #fashiontiktok`;
}

// -------------------------------------------------------------
// API ROUTE HANDLER
// -------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "latest"; // latest | brand | category | random | custom
    const selectedBrand = body.brand || "";
    const selectedCategory = body.category || "";
    const customProductIds = body.productIds || [];
    const productCount = Math.max(1, Math.min(15, parseInt(body.count) || 5)); // number of garment slides
    let customTitle = body.title?.trim() || "";

    // 1. Load products
    if (!fs.existsSync(PRODUCTS_PATH)) {
      return NextResponse.json({ success: false, error: "Product catalog not found." }, { status: 500 });
    }
    const allProducts: any[] = JSON.parse(fs.readFileSync(PRODUCTS_PATH, "utf-8"));

    // 2. Load generation history for anti-repetition / deduplication
    let history: { generatedPacks: any[] } = { generatedPacks: [] };
    if (fs.existsSync(HISTORY_PATH)) {
      try {
        history = JSON.parse(fs.readFileSync(HISTORY_PATH, "utf-8"));
      } catch (e) {}
    }

    const recentlyUsedProductIds = new Set<string>();
    const pastPacks = (history.generatedPacks || []).slice(-10);
    pastPacks.forEach((p: any) => {
      (p.productIds || []).forEach((id: string) => recentlyUsedProductIds.add(id));
    });

    // 3. Filter products by mode
    let candidatePool: any[] = [];
    if (mode === "brand" && selectedBrand) {
      candidatePool = allProducts.filter((p) => p.brand && p.brand.toLowerCase() === selectedBrand.toLowerCase());
      if (!customTitle) customTitle = `TOP ${productCount} ${selectedBrand.toUpperCase()}\nARCHIVE GRAILS`;
    } else if (mode === "category" && selectedCategory) {
      candidatePool = allProducts.filter((p) => p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());
      if (!customTitle) customTitle = `TOP ${productCount} ${selectedCategory.toUpperCase()}\nGRAILS UNDER $100`;
    } else if (mode === "custom" && customProductIds.length > 0) {
      const idSet = new Set(customProductIds.map(String));
      candidatePool = allProducts.filter((p) => idSet.has(String(p.id)) || idSet.has(p.slug));
      if (!customTitle) customTitle = `CURATED GRAILS\nVOLUME ${Date.now() % 1000}`;
    } else if (mode === "latest") {
      candidatePool = [...allProducts].reverse();
      if (!customTitle) customTitle = `NEW ARCHIVE DROPS\nTHIS WEEK (${productCount} GRAILS)`;
    } else {
      // Random mix
      candidatePool = [...allProducts].sort(() => Math.random() - 0.5);
      if (!customTitle) customTitle = `MY TOP ${productCount} ARCHIVE\nFINDS UNDER $100`;
    }

    if (candidatePool.length === 0) {
      candidatePool = allProducts;
    }

    // 4. Prioritize unused products for deduplication
    const freshCandidates = candidatePool.filter((p) => !recentlyUsedProductIds.has(String(p.id)));
    const selectedProducts: any[] = [];

    if (mode === "custom") {
      selectedProducts.push(...candidatePool.slice(0, productCount));
    } else if (mode === "latest") {
      selectedProducts.push(...candidatePool.slice(0, productCount));
    } else {
      // Pick fresh candidates first, fill rest if needed
      const pool = freshCandidates.length >= productCount ? freshCandidates : candidatePool;
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      selectedProducts.push(...shuffled.slice(0, productCount));
    }

    if (selectedProducts.length === 0) {
      return NextResponse.json({ success: false, error: "No matching products found to generate slides." }, { status: 400 });
    }

    // 5. Create generated pack output folder
    const cleanDisplayTitle = customTitle.replace(/\\n/g, " ").replace(/\n/g, " ");
    const packSlug = slugify(cleanDisplayTitle) || "archive-pack";
    const packId = `${packSlug}-${Date.now()}`;
    const packDir = path.join(OUTPUT_BASE_DIR, packId);
    fs.mkdirSync(packDir, { recursive: true });

    const totalSlides = selectedProducts.length + 2; // Cover + Products + Outro

    // 6. Render all 3 styles
    // (a) Viral Minimal
    const viralMinimalSlides: any[] = [];
    const vmCoverUrl = await renderViralMinimalCover(packDir, packId, customTitle, selectedProducts.length);
    viralMinimalSlides.push({ slideUrl: vmCoverUrl, title: cleanDisplayTitle, type: "cover" });

    for (let i = 0; i < selectedProducts.length; i++) {
      const prod = selectedProducts[i];
      const slideUrl = await renderViralMinimalSlide(packDir, packId, i + 2, totalSlides, prod);
      viralMinimalSlides.push({ slideUrl, title: `${prod.brand} - ${prod.title || prod.name}`, type: "product", product: prod });
    }

    const vmOutroUrl = await renderViralMinimalOutro(packDir, packId, totalSlides);
    viralMinimalSlides.push({ slideUrl: vmOutroUrl, title: "How to Order", type: "outro" });

    // (b) Editorial Dark
    const editorialDarkSlides: any[] = [];
    const edCoverUrl = await renderEditorialDarkCover(packDir, packId, customTitle, "Handpicked high-fashion community spreadsheet finds.", selectedProducts.length);
    editorialDarkSlides.push({ slideUrl: edCoverUrl, title: cleanDisplayTitle, type: "cover" });

    for (let i = 0; i < selectedProducts.length; i++) {
      const prod = selectedProducts[i];
      const slideUrl = await renderEditorialDarkSlide(packDir, packId, i + 2, totalSlides, prod);
      editorialDarkSlides.push({ slideUrl, title: `${prod.brand} - ${prod.title || prod.name}`, type: "product", product: prod });
    }

    const edOutroUrl = await renderEditorialDarkOutro(packDir, packId, totalSlides);
    editorialDarkSlides.push({ slideUrl: edOutroUrl, title: "How to Order", type: "outro" });

    // (c) Minimal Dark
    const minimalDarkSlides: any[] = [];
    const mdCoverUrl = await renderMinimalDarkCover(packDir, packId, customTitle, selectedProducts.length);
    minimalDarkSlides.push({ slideUrl: mdCoverUrl, title: cleanDisplayTitle, type: "cover" });

    for (let i = 0; i < selectedProducts.length; i++) {
      const prod = selectedProducts[i];
      const slideUrl = await renderMinimalDarkSlide(packDir, packId, i + 2, totalSlides, prod);
      minimalDarkSlides.push({ slideUrl, title: `${prod.brand} - ${prod.title || prod.name}`, type: "product", product: prod });
    }

    const mdOutroUrl = await renderMinimalDarkOutro(packDir, packId, totalSlides);
    minimalDarkSlides.push({ slideUrl: mdOutroUrl, title: "How to Order", type: "outro" });

    // 7. Generate Viral Caption
    const caption = generateViralCaption(customTitle, selectedProducts);

    // 8. Save to history
    const packData = {
      id: packId,
      title: cleanDisplayTitle,
      rawTitle: customTitle,
      mode,
      slideCount: totalSlides,
      productCount: selectedProducts.length,
      productIds: selectedProducts.map((p) => String(p.id)),
      products: selectedProducts,
      caption,
      createdAt: new Date().toISOString(),
      styles: {
        viral_minimal: viralMinimalSlides,
        editorial_dark: editorialDarkSlides,
        minimal_dark: minimalDarkSlides,
      },
      slides: viralMinimalSlides,
    };

    history.generatedPacks = [packData, ...(history.generatedPacks || [])].slice(0, 50);
    fs.mkdirSync(path.dirname(HISTORY_PATH), { recursive: true });
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      pack: packData,
    });
  } catch (error: any) {
    console.error("Slide generation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    let history: { generatedPacks: any[] } = { generatedPacks: [] };
    if (fs.existsSync(HISTORY_PATH)) {
      try {
        history = JSON.parse(fs.readFileSync(HISTORY_PATH, "utf-8"));
      } catch (e) {}
    }
    return NextResponse.json({ success: true, history: history.generatedPacks || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
