import fs from "fs/promises";
import path from "path";

export interface ImageCompositionOptions {
  brandName: string;
  productName: string;
  price?: string | number;
  cutoutImagePath: string;
  outputImagePath: string;
}

export class ImageProcessor {
  /**
   * Generates a 1080x1920 (9:16) Editorial Archive Finds Post
   */
  static async composeEditorialPost(options: ImageCompositionOptions): Promise<{ success: boolean; outputPath: string }> {
    const { brandName, productName, price, cutoutImagePath, outputImagePath } = options;

    await fs.mkdir(path.dirname(outputImagePath), { recursive: true });

    // Dynamic import for sharp so worker runs gracefully
    let sharp: any;
    try {
      sharp = (await import("sharp")).default;
    } catch {
      // If sharp is not installed yet, write a placeholder
      console.warn("[ImageProcessor] sharp not available, copying cutout to final output");
      await fs.copyFile(cutoutImagePath, outputImagePath);
      return { success: true, outputPath: outputImagePath };
    }

    try {
      // 1. Create a 1080x1920 clean white canvas
      const width = 1080;
      const height = 1920;

      // 2. Load cutout and resize product maintaining aspect ratio
      const cutoutBuffer = await fs.readFile(cutoutImagePath);
      const resizedProduct = await sharp(cutoutBuffer)
        .resize({
          width: 860,
          height: 1000,
          fit: "inside",
          withoutEnlargement: false,
        })
        .toBuffer();

      const productMetadata = await sharp(resizedProduct).metadata();
      const productWidth = productMetadata.width || 800;
      const productHeight = productMetadata.height || 800;

      // Center the product vertically around y = 520 - 1520
      const productLeft = Math.round((width - productWidth) / 2);
      const productTop = Math.round((height - productHeight) / 2) + 40;

      // 3. Editorial SVG Typography Overlay
      const brandUpper = (brandName || "ARCHIVE PIECE").toUpperCase();
      const nameUpper = (productName || "").toUpperCase();
      const priceText = price ? `€${price}` : "";

      const svgOverlay = Buffer.from(`
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
          <style>
            .brand { font-family: 'Helvetica Neue', 'Arial', sans-serif; font-size: 52px; font-weight: 900; letter-spacing: 0.18em; fill: #0a0a0a; text-anchor: middle; }
            .name { font-family: 'Helvetica Neue', 'Arial', sans-serif; font-size: 32px; font-weight: 500; letter-spacing: 0.08em; fill: #525252; text-anchor: middle; }
            .price { font-family: 'Helvetica Neue', 'Arial', sans-serif; font-size: 36px; font-weight: 700; letter-spacing: 0.05em; fill: #0a0a0a; text-anchor: middle; }
            .footer-tag { font-family: 'Helvetica Neue', 'Arial', sans-serif; font-size: 28px; font-weight: 900; letter-spacing: 0.35em; fill: #0a0a0a; text-anchor: middle; }
            .sub-tag { font-family: 'Helvetica Neue', 'Arial', sans-serif; font-size: 18px; font-weight: 600; letter-spacing: 0.25em; fill: #a3a3a3; text-anchor: middle; }
            .divider { stroke: #e5e5e5; stroke-width: 2; }
          </style>

          <!-- Top Brand Header -->
          <text x="${width / 2}" y="240" class="brand">${escapeXml(brandUpper)}</text>
          <text x="${width / 2}" y="310" class="name">${escapeXml(nameUpper)}</text>
          ${priceText ? `<text x="${width / 2}" y="380" class="price">${escapeXml(priceText)}</text>` : ""}

          <!-- Subtle Line Frame -->
          <line x1="140" y1="440" x2="940" y2="440" class="divider" />

          <!-- Bottom Footer Brand Mark -->
          <line x1="140" y1="1720" x2="940" y2="1720" class="divider" />
          <text x="${width / 2}" y="1790" class="footer-tag">ARCHIVE FINDS</text>
          <text x="${width / 2}" y="1830" class="sub-tag">LINK IN BIO TO SOURCE</text>
        </svg>
      `);

      // 4. Composite final image
      await sharp({
        create: {
          width,
          height,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .composite([
          {
            input: resizedProduct,
            top: productTop,
            left: productLeft,
          },
          {
            input: svgOverlay,
            top: 0,
            left: 0,
          },
        ])
        .png({ quality: 95 })
        .toFile(outputImagePath);

      return { success: true, outputPath: outputImagePath };
    } catch (err: any) {
      console.error("[ImageProcessor] Failed to compose image:", err);
      throw err;
    }
  }
}

function escapeXml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
