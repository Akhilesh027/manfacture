import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Eye,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Download,
  Filter,
  Search,
  Loader2,
  MapPin,
  XCircle,
  ThumbsUp,
  List,
  ImageOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const API_BASE = "https://api.jsgallor.com";

type OrderStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "packed"
  | "shipped"
  | "in_transit"
  | "out_for_delivery"
  | "delivered";

type LegacyStatus = "draft" | "sent" | "completed";
type ApiStatus = OrderStatus | LegacyStatus;

interface ProductDetails {
  _id: string;
  price: number;
  imageUrl?: string;
  brand?: string;
  category?: string;
}

interface LineItem {
  productId: string | ProductDetails;
  productName: string;
  sku?: string;
  quantity: number;
}

interface NormalizedItem {
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  details?: {
    price: number;
    imageUrl?: string;
    brand?: string;
    category?: string;
  };
}

interface ApiOrder {
  _id: string;
  items: LineItem[];
  expectedDate: string;
  paymentOption: string;
  notes?: string;
  status: ApiStatus;
  address: string;
  createdAt: string;
}

interface NormalizedOrder extends Omit<ApiOrder, "status" | "items"> {
  status: OrderStatus;
  items: NormalizedItem[];
  productDisplay: string;
}

const normalizeStatus = (s: ApiStatus): OrderStatus => {
  switch (s) {
    case "sent":
    case "draft":
      return "pending";
    case "completed":
      return "delivered";
    default:
      return s;
  }
};

const STATUS_META: Record<OrderStatus, { label: string; icon: any; badge: string }> = {
  pending: { label: "Pending", icon: Clock, badge: "bg-yellow-900/30 text-yellow-400 border border-yellow-800" },
  accepted: { label: "Accepted", icon: ThumbsUp, badge: "bg-blue-900/30 text-blue-400 border border-blue-800" },
  rejected: { label: "Rejected", icon: XCircle, badge: "bg-red-900/30 text-red-400 border border-red-800" },
  packed: { label: "Packed", icon: Package, badge: "bg-purple-900/30 text-purple-400 border border-purple-800" },
  shipped: { label: "Shipped", icon: Truck, badge: "bg-blue-900/30 text-blue-400 border border-blue-800" },
  in_transit: { label: "In Transit", icon: Truck, badge: "bg-cyan-900/30 text-cyan-300 border border-cyan-800" },
  out_for_delivery: { label: "Out for Delivery", icon: MapPin, badge: "bg-orange-900/30 text-orange-300 border border-orange-800" },
  delivered: { label: "Delivered", icon: CheckCircle, badge: "bg-green-900/30 text-green-400 border border-green-800" },
};

const safeJson = async (res: Response) => {
  try {
    return await res.json();
  } catch {
    return {};
  }
};

