import type React from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Plus,
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
      <div className="flex justify-between items-center">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
              <DialogDescription>
                Create a new order for a table session
              </DialogDescription>
            </DialogHeader>
            <CreateOrderForm
              onClose={() => setIsCreateDialogOpen(false)}
              itemsData={itemsData}
              createOrderMutation={() => {}}
            />
          </DialogContent>
        </Dialog>
      </div>

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

function CreateOrderForm({
  onClose,
  itemsData,
  createOrderMutation,
}: {
  onClose: () => void;
  itemsData: any[];
  createOrderMutation: any;
}) {
  const [sessionId, setSessionId] = useState("");
  const [selectedItems, setSelectedItems] = useState<
    Array<{ itemId: number; quantity: number }>
  >([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || selectedItems.length === 0) {
      alert("Please fill in all required fields");
      return;
    }

    createOrderMutation.mutate({
      sessionId: Number.parseInt(sessionId),
      items: selectedItems,
    });
  };

  const addItem = (itemId: number) => {
    const existingItem = selectedItems.find((item) => item.itemId === itemId);
    if (existingItem) {
      setSelectedItems(
        selectedItems.map((item) =>
          item.itemId === itemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedItems([...selectedItems, { itemId, quantity: 1 }]);
    }
  };

  const removeItem = (itemId: number) => {
    setSelectedItems(selectedItems.filter((item) => item.itemId !== itemId));
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
    } else {
      setSelectedItems(
        selectedItems.map((item) =>
          item.itemId === itemId ? { ...item, quantity } : item
        )
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="sessionId">Session ID</Label>
        <Input
          id="sessionId"
          type="number"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="Enter session ID"
          required
        />
      </div>

      <div>
        <Label>Items</Label>
        <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
          {itemsData.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 hover:bg-muted rounded"
            >
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-muted-foreground">
                  {item.category?.name} • ${item.price?.toFixed(2)}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => addItem(item.id)}
                variant="outline"
              >
                Add
              </Button>
            </div>
          ))}
        </div>
      </div>

      {selectedItems.length > 0 && (
        <div>
          <Label>Selected Items</Label>
          <div className="space-y-2 border rounded-md p-2">
            {selectedItems.map((selectedItem) => {
              const item = itemsData.find((i) => i.id === selectedItem.itemId);
              return (
                <div
                  key={selectedItem.itemId}
                  className="flex items-center justify-between"
                >
                  <span>{item?.name}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateQuantity(
                          selectedItem.itemId,
                          selectedItem.quantity - 1
                        )
                      }
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">
                      {selectedItem.quantity}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateQuantity(
                          selectedItem.itemId,
                          selectedItem.quantity + 1
                        )
                      }
                    >
                      +
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeItem(selectedItem.itemId)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={createOrderMutation.isPending}>
          {createOrderMutation.isPending ? "Creating..." : "Create Order"}
        </Button>
      </div>
    </form>
  );
}
