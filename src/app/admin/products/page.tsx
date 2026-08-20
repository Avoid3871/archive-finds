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
  Zap,
  Edit,
  Pencil,
  Upload,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { LiveSyncControl } from "@/components/admin/LiveSyncControl";
import { EditProductModal, Product } from "@/components/admin/EditProductModal";

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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
            ? `🟢 ${prod.title || prod.name} is now LIVE in store!`
            : `⏸ ${prod.title || prod.name} moved to DRAFT / PAUSED`
        );
      } else {
        showToast("error", data.error || "Failed to update status");
      }
    } catch (e: any) {
      showToast("error", "Error toggling status: " + e.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handlePublishAllDrafts = async () => {
    if (!confirm("Are you sure you want to publish ALL drafts to the LIVE store at once?")) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish-all-drafts" }),
      });
      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products);
        showToast("success", data.message || "All drafts published to live store!");
      } else {
        showToast("error", data.error || "Failed to publish all drafts");
      }
    } catch (e: any) {
      showToast("error", "Error publishing drafts: " + e.message);
    } finally {
      setLoading(false);
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
      if (data.success && data.updatedUrl) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === prod.id
              ? { ...p, imageUrl: data.updatedUrl, localImage: data.updatedUrl }
              : p
          )
        );
        showToast("success", `Rotated image 90° for ${prod.title || prod.name}`);
      } else {
        showToast("error", data.error || "Failed to rotate image");
      }
    } catch (e: any) {
      showToast("error", "Error rotating image: " + e.message);
    } finally {
      setRotatingId(null);
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete "${prod.title || prod.name}" from the catalog?`)) {
      return;
    }

    try {
      setDeletingId(prod.id);
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prod.id, slug: prod.slug }),
      });

      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products);
        showToast("success", `Deleted ${prod.title || prod.name}`);
      } else {
        showToast("error", data.error || "Failed to delete product");
      }
    } catch (e: any) {
      showToast("error", "Error deleting product: " + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSavedProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    showToast("success", `✨ Updated "${updated.title || updated.name}"! Synced to catalog.`);
  };

  // Compute Unique Brands & Categories
  const brands = Array.from(new Set(products.map((p) => p.brand))).filter(Boolean).sort();
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean).sort();

  const isProductLive = (p: Product) => p.status === "ACTIVE" || !p.status;

  const totalActive = products.filter(isProductLive).length;
  const totalDraft = products.filter((p) => p.status === "DRAFT").length;

  // Filter Products
  const filteredProducts = products.filter((p) => {
    const titleMatch = (p.title || p.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const brandMatch = (p.brand || "").toLowerCase().includes(searchQuery.toLowerCase());
    const categoryMatch = (p.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    const idMatch = String(p.id).includes(searchQuery);

    const matchesSearch = titleMatch || brandMatch || categoryMatch || idMatch;
    const matchesBrand = selectedBrand === "ALL" || p.brand === selectedBrand;
    const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;

    let matchesStatus = true;
    if (selectedStatus === "ACTIVE") {
      matchesStatus = isProductLive(p);
    } else if (selectedStatus === "DRAFT") {
      matchesStatus = p.status === "DRAFT";
    }

    return matchesSearch && matchesBrand && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 font-mono text-xs animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/80 text-emerald-200"
              : "bg-red-950/90 border-red-500/80 text-red-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={Boolean(editingProduct)}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSave={handleSavedProduct}
      />

      {/* Header & Sync Bar */}
      <LiveSyncControl />

      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-400 text-[10px] font-mono rounded">
              LIVE DATABASE
            </span>
            <span className="text-xs font-mono text-neutral-500">
              Sugargoo ID: 1325437696506389977
            </span>
          </div>
          <h1 className="font-mono font-black text-2xl uppercase tracking-widest text-white mt-1 flex items-center gap-3">
            <span>CATALOG PRODUCTS</span>
            <span className="text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 rounded text-sm">
              {products.length}
            </span>
          </h1>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            Verified database single source of truth (`sheetProducts.json`). Edit piece names, upload photos, and sync live.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchProducts}
            disabled={loading}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-mono uppercase flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/sources"
            className="px-3.5 py-2 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-mono uppercase font-bold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discover &amp; Ingest</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs: ALL vs LIVE vs DRAFTS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedStatus("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase font-bold transition-all cursor-pointer ${
              selectedStatus === "ALL"
                ? "bg-neutral-800 text-white border border-neutral-700 shadow"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            }`}
          >
            All Items ({products.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedStatus === "ACTIVE"
                ? "bg-emerald-950 text-emerald-300 border border-emerald-700 shadow"
                : "text-neutral-400 hover:text-emerald-400 hover:bg-neutral-900"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Live in Store ({totalActive})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("DRAFT")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedStatus === "DRAFT"
                ? "bg-amber-950 text-amber-300 border border-amber-700 shadow"
                : "text-neutral-400 hover:text-amber-400 hover:bg-neutral-900"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Drafts / Hidden ({totalDraft})</span>
          </button>
        </div>

        {totalDraft > 0 && (
          <button
            type="button"
            onClick={handlePublishAllDrafts}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-xs font-mono uppercase font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-transform active:scale-95 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-black" />
            <span>Publish All Drafts to Live ({totalDraft})</span>
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/80">
        {/* Search Input */}
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by piece title, brand, category, or ID..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
          />
        </div>

        {/* Brand Dropdown */}
        <div className="md:col-span-3">
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

        {/* Category Dropdown */}
        <div className="md:col-span-3">
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

      {/* Product Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/80 font-mono text-neutral-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-3 w-16 text-center">Studio</th>
                <th className="py-3 px-4">Piece &amp; Title</th>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4 text-center">Store Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400 font-mono">
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
                  const isLive = isProductLive(prod);

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

                      {/* Thumbnail with Edit Overlay */}
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(prod)}
                          title="Click to edit image & cutout"
                          className="w-12 h-12 bg-neutral-950 rounded-lg border border-neutral-800 p-1 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-emerald-500/60 transition-all"
                        >
                          <img
                            src={prod.imageUrl || prod.localImage}
                            alt={prod.title || prod.name}
                            className="max-h-full max-w-full object-contain filter drop-shadow group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.png";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-emerald-400">
                            <Pencil className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      </td>

                      {/* Title & Slug (Clickable to Edit) */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(prod)}
                          className="text-left font-bold text-white max-w-md truncate hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5 group"
                        >
                          <span>{prod.title || prod.name}</span>
                          <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-400 shrink-0" />
                        </button>
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

                      {/* Interactive Store Status Toggle Button */}
                      <td className="py-3 px-4 text-center">
                        {isLive ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(prod)}
                            disabled={isToggling}
                            title="Product is LIVE in store. Click to move to DRAFT / PAUSED"
                            className="px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold inline-flex items-center gap-1.5 transition-all border bg-emerald-950/70 hover:bg-neutral-900 text-emerald-400 border-emerald-800/80 hover:border-amber-500/60 hover:text-amber-400 group disabled:opacity-50 cursor-pointer"
                          >
                            {isToggling ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse group-hover:bg-amber-400" />
                                <span className="group-hover:hidden">🟢 LIVE</span>
                                <span className="hidden group-hover:inline">⏸ PAUSE / DRAFT</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(prod)}
                            disabled={isToggling}
                            title="Click to publish this piece directly to the LIVE store!"
                            className="px-3.5 py-1.5 rounded-lg font-mono text-[11px] font-black inline-flex items-center gap-1.5 transition-all bg-emerald-500 hover:bg-emerald-400 text-black border border-emerald-400 shadow-md shadow-emerald-500/25 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                          >
                            {isToggling ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Zap className="w-3.5 h-3.5 fill-black" />
                                <span>LIVE SCHALTEN ↗</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* EDIT PIECE & IMAGE BUTTON */}
                          <button
                            type="button"
                            onClick={() => setEditingProduct(prod)}
                            title="Edit Piece Name, Brand, Price & Upload Image"
                            className="p-1.5 bg-neutral-950 hover:bg-neutral-800 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 rounded transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Rotate Image Button */}
                          <button
                            type="button"
                            onClick={() => handleRotateImage(prod)}
                            disabled={isRotating}
                            title="Rotate Studio Cutout 90° Clockwise"
                            className="p-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded transition-colors disabled:opacity-50 cursor-pointer"
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
                            className="p-1.5 bg-neutral-950 hover:bg-red-950/80 border border-red-900/60 hover:border-red-500 text-red-400 hover:text-red-300 rounded transition-colors disabled:opacity-50 cursor-pointer"
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
