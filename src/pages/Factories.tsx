import { useState, useEffect } from "react";
import axios from "axios";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Factory as FactoryIcon, MapPin, Users, Gauge } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface Factory {
  _id: string;
  name: string;
  location: string;
  capacity: string;
  manager: string;
  status?: "Active" | "Inactive" | "Maintenance";
  contact?: string;
  established?: string;
}

const Factories = () => {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editFactory, setEditFactory] = useState<Factory | null>(null);
  const [loading, setLoading] = useState(true);
  const [newFactory, setNewFactory] = useState({ 
    name: "", 
    location: "", 
    capacity: "", 
    manager: "",
    contact: "",
    established: "",
    status: "Active" as "Active" | "Inactive" | "Maintenance"
  });

  const token = localStorage.getItem("token");

  // Fetch factories
  const fetchFactories = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://api.jsgallor.com/api/factories", { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.data.success) setFactories(res.data.factories || []);
    } catch (err) {
      console.error(err);
      toast({ 
        title: "Error", 
        description: "Failed to fetch factories", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactories();
  }, []);

  const handleAdd = async () => {
    if (!newFactory.name || !newFactory.location) {
      return toast({ 
        title: "Error", 
        description: "Please fill required fields (Name and Location)", 
        variant: "destructive" 
      });
    }
    try {
      const res = await axios.post("https://api.jsgallor.com/api/factories", newFactory, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.data.success) {
        setFactories([...factories, res.data.factory]);
        setNewFactory({ 
          name: "", 
          location: "", 
          capacity: "", 
          manager: "",
          contact: "",
          established: "",
          status: "Active"
        });
        setAddOpen(false);
        toast({ 
          title: "Success", 
          description: "Factory added successfully" 
        });
      }
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.response?.data?.message || "Server error", 
        variant: "destructive" 
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editFactory) return;
    try {
      const res = await axios.put(
        `https://api.jsgallor.com/api/factories/${editFactory._id}`, 
        editFactory, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setFactories(factories.map(f => f._id === editFactory._id ? res.data.factory : f));
        setEditFactory(null);
        toast({ 
          title: "Updated", 
          description: "Factory updated successfully" 
        });
      }
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.response?.data?.message || "Server error", 
        variant: "destructive" 
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this factory?")) return;
    
    try {
      const res = await axios.delete(
        `https://api.jsgallor.com/api/factories/${id}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setFactories(factories.filter(f => f._id !== id));
        toast({ 
          title: "Deleted", 
          description: "Factory removed successfully" 
        });
      }
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.response?.data?.message || "Server error", 
        variant: "destructive" 
      });
    }
  };

  const getStatusColor = (status: string = "Active") => {
    switch (status) {
      case "Active": return "bg-green-900/30 text-green-400 border border-green-800";
      case "Inactive": return "bg-red-900/30 text-red-400 border border-red-800";
      case "Maintenance": return "bg-yellow-900/30 text-yellow-400 border border-yellow-800";
      default: return "bg-gray-800 text-gray-400";
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Factories & Locations">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Factories & Locations | Manufacturer Portal</title>
        <meta name="description" content="Manage your manufacturing facilities and locations" />
      </Helmet>

      <DashboardLayout title="Factories & Locations">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-yellow-400">Factories & Locations</h1>
              <p className="text-gray-400 mt-2">
                {factories.length} factor{factories.length !== 1 ? 'ies' : 'y'} connected to your network
              </p>
            </div>
            
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Factory
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-yellow-400">Add New Factory</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-300">Factory Name *</Label>
                    <Input 
                      id="name"
                      placeholder="Factory Name" 
                      value={newFactory.name}
                      onChange={(e) => setNewFactory({ ...newFactory, name: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500 mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="location" className="text-gray-300">Location *</Label>
                    <Input 
                      id="location"
                      placeholder="Address, City, State" 
                      value={newFactory.location}
                      onChange={(e) => setNewFactory({ ...newFactory, location: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500 mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="capacity" className="text-gray-300">Production Capacity</Label>
                    <Input 
                      id="capacity"
                      placeholder="e.g., 1000 units/day" 
                      value={newFactory.capacity}
                      onChange={(e) => setNewFactory({ ...newFactory, capacity: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500 mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="manager" className="text-gray-300">Manager Name</Label>
                    <Input 
                      id="manager"
                      placeholder="Manager Name" 
                      value={newFactory.manager}
                      onChange={(e) => setNewFactory({ ...newFactory, manager: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500 mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contact" className="text-gray-300">Contact Number</Label>
                    <Input 
                      id="contact"
                      placeholder="+91 9876543210" 
                      value={newFactory.contact}
                      onChange={(e) => setNewFactory({ ...newFactory, contact: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500 mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="established" className="text-gray-300">Established Year</Label>
                    <Input 
                      id="established"
                      placeholder="YYYY" 
                      value={newFactory.established}
                      onChange={(e) => setNewFactory({ ...newFactory, established: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500 mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="status" className="text-gray-300">Status</Label>
                    <select
                      id="status"
                      className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white ring-offset-background focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 mt-1"
                      value={newFactory.status}
                      onChange={(e) => setNewFactory({ ...newFactory, status: e.target.value as any })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                  
                  <Button 
                    onClick={handleAdd} 
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold mt-2"
                  >
                    Add Factory
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {factories.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FactoryIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No factories connected</h3>
              <p className="text-gray-400 mb-6">
                Add your first manufacturing facility to start managing production
              </p>
              <Button 
                onClick={() => setAddOpen(true)} 
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Factory
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {factories.map((factory) => (
              <div 
                key={factory._id} 
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors group hover:shadow-xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <FactoryIcon className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-white group-hover:text-yellow-400 transition-colors">
                        {factory.name}
                      </h3>
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(factory.status)}`}>
                        {factory.status || "Active"}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-300">
                    <MapPin className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-sm text-gray-400">Location</p>
                      <p className="font-medium text-white">{factory.location}</p>
                    </div>
                  </div>
                  
                  {factory.capacity && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <Gauge className="w-5 h-5 text-yellow-400" />
                      <div>
                        <p className="text-sm text-gray-400">Production Capacity</p>
                        <p className="font-medium text-white">{factory.capacity}</p>
                      </div>
                    </div>
                  )}
                  
                  {factory.manager && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <Users className="w-5 h-5 text-yellow-400" />
                      <div>
                        <p className="text-sm text-gray-400">Manager</p>
                        <p className="font-medium text-white">{factory.manager}</p>
                      </div>
                    </div>
                  )}
                  
                  {factory.contact && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="w-5 h-5 flex items-center justify-center">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Contact</p>
                        <p className="font-medium text-white">{factory.contact}</p>
                      </div>
                    </div>
                  )}
                  
                  {factory.established && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="w-5 h-5 flex items-center justify-center">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Established</p>
                        <p className="font-medium text-white">{factory.established}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-6 pt-6 border-t border-gray-800">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setEditFactory(factory)}
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => handleDelete(factory._id)}
                    className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        <Dialog open={!!editFactory} onOpenChange={() => setEditFactory(null)}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-yellow-400">Edit Factory</DialogTitle>
            </DialogHeader>
            {editFactory && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name" className="text-gray-300">Factory Name</Label>
                  <Input 
                    id="edit-name"
                    placeholder="Factory Name" 
                    value={editFactory.name}
                    onChange={(e) => setEditFactory({ ...editFactory, name: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500 mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-location" className="text-gray-300">Location</Label>
                  <Input 
                    id="edit-location"
                    placeholder="Address, City, State" 
                    value={editFactory.location}
                    onChange={(e) => setEditFactory({ ...editFactory, location: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500 mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-capacity" className="text-gray-300">Production Capacity</Label>
                  <Input 
                    id="edit-capacity"
                    placeholder="e.g., 1000 units/day" 
                    value={editFactory.capacity}
                    onChange={(e) => setEditFactory({ ...editFactory, capacity: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500 mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-manager" className="text-gray-300">Manager Name</Label>
                  <Input 
                    id="edit-manager"
                    placeholder="Manager Name" 
                    value={editFactory.manager}
                    onChange={(e) => setEditFactory({ ...editFactory, manager: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500 mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-contact" className="text-gray-300">Contact Number</Label>
                  <Input 
                    id="edit-contact"
                    placeholder="+91 9876543210" 
                    value={editFactory.contact || ""}
                    onChange={(e) => setEditFactory({ ...editFactory, contact: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500 mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-established" className="text-gray-300">Established Year</Label>
                  <Input 
                    id="edit-established"
                    placeholder="YYYY" 
                    value={editFactory.established || ""}
                    onChange={(e) => setEditFactory({ ...editFactory, established: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white focus:border-yellow-500 mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-status" className="text-gray-300">Status</Label>
                  <select
                    id="edit-status"
                    className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white ring-offset-background focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 mt-1"
                    value={editFactory.status || "Active"}
                    onChange={(e) => setEditFactory({ ...editFactory, status: e.target.value as any })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                
                <Button 
                  onClick={handleSaveEdit} 
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold mt-2"
                >
                  Save Changes
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Stats Section */}
        <div className="mt-10 pt-8 border-t border-gray-800">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">Factory Network Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-400">Total Factories</p>
              <p className="text-2xl font-bold text-yellow-400">{factories.length}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-400">
                {factories.filter(f => f.status === "Active").length}
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-400">In Maintenance</p>
              <p className="text-2xl font-bold text-yellow-400">
                {factories.filter(f => f.status === "Maintenance").length}
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-400">Inactive</p>
              <p className="text-2xl font-bold text-red-400">
                {factories.filter(f => f.status === "Inactive").length}
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Factories;