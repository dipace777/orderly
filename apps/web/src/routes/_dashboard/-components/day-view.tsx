import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/utils/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Calendar,
  Target,
  Activity,
  Utensils,
  Timer,
  Star,
} from "lucide-react";
import { format, startOfDay, endOfDay, isToday, parseISO } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface DashboardProps {
  className?: string;
}

type OrderStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export function DayView({ className }: DashboardProps) {
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch data
  const orders = useQuery(trpc.order.getAll.queryOptions());
  const tables = useQuery(trpc.table.getAll.queryOptions());
  const categories = useQuery(trpc.category.getAll.queryOptions());
  const items = useQuery(trpc.item.getAll.queryOptions());

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      orders.refetch();
      tables.refetch();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, orders, tables]);

  // Today's data filtering
  const todaysData = useMemo(() => {
    if (!orders.data) return null;

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const todaysOrders = orders.data.filter((order) => {
      const orderDate = parseISO(order.createdAt);
      return orderDate >= todayStart && orderDate <= todayEnd;
    });

    // Calculate metrics
    const totalRevenue = todaysOrders.reduce((sum, order) => {
      return (
        sum +
        (order.orderItems?.reduce((itemSum, item) => {
          return itemSum + (item.item?.price || 0) * item.quantity;
        }, 0) || 0)
      );
    }, 0);

    const avgOrderValue =
      todaysOrders.length > 0 ? totalRevenue / todaysOrders.length : 0;

    const ordersByStatus = todaysOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);

    const ordersByHour = Array.from({ length: 24 }, (_, hour) => {
      const hourOrders = todaysOrders.filter((order) => {
        return new Date(order.createdAt).getHours() === hour;
      });
      return {
        hour: `${hour.toString().padStart(2, "0")}:00`,
        orders: hourOrders.length,
        revenue: hourOrders.reduce((sum, order) => {
          return (
            sum +
            (order.orderItems?.reduce((itemSum, item) => {
              return itemSum + (item.item?.price || 0) * item.quantity;
            }, 0) || 0)
          );
        }, 0),
      };
    });

    // Most popular items
    const itemCounts = todaysOrders.reduce((acc, order) => {
      order.orderItems?.forEach((orderItem) => {
        const itemName = orderItem.item?.name || "Unknown";
        acc[itemName] = (acc[itemName] || 0) + orderItem.quantity;
      });
      return acc;
    }, {} as Record<string, number>);

    const popularItems = Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));

    // Active tables
    const activeTables =
      tables.data?.filter((table) => {
        return table.sessions?.some((session) => !session.endTime);
      }) || [];

    // Peak hours
    const peakHour = ordersByHour.reduce((peak, current) =>
      current.orders > peak.orders ? current : peak
    );

    return {
      orders: todaysOrders,
      totalOrders: todaysOrders.length,
      totalRevenue,
      avgOrderValue,
      ordersByStatus,
      ordersByHour: ordersByHour.filter((h) => h.orders > 0),
      popularItems,
      activeTables: activeTables.length,
      totalTables: tables.data?.length || 0,
      peakHour,
      completionRate:
        todaysOrders.length > 0
          ? ((ordersByStatus.COMPLETED || 0) / todaysOrders.length) * 100
          : 0,
    };
  }, [orders.data, tables.data]);

  const getStatusColor = (status: OrderStatus) => {
    const colors = {
      PENDING: "text-yellow-600 bg-yellow-100",
      IN_PROGRESS: "text-blue-600 bg-blue-100",
      COMPLETED: "text-green-600 bg-green-100",
      CANCELLED: "text-red-600 bg-red-100",
    };
    return colors[status];
  };

  const pieChartData = todaysData
    ? [
        {
          name: "Completed",
          value: todaysData.ordersByStatus.COMPLETED || 0,
          color: "#22c55e",
        },
        {
          name: "In Progress",
          value: todaysData.ordersByStatus.IN_PROGRESS || 0,
          color: "#3b82f6",
        },
        {
          name: "Pending",
          value: todaysData.ordersByStatus.PENDING || 0,
          color: "#eab308",
        },
        {
          name: "Cancelled",
          value: todaysData.ordersByStatus.CANCELLED || 0,
          color: "#ef4444",
        },
      ].filter((item) => item.value > 0)
    : [];

  if (orders.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Activity className="h-6 w-6" />
                Today's Operations Dashboard
              </CardTitle>
              <CardDescription className="text-blue-100">
                {format(new Date(), "EEEE, MMMM do, yyyy")} • Real-time
                monitoring
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={refreshInterval.toString()}
                onValueChange={(value) => setRefreshInterval(parseInt(value))}
              >
                <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10s refresh</SelectItem>
                  <SelectItem value="30">30s refresh</SelectItem>
                  <SelectItem value="60">1m refresh</SelectItem>
                  <SelectItem value="300">5m refresh</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={autoRefresh ? "secondary" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    orders.isLoading ? "animate-spin" : ""
                  }`}
                />
                {autoRefresh ? "Auto ON" : "Auto OFF"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <p className="text-3xl font-bold text-green-600">
                  ${todaysData?.totalRevenue.toFixed(2) || "0.00"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: ${todaysData?.avgOrderValue.toFixed(2) || "0.00"} per
                  order
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-3xl font-bold text-blue-600">
                  {todaysData?.totalOrders || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {todaysData?.completionRate.toFixed(1) || 0}% completion rate
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Tables</p>
                <p className="text-3xl font-bold text-purple-600">
                  {todaysData?.activeTables || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  of {todaysData?.totalTables || 0} total tables
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Peak Hour</p>
                <p className="text-3xl font-bold text-orange-600">
                  {todaysData?.peakHour?.hour || "--:--"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {todaysData?.peakHour?.orders || 0} orders
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hourly Orders Chart */}
        <Card className="border-0 shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Hourly Order Volume
            </CardTitle>
            <CardDescription>Orders throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={todaysData?.ordersByHour || []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      value,
                      name === "orders" ? "Orders" : "Revenue",
                    ]}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card className="border-0 shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Order Status Distribution
            </CardTitle>
            <CardDescription>Current order status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Items and Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Popular Items */}
        <Card className="border-0 shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Top Items Today
            </CardTitle>
            <CardDescription>Most ordered items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaysData?.popularItems.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} orders
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{item.quantity}</Badge>
                </div>
              ))}
              {(!todaysData?.popularItems ||
                todaysData.popularItems.length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  No orders yet today
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Status Overview */}
        <Card className="border-0 shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Order Status Overview
            </CardTitle>
            <CardDescription>Current order pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  status: "PENDING" as OrderStatus,
                  icon: Clock,
                  label: "Pending Orders",
                },
                {
                  status: "IN_PROGRESS" as OrderStatus,
                  icon: Timer,
                  label: "In Progress",
                },
                {
                  status: "COMPLETED" as OrderStatus,
                  icon: CheckCircle,
                  label: "Completed",
                },
                {
                  status: "CANCELLED" as OrderStatus,
                  icon: AlertCircle,
                  label: "Cancelled",
                },
              ].map(({ status, icon: Icon, label }) => {
                const count = todaysData?.ordersByStatus[status] || 0;
                const percentage = todaysData?.totalOrders
                  ? (count / todaysData.totalOrders) * 100
                  : 0;

                return (
                  <div
                    key={status}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-5 w-5 ${
                          getStatusColor(status).split(" ")[0]
                        }`}
                      />
                      <div>
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground">
                          {percentage.toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{count}</p>
                      <Progress value={percentage} className="w-16 h-2 mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="border-0 shadow-lg backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Recent Orders
          </CardTitle>
          <CardDescription>Latest order activity</CardDescription>
        </CardHeader>
        <CardContent>
          {todaysData?.orders && todaysData.orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todaysData.orders.slice(0, 10).map((order) => {
                  const total =
                    order.orderItems?.reduce((sum, item) => {
                      return sum + (item.item?.price || 0) * item.quantity;
                    }, 0) || 0;

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>
                        Table {order.session?.table?.tableNumber || "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.session?.customerName || "Walk-in"}
                      </TableCell>
                      <TableCell>
                        {order.orderItems?.length || 0} items
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.toLowerCase().replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(order.createdAt), "HH:mm")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No orders today yet</h3>
              <p className="text-muted-foreground">
                Orders will appear here as they come in
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
