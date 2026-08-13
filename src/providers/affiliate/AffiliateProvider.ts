export interface ProductLinkMetadata {
  rawUrl: string;
  marketplace: "taobao" | "weidian" | "1688" | "sugargoo" | "tmall" | "unknown";
  itemId?: string;
  title?: string;
  price?: number;
  imageUrl?: string;
}

export interface IAffiliateProvider {
  readonly name: string;
  
  /**
   * Identifies if a given raw URL can be converted by this provider.
   */
  canHandle(url: string): boolean;

  /**
   * Converts a raw source URL (e.g. Taobao, Weidian, 1688 or existing Sugargoo link)
   * into a fully tracked affiliate link.
   */
  generateAffiliateUrl(sourceUrl: string, memberId?: string): string;

  /**
   * Parses and normalizes incoming source metadata.
   */
  parseSourceUrl(url: string): ProductLinkMetadata;
}
