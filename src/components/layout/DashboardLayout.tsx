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
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      {/* Sidebar - Note: You'll need to update the Sidebar component separately for full dark theme */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Top Icons */}
      <div className="fixed left-4 top-3.5 z-[140] flex gap-3 items-center lg:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-gray-900 border border-gray-800 p-2.5 rounded-lg shadow-lg cursor-pointer hover:bg-gray-800 transition-colors"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? (
            <X className="w-5 h-5 text-yellow-400" />
          ) : (
            <Menu className="w-5 h-5 text-yellow-400" />
          )}
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
          className="relative cursor-pointer flex items-center justify-center w-10 h-10 rounded-lg bg-gray-900 border border-gray-800 shadow-lg hover:bg-gray-800 transition-colors"
          aria-label="Open notifications"
        >
          <Bell className="w-5 h-5 text-yellow-400" />
          <span className="absolute -top-1.5 -right-1.5 bg-yellow-500 text-black text-[11px] px-1.5 py-0.5 rounded-full font-bold">
            3
          </span>
        </button>

        <button
          onClick={() => navigate("/orders")}
          className="relative cursor-pointer flex items-center justify-center w-10 h-10 rounded-lg bg-gray-900 border border-gray-800 shadow-lg hover:bg-gray-800 transition-colors"
          title="View orders"
        >
          <ShoppingCart className="w-5 h-5 text-yellow-400" />
          <span className="absolute -top-1.5 -right-1.5 bg-yellow-500 text-black text-[11px] px-1.5 py-0.5 rounded-full font-bold">
            5
          </span>
        </button>
      </div>

      {/* Overlay for notifications */}
      {notifOpen && (
        <div
          className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-[100]"
          onClick={() => setNotifOpen(false)}
        />
      )}

      {/* Notification Panel */}
      <aside
        className={cn(
          "fixed right-0 top-0 w-80 max-w-[90vw] h-full bg-gray-900 border-l border-gray-800 p-5 shadow-xl z-[110] flex flex-col gap-3 transition-transform duration-300 ease-out",
          notifOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-yellow-400">Notifications</h3>
          <button
            onClick={() => setNotifOpen(false)}
            className="text-xl p-1.5 rounded-md hover:bg-gray-800 cursor-pointer transition-colors"
            aria-label="Close notifications"
          >
            <X className="w-5 h-5 text-yellow-400" />
          </button>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="bg-gray-800 border border-gray-700 p-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div 
                className="text-white text-sm"
                dangerouslySetInnerHTML={{ __html: notif.message }} 
              />
              <div className="text-xs text-gray-400 mt-2">{notif.time}</div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-800">
          <div className="text-[13px] text-gray-400">
            All notifications ·{" "}
            <button
              onClick={() => {
                setNotifOpen(false);
                navigate("/orders");
              }}
              className="text-yellow-400 hover:text-yellow-300 hover:underline font-medium"
            >
              View Orders
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-[260px] p-6 md:p-8 w-full lg:w-[calc(100%-260px)] overflow-y-auto min-h-screen">
        {title && (
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-yellow-400">
              {title}
            </h1>
            <p className="text-gray-400 mt-2">
              Welcome to your manufacturer dashboard
            </p>
          </div>
        )}
        <div className="text-white">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;