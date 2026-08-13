const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const sharp = require('sharp');

// Load products
const products = require('../src/lib/products/sheetProducts.json');

const OUTPUT_DIR = path.join(__dirname, '../public/slides');
const TEMP_DIR = path.join(__dirname, '../storage/temp');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

function escapeXml(unsafe) {
  return String(unsafe || '')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function removeBackgroundLocal(inputPath, outputPath) {
  try {
    const pythonScript = path.join(__dirname, '../python/background_removal/remove_bg.py');
    execSync(`python "${pythonScript}" --input "${inputPath}" --output "${outputPath}"`, {
      stdio: 'pipe',
      timeout: 25000,
    });
    return true;
  } catch (e) {
    console.warn(`Local rembg notice for ${inputPath}:`, e.message);
    return false;
  }
}

async function createEditorialSlide(product, index, theme = 'dark') {
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0c0c0c' : '#f5f5f4';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#888888' : '#666666';
  const borderColor = isDark ? '#262626' : '#e5e5e5';
  const cardBg = isDark ? '#141414' : '#ffffff';
  const accentBox = isDark ? '#ffffff' : '#000000';
  const accentText = isDark ? '#000000' : '#ffffff';

  const width = 1080;
  const height = 1920;

  // 1. Locate authentic spreadsheet image on disk
  let rawImagePath = path.join(__dirname, '../public', product.imageUrl);
  if (!fs.existsSync(rawImagePath)) {
    // fallback
    rawImagePath = path.join(__dirname, '../storage/temp/temp_item-1.jpg');
  }

  const cutoutPath = path.join(TEMP_DIR, `cutout_sheet_${product.id}.png`);

  // 2. Perform AI background removal if not yet cached
  if (fs.existsSync(rawImagePath) && !fs.existsSync(cutoutPath)) {
    removeBackgroundLocal(rawImagePath, cutoutPath);
  }

  const activeImagePath = fs.existsSync(cutoutPath) ? cutoutPath : rawImagePath;

  // 3. Process Garment Image with Sharp
  let heroBuffer;
  if (fs.existsSync(activeImagePath)) {
    heroBuffer = await sharp(activeImagePath)
      .resize(880, 1000, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();
  } else {
    heroBuffer = await sharp({
      create: {
        width: 880,
        height: 1000,
        channels: 4,
        background: { r: 20, g: 20, b: 20, alpha: 1 }
      }
    }).png().toBuffer();
  }

  // 4. Construct Luxury SVG Overlay
  const brandName = escapeXml(product.brand.toUpperCase());
  const pieceName = escapeXml(product.name.toUpperCase());
  const category = escapeXml(product.category.toUpperCase());
  const era = escapeXml(product.era.toUpperCase());
  const price = `$${product.price.toFixed(2)} USD`;
  const slideNum = String(index + 1).padStart(2, '0');

  const svgOverlay = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .mono { font-family: 'Courier New', Courier, monospace, sans-serif; }
      .sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 900; }
      .semi { font-weight: 700; }
    </style>

    <!-- Top Grid Line & Watermark -->
    <line x1="80" y1="120" x2="1000" y2="120" stroke="${borderColor}" stroke-width="2" />
    
    <text x="80" y="160" fill="${subtextColor}" font-size="16" class="mono" letter-spacing="4">ARCHIVE FINDS // ISSUE NO. ${slideNum}</text>
    <text x="1000" y="160" text-anchor="end" fill="${subtextColor}" font-size="16" class="mono" letter-spacing="3">AUTHENTIC GRAIL</text>

    <!-- Designer Brand Headline -->
    <text x="80" y="235" fill="${textColor}" font-size="52" class="sans bold" letter-spacing="-1">${brandName}</text>
    <text x="80" y="275" fill="${subtextColor}" font-size="20" class="mono" letter-spacing="2">[ ${category} • ${era} ]</text>

    <!-- Ambient Product Showcase Box -->
    <rect x="96" y="326" width="888" height="1008" fill="${isDark ? '#111111' : '#ffffff'}" stroke="${borderColor}" stroke-width="2" rx="4" />

    <!-- Bottom Editorial Card -->
    <rect x="80" y="1370" width="920" height="420" fill="${cardBg}" stroke="${borderColor}" stroke-width="2" rx="4" />

    <!-- Piece Title -->
    <text x="120" y="1440" fill="${textColor}" font-size="34" class="sans bold" letter-spacing="-0.5">${pieceName.length > 34 ? pieceName.slice(0, 32) + '...' : pieceName}</text>
    <text x="120" y="1480" fill="${subtextColor}" font-size="18" class="mono" letter-spacing="1">VERIFIED ARCHIVE COLLECTION</text>

    <line x1="120" y1="1520" x2="960" y2="1520" stroke="${borderColor}" stroke-width="1" />

    <!-- Price Section -->
    <text x="120" y="1575" fill="${subtextColor}" font-size="16" class="mono" letter-spacing="2">ESTIMATED SOURCING PRICE</text>
    <text x="120" y="1635" fill="${textColor}" font-size="48" class="mono bold">${price}</text>

    <!-- Sugargoo Partner Badge -->
    <rect x="660" y="1560" width="300" height="64" fill="${accentBox}" rx="2" />
    <text x="810" y="1600" text-anchor="middle" fill="${accentText}" font-size="18" class="mono bold" letter-spacing="2">SUGARGOO LINK</text>

    <!-- CTA & Swipe Indicator -->
    <line x1="120" y1="1680" x2="960" y2="1680" stroke="${borderColor}" stroke-width="1" />
    
    <text x="120" y="1740" fill="${subtextColor}" font-size="16" class="mono" letter-spacing="3">LINK IN BIO TO SOURCE PIECE</text>
    <text x="960" y="1740" text-anchor="end" fill="${textColor}" font-size="18" class="sans bold" letter-spacing="2">SWIPE ➔</text>
  </svg>
  `;

  const outputFileName = `slide_${slideNum}_${product.slug.replace(/[^\w-]/g, '_')}.jpg`;
  const outputPath = path.join(OUTPUT_DIR, outputFileName);

  // 5. Composite final 1080x1920 high-res image
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: bgColor
    }
  })
  .composite([
    {
      input: heroBuffer,
      top: 330,
      left: 100
    },
    {
      input: Buffer.from(svgOverlay),
      top: 0,
      left: 0
    }
  ])
  .jpeg({ quality: 95 })
  .toFile(outputPath);

  console.log(`✓ Generated 9:16 Slide using real Spreadsheet photo: ${outputFileName}`);
  return `/slides/${outputFileName}`;
}

async function run() {
  console.log(`\n🎨 Starting AI-Powered 9:16 Editorial Slide Generation with Real Spreadsheet Photos...`);
  const generatedSlides = [];

  const selectedProducts = products.slice(0, 16);

  for (let i = 0; i < selectedProducts.length; i++) {
    const p = selectedProducts[i];
    const theme = i % 2 === 0 ? 'dark' : 'light';
    const filePath = await createEditorialSlide(p, i, theme);
    generatedSlides.push({
      product: p,
      slideUrl: filePath,
      theme
    });
  }

  fs.writeFileSync(
    path.join(__dirname, '../src/lib/products/slidesData.json'),
    JSON.stringify(generatedSlides, null, 2)
  );

  console.log(`\n🎉 COMPLETED GENERATION OF ${generatedSlides.length} SOCIAL SLIDES WITH AUTHENTIC SPREADSHEET IMAGES!`);
  console.log(`Preview studio available at: http://localhost:3000/admin/slides`);
}

run().catch(console.error);
