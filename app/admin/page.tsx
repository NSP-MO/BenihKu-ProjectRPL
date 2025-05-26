"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image";
import { Leaf, Plus, Settings, Package, LogOut, BarChart3, ShoppingBag, Search, Menu, X } from "lucide-react" 

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet" 
import { Separator } from "@/components/ui/separator"


interface Product {
  id: number
  name: string
  price: number
  category: string
  is_popular: boolean
  stock: number
  status?: string
  is_published?: boolean
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, category, is_popular, stock, is_published")
        .order("id", { ascending: true })

      if (error) {
        console.error("Error fetching products:", error)
        return
      }

      const productsWithStatus = data.map((product) => ({
        ...product,
        status: product.is_published ? "published" : "draft",
      }))
      setProducts(productsWithStatus)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePopular = async (id: number, currentStatus: boolean) => {
    const newStatus = !currentStatus
    try {
      setProducts(products.map((p) => (p.id === id ? { ...p, is_popular: newStatus } : p)))
      const { error } = await supabase.from("products").update({ is_popular: newStatus }).eq("id", id)
      if (error) {
        setProducts(products.map((p) => (p.id === id ? { ...p, is_popular: currentStatus } : p)))
        throw error
      }
    } catch (err) {
      console.error("Error toggling popular status:", err)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const adminNavLinks = [
    { href: "/admin/dashboard", label: "Produk", icon: Package },
    { href: "/admin/orders", label: "Pesanan", icon: ShoppingBag },
    { href: "/admin/analytics", label: "Analitik", icon: BarChart3 },
    { href: "/admin/settings", label: "Pengaturan", icon: Settings },
  ];

  return (
    <ProtectedRoute adminOnly>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-64 flex-col bg-background border-r dark:border-gray-800">
          <div className="flex h-16 items-center border-b dark:border-gray-800 px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Leaf className="h-6 w-6 text-green-600 dark:text-green-500" />
              <span className="text-xl">BenihKu</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              {adminNavLinks.map(link => {
                const Icon = link.icon;
                // Check if current path is exactly the link href or if it's the base admin path for "Produk"
                const isActive = router.pathname === link.href || (link.href === "/admin/dashboard" && router.pathname === "/admin");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground transition-all ${
                        isActive ? "bg-accent text-accent-foreground" : ""
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
               })}
            </nav>
          </div>
          <div className="border-t dark:border-gray-800 p-4">
            {user && (
                <div className="flex items-center gap-3 rounded-lg px-3 py-2 mb-2">
                  {user.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url as string}
                      alt={user.user_metadata.name || user.email || "User Avatar"}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          {(user.user_metadata?.name || user.email || "A").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                    <div>
                    <p className="text-sm font-medium truncate max-w-[150px]">{user.user_metadata?.name || user.email}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</p>
                    </div>
                </div>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Mobile and Desktop Header */}
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b dark:border-gray-800 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
            {/* Left side of header: Mobile Menu Trigger or empty for desktop */}
            <div className="flex items-center">
              <div className="md:hidden">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">Buka Menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[260px] p-0">
                    <SheetHeader className="p-4 border-b dark:border-gray-800">
                      <SheetTitle>
                          <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                              <Leaf className="h-6 w-6 text-green-600 dark:text-green-500" />
                              <span className="text-xl">BenihKu Admin</span>
                          </Link>
                      </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-auto py-2 p-4">
                      <nav className="grid items-start text-sm font-medium gap-1">
                       {adminNavLinks.map(link => {
                        const Icon = link.icon;
                        const isActive = router.pathname === link.href || (link.href === "/admin/dashboard" && router.pathname === "/admin");
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground transition-all ${
                                isActive ? "bg-accent text-accent-foreground" : ""
                            }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Icon className="h-4 w-4" />
                            {link.label}
                          </Link>
                        );
                       })}
                      </nav>
                    </div>
                    <Separator className="my-2" />
                     <div className="p-4 border-t dark:border-gray-800">
                          {user && (
                              <div className="flex items-center gap-3 rounded-lg px-3 py-2 mb-2">
                                {user.user_metadata?.avatar_url ? (
                                  <Image
                                    src={user.user_metadata.avatar_url as string}
                                    alt={user.user_metadata.name || user.email || "User Avatar"}
                                    width={32}
                                    height={32}
                                    className="rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                        {(user.user_metadata?.name || user.email || "A").charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                  <div>
                                  <p className="text-sm font-medium truncate max-w-[150px]">{user.user_metadata?.name || user.email}</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</p>
                                  </div>
                              </div>
                          )}
                          <Button
                          variant="ghost"
                          className="w-full justify-start text-muted-foreground hover:text-foreground"
                          onClick={() => {
                              handleLogout();
                              setIsMobileMenuOpen(false);
                          }}
                          >
                          <LogOut className="mr-2 h-4 w-4" />
                          Keluar
                          </Button>
                      </div>
                  </SheetContent>
                </Sheet>
              </div>
              {/* Title for mobile - can be dynamic based on page if needed, but for main dashboard, title is in <main> */}
              {/* <h1 className="text-lg font-semibold ml-2 md:hidden">Produk</h1> */}
            </div>
            
            {/* Right side of header: ThemeToggle */}
            <div className="flex items-center gap-2 md:gap-4">
              <ThemeToggle />
            </div>
          </header>
          <main className="grid flex-1 items-start gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Manajemen Produk</h1>
              <Link href="/admin/products/add">
                <Button className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Produk
                </Button>
              </Link>
            </div>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Cari produk..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3"> 
                <TabsTrigger value="all">Semua Produk</TabsTrigger>
                <TabsTrigger value="published">Dipublikasikan</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                <ProductsTable products={filteredProducts} isLoading={isLoading} togglePopular={togglePopular} />
              </TabsContent>
              <TabsContent value="published" className="mt-4">
                <ProductsTable
                  products={filteredProducts.filter((p) => p.status === "published")}
                  isLoading={isLoading}
                  togglePopular={togglePopular}
                />
              </TabsContent>
              <TabsContent value="draft" className="mt-4">
                <ProductsTable
                  products={filteredProducts.filter((p) => p.status === "draft")}
                  isLoading={isLoading}
                  togglePopular={togglePopular}
                />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

interface ProductsTableProps {
  products: Product[]
  isLoading: boolean
  togglePopular: (id: number, currentStatus: boolean) => void // Changed from toggleHomepageDisplay
}

function ProductsTable({ products, isLoading, togglePopular }: ProductsTableProps) { // Renamed prop
  const router = useRouter()
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Tidak ada produk yang ditemukan.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border dark:border-gray-800">
      <div className="relative w-full overflow-auto"> 
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b dark:border-gray-800">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted dark:border-gray-800">
              <th className="h-12 px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground w-[60px] sm:w-[80px]">ID</th>
              <th className="h-12 px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground">Nama Produk</th>
              <th className="h-12 px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground hidden sm:table-cell">Kategori</th>
              <th className="h-12 px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground">Harga</th>
              <th className="h-12 px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Stok</th>
              <th className="h-12 px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
              <th className="h-12 px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground">Populer</th>
              <th className="h-12 px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground w-[80px] sm:w-[100px]">Aksi</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {products.map((product) => (
              <tr
                key={product.id}
                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted dark:border-gray-800"
              >
                <td className="p-2 sm:p-4 align-middle">{product.id}</td>
                <td className="p-2 sm:p-4 align-middle font-medium">{product.name}</td>
                <td className="p-2 sm:p-4 align-middle hidden sm:table-cell">{product.category}</td>
                <td className="p-2 sm:p-4 align-middle">Rp {product.price.toLocaleString("id-ID")}</td>
                <td className="p-2 sm:p-4 align-middle hidden md:table-cell">{product.stock}</td>
                <td className="p-2 sm:p-4 align-middle">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 sm:px-2.5 text-xs font-medium ${
                      product.status === "published"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}
                  >
                    {product.status === "published" ? "Publik" : "Draft"}
                  </span>
                </td>
                <td className="p-2 sm:p-4 align-middle text-center">
                  <Badge
                    variant={product.is_popular ? "default" : "outline"}
                    className={`${product.is_popular ? "bg-green-600 text-primary-foreground hover:bg-green-700" : ""} cursor-pointer text-xs px-2 py-0.5`}
                    onClick={() => togglePopular(product.id, product.is_popular)}
                  >
                    {product.is_popular ? "Ya" : "Tidak"}
                  </Badge>
                </td>
                <td className="p-2 sm:p-4 align-middle">
                  <div className="flex justify-center">
                    <Link href={`/admin/products/edit/${product.id}`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
