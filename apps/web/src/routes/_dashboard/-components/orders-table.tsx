import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
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
  Calendar,
  CalendarDays,
  Filter,
  Search,
  Download,
  RefreshCw,
  Users,
  Clock,
  DollarSign,
} from "lucide-react";
import { format, isAfter, isBefore, isEqual, parseISO } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface OrdersTableProps {
  className?: string;
}

type OrderStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export function OrdersTable({ className }: OrdersTableProps) {
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const orders = useQuery(trpc.order.getAll.queryOptions());

  // Filter orders based on date range and search
  const filteredOrders = useMemo(() => {
    if (!orders.data) return [];

    let filtered = orders.data;

    // Date filtering
    if (fromDate || toDate) {
      filtered = filtered.filter((order) => {
        const orderDate = parseISO(order.createdAt);

        if (fromDate && toDate) {
          const from = parseISO(fromDate);
          const to = parseISO(toDate);
          return (
            (isAfter(orderDate, from) || isEqual(orderDate, from)) &&
            (isBefore(orderDate, to) || isEqual(orderDate, to))
          );
        } else if (fromDate) {
          const from = parseISO(fromDate);
          return isAfter(orderDate, from) || isEqual(orderDate, from);
        } else if (toDate) {
          const to = parseISO(toDate);
          return isBefore(orderDate, to) || isEqual(orderDate, to);
        }

        return true;
      });
    }

    // Search filtering
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.id.toString().includes(searchQuery) ||
          order.session?.table?.tableNumber.toString().includes(searchQuery) ||
          order.session?.customerName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          order.orderItems?.some((item) =>
            item.item?.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders.data, fromDate, toDate, statusFilter, searchQuery]);

  const getStatusBadge = (status: OrderStatus) => {
    const variants = {
      PENDING: "outline",
      IN_PROGRESS: "secondary",
      COMPLETED: "default",
      CANCELLED: "destructive",
    } as const;

    const colors = {
      PENDING: "text-yellow-600",
      IN_PROGRESS: "text-blue-600",
      COMPLETED: "text-green-600",
      CANCELLED: "text-red-600",
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.toLowerCase().replace("_", " ")}
      </Badge>
    );
  };

  const calculateOrderTotal = (orderItems: any[]) => {
    return (
      orderItems?.reduce((total, item) => {
        return total + (item.item?.price || 0) * item.quantity;
      }, 0) || 0
    );
  };

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setStatusFilter("ALL");
    setSearchQuery("");
  };

  const exportOrders = () => {
    // Simple CSV export functionality
    const csvContent = [
      [
        "Order ID",
        "Table",
        "Customer",
        "Items",
        "Status",
        "Total",
        "Date",
      ].join(","),
      ...filteredOrders.map((order) =>
        [
          order.id,
          order.session?.table?.tableNumber || "N/A",
          order.session?.customerName || "Walk-in",
          order.orderItems?.length || 0,
          order.status,
          `$${calculateOrderTotal(order.orderItems || []).toFixed(2)}`,
          format(parseISO(order.createdAt), "yyyy-MM-dd HH:mm"),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="border-0 bg-white/60 shadow-lg backdrop-blur-sm dark:bg-slate-800/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Orders Management
              </CardTitle>
              <CardDescription>
                View and manage all restaurant orders
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => orders.refetch()}
                disabled={orders.isLoading}
                className="bg-white/60 backdrop-blur-sm border-0 shadow-lg"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    orders.isLoading ? "animate-spin" : ""
                  }`}
                />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportOrders}
                disabled={filteredOrders.length === 0}
                className="bg-white/60 backdrop-blur-sm border-0 shadow-lg"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card className="border-0 bg-white/60 shadow-lg backdrop-blur-sm dark:bg-slate-800/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="pl-10 bg-white/60 backdrop-blur-sm border-0 shadow-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="pl-10 bg-white/60 backdrop-blur-sm border-0 shadow-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as OrderStatus | "ALL")
                }
              >
                <SelectTrigger className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Order ID, table, customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/60 backdrop-blur-sm border-0 shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                Showing {filteredOrders.length} of {orders.data?.length || 0}{" "}
                orders
              </span>
              {(fromDate ||
                toDate ||
                statusFilter !== "ALL" ||
                searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="bg-transparent"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border-0 bg-white/60 shadow-lg backdrop-blur-sm dark:bg-slate-800/60">
        <CardContent className="p-0">
          {orders.isLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {orders.data?.length === 0
                  ? "No orders have been placed yet."
                  : "No orders match your current filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Order ID</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const total = calculateOrderTotal(order.orderItems || []);
                    return (
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          #{order.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            Table {order.session?.table?.tableNumber || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.session?.customerName || (
                            <span className="text-muted-foreground">
                              Walk-in
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {order.orderItems?.length || 0} items
                            </div>
                            {order.orderItems &&
                              order.orderItems.length > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {order.orderItems
                                    .slice(0, 2)
                                    .map((item, index) => (
                                      <div key={index}>
                                        {item.quantity}× {item.item?.name}
                                      </div>
                                    ))}
                                  {order.orderItems.length > 2 && (
                                    <div>
                                      +{order.orderItems.length - 2} more
                                    </div>
                                  )}
                                </div>
                              )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-medium text-green-600">
                            <DollarSign className="h-3 w-3" />
                            {total.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {format(
                                parseISO(order.createdAt),
                                "MMM dd, yyyy"
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(parseISO(order.createdAt), "HH:mm")}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {filteredOrders.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 bg-white/60 shadow-lg backdrop-blur-sm dark:bg-slate-800/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{filteredOrders.length}</p>
                </div>
                <CalendarDays className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/60 shadow-lg backdrop-blur-sm dark:bg-slate-800/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    $
                    {filteredOrders
                      .reduce(
                        (sum, order) =>
                          sum + calculateOrderTotal(order.orderItems || []),
                        0
                      )
                      .toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/60 shadow-lg backdrop-blur-sm dark:bg-slate-800/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {
                      filteredOrders.filter(
                        (order) => order.status === "COMPLETED"
                      ).length
                    }
                  </p>
                </div>
                <Badge
                  variant="default"
                  className="h-8 w-8 rounded-full p-0 flex items-center justify-center"
                >
                  ✓
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/60 shadow-lg backdrop-blur-sm dark:bg-slate-800/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {
                      filteredOrders.filter(
                        (order) =>
                          order.status === "PENDING" ||
                          order.status === "IN_PROGRESS"
                      ).length
                    }
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
