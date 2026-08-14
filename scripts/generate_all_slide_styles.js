const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const products = require('../src/lib/products/sheetProducts.json');

const PACKS_BASE_DIR = path.join(__dirname, '../public/slides/packs');
const SINGLE_BASE_DIR = path.join(__dirname, '../public/slides/single');

const STYLES = ['viral_minimal', 'editorial_dark', 'minimal_dark'];

for (const s of STYLES) {
  fs.mkdirSync(path.join(PACKS_BASE_DIR, s), { recursive: true });
  fs.mkdirSync(path.join(SINGLE_BASE_DIR, s), { recursive: true });
}

function escapeXml(unsafe) {
  return String(unsafe || '')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const WIDTH = 1080;
const HEIGHT = 1920;

// Resolve clean hero product image
async function loadProductImageBuffer(product, targetWidth = 860, targetHeight = 1000) {
  let rawImagePath = path.join(__dirname, '../public', product.imageUrl);
  if (!fs.existsSync(rawImagePath)) {
    rawImagePath = path.join(__dirname, '../public/products/sheet/garment_r000_c00_001.jpg');
  }

  if (fs.existsSync(rawImagePath)) {
    return await sharp(rawImagePath)
      .resize(targetWidth, targetHeight, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();
  }

  return await sharp({
    create: { width: targetWidth, height: targetHeight, channels: 4, background: { r: 240, g: 240, b: 240, alpha: 1 } }
  }).png().toBuffer();
}

// Split piece title into clean 1-2 lines for TikTok viral headline
function formatViralHeadline(product) {
  const brand = product.brand;
  let name = product.name;

  // Clean brand prefix if already repeated
  if (name.toLowerCase().startsWith(brand.toLowerCase())) {
    name = name.slice(brand.length).trim();
  }

  // Capitalize nicely
  const cleanBrand = brand.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const cleanName = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return {
    line1: cleanBrand,
    line2: cleanName.length > 26 ? cleanName.slice(0, 24) + '...' : cleanName
  };
}

// -------------------------------------------------------------
// 1. VIRAL MINIMAL (IMAGE 2 STYLE - CLEAN WHITE TIKTOK/IG)
// -------------------------------------------------------------
async function createViralMinimalSlide({ packId, slideIndex, totalSlides, product }) {
  const headline = formatViralHeadline(product);
  const escapedLine1 = escapeXml(headline.line1);
  const escapedLine2 = escapeXml(headline.line2);

  const heroBuffer = await loadProductImageBuffer(product, 880, 1050);

  const svg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .sans { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 900; }
      .semi { font-weight: 700; }
      .mono { font-family: 'Courier New', Courier, monospace, sans-serif; }
    </style>

    <!-- Top Centered Bold TikTok-Style Headline (Exactly matching Image 2) -->
    <text x="540" y="380" text-anchor="middle" fill="#000000" font-size="76" class="sans bold" letter-spacing="-1.5">
      <tspan x="540" dy="0">${escapedLine1}</tspan>
      <tspan x="540" dy="84">${escapedLine2}</tspan>
    </text>

    <!-- Subtle Minimalist Indicator Badge -->
    <rect x="420" y="1660" width="240" height="42" fill="#000000" rx="21" />
    <text x="540" y="1687" text-anchor="middle" fill="#ffffff" font-size="16" class="sans bold" letter-spacing="1">
      $${product.price.toFixed(2)} USD
    </text>

    <!-- Bottom Discrete Pagination Dot & Sugargoo indicator -->
    <text x="540" y="1760" text-anchor="middle" fill="#999999" font-size="16" class="mono" letter-spacing="3">
      ARCHIVE FINDS • ${String(slideIndex).padStart(2, '0')}/${String(totalSlides).padStart(2, '0')}
    </text>
  </svg>
  `;

  const fileName = `pack_${packId}_${String(slideIndex).padStart(2, '0')}_${product.slug.replace(/[^\w-]/g, '_')}.jpg`;
  const filePath = path.join(PACKS_BASE_DIR, 'viral_minimal', fileName);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: '#ffffff' }
  })
  .composite([
    { input: heroBuffer, top: 580, left: 100 },
    { input: Buffer.from(svg), top: 0, left: 0 }
  ])
  .jpeg({ quality: 95 })
  .toFile(filePath);

  return `/slides/packs/viral_minimal/${fileName}`;
}

async function createViralMinimalCover({ packId, vol, title, subtitle, count = 5 }) {
  const lines = title.split('\\n').map(l => escapeXml(l.trim()));

  const svg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .sans { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 900; }
      .semi { font-weight: 700; }
      .mono { font-family: 'Courier New', Courier, monospace, sans-serif; }
    </style>

    <!-- Top Vol Badge -->
    <rect x="440" y="380" width="200" height="48" fill="#000000" rx="24" />
    <text x="540" y="411" text-anchor="middle" fill="#ffffff" font-size="18" class="mono bold" letter-spacing="2">${escapeXml(vol)}</text>

    <!-- Huge Viral Bold Headline -->
    <text x="540" y="580" text-anchor="middle" fill="#000000" font-size="78" class="sans bold" letter-spacing="-2">
      ${lines.map((l, i) => `<tspan x="540" dy="${i === 0 ? 0 : 92}">${l}</tspan>`).join('')}
    </text>

    <!-- Clean Description Box -->
    <rect x="160" y="1120" width="760" height="340" fill="#f8f8f8" stroke="#ebebeb" stroke-width="2" rx="16" />
    <text x="540" y="1200" text-anchor="middle" fill="#000000" font-size="28" class="sans bold">CURATED SUGARGOO GRAILS (${count} PIECES)</text>
    <text x="540" y="1260" text-anchor="middle" fill="#666666" font-size="22" class="sans">Direct archive links &amp; transparent pricing</text>
    <text x="540" y="1320" text-anchor="middle" fill="#666666" font-size="22" class="sans">Zero gatekeeping • Updated daily</text>
    <text x="540" y="1400" text-anchor="middle" fill="#000000" font-size="24" class="mono bold">archive-finds.vercel.app</text>

    <!-- Bottom Swipe CTA Button -->
    <rect x="240" y="1600" width="600" height="96" fill="#000000" rx="48" />
    <text x="540" y="1658" text-anchor="middle" fill="#ffffff" font-size="30" class="sans bold" letter-spacing="1">SWIPE TO SEE PIECES ➔</text>
  </svg>
  `;

  const fileName = `pack_${packId}_01_cover.jpg`;
  const filePath = path.join(PACKS_BASE_DIR, 'viral_minimal', fileName);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: '#ffffff' }
  })
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .jpeg({ quality: 95 })
  .toFile(filePath);

  return `/slides/packs/viral_minimal/${fileName}`;
}

