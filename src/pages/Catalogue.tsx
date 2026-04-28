// src/pages/Catalogue.tsx – with variants, fabric types, extra pillows, per‑variant pricing,
// quick‑selection buttons for colors and sizes, and custom color entry (tag input).
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Filter,
  Package,
  X,
  Image as ImageIcon,
  RefreshCcw,
  Save,
  AlertTriangle,
  Check,
  Layers,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------
interface ProductVariant {
  _id?: string;                    
  attributes: {
    size?: string;
    color?: string;
    fabric?: string;
  };
  sku: string;
  price: number;                      // 0 means use product base price
  quantity: number;
  lowStockThreshold: number;
  image?: string;                      // optional variant image
}

interface Product {
  _id: string;
  name: string;
  category: string; // parent slug
  subcategory?: string; // child slug optional
  sku: string;
  description: string;
  shortDescription?: string;
  price: number;

  // inventory (simple products only; for variants, use variants array)
  quantity: number;
  lowStockThreshold?: number;
  availability: "In Stock" | "Out of Stock" | "Low Stock";

  color: string[]; // hex values or color names
  material: string;
  size: string[];

  // NEW FIELDS
  fabricTypes?: string[];            // e.g., ["cotton", "polyester"]
  extraPillows?: number;              // number of extra pillows included

  weight: string;
  location: string;
  deliveryTime?: string;

  image: string;
  galleryImages: string[];

  // VARIANTS (if any)
  variants?: ProductVariant[];
  hasVariants: boolean;                // derived flag, not stored

  createdAt: string;
  updatedAt: string;

  // ids (optional)
  parentCategoryId?: string | null;
  categoryId?: string | null;
  subCategoryId?: string | null;
}

type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  segment?: string;
};

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------
const API_BASE = "https://api.jsgallor.com";
const MAX_TOTAL_IMAGES = 5;

const colors = [
  { name: "Brown", value: "#8B7355" },
  { name: "Black", value: "#1C1C1C" },
  { name: "White", value: "#F5E6D3" },
  { name: "Grey", value: "#4A4A4A" },
  { name: "Green", value: "#4A6741" },
  { name: "Blue", value: "#2C3E50" },
];

const fabrics = [
  { name: "Cotton", value: "cotton" },
  { name: "Polyester", value: "polyester" },
  { name: "Linen", value: "linen" },
  { name: "Velvet", value: "velvet" },
  { name: "Leather", value: "leather" },
  { name: "Suede", value: "suede" },
  { name: "Chenille", value: "chenille" },
  { name: "Microfiber", value: "microfiber" },
];

// helper to display color names from hex array (fallback to original string)
const colorNames = (colorArray?: string[]) => {
  if (!colorArray || colorArray.length === 0) return "N/A";
  return colorArray
    .map((c) => {
      const found = colors.find((col) => col.value.toLowerCase() === c.toLowerCase());
      return found ? found.name : c;
    })
    .join(", ");
};

const fabricNames = (fabricArray?: string[]) => {
  if (!fabricArray || fabricArray.length === 0) return "N/A";
  return fabricArray
    .map((val) => fabrics.find((f) => f.value === val)?.name || val)
    .join(", ");
};

// ✅ inventory-safe availability (for simple products)
const computeAvailability = (qty: number, low = 5) => {
  const q = Number.isFinite(qty) ? qty : 0;
  const l = Number.isFinite(low) ? low : 5;
  if (q <= 0) return "Out of Stock";
  if (q <= l) return "Low Stock";
  return "In Stock";
};

// compute total stock for a product (sum of variants if any)
const totalStock = (product: Product): number => {
  if (product.variants && product.variants.length > 0) {
    return product.variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
  }
  return product.quantity ?? 0;
};

// compute overall availability based on total stock
const overallAvailability = (product: Product): string => {
  if (product.variants && product.variants.length > 0) {
    const total = totalStock(product);
    const anyLow = product.variants.some(v => v.quantity <= (v.lowStockThreshold ?? 5));
    if (total <= 0) return "Out of Stock";
    if (anyLow) return "Low Stock";
    return "In Stock";
  }
  return computeAvailability(product.quantity ?? 0, product.lowStockThreshold ?? 5);
};

// ----------------------------------------------------------------------
// API HELPERS
// ----------------------------------------------------------------------
const apiRequest = async <T = any>(method: string, endpoint: string, data?: any): Promise<T> => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed");
  }

  return payload as T;
};

const uploadManyImages = async (files: File[]) => {
  const token = localStorage.getItem("token");
  const form = new FormData();
  files.forEach((f) => form.append("images", f)); // upload.array("images", 5)

  const res = await fetch(`${API_BASE}/api/upload/multiple`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.success || !Array.isArray(data.files)) {
    throw new Error(data?.message || "Upload failed");
  }

  return data.files as { url: string; public_id?: string }[];
};

