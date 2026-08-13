import { MockProduct } from "@/lib/products/mockData";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: MockProduct[];
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  emptyMessage = "No archive finds match your current selection.",
}: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="w-full py-16 text-center border border-dashed border-neutral-200 bg-neutral-50/50 p-8">
        <p className="text-sm font-mono text-neutral-500 uppercase tracking-wider">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < 4}
        />
      ))}
    </div>
  );
}
