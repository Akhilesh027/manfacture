import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  ShoppingCart,
  Factory,
  User,
  TrendingUp,
  DollarSign,
  Clock,
  BarChart3,
  ArrowUpRight,
  Calendar,
  TrendingDown,
  RefreshCw,
  Eye,
  PlusCircle,
  Activity,
} from "lucide-react";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

type OrderStatus = "pending" | "shipped" | "delivered";

type ActivityType = "order" | "catalogue" | "factory" | "profile";

interface ActivityItem {
  id: number;
  type: ActivityType;
  message: string;
  time: string;
}

interface RecentProduct {
  _id: string;
  name: string;
  price: number;
  availability: string;
  status: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

interface BackendRecentOrder {
  _id: string;
  orderNumber: string;
  status: string; // backend can be any text; we normalize
  totalAmount: number;
  product?: { name?: string; image?: string };
  createdAt?: string;
  updatedAt?: string;
}

interface DashboardStats {
  totalCatalogues: number;
  newOrders: number;
  factoriesLinked: number;

  activeProducts: number;
  activeFactories: number;

  profileCompletion: number;
  profileStatus: "Completed" | "Incomplete";

  recentProducts: RecentProduct[];
  recentOrders: BackendRecentOrder[];

  // optional placeholders if you don't have API for these yet
  totalRevenue?: number;
  pendingOrders?: number;
  monthlyGrowth?: number;
}

const DEFAULT_STATS: DashboardStats = {
  totalCatalogues: 0,
  newOrders: 0,
  factoriesLinked: 0,
  activeProducts: 0,
  activeFactories: 0,
  profileCompletion: 0,
  profileStatus: "Incomplete",
  recentProducts: [],
  recentOrders: [],
  totalRevenue: 0,
  pendingOrders: 0,
  monthlyGrowth: 0,
};

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day ago`;
};

const formatDate = (isoOrDate: string) => {
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return isoOrDate;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeOrderStatus = (s: string): OrderStatus => {
  const v = String(s || "").toLowerCase();
  if (v.includes("deliver")) return "delivered";
  if (v.includes("ship")) return "shipped";
  return "pending";
};

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const API = import.meta.env.VITE_API_URL || "https://api.jsgallor.com";

  const fetchDashboardStats = async () => {
    try {
      if (!userId || !token) {
        setLoading(false);
        toast({
          title: "Session expired",
          description: "Please login again.",
          variant: "destructive",
        });
        return;
      }

      setRefreshing(true);

      const res = await axios.get(`${API}/api/manufacturer/dashboard/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStats({ ...DEFAULT_STATS, ...(res.data?.data || {}) });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-900/30 text-yellow-400 border border-yellow-800";
      case "shipped":
        return "bg-blue-900/30 text-blue-400 border border-blue-800";
      case "delivered":
        return "bg-green-900/30 text-green-400 border border-green-800";
      default:
        return "bg-gray-800 text-gray-400";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingCart className="w-5 h-5 text-blue-400" />;
      case "catalogue":
        return <Package className="w-5 h-5 text-green-400" />;
      case "factory":
        return <Factory className="w-5 h-5 text-yellow-400" />;
      case "profile":
        return <User className="w-5 h-5 text-purple-400" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  // ✅ Recent Activity from real DB products
  const recentActivity: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];

    (stats.recentProducts || []).slice(0, 4).forEach((p, idx) => {
      items.push({
        id: idx + 1,
        type: "catalogue",
        message: `Product '${p.name}' updated (${p.status})`,
        time: timeAgo(p.updatedAt || p.createdAt),
      });
    });

    items.push({
      id: items.length + 1,
      type: "profile",
      message:
        stats.profileCompletion >= 80
          ? "Profile looks good. Keep it updated."
          : "Complete your profile to unlock all features.",
      time: "now",
    });

    if ((stats.factoriesLinked ?? 0) === 0) {
      items.push({
        id: items.length + 1,
        type: "factory",
        message: "No factories linked yet. Add your first factory.",
        time: "now",
      });
    }

    return items.slice(0, 5);
  }, [stats.recentProducts, stats.profileCompletion, stats.factoriesLinked]);

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const hasOrders = (stats.recentOrders || []).length > 0;

  return (
    <>
      <Helmet>
        <title>Dashboard | JS Gallor Manufacturer Portal</title>
        <meta
          name="description"
          content="Manufacturer dashboard - manage catalogues, orders, and factories"
        />
      </Helmet>

      <DashboardLayout title="Dashboard">
        <div className="min-h-screen bg-black text-white p-4 md:p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
                  Welcome Back! 👋
                </h1>
                <p className="text-gray-300">
                  Here's what's happening with your business today.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={fetchDashboardStats}
                  disabled={refreshing}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                  />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </Button>

                <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>

            {/* Profile Completion */}
            <Card className="bg-gradient-to-r from-gray-900 to-black border border-gray-800 mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Profile Completion
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Complete your profile to unlock all features
                    </p>
                  </div>

                  <div className="flex-1 max-w-md">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">Progress</span>
                      <span className="text-yellow-400 font-semibold">
                        {stats.profileCompletion}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${stats.profileCompletion}%` }}
                      />
                    </div>

                    <div className="mt-2 text-xs text-gray-400">
                      Status:{" "}
                      <span className="text-yellow-400 font-semibold">
                        {stats.profileStatus}
                      </span>
                    </div>
                  </div>

                  <Button
                    asChild
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                  >
                    <Link to="/profile">Complete Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
            {/* Total Catalogue */}
            <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Total Catalogues</p>
                    <p className="text-3xl font-bold text-yellow-400 mt-2">
                      {stats.totalCatalogues}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-900/30 rounded-lg group-hover:bg-yellow-900/50 transition-colors">
                    <Package className="w-7 h-7 text-yellow-400" />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <ArrowUpRight className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">
                    Active Products: {stats.activeProducts}
                  </span>
                </div>

                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-center mt-4 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20"
                >
                  <Link to="/catalogue">
                    <Package className="w-4 h-4 mr-2" />
                    Manage Catalogues
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* New Orders */}
            <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-400">New Orders</p>
                    <p className="text-3xl font-bold text-yellow-400 mt-2">
                      {stats.newOrders}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-900/30 rounded-lg group-hover:bg-blue-900/50 transition-colors">
                    <ShoppingCart className="w-7 h-7 text-blue-400" />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  {stats.newOrders > 0 ? (
                    <>
                      <ArrowUpRight className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">
                        +{stats.newOrders} new this week
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">No new orders</span>
                    </>
                  )}
                </div>

                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-center mt-4 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                >
                  <Link to="/orders">
                    <Eye className="w-4 h-4 mr-2" />
                    View Orders
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Factories Linked */}
            <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Factories Linked</p>
                    <p className="text-3xl font-bold text-yellow-400 mt-2">
                      {stats.factoriesLinked}
                    </p>
                  </div>
                  <div className="p-3 bg-green-900/30 rounded-lg group-hover:bg-green-900/50 transition-colors">
                    <Factory className="w-7 h-7 text-green-400" />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  {stats.factoriesLinked > 0 ? (
                    <>
                      <ArrowUpRight className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">
                        Active Factories: {stats.activeFactories}
                      </span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-300">Add your first factory</span>
                    </>
                  )}
                </div>

                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-center mt-4 text-green-400 hover:text-green-300 hover:bg-green-900/20"
                >
                  <Link to="/factories">
                    <Factory className="w-4 h-4 mr-2" />
                    Manage Factories
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Total Revenue (optional placeholder) */}
            <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Total Revenue</p>
                    <p className="text-3xl font-bold text-yellow-400 mt-2">
                      ₹{(stats.totalRevenue ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-900/30 rounded-lg group-hover:bg-purple-900/50 transition-colors">
                    <DollarSign className="w-7 h-7 text-purple-400" />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  (stats.monthlyGrowth ?? 0) ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">
                        +{stats.monthlyGrowth}% this month
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-400" />
                      <span className="text-red-400">-2% this month</span>
                    </>
                  )
                </div>

                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-center mt-4 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                >
                  <Link to="/orders">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Orders + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Orders (from backend, if empty show "No orders") */}
            <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Recent Orders</h3>

                  <Button
                    asChild
                    variant="ghost"
                    className="text-yellow-400 hover:text-yellow-300"
                    disabled={!hasOrders}
                  >
                    <Link to="/orders">
                      View All
                      <ArrowUpRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>

                {!hasOrders ? (
                  <div className="p-6 bg-gray-800/40 border border-gray-700 rounded-lg text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-gray-800 flex items-center justify-center mb-3">
                      <ShoppingCart className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-white font-medium">No orders yet</p>
                    <p className="text-gray-400 text-sm mt-1">
                      When customers place orders, they’ll show up here.
                    </p>

                    <div className="mt-4 flex items-center justify-center gap-3">
                      <Button
                        asChild
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                      >
                        <Link to="/catalogue">
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Add Products
                        </Link>
                      </Button>

                      <Button
                        asChild
                        variant="outline"
                        className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                      >
                        <Link to="/factories">
                          <Factory className="w-4 h-4 mr-2" />
                          Add Factory
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.recentOrders.map((order) => {
                      const status = normalizeOrderStatus(order.status);
                      const dateIso = order.createdAt || order.updatedAt || "";
                      const dateText = dateIso ? formatDate(dateIso) : "";

                      return (
                        <div
                          key={order._id}
                          className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-gray-700 rounded-lg">
                              <ShoppingCart className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {order.product?.name || "Order Item"}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-gray-400">
                                  #{order.orderNumber}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-yellow-400">
                              ₹{Number(order.totalAmount || 0).toLocaleString()}
                            </p>
                            <div className="flex items-center gap-3 mt-1 justify-end">
                              <Badge className={getStatusColor(status)}>{status}</Badge>
                              {dateText && (
                                <span className="text-sm text-gray-400">{dateText}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
                  <Button
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                    onClick={fetchDashboardStats}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-gray-400">No activity yet.</p>
                  ) : (
                    recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 hover:bg-gray-800/50 rounded-lg transition-colors"
                      >
                        <div className="p-2 bg-gray-800 rounded-lg mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white mb-1">{activity.message}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-gray-900 border-gray-800 mb-8">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-yellow-400 mb-6">
                Quick Actions
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  asChild
                  className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-black font-semibold h-auto py-4"
                >
                  <Link to="/catalogue" className="flex flex-col items-center">
                    <PlusCircle className="w-6 h-6 mb-2" />
                    <span>Add Product</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white h-auto py-4"
                >
                  <Link to="/factories" className="flex flex-col items-center">
                    <Factory className="w-6 h-6 mb-2" />
                    <span>Add Factory</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white h-auto py-4"
                >
                  <Link to="/orders" className="flex flex-col items-center">
                    <ShoppingCart className="w-6 h-6 mb-2" />
                    <span>View Orders</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white h-auto py-4"
                >
                  <Link to="/profile" className="flex flex-col items-center">
                    <User className="w-6 h-6 mb-2" />
                    <span>Edit Profile</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Performance Summary (static UI) */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-yellow-400 mb-6">
                Performance Summary
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Monthly Target</span>
                    <span className="text-white font-semibold">₹5,00,000</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full w-3/4" />
                  </div>
                  <p className="text-sm text-gray-400">75% achieved</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Order Fulfillment Rate</span>
                    <span className="text-white font-semibold">98%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full w-11/12" />
                  </div>
                  <p className="text-sm text-gray-400">Excellent performance</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Customer Satisfaction</span>
                    <span className="text-white font-semibold">4.8/5</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full w-9/10" />
                  </div>
                  <p className="text-sm text-gray-400">Based on 45 reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Dashboard;