async function createViralMinimalOutro({ packId, slideIndex }) {
  const svg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .sans { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 900; }
      .semi { font-weight: 700; }
      .mono { font-family: 'Courier New', Courier, monospace, sans-serif; }
    </style>

    <text x="540" y="380" text-anchor="middle" fill="#000000" font-size="76" class="sans bold" letter-spacing="-2">
      <tspan x="540" dy="0">HOW TO GET</tspan>
      <tspan x="540" dy="88">THESE GRAILS</tspan>
    </text>

    <!-- 3 Simple Steps -->
    <rect x="140" y="560" width="800" height="200" fill="#f8f8f8" stroke="#ebebeb" stroke-width="2" rx="16" />
    <text x="190" y="630" fill="#000000" font-size="32" class="sans bold">1. LINK IN BIO</text>
    <text x="190" y="690" fill="#666666" font-size="24" class="sans">Head to archive-finds.vercel.app</text>

    <rect x="140" y="800" width="800" height="200" fill="#f8f8f8" stroke="#ebebeb" stroke-width="2" rx="16" />
    <text x="190" y="870" fill="#000000" font-size="32" class="sans bold">2. FIND YOUR PIECE</text>
    <text x="190" y="930" fill="#666666" font-size="24" class="sans">Browse all 104+ verified archive items</text>

    <rect x="140" y="1040" width="800" height="200" fill="#f8f8f8" stroke="#ebebeb" stroke-width="2" rx="16" />
    <text x="190" y="1110" fill="#000000" font-size="32" class="sans bold">3. TAP 'VIEW ITEM'</text>
    <text x="190" y="1170" fill="#666666" font-size="24" class="sans">Direct 1-click Sugargoo procurement order</text>

    <!-- Save & Follow Box -->
    <rect x="140" y="1320" width="800" height="340" fill="#000000" rx="16" />
    <text x="540" y="1420" text-anchor="middle" fill="#ffffff" font-size="40" class="sans bold">SAVE THIS POST 📌</text>
    <text x="540" y="1480" text-anchor="middle" fill="#cccccc" font-size="24" class="sans">Never lose access to archive spreadsheet links</text>
    <text x="540" y="1570" text-anchor="middle" fill="#ffffff" font-size="28" class="mono bold" letter-spacing="2">@ARCHIVEFINDS // DAILY DROPS</text>
  </svg>
  `;

  const fileName = `pack_${packId}_${String(slideIndex).padStart(2, '0')}_outro.jpg`;
  const filePath = path.join(PACKS_BASE_DIR, 'viral_minimal', fileName);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: '#ffffff' }
  })
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .jpeg({ quality: 95 })
  .toFile(filePath);

  return `/slides/packs/viral_minimal/${fileName}`;
}


// -------------------------------------------------------------
// 2. EDITORIAL DARK HUD (FIXED PRODUCT IMAGE COMPOSITE)
// -------------------------------------------------------------
async function createEditorialDarkSlide({ packId, slideIndex, totalSlides, product }) {
  const heroBuffer = await loadProductImageBuffer(product, 840, 950);

  const brandName = escapeXml(product.brand.toUpperCase());
  const pieceName = escapeXml(product.name.toUpperCase());
  const category = escapeXml(product.category.toUpperCase());
  const era = escapeXml(product.era.toUpperCase());
  const price = `$${product.price.toFixed(2)} USD`;
  const slideNum = String(slideIndex).padStart(2, '0');
  const totalNum = String(totalSlides).padStart(2, '0');

  // NOTICE: The rectangle has fill="none" so heroBuffer behind it is 100% visible!
  const svg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .mono { font-family: 'Courier New', Courier, monospace, sans-serif; }
      .sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 900; }
      .semi { font-weight: 700; }
    </style>

    <!-- Top Grid Line & Watermark -->
    <line x1="80" y1="120" x2="1000" y2="120" stroke="#262626" stroke-width="2" />
    
    <text x="80" y="160" fill="#888888" font-size="16" class="mono" letter-spacing="4">ARCHIVE FINDS // ${slideNum} OF ${totalNum}</text>
    <text x="1000" y="160" text-anchor="end" fill="#888888" font-size="16" class="mono" letter-spacing="3">SUGARGOO VERIFIED</text>

    <!-- Designer Brand Headline -->
    <text x="80" y="235" fill="#ffffff" font-size="50" class="sans bold" letter-spacing="-1">${brandName}</text>
    <text x="80" y="275" fill="#888888" font-size="20" class="mono" letter-spacing="2">[ ${category} • ${era} ]</text>

    <!-- Ambient Product Showcase Box (fill is NONE so photo shines through!) -->
    <rect x="96" y="320" width="888" height="980" fill="none" stroke="#333333" stroke-width="2" rx="4" />

    <!-- Bottom Editorial Card -->
    <rect x="80" y="1340" width="920" height="450" fill="#141414" stroke="#262626" stroke-width="2" rx="4" />

    <!-- Piece Title -->
    <text x="120" y="1410" fill="#ffffff" font-size="34" class="sans bold" letter-spacing="-0.5">${pieceName.length > 34 ? pieceName.slice(0, 32) + '...' : pieceName}</text>
    <text x="120" y="1450" fill="#888888" font-size="18" class="mono" letter-spacing="1">CURATED ARCHIVE SELECTION</text>

    <line x1="120" y1="1490" x2="960" y2="1490" stroke="#262626" stroke-width="1" />

    <!-- Price Section -->
    <text x="120" y="1545" fill="#888888" font-size="16" class="mono" letter-spacing="2">ESTIMATED PROCURING PRICE</text>
    <text x="120" y="1605" fill="#ffffff" font-size="48" class="mono bold">${price}</text>

    <!-- Sugargoo Partner Badge -->
    <rect x="660" y="1530" width="300" height="64" fill="#ffffff" rx="2" />
    <text x="810" y="1570" text-anchor="middle" fill="#000000" font-size="18" class="mono bold" letter-spacing="2">SUGARGOO LINK</text>

    <!-- CTA & Swipe Indicator -->
    <line x1="120" y1="1660" x2="960" y2="1660" stroke="#262626" stroke-width="1" />
    
    <text x="120" y="1720" fill="#888888" font-size="16" class="mono" letter-spacing="3">LINK IN BIO TO ORDER PIECE</text>
    <text x="960" y="1720" text-anchor="end" fill="#ffffff" font-size="18" class="sans bold" letter-spacing="2">${slideIndex === totalSlides - 1 ? 'LAST ➔' : 'SWIPE ➔'}</text>
  </svg>
  `;

  const fileName = `pack_${packId}_${slideNum}_${product.slug.replace(/[^\w-]/g, '_')}.jpg`;
  const filePath = path.join(PACKS_BASE_DIR, 'editorial_dark', fileName);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: '#0a0a0a' }
  })
  .composite([
    { input: heroBuffer, top: 335, left: 120 },
    { input: Buffer.from(svg), top: 0, left: 0 }
  ])
  .jpeg({ quality: 95 })
  .toFile(filePath);

  return `/slides/packs/editorial_dark/${fileName}`;
}

