import fs from "fs/promises";
import path from "path";
import { IStorageProvider, StorageUploadResult } from "./StorageProvider";

export class LocalStorageProvider implements IStorageProvider {
  readonly name = "local-disk";
  private baseStorageDir: string;

  constructor(baseStorageDir?: string) {
    this.baseStorageDir = baseStorageDir || path.resolve(process.cwd(), "storage/products");
  }

  async saveAsset(
    productId: string,
    type: "original" | "cutout" | "final",
    filename: string,
    buffer: Buffer
  ): Promise<StorageUploadResult> {
    const targetDir = path.join(this.baseStorageDir, productId, type);
    await fs.mkdir(targetDir, { recursive: true });

    const filePath = path.join(targetDir, filename);
    await fs.writeFile(filePath, buffer);

    return {
      url: `/storage/products/${productId}/${type}/${filename}`,
      path: filePath,
      sizeBytes: buffer.length,
    };
  }

  getAssetPath(productId: string, type: "original" | "cutout" | "final", filename: string): string {
    return path.join(this.baseStorageDir, productId, type, filename);
  }
}
