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


// Curated high-res imagery mapping for key designer categories
const CATEGORY_IMAGES: Record<string, string[]> = {
  tops: [
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1080&q=85",
    "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1080&q=85",
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1080&q=85"
  ],
  denim: [
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1080&q=85",
    "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=1080&q=85",
    "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=1080&q=85"
  ],
  knitwear: [
    "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1080&q=85",
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1080&q=85"
  ],
  outerwear: [
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1080&q=85",
    "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1080&q=85",
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1080&q=85"
  ],
  footwear: [
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1080&q=85",
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1080&q=85",
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1080&q=85"
  ],
  accessories: [
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1080&q=85",
    "https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&w=1080&q=85",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1080&q=85"
  ]
};

export const MOCK_PRODUCTS: Product[] = sheetProductsRaw as Product[];

