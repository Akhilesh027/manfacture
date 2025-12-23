import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/stat-card";
import { Package, ShoppingCart, Factory, User } from "lucide-react";

const Dashboard = () => {
  return (
    <>
      <Helmet>
        <title>Dashboard | Manufacturer Portal</title>
        <meta name="description" content="Manufacturer dashboard - manage catalogues, orders, and factories" />
      </Helmet>

      <DashboardLayout title="Welcome Back!">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard
            title="Total Catalogues"
            value={12}
            buttonLabel="Manage"
            href="/catalogue"
            icon={Package}
          />
          <StatCard
            title="New Orders"
            value={5}
            buttonLabel="View Orders"
            href="/orders"
            icon={ShoppingCart}
          />
          <StatCard
            title="Factories Linked"
            value={3}
            buttonLabel="View Factories"
            href="/factories"
            icon={Factory}
          />
          <StatCard
            title="Profile Status"
            value="Completed"
            buttonLabel="View Profile"
            href="/profile"
            icon={User}
          />
        </div>
      </DashboardLayout>
    </>
  );
};

export default Dashboard;
