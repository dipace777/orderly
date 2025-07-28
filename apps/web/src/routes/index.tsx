import { createFileRoute } from "@tanstack/react-router"
import { trpc } from "@/utils/trpc"
import { useQuery } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Grid, List, DollarSign, Package } from "lucide-react"

export const Route = createFileRoute("/")({
  component: HomeComponent,
})

function HomeComponent() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const categories = useQuery(trpc.category.getAll.queryOptions())
  const items = useQuery(trpc.item.getAll.queryOptions(selectedCategory ? { categoryId: selectedCategory } : undefined))

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

  const handleCategoryFilter = (categoryId: number | null) => {
    setSelectedCategory(categoryId)
    setSearchQuery("") // Clear search when changing category
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
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">Menu & Items</p>
          </div>
        </div>

        {/* Search and Controls */}
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
              {filteredItems.map((item) => (
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

                  {item.description && (
                    <CardContent className={`pt-0 ${viewMode === "list" ? "flex-1" : ""}`}>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
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
