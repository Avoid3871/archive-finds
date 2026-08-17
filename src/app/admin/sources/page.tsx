"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  Play,
  Flame,
  ExternalLink,
  Sparkles,
  Scissors,
  Check,
  X,
  AlertCircle,
  Link as LinkIcon,
  ShieldCheck,
  SlidersHorizontal,
  AlertTriangle,
  AlertOctagon,
  Edit3,
  Trash2,
  Search,
  Terminal,
  Square,
  CheckSquare,
  Activity,
  ChevronDown,
  ChevronUp,
  Copy,
  Zap,
  Camera,
  Layers,
  Upload,
  Clipboard,
  ImagePlus,
  FileUp,
} from "lucide-react";
import Image from "next/image";

interface DiscoveredItem {
  id: string;
  title: string;
  brand: string;
  category: string;
  sourcePrice: number;
  estimatedRetail: number;
  sugargooUrl: string;
  affiliateLink: string;
  rawMarketUrl: string;
  redditPostUrl: string;
  localImage: string;
  imageUrl?: string;
  slug: string;
  status: string;
  rawImageSrc: string;
  season?: string;
}

interface SheetSource {
  id: string;
  name: string;
  spreadsheetId: string;
  sheetName: string;
  itemsCount: number;
  lastScanned: string;
  status: "ACTIVE" | "IDLE" | "SCANNING";
}

interface HealthItem {
  id: string;
  title: string;
  brand: string;
  slug?: string;
  sugargooUrl?: string;
  affiliateUrl?: string;
  directLink?: string;
  directStoreLink?: string;
  imageUrl?: string;
  status: "HEALTHY" | "DEAD" | "FLAGGED";
  httpStatus?: number | null;
  statusCode?: number | null;
  delistedReason?: string | null;
  message?: string;
  note?: string;
  testedAt?: string;
}

interface HealthReport {
  lastAudit?: string;
  timestamp?: string;
  totalChecked: number;
  healthyCount: number;
  deadCount: number;
  flaggedCount: number;
  items: HealthItem[];
}

const POPULAR_BRANDS = [
  "Rick Owens",
  "Maison Margiela",
  "Chrome Hearts",
  "Balenciaga",
  "Enfants Riches Déprimés",
  "Undercover",
  "Raf Simons",
  "Carol Christian Poell",
  "Acne Studios",
  "Kapital",
  "Vivienne Westwood",
  "Yohji Yamamoto",
  "Vetements",
  "Helmut Lang",
  "Number (N)ine",
  "Saint Laurent",
  "Prada",
  "Dior Homme",
  "Bottega Veneta",
];

const CATEGORIES = [
  "Outerwear",
  "Hoodies",
  "T-Shirts",
  "Denim",
  "Pants",
  "Footwear",
  "Accessories",
  "Bags",
  "Jewelry",
];

const INITIAL_SOURCES: SheetSource[] = [
  {
    id: "src-1",
    name: "Archive Finds Main Collector Feed",
    spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    sheetName: "Sheet1",
    itemsCount: 106,
    lastScanned: "Just now",
    status: "ACTIVE",
  },
];

function getProxiedImageUrl(src?: string): string {
  if (!src) return "";
  if (src.startsWith("/") || src.startsWith("data:")) return src;
  if (src.includes("docs.google.com/sheets-images-rt") || src.includes("googleusercontent.com")) {
    return `/api/admin/sheet-image-proxy?url=${encodeURIComponent(src)}`;
  }
  return src;
}