const Orders = () => {
  const [viewOrder, setViewOrder] = useState<NormalizedOrder | null>(null);
  const [orders, setOrders] = useState<NormalizedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");

  const getToken = () => localStorage.getItem("token") || "";
  const getManufacturerId = () => {
    try {
      const raw = localStorage.getItem("manufacturer");
      if (!raw) return "";
      const user = JSON.parse(raw);
      return user?._id || user?.id || "";
    } catch {
      return "";
    }
  };

  const fetchOrders = async () => {
    const manufacturerId = getManufacturerId();
    if (!manufacturerId) {
      toast({ title: "Error", description: "Manufacturer ID not found. Please login again.", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/manufacturer/orders/${manufacturerId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error(data?.message || "Failed to load orders");

      const rawOrders: ApiOrder[] = Array.isArray(data.orders) ? data.orders : [];

      const normalized = rawOrders.map((order) => {
        const items: NormalizedItem[] = order.items.map((item) => {
          let productIdStr: string;
          let details: NormalizedItem["details"] = undefined;

          if (typeof item.productId === "object" && item.productId !== null) {
            productIdStr = item.productId._id;
            details = {
              price: item.productId.price ?? 0,
              imageUrl: item.productId.imageUrl,
              brand: item.productId.brand,
              category: item.productId.category,
            };
          } else {
            productIdStr = item.productId as string;
          }

          return {
            productId: productIdStr,
            productName: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            details,
          };
        });

        const productDisplay =
          items.length === 1
            ? `${items[0].productName} (x${items[0].quantity})`
            : items.length > 1
            ? `${items[0].productName} + ${items.length - 1} more`
            : "No products";

        return {
          ...order,
          items,
          productDisplay,
          status: normalizeStatus(order.status),
        } as NormalizedOrder;
      });

      setOrders(normalized);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to fetch orders", variant: "destructive" });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      setUpdatingId(orderId);
      const res = await fetch(`${API_BASE}/api/manufacturer/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error(data?.message || "Failed to update status");

      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: nextStatus } : o)));
      setViewOrder((prev) => (prev && prev._id === orderId ? { ...prev, status: nextStatus } : prev));

      toast({ title: "Status Updated", description: `Order status changed to ${STATUS_META[nextStatus].label}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update status", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.productDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some((item) => (item.sku || "").toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const StatusBadge = ({ status }: { status: OrderStatus }) => {
    const Icon = STATUS_META[status].icon;
    return (
      <Badge className={`flex items-center gap-1.5 w-fit ${STATUS_META[status].badge}`}>
        <Icon className="w-4 h-4" />
        <span>{STATUS_META[status].label}</span>
      </Badge>
    );
  };

  const FlowButtons = ({ order }: { order: NormalizedOrder }) => {
    const busy = updatingId === order._id;
    if (order.status === "pending") {
      return (
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={busy} onClick={() => updateStatus(order._id, "accepted")}>
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ThumbsUp className="w-4 h-4 mr-2" />} Accept
          </Button>
          <Button size="sm" variant="destructive" disabled={busy} onClick={() => updateStatus(order._id, "rejected")}>
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />} Reject
          </Button>
        </div>
      );
    }
    if (order.status === "rejected" || order.status === "delivered") return <span className="text-xs text-gray-400">No actions</span>;
    return (
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" className="border-gray-700 text-gray-200 hover:bg-gray-800" disabled={busy} onClick={() => updateStatus(order._id, "shipped")}>
          <Truck className="w-4 h-4 mr-2" /> Shipped
        </Button>
        <Button size="sm" variant="outline" className="border-gray-700 text-gray-200 hover:bg-gray-800" disabled={busy} onClick={() => updateStatus(order._id, "in_transit")}>
          <Truck className="w-4 h-4 mr-2" /> In Transit
        </Button>
        <Button size="sm" variant="outline" className="border-gray-700 text-gray-200 hover:bg-gray-800" disabled={busy} onClick={() => updateStatus(order._id, "out_for_delivery")}>
          <MapPin className="w-4 h-4 mr-2" /> Out for Delivery
        </Button>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={busy} onClick={() => updateStatus(order._id, "delivered")}>
          <CheckCircle className="w-4 h-4 mr-2" /> Delivered
        </Button>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Orders | Manufacturer Portal</title>
      </Helmet>
      <DashboardLayout title="Orders">
        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by Order ID, product name, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-800 text-white focus:border-yellow-500"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-yellow-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-gray-900 border border-gray-800 text-white rounded-md px-3 py-2"
              >
                <option value="all">All</option>
                {Object.keys(STATUS_META).map((k) => (
                  <option key={k} value={k}>
                    {STATUS_META[k as OrderStatus].label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={fetchOrders}
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Refresh
            </Button>
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" disabled>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Orders Table */}
        <Card className="bg-gray-900 border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-800 border-b border-gray-800">
                  <TableHead className="text-gray-300 py-4">Order</TableHead>
                  <TableHead className="text-gray-300 py-4">Products</TableHead>
                  <TableHead className="text-gray-300 py-4">SKU</TableHead>
                  <TableHead className="text-gray-300 py-4">Qty</TableHead>
                  <TableHead className="text-gray-300 py-4">Expected</TableHead>
                  <TableHead className="text-gray-300 py-4">Status</TableHead>
                  <TableHead className="text-gray-300 py-4">Actions</TableHead>
                  <TableHead className="text-gray-300 py-4">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-gray-400">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const firstItem = order.items[0];
                    const hasMultiple = order.items.length > 1;
                    return (
                      <TableRow key={order._id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="text-yellow-400 py-4">{order._id.slice(-6).toUpperCase()}</TableCell>
                        <TableCell className="text-white py-4">
                          <div className="flex items-center gap-2">
                            <span>{firstItem.productName}</span>
                            {hasMultiple && (
                              <Badge variant="outline" className="bg-gray-800 text-xs">
                                +{order.items.length - 1} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300 py-4">
                          {firstItem.sku || "-"}
                          {hasMultiple && <span className="text-xs text-gray-500 ml-1">(varies)</span>}
                        </TableCell>
                        <TableCell className="text-white py-4">
                          {order.items.reduce((sum, i) => sum + i.quantity, 0)}
                        </TableCell>
                        <TableCell className="text-gray-300 py-4">
                          {new Date(order.expectedDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="py-4">
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="py-4">
                          <FlowButtons order={order} />
                        </TableCell>
                        <TableCell className="py-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewOrder(order)}
                            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                          >
                            <Eye className="w-4 h-4 mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Order Details Modal with fallback for missing data */}
        <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-yellow-400 flex items-center gap-2">
                <Package className="w-5 h-5" /> Order Details
              </DialogTitle>
            </DialogHeader>
            {viewOrder && (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold">Order #{viewOrder._id.slice(-6).toUpperCase()}</h3>
                    <p className="text-gray-400 text-sm">Placed: {new Date(viewOrder.createdAt).toLocaleString()}</p>
                  </div>
                  <StatusBadge status={viewOrder.status} />
                </div>

                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2 flex items-center gap-1">
                    <List className="w-4 h-4" /> Order Items
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-2">Product</th>
                          <th className="text-left py-2">SKU</th>
                          <th className="text-left py-2">Qty</th>
                          <th className="text-left py-2">Unit Price</th>
                          <th className="text-left py-2">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewOrder.items.map((item, idx) => {
                          const price = item.details?.price ?? 0;
                          const subtotal = price * item.quantity;
                          const hasDetails = !!item.details;
                          return (
                            <tr key={idx} className="border-b border-gray-700/50">
                              <td className="py-2">
                                <div className="flex items-center gap-2">
                                  {hasDetails && item.details?.imageUrl ? (
                                    <img
                                      src={item.details.imageUrl}
                                      alt={item.productName}
                                      className="w-8 h-8 object-cover rounded"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                                      <ImageOff className="w-4 h-4 text-gray-400" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium">{item.productName}</div>
                                    {hasDetails && item.details?.brand && (
                                      <div className="text-xs text-gray-400">{item.details.brand}</div>
                                    )}
                                    {!hasDetails && (
                                      <div className="text-xs text-yellow-500">Details not available</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-2">{item.sku || "-"}</td>
                              <td className="py-2">{item.quantity}</td>
                              <td className="py-2">
                                {hasDetails ? `$${price.toFixed(2)}` : "—"}
                              </td>
                              <td className="py-2">
                                {hasDetails ? `$${subtotal.toFixed(2)}` : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {viewOrder.items.some((i) => i.details?.price) && (
                        <tfoot>
                          <tr>
                            <td colSpan={4} className="text-right font-medium py-2">
                              Total:
                            </td>
                            <td className="font-bold text-yellow-400">
                              $
                              {viewOrder.items
                                .reduce((sum, i) => sum + (i.details?.price ?? 0) * i.quantity, 0)
                                .toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Delivery Address</p>
                  <p className="text-white">{viewOrder.address}</p>
                </div>

                <div className="pt-2">
                  <p className="text-sm text-gray-400 mb-2">Actions</p>
                  <FlowButtons order={viewOrder} />
                </div>

                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={() => setViewOrder(null)}
                >
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
};

export default Orders;