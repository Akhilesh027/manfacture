import { useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Factory {
  id: number;
  name: string;
  location: string;
  capacity: string;
  manager: string;
}

const initialFactories: Factory[] = [
  { id: 1, name: "Main Manufacturing Unit", location: "Mumbai, Maharashtra", capacity: "5000 units/month", manager: "Rajesh Kumar" },
  { id: 2, name: "Secondary Plant", location: "Pune, Maharashtra", capacity: "3000 units/month", manager: "Anita Sharma" },
  { id: 3, name: "Export Unit", location: "Chennai, Tamil Nadu", capacity: "4000 units/month", manager: "Vijay Rajan" },
];

const Factories = () => {
  const [factories, setFactories] = useState<Factory[]>(initialFactories);
  const [addOpen, setAddOpen] = useState(false);
  const [editFactory, setEditFactory] = useState<Factory | null>(null);
  const [newFactory, setNewFactory] = useState({ name: "", location: "", capacity: "", manager: "" });

  const handleAdd = () => {
    if (!newFactory.name || !newFactory.location) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    const factory: Factory = { id: Date.now(), ...newFactory };
    setFactories([...factories, factory]);
    setNewFactory({ name: "", location: "", capacity: "", manager: "" });
    setAddOpen(false);
    toast({ title: "Success", description: "Factory added successfully" });
  };

  const handleDelete = (id: number) => {
    setFactories(factories.filter((f) => f.id !== id));
    toast({ title: "Deleted", description: "Factory removed successfully" });
  };

  const handleSaveEdit = () => {
    if (!editFactory) return;
    setFactories(factories.map((f) => (f.id === editFactory.id ? editFactory : f)));
    setEditFactory(null);
    toast({ title: "Updated", description: "Factory updated successfully" });
  };

  return (
    <>
      <Helmet>
        <title>Factories & Locations | Manufacturer Portal</title>
        <meta name="description" content="Manage your manufacturing facilities and locations" />
      </Helmet>

      <DashboardLayout title="Factories & Locations">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="mb-6">
              <Plus className="w-4 h-4 mr-2" />
              Add Factory
            </Button>
          </DialogTrigger>
          <DialogContent className="animate-pop-in">
            <DialogHeader>
              <DialogTitle>Add Factory</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Factory Name" value={newFactory.name} onChange={(e) => setNewFactory({ ...newFactory, name: e.target.value })} />
              <Input placeholder="Location" value={newFactory.location} onChange={(e) => setNewFactory({ ...newFactory, location: e.target.value })} />
              <Input placeholder="Production Capacity" value={newFactory.capacity} onChange={(e) => setNewFactory({ ...newFactory, capacity: e.target.value })} />
              <Input placeholder="Manager Name" value={newFactory.manager} onChange={(e) => setNewFactory({ ...newFactory, manager: e.target.value })} />
              <Button onClick={handleAdd} className="w-full">Add Factory</Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {factories.map((factory) => (
            <div key={factory.id} className="bg-card p-6 rounded-2xl shadow-card border border-border hover:shadow-card-hover transition-all hover:-translate-y-1">
              <h3 className="font-semibold text-lg mb-2">{factory.name}</h3>
              <p className="text-sm text-muted-foreground mb-1">📍 {factory.location}</p>
              <p className="text-sm text-muted-foreground mb-1">🏭 {factory.capacity}</p>
              <p className="text-sm text-muted-foreground">👤 {factory.manager}</p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={() => setEditFactory(factory)}>
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(factory.id)}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Modal */}
        <Dialog open={!!editFactory} onOpenChange={() => setEditFactory(null)}>
          <DialogContent className="animate-pop-in">
            <DialogHeader>
              <DialogTitle>Edit Factory</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Factory Name" value={editFactory?.name || ""} onChange={(e) => setEditFactory(editFactory ? { ...editFactory, name: e.target.value } : null)} />
              <Input placeholder="Location" value={editFactory?.location || ""} onChange={(e) => setEditFactory(editFactory ? { ...editFactory, location: e.target.value } : null)} />
              <Input placeholder="Production Capacity" value={editFactory?.capacity || ""} onChange={(e) => setEditFactory(editFactory ? { ...editFactory, capacity: e.target.value } : null)} />
              <Input placeholder="Manager Name" value={editFactory?.manager || ""} onChange={(e) => setEditFactory(editFactory ? { ...editFactory, manager: e.target.value } : null)} />
              <Button onClick={handleSaveEdit} className="w-full">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
};

export default Factories;
