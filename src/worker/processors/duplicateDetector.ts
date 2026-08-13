import { extractSugargooItemId } from "@/lib/utils";

export interface ExistingProductReference {
  id: string;
  name: string;
  normalizedName: string;
  sourceUrl: string;
  affiliateUrl?: string | null;
}

export class DuplicateDetector {
  /**
   * Level 1: Exact URL Match
   */
  static matchesExactUrl(targetUrl: string, existing: ExistingProductReference[]): ExistingProductReference | null {
    if (!targetUrl) return null;
    const cleanTarget = targetUrl.trim().toLowerCase();
    return existing.find((p) => p.sourceUrl.trim().toLowerCase() === cleanTarget) || null;
  }

  /**
   * Level 2: Extracted Platform Item ID Match (e.g. Taobao / Weidian ID)
   */
  static matchesPlatformId(targetUrl: string, existing: ExistingProductReference[]): ExistingProductReference | null {
    const targetId = extractSugargooItemId(targetUrl);
    if (!targetId) return null;

    for (const prod of existing) {
      const prodId = extractSugargooItemId(prod.sourceUrl);
      if (prodId && prodId === targetId) {
        return prod;
      }
    }
    return null;
  }

  /**
   * Level 3: Normalized Name Match (strip punctuation, whitespace, lowercase)
   */
  static matchesNormalizedName(name: string, existing: ExistingProductReference[]): ExistingProductReference | null {
    if (!name) return null;
    const normalized = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();

    if (normalized.length < 5) return null;

    return (
      existing.find((p) => {
        const itemNorm = (p.normalizedName || p.name).toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        return itemNorm === normalized;
      }) || null
    );
  }

  /**
   * Runs the 3-tier cascade and returns the matching duplicate if found
   */
  static findDuplicate(url: string, name: string, existing: ExistingProductReference[]): { isDuplicate: boolean; match?: ExistingProductReference; reason?: string } {
    const l1 = this.matchesExactUrl(url, existing);
    if (l1) return { isDuplicate: true, match: l1, reason: "Level 1: Exact URL Match" };

    const l2 = this.matchesPlatformId(url, existing);
    if (l2) return { isDuplicate: true, match: l2, reason: "Level 2: Platform Item ID Match" };

    const l3 = this.matchesNormalizedName(name, existing);
    if (l3) return { isDuplicate: true, match: l3, reason: "Level 3: Normalized Name Match" };

    return { isDuplicate: false };
  }
}
