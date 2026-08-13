export interface StorageUploadResult {
  url: string;
  path: string;
  sizeBytes: number;
}

export interface IStorageProvider {
  readonly name: string;
  saveAsset(productId: string, type: "original" | "cutout" | "final", filename: string, buffer: Buffer): Promise<StorageUploadResult>;
  getAssetPath(productId: string, type: "original" | "cutout" | "final", filename: string): string;
}
