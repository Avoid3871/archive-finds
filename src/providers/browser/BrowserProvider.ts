export interface ScrapedProductPage {
  title?: string;
  price?: number;
  images: string[];
  finalUrl: string;
  cookies?: Record<string, string>;
}

export interface IBrowserProvider {
  readonly name: string;
  scrapePage(url: string): Promise<ScrapedProductPage>;
  close(): Promise<void>;
}