// ----------------------------------------------------------------------
// SKU Helpers
// ----------------------------------------------------------------------
const slugifySku = (s: string) =>
  (s || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const randomAlnum = (len: number) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

const generateSku = (name: string, category: string) => {
  const n = slugifySku(name).split("-").slice(0, 2).join("");
  const c = slugifySku(category).split("-")[0] || "PRD";
  return `${c}-${n || "ITEM"}-${randomAlnum(6)}`;
};

const generateVariantSku = (baseSku: string, attributes: Record<string, string>) => {
  const attPart = Object.values(attributes)
    .map(v => slugifySku(v).substring(0, 3))
    .join("-");
  return `${baseSku}-${attPart}-${randomAlnum(4)}`;
};

function safeItemsFromCategoryResponse(res: any): CategoryNode[] {
  const items =
    res?.items ||
    res?.categories ||
    res?.data?.items ||
    res?.data?.categories ||
    [];
  return Array.isArray(items) ? items : [];
}

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
export default function Catalogue() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
const [customFabricInput, setCustomFabricInput] = useState("");
const [editCustomFabricInput, setEditCustomFabricInput] = useState("");
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // filter by parent + sub (dependent)
  const [selectedParentId, setSelectedParentId] = useState<string>("all");
  const [selectedSubId, setSelectedSubId] = useState<string>("all");

  // Categories
  const [categoryNodes, setCategoryNodes] = useState<CategoryNode[]>([]);
  const [catLoading, setCatLoading] = useState(false);

  // Quick inventory draft (only for simple products)
  const [invDraft, setInvDraft] = useState<Record<string, { qty: string; low: string }>>({});

  // Custom color input states
  const [customColorInput, setCustomColorInput] = useState("");
  const [editCustomColorInput, setEditCustomColorInput] = useState("");

  // --------------------------------------------------------------------
  // Helper functions for color array management
  // --------------------------------------------------------------------
  const addColorToArray = (currentColors: string[], newColor: string): string[] => {
    const trimmed = newColor.trim();
    if (!trimmed) return currentColors;
    if (currentColors.includes(trimmed)) return currentColors;
    return [...currentColors, trimmed];
  };

  // --------------------------------------------------------------------
  // Fetch categories
  // --------------------------------------------------------------------
  const fetchCategories = async () => {
    try {
      setCatLoading(true);
      const res = await apiRequest("GET", "/api/admin/categories?limit=500");
      setCategoryNodes(safeItemsFromCategoryResponse(res));
    } catch (e: any) {
      toast({
        title: "Category fetch failed",
        description: e?.message || "Unable to load categories",
        variant: "destructive",
      });
    } finally {
      setCatLoading(false);
    }
  };
const addFabricToArray = (
  currentFabrics: string[] = [],
  newFabric: string
): string[] => {
  const trimmed = newFabric.trim().toLowerCase();
  if (!trimmed) return currentFabrics;
  if (currentFabrics.includes(trimmed)) return currentFabrics;
  return [...currentFabrics, trimmed];
};

const parseSizeString = (value: string): string[] => {
  return value
    ? value.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
};
  const parentCategories = useMemo(() => {
    return categoryNodes
      .filter((c) => !c.parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categoryNodes]);

  const subsByParent = useMemo(() => {
    const map = new Map<string, CategoryNode[]>();
    categoryNodes.forEach((c) => {
      if (!c.parentId) return;
      if (!map.has(c.parentId)) map.set(c.parentId, []);
      map.get(c.parentId)!.push(c);
    });
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => a.name.localeCompare(b.name));
      map.set(k, arr);
    }
    return map;
  }, [categoryNodes]);

  const categoryById = useMemo(() => {
    const m = new Map<string, CategoryNode>();
    categoryNodes.forEach((c) => m.set(c.id, c));
    return m;
  }, [categoryNodes]);

  const categoryBySlug = useMemo(() => {
    const m = new Map<string, CategoryNode>();
    categoryNodes.forEach((c) => m.set((c.slug || "").trim(), c));
    return m;
  }, [categoryNodes]);

  const getDisplayCategory = (parentSlug: string, subSlug?: string) => {
    const parent = categoryBySlug.get((parentSlug || "").trim());
    const sub = subSlug ? categoryBySlug.get((subSlug || "").trim()) : null;
    if (parent && sub) return `${parent.name} / ${sub.name}`;
    if (parent) return parent.name;
    return parentSlug || "N/A";
  };

  const getParentIdForProduct = (p: Product) => {
    if (p.categoryId) return p.categoryId;
    const node = categoryBySlug.get((p.category || "").trim());
    if (!node) return null;
    return node.parentId ? node.parentId : node.id;
  };

  const getSubIdForProduct = (p: Product) => {
    if (p.subCategoryId) return p.subCategoryId;
    const node = categoryBySlug.get((p.subcategory || "").trim());
    return node?.id || null;
  };

  // --------------------------------------------------------------------
  // Fetch products
  // --------------------------------------------------------------------
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ products: Product[] }>("GET", "/api/products");
      const list = data.products || [];

      // normalize each product (ensure arrays, compute availability, set hasVariants flag)
      const normalized = list.map((p) => {
        const low = p.lowStockThreshold ?? 5;

        // ensure size array
        let sizeArray: string[];
        if (Array.isArray(p.size)) {
          sizeArray = p.size;
        } else if (typeof p.size === "string" && p.size) {
          sizeArray = [p.size];
        } else {
          sizeArray = [];
        }

        // ensure color array
        let colorArray: string[];
        if (Array.isArray(p.color)) {
          colorArray = p.color;
        } else if (typeof p.color === "string" && p.color) {
          colorArray = [p.color];
        } else {
          colorArray = [];
        }

        // ensure fabricTypes array
        let fabricArray: string[] = [];
        if (Array.isArray(p.fabricTypes)) {
          fabricArray = p.fabricTypes;
        } else if (typeof p.fabricTypes === "string" && p.fabricTypes) {
          fabricArray = [p.fabricTypes];
        }

        const hasVariants = !!(p.variants && p.variants.length > 0);

        return {
          ...p,
          lowStockThreshold: low,
          availability: hasVariants
            ? overallAvailability(p) // will be recomputed later
            : computeAvailability(p.quantity ?? 0, low),
          size: sizeArray,
          color: colorArray,
          fabricTypes: fabricArray,
          hasVariants,
        };
      });

      setProducts(normalized);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Initialize inventory drafts for simple products
  useEffect(() => {
    const initial: Record<string, { qty: string; low: string }> = {};
    products.forEach((p) => {
      if (!p.hasVariants) {
        initial[p._id] = {
          qty: String(p.quantity ?? 0),
          low: String(p.lowStockThreshold ?? 5),
        };
      }
    });
    setInvDraft(initial);
  }, [products]);

  // --------------------------------------------------------------------
  // Filter products
  // --------------------------------------------------------------------
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(s) ||
          getDisplayCategory(p.category || "", p.subcategory || "")
            .toLowerCase()
            .includes(s) ||
          (p.sku || "").toLowerCase().includes(s) ||
          (p.description || "").toLowerCase().includes(s) ||
          (Array.isArray(p.size) && p.size.some(sz => sz.toLowerCase().includes(s))) ||
          (Array.isArray(p.color) && p.color.some(col => {
            const colName = colors.find(c => c.value.toLowerCase() === col.toLowerCase())?.name.toLowerCase();
            return colName?.includes(s) || col.toLowerCase().includes(s);
          })) ||
          (Array.isArray(p.fabricTypes) && p.fabricTypes.some(f => f.toLowerCase().includes(s)))
      );
    }

    if (selectedParentId !== "all") {
      filtered = filtered.filter((p) => {
        const pid = getParentIdForProduct(p);
        if (!pid) return false;
        if (pid !== selectedParentId) return false;

        if (selectedSubId !== "all") {
          const sid = getSubIdForProduct(p);
          return sid === selectedSubId;
        }
        return true;
      });
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedParentId, selectedSubId, products, categoryBySlug]);

  // --------------------------------------------------------------------
  // UI helpers
  // --------------------------------------------------------------------
  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "In Stock":
        return "bg-green-900/30 text-green-400 border border-green-800";
      case "Out of Stock":
        return "bg-red-900/30 text-red-400 border border-red-800";
      case "Low Stock":
        return "bg-yellow-900/30 text-yellow-400 border border-yellow-800";
      default:
        return "bg-gray-800 text-gray-400";
    }
  };

  // --------------------------------------------------------------------
  // Blob URL cleanup (on unmount)
  // --------------------------------------------------------------------
  const revokeBlobUrls = useCallback((...urls: string[]) => {
    urls.forEach(url => {
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
    });
  }, []);

  useEffect(() => {
    return () => {
      // cleanup any lingering blob URLs on unmount
    };
  }, []);

  // --------------------------------------------------------------------
  // Add product form state
  // --------------------------------------------------------------------
  const [newProduct, setNewProduct] = useState({
    name: "",
    parentCategoryId: "",
    subCategoryId: "",
    category: "", // parent slug (optional)
    subcategory: "", // child slug (optional)

    sku: "",
    description: "",
    shortDescription: "",
    price: "",
    quantity: "",
    lowStockThreshold: "5",

    // colors (array)
    color: [] as string[],
    material: "",
    // sizes (comma-separated string)
    size: "",
    // NEW: fabric types (array)
    fabricTypes: [] as string[],
    // NEW: extra pillows (number)
    extraPillows: "",

    weight: "",
    location: "",
    deliveryTime: "",

    image: "https://via.placeholder.com/600x400?text=Main+Image",

    // variant toggle
    enableVariants: false,
    // variants array (for when enableVariants is true)
    variants: [] as ProductVariant[],
  });

  // Add uploads (files + previews)
  const [newMainFile, setNewMainFile] = useState<File | null>(null);
  const [newMainPreview, setNewMainPreview] = useState<string>("");
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);

  // Edit uploads + category selections
  const [editMainFile, setEditMainFile] = useState<File | null>(null);
  const [editMainPreview, setEditMainPreview] = useState<string>("");
  const [editNewGalleryFiles, setEditNewGalleryFiles] = useState<File[]>([]);
  const [editNewGalleryPreviews, setEditNewGalleryPreviews] = useState<string[]>([]);

  const [editParentId, setEditParentId] = useState<string>("");
  const [editSubId, setEditSubId] = useState<string>("");
  const [editEnableVariants, setEditEnableVariants] = useState(false);
  const [editVariants, setEditVariants] = useState<ProductVariant[]>([]);

  // Quick inventory saving id
  const [invSavingId, setInvSavingId] = useState<string | null>(null);

  // --------------------------------------------------------------------
  // Reset add/upload state
  // --------------------------------------------------------------------
  const resetAddUploadState = useCallback(() => {
    revokeBlobUrls(newMainPreview, ...newGalleryPreviews);
    setNewMainFile(null);
    setNewMainPreview("");
    setNewGalleryFiles([]);
    setNewGalleryPreviews([]);
  }, [newMainPreview, newGalleryPreviews, revokeBlobUrls]);

  const resetEditUploadState = useCallback(() => {
    revokeBlobUrls(editMainPreview, ...editNewGalleryPreviews);
    setEditMainFile(null);
    setEditMainPreview("");
    setEditNewGalleryFiles([]);
    setEditNewGalleryPreviews([]);
  }, [editMainPreview, editNewGalleryPreviews, revokeBlobUrls]);

  // --------------------------------------------------------------------
  // Add: default category selection when modal opens
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!addOpen) return;
    if (!parentCategories.length) return;

    setNewProduct((prev) => {
      if (prev.parentCategoryId) return prev;

      const firstParent = parentCategories[0];
      const firstSubs = subsByParent.get(firstParent.id) || [];
      const firstSub = firstSubs[0];

      return {
        ...prev,
        parentCategoryId: firstParent.id,
        subCategoryId: firstSub?.id || "",
      };
    });
  }, [addOpen, parentCategories, subsByParent]);

  // --------------------------------------------------------------------
  // Edit: when opening edit, set parent/sub selections and variants
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!editProduct) return;

    const pid = getParentIdForProduct(editProduct) || "";
    const sid = getSubIdForProduct(editProduct) || "";
    setEditParentId(pid);
    setEditSubId(sid);
    setEditEnableVariants(editProduct.hasVariants);
    setEditVariants(editProduct.variants || []);

    resetEditUploadState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editProduct?._id]);

  // --------------------------------------------------------------------
  // Add image handlers (same as before, but using revokeBlobUrls)
  // --------------------------------------------------------------------
  const onPickNewMain = (file: File | null) => {
    if (!file) {
      if (newMainPreview) revokeBlobUrls(newMainPreview);
      setNewMainFile(null);
      setNewMainPreview("");
      return;
    }

    const total = 1 + newGalleryFiles.length;
    if (total > MAX_TOTAL_IMAGES) {
      toast({
        title: "Limit reached",
        description: `You can upload up to ${MAX_TOTAL_IMAGES} images total (main + gallery).`,
        variant: "destructive",
      });
      return;
    }

    if (newMainPreview) revokeBlobUrls(newMainPreview);
    setNewMainFile(file);
    setNewMainPreview(URL.createObjectURL(file));
  };

  const onPickNewGallery = (files: FileList | null) => {
    if (!files) return;

    const picked = Array.from(files);
    const mainCount = newMainFile ? 1 : 0;
    const remainingSlots = MAX_TOTAL_IMAGES - mainCount;
    const allowed = picked.slice(0, Math.max(0, remainingSlots));

    if (picked.length > allowed.length) {
      toast({
        title: "Limit reached",
        description: `Only ${allowed.length} gallery image(s) allowed (max total ${MAX_TOTAL_IMAGES}).`,
        variant: "destructive",
      });
    }

    revokeBlobUrls(...newGalleryPreviews);
    setNewGalleryFiles(allowed);
    setNewGalleryPreviews(allowed.map((f) => URL.createObjectURL(f)));
  };

  const removeNewGalleryAt = (index: number) => {
    revokeBlobUrls(newGalleryPreviews[index]);
    setNewGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setNewGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onPickEditMain = (file: File | null) => {
    if (!file) {
      if (editMainPreview) revokeBlobUrls(editMainPreview);
      setEditMainFile(null);
      setEditMainPreview("");
      return;
    }
    if (editMainPreview) revokeBlobUrls(editMainPreview);
    setEditMainFile(file);
    setEditMainPreview(URL.createObjectURL(file));
  };

  const onPickEditNewGallery = (files: FileList | null) => {
    if (!files || !editProduct) return;

    const picked = Array.from(files);
    const existingGalleryCount = editProduct.galleryImages?.length || 0;
    const existingCount = 1 + existingGalleryCount;
    const remainingSlots = Math.max(0, MAX_TOTAL_IMAGES - existingCount);

    const allowed = picked.slice(0, remainingSlots);

    if (picked.length > allowed.length) {
      toast({
        title: "Limit reached",
        description: `You can add only ${allowed.length} more image(s). Total max is ${MAX_TOTAL_IMAGES} (main + gallery).`,
        variant: "destructive",
      });
    }

    revokeBlobUrls(...editNewGalleryPreviews);
    setEditNewGalleryFiles(allowed);
    setEditNewGalleryPreviews(allowed.map((f) => URL.createObjectURL(f)));
  };

  const removeEditNewGalleryAt = (index: number) => {
    revokeBlobUrls(editNewGalleryPreviews[index]);
    setEditNewGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setEditNewGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingGalleryAt = (index: number) => {
    if (!editProduct) return;
    const next = (editProduct.galleryImages || []).filter((_, i) => i !== index);
    setEditProduct({ ...editProduct, galleryImages: next });
  };

  // --------------------------------------------------------------------
  // SKU Auto generate (Add)
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!addOpen) return;

    setNewProduct((prev) => {
      const skuTrim = (prev.sku || "").trim();
      if (skuTrim) return prev;
      const parent = categoryById.get(prev.parentCategoryId);
      const autoSku = generateSku(prev.name, parent?.slug || "PRD");
      return { ...prev, sku: autoSku };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addOpen, newProduct.name, newProduct.parentCategoryId, categoryById]);

  const forceGenerateNewSku = () => {
    const parent = categoryById.get(newProduct.parentCategoryId);
    setNewProduct((prev) => ({
      ...prev,
      sku: generateSku(prev.name, parent?.slug || "PRD"),
    }));
  };

  const forceGenerateEditSku = () => {
    if (!editProduct) return;
    const parent = categoryById.get(editParentId);
    setEditProduct((prev) =>
      prev ? { ...prev, sku: generateSku(prev.name, parent?.slug || "PRD") } : prev,
    );
  };

  // --------------------------------------------------------------------
  // Variant generation (for add form)
  // --------------------------------------------------------------------
  const generateVariantsFromSelections = useCallback((
    sizes: string[],
    colors: string[],
    fabrics: string[],
    baseSku: string,
    basePrice: number,
    baseLow: number
  ): ProductVariant[] => {
    const combos: Array<{ size?: string; color?: string; fabric?: string }> = [];
    // If no sizes, colors, fabrics selected, return empty
    const sizeList = sizes.length ? sizes : [undefined];
    const colorList = colors.length ? colors : [undefined];
    const fabricList = fabrics.length ? fabrics : [undefined];

    sizeList.forEach(size => {
      colorList.forEach(color => {
        fabricList.forEach(fabric => {
          // skip if all undefined? we allow empty variant? maybe not.
          if (!size && !color && !fabric) return;
          combos.push({ size, color, fabric });
        });
      });
    });

    return combos.map((attrs) => ({
      attributes: attrs,
      sku: generateVariantSku(baseSku, attrs as Record<string, string>),
      price: basePrice,
      quantity: 0,
      lowStockThreshold: baseLow,
    }));
  }, []);

  // When enableVariants toggled or selections change, regenerate variants
  useEffect(() => {
    if (!addOpen || !newProduct.enableVariants) return;

    // parse sizes from comma string
    const sizeArray = newProduct.size
      ? newProduct.size.split(",").map(s => s.trim()).filter(Boolean)
      : [];
    const colorArray = newProduct.color; // already array
    const fabricArray = newProduct.fabricTypes;

    const baseSku = newProduct.sku || "TEMP";
    const basePrice = parseFloat(newProduct.price) || 0;
    const baseLow = parseInt(newProduct.lowStockThreshold || "5", 10);

    const generated = generateVariantsFromSelections(
      sizeArray,
      colorArray,
      fabricArray,
      baseSku,
      basePrice,
      baseLow
    );

    setNewProduct(prev => ({
      ...prev,
      variants: generated,
    }));
  }, [
    addOpen,
    newProduct.enableVariants,
    newProduct.size,
    newProduct.color,
    newProduct.fabricTypes,
    newProduct.sku,
    newProduct.price,
    newProduct.lowStockThreshold,
    generateVariantsFromSelections,
  ]);

  // Update a single variant in add form
  const updateNewVariant = (index: number, field: keyof ProductVariant, value: any) => {
    setNewProduct(prev => {
      const updated = [...(prev.variants || [])];
      if (!updated[index]) return prev;
      if (field === 'attributes') {
        updated[index] = { ...updated[index], attributes: value };
      } else if (field === 'sku' || field === 'price' || field === 'quantity' || field === 'lowStockThreshold') {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, variants: updated };
    });
  };

  // --------------------------------------------------------------------
  // Add product submit
  // --------------------------------------------------------------------
  const handleAdd = async () => {
    if (!newProduct.name || !newProduct.parentCategoryId || !newProduct.price) {
      toast({
        title: "Error",
        description: "Please fill all required fields (Name, Category, Price)",
        variant: "destructive",
      });
      return;
    }

    const total = (newMainFile ? 1 : 0) + (newGalleryFiles?.length || 0);
    if (total > MAX_TOTAL_IMAGES) {
      toast({
        title: "Error",
        description: `Max ${MAX_TOTAL_IMAGES} images allowed (main + gallery).`,
        variant: "destructive",
      });
      return;
    }

    // Validate variants if enabled
    if (newProduct.enableVariants) {
      if (!newProduct.variants || newProduct.variants.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one variant when variants are enabled.",
          variant: "destructive",
        });
        return;
      }
      // check each variant has sku and valid numbers
      for (let i = 0; i < newProduct.variants.length; i++) {
        const v = newProduct.variants[i];
        if (!v.sku.trim()) {
          toast({ title: "Error", description: `Variant #${i+1} SKU is required.`, variant: "destructive" });
          return;
        }
        if (v.quantity < 0 || v.lowStockThreshold < 0) {
          toast({ title: "Error", description: `Variant #${i+1} quantity/threshold must be >=0.`, variant: "destructive" });
          return;
        }
      }
    }

    try {
      setSaving(true);

      const allFiles: File[] = [];
      if (newMainFile) allFiles.push(newMainFile);
      allFiles.push(...newGalleryFiles);

      let mainImageUrl = newProduct.image;
      let galleryUrls: string[] = [];

      if (allFiles.length > 0) {
        const uploaded = await uploadManyImages(allFiles);
        const urls = uploaded.map((u) => u.url);

        if (newMainFile) {
          mainImageUrl = urls[0];
          galleryUrls = urls.slice(1);
        } else {
          galleryUrls = urls;
        }
      }

      const parent = categoryById.get(newProduct.parentCategoryId);
      const sub = newProduct.subCategoryId
        ? categoryById.get(newProduct.subCategoryId)
        : null;

      // Build product data
      const productData: any = {
  name: newProduct.name,
  categoryId: parent?.id,
  subCategoryId: sub?.id || null,
  category: parent?.slug,
  subcategory: sub?.slug || "",
  sku: newProduct.sku,
  shortDescription: newProduct.shortDescription,
  description: newProduct.description,
  price: parseFloat(newProduct.price),
  color: newProduct.color,
  size: parseSizeString(newProduct.size),
  material: newProduct.material,
  weight: newProduct.weight,
  location: newProduct.location,
  deliveryTime: newProduct.deliveryTime,
  image: mainImageUrl,
  galleryImages: galleryUrls,
  fabricTypes: newProduct.fabricTypes,
  extraPillows: newProduct.extraPillows
    ? parseInt(newProduct.extraPillows, 10)
    : 0,
};

      if (newProduct.enableVariants) {
        // For variant product, send variants array; simple product fields (quantity, lowStockThreshold) are ignored by backend
        productData.variants = newProduct.variants?.map(v => ({
          ...v,
          price: v.price, // keep as is, backend may store 0 as inherit
        }));
        productData.hasVariants = true;
      } else {
        // Simple product: send quantity and threshold
        const qty = newProduct.quantity ? parseInt(newProduct.quantity, 10) : 0;
        const low = newProduct.lowStockThreshold ? parseInt(newProduct.lowStockThreshold, 10) : 5;
        productData.quantity = qty;
        productData.lowStockThreshold = low;
        productData.hasVariants = false;
      }

      const data = await apiRequest<{ product: Product }>("POST", "/api/products", productData);

      const created = data.product;
      // Normalize
      const normalized: Product = {
        ...created,
        lowStockThreshold: created.lowStockThreshold ?? 5,
        availability: overallAvailability(created),
        color: Array.isArray(created.color) ? created.color : (created.color ? [created.color] : []),
        size: Array.isArray(created.size) ? created.size : (created.size ? [created.size] : []),
        fabricTypes: Array.isArray(created.fabricTypes) ? created.fabricTypes : (created.fabricTypes ? [created.fabricTypes] : []),
        hasVariants: !!(created.variants && created.variants.length > 0),
      };

      setProducts(prev => [normalized, ...prev]);
      setAddOpen(false);
      resetAddUploadState();

      // Reset newProduct
      setNewProduct({
        name: "",
        parentCategoryId: "",
        subCategoryId: "",
        category: "",
        subcategory: "",
        sku: "",
        description: "",
        shortDescription: "",
        price: "",
        quantity: "",
        lowStockThreshold: "5",
        color: [],
        material: "",
        size: "",
        fabricTypes: [],
        extraPillows: "",
        weight: "",
        location: "",
        deliveryTime: "",
        image: "https://via.placeholder.com/600x400?text=Main+Image",
        enableVariants: false,
        variants: [],
      });

      toast({ title: "Success", description: "Product created successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------------------------
  // Delete product
  // --------------------------------------------------------------------
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await apiRequest("DELETE", `/api/products/${id}`);
      const next = products.filter((p) => p._id !== id);
      setProducts(next);
      if (viewProduct?._id === id) setViewProduct(null);
      if (editProduct?._id === id) setEditProduct(null);
      toast({ title: "Success", description: "Product deleted successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  // --------------------------------------------------------------------
  // Save Edit
  // --------------------------------------------------------------------
  const handleSaveEdit = async () => {
    if (!editProduct) return;

    const existingGalleryCount = editProduct.galleryImages?.length || 0;
    const totalAfter =
      1 + existingGalleryCount + (editNewGalleryFiles?.length || 0);

    if (totalAfter > MAX_TOTAL_IMAGES) {
      toast({
        title: "Error",
        description: `Max ${MAX_TOTAL_IMAGES} images allowed (main + gallery). Remove some images first.`,
        variant: "destructive",
      });
      return;
    }

    // Validate variants if enabled
    if (editEnableVariants) {
      if (!editVariants || editVariants.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one variant when variants are enabled.",
          variant: "destructive",
        });
        return;
      }
      for (let i = 0; i < editVariants.length; i++) {
        const v = editVariants[i];
        if (!v.sku.trim()) {
          toast({ title: "Error", description: `Variant #${i+1} SKU is required.`, variant: "destructive" });
          return;
        }
        if (v.quantity < 0 || v.lowStockThreshold < 0) {
          toast({ title: "Error", description: `Variant #${i+1} quantity/threshold must be >=0.`, variant: "destructive" });
          return;
        }
      }
    }

    try {
      setSaving(true);

      const allFiles: File[] = [];
      if (editMainFile) allFiles.push(editMainFile);
      allFiles.push(...editNewGalleryFiles);

      let mainImageUrl = editProduct.image;
      let finalGallery = editProduct.galleryImages || [];

      if (allFiles.length > 0) {
        const uploaded = await uploadManyImages(allFiles);
        const urls = uploaded.map((u) => u.url);

        if (editMainFile) {
          mainImageUrl = urls[0];
          finalGallery = [...finalGallery, ...urls.slice(1)];
        } else {
          finalGallery = [...finalGallery, ...urls];
        }
      }

      const parentNode = editParentId ? categoryById.get(editParentId) : undefined;
      const subNode = editSubId ? categoryById.get(editSubId) : undefined;

const updateData: any = {
  name: editProduct.name,
  categoryId: parentNode?.id,
  subCategoryId: subNode?.id || null,
  category: parentNode?.slug,
  subcategory: subNode?.slug || "",
  sku: editProduct.sku,
  shortDescription: editProduct.shortDescription,
  description: editProduct.description,
  price: editProduct.price,
  color: editProduct.color,
  size: Array.isArray(editProduct.size)
    ? editProduct.size
    : editProduct.size
    ? [editProduct.size]
    : [],
  material: editProduct.material,
  weight: editProduct.weight,
  location: editProduct.location,
  deliveryTime: editProduct.deliveryTime,
  image: mainImageUrl,
  galleryImages: finalGallery,
  fabricTypes: editProduct.fabricTypes || [],
  extraPillows: editProduct.extraPillows || 0,
  hasVariants: editEnableVariants,
};
      if (editEnableVariants) {
        updateData.variants = editVariants.map(v => ({
          ...v,
          // ensure _id is sent for existing variants
        }));
        // For variant products, don't send quantity/lowStockThreshold
      } else {
        updateData.quantity = editProduct.quantity ?? 0;
        updateData.lowStockThreshold = editProduct.lowStockThreshold ?? 5;
      }

      const data = await apiRequest<{ product: Product }>("PUT", `/api/products/${editProduct._id}`, updateData);
      const updated = data.product;

      const normalizedUpdated: Product = {
        ...updated,
        lowStockThreshold: updated.lowStockThreshold ?? 5,
        availability: overallAvailability(updated),
        color: Array.isArray(updated.color) ? updated.color : (updated.color ? [updated.color] : []),
        size: Array.isArray(updated.size) ? updated.size : (updated.size ? [updated.size] : []),
        fabricTypes: Array.isArray(updated.fabricTypes) ? updated.fabricTypes : (updated.fabricTypes ? [updated.fabricTypes] : []),
        hasVariants: !!(updated.variants && updated.variants.length > 0),
      };

      const updatedProducts = products.map((p) =>
        p._id === editProduct._id ? normalizedUpdated : p,
      );

      setProducts(updatedProducts);
      setEditProduct(null);
      resetEditUploadState();

      toast({ title: "Success", description: "Product updated successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------------------------
  // Quick Inventory Update (only for simple products)
  // --------------------------------------------------------------------
  const saveInventory = async (productId: string) => {
    const d = invDraft[productId];
    if (!d) return;

    const qty = parseInt(d.qty || "0", 10);
    const low = parseInt(d.low || "5", 10);

    if (Number.isNaN(qty) || qty < 0) {
      toast({
        title: "Invalid quantity",
        description: "Quantity must be a number >= 0",
        variant: "destructive",
      });
      return;
    }

    if (Number.isNaN(low) || low < 0) {
      toast({
        title: "Invalid low stock threshold",
        description: "Low stock threshold must be a number >= 0",
        variant: "destructive",
      });
      return;
    }

    try {
      setInvSavingId(productId);
      const data = await apiRequest<{ product: Product }>("PATCH", `/api/products/${productId}/inventory`, {
        quantity: qty,
        lowStockThreshold: low,
      });

      const updated = data.product;

      const normalizedUpdated: Product = {
        ...updated,
        lowStockThreshold: updated.lowStockThreshold ?? low,
        availability: computeAvailability(updated.quantity ?? 0, updated.lowStockThreshold ?? low),
      };

      setProducts(prev => prev.map(p => p._id === productId ? { ...p, ...normalizedUpdated } : p));

      toast({ title: "Inventory updated", description: "Stock updated successfully" });
    } catch (e: any) {
      toast({
        title: "Inventory update failed",
        description: e?.message || "Unable to update stock",
        variant: "destructive",
      });
    } finally {
      setInvSavingId(null);
    }
  };

  // --------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------
  if (loading) {
    return (
      <DashboardLayout title="Catalogue Management">
        <div className="flex justify-center items-center h-96">
          <Loader2 className="w-12 h-12 animate-spin text-yellow-400" />
        </div>
      </DashboardLayout>
    );
  }

  const selectedParentSubs =
    selectedParentId !== "all" ? subsByParent.get(selectedParentId) || [] : [];

  const editSubs = editParentId ? subsByParent.get(editParentId) || [] : [];

  const addSubs = newProduct.parentCategoryId
    ? subsByParent.get(newProduct.parentCategoryId) || []
    : [];

  return (
    <>
      <Helmet>
        <title>Catalogue Management | Manufacturer Portal</title>
        <meta
          name="description"
          content="Manage your product catalogue - add, edit, and remove products"
        />
      </Helmet>

      <DashboardLayout title="Catalogue Management">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-yellow-400">
                Catalogue Management
              </h1>
              <p className="text-gray-400 mt-2">
                {filteredProducts.length} product
                {filteredProducts.length !== 1 ? "s" : ""} found
              </p>
            </div>

            {/* Add Modal Trigger */}
            <Dialog
              open={addOpen}
              onOpenChange={(open) => {
                setAddOpen(open);
                if (!open) resetAddUploadState();
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Product
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-gray-900 border border-gray-800 text-white">
                <DialogHeader>
                  <DialogTitle className="text-yellow-400">
                    Add New Product
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Toggle Variants */}
                  <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                    <Label className="text-gray-300 cursor-pointer flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newProduct.enableVariants}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, enableVariants: e.target.checked }))}
                        className="rounded border-gray-600"
                      />
                      <span>This product has variants (different sizes/colors/fabrics with own stock)</span>
                    </Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Column - Basic Info */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-gray-300">Product Name *</Label>
                        <Input
                          placeholder="Product Name"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          disabled={saving}
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                        />
                      </div>

                      <div>
                        <Label className="text-gray-300">Price *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                          disabled={saving}
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                        />
                      </div>

                      {/* Parent Category */}
                      <div>
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-300">Parent Category *</Label>
                          <button
                            type="button"
                            onClick={fetchCategories}
                            disabled={saving || catLoading}
                            className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                          >
                            <RefreshCcw className={`w-3 h-3 ${catLoading ? "animate-spin" : ""}`} />
                            Refresh
                          </button>
                        </div>
                        <select
                          value={newProduct.parentCategoryId}
                          onChange={(e) => {
                            const parentId = e.target.value;
                            const subs = subsByParent.get(parentId) || [];
                            const firstSub = subs[0];
                            setNewProduct((prev) => ({
                              ...prev,
                              parentCategoryId: parentId,
                              subCategoryId: firstSub?.id || "",
                            }));
                          }}
                          disabled={saving || catLoading || parentCategories.length === 0}
                          className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white
                          focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                          {parentCategories.length === 0 ? (
                            <option value="">No categories</option>
                          ) : (
                            parentCategories.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* Sub Category */}
                      <div>
                        <Label className="text-gray-300">Sub Category (optional)</Label>
                        <select
                          value={newProduct.subCategoryId || ""}
                          onChange={(e) =>
                            setNewProduct((prev) => ({ ...prev, subCategoryId: e.target.value }))
                          }
                          disabled={saving || catLoading || !newProduct.parentCategoryId}
                          className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white
                          focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                          <option value="">None (use parent)</option>
                          {addSubs.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* SKU */}
                      <div>
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-300">SKU (auto)</Label>
                          <button
                            type="button"
                            onClick={forceGenerateNewSku}
                            disabled={saving}
                            className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                          >
                            <RefreshCcw className="w-3 h-3" />
                            Regenerate
                          </button>
                        </div>
                        <Input
                          placeholder="Auto SKU"
                          value={newProduct.sku}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, sku: e.target.value.toUpperCase() })
                          }
                          disabled={saving}
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <Label className="text-gray-300">Description</Label>
                        <Textarea
                          rows={3}
                          value={newProduct.description}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, description: e.target.value })
                          }
                          disabled={saving}
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                        />
                      </div>
                    </div>

                    {/* Right Column - Attributes & Images */}
                    <div className="space-y-3">
                      {/* Colors */}
                      <div>
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-300">Colors</Label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setNewProduct(prev => ({ ...prev, color: colors.map(c => c.value) }))}
                              className="text-xs text-yellow-400 hover:text-yellow-300"
                            >
                              Select All
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewProduct(prev => ({ ...prev, color: [] }))}
                              className="text-xs text-yellow-400 hover:text-yellow-300"
                            >
                              Clear All
                            </button>
                          </div>
                        </div>

                        {/* Custom color input */}
                        <div className="flex gap-2 mt-2">
                          <Input
                            placeholder="Enter color name or hex (e.g. Red, #FF0000)"
                            value={customColorInput}
                            onChange={(e) => setCustomColorInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                setNewProduct(prev => ({
                                  ...prev,
                                  color: addColorToArray(prev.color, customColorInput)
                                }));
                                setCustomColorInput('');
                              }
                            }}
                            className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              setNewProduct(prev => ({
                                ...prev,
                                color: addColorToArray(prev.color, customColorInput)
                              }));
                              setCustomColorInput('');
                            }}
                            className="bg-yellow-500 hover:bg-yellow-600 text-black"
                            size="sm"
                          >
                            Add
                          </Button>
                        </div>

                        {/* Selected colors as tags */}
                        {newProduct.color.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {newProduct.color.map((color, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-700 text-white"
                              >
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                                {color}
                                <button
                                  type="button"
                                  onClick={() => setNewProduct(prev => ({
                                    ...prev,
                                    color: prev.color.filter((_, i) => i !== idx)
                                  }))}
                                  className="ml-1 text-gray-400 hover:text-white"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Predefined color checkboxes */}
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          {colors.map((colorOption) => {
                            const isSelected = newProduct.color.includes(colorOption.value);
                            return (
                              <label
                                key={colorOption.value}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors",
                                  isSelected
                                    ? "border-yellow-500 bg-yellow-500/10"
                                    : "border-gray-700 bg-gray-800 hover:bg-gray-700"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewProduct((prev) => ({
                                        ...prev,
                                        color: addColorToArray(prev.color, colorOption.value),
                                      }));
                                    } else {
                                      setNewProduct((prev) => ({
                                        ...prev,
                                        color: prev.color.filter((c) => c !== colorOption.value),
                                      }));
                                    }
                                  }}
                                />
                                <div
                                  className="w-4 h-4 rounded-full border border-gray-600"
                                  style={{ backgroundColor: colorOption.value }}
                                />
                                <span className="text-sm text-white">{colorOption.name}</span>
                                {isSelected && <Check className="w-4 h-4 ml-auto text-yellow-400" />}
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sizes */}
                      <div>
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-300">Sizes (comma separated)</Label>
                          <button
                            type="button"
                            onClick={() => {
                              if (!newProduct.size.trim()) {
                                setNewProduct(prev => ({ ...prev, size: "XS,S,M,L,XL" }));
                              } else {
                                toast({ title: "Sizes already set", description: "Clear the field first if you want to auto-fill." });
                              }
                            }}
                            className="text-xs text-yellow-400 hover:text-yellow-300"
                          >
                            Set 5 Sizes (XS,S,M,L,XL)
                          </button>
                        </div>
                        <Input
                          value={newProduct.size}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, size: e.target.value })
                          }
                          placeholder="e.g. S, M, L, XL"
                          disabled={saving}
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                        />
                      </div>

                      {/* Fabric Types (NEW) */}
                      <div>
  <Label className="text-gray-300">Fabric Types / Add-On Options</Label>

  <div className="flex gap-2 mt-2">
    <Input
      placeholder="Add fabric or add-on e.g. Rexine, Cushion Add-On"
      value={customFabricInput}
      onChange={(e) => setCustomFabricInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          setNewProduct((prev) => ({
            ...prev,
            fabricTypes: addFabricToArray(
              prev.fabricTypes,
              customFabricInput
            ),
          }));
          setCustomFabricInput("");
        }
      }}
      className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
    />

    <Button
      type="button"
      onClick={() => {
        setNewProduct((prev) => ({
          ...prev,
          fabricTypes: addFabricToArray(prev.fabricTypes, customFabricInput),
        }));
        setCustomFabricInput("");
      }}
      className="bg-yellow-500 hover:bg-yellow-600 text-black"
      size="sm"
    >
      Add
    </Button>
  </div>

  {newProduct.fabricTypes.length > 0 && (
    <div className="flex flex-wrap gap-2 mt-3">
      {newProduct.fabricTypes.map((fabric, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-700 text-white"
        >
          {fabric}
          <button
            type="button"
            onClick={() =>
              setNewProduct((prev) => ({
                ...prev,
                fabricTypes: prev.fabricTypes.filter((_, i) => i !== idx),
              }))
            }
            className="ml-1 text-gray-400 hover:text-white"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  )}

  <div className="grid grid-cols-2 gap-2 mt-3">
    {fabrics.map((fabric) => {
      const isSelected = newProduct.fabricTypes.includes(fabric.value);

      return (
        <label
          key={fabric.value}
          className={cn(
            "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors",
            isSelected
              ? "border-yellow-500 bg-yellow-500/10"
              : "border-gray-700 bg-gray-800 hover:bg-gray-700"
          )}
        >
          <input
            type="checkbox"
            className="sr-only"
            checked={isSelected}
            onChange={(e) => {
              if (e.target.checked) {
                setNewProduct((prev) => ({
                  ...prev,
                  fabricTypes: addFabricToArray(
                    prev.fabricTypes,
                    fabric.value
                  ),
                }));
              } else {
                setNewProduct((prev) => ({
                  ...prev,
                  fabricTypes: prev.fabricTypes.filter(
                    (f) => f !== fabric.value
                  ),
                }));
              }
            }}
          />
          <span className="text-sm text-white">{fabric.name}</span>
          {isSelected && <Check className="w-4 h-4 ml-auto text-yellow-400" />}
        </label>
      );
    })}
  </div>
</div>
                      {/* Extra Pillows (NEW) */}
                      <div>
                        <Label className="text-gray-300">Extra Pillows Included</Label>
                        <Input
                          type="number"
                          min="0"
                          value={newProduct.extraPillows}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, extraPillows: e.target.value })
                          }
                          placeholder="0"
                          disabled={saving}
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                        />
                      </div>

                      <div>
                        <Label className="text-gray-300">Material</Label>
                        <Input
                          value={newProduct.material}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, material: e.target.value })
                          }
                          disabled={saving}
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-gray-300">Weight</Label>
                          <Input
                            value={newProduct.weight}
                            onChange={(e) =>
                              setNewProduct({ ...newProduct, weight: e.target.value })
                            }
                            disabled={saving}
                            className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300">Location</Label>
                          <Input
                            value={newProduct.location}
                            onChange={(e) =>
                              setNewProduct({ ...newProduct, location: e.target.value })
                            }
                            disabled={saving}
                            className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-gray-300">Delivery Time</Label>
                        <Input
                          value={newProduct.deliveryTime}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, deliveryTime: e.target.value })
                          }
                          disabled={saving}
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                        />
                      </div>

                      {/* Main Image Upload */}
                      <div className="mt-2">
                        <Label className="text-gray-300">Main Image</Label>
                        <div className="mt-2 rounded-lg overflow-hidden border border-gray-700 bg-gray-800">
                          <img
                            src={newMainPreview || newProduct.image}
                            alt="Main preview"
                            className="w-full h-40 object-cover"
                          />
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
                          disabled={saving}
                          onChange={(e) => onPickNewMain(e.target.files?.[0] || null)}
                          className="mt-3 bg-gray-800 border-gray-700 text-white"
                        />
                      </div>

                      {/* Gallery Upload */}
                      <div className="mt-1">
                        <Label className="text-gray-300">Gallery Images (optional)</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={saving}
                          onChange={(e) => onPickNewGallery(e.target.files)}
                          className="mt-2 bg-gray-800 border-gray-700 text-white"
                        />
                        {newGalleryPreviews.length > 0 ? (
                          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                            {newGalleryPreviews.map((src, idx) => (
                              <div key={idx} className="relative w-20 h-20 flex-shrink-0">
                                <img
                                  src={src}
                                  alt={`Gallery ${idx + 1}`}
                                  className="w-20 h-20 object-cover rounded-lg border border-gray-700"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeNewGalleryAt(idx)}
                                  className="absolute -top-2 -right-2 bg-black/70 rounded-full p-1 border border-gray-700 hover:bg-black"
                                >
                                  <X className="w-3 h-3 text-white" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-3 text-xs text-gray-400 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            No gallery images selected
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Variants Table (if enabled) */}
                  {newProduct.enableVariants && (
                    <div className="mt-6 border-t border-gray-800 pt-4">
                      <h3 className="text-yellow-400 font-semibold mb-3">Product Variants</h3>
                      <p className="text-xs text-gray-400 mb-2">
                        Variants are generated based on selected sizes, colors, and fabrics. Edit SKU, price, quantity per variant.
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                            <tr>
                              <th className="px-4 py-2">Size</th>
                              <th className="px-4 py-2">Color</th>
                              <th className="px-4 py-2">Fabric</th>
                              <th className="px-4 py-2">SKU</th>
                              <th className="px-4 py-2">Price</th>
                              <th className="px-4 py-2">Quantity</th>
                              <th className="px-4 py-2">Low Stock</th>
                            </tr>
                          </thead>
                          <tbody>
                            {newProduct.variants?.map((variant, idx) => (
                              <tr key={idx} className="border-b border-gray-800">
                                <td className="px-4 py-2">{variant.attributes.size || '-'}</td>
                                <td className="px-4 py-2">
                                  {variant.attributes.color ? (
                                    <div className="flex items-center gap-1">
                                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: variant.attributes.color }} />
                                      <span>{colors.find(c => c.value === variant.attributes.color)?.name || variant.attributes.color}</span>
                                    </div>
                                  ) : '-'}
                                </td>
                                <td className="px-4 py-2">{fabrics.find(f => f.value === variant.attributes.fabric)?.name || variant.attributes.fabric || '-'}</td>
                                <td className="px-4 py-2">
                                  <Input
                                    value={variant.sku}
                                    onChange={(e) => updateNewVariant(idx, 'sku', e.target.value.toUpperCase())}
                                    className="bg-gray-800 border-gray-700 text-white h-8 text-xs"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={variant.price}
                                    onChange={(e) => updateNewVariant(idx, 'price', parseFloat(e.target.value) || 0)}
                                    className="bg-gray-800 border-gray-700 text-white h-8 text-xs w-24"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={variant.quantity}
                                    onChange={(e) => updateNewVariant(idx, 'quantity', parseInt(e.target.value) || 0)}
                                    className="bg-gray-800 border-gray-700 text-white h-8 text-xs w-20"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={variant.lowStockThreshold}
                                    onChange={(e) => updateNewVariant(idx, 'lowStockThreshold', parseInt(e.target.value) || 5)}
                                    className="bg-gray-800 border-gray-700 text-white h-8 text-xs w-20"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Simple product inventory fields (if variants not enabled) */}
                  {!newProduct.enableVariants && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label className="text-gray-300">Quantity</Label>
                        <Input
                          type="number"
                          min="0"
                          value={newProduct.quantity}
                          onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                          disabled={saving}
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Low Stock Threshold</Label>
                        <Input
                          type="number"
                          min="0"
                          value={newProduct.lowStockThreshold}
                          onChange={(e) => setNewProduct({ ...newProduct, lowStockThreshold: e.target.value })}
                          disabled={saving}
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={handleAdd}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Product"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAddOpen(false);
                        resetAddUploadState();
                      }}
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search products by name, category, SKU, size, color, fabric..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-800 text-white focus:border-yellow-500"
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-yellow-400" />
                <select
                  value={selectedParentId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setSelectedParentId(pid);
                    setSelectedSubId("all");
                  }}
                  className="bg-gray-900 border border-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="all">All Parent Categories</option>
                  {parentCategories.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedSubId}
                  onChange={(e) => setSelectedSubId(e.target.value)}
                  disabled={selectedParentId === "all"}
                  className="bg-gray-900 border border-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-60"
                >
                  <option value="all">All Sub Categories</option>
                  {selectedParentSubs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="outline"
                onClick={fetchCategories}
                disabled={catLoading}
                className="border-gray-800 text-gray-300 hover:bg-gray-800"
                title="Refresh Categories"
              >
                <RefreshCcw className={`w-4 h-4 mr-2 ${catLoading ? "animate-spin" : ""}`} />
                Categories
              </Button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No products found
              </h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || selectedParentId !== "all"
                  ? "Try adjusting your search or filter"
                  : "Start by adding your first product"}
              </p>
              <Button
                onClick={() => setAddOpen(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => {
              const stock = totalStock(product);
              const avail = overallAvailability(product);
              const isSimple = !product.hasVariants;

              return (
                <Card
                  key={product._id}
                  className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/4 p-5 bg-gray-800/50 flex items-center justify-center">
                        <div className="relative w-full h-48 md:h-full overflow-hidden rounded-lg">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                      </div>

                      <div className="flex-1 p-5">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-3 mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white">
                              {product.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-sm text-yellow-400 bg-yellow-900/30 px-2 py-1 rounded">
                                {getDisplayCategory(product.category, product.subcategory)}
                              </span>
                              <span className="text-sm text-gray-400">
                                SKU: {product.sku || "N/A"}
                              </span>
                              {product.hasVariants && (
                                <Badge className="bg-blue-900/30 text-blue-400 border border-blue-800">
                                  <Layers className="w-3 h-3 mr-1" /> Variants
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge className={`${getAvailabilityColor(avail)} font-medium`}>
                            {avail}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="bg-gray-800/50 p-3 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">Price</p>
                            <p className="font-semibold text-yellow-400">
                              ₹{Number(product.price || 0).toLocaleString()}
                            </p>
                          </div>

                          <div className="bg-gray-800/50 p-3 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">Total Stock</p>
                            <p className="font-semibold text-white">{stock}</p>
                          </div>

                          <div className="bg-gray-800/50 p-3 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">Colors</p>
                            <p className="font-semibold text-white truncate" title={colorNames(product.color)}>
                              {colorNames(product.color)}
                            </p>
                          </div>

                          <div className="bg-gray-800/50 p-3 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">Sizes</p>
                            <p className="font-semibold text-white truncate" title={product.size?.join(", ")}>
                              {product.size?.join(", ") || "N/A"}
                            </p>
                          </div>
                        </div>

                        {/* Quick Inventory (only for simple products) */}
                        {isSimple && invDraft[product._id] && (
                          <div className="mt-4 rounded-xl border border-gray-800 bg-gray-800/30 p-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-2 text-sm text-gray-300">
                                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                Quick Inventory Update
                              </div>
                              <div className="text-xs text-gray-500">
                                Updates stock without opening edit modal
                              </div>
                            </div>

                            <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                              <div>
                                <Label className="text-gray-300">Quantity</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={invDraft[product._id].qty}
                                  onChange={(e) =>
                                    setInvDraft((prev) => ({
                                      ...prev,
                                      [product._id]: {
                                        ...prev[product._id],
                                        qty: e.target.value,
                                      },
                                    }))
                                  }
                                  className="bg-gray-900 border-gray-700 text-white focus:border-yellow-500"
                                />
                              </div>
                              <div>
                                <Label className="text-gray-300">Low Stock Threshold</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={invDraft[product._id].low}
                                  onChange={(e) =>
                                    setInvDraft((prev) => ({
                                      ...prev,
                                      [product._id]: {
                                        ...prev[product._id],
                                        low: e.target.value,
                                      },
                                    }))
                                  }
                                  className="bg-gray-900 border-gray-700 text-white focus:border-yellow-500"
                                />
                              </div>
                              <Button
                                onClick={() => saveInventory(product._id)}
                                disabled={invSavingId === product._id}
                                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                              >
                                {invSavingId === product._id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Update
                                  </>
                                )}
                              </Button>
                            </div>

                            <div className="mt-2 text-xs text-gray-500">
                              New availability will become:{" "}
                              <span className="text-gray-300">
                                {computeAvailability(
                                  parseInt(invDraft[product._id].qty || "0", 10),
                                  parseInt(invDraft[product._id].low || "5", 10),
                                )}
                              </span>
                            </div>
                          </div>
                        )}

                        <p className="text-sm text-gray-300 mt-4 line-clamp-2">
                          {product.description || "No description available"}
                        </p>

                        <div className="flex gap-2 mt-5 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewProduct(product)}
                            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>

                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => setEditProduct(product)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-black"
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(product._id)}
                            className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* View Modal */}
        <Dialog open={!!viewProduct} onOpenChange={() => setViewProduct(null)}>
          <DialogContent className="max-w-4xl bg-gray-900 border-gray-800 text-white max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-yellow-400">
                {viewProduct?.name}
              </DialogTitle>
            </DialogHeader>

            {viewProduct && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3">
                    <div className="rounded-xl overflow-hidden">
                      <img
                        src={viewProduct.image}
                        alt={viewProduct.name}
                        className="w-full h-64 object-cover"
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-3 mb-4">
                      <div>
                        <Badge className="mb-2 bg-yellow-900/30 text-yellow-400 border border-yellow-800">
                          {getDisplayCategory(viewProduct.category, viewProduct.subcategory)}
                        </Badge>
                        <p className="text-sm text-gray-400">
                          SKU: {viewProduct.sku || "N/A"}
                        </p>
                        {viewProduct.hasVariants && (
                          <Badge className="mt-2 bg-blue-900/30 text-blue-400 border border-blue-800">
                            Product with Variants
                          </Badge>
                        )}
                      </div>
                      <Badge
                        className={`${getAvailabilityColor(overallAvailability(viewProduct))} font-medium`}
                      >
                        {overallAvailability(viewProduct)}
                      </Badge>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2">
                      {viewProduct.name}
                    </h3>
                    <p className="text-3xl font-bold text-yellow-400 mb-4">
                      ₹{Number(viewProduct.price || 0).toLocaleString()}
                    </p>

                    <p className="text-gray-300 mb-4">
                      {viewProduct.description || "No description available"}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Total Stock</p>
                        <p className="font-semibold text-white">{totalStock(viewProduct)}</p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Low Stock Threshold</p>
                        <p className="font-semibold text-white">
                          {viewProduct.hasVariants ? 'Per variant' : (viewProduct.lowStockThreshold ?? 5)}
                        </p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Colors</p>
                        <p className="font-semibold text-white">{colorNames(viewProduct.color)}</p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Sizes</p>
                        <p className="font-semibold text-white">{viewProduct.size?.join(", ") || "N/A"}</p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Fabrics</p>
                        <p className="font-semibold text-white">{fabricNames(viewProduct.fabricTypes)}</p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Extra Pillows</p>
                        <p className="font-semibold text-white">{viewProduct.extraPillows ?? 0}</p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Material</p>
                        <p className="font-semibold text-white">{viewProduct.material || "N/A"}</p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Weight</p>
                        <p className="font-semibold text-white">{viewProduct.weight || "N/A"}</p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Location</p>
                        <p className="font-semibold text-white">{viewProduct.location || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Variants table if any */}
                {viewProduct.variants && viewProduct.variants.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-yellow-400 mb-3">Variants</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                          <tr>
                            <th className="px-4 py-2">Size</th>
                            <th className="px-4 py-2">Color</th>
                            <th className="px-4 py-2">Fabric</th>
                            <th className="px-4 py-2">SKU</th>
                            <th className="px-4 py-2">Price</th>
                            <th className="px-4 py-2">Quantity</th>
                            <th className="px-4 py-2">Low Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewProduct.variants.map((variant, idx) => (
                            <tr key={idx} className="border-b border-gray-800">
                              <td className="px-4 py-2">{variant.attributes.size || '-'}</td>
                              <td className="px-4 py-2">
                                {variant.attributes.color ? (
                                  <div className="flex items-center gap-1">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: variant.attributes.color }} />
                                    <span>{colors.find(c => c.value === variant.attributes.color)?.name || variant.attributes.color}</span>
                                  </div>
                                ) : '-'}
                              </td>
                              <td className="px-4 py-2">{fabrics.find(f => f.value === variant.attributes.fabric)?.name || variant.attributes.fabric || '-'}</td>
                              <td className="px-4 py-2 font-mono text-xs">{variant.sku}</td>
                              <td className="px-4 py-2">₹{variant.price}</td>
                              <td className="px-4 py-2">{variant.quantity}</td>
                              <td className="px-4 py-2">{variant.lowStockThreshold}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {viewProduct.galleryImages?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-yellow-400 mb-3">
                      Gallery Images
                    </h4>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {viewProduct.galleryImages.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`${viewProduct.name} gallery ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-800">
                  <Button
                    variant="default"
                    onClick={() => {
                      setViewProduct(null);
                      setEditProduct(viewProduct);
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Product
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(viewProduct._id)}
                    className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Product
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog
          open={!!editProduct}
          onOpenChange={(open) => {
            if (!open) {
              setEditProduct(null);
              resetEditUploadState();
            }
          }}
        >
          <DialogContent className="max-w-4xl bg-gray-900 border-gray-800 text-white max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-yellow-400">Edit Product</DialogTitle>
            </DialogHeader>

            {editProduct && (
              <div className="space-y-5">
                {/* Variants toggle */}
                <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                  <Label className="text-gray-300 cursor-pointer flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editEnableVariants}
                      onChange={(e) => setEditEnableVariants(e.target.checked)}
                      className="rounded border-gray-600"
                    />
                    <span>This product has variants</span>
                  </Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column - Basic Info */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-gray-300">Product Name</Label>
                      <Input
                        value={editProduct.name}
                        onChange={(e) =>
                          setEditProduct({ ...editProduct, name: e.target.value })
                        }
                        disabled={saving}
                        className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300">Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editProduct.price}
                        onChange={(e) =>
                          setEditProduct({
                            ...editProduct,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        disabled={saving}
                        className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                      />
                    </div>

                    {/* Parent Category */}
                    <div>
                      <Label className="text-gray-300">Parent Category</Label>
                      <select
                        value={editParentId || ""}
                        onChange={(e) => {
                          const pid = e.target.value;
                          const subs = subsByParent.get(pid) || [];
                          const firstSub = subs[0];
                          setEditParentId(pid);
                          setEditSubId(firstSub?.id || "");
                        }}
                        disabled={saving || catLoading || parentCategories.length === 0}
                        className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white
                        focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                        {parentCategories.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sub Category */}
                    <div>
                      <Label className="text-gray-300">Sub Category (optional)</Label>
                      <select
                        value={editSubId || ""}
                        onChange={(e) => setEditSubId(e.target.value)}
                        disabled={saving || catLoading || !editParentId}
                        className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white
                        focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                        <option value="">None (use parent)</option>
                        {editSubs.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* SKU */}
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">SKU</Label>
                        <button
                          type="button"
                          onClick={forceGenerateEditSku}
                          disabled={saving}
                          className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                        >
                          <RefreshCcw className="w-3 h-3" />
                          Regenerate
                        </button>
                      </div>
                      <Input
                        value={editProduct.sku}
                        onChange={(e) =>
                          setEditProduct({ ...editProduct, sku: e.target.value.toUpperCase() })
                        }
                        disabled={saving}
                        className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300">Description</Label>
                      <Textarea
                        rows={3}
                        value={editProduct.description}
                        onChange={(e) =>
                          setEditProduct({ ...editProduct, description: e.target.value })
                        }
                        disabled={saving}
                        className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                      />
                    </div>
                  </div>

                  {/* Right Column - Attributes */}
                  <div className="space-y-3">
                    {/* Colors */}
                    <div>
                      <Label className="text-gray-300">Colors</Label>

                      {/* Custom color input */}
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="Enter color name or hex"
                          value={editCustomColorInput}
                          onChange={(e) => setEditCustomColorInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              setEditProduct(prev => prev ? {
                                ...prev,
                                color: addColorToArray(prev.color, editCustomColorInput)
                              } : prev);
                              setEditCustomColorInput('');
                            }
                          }}
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            setEditProduct(prev => prev ? {
                              ...prev,
                              color: addColorToArray(prev.color, editCustomColorInput)
                            } : prev);
                            setEditCustomColorInput('');
                          }}
                          className="bg-yellow-500 hover:bg-yellow-600 text-black"
                          size="sm"
                        >
                          Add
                        </Button>
                      </div>

                      {/* Selected colors as tags */}
                      {editProduct.color && editProduct.color.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {editProduct.color.map((color, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-700 text-white"
                            >
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              {color}
                              <button
                                type="button"
                                onClick={() => setEditProduct(prev => prev ? {
                                  ...prev,
                                  color: prev.color.filter((_, i) => i !== idx)
                                } : prev)}
                                className="ml-1 text-gray-400 hover:text-white"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Predefined color checkboxes */}
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {colors.map((colorOption) => {
                          const isSelected = editProduct.color?.includes(colorOption.value) || false;
                          return (
                            <label
                              key={colorOption.value}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors",
                                isSelected
                                  ? "border-yellow-500 bg-yellow-500/10"
                                  : "border-gray-700 bg-gray-800 hover:bg-gray-700"
                              )}
                            >
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditProduct((prev) =>
                                      prev ? {
                                        ...prev,
                                        color: addColorToArray(prev.color, colorOption.value),
                                      } : prev
                                    );
                                  } else {
                                    setEditProduct((prev) =>
                                      prev ? {
                                        ...prev,
                                        color: (prev.color || []).filter((c) => c !== colorOption.value),
                                      } : prev
                                    );
                                  }
                                }}
                              />
                              <div
                                className="w-4 h-4 rounded-full border border-gray-600"
                                style={{ backgroundColor: colorOption.value }}
                              />
                              <span className="text-sm text-white">{colorOption.name}</span>
                              {isSelected && <Check className="w-4 h-4 ml-auto text-yellow-400" />}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sizes */}
                    <div>
                      <Label className="text-gray-300">Sizes (comma separated)</Label>
                      <Input
                        value={editProduct.size?.join(", ") || ""}
                        onChange={(e) =>
                          setEditProduct({
                            ...editProduct,
                            size: e.target.value.split(",").map(s => s.trim()).filter(Boolean),
                          })
                        }
                        placeholder="e.g. S, M, L, XL"
                        disabled={saving}
                        className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                      />
                    </div>

                    {/* Fabric Types */}
                    <div>
                      <Label className="text-gray-300">Fabric Types</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {fabrics.map((fabric) => {
                          const isSelected = editProduct.fabricTypes?.includes(fabric.value) || false;
                          return (
                            <label
                              key={fabric.value}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors",
                                isSelected
                                  ? "border-yellow-500 bg-yellow-500/10"
                                  : "border-gray-700 bg-gray-800 hover:bg-gray-700"
                              )}
                            >
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditProduct((prev) =>
                                      prev ? {
                                        ...prev,
                                        fabricTypes: [...(prev.fabricTypes || []), fabric.value],
                                      } : prev
                                    );
                                  } else {
                                    setEditProduct((prev) =>
                                      prev ? {
                                        ...prev,
                                        fabricTypes: (prev.fabricTypes || []).filter(f => f !== fabric.value),
                                      } : prev
                                    );
                                  }
                                }}
                              />
                              <span className="text-sm text-white">{fabric.name}</span>
                              {isSelected && <Check className="w-4 h-4 ml-auto text-yellow-400" />}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Extra Pillows */}
                    <div>
                      <Label className="text-gray-300">Extra Pillows Included</Label>
                      <Input
                        type="number"
                        min="0"
                        value={editProduct.extraPillows ?? 0}
                        onChange={(e) =>
                          setEditProduct({
                            ...editProduct,
                            extraPillows: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={saving}
                        className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300">Material</Label>
                      <Input
                        value={editProduct.material}
                        onChange={(e) =>
                          setEditProduct({ ...editProduct, material: e.target.value })
                        }
                        disabled={saving}
                        className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-gray-300">Weight</Label>
                        <Input
                          value={editProduct.weight}
                          onChange={(e) =>
                            setEditProduct({ ...editProduct, weight: e.target.value })
                          }
                          disabled={saving}
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Location</Label>
                        <Input
                          value={editProduct.location}
                          onChange={(e) =>
                            setEditProduct({ ...editProduct, location: e.target.value })
                          }
                          disabled={saving}
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-300">Delivery Time</Label>
                      <Input
                        value={editProduct.deliveryTime}
                        onChange={(e) =>
                          setEditProduct({ ...editProduct, deliveryTime: e.target.value })
                        }
                        disabled={saving}
                        className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                      />
                    </div>

                    {/* Main Image */}
                    <div className="mt-2">
                      <Label className="text-gray-300">Main Image</Label>
                      <div className="mt-2 rounded-lg overflow-hidden border border-gray-700 bg-gray-800">
                        <img
                          src={editMainPreview || editProduct.image}
                          alt="Edit main preview"
                          className="w-full h-40 object-cover"
                        />
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        disabled={saving}
                        onChange={(e) => onPickEditMain(e.target.files?.[0] || null)}
                        className="mt-3 bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Variants editing (if enabled) */}
                {editEnableVariants && (
                  <div className="border-t border-gray-800 pt-4">
                    <h3 className="text-yellow-400 font-semibold mb-3">Edit Variants</h3>
                    <p className="text-xs text-gray-400 mb-2">
                      Modify existing variants or add new ones by changing attribute selections below. New combinations will be added automatically.
                    </p>
                    {editVariants.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                            <tr>
                              <th className="px-4 py-2">Size</th>
                              <th className="px-4 py-2">Color</th>
                              <th className="px-4 py-2">Fabric</th>
                              <th className="px-4 py-2">SKU</th>
                              <th className="px-4 py-2">Price</th>
                              <th className="px-4 py-2">Quantity</th>
                              <th className="px-4 py-2">Low Stock</th>
                            </tr>
                          </thead>
                          <tbody>
                            {editVariants.map((variant, idx) => (
                              <tr key={idx} className="border-b border-gray-800">
                                <td className="px-4 py-2">{variant.attributes.size || '-'}</td>
                                <td className="px-4 py-2">
                                  {variant.attributes.color ? (
                                    <div className="flex items-center gap-1">
                                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: variant.attributes.color }} />
                                      <span>{colors.find(c => c.value === variant.attributes.color)?.name || variant.attributes.color}</span>
                                    </div>
                                  ) : '-'}
                                </td>
                                <td className="px-4 py-2">{fabrics.find(f => f.value === variant.attributes.fabric)?.name || variant.attributes.fabric || '-'}</td>
                                <td className="px-4 py-2">
                                  <Input
                                    value={variant.sku}
                                    onChange={(e) => {
                                      const newVariants = [...editVariants];
                                      newVariants[idx].sku = e.target.value.toUpperCase();
                                      setEditVariants(newVariants);
                                    }}
                                    className="bg-gray-800 border-gray-700 text-white h-8 text-xs"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={variant.price}
                                    onChange={(e) => {
                                      const newVariants = [...editVariants];
                                      newVariants[idx].price = parseFloat(e.target.value) || 0;
                                      setEditVariants(newVariants);
                                    }}
                                    className="bg-gray-800 border-gray-700 text-white h-8 text-xs w-24"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={variant.quantity}
                                    onChange={(e) => {
                                      const newVariants = [...editVariants];
                                      newVariants[idx].quantity = parseInt(e.target.value) || 0;
                                      setEditVariants(newVariants);
                                    }}
                                    className="bg-gray-800 border-gray-700 text-white h-8 text-xs w-20"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={variant.lowStockThreshold}
                                    onChange={(e) => {
                                      const newVariants = [...editVariants];
                                      newVariants[idx].lowStockThreshold = parseInt(e.target.value) || 5;
                                      setEditVariants(newVariants);
                                    }}
                                    className="bg-gray-800 border-gray-700 text-white h-8 text-xs w-20"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-400">No variants yet. Toggle variants on and save to generate from current attributes.</p>
                    )}
                  </div>
                )}

                {/* Simple product inventory fields (if variants not enabled) */}
                {!editEnableVariants && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="text-gray-300">Quantity</Label>
                      <Input
                        type="number"
                        min="0"
                        value={editProduct.quantity ?? 0}
                        onChange={(e) =>
                          setEditProduct({
                            ...editProduct,
                            quantity: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={saving}
                        className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Low Stock Threshold</Label>
                      <Input
                        type="number"
                        min="0"
                        value={editProduct.lowStockThreshold ?? 5}
                        onChange={(e) =>
                          setEditProduct({
                            ...editProduct,
                            lowStockThreshold: parseInt(e.target.value) || 5,
                          })
                        }
                        disabled={saving}
                        className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                      />
                    </div>
                  </div>
                )}

                {/* Existing gallery */}
                <div className="border-t border-gray-800 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-yellow-400">Gallery Images</h4>
                    <p className="text-xs text-gray-400">
                      Current: {editProduct.galleryImages?.length || 0} | Total max: {MAX_TOTAL_IMAGES}
                    </p>
                  </div>

                  {editProduct.galleryImages?.length ? (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                      {editProduct.galleryImages.map((src, idx) => (
                        <div key={idx} className="relative w-20 h-20 flex-shrink-0">
                          <img
                            src={src}
                            alt={`Existing ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingGalleryAt(idx)}
                            className="absolute -top-2 -right-2 bg-black/70 rounded-full p-1 border border-gray-700 hover:bg-black"
                            disabled={saving}
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-gray-400 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      No existing gallery images
                    </div>
                  )}

                  {/* Add new gallery images */}
                  <div className="mt-4">
                    <Label className="text-gray-300">Add More Images</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={saving}
                      onChange={(e) => onPickEditNewGallery(e.target.files)}
                      className="mt-2 bg-gray-800 border-gray-700 text-white"
                    />

                    {editNewGalleryPreviews.length > 0 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                        {editNewGalleryPreviews.map((src, idx) => (
                          <div key={idx} className="relative w-20 h-20 flex-shrink-0">
                            <img
                              src={src}
                              alt={`New ${idx + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border border-yellow-700"
                            />
                            <button
                              type="button"
                              onClick={() => removeEditNewGalleryAt(idx)}
                              className="absolute -top-2 -right-2 bg-black/70 rounded-full p-1 border border-gray-700 hover:bg-black"
                              disabled={saving}
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleSaveEdit}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
}