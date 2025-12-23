import { useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Product {
  id: number;
  name: string;
  category: string;
  sku: string;
  description: string;
  image: string;
}

const initialProducts: Product[] = [
  { id: 1, name: "Premium Wooden Chair", category: "Furniture", sku: "WC-001", description: "Hand-crafted wooden chair with premium finish", image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=200" },
  { id: 2, name: "Luxury Sofa Set", category: "Furniture", sku: "SF-002", description: "Modern luxury sofa set with comfortable cushions", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200" },
  { id: 3, name: "Oak Dining Table", category: "Furniture", sku: "DT-003", description: "Solid oak dining table for 6 people", image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=200" },
];

const Catalogue = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", category: "", sku: "", description: "" });

  const handleAdd = () => {
    if (!newProduct.name || !newProduct.category) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    const product: Product = {
      id: Date.now(),
      ...newProduct,
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200",
    };
    setProducts([...products, product]);
    setNewProduct({ name: "", category: "", sku: "", description: "" });
    setAddOpen(false);
    toast({ title: "Success", description: "Product added successfully" });
  };

  const handleDelete = (id: number) => {
    setProducts(products.filter((p) => p.id !== id));
    toast({ title: "Deleted", description: "Product removed successfully" });
  };

  const handleSaveEdit = () => {
    if (!editProduct) return;
    setProducts(products.map((p) => (p.id === editProduct.id ? editProduct : p)));
    setEditProduct(null);
    toast({ title: "Updated", description: "Product updated successfully" });
  };

  return (
    <>
      <Helmet>
        <title>Catalogue Management | Manufacturer Portal</title>
        <meta name="description" content="Manage your product catalogue - add, edit, and remove products" />
      </Helmet>

      <DashboardLayout title="Catalogue Management">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="mb-6">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="animate-pop-in">
            <DialogHeader>
              <DialogTitle>Add Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Product Name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
              <Input placeholder="Category" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} />
              <Input placeholder="SKU" value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} />
              <Textarea placeholder="Description" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
              <Button onClick={handleAdd} className="w-full">Save Product</Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {products.map((product) => (
            <div key={product.id} className="bg-card p-5 rounded-2xl shadow-card flex justify-between items-center hover:shadow-card-hover transition-all hover:-translate-y-1">
              <div className="w-3/5">
                <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                <p className="text-sm text-muted-foreground mb-1">{product.category}</p>
                <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="secondary" onClick={() => setViewProduct(product)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={() => setEditProduct(product)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <img src={product.image} alt={product.name} className="w-28 h-28 object-cover rounded-xl" />
            </div>
          ))}
        </div>

        {/* View Modal */}
        <Dialog open={!!viewProduct} onOpenChange={() => setViewProduct(null)}>
          <DialogContent className="max-w-2xl animate-fade-zoom">
            <DialogHeader>
              <DialogTitle>{viewProduct?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><strong className="block text-sm font-semibold mb-1">Category:</strong> {viewProduct?.category}</div>
              <div><strong className="block text-sm font-semibold mb-1">SKU:</strong> {viewProduct?.sku}</div>
              <div><strong className="block text-sm font-semibold mb-1">Description:</strong> {viewProduct?.description}</div>
              <img src={viewProduct?.image} alt={viewProduct?.name} className="w-32 h-32 object-cover rounded-xl" />
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
          <DialogContent className="animate-pop-in">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Product Name" value={editProduct?.name || ""} onChange={(e) => setEditProduct(editProduct ? { ...editProduct, name: e.target.value } : null)} />
              <Input placeholder="Category" value={editProduct?.category || ""} onChange={(e) => setEditProduct(editProduct ? { ...editProduct, category: e.target.value } : null)} />
              <Input placeholder="SKU" value={editProduct?.sku || ""} onChange={(e) => setEditProduct(editProduct ? { ...editProduct, sku: e.target.value } : null)} />
              <Textarea placeholder="Description" value={editProduct?.description || ""} onChange={(e) => setEditProduct(editProduct ? { ...editProduct, description: e.target.value } : null)} />
              <Button onClick={handleSaveEdit} className="w-full">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
};

export default Catalogue;
