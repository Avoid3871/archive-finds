"use client";

import { useState, useRef, useEffect, ChangeEvent, FormEvent } from "react";
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
  Clipboard,
  Search,
  Undo2,
  Sliders,
  CheckCircle2,
  Key,
  Wand2,
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
  const [rawOriginalUrl, setRawOriginalUrl] = useState<string | null>(null);
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
  const [isCuttingOut, setIsCuttingOut] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [isSearchingPhotos, setIsSearchingPhotos] = useState(false);
  const [sellerPhotos, setSellerPhotos] = useState<string[]>([]);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [removeBgOnUpload, setRemoveBgOnUpload] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(""), 4000);
  };

  // 1. Global Clipboard Paste Listener (Ctrl + V)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await processUploadedFile(file, "Pasted from clipboard");
            return;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [removeBgOnUpload, title, product.slug]);

  // Upload processor for files and clipboard blobs
  const processUploadedFile = async (file: File, sourceLabel: string = "Uploaded") => {
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
        if (data.rawUrl) setRawOriginalUrl(data.rawUrl);
        showNotification(
          data.isCutout
            ? `✨ ${sourceLabel} & Studio background removed!`
            : `📸 ${sourceLabel} successfully!`
        );
      } else {
        setErrorMsg(data.error || "Failed to upload image.");
      }
    } catch (err: any) {
      setErrorMsg("Upload error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processUploadedFile(file, "Uploaded file");
    }
  };

  // 2. 1-Click Background Remover on Current Image
  const handleRemoveBackgroundCurrent = async () => {
    if (!imageUrl) return;

    setIsCuttingOut(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/products/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageSrc: imageUrl,
          removeBg: true,
          name: title || product.slug,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.imageUrl) {
        if (!rawOriginalUrl) setRawOriginalUrl(imageUrl);
        setImageUrl(data.imageUrl);
        showNotification("✨ Background removed! Studio cutout created.");
      } else {
        setErrorMsg(data.error || "Cutout failed.");
      }
    } catch (err: any) {
      setErrorMsg("Cutout error: " + err.message);
    } finally {
      setIsCuttingOut(false);
    }
  };

  // 3. Revert to Raw Original Image
  const handleRevertOriginalBackground = () => {
    if (rawOriginalUrl) {
      setImageUrl(rawOriginalUrl);
      showNotification("↺ Restored original photo background.");
    }
  };

  // 4. ✨ Gemini AI Studio Recreate
  const handleAiRecreate = async () => {
    setIsGeneratingAi(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/products/ai-recreate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          brand,
          category,
          imageSrc: imageUrl,
          apiKey: geminiApiKey.trim() || undefined,
          autoCutout: removeBgOnUpload,
        }),
      });

      const data = await res.json();

      if (data.needsApiKey) {
        setShowApiKeyInput(true);
        setErrorMsg("Please enter your Google Gemini API Key below to enable AI Studio generation.");
        return;
      }

      if (res.ok && data.success && data.imageUrl) {
        if (!rawOriginalUrl) setRawOriginalUrl(imageUrl);
        setImageUrl(data.imageUrl);
        setShowApiKeyInput(false);
        showNotification(data.message || "✨ Flawless Studio Flat-Lay generated with Gemini Imagen 3!");
      } else {
        setErrorMsg(data.error || "AI generation failed.");
      }
    } catch (err: any) {
      setErrorMsg("AI Generation error: " + err.message);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // 5. Fetch Seller / Studio Alternative Photos
  const handleFetchSellerPhotos = async () => {
    setIsSearchingPhotos(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/fetch-studio-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `${brand} ${title}`,
          marketUrl: directStoreLink || product.directStoreLink,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.images) && data.images.length > 0) {
        setSellerPhotos(data.images);
        setShowPhotoGallery(true);
        showNotification(`🔍 Found ${data.images.length} seller photos!`);
      } else {
        setErrorMsg("No alternative seller photos found for this link.");
      }
    } catch (err: any) {
      setErrorMsg("Photo fetch error: " + err.message);
    } finally {
      setIsSearchingPhotos(false);
    }
  };

  // Select a photo from the fetched gallery
  const handleSelectGalleryPhoto = async (photoUrl: string) => {
    setImageUrl(photoUrl);
    setRawOriginalUrl(photoUrl);
    setShowPhotoGallery(false);

    if (removeBgOnUpload) {
      setIsCuttingOut(true);
      try {
        const res = await fetch("/api/admin/products/upload-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageSrc: photoUrl,
            removeBg: true,
            name: title || product.slug,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.imageUrl) {
          setImageUrl(data.imageUrl);
          showNotification("✨ Seller photo imported & background removed!");
        }
      } catch {
        // keep raw
      } finally {
        setIsCuttingOut(false);
      }
    } else {
      showNotification("📸 Selected seller photo applied.");
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processUploadedFile(file, "Dropped image");
    }
  };

  // Save product form
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
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
            <div>
              <h2 className="font-mono font-black text-sm uppercase tracking-widest text-white flex items-center gap-2">
                <span>AF // PRODUCT STUDIO EDITOR</span>
                <span className="px-2 py-0.5 bg-neutral-800 text-[10px] text-neutral-400 rounded font-mono">
                  ID: #{product.id}
                </span>
              </h2>
              <p className="text-[10px] font-mono text-neutral-400">
                Slug: {product.slug} • Paste image via <strong className="text-white font-mono">Ctrl + V</strong> anywhere
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
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto font-sans">
          {/* Notifications */}
          {successNotice && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 rounded-xl text-xs font-mono flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successNotice}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-xs font-mono">
              {errorMsg}
            </div>
          )}

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Image Studio & AI Recreator (5 cols) */}
            <div className="lg:col-span-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 font-bold flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Garment Image Studio</span>
                </label>
                <span className="text-[10px] font-mono text-neutral-500">
                  Ctrl+V Active
                </span>
              </div>

              {/* Garment Preview Box with Drag & Drop */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full aspect-square bg-neutral-950 rounded-2xl p-4 flex items-center justify-center relative overflow-hidden group border-2 transition-all ${
                  isDragging
                    ? "border-emerald-400 bg-emerald-950/20 scale-[1.02]"
                    : "border-neutral-800"
                }`}
              >
                <img
                  src={imageUrl || "/placeholder.png"}
                  alt={title}
                  className="max-h-full max-w-full object-contain filter drop-shadow-xl transition-transform group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.png";
                  }}
                />

                {/* Loading Overlays */}
                {(isUploading || isCuttingOut || isGeneratingAi) && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-2.5 font-mono text-xs p-4 text-center">
                    <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
                    <span className="text-emerald-300 font-bold">
                      {isGeneratingAi
                        ? "✨ Generating Studio Flat-Lay (Imagen 3)..."
                        : isCuttingOut
                        ? "✂️ Removing Background (ONNX)..."
                        : "📸 Uploading & Processing..."}
                    </span>
                    {isGeneratingAi && (
                      <span className="text-[10px] text-neutral-400">
                        Synthesizing luxury editorial catalog shot
                      </span>
                    )}
                  </div>
                )}

                {/* Drop indicator */}
                {isDragging && (
                  <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-emerald-300 font-mono text-xs">
                    <Upload className="w-8 h-8 animate-bounce mb-2 text-emerald-400" />
                    <span>Drop Image Here</span>
                  </div>
                )}
              </div>

              {/* Gemini AI Recreate Button (Prominent) */}
              <button
                type="button"
                onClick={handleAiRecreate}
                disabled={isGeneratingAi || isUploading || isCuttingOut}
                title="Use Google Gemini / Imagen 3 to generate a pristine 4K editorial flat-lay studio photo of this piece"
                className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-purple-950/90 hover:from-purple-900 hover:to-indigo-900 text-purple-200 hover:text-white rounded-xl text-xs font-mono uppercase font-bold flex items-center justify-center gap-2 border border-purple-700/60 shadow-lg shadow-purple-950/40 transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingAi ? (
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 text-purple-400" />
                )}
                <span>✨ Gemini AI Studio Recreate</span>
              </button>

              {/* Inline API Key Drawer if requested */}
              {showApiKeyInput && (
                <div className="p-3 bg-neutral-950 border border-purple-800/80 rounded-xl space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-mono text-purple-300">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-purple-400" />
                      Google Gemini API Key
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowApiKeyInput(false)}
                      className="text-neutral-500 hover:text-white text-[10px]"
                    >
                      Close
                    </button>
                  </div>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAiRecreate}
                    className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
                  >
                    Save Key &amp; Generate Flat-Lay
                  </button>
                </div>
              )}

              {/* Action Buttons: Cutout & Revert */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleRemoveBackgroundCurrent}
                  disabled={isCuttingOut || isUploading || isGeneratingAi || !imageUrl}
                  title="Run local AI rembg background removal on this image"
                  className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-mono uppercase font-bold flex items-center justify-center gap-1.5 border border-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Scissors className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cutout BG</span>
                </button>

                <button
                  type="button"
                  onClick={handleRevertOriginalBackground}
                  disabled={!rawOriginalUrl || rawOriginalUrl === imageUrl}
                  title="Revert back to the original photo with full background"
                  className="py-2 px-3 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono uppercase font-bold flex items-center justify-center gap-1.5 border border-neutral-800 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Undo2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Raw Photo</span>
                </button>
              </div>

              {/* Upload File & Store Photos */}
              <div className="space-y-2.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept="image/*"
                  className="hidden"
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="py-2 px-3 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-mono uppercase font-bold flex items-center justify-center gap-1.5 border border-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Upload File</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFetchSellerPhotos}
                    disabled={isSearchingPhotos}
                    title="Fetch all high-res studio seller photos from Weidian Thor API & Taobao"
                    className="py-2 px-3 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-mono uppercase font-bold flex items-center justify-center gap-1.5 border border-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSearchingPhotos ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    ) : (
                      <Search className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>Store Photos</span>
                  </button>
                </div>

                {/* Auto Background Removal Switch */}
                <div className="p-2.5 bg-neutral-950 border border-neutral-800/90 rounded-xl flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-300 flex items-center gap-1.5 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Auto-Cutout on Upload / Paste</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={removeBgOnUpload}
                    onChange={(e) => setRemoveBgOnUpload(e.target.checked)}
                    className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                </div>

                {/* Gallery Dropdown if photos were fetched */}
                {showPhotoGallery && sellerPhotos.length > 0 && (
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <span>Select Seller Photo:</span>
                      <button
                        type="button"
                        onClick={() => setShowPhotoGallery(false)}
                        className="text-neutral-500 hover:text-white"
                      >
                        Close
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {sellerPhotos.map((pUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectGalleryPhoto(pUrl)}
                          className="aspect-square bg-neutral-900 border border-neutral-800 hover:border-emerald-400 rounded-lg p-1 overflow-hidden transition-all cursor-pointer group"
                        >
                          <img
                            src={pUrl}
                            alt={`Seller Photo ${idx}`}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct Image URL input */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                    Direct Image URL or Path
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="/products/cutouts/item.png"
                    className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Piece Details, Brand, Category, Pricing (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Product Title / Name */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 font-bold mb-1.5">
                  Piece Name / Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Comme des Garçons Ss03 Netting Tee"
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
                  placeholder="e.g. COMME DES GARÇONS"
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
              disabled={isSaving || isUploading || isCuttingOut || isGeneratingAi}
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
