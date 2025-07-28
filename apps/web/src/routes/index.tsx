import { createFileRoute } from "@tanstack/react-router"
import { trpc } from "@/utils/trpc"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

import {
  Search,
  Filter,
  Grid,
  List,
  DollarSign,
  Package,
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  Users,
  Check,
} from "lucide-react"
import { toast } from "sonner"

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  category?: string
}

export const Route = createFileRoute("/")({
  component: HomeComponent,
})

function HomeComponent() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)

  const queryClient = useQueryClient()

  const categories = useQuery(trpc.category.getAll.queryOptions())
  const items = useQuery(trpc.item.getAll.queryOptions(selectedCategory ? { categoryId: selectedCategory } : undefined))
  const tables = useQuery(trpc.table.getAll.queryOptions())

  // // Mutations
  // const startSession = useMutation({
  //   mutationFn: trpc.tableSession.start.mutationFn,
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["tables"] })
  //   },
  // })

  const createOrder = useMutation({
    mutationFn: trpc.order.create.mutationFn,
    onSuccess: () => {
      setCart([])
      setIsCartOpen(false)
      // toast({
      //   title: "Order placed successfully!",
      //   description: "Your order has been sent to the kitchen.",
      // })
      queryClient.invalidateQueries({ queryKey: ["orders"] })
    },
    onError: () => {
      // toast({
      //   title: "Error placing order",
      //   description: "Please try again.",
      //   variant: "destructive",
      // })
    },
  })

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!items.data) return []

    return items.data.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [items.data, searchQuery])

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0)

  const handleCategoryFilter = (categoryId: number | null) => {
    setSelectedCategory(categoryId)
    setSearchQuery("")
  }

  const addToCart = (item: any) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id)
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        )
      }
      return [
        ...prevCart,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          category: item.category?.name,
        },
      ]
    })
    // toast({
    //   title: "Added to cart",
    //   description: `${item.name} has been added to your cart.`,
    // })
  }

  const updateCartItemQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    setCart((prevCart) => prevCart.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  const removeFromCart = (id: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id))
  }

  const clearCart = () => {
    setCart([])
  }

  const handlePlaceOrder = async () => {
    if (!selectedTable) {
      // toast({
      //   title: "Please select a table",
      //   description: "You need to select a table before placing an order.",
      //   variant: "destructive",
      // })
      return
    }

    if (cart.length === 0) {
      // toast({
      //   title: "Cart is empty",
      //   description: "Please add items to your cart before placing an order.",
      //   variant: "destructive",
      // })
      return
    }

    try {
      // Find or create active session for the table
      const selectedTableData = tables.data?.find((table) => table.id === selectedTable)
      let sessionId = selectedTableData?.sessions?.[0]?.id

      // if (!sessionId) {
      //   // Start a new session
      //   const session = await startSession.mutateAsync({
      //     tableId: selectedTable,
      //     customerName: "Walk-in Customer",
      //   })
      //   sessionId = session.id
      // }

      // // Create the order
      // await createOrder.mutateAsync({
      //   sessionId: sessionId,
      //   items: cart.map((item) => ({
      //     itemId: item.id,
      //     quantity: item.quantity,
      //   })),
      // })
    } catch (error) {
      console.error("Error placing order:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-block rounded-lg bg-white/80 px-6 py-4 shadow-lg backdrop-blur-sm dark:bg-slate-800/80">
            <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl lg:text-4xl">
              BETTER STACK
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">Menu & Ordering</p>
          </div>
        </div>

        {/* Search, Controls, and Cart */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/60 backdrop-blur-sm border-0 shadow-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="bg-white/60 backdrop-blur-sm border-0 shadow-lg"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="bg-white/60 backdrop-blur-sm border-0 shadow-lg"
            >
              <List className="h-4 w-4" />
            </Button>

            {/* Cart Button */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button className="relative bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                  <ShoppingCart className="h-4 w-4" />
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Your Order</SheetTitle>
                  <SheetDescription>Review your items and place your order</SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  {/* Table Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Table</label>
                    <Select
                      value={selectedTable?.toString()}
                      onValueChange={(value:any) => setSelectedTable(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a table" />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.data?.map((table) => (
                          <SelectItem key={table.id} value={table.id.toString()}>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Table {table.tableNumber}
                              {table.sessions && table.sessions.length > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                  Active
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Cart Items */}
                  <div className="flex-1 space-y-4 max-h-96 overflow-y-auto">
                    {cart.length === 0 ? (
                      <div className="text-center py-8">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Your cart is empty</p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                            <p className="text-sm font-medium">${item.price.toFixed(2)} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {cart.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total:</span>
                          <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={clearCart} className="flex-1 bg-transparent">
                            Clear Cart
                          </Button>
                          <Button
                            onClick={handlePlaceOrder}
                            className="flex-1"
                            disabled={createOrder.isPending || !selectedTable}
                          >
                            {createOrder.isPending ? (
                              "Placing Order..."
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Place Order
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filter by category:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryFilter(null)}
              className="bg-white/60 backdrop-blur-sm border-0 shadow-lg"
            >
              All Items
              {!selectedCategory && (
                <Badge variant="secondary" className="ml-2">
                  {items.data?.length || 0}
                </Badge>
              )}
            </Button>

            {categories.isLoading ? (
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-8 w-20 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : (
              categories.data?.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryFilter(category.id)}
                  className="bg-white/60 backdrop-blur-sm border-0 shadow-lg"
                >
                  {category.name}
                  <Badge variant="secondary" className="ml-2">
                    {category.items?.length || 0}
                  </Badge>
                </Button>
              ))
            )}
          </div>
        </div>

        {/* Items Display */}
        {items.isLoading ? (
          <div
            className={`grid gap-4 ${viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}
          >
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="border-0 bg-white/60 shadow-lg backdrop-blur-sm dark:bg-slate-800/60">
                <CardHeader>
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="h-3 w-full animate-pulse rounded bg-muted mb-2" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
                {selectedCategory && categories.data && (
                  <span> in {categories.data.find((c) => c.id === selectedCategory)?.name}</span>
                )}
                {searchQuery && <span> matching "{searchQuery}"</span>}
              </p>
            </div>

            <div
              className={`grid gap-4 ${
                viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
              }`}
            >
              {filteredItems.map((item) => {
                const cartItem = cart.find((cartItem) => cartItem.id === item.id)
                return (
                  <Card
                    key={item.id}
                    className={`border-0 bg-white/60 shadow-lg backdrop-blur-sm dark:bg-slate-800/60 hover:shadow-xl transition-all duration-200 hover:scale-[1.02] ${
                      viewMode === "list" ? "flex-row" : ""
                    }`}
                  >
                    <CardHeader className={viewMode === "list" ? "flex-1" : ""}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Package className="h-3 w-3" />
                            {item.category?.name}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                          <DollarSign className="h-4 w-4" />
                          {item.price.toFixed(2)}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className={`pt-0 ${viewMode === "list" ? "flex-1" : ""}`}>
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{item.description}</p>
                      )}

                      <div className="flex items-center justify-between">
                        {cartItem ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartItemQuantity(item.id, cartItem.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">{cartItem.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartItemQuantity(item.id, cartItem.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button onClick={() => addToCart(item)} size="sm" className="flex items-center gap-2">
                            <Plus className="h-3 w-3" />
                            Add to Cart
                          </Button>
                        )}

                        {cartItem && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No items found</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? `No items match "${searchQuery}"`
                : selectedCategory
                  ? "No items in this category"
                  : "No items available"}
            </p>
            {(searchQuery || selectedCategory) && (
              <Button
                variant="outline"
                className="mt-4 bg-transparent"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory(null)
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default HomeComponent
