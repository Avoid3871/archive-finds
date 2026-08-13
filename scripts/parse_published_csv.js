const https = require('https');

const pubCsvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT6-qGRXwOFYCvnqnpOP1iweDWQJWmornnr6HTmrlDFNDfNgJKLgm1qssk1WwDbNdnx7fOEjgcCo6s8/pub?output=csv';

function fetchCsv(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchCsv(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Brand normalizer dictionary
const KNOWN_BRANDS = [
  { match: /ERD|Enfant[s]? Riche[s]? D[eé]prim[eé][s]?/i, name: "Enfants Riches Déprimés", slug: "erd", origin: "Paris / LA", era: "2012–Present" },
  { match: /Vetements/i, name: "Vetements", slug: "vetements", origin: "Zurich / Paris", era: "2014–Present" },
  { match: /Rick Owens|DRKSHDW/i, name: "Rick Owens", slug: "rick-owens", origin: "Paris / Owenscorp", era: "1994–Present" },
  { match: /Raf Simons/i, name: "Raf Simons", slug: "raf-simons", origin: "Antwerp, Belgium", era: "1995–2023" },
  { match: /Boris Bidjan Saberi|BBS/i, name: "Boris Bidjan Saberi", slug: "boris-bidjan-saberi", origin: "Barcelona / Germany", era: "2007–Present" },
  { match: /Maison Margiela|Margiela|MM/i, name: "Maison Margiela", slug: "maison-margiela", origin: "Paris / Brussels", era: "1988–Present" },
  { match: /No[\s\/]?faith Studio[s]?/i, name: "No/Faith Studios", slug: "nofaithstudios", origin: "Germany", era: "2019–Present" },
  { match: /Lemaire/i, name: "Lemaire", slug: "lemaire", origin: "Paris", era: "1991–Present" },
  { match: /Cav Empt|C\.E/i, name: "Cav Empt", slug: "cav-empt", origin: "Tokyo, Japan", era: "2011–Present" },
  { match: /Jacquemus/i, name: "Jacquemus", slug: "jacquemus", origin: "Paris / Provence", era: "2009–Present" },
  { match: /Kiko Kostadinov/i, name: "Kiko Kostadinov", slug: "kiko-kostadinov", origin: "London", era: "2016–Present" },
  { match: /Yohji Yamamoto|Yohji/i, name: "Yohji Yamamoto", slug: "yohji-yamamoto", origin: "Tokyo, Japan", era: "1981–Present" },
  { match: /Dolce & Gabbana|D&G/i, name: "Dolce & Gabbana", slug: "dolce-gabbana", origin: "Milan, Italy", era: "1985–Present" },
  { match: /Moncler/i, name: "Moncler", slug: "moncler", origin: "Milan / France", era: "1952–Present" },
  { match: /Carol Christian Poell|CCP/i, name: "Carol Christian Poell", slug: "carol-christian-poell", origin: "Vienna / Milan", era: "1995–Present" },
  { match: /Saint Laurent|SLP/i, name: "Saint Laurent", slug: "saint-laurent", origin: "Paris", era: "1961–Present" },
  { match: /Prada/i, name: "Prada", slug: "prada", origin: "Milan, Italy", era: "1913–Present" },
  { match: /Dirk Bikkembergs/i, name: "Dirk Bikkembergs", slug: "dirk-bikkembergs", origin: "Antwerp, Belgium", era: "1986–Present" },
  { match: /Balenciaga/i, name: "Balenciaga", slug: "balenciaga", origin: "Paris / Spain", era: "1917–Present" },
  { match: /Undercover|Jun Takahashi/i, name: "Undercover", slug: "undercover", origin: "Tokyo, Japan", era: "1990–Present" },
  { match: /Chrome Hearts/i, name: "Chrome Hearts", slug: "chrome-hearts", origin: "Los Angeles", era: "1988–Present" },
  { match: /Helmut Lang/i, name: "Helmut Lang", slug: "helmut-lang", origin: "Vienna / New York", era: "1986–2005" },
  { match: /Walter Van Beirendonck/i, name: "Walter Van Beirendonck", slug: "walter-van-beirendonck", origin: "Antwerp, Belgium", era: "1983–Present" },
  { match: /Bottega Veneta/i, name: "Bottega Veneta", slug: "bottega-veneta", origin: "Vicenza, Italy", era: "1966–Present" },
  { match: /1017 Alyx|Alyx/i, name: "1017 ALYX 9SM", slug: "alyx", origin: "Ferrara / New York", era: "2015–Present" },
  { match: /Oakley/i, name: "Oakley", slug: "oakley", origin: "California", era: "1975–Present" },
  { match: /Gosha/i, name: "Gosha Rubchinskiy", slug: "gosha-rubchinskiy", origin: "Moscow", era: "2008–Present" },
  { match: /Supreme/i, name: "Supreme", slug: "supreme", origin: "New York", era: "1994–Present" },
  { match: /Acne Studios/i, name: "Acne Studios", slug: "acne-studios", origin: "Stockholm", era: "1996–Present" },
];

function detectBrand(title) {
  for (const b of KNOWN_BRANDS) {
    if (b.match.test(title)) return b;
  }
  return { name: "Archive Selection", slug: "archive-selection", origin: "Global Archive", era: "2000s" };
}

function parsePrice(str) {
  if (!str) return 45;
  const clean = str.replace(/[$,€\s]/g, '');
  const val = parseFloat(clean);
  return isNaN(val) ? 45 : val;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-');
}

async function run() {
  console.log("Fetching live CSV from published URL...");
  const rawCsv = await fetchCsv(pubCsvUrl);
  console.log("Fetched raw CSV, length:", rawCsv.length);

  const lines = rawCsv.split('\n').map(l => l.trim()).filter(Boolean);
  
  let currentCategory = "Tops";
  let currentCategorySlug = "tops";

  const products = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parser for quoted or unquoted columns
    const cols = [];
    let inQuotes = false;
    let current = '';
    for (let char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cols.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cols.push(current.trim());

    // Check for Section Header
    const firstCol = cols[0] || '';
    if (firstCol.includes("Pants") || firstCol.includes("Shorts")) {
      currentCategory = "Denim & Bottoms";
      currentCategorySlug = "denim";
      continue;
    } else if (firstCol.includes("Hoodies") || firstCol.includes("Sweater")) {
      currentCategory = "Knitwear & Sweaters";
      currentCategorySlug = "knitwear";
      continue;
    } else if (firstCol.includes("Jackets") || firstCol.includes("Coats")) {
      currentCategory = "Outerwear";
      currentCategorySlug = "outerwear";
      continue;
    } else if (firstCol.includes("Shoes")) {
      currentCategory = "Footwear";
      currentCategorySlug = "footwear";
      continue;
    } else if (firstCol.includes("Accessoires")) {
      currentCategory = "Accessories";
      currentCategorySlug = "accessories";
      continue;
    }

    // Stream 1 (Cols 0 & 1)
    if (cols[0] && cols[1] && (cols[1].includes('$') || cols[1].includes('€'))) {
      const name = cols[0].replace(/^"|"$/g, '').trim();
      const price = parsePrice(cols[1]);
      const brand = detectBrand(name);
      if (name.length > 2 && !name.includes("Sing Up")) {
        products.push({
          id: `item-${products.length + 1}`,
          name,
          slug: `${brand.slug}-${slugify(name)}`,
          brand: brand.name,
          brandSlug: brand.slug,
          category: currentCategory,
          categorySlug: currentCategorySlug,
          price,
          currency: "USD",
          era: brand.era,
          style: "Avant-Garde",
          description: `Authentic ${brand.name} archive piece (${name}). Sourced and verified from collector spreadsheets.`,
          affiliateUrl: `https://www.sugargoo.com/#/home/productDetail?productLink=${encodeURIComponent('https://item.taobao.com/item.htm?id=search&name=' + encodeURIComponent(name))}&memberId=archivefinds`,
          imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1080&q=85",
          tags: [brand.slug, currentCategorySlug, "archive", "grail"],
          isFeatured: products.length < 4,
          isRare: price > 100,
        });
      }
    }

    // Stream 2 (Cols 3 & 4)
    if (cols[3] && cols[4] && (cols[4].includes('$') || cols[4].includes('€'))) {
      const name = cols[3].replace(/^"|"$/g, '').trim();
      const price = parsePrice(cols[4]);
      const brand = detectBrand(name);
      if (name.length > 2 && !name.includes("Sing Up")) {
        products.push({
          id: `item-${products.length + 1}`,
          name,
          slug: `${brand.slug}-${slugify(name)}`,
          brand: brand.name,
          brandSlug: brand.slug,
          category: currentCategory,
          categorySlug: currentCategorySlug,
          price,
          currency: "USD",
          era: brand.era,
          style: "Avant-Garde",
          description: `Authentic ${brand.name} archive piece (${name}). Sourced and verified from collector spreadsheets.`,
          affiliateUrl: `https://www.sugargoo.com/#/home/productDetail?productLink=${encodeURIComponent('https://item.taobao.com/item.htm?id=search&name=' + encodeURIComponent(name))}&memberId=archivefinds`,
          imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1080&q=85",
          tags: [brand.slug, currentCategorySlug, "archive", "grail"],
          isFeatured: false,
          isRare: price > 100,
        });
      }
    }
  }

  console.log(`\n✅ SUCCESSFULLY PARSED ${products.length} PRODUCTS FROM PUBLISHED SHEET!`);
  console.log("\nSAMPLE PRODUCTS:");
  console.log(JSON.stringify(products.slice(0, 5), null, 2));

  // Save parsed products json
  const fs = require('fs');
  fs.writeFileSync('src/lib/products/sheetProducts.json', JSON.stringify(products, null, 2));
  console.log("Saved src/lib/products/sheetProducts.json!");
}

run().catch(console.error);
