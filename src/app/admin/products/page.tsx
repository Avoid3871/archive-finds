"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Trash2,
  RotateCw,
  Search,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertCircle,
  Tag,
  Layers,
  Sparkles,
  ShoppingBag,
  Eye,
  EyeOff,
  CloudUpload,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { LiveSyncControl } from "@/components/admin/LiveSyncControl";

interface Product {
  id: string;
  title: string;
  name?: string;
  brand: string;
  brandSlug: string;
  category: string;
  categorySlug: string;
  price: number;
  sourcePrice?: number;
  estimatedRetail?: number;
  directStoreLink?: string;
  sugargooUrl?: string;
  affiliateLink?: string;
  imageUrl: string;
  localImage?: string;
  slug: string;
  era?: string;
  status?: "ACTIVE" | "DRAFT" | "HIDDEN";
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "ACTIVE" | "DRAFT">("ALL");
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products);
      }
    } catch (e: any) {
      setToastMessage({ type: "error", text: "Failed to load products: " + e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleToggleStatus = async (prod: Product) => {
    const currentStatus = prod.status || "ACTIVE";
    const nextStatus = currentStatus === "DRAFT" ? "ACTIVE" : "DRAFT";

    try {
      setTogglingId(prod.id);
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: prod.id,
          action: "toggle-status",
          status: nextStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, status: nextStatus } : p))
        );
        showToast(
          "success",
          nextStatus === "ACTIVE"
            ? `✓ "${prod.title || prod.name}" is now LIVE in store!`
            : `⏸ "${prod.title || prod.name}" moved to DRAFT (hidden from public store)`
        );
      } else {
        showToast("error", data.error || "Failed to update status");
      }
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleRotateImage = async (prod: Product) => {
    try {
      setRotatingId(prod.id);
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: prod.id,
          action: "rotate",
          degrees: 90,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, imageUrl: data.updatedUrl } : p))
        );
        showToast("success", `Rotated image for "${prod.title || prod.name}" by 90°`);
      } else {
        showToast("error", data.error || "Failed to rotate image");
      }
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setRotatingId(null);
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    if (!window.confirm(`Are you sure you want to delete "${prod.title || prod.name}" from catalog?`)) {
      return;
    }

    try {
      setDeletingId(prod.id);
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prod.id }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== prod.id));
        showToast("success", `Deleted "${prod.title || prod.name}" successfully`);
      } else {
        showToast("error", data.error || "Failed to delete product");
      }
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Filter products
  const brands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).sort();
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort();

  const activeCount = products.filter((p) => (p.status || "ACTIVE") === "ACTIVE").length;
  const draftCount = products.filter((p) => p.status === "DRAFT").length;

  const filteredProducts = products.filter((p) => {
    const pStatus = p.status || "ACTIVE";
    if (selectedStatus !== "ALL" && pStatus !== selectedStatus) return false;
    if (selectedBrand !== "ALL" && p.brand !== selectedBrand) return false;
    if (selectedCategory !== "ALL" && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (p.title || p.name || "").toLowerCase().includes(q);
      const matchBrand = (p.brand || "").toLowerCase().includes(q);
      const matchCategory = (p.category || "").toLowerCase().includes(q);
      const matchId = (p.id || "").includes(q);
      if (!matchTitle && !matchBrand && !matchCategory && !matchId) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl border shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in slide-in-from-top-3 ${
          toastMessage.type === "success"
            ? "bg-neutral-900/95 border-emerald-500/50 text-emerald-400"
            : "bg-neutral-900/95 border-red-500/50 text-red-400"
        }`}>
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-mono text-xs font-bold text-white">{toastMessage.text}</span>
        </div>
      )}

      {/* 🚀 LIVE WEBSITE SYNC CONTROL BAR */}
      <LiveSyncControl onSyncSuccess={fetchProducts} />

      {/* Header with Live Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-white/10 text-white border border-white/20 text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-white" />
              Live Database
            </span>
            <span className="px-2 py-0.5 bg-neutral-900 text-neutral-400 border border-neutral-800 text-[10px] font-mono">
              Sugargoo ID: 1325437696506389977
            </span>
          </div>
          <h1 className="text-2xl font-mono font-black uppercase tracking-wider text-white flex items-center gap-3">
            <span>CATALOG PRODUCTS</span>
            <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-sm font-bold rounded">
              {products.length}
            </span>
          </h1>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            Verified database single source of truth (`sheetProducts.json`). Manage status (Live vs Draft), rotate images, and sync changes live.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-mono rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/admin/sources"
            className="px-4 py-2 bg-white text-black hover:bg-neutral-200 font-mono text-xs font-bold uppercase rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-white/10"
          >
            <Sparkles className="w-3.5 h-3.5 fill-black" />
            <span>Discover & Ingest</span>
          </Link>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setSelectedStatus("ALL")}
          className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider rounded-lg transition-all ${
            selectedStatus === "ALL"
              ? "bg-white text-black font-bold shadow"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
        >
          All Items ({products.length})
        </button>
        <button
          onClick={() => setSelectedStatus("ACTIVE")}
          className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all ${
            selectedStatus === "ACTIVE"
              ? "bg-emerald-500 text-black font-bold shadow"
              : "text-emerald-400 hover:bg-emerald-950/40"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>🟢 Live In Store ({activeCount})</span>
        </button>
        <button
          onClick={() => setSelectedStatus("DRAFT")}
          className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all ${
            selectedStatus === "DRAFT"
              ? "bg-amber-400 text-black font-bold shadow"
              : "text-amber-400 hover:bg-amber-950/40"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>⏸ Drafts / Hidden ({draftCount})</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by piece title, brand, category, or ID..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-300 focus:outline-none focus:border-neutral-500"
          >
            <option value="ALL">All Brands ({brands.length})</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-300 focus:outline-none focus:border-neutral-500"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4 w-16 text-center">Studio</th>
                <th className="py-3.5 px-4">Piece & Title</th>
                <th className="py-3.5 px-4">Brand</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4 text-center">Store Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-300">
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500 font-mono">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    Loading catalog database...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500 font-mono">
                    No products matched your search or filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod, idx) => {
                  const isRotating = rotatingId === prod.id;
                  const isToggling = togglingId === prod.id;
                  const isDeleting = deletingId === prod.id;
                  const isLive = (prod.status || "ACTIVE") === "ACTIVE";

                  const sugargooLink =
                    prod.sugargooUrl ||
                    prod.affiliateLink ||
                    (prod.directStoreLink
                      ? `https://www.sugargoo.com/products?productLink=${encodeURIComponent(prod.directStoreLink)}&memberId=1325437696506389977`
                      : "");

                  return (
                    <tr key={prod.id || idx} className="hover:bg-neutral-800/40 transition-colors">
                      {/* ID */}
                      <td className="py-3 px-4 text-center font-mono text-neutral-500 text-[11px]">
                        {prod.id}
                      </td>

                      {/* Thumbnail */}
                      <td className="py-2 px-3 text-center">
                        <div className="w-12 h-12 bg-neutral-950 rounded-lg border border-neutral-800 p-1 flex items-center justify-center relative overflow-hidden group">
                          <img
                            src={prod.imageUrl || prod.localImage}
                            alt={prod.title || prod.name}
                            className="max-h-full max-w-full object-contain filter drop-shadow"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.png";
                            }}
                          />
                        </div>
                      </td>

                      {/* Title & Slug */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-white max-w-md truncate">
                          {prod.title || prod.name}
                        </p>
                        <p className="text-[10px] text-neutral-500 font-mono truncate max-w-xs">
                          {prod.slug}
                        </p>
                      </td>

                      {/* Brand */}
                      <td className="py-3 px-4 uppercase text-neutral-300 font-medium">
                        {prod.brand}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-neutral-400">
                        <span className="px-2 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-[10px]">
                          {prod.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-bold text-white">
                        {formatPrice(prod.price, "USD")}
                        {prod.estimatedRetail && (
                          <span className="block text-[10px] font-normal text-neutral-500">
                            Est. Retail: ${prod.estimatedRetail}
                          </span>
                        )}
                      </td>

                      {/* Interactive Status Toggle Badge */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(prod)}
                          disabled={isToggling}
                          title={isLive ? "Click to move to DRAFT (hide from store)" : "Click to publish LIVE to store"}
                          className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold inline-flex items-center gap-1.5 transition-all border ${
                            isLive
                              ? "bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border-emerald-800 hover:border-emerald-500"
                              : "bg-amber-950/80 hover:bg-amber-900 text-amber-400 border-amber-800 hover:border-amber-500"
                          } disabled:opacity-50`}
                        >
                          {isToggling ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : isLive ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>🟢 LIVE</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span>⏸ DRAFT</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Rotate Image Button */}
                          <button
                            type="button"
                            onClick={() => handleRotateImage(prod)}
                            disabled={isRotating}
                            title="Rotate Studio Cutout 90° Clockwise"
                            className="p-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded transition-colors disabled:opacity-50"
                          >
                            <RotateCw className={`w-3.5 h-3.5 ${isRotating ? "animate-spin text-cyan-400" : ""}`} />
                          </button>

                          {/* Test Sugargoo Link */}
                          {sugargooLink && (
                            <a
                              href={sugargooLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Test Sugargoo Buy Link"
                              className="p-1.5 bg-neutral-950 hover:bg-neutral-800 border border-amber-500/40 text-amber-400 hover:text-amber-300 rounded transition-colors"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* View in Store */}
                          <Link
                            href={`/product/${prod.slug}`}
                            target="_blank"
                            title="View Public Store Page"
                            className="p-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white rounded transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          {/* Delete Product */}
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod)}
                            disabled={isDeleting}
                            title="Delete Product From Catalog"
                            className="p-1.5 bg-neutral-950 hover:bg-red-950/80 border border-red-900/60 hover:border-red-500 text-red-400 hover:text-red-300 rounded transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
