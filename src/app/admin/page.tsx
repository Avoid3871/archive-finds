import { MOCK_PRODUCTS } from "@/lib/products/mockData";
import { formatPrice } from "@/lib/utils";
import { Layers, CheckCircle2, AlertCircle, FileSpreadsheet, Play, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const totalProducts = MOCK_PRODUCTS.length;
  const activeProducts = MOCK_PRODUCTS.length;
  const pendingJobs = 0;
  const activeSources = 3;

  return (
    <div className="space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-mono font-black uppercase tracking-wider text-white">
            SYSTEM DASHBOARD
          </h1>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            Status: Worker Online • Local DB Synced
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/sources"
            className="px-4 py-2 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>TRIGGER SCAN</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded">
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            Total Products
          </p>
          <p className="text-3xl font-mono font-black text-white mt-2">
            {totalProducts}
          </p>
        </div>

        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded">
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            Active in Catalog
          </p>
          <p className="text-3xl font-mono font-black text-emerald-400 mt-2">
            {activeProducts}
          </p>
        </div>

        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded">
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            Connected Sources
          </p>
          <p className="text-3xl font-mono font-black text-white mt-2">
            {activeSources}
          </p>
        </div>

        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded">
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            Pending Queue
          </p>
          <p className="text-3xl font-mono font-black text-neutral-400 mt-2">
            {pendingJobs}
          </p>
        </div>
      </div>

      {/* Recent Scanned Products Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-mono uppercase tracking-widest text-neutral-300">
            Recent Catalog Entries
          </h2>
          <Link
            href="/admin/products"
            className="text-xs font-mono text-neutral-400 hover:text-white uppercase tracking-wider"
          >
            View All →
          </Link>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Piece Name</th>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Affiliate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-300">
              {MOCK_PRODUCTS.slice(0, 5).map((p) => (
                <tr key={p.id} className="hover:bg-neutral-800/50">
                  <td className="py-3 px-4 font-semibold text-white">
                    {p.name}
                  </td>
                  <td className="py-3 px-4 uppercase">{p.brand}</td>
                  <td className="py-3 px-4 font-bold text-white">
                    {formatPrice(p.price, p.currency)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                      ACTIVE
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-400">
                    Sugargoo OK
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Diagnostics */}
      <div className="p-6 bg-neutral-900 border border-neutral-800 space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400">
          Architecture Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sugargoo Affiliate Engine Ready</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Python rembg CLI Bridge Configured</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>4-Tier Deduplication Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
