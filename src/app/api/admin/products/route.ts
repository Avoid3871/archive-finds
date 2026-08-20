import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import util from "util";

const execFilePromise = util.promisify(execFile);
const SHEET_PRODUCTS_PATH = path.join(process.cwd(), "src", "lib", "products", "sheetProducts.json");
const PRODUCTS_DIR = path.join(process.cwd(), "public");

function readProducts() {
  if (!fs.existsSync(SHEET_PRODUCTS_PATH)) {
    return [];
  }
  const content = fs.readFileSync(SHEET_PRODUCTS_PATH, "utf-8");
  return JSON.parse(content);
}

function saveProducts(products: any[]) {
  fs.writeFileSync(SHEET_PRODUCTS_PATH, JSON.stringify(products, null, 2), "utf-8");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    const products = readProducts();
    return NextResponse.json({ success: true, count: products.length, products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id, slug } = await req.json();
    if (!id && !slug) {
      return NextResponse.json({ success: false, error: "Missing id or slug" }, { status: 400 });
    }

    let products = readProducts();
    const initialLen = products.length;
    
    const target = products.find((p: any) => p.id === id || p.slug === slug);
    products = products.filter((p: any) => p.id !== id && p.slug !== slug);

    if (products.length === initialLen) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    // Re-index remaining products
    products.forEach((p: any, idx: number) => {
      p.id = String(idx + 1);
    });

    saveProducts(products);

    return NextResponse.json({
      success: true,
      message: `Product ${target?.title || id} deleted successfully`,
      remainingCount: products.length,
      products
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, slug, action, degrees = 90 } = body;

    let products = readProducts();

    if (action === "publish-all-drafts") {
      let updatedCount = 0;
      products = products.map((p: any) => {
        if (p.status === "DRAFT" || !p.status) {
          updatedCount++;
          return { ...p, status: "ACTIVE" };
        }
        return p;
      });
      saveProducts(products);
      return NextResponse.json({
        success: true,
        message: `Successfully published all ${updatedCount} drafts to LIVE store!`,
        count: updatedCount,
        products,
      });
    }

    const prodIndex = products.findIndex((p: any) => p.id === id || p.slug === slug);

    if (prodIndex === -1) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const prod = { ...products[prodIndex] };

    // 1. Full Product Update Action
    if (action === "update") {
      if (body.title !== undefined) {
        prod.title = body.title;
        prod.name = body.title;
      }
      if (body.brand !== undefined) {
        prod.brand = body.brand;
        prod.brandSlug = slugify(body.brand);
      }
      if (body.category !== undefined) {
        prod.category = body.category;
        prod.categorySlug = slugify(body.category);
      }
      if (body.price !== undefined) {
        prod.price = typeof body.price === "number" ? body.price : parseFloat(body.price) || 0;
      }
      if (body.estimatedRetail !== undefined) {
        prod.estimatedRetail = typeof body.estimatedRetail === "number" ? body.estimatedRetail : parseFloat(body.estimatedRetail) || 0;
      }
      if (body.imageUrl !== undefined) {
        prod.imageUrl = body.imageUrl;
        prod.localImage = body.imageUrl;
      }
      if (body.status !== undefined) {
        prod.status = body.status;
      }
      if (body.sugargooUrl !== undefined) {
        prod.sugargooUrl = body.sugargooUrl;
        prod.affiliateLink = body.sugargooUrl;
      }
      if (body.directStoreLink !== undefined) {
        prod.directStoreLink = body.directStoreLink;
      }
      if (body.era !== undefined) {
        prod.era = body.era;
      }

      products[prodIndex] = prod;
      saveProducts(products);

      return NextResponse.json({
        success: true,
        message: `Product ${prod.title || prod.name} updated successfully!`,
        product: prod,
        products,
      });
    }

    // 2. Image Rotation Action
    if (action === "rotate") {
      const imgRelPath = prod.imageUrl || prod.localImage;
      if (!imgRelPath) {
        return NextResponse.json({ success: false, error: "No image found for product" }, { status: 400 });
      }

      const cleanImgPath = imgRelPath.split("?")[0].replace(/^\//, "");
      const fullImgPath = path.join(PRODUCTS_DIR, cleanImgPath);

      if (!fs.existsSync(fullImgPath)) {
        return NextResponse.json({ success: false, error: "Image file not found on disk" }, { status: 404 });
      }

      const rotateScript = `
from PIL import Image
import sys

img_path = sys.argv[1]
degrees = int(sys.argv[2])
img = Image.open(img_path)
rotated = img.rotate((360 - degrees) % 360, expand=True)
rotated.save(img_path)
print("SUCCESS")
`;
      const tempScriptPath = path.join(process.cwd(), "scratch", "rotate_runner.py");
      fs.writeFileSync(tempScriptPath, rotateScript, "utf-8");

      await execFilePromise("python", [tempScriptPath, fullImgPath, String(degrees)]);

      const timestamp = Date.now();
      const updatedUrl = `/${cleanImgPath}?t=${timestamp}`;
      prod.imageUrl = updatedUrl;
      prod.localImage = updatedUrl;
      products[prodIndex] = prod;
      saveProducts(products);

      return NextResponse.json({
        success: true,
        message: `Image rotated by ${degrees}°`,
        updatedUrl,
        product: prod,
        products
      });
    }

    // 3. Status Toggle Action
    if (action === "toggle-status" || action === "set-status") {
      const currentStatus = prod.status || "ACTIVE";
      const newStatus = body.status || (currentStatus === "DRAFT" ? "ACTIVE" : "DRAFT");
      prod.status = newStatus;
      products[prodIndex] = prod;
      saveProducts(products);

      return NextResponse.json({
        success: true,
        message: `Product ${prod.title || prod.name} is now ${newStatus}`,
        status: newStatus,
        product: prod,
        products
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
