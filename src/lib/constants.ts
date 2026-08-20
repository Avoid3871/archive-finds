export const SITE_CONFIG = {
  name: "ARCHIVE FINDS",
  tagline: "Curated Archive & Designer Fashion",
  description: "A premier editorial discovery platform for curated archive pieces, rare garments, and designer fashion.",
  url: "https://archive-finds.vercel.app",
  socials: {
    tiktok: "https://www.tiktok.com/@arch1v4",
    instagram: "https://www.instagram.com/arch1v4_finds/",
  },
};

import { ARCHIVE_BRANDS, BRAND_NAMES, normalizeBrand, slugifyBrand } from "./constants/brands";

export { ARCHIVE_BRANDS, BRAND_NAMES, normalizeBrand, slugifyBrand };
export const BRANDS = ARCHIVE_BRANDS;


export const CATEGORIES = [
  { name: "Tops & Shirts", slug: "tops", count: 11 },
  { name: "Denim & Bottoms", slug: "denim", count: 15 },
  { name: "Knitwear & Sweaters", slug: "knitwear", count: 27 },
  { name: "Outerwear & Jackets", slug: "outerwear", count: 19 },
  { name: "Footwear & Boots", slug: "footwear", count: 16 },
  { name: "Accessories & Grails", slug: "accessories", count: 16 },
];

export const STYLES = [
  { name: "Archive", slug: "archive" },
  { name: "Avant-Garde", slug: "avant-garde" },
  { name: "Japanese", slug: "japanese" },
  { name: "Y2K", slug: "y2k" },
  { name: "Techwear", slug: "techwear" },
  { name: "Minimalist", slug: "minimalist" },
  { name: "Military/Workwear", slug: "military-workwear" },
];

export const ERAS = [
  { name: "80s", slug: "80s" },
  { name: "90s", slug: "90s" },
  { name: "00s", slug: "00s" },
  { name: "10s", slug: "10s" },
  { name: "Modern", slug: "modern" },
];

