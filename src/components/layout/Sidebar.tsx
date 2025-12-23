import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, Factory, ShoppingCart, User, HelpCircle, LogOut } from "lucide-react";
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

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/35 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-[260px] bg-sidebar text-sidebar-foreground flex flex-col p-6 z-50 transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="text-[22px] font-bold mb-2.5 tracking-tight">
          Manufacturer Portal
        </div>

        {/* Profile Box */}
        <div className="flex items-center mt-2.5 mb-6 pb-4 border-b border-sidebar-foreground/10">
          <img
            src="https://i.pravatar.cc/100"
            alt="Profile"
            className="w-12 h-12 rounded-full mr-3 border-2 border-sidebar-foreground object-cover"
          />
          <h4 className="text-base font-semibold leading-tight">Galaxy Industries</h4>
        </div>

        {/* Menu */}
        <nav className="mt-4 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 text-sidebar-foreground/90 py-3 px-2.5 rounded-lg mb-2 transition-colors text-[15px] hover:bg-sidebar-accent",
                  isActive && "bg-sidebar-accent"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <Link
          to="/"
          className="flex items-center gap-3 text-destructive py-3 px-2.5 rounded-lg transition-colors text-[15px] hover:bg-sidebar-accent mt-auto"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Link>
      </aside>
    </>
  );
};

export default Sidebar;
