import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Factory,
  ShoppingCart,
  User,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Catalogue Management", href: "/catalogue", icon: Package },
  { label: "Factories / Locations", href: "/factories", icon: Factory },
  { label: "Orders from JS Gallor", href: "/orders", icon: ShoppingCart },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Help", href: "/help", icon: HelpCircle },
];

const Sidebar = ({ isOpen = true, onClose }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const manufacturer = JSON.parse(
    localStorage.getItem("manufacturer") || "{}"
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("manufacturer");
    localStorage.removeItem("userId");
    navigate("/");
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-[260px] bg-gray-900 border-r border-gray-800 text-white flex flex-col p-6 z-50 transition-transform duration-300 ease-out shadow-xl",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center mb-8">
          <div className="text-2xl font-bold tracking-tight text-yellow-400">
            Manufacturer Portal
          </div>
        </div>

        {/* Profile */}
        <div className="flex items-center mb-8 pb-6 border-b border-gray-800">
           <img
              src={`https://ui-avatars.com/api/?name=${manufacturer.companyName || "M"}&background=0D8ABC&color=fff`}
              alt="Profile"
              className="w-14 h-14 rounded-full mr-4 border-2 border-yellow-400 object-cover"
            />
          <div className="relative">
           
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-gray-900 rounded-full"></div>
          </div>
          <div className="flex-1">
            <h4 className="text-base font-semibold text-white truncate">
              {manufacturer.companyName || "Manufacturer"}
            </h4>
            <p className="text-xs text-gray-400 mt-1 truncate">
              {manufacturer.email || "user@example.com"}
            </p>
            <div className="mt-1">
              <span className="text-xs bg-gray-800 text-yellow-400 px-2 py-1 rounded-full">
                Verified
              </span>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-200 hover:bg-gray-800 hover:text-yellow-400 group",
                  isActive 
                    ? "bg-gray-800 text-yellow-400 border-l-4 border-yellow-400" 
                    : "text-gray-300"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-yellow-400" : "text-gray-400 group-hover:text-yellow-400"
                )} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-yellow-400 rounded-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto pt-6 border-t border-gray-800">
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors group"
          >
            <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-red-900/30 transition-colors">
              <LogOut className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-white">Logout</div>
              <div className="text-xs text-gray-400">Sign out of your account</div>
            </div>
          </button>

          {/* Version/Status */}
          <div className="mt-6 text-center">
            <div className="text-xs text-gray-500 mb-1">Version 2.1.4</div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-400">System Online</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;