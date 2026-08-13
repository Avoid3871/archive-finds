const fs = require('fs');
const path = require('path');
const https = require('https');

// Load products
const products = require('../src/lib/products/sheetProducts.json');

const IMG_DIR = path.join(__dirname, '../public/products');
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

// Curated high-res archive imagery library for iconic designer silhouettes
const PIECE_IMAGES = {
  // Tops & Tees
  "erd": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1080&q=85",
  "vetements": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1080&q=85",
  "rick-owens": "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1080&q=85",
  "raf-simons": "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1080&q=85",
  "gosha": "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1080&q=85",
  
  // Denim & Bottoms
  "denim": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1080&q=85",
  "pants": "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=1080&q=85",
  "nofaithstudios": "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=1080&q=85",
  "margiela": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1080&q=85",
  
  // Outerwear & Jackets
  "bomber": "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1080&q=85",
  "jacket": "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1080&q=85",
  "leather": "https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=1080&q=85",
  "puffer": "https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=1080&q=85",
  
  // Footwear & Shoes
  "shoes": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1080&q=85",
  "boots": "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1080&q=85",
  "derby": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1080&q=85",
  "ramones": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1080&q=85",
  
  // Accessories & Jewelry
  "accessories": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1080&q=85",
  "wallet": "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1080&q=85",
  "belt": "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=1080&q=85",
  "ring": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1080&q=85",
  "sunglasses": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1080&q=85",
};

function resolveProductImage(p) {
  const name = p.name.toLowerCase();
  const cat = p.categorySlug.toLowerCase();
  const brand = p.brandSlug.toLowerCase();

  if (name.includes('ramone') || name.includes('shoe') || name.includes('boot') || cat === 'footwear') {
    if (name.includes('boot')) return PIECE_IMAGES.boots;
    if (name.includes('derby')) return PIECE_IMAGES.derby;
    return PIECE_IMAGES.shoes;
  }

  if (name.includes('belt')) return PIECE_IMAGES.belt;
  if (name.includes('wallet')) return PIECE_IMAGES.wallet;
  if (name.includes('ring') || name.includes('necklace') || name.includes('bracelet')) return PIECE_IMAGES.ring;
  if (name.includes('sunglasses') || name.includes('metal round')) return PIECE_IMAGES.sunglasses;

  if (name.includes('leather') || name.includes('biker') || name.includes('dystopia')) return PIECE_IMAGES.leather;
  if (name.includes('puffer') || name.includes('moncler')) return PIECE_IMAGES.puffer;
  if (name.includes('bomber') || name.includes('jacket') || cat === 'outerwear') return PIECE_IMAGES.bomber;

  if (name.includes('jean') || name.includes('denim') || name.includes('pant') || cat === 'denim') {
    if (brand.includes('nofaith')) return PIECE_IMAGES.nofaithstudios;
    return PIECE_IMAGES.denim;
  }

  if (brand.includes('erd')) return PIECE_IMAGES["erd"];
  if (brand.includes('vetements')) return PIECE_IMAGES["vetements"];
  if (brand.includes('rick')) return PIECE_IMAGES["rick-owens"] || PIECE_IMAGES["jacket"];
  if (brand.includes('raf')) return PIECE_IMAGES["raf-simons"] || PIECE_IMAGES["bomber"];

  return PIECE_IMAGES.jacket;
}

const updatedProducts = products.map((p, idx) => {
  const image = resolveProductImage(p);
  return {
    ...p,
    imageUrl: image,
  };
});

fs.writeFileSync(
  path.join(__dirname, '../src/lib/products/sheetProducts.json'),
  JSON.stringify(updatedProducts, null, 2)
);

console.log(`✅ Successfully assigned high-res aesthetic product images to all ${updatedProducts.length} items!`);
