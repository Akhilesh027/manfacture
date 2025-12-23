import { useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  product: string;
  quantity: number;
  date: string;
  status: "pending" | "shipped" | "delivered";
}

const orders: Order[] = [
  { id: "#1024", product: "Wooden Chair", quantity: 150, date: "2025-02-10", status: "pending" },
  { id: "#1025", product: "Luxury Sofa Set", quantity: 40, date: "2025-02-08", status: "shipped" },
  { id: "#1026", product: "Dining Table", quantity: 25, date: "2025-02-05", status: "delivered" },
  { id: "#1027", product: "Office Desk", quantity: 80, date: "2025-02-03", status: "pending" },
  { id: "#1028", product: "Bookshelf", quantity: 60, date: "2025-02-01", status: "shipped" },
];

const statusStyles = {
  pending: "bg-warning/20 text-warning-foreground",
  shipped: "bg-info/20 text-info",
  delivered: "bg-success/20 text-success",
};

const Orders = () => {
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  return (
    <>
      <Helmet>
        <title>Orders from JS Gallor | Manufacturer Portal</title>
        <meta name="description" content="View and manage orders from JS Gallor" />
      </Helmet>

      <DashboardLayout title="Orders from JS Gallor">
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="font-semibold">Order ID</TableHead>
                <TableHead className="font-semibold">Product</TableHead>
                <TableHead className="font-semibold">Quantity</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.product}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>
                    <span className={cn("px-3 py-1.5 rounded-md text-xs font-semibold capitalize", statusStyles[order.status])}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="secondary" onClick={() => setViewOrder(order)}>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Order Detail Modal */}
        <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
          <DialogContent className="animate-slide-up">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-base">
              <div className="flex">
                <strong className="w-28">Order ID:</strong>
                <span>{viewOrder?.id}</span>
              </div>
              <div className="flex">
                <strong className="w-28">Product:</strong>
                <span>{viewOrder?.product}</span>
              </div>
              <div className="flex">
                <strong className="w-28">Quantity:</strong>
                <span>{viewOrder?.quantity}</span>
              </div>
              <div className="flex">
                <strong className="w-28">Date:</strong>
                <span>{viewOrder?.date}</span>
              </div>
              <div className="flex">
                <strong className="w-28">Status:</strong>
                <span className={cn("px-3 py-1 rounded-md text-xs font-semibold capitalize", viewOrder && statusStyles[viewOrder.status])}>
                  {viewOrder?.status}
                </span>
              </div>
              <Button variant="destructive" onClick={() => setViewOrder(null)} className="mt-4">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
};

export default Orders;