async function createEditorialDarkCover({ packId, vol, title, subtitle, badgeText, count = 5 }) {
  const escapedTitle = escapeXml(title.toUpperCase());
  const escapedSubtitle = escapeXml(subtitle);
  const escapedBadge = escapeXml(badgeText.toUpperCase());

  const svg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .mono { font-family: 'Courier New', Courier, monospace, sans-serif; }
      .sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 900; }
      .semi { font-weight: 700; }
    </style>

    <line x1="80" y1="120" x2="1000" y2="120" stroke="#262626" stroke-width="2" />
    <line x1="80" y1="1800" x2="1000" y2="1800" stroke="#262626" stroke-width="2" />

    <text x="120" y="170" fill="#888888" font-size="18" class="mono" letter-spacing="4">ARCHIVE FINDS // EDITORIAL</text>
    <text x="960" y="170" text-anchor="end" fill="#888888" font-size="18" class="mono" letter-spacing="3">${vol}</text>

    <rect x="120" y="320" width="340" height="48" fill="#ffffff" rx="2" />
    <text x="290" y="352" text-anchor="middle" fill="#000000" font-size="18" class="mono bold" letter-spacing="3">${escapedBadge}</text>

    <text x="120" y="470" fill="#ffffff" font-size="64" class="sans bold" letter-spacing="-2">
      ${escapedTitle.split('\\n').map((line, i) => `<tspan x="120" dy="${i === 0 ? 0 : 76}">${line}</tspan>`).join('')}
    </text>

    <text x="120" y="860" fill="#888888" font-size="28" class="sans">
      ${escapedSubtitle}
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

  const fileName = `pack_${packId}_01_cover.jpg`;
  const filePath = path.join(PACKS_BASE_DIR, 'editorial_dark', fileName);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: '#0a0a0a' }
  })
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .jpeg({ quality: 95 })
  .toFile(filePath);

  return `/slides/packs/editorial_dark/${fileName}`;
}

