// src/pages/Catalogue.tsx
import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Product {
  _id: string;
  name: string;
  category: string; // parent slug
  subcategory?: string; // child slug optional
  sku: string;
  description: string;
  shortDescription?: string;
  price: number;

  // ✅ inventory
  quantity: number;
  lowStockThreshold?: number;
  availability: "In Stock" | "Out of Stock" | "Low Stock";

  color: string; // hex
  material: string;
  size: string;
  weight: string;
  location: string;
  deliveryTime?: string;

  image: string;
  galleryImages: string[];

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

const colorName = (hex?: string) =>
  colors.find((c) => c.value.toLowerCase() === (hex || "").toLowerCase())
    ?.name ||
  hex ||
  "N/A";

// ✅ inventory-safe availability
const computeAvailability = (qty: number, low = 5) => {
  const q = Number.isFinite(qty) ? qty : 0;
  const l = Number.isFinite(low) ? low : 5;
  if (q <= 0) return "Out of Stock";
  if (q <= l) return "Low Stock";
  return "In Stock";
};

// ---------------- API Helpers ----------------
const apiRequest = async (method: string, endpoint: string, data?: any) => {
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

  return payload;
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

// ---------------- SKU Helpers ----------------
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

function safeItemsFromCategoryResponse(res: any): CategoryNode[] {
  const items =
    res?.items ||
    res?.categories ||
    res?.data?.items ||
    res?.data?.categories ||
    [];
  return Array.isArray(items) ? items : [];
}

export default function Catalogue() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
    // If backend sends categoryId as parent id, great.
    // Else infer from slug.
    if (p.categoryId) return p.categoryId;
    const node = categoryBySlug.get((p.category || "").trim());
    if (!node) return null;
    return node.parentId ? node.parentId : node.id;
  };

  const getSubIdForProduct = (p: Product) => {
    // If backend sends subCategoryId, use it
    if (p.subCategoryId) return p.subCategoryId;
    const node = categoryBySlug.get((p.subcategory || "").trim());
    return node?.id || null;
  };

  // Products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("GET", "/api/products");
      const list = (data.products || []) as Product[];

      // ✅ enforce safe availability display from quantity
      const normalized = list.map((p) => {
        const low = p.lowStockThreshold ?? 5;
        return {
          ...p,
          lowStockThreshold: low,
          availability: computeAvailability(p.quantity ?? 0, low),
        };
      });

      setProducts(normalized);
      setFilteredProducts(normalized);
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

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  /** ---------------------------
   * Add form state
   * -------------------------- */
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

    color: "",
    material: "",
    size: "",
    weight: "",
    location: "",
    deliveryTime: "",

    image: "https://via.placeholder.com/600x400?text=Main+Image",
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
  const [editNewGalleryPreviews, setEditNewGalleryPreviews] = useState<string[]>(
    [],
  );

  const [editParentId, setEditParentId] = useState<string>("");
  const [editSubId, setEditSubId] = useState<string>("");

  // Quick inventory state (per product)
  const [invSavingId, setInvSavingId] = useState<string | null>(null);
  const [invDraft, setInvDraft] = useState<Record<string, { qty: string; low: string }>>({});

  /** ---------------------------
   * Filter products (search + parent/sub filters)
   * -------------------------- */
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
          (p.description || "").toLowerCase().includes(s),
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

  const cleanupObjectUrl = (url: string) => {
    try {
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    } catch {}
  };

  const resetAddUploadState = () => {
    if (newMainPreview) cleanupObjectUrl(newMainPreview);
    newGalleryPreviews.forEach(cleanupObjectUrl);
    setNewMainFile(null);
    setNewMainPreview("");
    setNewGalleryFiles([]);
    setNewGalleryPreviews([]);
  };

  const resetEditUploadState = () => {
    if (editMainPreview) cleanupObjectUrl(editMainPreview);
    editNewGalleryPreviews.forEach(cleanupObjectUrl);
    setEditMainFile(null);
    setEditMainPreview("");
    setEditNewGalleryFiles([]);
    setEditNewGalleryPreviews([]);
  };

  // Add: default category selection when modal opens
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

  // Edit: when opening edit, set parent/sub selections from product
  useEffect(() => {
    if (!editProduct) return;

    const pid = getParentIdForProduct(editProduct) || "";
    const sid = getSubIdForProduct(editProduct) || "";
    setEditParentId(pid);
    setEditSubId(sid);

    resetEditUploadState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editProduct?._id]);

  /** ---------------------------
   * Add: select main image
   * -------------------------- */
  const onPickNewMain = (file: File | null) => {
    if (!file) {
      if (newMainPreview) cleanupObjectUrl(newMainPreview);
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

    if (newMainPreview) cleanupObjectUrl(newMainPreview);
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

    newGalleryPreviews.forEach(cleanupObjectUrl);
    setNewGalleryFiles(allowed);
    setNewGalleryPreviews(allowed.map((f) => URL.createObjectURL(f)));
  };

  const removeNewGalleryAt = (index: number) => {
    cleanupObjectUrl(newGalleryPreviews[index]);
    setNewGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setNewGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  /** ---------------------------
   * Edit: pick main image
   * -------------------------- */
  const onPickEditMain = (file: File | null) => {
    if (!file) {
      if (editMainPreview) cleanupObjectUrl(editMainPreview);
      setEditMainFile(null);
      setEditMainPreview("");
      return;
    }
    if (editMainPreview) cleanupObjectUrl(editMainPreview);
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

    editNewGalleryPreviews.forEach(cleanupObjectUrl);
    setEditNewGalleryFiles(allowed);
    setEditNewGalleryPreviews(allowed.map((f) => URL.createObjectURL(f)));
  };

  const removeEditNewGalleryAt = (index: number) => {
    cleanupObjectUrl(editNewGalleryPreviews[index]);
    setEditNewGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setEditNewGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingGalleryAt = (index: number) => {
    if (!editProduct) return;
    const next = (editProduct.galleryImages || []).filter((_, i) => i !== index);
    setEditProduct({ ...editProduct, galleryImages: next });
  };

  /** ---------------------------
   * SKU Auto generate (Add)
   * -------------------------- */
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
  }, [addOpen, newProduct.name, newProduct.parentCategoryId]);

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

  /** ---------------------------
   * CRUD: Add
   * -------------------------- */
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

      const qty = newProduct.quantity ? parseInt(newProduct.quantity, 10) : 0;
      const low = newProduct.lowStockThreshold
        ? parseInt(newProduct.lowStockThreshold, 10)
        : 5;

      const productData = {
        name: newProduct.name,

        // ✅ send IDs + slugs (backend accepts both)
        categoryId: parent?.id,
        subCategoryId: sub?.id || null,
        category: parent?.slug,
        subcategory: sub?.slug || "",

        sku: newProduct.sku,
        shortDescription: newProduct.shortDescription,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        quantity: qty,
        lowStockThreshold: low,

        // availability ignored by backend (safe)
        availability: computeAvailability(qty, low),

        color: newProduct.color,
        material: newProduct.material,
        size: newProduct.size,
        weight: newProduct.weight,
        location: newProduct.location,
        deliveryTime: newProduct.deliveryTime,

        image: mainImageUrl,
        galleryImages: galleryUrls,
      };

      const data = await apiRequest("POST", "/api/products", productData);

      const created = data.product as Product;
      const createdNormalized: Product = {
        ...created,
        lowStockThreshold: created.lowStockThreshold ?? low,
        availability: computeAvailability(created.quantity ?? 0, created.lowStockThreshold ?? low),
      };

      const next = [createdNormalized, ...products];
      setProducts(next);
      setFilteredProducts(next);

      setAddOpen(false);

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
        color: "",
        material: "",
        size: "",
        weight: "",
        location: "",
        deliveryTime: "",
        image: "https://via.placeholder.com/600x400?text=Main+Image",
      });

      resetAddUploadState();
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

  /** ---------------------------
   * Delete
   * -------------------------- */
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await apiRequest("DELETE", `/api/products/${id}`);
      const next = products.filter((p) => p._id !== id);
      setProducts(next);
      setFilteredProducts((prev) => prev.filter((p) => p._id !== id));
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

  /** ---------------------------
   * Save Edit
   * -------------------------- */
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

      const qty = Number(editProduct.quantity ?? 0);
      const low = Number(editProduct.lowStockThreshold ?? 5);
      const availability = computeAvailability(qty, low);

      const updateData: Partial<Product> & any = {
        name: editProduct.name,

        // ✅ backend accepts ids and slugs
        categoryId: parentNode?.id,
        subCategoryId: subNode?.id || null,
        category: parentNode?.slug,
        subcategory: subNode?.slug || "",

        sku: editProduct.sku,
        shortDescription: editProduct.shortDescription,
        description: editProduct.description,
        price: editProduct.price,

        quantity: qty,
        lowStockThreshold: low,
        availability, // backend ignores manual availability but safe

        color: editProduct.color,
        material: editProduct.material,
        size: editProduct.size,
        weight: editProduct.weight,
        location: editProduct.location,
        deliveryTime: editProduct.deliveryTime,

        image: mainImageUrl,
        galleryImages: finalGallery,
      };

      const data = await apiRequest("PUT", `/api/products/${editProduct._id}`, updateData);
      const updated = data.product as Product;

      const normalizedUpdated: Product = {
        ...updated,
        lowStockThreshold: updated.lowStockThreshold ?? low,
        availability: computeAvailability(updated.quantity ?? 0, updated.lowStockThreshold ?? low),
      };

      const updatedProducts = products.map((p) =>
        p._id === editProduct._id ? normalizedUpdated : p,
      );

      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);

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

  /** ---------------------------
   * ✅ QUICK INVENTORY UPDATE
   * PATCH /api/products/:id/inventory
   * -------------------------- */
  const initInvDraftIfMissing = (p: Product) => {
    setInvDraft((prev) => {
      if (prev[p._id]) return prev;
      return {
        ...prev,
        [p._id]: {
          qty: String(p.quantity ?? 0),
          low: String(p.lowStockThreshold ?? 5),
        },
      };
    });
  };

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
      const data = await apiRequest("PATCH", `/api/products/${productId}/inventory`, {
        quantity: qty,
        lowStockThreshold: low,
      });

      const updated = data.product as Product;

      const normalizedUpdated: Product = {
        ...updated,
        lowStockThreshold: updated.lowStockThreshold ?? low,
        availability: computeAvailability(updated.quantity ?? 0, updated.lowStockThreshold ?? low),
      };

      const next = products.map((p) => (p._id === productId ? normalizedUpdated : p));
      setProducts(next);

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

  /** ---------------------------
   * UI Loading
   * -------------------------- */
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

            {/* ---------- Add Modal ---------- */}
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

              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-gray-900 border border-gray-800 text-white">
                <DialogHeader>
                  <DialogTitle className="text-yellow-400">
                    Add New Product
                  </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-gray-300">Product Name *</Label>
                      <Input
                        placeholder="Product Name"
                        value={newProduct.name}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, name: e.target.value })
                        }
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
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, price: e.target.value })
                        }
                        disabled={saving}
                        className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                      />
                    </div>

                    {/* ✅ Inventory */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-gray-300">Quantity</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={newProduct.quantity}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, quantity: e.target.value })
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
                          placeholder="5"
                          value={newProduct.lowStockThreshold}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, lowStockThreshold: e.target.value })
                          }
                          disabled={saving}
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                        />
                      </div>
                    </div>

                    {/* ✅ Availability preview (readonly) */}
                    <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/40 p-3">
                      <div className="text-sm text-gray-300">
                        Availability (auto)
                        <div className="text-[11px] text-gray-500">
                          Computed from quantity & low stock threshold
                        </div>
                      </div>
                      <Badge
                        className={getAvailabilityColor(
                          computeAvailability(
                            parseInt(newProduct.quantity || "0", 10),
                            parseInt(newProduct.lowStockThreshold || "5", 10),
                          ),
                        )}
                      >
                        {computeAvailability(
                          parseInt(newProduct.quantity || "0", 10),
                          parseInt(newProduct.lowStockThreshold || "5", 10),
                        )}
                      </Badge>
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
                      <p className="text-[11px] text-gray-500 mt-1">
                        SKU is auto-generated, you can edit it if needed.
                      </p>
                    </div>

                    <div>
                      <Label className="text-gray-300">Short Description</Label>
                      <Input
                        value={newProduct.shortDescription}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, shortDescription: e.target.value })
                        }
                        disabled={saving}
                        className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                      />
                    </div>

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

                  {/* Right */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-gray-300">Color</Label>
                      <div className="flex items-center gap-3">
                        <select
                          value={newProduct.color}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, color: e.target.value })
                          }
                          disabled={saving}
                          className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white
                          focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                          <option value="">Select Color</option>
                          {colors.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.name}
                            </option>
                          ))}
                        </select>

                        <div
                          className="h-10 w-10 rounded-md border border-gray-700"
                          style={{ backgroundColor: newProduct.color || "transparent" }}
                          title={newProduct.color || "No color"}
                        />
                      </div>
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
                        <Label className="text-gray-300">Size</Label>
                        <Input
                          value={newProduct.size}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, size: e.target.value })
                          }
                          disabled={saving}
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                        />
                      </div>
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

                      <p className="text-xs text-gray-400 mt-2">
                        Total images allowed: {MAX_TOTAL_IMAGES} (main + gallery).
                      </p>
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
              </DialogContent>
            </Dialog>
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search products by name, category, SKU..."
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

        {/* Empty */}
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
              // Ensure draft exists
              if (!invDraft[product._id]) initInvDraftIfMissing(product);

              const draft = invDraft[product._id] || {
                qty: String(product.quantity ?? 0),
                low: String(product.lowStockThreshold ?? 5),
              };

              const computedAvail = computeAvailability(
                product.quantity ?? 0,
                product.lowStockThreshold ?? 5,
              );

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
                            </div>
                          </div>
                          <Badge className={`${getAvailabilityColor(computedAvail)} font-medium`}>
                            {computedAvail}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                          <div className="bg-gray-800/50 p-3 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">Price</p>
                            <p className="font-semibold text-yellow-400">
                              ₹{Number(product.price || 0).toLocaleString()}
                            </p>
                          </div>

                          <div className="bg-gray-800/50 p-3 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">Quantity</p>
                            <p className="font-semibold text-white">
                              {product.quantity ?? 0}
                            </p>
                          </div>

                          <div className="bg-gray-800/50 p-3 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">Low Stock</p>
                            <p className="font-semibold text-white">
                              {product.lowStockThreshold ?? 5}
                            </p>
                          </div>
                        </div>

                        {/* ✅ Quick Inventory Update */}
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
                                value={draft.qty}
                                onChange={(e) =>
                                  setInvDraft((prev) => ({
                                    ...prev,
                                    [product._id]: {
                                      ...prev[product._id],
                                      qty: e.target.value,
                                      low: prev[product._id]?.low ?? String(product.lowStockThreshold ?? 5),
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
                                value={draft.low}
                                onChange={(e) =>
                                  setInvDraft((prev) => ({
                                    ...prev,
                                    [product._id]: {
                                      ...prev[product._id],
                                      low: e.target.value,
                                      qty: prev[product._id]?.qty ?? String(product.quantity ?? 0),
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
                                parseInt(draft.qty || "0", 10),
                                parseInt(draft.low || "5", 10),
                              )}
                            </span>
                          </div>
                        </div>

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
          <DialogContent className="max-w-3xl bg-gray-900 border-gray-800 text-white max-h-[80vh] overflow-y-auto">
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
                      </div>
                      <Badge
                        className={`${getAvailabilityColor(
                          computeAvailability(
                            viewProduct.quantity ?? 0,
                            viewProduct.lowStockThreshold ?? 5,
                          ),
                        )} font-medium`}
                      >
                        {computeAvailability(
                          viewProduct.quantity ?? 0,
                          viewProduct.lowStockThreshold ?? 5,
                        )}
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
                        <p className="text-sm text-gray-400 mb-1">Quantity</p>
                        <p className="font-semibold text-white">
                          {viewProduct.quantity ?? 0}
                        </p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Low Stock</p>
                        <p className="font-semibold text-white">
                          {viewProduct.lowStockThreshold ?? 5}
                        </p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Color</p>
                        <p className="font-semibold text-white">
                          {colorName(viewProduct.color)}
                        </p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Material</p>
                        <p className="font-semibold text-white">
                          {viewProduct.material || "N/A"}
                        </p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Size</p>
                        <p className="font-semibold text-white">
                          {viewProduct.size || "N/A"}
                        </p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Weight</p>
                        <p className="font-semibold text-white">
                          {viewProduct.weight || "N/A"}
                        </p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Location</p>
                        <p className="font-semibold text-white">
                          {viewProduct.location || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

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

        {/* Edit Modal (keep as your existing, but with lowStockThreshold + no availability dropdown) */}
        <Dialog
          open={!!editProduct}
          onOpenChange={(open) => {
            if (!open) {
              setEditProduct(null);
              resetEditUploadState();
            }
          }}
        >
          <DialogContent className="max-w-3xl bg-gray-900 border-gray-800 text-white max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-yellow-400">Edit Product</DialogTitle>
            </DialogHeader>

            {editProduct && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left */}
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

                    {/* ✅ Inventory */}
                    <div className="grid grid-cols-2 gap-3">
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

                    <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/40 p-3">
                      <div className="text-sm text-gray-300">
                        Availability (auto)
                        <div className="text-[11px] text-gray-500">
                          Computed from quantity & threshold
                        </div>
                      </div>
                      <Badge
                        className={getAvailabilityColor(
                          computeAvailability(
                            editProduct.quantity ?? 0,
                            editProduct.lowStockThreshold ?? 5,
                          ),
                        )}
                      >
                        {computeAvailability(
                          editProduct.quantity ?? 0,
                          editProduct.lowStockThreshold ?? 5,
                        )}
                      </Badge>
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

                  {/* Right */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-gray-300">Color</Label>
                      <div className="flex items-center gap-3">
                        <select
                          value={editProduct.color || ""}
                          onChange={(e) =>
                            setEditProduct({ ...editProduct, color: e.target.value })
                          }
                          disabled={saving}
                          className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white
                          focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                          <option value="">Select Color</option>
                          {colors.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.name}
                            </option>
                          ))}
                        </select>

                        <div
                          className="h-10 w-10 rounded-md border border-gray-700"
                          style={{ backgroundColor: editProduct.color || "transparent" }}
                          title={editProduct.color || "No color"}
                        />
                      </div>
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
                        <Label className="text-gray-300">Size</Label>
                        <Input
                          value={editProduct.size}
                          onChange={(e) =>
                            setEditProduct({ ...editProduct, size: e.target.value })
                          }
                          disabled={saving}
                          className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500"
                        />
                      </div>
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