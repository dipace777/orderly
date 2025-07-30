import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  Package,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { trpc } from "@/utils/trpc";

export function OrdersView() {
  // Fetch real data using tRPC
  const orders = useQuery(trpc.order.getAll.queryOptions());
  const items = useQuery(trpc.item.getAll.queryOptions());

  const deleteOrderOptions = trpc.order.delete.mutationOptions({
    onSuccess: () => {
      orders.refetch();
    },
    onError: (error) => {
      console.error("Failed to delete order:", error);
    },
  });

  const deleteOrderMutation = useMutation(deleteOrderOptions);

  const deleteOrder = async (id: number) => {
    const x = await deleteOrderMutation.mutateAsync({ id });
  };

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Add loading and error states
  if (orders.isLoading || items.isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading orders...</div>
        </div>
      </div>
    );
  }

  if (orders.error || items.error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">
            Error loading data. Please try again.
          </div>
        </div>
      </div>
    );
  }

  const itemsData = items.data || [];

  return (
    <div className="p-6 space-y-6">
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>
                Complete list of all orders with their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.data &&
                    orders.data.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          #{order.id}
                        </TableCell>
                        <TableCell>
                          {order.session?.table?.tableNumber || "N/A"}
                        </TableCell>
                        <TableCell>
                          {order.orderItems?.length || 0} items
                        </TableCell>
                        <TableCell>${order.id}</TableCell>
                        <TableCell>
                          <p>{order.status} </p>
                        </TableCell>
                        <TableCell>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                              // onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {}}>
                                <Edit className="mr-2 h-4 w-4" />
                                Mark Confirmed
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {}}>
                                <Package className="mr-2 h-4 w-4" />
                                Mark Preparing
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {}}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark Ready
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => deleteOrder(order.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
