import { useState } from "react";
import { Bell, ShoppingCart, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { cn } from "@/lib/utils";

interface Notification {
  id: number;
  message: string;
  time: string;
}

const notifications: Notification[] = [
  { id: 1, message: "New Order #5542 received.", time: "2 hrs ago" },
  { id: 2, message: "Catalogue item updated successfully.", time: "1 day ago" },
  { id: 3, message: "Factory document verified.", time: "3 days ago" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Top Icons */}
      <div className="fixed left-4 top-3.5 z-[140] flex gap-3 items-center lg:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-card border-none p-2 rounded-lg shadow-icon cursor-pointer"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Top Right Icons */}
      <div
        className={cn(
          "fixed right-7 top-4 flex gap-4 z-[120] items-center",
          notifOpen && "hidden"
        )}
      >
        <button
          onClick={() => setNotifOpen(true)}
          className="relative cursor-pointer flex items-center justify-center w-10 h-10 rounded-lg bg-card/95 shadow-icon"
          aria-label="Open notifications"
        >
          <Bell className="w-5 h-5 opacity-95" />
          <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[11px] px-1.5 py-0.5 rounded-full">
            3
          </span>
        </button>

        <button
          onClick={() => navigate("/orders")}
          className="relative cursor-pointer flex items-center justify-center w-10 h-10 rounded-lg bg-card/95 shadow-icon"
          title="View orders"
        >
          <ShoppingCart className="w-5 h-5 opacity-95" />
          <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[11px] px-1.5 py-0.5 rounded-full">
            5
          </span>
        </button>
      </div>

      {/* Overlay for notifications */}
      {notifOpen && (
        <div
          className="fixed inset-0 bg-foreground/35 z-[100]"
          onClick={() => setNotifOpen(false)}
        />
      )}

      {/* Notification Panel */}
      <aside
        className={cn(
          "fixed right-0 top-0 w-80 max-w-[90vw] h-full bg-card p-5 shadow-panel z-[110] flex flex-col gap-3 transition-transform duration-300 ease-out",
          notifOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Notifications</h3>
          <button
            onClick={() => setNotifOpen(false)}
            className="text-xl p-1.5 rounded-md hover:bg-muted cursor-pointer"
            aria-label="Close notifications"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {notifications.map((notif) => (
          <div key={notif.id} className="bg-muted p-3 rounded-lg text-sm">
            <div dangerouslySetInnerHTML={{ __html: notif.message }} />
            <div className="text-xs text-muted-foreground mt-1.5">{notif.time}</div>
          </div>
        ))}

        <div className="mt-auto text-[13px] text-muted-foreground">
          All notifications ·{" "}
          <button
            onClick={() => {
              setNotifOpen(false);
              navigate("/orders");
            }}
            className="text-primary hover:underline"
          >
            View Orders
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-[260px] p-6 md:p-10 w-full lg:w-[calc(100%-260px)] overflow-y-auto min-h-screen">
        {title && <h1 className="text-[28px] md:text-[32px] font-bold mb-5">{title}</h1>}
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
