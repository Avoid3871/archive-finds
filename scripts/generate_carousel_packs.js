const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const products = require('../src/lib/products/sheetProducts.json');

const OUTPUT_DIR = path.join(__dirname, '../public/slides/packs');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

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

// 1. Cover Slide Builder
async function createCoverSlide({ packId, vol, title, subtitle, badgeText, theme = 'dark', count = 5 }) {
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0a0a0a' : '#f5f5f4';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#888888' : '#666666';
  const borderColor = isDark ? '#262626' : '#e0e0e0';
  const accentBox = isDark ? '#ffffff' : '#000000';
  const accentText = isDark ? '#000000' : '#ffffff';

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

    <!-- Background Grid Lines -->
    <line x1="80" y1="120" x2="1000" y2="120" stroke="${borderColor}" stroke-width="2" />
    <line x1="80" y1="1800" x2="1000" y2="1800" stroke="${borderColor}" stroke-width="2" />
    <line x1="80" y1="120" x2="80" y2="1800" stroke="${borderColor}" stroke-width="1" stroke-dasharray="8,8" />
    <line x1="1000" y1="120" x2="1000" y2="1800" stroke="${borderColor}" stroke-width="1" stroke-dasharray="8,8" />

    <!-- Top Meta -->
    <text x="120" y="170" fill="${subtextColor}" font-size="18" class="mono" letter-spacing="4">ARCHIVE FINDS // EDITORIAL</text>
    <text x="960" y="170" text-anchor="end" fill="${subtextColor}" font-size="18" class="mono" letter-spacing="3">${vol}</text>

    <!-- Hook Badge -->
    <rect x="120" y="320" width="340" height="48" fill="${accentBox}" rx="2" />
    <text x="290" y="352" text-anchor="middle" fill="${accentText}" font-size="18" class="mono bold" letter-spacing="3">${escapedBadge}</text>

    <!-- Main Huge Headline -->
    <text x="120" y="470" fill="${textColor}" font-size="64" class="sans bold" letter-spacing="-2">
      ${escapedTitle.split('\\n').map((line, i) => `<tspan x="120" dy="${i === 0 ? 0 : 76}">${line}</tspan>`).join('')}
    </text>

    <!-- Subtitle Description -->
    <text x="120" y="860" fill="${subtextColor}" font-size="28" class="sans" letter-spacing="0">
      ${escapedSubtitle}
    </text>

    <!-- Middle Decorative Box / Graphic Frame -->
    <rect x="120" y="960" width="840" height="540" fill="${isDark ? '#111111' : '#ffffff'}" stroke="${borderColor}" stroke-width="2" rx="6" />
    
    <text x="160" y="1040" fill="${textColor}" font-size="24" class="mono bold" letter-spacing="2">CURATED SELECTION (${count} PIECES)</text>
    <line x1="160" y1="1070" x2="920" y2="1070" stroke="${borderColor}" stroke-width="1" />

    <text x="160" y="1130" fill="${subtextColor}" font-size="20" class="mono" letter-spacing="1">✓ VERIFIED DIRECT SOURCE LINKS</text>
    <text x="160" y="1180" fill="${subtextColor}" font-size="20" class="mono" letter-spacing="1">✓ ACCURATE SOURCING ESTIMATES</text>
    <text x="160" y="1230" fill="${subtextColor}" font-size="20" class="mono" letter-spacing="1">✓ ONE-CLICK SUGARGOO PROCUREMENT</text>
    <text x="160" y="1280" fill="${subtextColor}" font-size="20" class="mono" letter-spacing="1">✓ NO GATEKEEPING // SOURCED DAILY</text>

    <line x1="160" y1="1340" x2="920" y2="1340" stroke="${borderColor}" stroke-width="1" />
    <text x="160" y="1420" fill="${textColor}" font-size="32" class="mono bold" letter-spacing="1">ARCHIVE-FINDS.VERCEL.APP</text>

    <!-- Bottom Swipe Indicator -->
    <rect x="120" y="1600" width="840" height="120" fill="${isDark ? '#161616' : '#ebebeb'}" stroke="${borderColor}" stroke-width="1" rx="4" />
    <text x="160" y="1670" fill="${textColor}" font-size="26" class="sans bold" letter-spacing="1">SWIPE TO EXPLORE GRAILS</text>
    <text x="920" y="1670" text-anchor="end" fill="${textColor}" font-size="32" class="sans bold">➔</text>
  </svg>
  `;

  const fileName = `pack_${packId}_01_cover.jpg`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: bgColor }
  })
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .jpeg({ quality: 95 })
  .toFile(filePath);

  return `/slides/packs/${fileName}`;
}

// 2. Product Slide Builder
async function createProductSlide({ packId, slideIndex, totalSlides, product, theme = 'dark' }) {
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0a0a0a' : '#f5f5f4';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#888888' : '#666666';
  const borderColor = isDark ? '#262626' : '#e0e0e0';
  const cardBg = isDark ? '#141414' : '#ffffff';
  const accentBox = isDark ? '#ffffff' : '#000000';
  const accentText = isDark ? '#000000' : '#ffffff';

  let rawImagePath = path.join(__dirname, '../public', product.imageUrl);
  if (!fs.existsSync(rawImagePath)) {
    rawImagePath = path.join(__dirname, '../public/products/sheet/garment_r000_c00_001.jpg');
  }

  let heroBuffer;
  if (fs.existsSync(rawImagePath)) {
    heroBuffer = await sharp(rawImagePath)
      .resize(860, 960, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();
  } else {
    heroBuffer = await sharp({
      create: { width: 860, height: 960, channels: 4, background: { r: 20, g: 20, b: 20, alpha: 1 } }
    }).png().toBuffer();
  }

  const brandName = escapeXml(product.brand.toUpperCase());
  const pieceName = escapeXml(product.name.toUpperCase());
  const category = escapeXml(product.category.toUpperCase());
  const era = escapeXml(product.era.toUpperCase());
  const price = `$${product.price.toFixed(2)} USD`;
  const slideNum = String(slideIndex).padStart(2, '0');
  const totalNum = String(totalSlides).padStart(2, '0');

  const svg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .mono { font-family: 'Courier New', Courier, monospace, sans-serif; }
      .sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 900; }
      .semi { font-weight: 700; }
    </style>

    <!-- Top Grid Line & Watermark -->
    <line x1="80" y1="120" x2="1000" y2="120" stroke="${borderColor}" stroke-width="2" />
    
    <text x="80" y="160" fill="${subtextColor}" font-size="16" class="mono" letter-spacing="4">ARCHIVE FINDS // ${slideNum} OF ${totalNum}</text>
    <text x="1000" y="160" text-anchor="end" fill="${subtextColor}" font-size="16" class="mono" letter-spacing="3">SUGARGOO VERIFIED</text>

    <!-- Designer Brand Headline -->
    <text x="80" y="235" fill="${textColor}" font-size="50" class="sans bold" letter-spacing="-1">${brandName}</text>
    <text x="80" y="275" fill="${subtextColor}" font-size="20" class="mono" letter-spacing="2">[ ${category} • ${era} ]</text>

    <!-- Ambient Product Showcase Box -->
    <rect x="96" y="320" width="888" height="980" fill="${isDark ? '#111111' : '#ffffff'}" stroke="${borderColor}" stroke-width="2" rx="4" />

    <!-- Bottom Editorial Card -->
    <rect x="80" y="1340" width="920" height="450" fill="${cardBg}" stroke="${borderColor}" stroke-width="2" rx="4" />

    <!-- Piece Title -->
    <text x="120" y="1410" fill="${textColor}" font-size="34" class="sans bold" letter-spacing="-0.5">${pieceName.length > 34 ? pieceName.slice(0, 32) + '...' : pieceName}</text>
    <text x="120" y="1450" fill="${subtextColor}" font-size="18" class="mono" letter-spacing="1">CURATED ARCHIVE SELECTION</text>

    <line x1="120" y1="1490" x2="960" y2="1490" stroke="${borderColor}" stroke-width="1" />

    <!-- Price Section -->
    <text x="120" y="1545" fill="${subtextColor}" font-size="16" class="mono" letter-spacing="2">ESTIMATED PROCURING PRICE</text>
    <text x="120" y="1605" fill="${textColor}" font-size="48" class="mono bold">${price}</text>

    <!-- Sugargoo Partner Badge -->
    <rect x="660" y="1530" width="300" height="64" fill="${accentBox}" rx="2" />
    <text x="810" y="1570" text-anchor="middle" fill="${accentText}" font-size="18" class="mono bold" letter-spacing="2">SUGARGOO LINK</text>

    <!-- CTA & Swipe Indicator -->
    <line x1="120" y1="1660" x2="960" y2="1660" stroke="${borderColor}" stroke-width="1" />
    
    <text x="120" y="1720" fill="${subtextColor}" font-size="16" class="mono" letter-spacing="3">LINK IN BIO TO ORDER PIECE</text>
    <text x="960" y="1720" text-anchor="end" fill="${textColor}" font-size="18" class="sans bold" letter-spacing="2">${slideIndex === totalSlides - 1 ? 'LAST ➔' : 'SWIPE ➔'}</text>
  </svg>
  `;

  const fileName = `pack_${packId}_${slideNum}_${product.slug.replace(/[^\w-]/g, '_')}.jpg`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: bgColor }
  })
  .composite([
    { input: heroBuffer, top: 330, left: 110 },
    { input: Buffer.from(svg), top: 0, left: 0 }
  ])
  .jpeg({ quality: 95 })
  .toFile(filePath);

  return `/slides/packs/${fileName}`;
}