async function createEditorialDarkOutro({ packId, slideIndex }) {
  const svg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .mono { font-family: 'Courier New', Courier, monospace, sans-serif; }
      .sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 900; }
      .semi { font-weight: 700; }
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
    <text x="160" y="830" fill="#ffffff" font-size="32" class="sans bold">BROWSE 104+ VERIFIED PIECES</text>
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

  const fileName = `pack_${packId}_${String(slideIndex).padStart(2, '0')}_outro.jpg`;
  const filePath = path.join(PACKS_BASE_DIR, 'editorial_dark', fileName);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: '#0a0a0a' }
  })
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .jpeg({ quality: 95 })
  .toFile(filePath);

  return `/slides/packs/editorial_dark/${fileName}`;
}


// -------------------------------------------------------------
// 3. VIRAL MINIMAL (DARK VARIANT)
// -------------------------------------------------------------
async function createMinimalDarkSlide({ packId, slideIndex, totalSlides, product }) {
  const headline = formatViralHeadline(product);
  const escapedLine1 = escapeXml(headline.line1);
  const escapedLine2 = escapeXml(headline.line2);

  const heroBuffer = await loadProductImageBuffer(product, 880, 1050);

  const svg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .sans { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 900; }
      .mono { font-family: 'Courier New', Courier, monospace, sans-serif; }
    </style>

    <!-- Top Centered Bold White Headline -->
    <text x="540" y="380" text-anchor="middle" fill="#ffffff" font-size="76" class="sans bold" letter-spacing="-1.5">
      <tspan x="540" dy="0">${escapedLine1}</tspan>
      <tspan x="540" dy="84">${escapedLine2}</tspan>
    </text>

    <!-- Subtle Minimalist Indicator Badge -->
    <rect x="420" y="1660" width="240" height="42" fill="#ffffff" rx="21" />
    <text x="540" y="1687" text-anchor="middle" fill="#000000" font-size="16" class="sans bold" letter-spacing="1">
      $${product.price.toFixed(2)} USD
    </text>

    <text x="540" y="1760" text-anchor="middle" fill="#666666" font-size="16" class="mono" letter-spacing="3">
      ARCHIVE FINDS • ${String(slideIndex).padStart(2, '0')}/${String(totalSlides).padStart(2, '0')}
    </text>
  </svg>
  `;

  const fileName = `pack_${packId}_${String(slideIndex).padStart(2, '0')}_${product.slug.replace(/[^\w-]/g, '_')}.jpg`;
  const filePath = path.join(PACKS_BASE_DIR, 'minimal_dark', fileName);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: '#0a0a0a' }
  })
  .composite([
    { input: heroBuffer, top: 580, left: 100 },
    { input: Buffer.from(svg), top: 0, left: 0 }
  ])
  .jpeg({ quality: 95 })
  .toFile(filePath);

  return `/slides/packs/minimal_dark/${fileName}`;
}

async function createMinimalDarkCover({ packId, vol, title, subtitle, count = 5 }) {
  const lines = title.split('\\n').map(l => escapeXml(l.trim()));

  const svg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .sans { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 900; }
      .mono { font-family: 'Courier New', Courier, monospace, sans-serif; }
    </style>

    <rect x="440" y="380" width="200" height="48" fill="#ffffff" rx="24" />
    <text x="540" y="411" text-anchor="middle" fill="#000000" font-size="18" class="mono bold" letter-spacing="2">${escapeXml(vol)}</text>

    <text x="540" y="580" text-anchor="middle" fill="#ffffff" font-size="78" class="sans bold" letter-spacing="-2">
      ${lines.map((l, i) => `<tspan x="540" dy="${i === 0 ? 0 : 92}">${l}</tspan>`).join('')}
    </text>

    <rect x="160" y="1120" width="760" height="340" fill="#141414" stroke="#262626" stroke-width="2" rx="16" />
    <text x="540" y="1200" text-anchor="middle" fill="#ffffff" font-size="28" class="sans bold">CURATED SUGARGOO GRAILS (${count} PIECES)</text>
    <text x="540" y="1260" text-anchor="middle" fill="#888888" font-size="22" class="sans">Direct archive links &amp; transparent pricing</text>
    <text x="540" y="1320" text-anchor="middle" fill="#888888" font-size="22" class="sans">Zero gatekeeping • Updated daily</text>
    <text x="540" y="1400" text-anchor="middle" fill="#ffffff" font-size="24" class="mono bold">archive-finds.vercel.app</text>

    <rect x="240" y="1600" width="600" height="96" fill="#ffffff" rx="48" />
    <text x="540" y="1658" text-anchor="middle" fill="#000000" font-size="30" class="sans bold" letter-spacing="1">SWIPE TO SEE PIECES ➔</text>
  </svg>
  `;

  const fileName = `pack_${packId}_01_cover.jpg`;
  const filePath = path.join(PACKS_BASE_DIR, 'minimal_dark', fileName);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: '#0a0a0a' }
  })
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .jpeg({ quality: 95 })
  .toFile(filePath);

  return `/slides/packs/minimal_dark/${fileName}`;
}

