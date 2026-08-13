import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string, currency = "EUR"): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(num);
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export function extractSugargooItemId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has("item_id")) return parsed.searchParams.get("item_id");
    if (parsed.searchParams.has("id")) return parsed.searchParams.get("id");
    if (parsed.searchParams.has("itemId")) return parsed.searchParams.get("itemId");
    
    // Check regex in path
    const match = url.match(/(?:id=|itemId=|item_id=)(\d+)/i);
    if (match && match[1]) return match[1];
    
    return null;
  } catch {
    return null;
  }
}
