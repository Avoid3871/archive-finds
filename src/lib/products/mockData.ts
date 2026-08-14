import sheetProductsRaw from "./sheetProducts.json";

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  brandSlug: string;
  category: string;
  categorySlug: string;
  price: number;
  currency: string;
  era: string;
  style: string;
  description: string;
  affiliateUrl: string;
  imageUrl: string;
  tags: string[];
  isFeatured: boolean;
  isRare: boolean;
}

export type MockProduct = Product;

function slugify(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const MOCK_PRODUCTS: Product[] = (sheetProductsRaw as any[]).map((p, idx) => {
  const brand = p.brand || "Archive Collection";
  const name = p.name || p.title || `Archive Piece #${p.id || idx + 1}`;
  const category = p.category || "Outerwear";
  const slug = p.slug || slugify(`${brand}-${name}-${p.id || idx + 1}`);
  const price = typeof p.price === "number" ? p.price : typeof p.sourcePrice === "number" ? p.sourcePrice : 59;
  const affiliateUrl = p.affiliateUrl || p.sugargooUrl || p.affiliateLink || "#";
  const imageUrl = p.imageUrl || p.localImage || `/products/${slug}.png`;

  const tags = Array.isArray(p.tags) && p.tags.length > 0
    ? p.tags
    : [slugify(brand), slugify(category), "archive", "sugargoo", "grail"].filter(Boolean);

  return {
    id: String(p.id || idx + 1),
    name,
    slug,
    brand,
    brandSlug: slugify(brand),
    category,
    categorySlug: slugify(category),
    price,
    currency: p.currency || "USD",
    era: p.era || "Contemporary / Archive",
    style: p.style || "Avant-Garde & Vintage",
    description: p.description || p.notes || `Curated ${brand} ${category.toLowerCase()} sourced through verified supplier network. Featuring authentic silhouette detailing, premium textile construction, and direct Sugargoo agent procurement.`,
    affiliateUrl,
    imageUrl,
    tags,
    isFeatured: Boolean(p.isFeatured ?? idx < 8),
    isRare: Boolean(p.isRare ?? true),
  };
});