async function createMinimalDarkOutro({ packId, slideIndex }) {
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
    <text x="190" y="930" fill="#888888" font-size="24" class="sans">Browse all 104+ verified archive items</text>

    <rect x="140" y="1040" width="800" height="200" fill="#141414" stroke="#262626" stroke-width="2" rx="16" />
    <text x="190" y="1110" fill="#ffffff" font-size="32" class="sans bold">3. TAP 'VIEW ITEM'</text>
    <text x="190" y="1170" fill="#888888" font-size="24" class="sans">Direct 1-click Sugargoo procurement order</text>

    <rect x="140" y="1320" width="800" height="340" fill="#ffffff" rx="16" />
    <text x="540" y="1420" text-anchor="middle" fill="#000000" font-size="40" class="sans bold">SAVE THIS POST 📌</text>
    <text x="540" y="1480" text-anchor="middle" fill="#333333" font-size="24" class="sans">Never lose access to archive spreadsheet links</text>
    <text x="540" y="1570" text-anchor="middle" fill="#000000" font-size="28" class="mono bold" letter-spacing="2">@ARCHIVEFINDS // DAILY DROPS</text>
  </svg>
  `;

  const fileName = `pack_${packId}_${String(slideIndex).padStart(2, '0')}_outro.jpg`;
  const filePath = path.join(PACKS_BASE_DIR, 'minimal_dark', fileName);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: '#0a0a0a' }
  })
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .jpeg({ quality: 95 })
  .toFile(filePath);

  return `/slides/packs/minimal_dark/${fileName}`;
}


// -------------------------------------------------------------
// MAIN RUNNER
// -------------------------------------------------------------
async function run() {
  console.log('🚀 Generating Multi-Style Carousel Packs (Viral Minimal, Editorial Dark HUD & Minimal Dark)...');

  const packsConfig = [
    {
      id: 'erd-grails',
      vol: 'VOL. 01',
      title: '5 RARE ERD\\nGRAILS YOU\\nNEED TO SEE',
      subtitle: 'Enfants Riches Déprimés archive pieces with direct links.',
      badgeText: 'ERD SPECIAL',
      filter: p => p.brandSlug === 'erd',
      limit: 5,
      hook: 'Top 5 Rare ERD Grails found on Sugargoo 🏷️ Which piece is your favorite? (1-5) 👇',
      hashtags: ['#archivefashion', '#enfantsrichesdeprimes', '#erd', '#grailed', '#sugargoofinds', '#streetweargrails', '#fashiontiktok']
    },
    {
      id: 'rick-owens-under60',
      vol: 'VOL. 02',
      title: 'BEST RICK OWENS\\nFINDS UNDER\\n$60 ON SUGARGOO',
      subtitle: 'Gimp tees, spliced shirts, and hoodies curated from collector feeds.',
      badgeText: 'BUDGET GRAILS',
      filter: p => p.brandSlug === 'rick-owens',
      limit: 5,
      hook: 'Insane Rick Owens Archive Pieces on Sugargoo for under $60 🖤 All links live in bio!',
      hashtags: ['#rickowens', '#rickowensonline', '#archivefashion', '#darkwear', '#sugargoofinds', '#fashiongrails', '#avantgarde']
    },
    {
      id: 'vetements-graphics',
      vol: 'VOL. 03',
      title: 'TOP 5 RARE\\nVETEMENTS\\nHOODIES & TEES',
      subtitle: 'Heavy Metal Skull, Rammstein & World Tour archive silhouettes.',
      badgeText: 'VETEMENTS GRAILS',
      filter: p => p.brandSlug === 'vetements',
      limit: 5,
      hook: '5 Holy Grail Vetements pieces sourced directly from archive spreadsheets 🏴‍☠️',
      hashtags: ['#vetements', '#demnagvasalia', '#archivefashion', '#streetwearinspo', '#sugargoofinds', '#hoodiefinds']
    },
    {
      id: 'raf-simons-classics',
      vol: 'VOL. 04',
      title: 'SEMINAL RAF SIMONS\\nRUNWAY GRAILS\\nDISCOVERED',
      subtitle: 'Riot Riot Riot!, Reanimator & destroyed denim classics.',
      badgeText: 'BELGIAN ARCHIVE',
      filter: p => p.brandSlug === 'raf-simons',
      limit: 5,
      hook: 'Historic Raf Simons runway pieces you can still procure via Sugargoo 🇧🇪 Belgian fashion history.',
      hashtags: ['#rafsimons', '#rafsimonsarchive', '#riotriotriot', '#antwerpsix', '#archivefashion', '#grailedfinds']
    },
    {
      id: 'avant-garde-denim',
      vol: 'VOL. 05',
      title: '5 CRAZY DESIGNER\\nDENIM & PANTS\\nFOR YOUR ROTATION',
      subtitle: 'Maison Margiela flared, No/Faith Studios wave, & Lemaire twisted jeans.',
      badgeText: 'DENIM GRAILS',
      filter: p => p.categorySlug === 'denim',
      limit: 5,
      hook: 'The best flared & baggy designer pants in 2026 👖 Upgrade your rotation with these finds!',
      hashtags: ['#baggyjeans', '#flaredjeans', '#maisonmargiela', '#nofaithstudios', '#lemaire', '#archivefashion', '#denimhead']
    },
    {
      id: 'japanese-belgian',
      vol: 'VOL. 06',
      title: 'JAPANESE & BELGIAN\\nAVANT-GARDE\\nARCHIVE SPECIAL',
      subtitle: 'Yohji Yamamoto, Carol Christian Poell & Boris Bidjan Saberi curation.',
      badgeText: 'AVANT-GARDE',
      filter: p => ['yohji-yamamoto', 'carol-christian-poell', 'boris-bidjan-saberi'].includes(p.brandSlug),
      limit: 5,
      hook: 'Rare Avant-Garde pieces (CCP, Yohji, BBS) sourced without gatekeeping 👁️',
      hashtags: ['#carolchristianpoell', '#yohjiyamamoto', '#borisbidjansaberi', '#artisanalfashion', '#darkfashion', '#archive']
    }
  ];

  const generatedPacks = [];

  for (const cfg of packsConfig) {
    console.log(`\n📦 Generating Multi-Style Pack: ${cfg.title.replace('\\n', ' ')} (${cfg.vol})...`);
    const matchedProducts = products.filter(cfg.filter).slice(0, cfg.limit);
    const totalSlides = matchedProducts.length + 2;

    const packStyles = {
      viral_minimal: [],
      editorial_dark: [],
      minimal_dark: []
    };

    // 1. Cover Slides
    const coverMinimal = await createViralMinimalCover({ packId: cfg.id, vol: cfg.vol, title: cfg.title, subtitle: cfg.subtitle, count: matchedProducts.length });
    const coverEditorial = await createEditorialDarkCover({ packId: cfg.id, vol: cfg.vol, title: cfg.title, subtitle: cfg.subtitle, badgeText: cfg.badgeText, count: matchedProducts.length });
    const coverDarkMin = await createMinimalDarkCover({ packId: cfg.id, vol: cfg.vol, title: cfg.title, subtitle: cfg.subtitle, count: matchedProducts.length });

    packStyles.viral_minimal.push({ type: 'cover', slideNumber: 1, title: cfg.title.replace(/\\n/g, ' '), subtitle: cfg.subtitle, slideUrl: coverMinimal });
    packStyles.editorial_dark.push({ type: 'cover', slideNumber: 1, title: cfg.title.replace(/\\n/g, ' '), subtitle: cfg.subtitle, slideUrl: coverEditorial });
    packStyles.minimal_dark.push({ type: 'cover', slideNumber: 1, title: cfg.title.replace(/\\n/g, ' '), subtitle: cfg.subtitle, slideUrl: coverDarkMin });

    // 2. Product Slides
    for (let i = 0; i < matchedProducts.length; i++) {
      const p = matchedProducts[i];
      const slideIndex = i + 2;

      const pSlideMin = await createViralMinimalSlide({ packId: cfg.id, slideIndex, totalSlides, product: p });
      const pSlideEdit = await createEditorialDarkSlide({ packId: cfg.id, slideIndex, totalSlides, product: p });
      const pSlideDarkMin = await createMinimalDarkSlide({ packId: cfg.id, slideIndex, totalSlides, product: p });

      packStyles.viral_minimal.push({ type: 'product', slideNumber: slideIndex, title: p.name, subtitle: `${p.brand} • $${p.price.toFixed(2)} USD`, slideUrl: pSlideMin, product: p });
      packStyles.editorial_dark.push({ type: 'product', slideNumber: slideIndex, title: p.name, subtitle: `${p.brand} • $${p.price.toFixed(2)} USD`, slideUrl: pSlideEdit, product: p });
      packStyles.minimal_dark.push({ type: 'product', slideNumber: slideIndex, title: p.name, subtitle: `${p.brand} • $${p.price.toFixed(2)} USD`, slideUrl: pSlideDarkMin, product: p });
    }

    // 3. Outro Slides
    const outroMin = await createViralMinimalOutro({ packId: cfg.id, slideIndex: totalSlides });
    const outroEdit = await createEditorialDarkOutro({ packId: cfg.id, slideIndex: totalSlides });
    const outroDarkMin = await createMinimalDarkOutro({ packId: cfg.id, slideIndex: totalSlides });

    packStyles.viral_minimal.push({ type: 'outro', slideNumber: totalSlides, title: 'How to Order & Save', subtitle: 'archive-finds.vercel.app', slideUrl: outroMin });
    packStyles.editorial_dark.push({ type: 'outro', slideNumber: totalSlides, title: 'How to Order & Save', subtitle: 'archive-finds.vercel.app', slideUrl: outroEdit });
    packStyles.minimal_dark.push({ type: 'outro', slideNumber: totalSlides, title: 'How to Order & Save', subtitle: 'archive-finds.vercel.app', slideUrl: outroDarkMin });

    generatedPacks.push({
      id: cfg.id,
      vol: cfg.vol,
      title: cfg.title.replace(/\\n/g, ' '),
      badgeText: cfg.badgeText,
      slideCount: totalSlides,
      hook: cfg.hook,
      caption: `${cfg.hook}\n\nAll pieces are verified with direct Sugargoo order links on our website 🔗\n🌐 Link in Bio: archive-finds.vercel.app\n\n${cfg.hashtags.join(' ')}`,
      hashtags: cfg.hashtags,
      styles: packStyles,
      slides: packStyles.viral_minimal, // Default
      products: matchedProducts
    });
  }

  const outJsonPath = path.join(__dirname, '../src/lib/products/carouselPacks.json');
  fs.writeFileSync(outJsonPath, JSON.stringify(generatedPacks, null, 2));

  // Also generate single slides across styles
  const singleSlides = [];
  const selectedProducts = products.slice(0, 20);

  for (let i = 0; i < selectedProducts.length; i++) {
    const p = selectedProducts[i];
    const slideIndex = i + 1;

    const minUrl = await createViralMinimalSlide({ packId: 'single', slideIndex, totalSlides: selectedProducts.length, product: p });
    const editUrl = await createEditorialDarkSlide({ packId: 'single', slideIndex, totalSlides: selectedProducts.length, product: p });
    const darkMinUrl = await createMinimalDarkSlide({ packId: 'single', slideIndex, totalSlides: selectedProducts.length, product: p });

    singleSlides.push({
      product: p,
      slideUrl: minUrl,
      styles: {
        viral_minimal: minUrl,
        editorial_dark: editUrl,
        minimal_dark: darkMinUrl
      }
    });
  }

  fs.writeFileSync(
    path.join(__dirname, '../src/lib/products/slidesData.json'),
    JSON.stringify(singleSlides, null, 2)
  );

  console.log(`\n🎉 COMPLETED ALL MULTI-STYLE PACKS & SINGLE SLIDES!`);
  console.log(`Styles generated: viral_minimal (Image 2 style), editorial_dark (fixed HUD), minimal_dark.`);
}

run().catch(console.error);
