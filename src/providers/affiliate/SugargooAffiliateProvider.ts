import { IAffiliateProvider, ProductLinkMetadata } from "./AffiliateProvider";

export class SugargooAffiliateProvider implements IAffiliateProvider {
  readonly name = "sugargoo";
  private defaultMemberId: string;

  constructor(defaultMemberId?: string) {
    this.defaultMemberId = defaultMemberId || process.env.SUGARGOO_MEMBER_ID || "archivefinds";
  }

  canHandle(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      lower.includes("sugargoo.com") ||
      lower.includes("taobao.com") ||
      lower.includes("weidian.com") ||
      lower.includes("1688.com") ||
      lower.includes("tmall.com")
    );
  }

  generateAffiliateUrl(sourceUrl: string, memberId?: string): string {
    const activeMemberId = memberId || this.defaultMemberId;
    if (!sourceUrl) return "";

    try {
      // If it's already a Sugargoo link, inject or replace memberId
      if (sourceUrl.includes("sugargoo.com")) {
        const urlObj = new URL(sourceUrl);
        urlObj.searchParams.set("memberId", activeMemberId);
        return urlObj.toString();
      }

      // If it is a TaoBao / Weidian / 1688 / Tmall raw URL:
      // Sugargoo standard web format: https://www.sugargoo.com/#/home/productDetail?productLink={encodedUrl}&memberId={memberId}
      const encodedProduct = encodeURIComponent(sourceUrl);
      return `https://www.sugargoo.com/#/home/productDetail?productLink=${encodedProduct}&memberId=${activeMemberId}`;
    } catch {
      // Fallback
      return `https://www.sugargoo.com/#/home/productDetail?productLink=${encodeURIComponent(sourceUrl)}&memberId=${activeMemberId}`;
    }
  }

  parseSourceUrl(url: string): ProductLinkMetadata {
    const metadata: ProductLinkMetadata = {
      rawUrl: url,
      marketplace: "unknown",
    };

    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();

      if (host.includes("taobao.com")) {
        metadata.marketplace = "taobao";
        metadata.itemId = parsed.searchParams.get("id") || undefined;
      } else if (host.includes("weidian.com")) {
        metadata.marketplace = "weidian";
        metadata.itemId = parsed.searchParams.get("itemID") || parsed.searchParams.get("itemId") || undefined;
      } else if (host.includes("1688.com")) {
        metadata.marketplace = "1688";
        const match = url.match(/offer\/(\d+)\.html/);
        if (match) metadata.itemId = match[1];
      } else if (host.includes("sugargoo.com")) {
        metadata.marketplace = "sugargoo";
        // Check if there is an embedded productLink
        const innerLink = parsed.searchParams.get("productLink");
        if (innerLink) {
          const nestedMeta = this.parseSourceUrl(decodeURIComponent(innerLink));
          return {
            ...nestedMeta,
            rawUrl: url,
          };
        }
      }
    } catch {
      // ignore
    }

    return metadata;
  }
}
