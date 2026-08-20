"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";
import {
  X,
  Upload,
  Sparkles,
  Image as ImageIcon,
  Check,
  Loader2,
  DollarSign,
  Tag,
  Layers,
  ShoppingBag,
  ExternalLink,
  Zap,
  RotateCw,
  Scissors,
} from "lucide-react";

export interface Product {
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

interface EditProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProduct: Product) => void;
}

const POPULAR_BRANDS = [
  "Rick Owens",
  "Enfants Riches Déprimés",
  "Vetements",
  "Undercover",
  "Balenciaga",
  "Maison Margiela",
  "Chrome Hearts",
  "Number (N)ine",
  "Helmut Lang",
  "Raf Simons",
];

const POPULAR_CATEGORIES = [
  "Outerwear",
  "Tops",
  "Bottoms",
  "Footwear",
  "Accessories",
  "Bags",
  "Jewelry",
  "Headwear",
];

export function EditProductModal({
  product,
  isOpen,
  onClose,
  onSave,
}: EditProductModalProps) {
  if (!isOpen || !product) return null;

  const [title, setTitle] = useState(product.title || product.name || "");
  const [brand, setBrand] = useState(product.brand || "");
  const [category, setCategory] = useState(product.category || "Outerwear");
  const [price, setPrice] = useState(String(product.price || 0));
  const [estimatedRetail, setEstimatedRetail] = useState(
    String(product.estimatedRetail || "")
  );
  const [imageUrl, setImageUrl] = useState(
    product.imageUrl || product.localImage || ""
  );
  const [status, setStatus] = useState<"ACTIVE" | "DRAFT">(
    product.status === "DRAFT" ? "DRAFT" : "ACTIVE"
  );
  const [directStoreLink, setDirectStoreLink] = useState(
    product.directStoreLink || ""
  );
  const [sugargooUrl, setSugargooUrl] = useState(
    product.sugargooUrl || product.affiliateLink || ""
  );

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [removeBgOnUpload, setRemoveBgOnUpload] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("removeBg", removeBgOnUpload ? "true" : "false");
      formData.append("name", title || product.slug);

      const res = await fetch("/api/admin/products/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.imageUrl) {
        setImageUrl(data.imageUrl);
      } else {
        setErrorMsg(data.error || "Failed to upload image.");
      }
    } catch (err: any) {
      setErrorMsg("Image upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Product title is required.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    try {
      const parsedPrice = parseFloat(price) || 0;
      const parsedEstRetail = estimatedRetail ? parseFloat(estimatedRetail) : undefined;

      const payload = {
        id: product.id,
        slug: product.slug,
        action: "update",
        title: title.trim(),
        brand: brand.trim(),
        category: category.trim(),
        price: parsedPrice,
        estimatedRetail: parsedEstRetail,
        imageUrl: imageUrl.trim(),
        status,
        directStoreLink: directStoreLink.trim() || undefined,
        sugargooUrl: sugargooUrl.trim() || undefined,
      };

      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success && data.product) {
        onSave(data.product);
        onClose();
      } else {
        setErrorMsg(data.error || "Failed to save product changes.");
      }
    } catch (err: any) {
      setErrorMsg("Error saving changes: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
            <div>
              <h2 className="font-mono font-black text-sm uppercase tracking-widest text-white flex items-center gap-2">
                <span>AF // PRODUCT STUDIO EDITOR</span>
                <span className="px-2 py-0.5 bg-neutral-800 text-[10px] text-neutral-400 rounded">
                  ID: #{product.id}
                </span>
              </h2>
              <p className="text-[10px] font-mono text-neutral-400">
                Slug: {product.slug}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto font-sans">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs font-mono">
              {errorMsg}
            </div>
          )}

          {/* Grid Layout: Image Preview / Upload (Left) & Product Details (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column: Image Management (5 cols) */}
            <div className="md:col-span-5 space-y-4">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-bold">
                Studio Garment Cutout
              </label>

              {/* Current Image Display Box */}
              <div className="w-full aspect-square bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex items-center justify-center relative overflow-hidden group">
                <img
                  src={imageUrl || "/placeholder.png"}
                  alt={title}
                  className="max-h-full max-w-full object-contain filter drop-shadow-xl transition-transform group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.png";
                  }}
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-2 font-mono text-xs">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                    <span>Processing Cutout...</span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-mono uppercase font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-neutral-700 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Upload New Photo</span>
                </button>

                {/* Auto Cutout Option */}
                <label className="flex items-center gap-2 text-xs font-mono text-neutral-400 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={removeBgOnUpload}
                    onChange={(e) => setRemoveBgOnUpload(e.target.checked)}
                    className="rounded bg-neutral-950 border-neutral-800 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <Scissors className="w-3 h-3 text-emerald-400" />
                    Auto-Cutout Background (Transparent PNG)
                  </span>
                </label>

                {/* Direct Image URL fallback */}
                <div className="pt-2">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Or Direct Image URL / Path
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="/products/cutouts/item.png"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Text & Categorization Details (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              {/* Product Title / Name */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-bold mb-1.5">
                  Piece Name / Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Rick Owens Bauhaus Cargo Pants"
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm font-sans font-bold text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all"
                  required
                />
              </div>

              {/* Brand Selection */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-bold mb-1.5">
                  Designer / Brand
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Enfants Riches Déprimés"
                  className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono uppercase text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500"
                />
                {/* Brand Quick Pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {POPULAR_BRANDS.slice(0, 6).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBrand(b)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors cursor-pointer border ${
                        brand.toLowerCase() === b.toLowerCase()
                          ? "bg-amber-400/20 text-amber-300 border-amber-500/40 font-bold"
                          : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category & Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-bold mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-neutral-500"
                  >
                    {POPULAR_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Toggle */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-bold mb-1.5">
                    Store Visibility
                  </label>
                  <div className="flex items-center bg-neutral-950 border border-neutral-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setStatus("ACTIVE")}
                      className={`flex-1 py-1.5 text-xs font-mono uppercase font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                        status === "ACTIVE"
                          ? "bg-emerald-500 text-black shadow"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      <Zap className="w-3 h-3 fill-current" />
                      <span>Live</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("DRAFT")}
                      className={`flex-1 py-1.5 text-xs font-mono uppercase font-bold rounded-lg transition-colors cursor-pointer ${
                        status === "DRAFT"
                          ? "bg-amber-400 text-black shadow"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      <span>Draft / Pause</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Price & Est. Retail Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-bold mb-1.5">
                    Catalog Price ($ USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-xs">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="45.00"
                      className="w-full pl-7 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-neutral-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Est. Retail ($ USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 font-mono text-xs">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={estimatedRetail}
                      onChange={(e) => setEstimatedRetail(e.target.value)}
                      placeholder="650.00"
                      className="w-full pl-7 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-300 focus:outline-none focus:border-neutral-500"
                    />
                  </div>
                </div>
              </div>

              {/* Direct Links */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Direct Marketplace Link (Weidian / Taobao)
                  </label>
                  <input
                    type="url"
                    value={directStoreLink}
                    onChange={(e) => setDirectStoreLink(e.target.value)}
                    placeholder="https://weidian.com/item.html?itemId=..."
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Sugargoo Affiliate URL (Optional override)
                  </label>
                  <input
                    type="url"
                    value={sugargooUrl}
                    onChange={(e) => setSugargooUrl(e.target.value)}
                    placeholder="https://www.sugargoo.com/..."
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-neutral-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl text-xs font-mono uppercase font-bold transition-colors cursor-pointer border border-neutral-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-mono uppercase font-black tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save &amp; Apply Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