export default function AdminSourcesPage() {
  const [activeTab, setActiveTab] = useState<"reddit" | "quick-ingest" | "health" | "sheets">("reddit");
  
  // Reddit Scanner Live Progress States
  const [isScanningReddit, setIsScanningReddit] = useState(false);
  const [scanLimit, setScanLimit] = useState(10);
  const [autoApprove, setAutoApprove] = useState(false);
  const [scanProgress, setScanProgress] = useState<{
    percent: number;
    message: string;
    current: number;
    total: number;
    foundCount: number;
    phase: string;
    item?: string;
  }>({
    percent: 0,
    message: "Crawler Ready",
    current: 0,
    total: 10,
    foundCount: 0,
    phase: "IDLE",
  });
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [showLiveTerminal, setShowLiveTerminal] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [discoveredItems, setDiscoveredItems] = useState<DiscoveredItem[]>([]);
  const [approvingSlug, setApprovingSlug] = useState<string | null>(null);

  // Review & Edit Ingest Modal State
  const [editingItem, setEditingItem] = useState<DiscoveredItem | null>(null);
  const [editRotation, setEditRotation] = useState<number>(0);
  const [editFormData, setEditFormData] = useState({
    title: "",
    brand: "Rick Owens",
    category: "Outerwear",
    season: "",
    price: 59.0,
    estimatedRetail: 650.0,
    tags: "archive, grail",
    rawMarketUrl: "",
  });

  // Alternate Studio Photos & AI Cutout State
  const [alternateImages, setAlternateImages] = useState<string[]>([]);
  const [isFetchingImages, setIsFetchingImages] = useState<boolean>(false);
  const [isApplyingCutout, setIsApplyingCutout] = useState<boolean>(false);
  const [selectedCutoutModel, setSelectedCutoutModel] = useState<string>("isnet-general-use");
  const [isAutoIdentifyingTitle, setIsAutoIdentifyingTitle] = useState<boolean>(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>("");
  const [customImageUrlInput, setCustomImageUrlInput] = useState<string>("");
  const [imageSearchQuery, setImageSearchQuery] = useState<string>("");

  const [ingestModalProgress, setIngestModalProgress] = useState<{
    isIngesting: boolean;
    percent: number;
    phase: "IDLE" | "PREPARING" | "AFFILIATE" | "WRITING_DB" | "SUCCESS" | "ERROR";
    message: string;
    logs: string[];
    ingestedSlug?: string;
  }>({
    isIngesting: false,
    percent: 0,
    phase: "IDLE",
    message: "",
    logs: [],
  });

  const [successToast, setSuccessToast] = useState<{ title: string; slug: string; imageUrl?: string } | null>(null);

  const closeModal = () => {
    setEditingItem(null);
    try {
      sessionStorage.removeItem("active_ingested_modal");
    } catch (e) {}
  };

  const handleAIIdentifyModel = async () => {
    if (!editFormData.title && !editingItem?.title) return;
    setIsAutoIdentifyingTitle(true);
    try {
      const query = `${editFormData.brand || editingItem?.brand || ""} ${editFormData.title || editingItem?.title || ""}`;
      const marketUrl = editFormData.rawMarketUrl || editingItem?.rawMarketUrl || (editingItem as any)?.directStoreLink || "";
      const res = await fetch("/api/admin/identify-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, marketUrl }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const canonical = data.data.canonicalTitle || "";
        const cleanTitle = canonical.replace(new RegExp(`^${data.data.brand || editFormData.brand}\\s*-\\s*`, "i"), "").trim();
        setEditFormData((prev) => ({
          ...prev,
          title: cleanTitle || canonical || prev.title,
          brand: data.data.brand && data.data.brand !== "Archive Collection" ? data.data.brand : prev.brand,
          category: data.data.category || prev.category,
          season: data.data.season || prev.season || "",
          price: data.data.sourcePrice || prev.price,
          estimatedRetail: data.data.estimatedRetail || prev.estimatedRetail,
        }));
      }
    } catch (err) {
      console.error("AI Identify failed:", err);
    } finally {
      setIsAutoIdentifyingTitle(false);
    }
  };

  // Restore success toast & modal across Fast Refresh / page reloads
  useEffect(() => {
    try {
      const savedToast = sessionStorage.getItem("last_ingested_grail");
      if (savedToast) {
        setSuccessToast(JSON.parse(savedToast));
      }
      const savedModal = sessionStorage.getItem("active_ingested_modal");
      if (savedModal) {
        const parsed = JSON.parse(savedModal);
        if (parsed?.editingItem) {
          setEditingItem(parsed.editingItem);
          setEditFormData(parsed.editFormData || {
            title: parsed.editingItem.title,
            brand: parsed.editingItem.brand,
            category: parsed.editingItem.category,
            price: parsed.editingItem.sourcePrice || 50,
            estimatedRetail: parsed.editingItem.estimatedRetail || 400,
            tags: "archive, grail",
            rawMarketUrl: parsed.editingItem.rawMarketUrl || "",
          });
          setIngestModalProgress({
            isIngesting: false,
            percent: 100,
            phase: "SUCCESS",
            message: "✓ Successfully Ingested! Piece is now live in your public store.",
            logs: [
              `[1/4] Preparing product: "${parsed.editingItem.brand} - ${parsed.editingItem.title}"`,
              `[2/4] Generated Sugargoo affiliate link with member ID 1325437696506389977`,
              `[3/4] Persisting piece to catalog database...`,
              `[4/4] Ingest complete! Product is active in catalog.`,
            ],
            ingestedSlug: parsed.actualSlug,
          });
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, []);

  const handleDismissToast = () => {
    setSuccessToast(null);
    try {
      sessionStorage.removeItem("last_ingested_grail");
    } catch (e) {}
  };


  const abortControllerRef = useRef<AbortController | null>(null);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll terminal log to bottom
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [liveLogs, autoScroll]);

  const fetchAlternativeImages = async (query: string, marketUrl: string) => {
    if (!query && !marketUrl) return;
    setIsFetchingImages(true);
    try {
      const res = await fetch("/api/admin/fetch-studio-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, marketUrl }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.images) && data.images.length > 0) {
        setAlternateImages(data.images);
      }
    } catch (err) {
      console.error("Failed to fetch alternative images", err);
    } finally {
      setIsFetchingImages(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleApplyAlternateImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleClipboardPasteImage = async () => {
    try {
      if (navigator.clipboard?.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          const imageType = item.types.find((type) => type.startsWith("image/"));
          if (imageType) {
            const blob = await item.getType(imageType);
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              if (dataUrl) {
                handleApplyAlternateImage(dataUrl);
              }
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
      // Fallback: check text for direct URL
      const text = await navigator.clipboard.readText();
      if (text && (text.startsWith("http") || text.startsWith("data:image"))) {
        setCustomImageUrlInput(text);
        handleApplyAlternateImage(text);
      }
    } catch (err) {
      console.warn("Clipboard paste access denied or empty", err);
    }
  };

  const handleDropImage = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) {
            handleApplyAlternateImage(dataUrl);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Global window paste listener for modal
  useEffect(() => {
    if (!editingItem) return;
    const handleWindowPaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA";
      
      // If user pasted image data anywhere (even if typing in input), prioritize image cutout if it's an image
      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.indexOf("image") !== -1) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                if (dataUrl) {
                  handleApplyAlternateImage(dataUrl);
                }
              };
              reader.readAsDataURL(file);
            }
            return;
          }
        }
      }
    };

    window.addEventListener("paste", handleWindowPaste);
    return () => {
      window.removeEventListener("paste", handleWindowPaste);
    };
  }, [editingItem, selectedCutoutModel, selectedImageSrc]);

  const handleApplyAlternateImage = async (imageSrc?: string, modelOverride?: string) => {
    if (!editingItem) return;
    const targetSrc = imageSrc || selectedImageSrc || editingItem.rawImageSrc || editingItem.imageUrl || editingItem.localImage;
    if (!targetSrc) return;
    const modelToUse = modelOverride || selectedCutoutModel;
    if (modelOverride) {
      setSelectedCutoutModel(modelOverride);
    }
    setIsApplyingCutout(true);
    setSelectedImageSrc(targetSrc);
    try {
      const res = await fetch("/api/admin/cutout-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageSrc: targetSrc, rotation: 0, model: modelToUse }),
      });
      const data = await res.json();
      if (data.success && data.localCutoutUrl) {
        setEditingItem((prev) =>
          prev
            ? {
                ...prev,
                imageUrl: data.localCutoutUrl,
                localImage: data.localCutoutUrl,
                rawImageSrc: targetSrc,
              }
            : null
        );
      }
    } catch (err) {
      console.error("Failed to generate cutout preview", err);
    } finally {
      setIsApplyingCutout(false);
    }
  };

  const openReviewModal = (item: DiscoveredItem) => {
    setEditingItem(item);
    setEditRotation(0);
    setSelectedCutoutModel("isnet-general-use");
    const cleanTitle = item.title
      .replace(/^(can\s+(these|this|they|it)\s+(be|look)?\s*(close\s+to|like|good|accurate)?|is\s+this\s+(close\s+to|accurate|legit|real)|are\s+these\s+(close\s+to|accurate|legit|real)|how\s+do\s+these\s+look|thoughts\s+on(\s+this|\s+these)?|qc\s+on|review\s+on)\s*/i, "")
      .replace(new RegExp(`^${item.brand}\\s*-\\s*`, "i"), "")
      .trim();
    const brandTitle = cleanTitle.toLowerCase().startsWith((item.brand || "").toLowerCase())
      ? cleanTitle
      : `${item.brand || ""} ${cleanTitle}`.trim();
    setEditFormData({
      title: cleanTitle || item.title,
      brand: item.brand || "Maison Margiela",
      category: item.category || "Outerwear",
      season: item.season || "",
      price: item.sourcePrice || 50,
      estimatedRetail: item.estimatedRetail || (item.sourcePrice ? Math.round(item.sourcePrice * 8.5) : 450),
      tags: "archive, grail",
      rawMarketUrl: item.rawMarketUrl || "",
    });
    setSelectedImageSrc(item.imageUrl || item.localImage || item.rawImageSrc || "");
    setCustomImageUrlInput("");
    setImageSearchQuery(brandTitle);
    setAlternateImages([]);
    setIngestModalProgress({
      isIngesting: false,
      percent: 0,
      phase: "IDLE",
      message: "",
      logs: [],
    });

    // Proactively fetch alternative studio images in background
    fetchAlternativeImages(brandTitle, item.rawMarketUrl || "");

    // Proactively fetch exact live Sugargoo price if from a marketplace link
    if (item.rawMarketUrl && (!item.sourcePrice || item.sourcePrice === 48 || item.sourcePrice === 50)) {
      fetch("/api/admin/identify-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: brandTitle, marketUrl: item.rawMarketUrl }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.sourcePrice) {
            setEditFormData((prev) => ({
              ...prev,
              season: data.data.season || prev.season,
              price: data.data.sourcePrice,
              estimatedRetail: data.data.estimatedRetail || prev.estimatedRetail,
            }));
          }
        })
        .catch(() => {});
    }
  };

  const handleConfirmIngest = async () => {
    if (!editingItem) return;

    setIngestModalProgress({
      isIngesting: true,
      percent: 20,
      phase: "PREPARING",
      message: "Validating metadata & preparing high-resolution studio assets...",
      logs: [
        `[1/4] Preparing product: "${editFormData.brand} - ${editFormData.title}"`,
        `[1/4] Category: ${editFormData.category} | Price: $${editFormData.price}${editFormData.season ? ` | Season: ${editFormData.season}` : ""}`,
        editRotation !== 0 ? `[1/4] Applying ${editRotation}° studio image rotation...` : `[1/4] Image orientation: Standard (0°)`,
      ],
    });

    try {
      await new Promise((r) => setTimeout(r, 600));

      setIngestModalProgress((prev) => ({
        ...prev,
        percent: 45,
        phase: "AFFILIATE",
        message: "Binding Sugargoo VIP Affiliate ID: 1325437696506389977...",
        logs: [
          ...prev.logs,
          `[2/4] Direct store link: ${editFormData.rawMarketUrl || editingItem.rawMarketUrl}`,
          `[2/4] Generated Sugargoo affiliate link with member ID 1325437696506389977`,
        ],
      }));

      await new Promise((r) => setTimeout(r, 600));

      setIngestModalProgress((prev) => ({
        ...prev,
        percent: 75,
        phase: "WRITING_DB",
        message: "Writing to Public Store Catalog (sheetProducts.json)...",
        logs: [
          ...prev.logs,
          `[3/4] Persisting piece to catalog database...`,
          `[3/4] Generating 9:16 social slide assets...`,
        ],
      }));

      const res = await fetch("/api/admin/ingest-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: editFormData.rawMarketUrl || editingItem.rawMarketUrl,
          brand: editFormData.brand,
          title: editFormData.title,
          category: editFormData.category,
          season: editFormData.season,
          price: editFormData.price,
          estimatedRetail: editFormData.estimatedRetail,
          rawImageSrc: editingItem.rawImageSrc,
          localImage: editingItem.localImage || editingItem.imageUrl,
          rotation: editRotation,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Remove from moderation queue
        const params = new URLSearchParams({
          slug: editingItem.slug,
          rawMarketUrl: editingItem.rawMarketUrl || "",
          redditPostUrl: editingItem.redditPostUrl || "",
        });
        await fetch(`/api/admin/reddit-scanner?${params.toString()}`, {
          method: "DELETE",
        });

        // Optimistically remove from state
        setDiscoveredItems((prev) => prev.filter((i) => i.slug !== editingItem.slug));
        
        const actualSlug = data.slug || editingItem.slug;
        const toastItem = {
          title: `${editFormData.brand} - ${editFormData.title}`,
          slug: actualSlug,
          imageUrl: data.imageUrl || editingItem.localImage || editingItem.imageUrl,
        };
        setSuccessToast(toastItem);
        try {
          sessionStorage.setItem("last_ingested_grail", JSON.stringify(toastItem));
          sessionStorage.setItem(
            "active_ingested_modal",
            JSON.stringify({
              editingItem,
              editFormData,
              actualSlug,
              imageUrl: data.imageUrl || editingItem.localImage || editingItem.imageUrl,
            })
          );
        } catch (e) {}

        setIngestModalProgress((prev) => ({
          ...prev,
          isIngesting: false,
          percent: 100,
          phase: "SUCCESS",
          message: "✓ Successfully Ingested! Piece is now live in your public store.",
          logs: [
            ...prev.logs,
            `[4/4] Ingest complete! Product is active in catalog.`,
          ],
          ingestedSlug: actualSlug,
        }));

      } else {
        setIngestModalProgress((prev) => ({
          ...prev,
          isIngesting: false,
          phase: "ERROR",
          message: `Ingestion failed: ${data.error}`,
          logs: [...prev.logs, `[ERROR] ${data.error}`],
        }));
      }
    } catch (e: any) {
      setIngestModalProgress((prev) => ({
        ...prev,
        isIngesting: false,
        phase: "ERROR",
        message: `Network error: ${e.message}`,
        logs: [...prev.logs, `[ERROR] ${e.message}`],
      }));
    }
  };


  // Quick Ingest States
  const [ingestUrl, setIngestUrl] = useState("");
  const [ingestBrand, setIngestBrand] = useState("Rick Owens");
  const [ingestTitle, setIngestTitle] = useState("");
  const [ingestCategory, setIngestCategory] = useState("Outerwear");
  const [ingestPrice, setIngestPrice] = useState("65");
  const [ingestImage, setIngestImage] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [ingestMessage, setIngestMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Link Health States
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [isAuditingHealth, setIsAuditingHealth] = useState(false);
  const [healthAuditProgress, setHealthAuditProgress] = useState<{
    isAuditing: boolean;
    percent: number;
    current: number;
    total: number;
    item: string;
    healthy: number;
    dead: number;
    flagged: number;
    message: string;
  }>({
    isAuditing: false,
    percent: 0,
    current: 0,
    total: 0,
    item: "",
    healthy: 0,
    dead: 0,
    flagged: 0,
    message: "",
  });
  const [healthFilter, setHealthFilter] = useState<"all" | "dead" | "flagged" | "healthy">("all");
  const [healthSearch, setHealthSearch] = useState("");
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null);
  const [newUrlInput, setNewUrlInput] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Google Sheets States
  const [sources, setSources] = useState<SheetSource[]>(INITIAL_SOURCES);
  const [newName, setNewName] = useState("");
  const [newSheetId, setNewSheetId] = useState("");
  const [newTab, setNewTab] = useState("Sheet1");

  // Google Sheets Scanner States
  const [sheetUrlInput, setSheetUrlInput] = useState("https://docs.google.com/spreadsheets/d/1tA1QwceEtsyzXtUN6mHewhuTdoSaOKIaTL9PqGotKsI/");
  const [selectedSheetTab, setSelectedSheetTab] = useState<string>("ALL");
  const [sheetLimit, setSheetLimit] = useState(25);
  const [validateSheetLinks, setValidateSheetLinks] = useState(true);
  const [isScanningSheet, setIsScanningSheet] = useState(false);
  const [sheetScanProgress, setSheetScanProgress] = useState<{
    percent: number;
    message: string;
    current: number;
    total: number;
    foundCount: number;
    deadCount: number;
    phase: string;
    item?: string;
  }>({
    percent: 0,
    message: "Google Sheet Scanner Ready",
    current: 0,
    total: 25,
    foundCount: 0,
    deadCount: 0,
    phase: "IDLE",
  });
  const [sheetLiveLogs, setSheetLiveLogs] = useState<string[]>([]);
  const [showSheetTerminal, setShowSheetTerminal] = useState(true);
  const [discoveredSheetItems, setDiscoveredSheetItems] = useState<DiscoveredItem[]>([]);
  const [selectedSheetItemIds, setSelectedSheetItemIds] = useState<Set<string>>(new Set());
  const [sheetStats, setSheetStats] = useState<{
    queueCount: number;
    deadCount: number;
    ingestedCount: number;
    skippedCount: number;
    totalRegistry: number;
  }>({
    queueCount: 0,
    deadCount: 0,
    ingestedCount: 0,
    skippedCount: 0,
    totalRegistry: 0,
  });
  const [isBatchIngesting, setIsBatchIngesting] = useState(false);
  const [sheetFilter, setSheetFilter] = useState<string>("ALL");
  const [sheetSearch, setSheetSearch] = useState("");
  const [sheetActionLoadingId, setSheetActionLoadingId] = useState<string | null>(null);
  const sheetAbortControllerRef = useRef<AbortController | null>(null);

  // Fetch cached data on load
  useEffect(() => {
    fetchDiscovered();
    fetchHealthReport();
    fetchDiscoveredSheet();
  }, []);

  const fetchDiscoveredSheet = async () => {
    try {
      const res = await fetch("/api/admin/sheet-scanner");
      const data = await res.json();
      if (data.items) {
        setDiscoveredSheetItems(data.items);
      }
      if (data.stats) {
        setSheetStats(data.stats);
      }
    } catch (e) {
      console.error("Failed to load sheet queue:", e);
    }
  };

  const handleScanSheet = async () => {
    setIsScanningSheet(true);
    setSheetLiveLogs([]);
    setSheetScanProgress({
      percent: 3,
      message: "Connecting to Google Sheet & discovering tabs...",
      current: 0,
      total: sheetLimit,
      foundCount: 0,
      deadCount: 0,
      phase: "INIT",
    });

    const controller = new AbortController();
    sheetAbortControllerRef.current = controller;

    try {
      const res = await fetch("/api/admin/sheet-scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetUrl: sheetUrlInput,
          limit: sheetLimit,
          tabs: selectedSheetTab === "ALL" ? [] : [selectedSheetTab],
          validateLinks: validateSheetLinks,
        }),
        signal: controller.signal,
      });

      if (!res.body) {
        throw new Error("ReadableStream not supported on this browser.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.substring(6));
              if (event.type === "log") {
                setSheetLiveLogs((prev) => [...prev, event.text]);
              } else if (event.type === "progress") {
                setSheetScanProgress((prev) => ({
                  ...prev,
                  percent: event.data.percent ?? prev.percent,
                  message: `Found ${event.data.foundCount} healthy grails (${event.data.deadCount || 0} dead filtered)`,
                  current: event.data.current ?? prev.current,
                  total: event.data.total ?? prev.total,
                  foundCount: event.data.foundCount ?? prev.foundCount,
                  deadCount: event.data.deadCount ?? prev.deadCount,
                  phase: event.data.phase ?? prev.phase,
                  item: event.data.item ?? prev.item,
                }));
              } else if (event.type === "complete") {
                if (event.result && event.result.items) {
                  setSheetScanProgress((prev) => ({
                    ...prev,
                    percent: 100,
                    message: `✓ Ingested ${event.result.newFound} healthy grails into queue (${event.result.deadFiltered || 0} dead filtered)!`,
                    phase: "COMPLETE",
                  }));
                }
              }
            } catch (err) {
              console.warn("Error parsing SSE line:", err);
            }
          }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setSheetLiveLogs((prev) => [...prev, `[ERROR] Extraction failed: ${e.message}`]);
      }
    } finally {
      setIsScanningSheet(false);
      fetchDiscoveredSheet();
    }
  };

  const handleDismissSheetItem = async (id: string, rawMarketUrl: string, action: "dismiss" | "blacklist" = "dismiss") => {
    setSheetActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/sheet-scanner?id=${id}&rawMarketUrl=${encodeURIComponent(rawMarketUrl)}&action=${action}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setDiscoveredSheetItems((prev) => prev.filter((it) => it.id !== id));
        setSelectedSheetItemIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        fetchDiscoveredSheet();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSheetActionLoadingId(null);
    }
  };

  const handleBatchIngestSelectedSheets = async () => {
    const selectedItems = discoveredSheetItems.filter((it) => selectedSheetItemIds.has(it.id));
    if (selectedItems.length === 0) return;

    setIsBatchIngesting(true);
    try {
      const res = await fetch("/api/admin/sheet-scanner/batch-ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: selectedItems }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessToast({
          title: `Batch Ingested ${selectedItems.length} Pieces to Live Store!`,
          slug: "",
          imageUrl: selectedItems[0]?.imageUrl || "",
        });
        setSelectedSheetItemIds(new Set());
        fetchDiscoveredSheet();
      } else {
        alert(`Batch Ingest failed: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Network error: ${e.message}`);
    } finally {
      setIsBatchIngesting(false);
    }
  };

  const handleQuickIngestSingleSheet = async (item: DiscoveredItem) => {
    setSheetActionLoadingId(item.id);
    try {
      const res = await fetch("/api/admin/sheet-scanner/batch-ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [item] }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessToast({
          title: item.title,
          slug: item.slug || "",
          imageUrl: item.imageUrl || item.localImage || "",
        });
        setDiscoveredSheetItems((prev) => prev.filter((it) => it.id !== item.id));
        fetchDiscoveredSheet();
      } else {
        alert(`Ingest failed: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Network error: ${e.message}`);
    } finally {
      setSheetActionLoadingId(null);
    }
  };

  const fetchDiscovered = async () => {
    try {
      const res = await fetch("/api/admin/reddit-scanner");
      const data = await res.json();
      if (data.items) {
        setDiscoveredItems(data.items);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHealthReport = async () => {
    try {
      const res = await fetch("/api/admin/link-health");
      const data = await res.json();
      if (data.report) {
        setHealthReport(data.report);
      }
    } catch (e) {
      console.error("Failed to load health report:", e);
    }
  };

  const handleRunHealthAudit = async () => {
    setIsAuditingHealth(true);
    setHealthAuditProgress({
      isAuditing: true,
      percent: 0,
      current: 0,
      total: 108,
      item: "Initializing crawler...",
      healthy: 0,
      dead: 0,
      flagged: 0,
      message: "Starting Link Health Audit...",
    });

    try {
      const res = await fetch("/api/admin/link-health?action=run-audit");
      if (!res.ok || !res.body) {
        throw new Error("Failed to start health audit stream");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.substring(6));
              if (event.type === "progress" && event.data) {
                setHealthAuditProgress((prev) => ({
                  ...prev,
                  isAuditing: true,
                  percent: event.data.percent ?? prev.percent,
                  current: event.data.current ?? prev.current,
                  total: event.data.total ?? prev.total,
                  item: event.data.item || prev.item,
                  healthy: event.data.healthy ?? prev.healthy,
                  dead: event.data.dead ?? prev.dead,
                  flagged: event.data.flagged ?? prev.flagged,
                  message: event.data.message || prev.message,
                }));
              } else if (event.type === "complete" && event.report) {
                setHealthReport(event.report);
                setHealthAuditProgress((prev) => ({
                  ...prev,
                  isAuditing: false,
                  percent: 100,
                  current: event.report.totalChecked || prev.current,
                  total: event.report.totalChecked || prev.total,
                  healthy: event.report.healthyCount ?? prev.healthy,
                  dead: event.report.deadCount ?? prev.dead,
                  flagged: event.report.flaggedCount ?? prev.flagged,
                  message: "✓ Audit Complete!",
                }));
              }
            } catch (err) {
              console.warn("Error parsing SSE line:", err);
            }
          }
        }
      }
    } catch (e) {
      console.error("Audit error:", e);
    } finally {
      setIsAuditingHealth(false);
      fetchHealthReport();
    }
  };

  const handleHealthAction = async (productId: string, action: "approve" | "delist" | "delete" | "update_url", newUrl?: string) => {
    setActionLoadingId(productId);
    try {
      const res = await fetch("/api/admin/link-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, action, newUrl }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh local health state with updated report or local calculation
        if (data.report) {
          setHealthReport(data.report);
        } else if (healthReport) {
          let updatedItems = healthReport.items;
          if (action === "delist" || action === "delete") {
            updatedItems = updatedItems.filter((it) => it.id !== productId);
          } else {
            updatedItems = updatedItems.map((it) => {
              if (it.id === productId) {
                return {
                  ...it,
                  status: ("HEALTHY" as const),
                  note: "Approved & verified by admin",
                  directStoreLink: newUrl || it.directStoreLink,
                };
              }
              return it;
            });
          }

          setHealthReport({
            ...healthReport,
            totalChecked: updatedItems.length,
            healthyCount: updatedItems.filter((it) => it.status === "HEALTHY").length,
            deadCount: updatedItems.filter((it) => it.status === "DEAD").length,
            flaggedCount: updatedItems.filter((it) => it.status === "FLAGGED").length,
            items: updatedItems,
          });
        }
        setEditingUrlId(null);
        setNewUrlInput("");
      } else {
        alert(`Action failed: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Network error: ${e.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleScanReddit = async () => {
    setIsScanningReddit(true);
    setLiveLogs([]);
    setScanProgress({
      percent: 2,
      message: "Connecting stealth crawler to r/QualityReps feeds...",
      current: 0,
      total: scanLimit,
      foundCount: 0,
      phase: "INIT",
    });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/admin/reddit-scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: scanLimit, autoAdd: autoApprove }),
        signal: controller.signal,
      });

      if (!res.body) {
        throw new Error("ReadableStream not supported on this browser.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const eventBlock of events) {
          const lines = eventBlock.split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            try {
              const payload = JSON.parse(trimmed.replace(/^data:\s*/, ""));

              if (payload.type === "item_discovered" && payload.item) {
                // Live real-time discovery insertion!
                setDiscoveredItems((prev) => {
                  if (prev.some((it) => it.slug === payload.item.slug)) return prev;
                  return [payload.item, ...prev];
                });
              } else if (payload.type === "progress" && payload.data) {
                setScanProgress((prev) => ({
                  ...prev,
                  ...payload.data,
                }));
              } else if (payload.type === "log" && payload.text) {
                setLiveLogs((prev) => [...prev.slice(-200), payload.text]);
              } else if (payload.type === "stderr" && payload.text) {
                setLiveLogs((prev) => [...prev.slice(-200), `⚠️ ${payload.text}`]);
              } else if (payload.type === "done") {
                setScanProgress((prev) => ({
                  ...prev,
                  percent: 100,
                  message: payload.message || "Scan finished!",
                  phase: "COMPLETE",
                }));
                if (payload.items) {
                  setDiscoveredItems(payload.items);
                }
              } else if (payload.type === "error") {
                setScanProgress((prev) => ({
                  ...prev,
                  message: `Crawler Error: ${payload.error}`,
                  phase: "ERROR",
                }));
              }
            } catch (err) {
              // Ignore partial JSON parse errors in stream
            }
          }
        }
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        setScanProgress((prev) => ({
          ...prev,
          message: "Scan aborted by user.",
          phase: "ABORTED",
        }));
        setLiveLogs((prev) => [...prev, "🛑 Scan stopped by user."]);
      } else {
        setScanProgress((prev) => ({
          ...prev,
          message: `Network error: ${e.message}`,
          phase: "ERROR",
        }));
        setLiveLogs((prev) => [...prev, `❌ Error: ${e.message}`]);
      }
    } finally {
      setIsScanningReddit(false);
      abortControllerRef.current = null;
      fetchDiscovered();
    }
  };

  const handleStopScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleDismissPiece = async (item: DiscoveredItem) => {
    // Optimistic UI update
    setDiscoveredItems((prev) => prev.filter((i) => i.slug !== item.slug));

    try {
      const params = new URLSearchParams({
        slug: item.slug,
        rawMarketUrl: item.rawMarketUrl || "",
        redditPostUrl: item.redditPostUrl || "",
      });
      await fetch(`/api/admin/reddit-scanner?${params.toString()}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.error("Failed to blacklist dismissed item:", e);
    }
  };

  const handleApprovePiece = async (item: DiscoveredItem) => {
    setApprovingSlug(item.slug);
    try {
      const res = await fetch("/api/admin/ingest-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: item.rawMarketUrl || item.sugargooUrl,
          brand: item.brand,
          title: item.title.replace(`${item.brand} - `, ""),
          category: item.category,
          price: item.sourcePrice,
          rawImageSrc: item.rawImageSrc,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDiscoveredItems((prev) => prev.filter((i) => i.slug !== item.slug));
        alert(`Approved & Ingested: ${item.title}! 3 slide styles generated.`);
      } else {
        alert(`Error ingesting: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Network error: ${e.message}`);
    } finally {
      setApprovingSlug(null);
    }
  };

  const handleQuickIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestUrl.trim()) return;

    setIsIngesting(true);
    setIngestMessage(null);

    try {
      const res = await fetch("/api/admin/ingest-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: ingestUrl,
          brand: ingestBrand,
          title: ingestTitle || `${ingestBrand} Piece`,
          category: ingestCategory,
          price: parseFloat(ingestPrice) || 59,
          rawImageSrc: ingestImage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIngestMessage({
          type: "success",
          text: "Piece successfully ingested! AI cutout created & all 3 slide styles generated.",
        });
        setIngestUrl("");
        setIngestTitle("");
        setIngestImage("");
      } else {
        setIngestMessage({ type: "error", text: data.error || "Failed to ingest piece." });
      }
    } catch (err: any) {
      setIngestMessage({ type: "error", text: err.message });
    } finally {
      setIsIngesting(false);
    }
  };

  const handleIdentifyModel = async () => {
    const query = ingestTitle.trim() || ingestBrand.trim();
    if (!query) return;
    setIsIdentifying(true);
    try {
      const res = await fetch("/api/admin/identify-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.canonicalTitle) setIngestTitle(data.data.canonicalTitle);
        if (data.data.brand && data.data.brand !== "Archive Collection") setIngestBrand(data.data.brand);
        if (data.data.category) setIngestCategory(data.data.category);
        if (data.data.studioImageUrl) setIngestImage(data.data.studioImageUrl);
      }
    } catch (e) {
      console.error("AI Lens identification failed:", e);
    } finally {
      setIsIdentifying(false);
    }
  };

  // Filtered health items
  const filteredHealthItems = healthReport?.items.filter((item) => {
    if (healthFilter === "dead" && item.status !== "DEAD") return false;
    if (healthFilter === "flagged" && item.status !== "FLAGGED") return false;
    if (healthFilter === "healthy" && item.status !== "HEALTHY") return false;
    if (healthSearch.trim()) {
      const q = healthSearch.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        (item.directStoreLink && item.directStoreLink.toLowerCase().includes(q))
      );
    }
    return true;
  }) || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Global Ingestion Success Toast (Persists across Fast Refresh) */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 p-4 bg-neutral-900/95 border border-emerald-500/60 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 max-w-lg">
          {successToast.imageUrl ? (
            <div className="w-12 h-12 bg-neutral-950 rounded-xl border border-neutral-800 p-1 flex-shrink-0 flex items-center justify-center">
              <img
                src={successToast.imageUrl}
                alt={successToast.title}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          )}
          <div className="space-y-0.5 min-w-0 pr-2">
            <p className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Grail Ingested to Store!
            </p>
            <p className="font-mono text-[11px] text-neutral-300 truncate max-w-[220px]">
              {successToast.title}
            </p>
          </div>
          <div className="flex items-center gap-2 pl-2 border-l border-neutral-800 flex-shrink-0">
            <a
              href={successToast.slug ? `/product/${successToast.slug}` : "/"}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-emerald-500 text-black font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-emerald-400 transition-colors flex items-center gap-1 shadow-lg shadow-emerald-500/20"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Store</span>
            </a>
            <a
              href="/admin/slides"
              className="px-3 py-2 bg-neutral-800 text-white font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-neutral-700 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Slides</span>
            </a>
            <button
              onClick={handleDismissToast}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}


      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-red-400 fill-red-400" />
              Sourcing Hub & Pipeline
            </span>
            <span className="px-2 py-0.5 bg-neutral-900 text-neutral-400 border border-neutral-800 text-[10px] font-mono">
              Sugargoo ID: 1325437696506389977
            </span>
          </div>
          <h1 className="text-2xl font-mono font-black uppercase tracking-wider text-white">
            GRAIL SOURCING & INGESTION
          </h1>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            Automated Reddit r/QualityReps crawler, de-obfuscation parser, AI studio cutouts, link health monitor, and 1-click affiliate converter.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-neutral-900 border border-neutral-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("reddit")}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded ${
              activeTab === "reddit"
                ? "bg-white text-black font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>r/QualityReps Scanner</span>
          </button>
          <button
            onClick={() => setActiveTab("quick-ingest")}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded ${
              activeTab === "quick-ingest"
                ? "bg-white text-black font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Click Ingest</span>
          </button>
          <button
            onClick={() => setActiveTab("health")}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded ${
              activeTab === "health"
                ? "bg-white text-black font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Link Health & Dead Links</span>
          </button>
          <button
            onClick={() => setActiveTab("sheets")}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded ${
              activeTab === "sheets"
                ? "bg-white text-black font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Google Sheets</span>
          </button>
        </div>
      </div>

      {/* TAB 1: r/QualityReps Scanner */}
      {activeTab === "reddit" && (
        <div className="space-y-6">
          {/* Scanner Control Box with Live Progress HUD */}
          <div className="p-6 bg-neutral-900/90 border border-neutral-800 rounded-xl space-y-5 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>r/QualityReps Automated Ingestion Engine</span>
                </h2>
                <p className="text-xs font-mono text-neutral-400 mt-1 max-w-2xl">
                  Playwright stealth scraper, auto-extracts Taobao/Weidian links, converts to Sugargoo VIP links, matches pristine studio flat-lays, and generates AI cutouts (`rembg`).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 border border-neutral-800 rounded">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase">Posts Limit:</label>
                  <select
                    value={scanLimit}
                    onChange={(e) => setScanLimit(Number(e.target.value))}
                    disabled={isScanningReddit}
                    className="bg-transparent text-xs font-mono text-white focus:outline-none disabled:opacity-50"
                  >
                    <option value={5} className="bg-neutral-900">5 Posts</option>
                    <option value={10} className="bg-neutral-900">10 Posts</option>
                    <option value={20} className="bg-neutral-900">20 Posts</option>
                    <option value={35} className="bg-neutral-900">35 Posts</option>
                    <option value={50} className="bg-neutral-900">50 Posts</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer bg-neutral-950 px-3 py-1.5 border border-neutral-800 rounded text-xs font-mono text-neutral-300">
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    disabled={isScanningReddit}
                    className="rounded bg-neutral-900 border-neutral-700 text-white focus:ring-0 disabled:opacity-50"
                  />
                  <span>Auto-Approve & Save</span>
                </label>

                {isScanningReddit ? (
                  <button
                    onClick={handleStopScan}
                    className="px-5 py-2.5 bg-red-950/60 text-red-300 border border-red-700/60 font-mono text-xs font-bold uppercase tracking-wider hover:bg-red-900/60 transition-colors flex items-center gap-2 rounded"
                  >
                    <Square className="w-3.5 h-3.5 fill-red-400" />
                    <span>STOP SCAN</span>
                  </button>
                ) : (
                  <button
                    onClick={handleScanReddit}
                    className="px-5 py-2.5 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center gap-2 rounded shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>START REDDIT SCAN</span>
                  </button>
                )}
              </div>
            </div>

            {/* LIVE PROGRESS BAR HUD */}
            <div className="p-4 bg-black/90 border border-neutral-800/90 rounded-lg space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    {isScanningReddit && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isScanningReddit ? "bg-emerald-500" : scanProgress.percent === 100 ? "bg-cyan-400" : "bg-neutral-600"}`}></span>
                  </span>
                  
                  <span className="font-bold text-white uppercase tracking-wider">
                    {isScanningReddit ? "CRAWLER ACTIVE" : scanProgress.percent === 100 ? "SCAN COMPLETE" : "CRAWLER STANDBY"}
                  </span>

                  <span className="px-2 py-0.5 bg-neutral-900 text-neutral-400 text-[10px] rounded uppercase border border-neutral-800">
                    PHASE: {scanProgress.phase || "IDLE"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-neutral-400 text-xs">
                  {scanProgress.current > 0 && (
                    <span>Post <strong className="text-white">{scanProgress.current}</strong> of <strong className="text-white">{scanProgress.total}</strong></span>
                  )}
                  <span className="text-emerald-400 font-bold">
                    {scanProgress.foundCount} Verified Grails
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 font-bold rounded">
                    {scanProgress.percent}%
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full h-3 bg-neutral-950 rounded-full border border-neutral-800 overflow-hidden relative p-[1px]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                  style={{ width: `${scanProgress.percent}%` }}
                />
              </div>

              {/* Live Operation Status Subtitle */}
              <div className="flex items-center justify-between text-xs font-mono pt-1 text-neutral-300">
                <div className="flex items-center gap-2 truncate">
                  <Zap className={`w-3.5 h-3.5 flex-shrink-0 ${isScanningReddit ? "text-yellow-400 animate-pulse" : "text-neutral-500"}`} />
                  <span className="truncate">
                    {scanProgress.message || "Ready. Click 'Start Reddit Scan' to crawl r/QualityReps."}
                  </span>
                </div>

                <button
                  onClick={() => setShowLiveTerminal(!showLiveTerminal)}
                  className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 flex-shrink-0 ml-3"
                >
                  <Terminal className="w-3 h-3 text-neutral-400" />
                  <span>{showLiveTerminal ? "Hide Console" : "Show Console"}</span>
                  {showLiveTerminal ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Collapsible Live Streaming Terminal Console */}
              {showLiveTerminal && (
                <div className="mt-3 border-t border-neutral-800/80 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400 font-bold">TERMINAL OUTPUT STREAM</span>
                      <span>({liveLogs.length} lines)</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 cursor-pointer hover:text-neutral-300">
                        <input
                          type="checkbox"
                          checked={autoScroll}
                          onChange={(e) => setAutoScroll(e.target.checked)}
                          className="w-3 h-3 rounded bg-neutral-900 border-neutral-700 text-emerald-500 focus:ring-0"
                        />
                        <span>Auto-scroll</span>
                      </label>

                      <button
                        onClick={() => setLiveLogs([])}
                        className="hover:text-neutral-300 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="w-full h-44 bg-black/95 border border-neutral-800 rounded p-3 font-mono text-xs overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-neutral-800">
                    {liveLogs.length === 0 ? (
                      <p className="text-neutral-600 italic">
                        Terminal logs will stream here live when a scan is initiated...
                      </p>
                    ) : (
                      liveLogs.map((log, lIdx) => {
                        const isSuccess = log.includes("✓") || log.includes("[VERIFIED") || log.includes("[STUDIO MATCH]");
                        const isWarning = log.includes("⚠️") || log.includes("Skipping") || log.includes("[REJECTED]");
                        const isCutout = log.includes("AI cutout") || log.includes("rembg");
                        const isSearch = log.includes("[IMAGE SEARCH]");

                        return (
                          <div
                            key={lIdx}
                            className={`font-mono text-[11px] leading-relaxed break-all ${
                              isSuccess
                                ? "text-emerald-400 font-semibold"
                                : isWarning
                                ? "text-neutral-500"
                                : isCutout
                                ? "text-amber-300"
                                : isSearch
                                ? "text-cyan-300"
                                : "text-neutral-300"
                            }`}
                          >
                            {log}
                          </div>
                        );
                      })
                    )}
                    <div ref={terminalEndRef} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Discovered Items Queue */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-mono uppercase tracking-widest text-white flex items-center gap-2">
                <span>Discovered Grails Awaiting Moderation</span>
                <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 text-xs rounded-full font-mono">
                  {discoveredItems.length}
                </span>
              </h2>

              <button
                onClick={fetchDiscovered}
                className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Queue</span>
              </button>
            </div>

            {discoveredItems.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-neutral-800 rounded-xl space-y-2">
                <p className="font-mono text-neutral-400 text-sm">No items in the moderation queue.</p>
                <p className="font-mono text-neutral-600 text-xs">
                  Run the scanner above to pull fresh finds from r/QualityReps or use 1-Click Ingest.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {discoveredItems.map((item) => (
                  <div
                    key={item.slug}
                    className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 font-mono text-[10px] uppercase rounded">
                            {item.brand}
                          </span>
                          {item.season && (
                            <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] uppercase rounded flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              {item.season}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          ${item.sourcePrice}
                        </span>
                      </div>

                      <h3 className="font-mono text-sm font-bold text-white line-clamp-2">
                        {item.title}
                      </h3>

                      <div className="w-full h-44 bg-neutral-950/80 rounded-lg border border-neutral-800/80 overflow-hidden relative flex items-center justify-center p-3">
                        <img
                          src={item.imageUrl || item.localImage || item.rawImageSrc}
                          alt={item.title}
                          className="max-h-full max-w-full object-contain filter drop-shadow-md transition-transform hover:scale-105"
                          onError={(e) => {
                            if (item.rawImageSrc && e.currentTarget.src !== item.rawImageSrc) {
                              e.currentTarget.src = item.rawImageSrc;
                            }
                          }}
                        />
                        <div className="absolute bottom-1.5 right-2 px-1.5 py-0.5 bg-black/80 border border-neutral-800 rounded text-[9px] font-mono text-neutral-400">
                          {item.imageUrl ? "STUDIO CUTOUT" : "RAW IMAGE"}
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-neutral-500 space-y-1 pt-1">
                        <div className="truncate">
                          <span className="text-neutral-400">Source: </span>
                          <a
                            href={item.rawMarketUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            {item.rawMarketUrl}
                          </a>
                        </div>
                        {item.redditPostUrl && (() => {
                          const subMatch = item.redditPostUrl.match(/r\/([a-zA-Z0-9_]+)/i);
                          const subName = subMatch ? `r/${subMatch[1]}` : "Reddit";
                          return (
                            <div className="truncate">
                              <span className="text-neutral-400">{subName}: </span>
                              <a
                                href={item.redditPostUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-orange-400 hover:underline"
                              >
                                {subName} Post ↗
                              </a>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-neutral-800 flex items-center gap-2">
                      <button
                        onClick={() => openReviewModal(item)}
                        className="flex-1 py-2 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-all shadow-sm flex items-center justify-center gap-1.5 rounded"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>REVIEW & INGEST</span>
                      </button>

                      <button
                        onClick={() => handleDismissPiece(item)}
                        className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
                        title="Dismiss & Blacklist"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: 1-Click Ingest */}
      {activeTab === "quick-ingest" && (
        <div className="max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>1-Click Grail Ingestion Studio</span>
            </h2>
            <p className="text-xs font-mono text-neutral-400 mt-1">
              Enter any Taobao, Weidian, 1688 or Yupoo link. The system will automatically convert it into a Sugargoo affiliate link, extract clean flat-lay photos, isolate transparent cutouts, and render all 3 slide styles (`viral_minimal`, `editorial_dark`, `minimal_dark`).
            </p>
          </div>

          {ingestMessage && (
            <div
              className={`p-3 rounded font-mono text-xs ${
                ingestMessage.type === "success"
                  ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                  : "bg-red-950/60 border border-red-800 text-red-300"
              }`}
            >
              {ingestMessage.text}
            </div>
          )}

          <form onSubmit={handleQuickIngest} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                Direct Product / Marketplace URL (Taobao, Weidian, 1688) *
              </label>
              <input
                type="text"
                required
                value={ingestUrl}
                onChange={(e) => setIngestUrl(e.target.value)}
                placeholder="https://item.taobao.com/item.htm?id=... or https://weidian.com/item.html?itemID=..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  Brand / Designer
                </label>
                <input
                  type="text"
                  value={ingestBrand}
                  onChange={(e) => setIngestBrand(e.target.value)}
                  placeholder="Rick Owens"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  Category
                </label>
                <select
                  value={ingestCategory}
                  onChange={(e) => setIngestCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white"
                >
                  <option value="Outerwear">Outerwear</option>
                  <option value="Hoodies">Hoodies</option>
                  <option value="Denim">Denim</option>
                  <option value="T-Shirts">T-Shirts</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Jewelry">Jewelry</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono uppercase text-neutral-400">
                    Piece Name / Title
                  </label>
                  <button
                    type="button"
                    onClick={handleIdentifyModel}
                    disabled={isIdentifying || (!ingestTitle && !ingestBrand)}
                    className="text-[9px] font-mono uppercase text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 disabled:opacity-40"
                  >
                    <Search className="w-2.5 h-2.5" />
                    <span>{isIdentifying ? "Identifying..." : "AI Lens Identify"}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={ingestTitle}
                  onChange={(e) => setIngestTitle(e.target.value)}
                  placeholder="e.g. Vintage Jumbo Cargo Pants or RO V-ns"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  Sourcing Price (USD)
                </label>
                <input
                  type="number"
                  value={ingestPrice}
                  onChange={(e) => setIngestPrice(e.target.value)}
                  placeholder="59"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                Source Image URL (Optional - leave blank to auto-fetch studio flat lay)
              </label>
              <input
                type="text"
                value={ingestImage}
                onChange={(e) => setIngestImage(e.target.value)}
                placeholder="https://... image link"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white"
              />
            </div>

            <button
              type="submit"
              disabled={isIngesting}
              className="w-full py-3 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 rounded disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isIngesting ? "animate-spin" : ""}`} />
              <span>{isIngesting ? "PROCESSING AI CUTOUT & SLIDES..." : "INGEST PIECE & GENERATE SLIDES"}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Link Health & Dead Links Inspector */}
      {activeTab === "health" && (
        <div className="space-y-6">
          {/* Health Overview Banner */}
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Link Health & Dead Link Moderation Station</span>
                </h2>
                <p className="text-xs font-mono text-neutral-400 mt-1 max-w-2xl">
                  Automatically tests marketplace URLs (Taobao, Weidian, 1688) & Sugargoo affiliate routes. Flags delisted items ("商品已下架", 404s, missing items) so you can review, keep, replace, or delist them with 1-click.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRunHealthAudit}
                  disabled={isAuditingHealth}
                  className="px-5 py-2.5 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center gap-2 rounded disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAuditingHealth ? "animate-spin" : ""}`} />
                  <span>{isAuditingHealth ? `AUDITING (${healthAuditProgress.percent}%)...` : "RUN FULL HEALTH AUDIT"}</span>
                </button>
              </div>
            </div>

            {/* Real-time Health Audit Progress Bar */}
            {isAuditingHealth && (
              <div className="p-4 bg-neutral-950 border border-emerald-500/30 rounded-lg space-y-3 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold text-white uppercase tracking-wider">
                      Auditing Catalog Links:
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {healthAuditProgress.current} / {healthAuditProgress.total} Pieces ({healthAuditProgress.percent}%)
                    </span>
                  </div>

                  {/* Mini live counters */}
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-emerald-400">🟢 {healthAuditProgress.healthy} Active</span>
                    <span className="text-amber-400">🟡 {healthAuditProgress.flagged} Flagged</span>
                    <span className="text-red-400">🔴 {healthAuditProgress.dead} Dead</span>
                  </div>
                </div>

                {/* Progress bar line */}
                <div className="w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                    style={{ width: `${Math.max(healthAuditProgress.percent, 3)}%` }}
                  />
                </div>

                {/* Currently Auditing Item Label */}
                {healthAuditProgress.item && (
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 truncate">
                    <span className="truncate">
                      Testing: <strong className="text-neutral-200">{healthAuditProgress.item}</strong>
                    </span>
                    <span className="shrink-0 text-neutral-500 pl-2">
                      {healthAuditProgress.message}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Health Stats Grid */}
            {healthReport && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded">
                  <span className="text-[10px] font-mono uppercase text-neutral-500 block">Total Audited</span>
                  <span className="text-lg font-mono font-bold text-white">{healthReport.totalChecked} Pieces</span>
                </div>
                <div className="p-3 bg-neutral-950 border border-emerald-900/40 rounded">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 block">🟢 Healthy Active</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">{healthReport.healthyCount} Pieces</span>
                </div>
                <div className="p-3 bg-neutral-950 border border-amber-900/40 rounded">
                  <span className="text-[10px] font-mono uppercase text-amber-400 block">🟡 Flagged Review</span>
                  <span className="text-lg font-mono font-bold text-amber-400">{healthReport.flaggedCount} Pieces</span>
                </div>
                <div className="p-3 bg-neutral-950 border border-red-900/40 rounded">
                  <span className="text-[10px] font-mono uppercase text-red-400 block">🔴 Dead / Delisted</span>
                  <span className="text-lg font-mono font-bold text-red-400">{healthReport.deadCount} Pieces</span>
                </div>
              </div>
            )}
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/50 p-3 border border-neutral-800 rounded-lg">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHealthFilter("all")}
                className={`px-3 py-1 text-xs font-mono rounded uppercase transition-colors ${
                  healthFilter === "all" ? "bg-white text-black font-bold" : "text-neutral-400 hover:text-white"
                }`}
              >
                All ({healthReport?.items.length || 0})
              </button>
              <button
                onClick={() => setHealthFilter("dead")}
                className={`px-3 py-1 text-xs font-mono rounded uppercase transition-colors ${
                  healthFilter === "dead" ? "bg-red-500 text-white font-bold" : "text-red-400 hover:text-red-300"
                }`}
              >
                Dead ({healthReport?.deadCount || 0})
              </button>
              <button
                onClick={() => setHealthFilter("flagged")}
                className={`px-3 py-1 text-xs font-mono rounded uppercase transition-colors ${
                  healthFilter === "flagged" ? "bg-amber-500 text-black font-bold" : "text-amber-400 hover:text-amber-300"
                }`}
              >
                Flagged ({healthReport?.flaggedCount || 0})
              </button>
              <button
                onClick={() => setHealthFilter("healthy")}
                className={`px-3 py-1 text-xs font-mono rounded uppercase transition-colors ${
                  healthFilter === "healthy" ? "bg-emerald-500 text-black font-bold" : "text-emerald-400 hover:text-emerald-300"
                }`}
              >
                Healthy ({healthReport?.healthyCount || 0})
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search pieces or links..."
                value={healthSearch}
                onChange={(e) => setHealthSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 w-full sm:w-64"
              />
            </div>
          </div>

          {/* Items Table / Cards */}
          <div className="space-y-3">
            {filteredHealthItems.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-neutral-800 rounded-xl">
                <p className="font-mono text-neutral-500 text-xs">No pieces found matching this filter.</p>
              </div>
            ) : (
              filteredHealthItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-neutral-500 font-bold">#{item.id}</span>
                      <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 font-mono text-[10px] uppercase rounded">
                        {item.brand}
                      </span>
                      {item.status === "HEALTHY" && (
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>HEALTHY</span>
                        </span>
                      )}
                      {item.status === "FLAGGED" && (
                        <span className="px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-mono rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>FLAGGED FOR REVIEW</span>
                        </span>
                      )}
                      {item.status === "DEAD" && (
                        <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-800 text-[10px] font-mono rounded flex items-center gap-1">
                          <AlertOctagon className="w-3 h-3" />
                          <span>DELISTED / 404</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-mono text-sm font-bold text-white">
                      {item.title}
                    </h3>

                    <div className="text-[11px] font-mono text-neutral-400 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500">Note:</span>
                        <span>{item.note || "No audit notes"}</span>
                      </div>
                      {item.directStoreLink && (
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-neutral-500">Marketplace:</span>
                          <a
                            href={item.directStoreLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline truncate"
                          >
                            {item.directStoreLink}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Inline Edit URL Form */}
                    {editingUrlId === item.id && (
                      <div className="pt-2 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Paste new Taobao / Weidian link..."
                          value={newUrlInput}
                          onChange={(e) => setNewUrlInput(e.target.value)}
                          className="px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-xs font-mono text-white flex-1 focus:outline-none focus:border-white"
                        />
                        <button
                          onClick={() => handleHealthAction(item.id, "update_url", newUrlInput)}
                          disabled={!newUrlInput.trim() || actionLoadingId === item.id}
                          className="px-3 py-1.5 bg-white text-black font-mono text-xs font-bold uppercase rounded hover:bg-neutral-200"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingUrlId(null);
                            setNewUrlInput("");
                          }}
                          className="px-2 py-1.5 text-neutral-400 hover:text-white font-mono text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {(() => {
                    const rawMarketplaceLink = item.directStoreLink || item.directLink || "";
                    const affiliateLink =
                      item.affiliateUrl ||
                      item.sugargooUrl ||
                      (rawMarketplaceLink
                        ? `https://www.sugargoo.com/products?productLink=${encodeURIComponent(rawMarketplaceLink)}&memberId=1325437696506389977`
                        : "");

                    return (
                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <a
                          href={affiliateLink || "#"}
                          target={affiliateLink ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (!affiliateLink) {
                              e.preventDefault();
                              alert("No marketplace link found to generate a Sugargoo affiliate URL.");
                            }
                          }}
                          className={`px-3 py-1.5 font-mono text-xs rounded transition-colors flex items-center gap-1.5 ${
                            affiliateLink
                              ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 cursor-pointer"
                              : "bg-neutral-900 text-neutral-600 cursor-not-allowed border border-neutral-800"
                          }`}
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Test Sugargoo</span>
                        </a>

                        <button
                          onClick={() => {
                            setEditingUrlId(item.id);
                            setNewUrlInput(item.directStoreLink || item.directLink || "");
                          }}
                          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-mono text-xs rounded transition-colors flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Update URL</span>
                        </button>

                        {item.status !== "HEALTHY" && (
                          <button
                            onClick={() => handleHealthAction(item.id, "approve")}
                            disabled={actionLoadingId === item.id}
                            className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 font-mono text-xs rounded transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Keep / Approve</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to permanently delete/delist "${item.title}" from the store catalog?`)) {
                              handleHealthAction(item.id, "delist");
                            }
                          }}
                          disabled={actionLoadingId === item.id}
                          className="px-3 py-1.5 bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-800 font-mono text-xs rounded transition-colors flex items-center gap-1.5"
                          title="Permanently remove piece from live store catalog"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{actionLoadingId === item.id ? "Delisting..." : "Delete / Delist"}</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Google Sheets Multi-Tab Ingestion Engine */}
      {activeTab === "sheets" && (
        <div className="space-y-6">
          {/* Scanner Control Hub */}
          <div className="p-6 bg-neutral-900/90 border border-neutral-800 rounded-xl space-y-5 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Google Sheets Multi-Tab Ingestion Engine</span>
                </h2>
                <p className="text-xs font-mono text-neutral-400 mt-1">
                  Extract pristine designer grails directly from curated community sheets, auto-verify link health, filter dead items, and ingest with Sugargoo affiliate tags.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleScanSheet}
                  disabled={isScanningSheet}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isScanningSheet ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Scanning Sheet...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-black" />
                      <span>Extract & Ingest Sheet</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Inputs & Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-neutral-800/80">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-neutral-400 flex items-center justify-between">
                  <span>Google Sheet URL or ID</span>
                  <span className="text-[10px] text-emerald-400/80">Auto-Detects All Tabs</span>
                </label>
                <input
                  type="text"
                  value={sheetUrlInput}
                  onChange={(e) => setSheetUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-neutral-400 block">
                  Batch Extraction Limit
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[15, 25, 50, 100].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setSheetLimit(l)}
                      className={`py-2 text-xs font-mono rounded-lg transition-colors border ${
                        sheetLimit === l
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab Filter Pills & Link Health Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-neutral-500 mr-1">Filter Tabs:</span>
                {[
                  { id: "ALL", label: "All Tabs (1800+ Items)" },
                  { id: "TOPS", label: "Tops & Jackets" },
                  { id: "BOTTOMS", label: "Pants & Denim" },
                  { id: "SHOES", label: "Shoes & Footwear" },
                  { id: "OTHERS", label: "Accessories & Bags" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedSheetTab(t.id)}
                    className={`px-3 py-1 text-xs font-mono rounded-md transition-colors border ${
                      selectedSheetTab === t.id
                        ? "bg-white text-black font-bold border-white"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-neutral-300 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
                <input
                  type="checkbox"
                  checked={validateSheetLinks}
                  onChange={(e) => setValidateSheetLinks(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-0"
                />
                <span>Auto-Filter Dead / 404 Links</span>
              </label>
            </div>

            {/* Progress Bar & Live Status */}
            {isScanningSheet && (
              <div className="space-y-2 pt-3 border-t border-neutral-800 animate-in fade-in duration-200">
                <div className="flex justify-between text-xs font-mono text-neutral-300">
                  <span className="flex items-center gap-2 text-emerald-400">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{sheetScanProgress.phase}: {sheetScanProgress.item || sheetScanProgress.message}</span>
                  </span>
                  <span>{sheetScanProgress.percent}% ({sheetScanProgress.current}/{sheetScanProgress.total})</span>
                </div>
                <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300 rounded-full"
                    style={{ width: `${sheetScanProgress.percent}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Metrics & Registry Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-neutral-500 block">Queue Ready</span>
              <p className="text-xl font-mono font-bold text-white">{discoveredSheetItems.length} Grails</p>
            </div>
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-red-400 block">Dead Links Filtered</span>
              <p className="text-xl font-mono font-bold text-red-400">{sheetStats.deadCount} OOS</p>
            </div>
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-emerald-400 block">Ingested to Live Store</span>
              <p className="text-xl font-mono font-bold text-emerald-400">{sheetStats.ingestedCount} Pieces</p>
            </div>
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-neutral-500 block">Total Scanned Registry</span>
              <p className="text-xl font-mono font-bold text-neutral-300">{sheetStats.totalRegistry} Tested</p>
            </div>
          </div>

          {/* Live Streaming Terminal */}
          {sheetLiveLogs.length > 0 && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/80 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Google Sheet Live Extraction Stream
                  </span>
                </div>
                <button
                  onClick={() => setShowSheetTerminal(!showSheetTerminal)}
                  className="text-neutral-400 hover:text-white p-1 rounded transition-colors"
                >
                  {showSheetTerminal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {showSheetTerminal && (
                <div className="p-4 font-mono text-[11px] text-neutral-300 max-h-48 overflow-y-auto space-y-1 bg-black/40">
                  {sheetLiveLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={
                        log.includes("❌") || log.includes("[ERROR]")
                          ? "text-red-400"
                          : log.includes("✨") || log.includes("[AF_SHEET_RESULT]")
                          ? "text-emerald-400 font-bold"
                          : "text-neutral-400"
                      }
                    >
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Moderation Queue Header & Batch Bar */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <span>Discovered Healthy Grails Queue ({discoveredSheetItems.length})</span>
                </h3>
                <p className="text-xs font-mono text-neutral-500">
                  Review extracted community pieces, inspect images, or 1-click batch ingest to live catalog.
                </p>
              </div>

              {discoveredSheetItems.length > 0 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (selectedSheetItemIds.size === discoveredSheetItems.length) {
                        setSelectedSheetItemIds(new Set());
                      } else {
                        setSelectedSheetItemIds(new Set(discoveredSheetItems.map((it) => it.id)));
                      }
                    }}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs font-mono rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {selectedSheetItemIds.size === discoveredSheetItems.length ? (
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-neutral-500" />
                    )}
                    <span>
                      {selectedSheetItemIds.size === discoveredSheetItems.length ? "Deselect All" : "Select All"}
                    </span>
                  </button>

                  <button
                    onClick={handleBatchIngestSelectedSheets}
                    disabled={selectedSheetItemIds.size === 0 || isBatchIngesting}
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {isBatchIngesting
                        ? "Ingesting..."
                        : `Ingest Selected (${selectedSheetItemIds.size})`}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Queue Search & Category Filters */}
            {discoveredSheetItems.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={sheetSearch}
                    onChange={(e) => setSheetSearch(e.target.value)}
                    placeholder="Search discovered grails by brand or title..."
                    className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-neutral-600"
                  />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {["ALL", "Outerwear", "Hoodies", "T-Shirts", "Pants", "Denim", "Footwear", "Accessories"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSheetFilter(cat)}
                      className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors whitespace-nowrap border ${
                        sheetFilter === cat
                          ? "bg-white text-black font-bold border-white"
                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Discovered Items Grid */}
            {discoveredSheetItems.length === 0 ? (
              <div className="p-12 text-center bg-neutral-900/50 border border-neutral-800 rounded-xl space-y-3">
                <FileSpreadsheet className="w-8 h-8 text-neutral-600 mx-auto" />
                <h4 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  No Discovered Sheet Finds in Queue
                </h4>
                <p className="font-mono text-xs text-neutral-500 max-w-md mx-auto">
                  Click &quot;Extract & Ingest Sheet&quot; above to scan the community Google Sheet tabs and populate healthy, active pieces automatically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {discoveredSheetItems
                  .filter((it) => {
                    if (sheetFilter !== "ALL" && it.category !== sheetFilter) return false;
                    if (sheetSearch.trim()) {
                      const q = sheetSearch.toLowerCase();
                      return (
                        it.title.toLowerCase().includes(q) ||
                        it.brand.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .map((item) => {
                    const isSelected = selectedSheetItemIds.has(item.id);
                    const isBusy = sheetActionLoadingId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`group p-4 bg-neutral-900/90 border rounded-xl space-y-4 transition-all duration-200 hover:border-neutral-700 flex flex-col justify-between ${
                          isSelected ? "border-emerald-500/80 bg-emerald-950/10" : "border-neutral-800"
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Image Container & Selection Badge */}
                          <div className="relative aspect-square bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800/80 flex items-center justify-center p-2 group-hover:border-neutral-700 transition-colors">
                            {item.imageUrl || item.localImage || item.rawImageSrc ? (
                              <img
                                src={getProxiedImageUrl(item.localImage || item.imageUrl || item.rawImageSrc)}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  if (item.rawImageSrc && !e.currentTarget.src.includes("sheet-image-proxy")) {
                                    e.currentTarget.src = `/api/admin/sheet-image-proxy?url=${encodeURIComponent(item.rawImageSrc)}`;
                                  }
                                }}
                              />
                            ) : (
                              <div className="text-neutral-600 text-xs font-mono flex flex-col items-center gap-1">
                                <ImagePlus className="w-6 h-6" />
                                <span>No Photo</span>
                              </div>
                            )}

                            {/* Select Checkbox */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSheetItemIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(item.id)) next.delete(item.id);
                                  else next.add(item.id);
                                  return next;
                                });
                              }}
                              className="absolute top-2 left-2 z-20 p-1.5 bg-black/80 backdrop-blur-md rounded-md border border-neutral-700 text-white hover:bg-black transition-colors shadow-md"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Square className="w-4 h-4 text-neutral-400" />
                              )}
                            </button>

                            {/* Tab Badge */}
                            {(item as any).sheetTab && (
                              <span className="absolute top-2 right-2 z-20 px-2 py-0.5 bg-neutral-900/90 backdrop-blur-md border border-neutral-700 text-[10px] font-mono text-neutral-300 rounded shadow-md">
                                {(item as any).sheetTab}
                              </span>
                            )}
                          </div>

                          {/* Item Details */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold truncate">
                                {item.brand}
                              </span>
                              <span className="text-xs font-mono font-bold text-white whitespace-nowrap">
                                ${item.sourcePrice?.toFixed(2) || "49.00"}
                              </span>
                            </div>
                            <h4 className="font-mono text-xs font-bold text-white line-clamp-2 leading-relaxed">
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-neutral-500">
                              <span className="px-1.5 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-neutral-400">
                                {item.category}
                              </span>
                              {(item as any).priceCNY && (
                                <span>¥{(item as any).priceCNY}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-neutral-800/80 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <a
                              href={item.affiliateLink || item.sugargooUrl || normalizeSugargooLink(item.rawMarketUrl || "")}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 font-mono text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 text-center"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Test Link</span>
                            </a>

                            <button
                              onClick={() => {
                                setEditingItem({
                                  ...item,
                                  rawMarketUrl: item.rawMarketUrl || (item as any).directStoreLink || "",
                                });
                                setEditFormData({
                                  title: item.title,
                                  brand: item.brand,
                                  category: item.category,
                                  season: (item as any).season || "",
                                  price: item.sourcePrice || 49.0,
                                  estimatedRetail: item.estimatedRetail || (item.sourcePrice ? item.sourcePrice * 8.5 : 450),
                                  tags: `${item.brand}, ${item.category}, archive, grail`,
                                  rawMarketUrl: item.rawMarketUrl || (item as any).directStoreLink || "",
                                });
                                setSelectedImageSrc(item.imageUrl || item.localImage || "");
                              }}
                              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 text-center"
                            >
                              <SlidersHorizontal className="w-3 h-3 text-emerald-400" />
                              <span>Review & Studio</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => handleQuickIngestSingleSheet(item)}
                              disabled={isBusy}
                              className="col-span-2 px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 font-mono text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              <Zap className="w-3 h-3" />
                              <span>{isBusy ? "Ingesting..." : "1-Click Ingest"}</span>
                            </button>

                            <button
                              onClick={() => handleDismissSheetItem(item.id, item.rawMarketUrl || "", "blacklist")}
                              disabled={isBusy}
                              className="px-2 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-800/80 font-mono text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1"
                              title="Dismiss & Blacklist from future sheet scans"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Skip</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

        {/* Review & Edit Ingest Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative w-full max-w-4xl max-h-[92vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Modal Header (Sticky) */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono text-base font-bold text-white uppercase tracking-wide">
                    Review & Ingest Grail
                  </h3>
                  <p className="font-mono text-xs text-neutral-400">
                    Verify metadata, select or paste pristine studio photos, and publish directly to the live catalog
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                disabled={ingestModalProgress.isIngesting}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left Preview Column (5 cols) */}
                <div className="md:col-span-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] font-mono uppercase text-neutral-400 font-bold tracking-wider">
                        Studiofoto Cutout
                      </label>
                      <span className="px-1.5 py-0.2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono rounded">
                        {selectedCutoutModel === "isnet-general-use"
                          ? "IS-Net HD"
                          : selectedCutoutModel === "isnet-matte"
                          ? "Soft Matte"
                          : selectedCutoutModel === "silueta"
                          ? "Silueta"
                          : "Standard AI"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditRotation((prev) => (prev - 90 + 360) % 360)}
                        title="Rotate -90° (Counter-Clockwise)"
                        className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] font-mono rounded flex items-center gap-1 transition-colors"
                      >
                        <span>↶</span>
                        <span>-90°</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditRotation((prev) => (prev + 90) % 360)}
                        title="Rotate +90° (Clockwise)"
                        className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] font-mono rounded flex items-center gap-1 transition-colors"
                      >
                        <span>↷</span>
                        <span>+90°</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditRotation((prev) => (prev + 180) % 360)}
                        title="Rotate 180°"
                        className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] font-mono rounded flex items-center gap-1 transition-colors"
                      >
                        <span>🔄</span>
                        <span>180°</span>
                      </button>
                    </div>
                  </div>

                  {/* AI Cutout Model Switcher Bar */}
                  <div className="p-1.5 bg-neutral-950/80 border border-neutral-800/80 rounded-lg flex items-center justify-between gap-1">
                    <span className="text-[9px] font-mono uppercase text-neutral-500 px-1 hidden sm:inline">Engine:</span>
                    <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => handleApplyAlternateImage(undefined, "isnet-general-use")}
                        disabled={isApplyingCutout}
                        title="Ultra-Sharp Deep Edge Extraction (Recommended)"
                        className={`px-2 py-1 text-[10px] font-mono rounded flex items-center gap-1 transition-all ${
                          selectedCutoutModel === "isnet-general-use"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.2)] font-bold"
                            : "bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 border border-neutral-800"
                        }`}
                      >
                        <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                        <span>IS-Net (HD)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyAlternateImage(undefined, "u2net")}
                        disabled={isApplyingCutout}
                        title="Standard rembg AI Model"
                        className={`px-2 py-1 text-[10px] font-mono rounded flex items-center gap-1 transition-all ${
                          selectedCutoutModel === "u2net"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.2)] font-bold"
                            : "bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 border border-neutral-800"
                        }`}
                      >
                        <Zap className="w-2.5 h-2.5 text-amber-400" />
                        <span>Standard</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyAlternateImage(undefined, "isnet-matte")}
                        disabled={isApplyingCutout}
                        title="Alpha Matting for soft edges, knits & textured fabrics"
                        className={`px-2 py-1 text-[10px] font-mono rounded flex items-center gap-1 transition-all ${
                          selectedCutoutModel === "isnet-matte"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.2)] font-bold"
                            : "bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 border border-neutral-800"
                        }`}
                      >
                        <Layers className="w-2.5 h-2.5 text-cyan-400" />
                        <span>Soft Matte</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyAlternateImage(undefined, "silueta")}
                        disabled={isApplyingCutout}
                        title="Lightweight Silhouette Model"
                        className={`px-2 py-1 text-[10px] font-mono rounded flex items-center gap-1 transition-all ${
                          selectedCutoutModel === "silueta"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.2)] font-bold"
                            : "bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 border border-neutral-800"
                        }`}
                      >
                        <Flame className="w-2.5 h-2.5 text-purple-400" />
                        <span>Silueta</span>
                      </button>
                    </div>
                  </div>

                  {/* Studio Cutout Preview Card with Drag & Drop */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingOver(true);
                    }}
                    onDragLeave={() => setIsDraggingOver(false)}
                    onDrop={handleDropImage}
                    className={`w-full h-64 bg-neutral-950 rounded-xl border relative flex items-center justify-center p-4 overflow-hidden group transition-all ${
                      isDraggingOver
                        ? "border-emerald-400 bg-emerald-950/40 ring-2 ring-emerald-500/50 scale-[1.01]"
                        : "border-neutral-800"
                    }`}
                  >
                    <img
                      src={editingItem.imageUrl || editingItem.localImage || editingItem.rawImageSrc}
                      alt={editingItem.title}
                      style={{
                        transform: `rotate(${editRotation}deg)`,
                        transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                      className="max-h-full max-w-full object-contain filter drop-shadow-xl select-none"
                      onError={(e) => {
                        if (editingItem.rawImageSrc && e.currentTarget.src !== editingItem.rawImageSrc) {
                          e.currentTarget.src = editingItem.rawImageSrc;
                        }
                      }}
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[9px] uppercase rounded flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                      <span>
                        Studio Cutout • {selectedCutoutModel === "isnet-general-use" ? "IS-Net HD" : selectedCutoutModel === "isnet-matte" ? "Soft Matte" : selectedCutoutModel === "silueta" ? "Silueta" : "Standard"}
                      </span>
                    </div>
                    {editRotation !== 0 && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-[9px] uppercase rounded flex items-center gap-1">
                        <span>Rotated: {editRotation}°</span>
                      </div>
                    )}

                    {/* Drag & Drop Visual Indicator */}
                    {isDraggingOver && (
                      <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-30 border-2 border-dashed border-emerald-400 rounded-xl animate-in fade-in duration-150">
                        <ImagePlus className="w-8 h-8 text-emerald-400 animate-bounce" />
                        <span className="text-xs font-mono font-bold text-emerald-300 uppercase">
                          Drop Image to Remove Background
                        </span>
                      </div>
                    )}

                    {/* AI Cutout Loading Overlay */}
                    {isApplyingCutout && (
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-20">
                        <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                        <span className="text-xs font-mono font-bold text-emerald-300">
                          Extracting Studio Cutout ({selectedCutoutModel === "isnet-general-use" ? "IS-Net HD" : selectedCutoutModel === "isnet-matte" ? "Soft Matte" : selectedCutoutModel === "silueta" ? "Silueta" : "Standard AI"})...
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Left Column Quick Upload & Paste Bar */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isApplyingCutout}
                      className="px-2.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-[10px] font-mono flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                      title="Upload custom image file from your computer"
                    >
                      <Upload className="w-3 h-3 text-emerald-400" />
                      <span>Upload Custom Image</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClipboardPasteImage}
                      disabled={isApplyingCutout}
                      className="px-2.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-[10px] font-mono flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                      title="Paste image from clipboard or press Ctrl+V"
                    >
                      <Clipboard className="w-3 h-3 text-cyan-400" />
                      <span>Paste Clipboard</span>
                    </button>
                  </div>

                  <div className="space-y-1 pt-1 text-[11px] font-mono text-neutral-400">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Source:</span>
                      <a
                        href={editFormData.rawMarketUrl || editingItem.rawMarketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:underline truncate max-w-[200px]"
                      >
                        {editFormData.rawMarketUrl || editingItem.rawMarketUrl}
                      </a>
                    </div>
                    {editingItem.redditPostUrl && (() => {
                      const subMatch = editingItem.redditPostUrl.match(/r\/([a-zA-Z0-9_]+)/i);
                      const subName = subMatch ? `r/${subMatch[1]}` : "Reddit";
                      return (
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">{subName}:</span>
                          <a
                            href={editingItem.redditPostUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-400 hover:underline flex items-center gap-1"
                          >
                            <span>{subName} Thread</span>
                            <span className="text-[9px]">↗</span>
                          </a>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Right Form Fields Column (7 cols) */}
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-mono uppercase text-neutral-400 font-bold">
                        Product Title / Name
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(editFormData.title, "title")}
                          className="text-[10px] font-mono text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-neutral-800"
                          title="Copy full title to clipboard"
                        >
                          {copiedField === "title" ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-2.5 h-2.5 text-neutral-500" />
                              <span>Copy Title</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleAIIdentifyModel}
                          disabled={isAutoIdentifyingTitle}
                          className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors disabled:opacity-50 px-1.5 py-0.5 rounded hover:bg-emerald-950/40"
                          title="AI auto-identifies exact archive model name and cleans title"
                        >
                          {isAutoIdentifyingTitle ? (
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-2.5 h-2.5" />
                          )}
                          <span>AI Auto-Identify Model</span>
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      placeholder="e.g. Balenciaga AW18 World Food Programme (WFP) Printed Oversized T-Shirt"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500 selection:bg-emerald-500/40 selection:text-white leading-relaxed resize-y cursor-text"
                    />
                  </div>

                  {/* Season / Runway Collection */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-mono uppercase text-neutral-400 font-bold">
                        Season / Runway Collection
                      </label>
                      <div className="flex items-center gap-2">
                        {editFormData.season && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(editFormData.season || "", "season")}
                            className="text-[10px] font-mono text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-neutral-800"
                            title="Copy season name"
                          >
                            {copiedField === "season" ? (
                              <>
                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-2.5 h-2.5 text-neutral-500" />
                                <span>Copy Season</span>
                              </>
                            )}
                          </button>
                        )}
                        {editFormData.season && (
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Verified Runway Era</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={editFormData.season || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, season: e.target.value })}
                      placeholder="e.g. AW18, AW16 'Nightmares and Dreams', SS03 'Consumed'..."
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500 selection:bg-emerald-500/40 selection:text-white placeholder:text-neutral-600 cursor-text"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1 font-bold">
                        Brand
                      </label>
                      <select
                        value={editFormData.brand}
                        onChange={(e) => setEditFormData({ ...editFormData, brand: e.target.value })}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      >
                        {POPULAR_BRANDS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1 font-bold">
                        Category
                      </label>
                      <select
                        value={editFormData.category}
                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1 font-bold">
                        Source Price ($USD)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.price}
                        onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500 selection:bg-emerald-500/40 selection:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1 font-bold">
                        Est. Retail ($USD)
                      </label>
                      <input
                        type="number"
                        value={editFormData.estimatedRetail}
                        onChange={(e) => setEditFormData({ ...editFormData, estimatedRetail: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500 selection:bg-emerald-500/40 selection:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-mono uppercase text-neutral-400 font-bold">
                        Direct Marketplace URL (Weidian / Taobao / 1688)
                      </label>
                      {editFormData.rawMarketUrl && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(editFormData.rawMarketUrl || "", "url")}
                          className="text-[10px] font-mono text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-neutral-800"
                          title="Copy marketplace URL"
                        >
                          {copiedField === "url" ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-2.5 h-2.5 text-neutral-500" />
                              <span>Copy URL</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={editFormData.rawMarketUrl}
                      onChange={(e) => setEditFormData({ ...editFormData, rawMarketUrl: e.target.value })}
                      placeholder="https://item.taobao.com/..."
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500 selection:bg-emerald-500/40 selection:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* STUDIO PHOTO PICKER & SEARCH */}
              <div className="pt-4 border-t border-neutral-800 space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                      Studio Photo Picker & Search
                    </span>
                    <span className="text-[11px] font-mono text-neutral-500 hidden sm:inline">
                      (Click any thumbnail, upload file, or paste URL to generate studio cutout)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={imageSearchQuery}
                      onChange={(e) => setImageSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          fetchAlternativeImages(imageSearchQuery, editFormData.rawMarketUrl || editingItem.rawMarketUrl);
                        }
                      }}
                      placeholder="Search piece studio photos..."
                      className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white w-48 sm:w-60 focus:outline-none focus:border-emerald-500 selection:bg-emerald-500/40 selection:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => fetchAlternativeImages(imageSearchQuery, editFormData.rawMarketUrl || editingItem.rawMarketUrl)}
                      disabled={isFetchingImages}
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono uppercase rounded flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      {isFetchingImages ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Search className="w-3 h-3" />
                      )}
                      <span>Find Photos</span>
                    </button>
                  </div>
                </div>

                {/* Paste Direct Image URL & Upload Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={customImageUrlInput}
                    onChange={(e) => setCustomImageUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customImageUrlInput.trim()) {
                        e.preventDefault();
                        handleApplyAlternateImage(customImageUrlInput);
                      }
                    }}
                    placeholder="Paste direct image URL from Sugargoo / Taobao / Web..."
                    className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 selection:bg-emerald-500/40 selection:text-white"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleApplyAlternateImage(customImageUrlInput)}
                      disabled={isApplyingCutout || !customImageUrlInput.trim()}
                      className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold uppercase rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Apply Cutout ✨</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isApplyingCutout}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-mono uppercase rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      title="Upload local image file"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Upload</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClipboardPasteImage}
                      disabled={isApplyingCutout}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-mono uppercase rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      title="Paste image directly from clipboard (Ctrl+V)"
                    >
                      <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Paste</span>
                    </button>
                  </div>
                </div>

                {/* Alternative Studio Images Grid */}
                {isFetchingImages ? (
                  <div className="py-6 flex flex-col items-center justify-center gap-2 bg-neutral-950/50 rounded-xl border border-neutral-800">
                    <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                    <span className="text-xs font-mono text-neutral-400">
                      Searching Weidian/Taobao seller flat-lays & studio archives...
                    </span>
                  </div>
                ) : alternateImages.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 max-h-36 overflow-y-auto p-2 bg-neutral-950/60 rounded-xl border border-neutral-800">
                    {alternateImages.map((src, idx) => {
                      const isSelected = selectedImageSrc === src;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyAlternateImage(src)}
                          disabled={isApplyingCutout}
                          title="Click to apply AI cutout from this studio photo"
                          className={`relative aspect-square rounded-lg overflow-hidden border transition-all p-1 bg-black group ${
                            isSelected
                              ? "border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] ring-1 ring-emerald-500"
                              : "border-neutral-800 hover:border-neutral-600"
                          }`}
                        >
                          <img
                            src={src}
                            alt={`Studio option ${idx + 1}`}
                            className="w-full h-full object-contain filter group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors flex items-center justify-center">
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              {/* Ingestion Progress */}
              {(ingestModalProgress.isIngesting || ingestModalProgress.phase === "SUCCESS" || ingestModalProgress.phase === "ERROR") && (
                <div className="space-y-3 pt-4 border-t border-neutral-800">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white font-bold flex items-center gap-2">
                      {ingestModalProgress.phase === "SUCCESS" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : ingestModalProgress.phase === "ERROR" ? (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      ) : (
                        <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                      )}
                      <span>{ingestModalProgress.message}</span>
                    </span>
                    <span className="text-emerald-400 font-bold">{ingestModalProgress.percent}%</span>
                  </div>

                  <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      className={`h-full transition-all duration-300 ease-out ${
                        ingestModalProgress.phase === "ERROR"
                          ? "bg-red-500"
                          : "bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                      }`}
                      style={{ width: `${ingestModalProgress.percent}%` }}
                    />
                  </div>

                  <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/80 font-mono text-[11px] space-y-1 max-h-28 overflow-y-auto">
                    {ingestModalProgress.logs.map((log, idx) => (
                      <div key={idx} className="text-neutral-400 flex items-start gap-2">
                        <span className="text-neutral-600 select-none">&gt;</span>
                        <span className={log.includes("[ERROR]") ? "text-red-400" : log.includes("✓") || log.includes("[4/4]") ? "text-emerald-400 font-bold" : ""}>
                          {log}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Sticky Footer (Always pinned at bottom!) */}
            <div className="flex items-center justify-between p-4 px-6 border-t border-neutral-800 bg-neutral-950/95 shrink-0">
              <button
                type="button"
                onClick={closeModal}
                disabled={ingestModalProgress.isIngesting}
                className="px-4 py-2 text-xs font-mono text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
              >
                {ingestModalProgress.phase === "SUCCESS" ? "DONE / CLOSE" : "CANCEL"}
              </button>

              {ingestModalProgress.phase !== "SUCCESS" ? (
                <div className="flex items-center gap-3">
                  {/* DISCARD / TRASH BUTTON */}
                  <button
                    type="button"
                    onClick={() => {
                      if (editingItem) {
                        handleDismissPiece(editingItem);
                        closeModal();
                      }
                    }}
                    disabled={ingestModalProgress.isIngesting}
                    className="px-4 py-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 font-mono text-xs font-bold uppercase rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    title="Discard piece from moderation queue and blacklist source link"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>DISCARD / TRASH</span>
                  </button>

                  {/* TEST ON SUGARGOO BUTTON */}
                  {(() => {
                    const rawUrl = editFormData.rawMarketUrl || editingItem?.rawMarketUrl || "";
                    const sgUrl =
                      editingItem?.sugargooUrl ||
                      (rawUrl ? `https://www.sugargoo.com/products?productLink=${encodeURIComponent(rawUrl)}&memberId=1325437696506389977` : "#");
                    return (
                      <a
                        href={sgUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 font-mono text-xs font-bold uppercase rounded-lg flex items-center gap-1.5 transition-colors"
                        title="Test & verify purchasing on Sugargoo in a new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                        <span>TEST ON SUGARGOO ↗</span>
                      </a>
                    );
                  })()}

                  {/* CONFIRM & INGEST BUTTON */}
                  <button
                    type="button"
                    onClick={handleConfirmIngest}
                    disabled={ingestModalProgress.isIngesting || !editFormData.title.trim()}
                    className="px-6 py-2.5 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-all rounded-lg flex items-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {ingestModalProgress.isIngesting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>INGESTING...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-black" />
                        <span>CONFIRM & INGEST GRAIL</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <a
                    href="/admin/slides"
                    className="px-4 py-2.5 bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-700 transition-colors rounded-lg flex items-center gap-1.5 border border-neutral-700"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>9:16 Slide Studio</span>
                  </a>
                  <a
                    href={ingestModalProgress.ingestedSlug ? `/product/${ingestModalProgress.ingestedSlug}` : "/"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-emerald-500 text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-emerald-400 transition-all rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-500/25"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>VIEW IN STORE CATALOG ↗</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
