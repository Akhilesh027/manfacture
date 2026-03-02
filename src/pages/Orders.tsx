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
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Download,
  Filter,
  Search,
  ChevronRight,
  Loader2,
  MapPin,
  XCircle,
  ThumbsUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const API_BASE = "https://api.jsgallor.com";

/** ✅ New statuses you want */
type OrderStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "packed"
  | "shipped"
  | "in_transit"
  | "out_for_delivery"
  | "delivered";

/** ✅ Your API may still send old statuses - support them safely */
type LegacyStatus = "draft" | "sent" | "completed";

/** ✅ UI will accept both from API, but we normalize to OrderStatus */
type ApiStatus = OrderStatus | LegacyStatus;

interface ApiOrder {
  _id: string;
  productName: string;
  sku?: string;
  quantity: number;
  expectedDate: string;
  paymentOption: string;
  notes?: string;
  status: ApiStatus; // IMPORTANT: accepts old values too
  address: string;
  createdAt: string;
}

/** ✅ Convert backend(old) -> frontend(new) */
const normalizeStatus = (s: ApiStatus): OrderStatus => {
  switch (s) {
    case "sent":
      return "pending"; // old "sent" = new "pending"
    case "completed":
      return "delivered"; // old "completed" = new "delivered"
    case "draft":
      return "pending"; // drafts show as pending for manufacturer side
    default:
      return s; // already new
  }
};

/** ✅ Status labels + icons */
const STATUS_META: Record<
  OrderStatus,
  { label: string; icon: any; badge: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    badge: "bg-yellow-900/30 text-yellow-400 border border-yellow-800",
  },
  accepted: {
    label: "Accepted",
    icon: ThumbsUp,
    badge: "bg-blue-900/30 text-blue-400 border border-blue-800",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    badge: "bg-red-900/30 text-red-400 border border-red-800",
  },
  packed: {
    label: "Packed",
    icon: Package,
    badge: "bg-purple-900/30 text-purple-400 border border-purple-800",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    badge: "bg-blue-900/30 text-blue-400 border border-blue-800",
  },
  in_transit: {
    label: "In Transit",
    icon: Truck,
    badge: "bg-cyan-900/30 text-cyan-300 border border-cyan-800",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    icon: MapPin,
    badge: "bg-orange-900/30 text-orange-300 border border-orange-800",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    badge: "bg-green-900/30 text-green-400 border border-green-800",
  },
};

const safeJson = async (res: Response) => {
  try {
    return await res.json();
  } catch {
    return {};
  }
};

const Orders = () => {
  const [viewOrder, setViewOrder] = useState<(ApiOrder & { status: OrderStatus }) | null>(null);

  const [orders, setOrders] = useState<(ApiOrder & { status: OrderStatus })[]>([]);
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
      toast({
        title: "Error",
        description: "Manufacturer ID not found. Please login again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/manufacturer/orders/${manufacturerId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      const data = await safeJson(res);

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to load orders");
      }

      const list = Array.isArray(data.orders) ? data.orders : [];
      const normalized = list.map((o: ApiOrder) => ({
        ...o,
        status: normalizeStatus(o.status),
      }));

      setOrders(normalized);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to fetch orders",
        variant: "destructive",
      });
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await safeJson(res);

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to update status");
      }

      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: nextStatus } : o))
      );
      setViewOrder((prev) =>
        prev && prev._id === orderId ? { ...prev, status: nextStatus } : prev
      );

      toast({
        title: "Status Updated",
        description: `Order status changed to ${STATUS_META[nextStatus].label}`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update status",
        variant: "destructive",
      });
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
        order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.sku || "").toLowerCase().includes(searchTerm.toLowerCase());

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

  const FlowButtons = ({ order }: { order: (ApiOrder & { status: OrderStatus }) }) => {
    const busy = updatingId === order._id;

    // 1) FIRST accept/reject
    if (order.status === "pending") {
      return (
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={busy}
            onClick={() => updateStatus(order._id, "accepted")}
          >
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ThumbsUp className="w-4 h-4 mr-2" />}
            Accept
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={busy}
            onClick={() => updateStatus(order._id, "rejected")}
          >
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
            Reject
          </Button>
        </div>
      );
    }

    // Rejected / Delivered -> no further actions
    if (order.status === "rejected" || order.status === "delivered") {
      return <span className="text-xs text-gray-400">No actions</span>;
    }

    // 2) AFTER accepted, allow status progression buttons
    if (order.status === "accepted") {
      return (
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="border-gray-700 text-gray-200 hover:bg-gray-800"
            disabled={busy}
            onClick={() => updateStatus(order._id, "packed")}
          >
            <Package className="w-4 h-4 mr-2" />
            Packed
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-gray-700 text-gray-200 hover:bg-gray-800"
            disabled={busy}
            onClick={() => updateStatus(order._id, "shipped")}
          >
            <Truck className="w-4 h-4 mr-2" />
            Shipped
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-gray-700 text-gray-200 hover:bg-gray-800"
            disabled={busy}
            onClick={() => updateStatus(order._id, "in_transit")}
          >
            <Truck className="w-4 h-4 mr-2" />
            In Transit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-gray-700 text-gray-200 hover:bg-gray-800"
            disabled={busy}
            onClick={() => updateStatus(order._id, "out_for_delivery")}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Out for Delivery
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={busy}
            onClick={() => updateStatus(order._id, "delivered")}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Delivered
          </Button>
        </div>
      );
    }

    // If already packed/shipped/etc, show continue buttons too (optional)
    return (
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          className="border-gray-700 text-gray-200 hover:bg-gray-800"
          disabled={busy}
          onClick={() => updateStatus(order._id, "shipped")}
        >
          <Truck className="w-4 h-4 mr-2" />
          Shipped
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-gray-700 text-gray-200 hover:bg-gray-800"
          disabled={busy}
          onClick={() => updateStatus(order._id, "in_transit")}
        >
          <Truck className="w-4 h-4 mr-2" />
          In Transit
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-gray-700 text-gray-200 hover:bg-gray-800"
          disabled={busy}
          onClick={() => updateStatus(order._id, "out_for_delivery")}
        >
          <MapPin className="w-4 h-4 mr-2" />
          Out for Delivery
        </Button>
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={busy}
          onClick={() => updateStatus(order._id, "delivered")}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Delivered
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
        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by Order ID, product, or SKU..."
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
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Refresh
            </Button>

            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" disabled>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card className="bg-gray-900 border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-800 border-b border-gray-800">
                  <TableHead className="text-gray-300 py-4">Order</TableHead>
                  <TableHead className="text-gray-300 py-4">Product</TableHead>
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
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" /> Loading...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-gray-400">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order._id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <TableCell className="text-yellow-400 py-4">
                        {order._id.slice(-6).toUpperCase()}
                      </TableCell>
                      <TableCell className="text-white py-4">{order.productName}</TableCell>
                      <TableCell className="text-gray-300 py-4">{order.sku || "-"}</TableCell>
                      <TableCell className="text-white py-4">{order.quantity}</TableCell>
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
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-800 ml-2">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Modal */}
        <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-yellow-400 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Details
              </DialogTitle>
            </DialogHeader>

            {viewOrder && (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold">{viewOrder.productName}</h3>
                    <p className="text-gray-400 text-sm">Order ID: {viewOrder._id}</p>
                  </div>
                  <StatusBadge status={viewOrder.status} />
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
