import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products/mockData";

export const dynamic = "force-dynamic";
export const revalidate = 10;

export async function GET() {
  try {
    const products = getAllProducts();
    
    return NextResponse.json(
      {
        success: true,
        count: products.length,
        updatedAt: new Date().toISOString(),
        products,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
