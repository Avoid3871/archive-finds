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
  status?: "ACTIVE" | "DRAFT" | "HIDDEN";
}

export type MockProduct = Product;

function slugify(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseRawProducts(rawList: any[]): Product[] {
  return (rawList || []).map((p, idx) => {
    const brand = p.brand || "Archive Collection";
    const name = p.name || p.title || `Archive Piece #${p.id || idx + 1}`;
    const category = p.category || "Outerwear";
    const slug = p.slug || slugify(`${brand}-${name}-${p.id || idx + 1}`);
    const price = typeof p.price === "number" ? p.price : typeof p.sourcePrice === "number" ? p.sourcePrice : 59;
    const affiliateUrl = p.affiliateUrl || p.sugargooUrl || p.affiliateLink || "#";
    const imageUrl = p.imageUrl || p.localImage || `/products/${slug}.png`;
    const status = p.status === "DRAFT" ? "DRAFT" : p.status === "HIDDEN" ? "HIDDEN" : "ACTIVE";

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
      status,
    };
  });
}

export function getFreshRawProducts(): any[] {
  if (typeof window === "undefined") {
    try {
      const nodeFs = eval("require")("fs");
      const nodePath = eval("require")("path");
      const filePath = nodePath.join(process.cwd(), "src", "lib", "products", "sheetProducts.json");
      if (nodeFs.existsSync(filePath)) {
        const fileContent = nodeFs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileContent);
      }
    } catch (e) {}
  }
  return sheetProductsRaw;
}

export const MOCK_PRODUCTS: Product[] = parseRawProducts(sheetProductsRaw);

export function getAllProducts(): Product[] {
  return parseRawProducts(getFreshRawProducts());
}

export function getProductBySlug(slug: string): Product | undefined {
  const products = getAllProducts();
  const cleanSlug = decodeURIComponent(slug || "").toLowerCase().trim();
  if (!cleanSlug) return undefined;

  // 1. Exact slug match
  const exact = products.find((p) => p.slug.toLowerCase() === cleanSlug);
  if (exact) return exact;

  // 2. ID match if slug is numeric
  const byId = products.find((p) => String(p.id) === cleanSlug);
  if (byId) return byId;

  // 3. Normalized slug comparison (stripping trailing timestamp or hash)
  const normInput = cleanSlug.replace(/-\d+$/, "").replace(/[^a-z0-9]/g, "");
  const partial = products.find((p) => {
    const pNorm = p.slug.toLowerCase().replace(/-\d+$/, "").replace(/[^a-z0-9]/g, "");
    return (
      pNorm === normInput ||
      p.slug.toLowerCase().includes(cleanSlug) ||
      cleanSlug.includes(p.slug.toLowerCase()) ||
      (normInput.length > 5 && (pNorm.includes(normInput) || normInput.includes(pNorm)))
    );
  });
  if (partial) return partial;

  return undefined;
}

