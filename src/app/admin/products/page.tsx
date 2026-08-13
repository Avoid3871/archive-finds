import { MOCK_PRODUCTS } from "@/lib/products/mockData";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { ExternalLink, Check, AlertCircle } from "lucide-react";

export default function AdminProductsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-2xl font-mono font-black uppercase tracking-wider text-white">
            CATALOG PRODUCTS ({MOCK_PRODUCTS.length})
          </h1>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            Database single source of truth entries.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-neutral-900 border border-neutral-800 overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
            <tr>
              <th className="py-3.5 px-4">Piece</th>
              <th className="py-3.5 px-4">Brand</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Price</th>
              <th className="py-3.5 px-4">Era</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800 text-neutral-300">
            {MOCK_PRODUCTS.map((prod) => (
              <tr key={prod.id} className="hover:bg-neutral-800/40">
                <td className="py-3 px-4 font-semibold text-white">
                  {prod.name}
                </td>
                <td className="py-3 px-4 uppercase">{prod.brand}</td>
                <td className="py-3 px-4 text-neutral-400">{prod.category}</td>
                <td className="py-3 px-4 font-bold text-white">
                  {formatPrice(prod.price, prod.currency)}
                </td>
                <td className="py-3 px-4 text-neutral-400">{prod.era}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                    ACTIVE
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <Link
                    href={`/product/${prod.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