// 3. Outro Slide Builder (Conversion Climax)
async function createOutroSlide({ packId, slideIndex, theme = 'dark' }) {
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0a0a0a' : '#f5f5f4';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#888888' : '#666666';
  const borderColor = isDark ? '#262626' : '#e0e0e0';
  const cardBg = isDark ? '#141414' : '#ffffff';
  const accentBox = isDark ? '#ffffff' : '#000000';
  const accentText = isDark ? '#000000' : '#ffffff';

  const svg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .mono { font-family: 'Courier New', Courier, monospace, sans-serif; }
      .sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 900; }
      .semi { font-weight: 700; }
    </style>

    <!-- Grid Border Frame -->
    <line x1="80" y1="120" x2="1000" y2="120" stroke="${borderColor}" stroke-width="2" />
    <line x1="80" y1="1800" x2="1000" y2="1800" stroke="${borderColor}" stroke-width="2" />

    <!-- Top Watermark -->
    <text x="120" y="170" fill="${subtextColor}" font-size="18" class="mono" letter-spacing="4">ARCHIVE FINDS // HOW TO SOURCING</text>
    <text x="960" y="170" text-anchor="end" fill="${subtextColor}" font-size="18" class="mono" letter-spacing="3">FINAL STEP</text>

    <!-- Main Headline -->
    <text x="120" y="300" fill="${textColor}" font-size="56" class="sans bold" letter-spacing="-1">HOW TO ORDER</text>
    <text x="120" y="360" fill="${textColor}" font-size="56" class="sans bold" letter-spacing="-1">THESE GRAILS:</text>

    <!-- Step 1 Card -->
    <rect x="120" y="440" width="840" height="240" fill="${cardBg}" stroke="${borderColor}" stroke-width="2" rx="4" />
    <text x="160" y="500" fill="${subtextColor}" font-size="18" class="mono" letter-spacing="2">STEP 01</text>
    <text x="160" y="550" fill="${textColor}" font-size="32" class="sans bold">CLICK LINK IN BIO</text>
    <text x="160" y="600" fill="${subtextColor}" font-size="20" class="sans">Head to archive-finds.vercel.app directly from our profile.</text>

    <!-- Step 2 Card -->
    <rect x="120" y="720" width="840" height="240" fill="${cardBg}" stroke="${borderColor}" stroke-width="2" rx="4" />
    <text x="160" y="780" fill="${subtextColor}" font-size="18" class="mono" letter-spacing="2">STEP 02</text>
    <text x="160" y="830" fill="${textColor}" font-size="32" class="sans bold">BROWSE 104+ VERIFIED PIECES</text>
    <text x="160" y="880" fill="${subtextColor}" font-size="20" class="sans">Search by designer, piece name, category, or price range.</text>

    <!-- Step 3 Card -->
    <rect x="120" y="1000" width="840" height="240" fill="${cardBg}" stroke="${borderColor}" stroke-width="2" rx="4" />
    <text x="160" y="1060" fill="${subtextColor}" font-size="18" class="mono" letter-spacing="2">STEP 03</text>
    <text x="160" y="1110" fill="${textColor}" font-size="32" class="sans bold">TAP 'VIEW ITEM' FOR SUGARGOO</text>
    <text x="160" y="1160" fill="${subtextColor}" font-size="20" class="sans">Instant direct routing to buy with automated agent shipping.</text>

    <!-- Bottom Conversion Box -->
    <rect x="120" y="1320" width="840" height="380" fill="${accentBox}" rx="6" />
    
    <text x="540" y="1420" text-anchor="middle" fill="${accentText}" font-size="38" class="sans bold" letter-spacing="-1">SAVE THIS POST 📌</text>
    <text x="540" y="1480" text-anchor="middle" fill="${accentText}" font-size="22" class="sans">Never lose access to rare designer archive spreadsheet finds.</text>

    <line x1="200" y1="1540" x2="880" y2="1540" stroke="${accentText}" stroke-width="1" stroke-opacity="0.3" />

    <text x="540" y="1620" text-anchor="middle" fill="${accentText}" font-size="28" class="mono bold" letter-spacing="2">@ARCHIVEFINDS // FOLLOW FOR DAILY DROPS</text>
  </svg>
  `;

  const fileName = `pack_${packId}_${String(slideIndex).padStart(2, '0')}_outro.jpg`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: bgColor }
  })
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .jpeg({ quality: 95 })
  .toFile(filePath);

  return `/slides/packs/${fileName}`;
}

async function run() {
  console.log('🎬 Starting Generation of Viral Thematic Carousel Packs (7-Slide Ready-to-Post Collections)...');

  const packsConfig = [
    {
      id: 'erd-grails',
      vol: 'VOL. 01',
      title: '5 RARE ERD\\nGRAILS YOU\\nNEED TO SEE',
      subtitle: 'Enfants Riches Déprimés archive pieces with direct links.',
      badgeText: 'ERD SPECIAL',
      theme: 'dark',
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
      theme: 'dark',
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
      theme: 'dark',
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
      theme: 'light',
      filter: p => p.brandSlug === 'raf-simons',
      limit: 5,
      hook: 'Historic Raf Simons runway pieces you can still procure via Sugargoo  Belgian fashion history.',
      hashtags: ['#rafsimons', '#rafsimonsarchive', '#riotriotriot', '#antwerpsix', '#archivefashion', '#grailedfinds']
    },
    {
      id: 'avant-garde-denim',
      vol: 'VOL. 05',
      title: '5 CRAZY DESIGNER\\nDENIM & PANTS\\nFOR YOUR ROTATION',
      subtitle: 'Maison Margiela flared, No/Faith Studios wave, & Lemaire twisted jeans.',
      badgeText: 'DENIM GRAILS',
      theme: 'dark',
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
      theme: 'dark',
      filter: p => ['yohji-yamamoto', 'carol-christian-poell', 'boris-bidjan-saberi'].includes(p.brandSlug),
      limit: 5,
      hook: 'Rare Avant-Garde pieces (CCP, Yohji, BBS) sourced without gatekeeping 👁️',
      hashtags: ['#carolchristianpoell', '#yohjiyamamoto', '#borisbidjansaberi', '#artisanalfashion', '#darkfashion', '#archive']
    }
  ];

  const generatedPacks = [];

  for (const cfg of packsConfig) {
    console.log(`\n📦 Generating Pack: ${cfg.title.replace('\\n', ' ')} (${cfg.vol})...`);
    const matchedProducts = products.filter(cfg.filter).slice(0, cfg.limit);
    const totalSlides = matchedProducts.length + 2; // Cover + Products + Outro

    const slides = [];

    // 1. Cover Slide
    const coverUrl = await createCoverSlide({
      packId: cfg.id,
      vol: cfg.vol,
      title: cfg.title,
      subtitle: cfg.subtitle,
      badgeText: cfg.badgeText,
      theme: cfg.theme,
      count: matchedProducts.length
    });

    slides.push({
      type: 'cover',
      slideNumber: 1,
      title: cfg.title.replace(/\\n/g, ' '),
      subtitle: cfg.subtitle,
      slideUrl: coverUrl
    });

    // 2. Product Slides
    for (let i = 0; i < matchedProducts.length; i++) {
      const p = matchedProducts[i];
      const slideIndex = i + 2;
      const slideUrl = await createProductSlide({
        packId: cfg.id,
        slideIndex,
        totalSlides,
        product: p,
        theme: cfg.theme
      });

      slides.push({
        type: 'product',
        slideNumber: slideIndex,
        title: p.name,
        subtitle: `${p.brand} • $${p.price.toFixed(2)} USD`,
        slideUrl,
        product: p
      });
    }

    // 3. Outro Slide
    const outroUrl = await createOutroSlide({
      packId: cfg.id,
      slideIndex: totalSlides,
      theme: cfg.theme
    });

    slides.push({
      type: 'outro',
      slideNumber: totalSlides,
      title: 'How to Order & Save',
      subtitle: 'archive-finds.vercel.app',
      slideUrl: outroUrl
    });

    generatedPacks.push({
      id: cfg.id,
      vol: cfg.vol,
      title: cfg.title.replace(/\\n/g, ' '),
      badgeText: cfg.badgeText,
      theme: cfg.theme,
      slideCount: totalSlides,
      hook: cfg.hook,
      caption: `${cfg.hook}\n\nAll pieces are verified with direct Sugargoo order links on our website 🔗\n🌐 Link in Bio: archive-finds.vercel.app\n\n${cfg.hashtags.join(' ')}`,
      hashtags: cfg.hashtags,
      slides,
      products: matchedProducts
    });
  }

  const outJsonPath = path.join(__dirname, '../src/lib/products/carouselPacks.json');
  fs.writeFileSync(outJsonPath, JSON.stringify(generatedPacks, null, 2));

  console.log(`\n🎉 COMPLETED ALL ${generatedPacks.length} CAROUSEL PACKS (${generatedPacks.reduce((acc, p) => acc + p.slideCount, 0)} TOTAL SLIDES)!`);
  console.log(`Saved metadata cleanly to src/lib/products/carouselPacks.json`);
}

run().catch(console.error);
