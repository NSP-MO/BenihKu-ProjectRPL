"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"; // Added import
import { Leaf, Package, LogOut, BarChart3, Settings, ShoppingBag, ArrowLeft } from "lucide-react"
import { format } from "date-fns"


import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { OrderWithItems, OrderStatus } from "@/lib/orders"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setIsLoading(true)
      try {
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", params.id)
          .single()

        if (orderError) {
          console.error(`Error fetching order with id ${params.id}:`, orderError)
          // It's possible the order doesn't exist or user doesn't have permission (if RLS is strict)
          // Redirect or show an error message. For now, we'll let it proceed to render "Pesanan tidak ditemukan".
          setOrder(null);
          return
        }

        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", params.id)

        if (itemsError) {
          console.error(`Error fetching items for order ${params.id}:`, itemsError)
          // Handle appropriately, maybe set order to null or show partial data
          setOrder(null); // Or setOrder({ ...orderData, items: [] }) if you want to show order info without items
          return
        }

        const itemsWithImages = await Promise.all(
          itemsData.map(async (item) => {
            try {
              const { data: productData, error: productError } = await supabase
                .from("products")
                .select("image, image_path") 
                .eq("id", item.product_id)
                .single()

              if (productError || !productData) {
                return { ...item, product_image: "/placeholder.svg" }
              }
              
              return {
                ...item,
                product_image: productData.image || productData.image_path || "/placeholder.svg",
              }
            } catch (error) {
              console.error(`Error fetching product for item ${item.id}:`, error)
              return { ...item, product_image: "/placeholder.svg" }
            }
          }),
        )

        setOrder({
          ...orderData,
          items: itemsWithImages,
        })
      } catch (error) {
        console.error(`Error fetching order with id ${params.id}:`, error)
        setOrder(null); // Set order to null on any critical error
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) { // Ensure params.id is available
        fetchOrderDetails()
    } else {
        setIsLoading(false);
        // Handle case where id is not present, perhaps redirect or show error
        router.push('/admin/orders'); 
    }
  }, [params.id, router]) // Added router to dependency array

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)

      if (error) {
        console.error(`Error updating status for order ${order.id}:`, error)
        toast({
          title: "Error",
          description: `Failed to update order status: ${error.message}`,
          variant: "destructive",
        })
        return
      }

      setOrder({
        ...order,
        status: newStatus as OrderStatus,
        updated_at: new Date().toISOString(),
      })

      toast({
        title: "Success",
        description: "Order status updated successfully",
      })
    } catch (error: any) {
      console.error(`Error updating status for order ${order.id}:`, error)
      toast({
        title: "Error",
        description: `Failed to update order status: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusBadgeColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }
  
  const adminNavLinks = [
    { href: "/admin/dashboard", label: "Produk", icon: Package },
    { href: "/admin/orders", label: "Pesanan", icon: ShoppingBag },
    { href: "/admin/analytics", label: "Analitik", icon: BarChart3 },
    { href: "/admin/settings", label: "Pengaturan", icon: Settings },
  ];


  return (
    <ProtectedRoute adminOnly>
      <div className="flex min-h-screen">
        {/* Sidebar */}
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
                // Corrected isActive condition for /admin/orders and its children
                const isActive = router.pathname === link.href || (link.href === "/admin/orders" && router.pathname?.startsWith("/admin/orders"));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground transition-all ${
                        isActive ? "bg-accent text-accent-foreground" : ""
                    }`}
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
              className="w-full justify-start text-muted-foreground hover:text-foreground mt-2"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b dark:border-gray-800 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
            {/* Mobile Header: Back Button and Title */}
            <div className="flex items-center gap-2 md:hidden">
              <Button variant="ghost" size="icon" onClick={() => router.push('/admin/orders')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Detail Pesanan</h1>
            </div>

            {/* Desktop: Hidden placeholder or can be used for breadcrumbs later if needed */}
            <div className="hidden md:flex flex-1">
              {/* This space is intentionally left for the title that will be shown in <main> for desktop */}
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              <ThemeToggle />
              {user && (
                <Button variant="ghost" size="icon" className="md:hidden" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Keluar</span>
                </Button>
              )}
            </div>
          </header>
          <main className="grid flex-1 items-start gap-4 p-4 md:gap-8 md:p-8">
            {/* Desktop Back Button and Title */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/admin/orders">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Detail Pesanan</h1>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : !order ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Pesanan tidak ditemukan.</p>
                 <Link href="/admin/orders">
                    <Button variant="outline" className="mt-4">Kembali ke Daftar Pesanan</Button>
                 </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Informasi Pesanan</CardTitle>
                    <CardDescription>Detail pesanan dan status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">ID Pesanan</p>
                        <p className="font-mono text-sm">{order.id}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tanggal</p>
                        <p>{format(new Date(order.created_at), "dd MMM yyyy HH:mm")}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">ID Pelanggan</p>
                        <p className="font-mono text-sm">{order.user_id}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total</p>
                        <p className="font-medium">Rp {order.total_amount.toLocaleString("id-ID")}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Status Pesanan</p>
                      <Select value={order.status} onValueChange={handleStatusChange} disabled={isUpdating}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {order.shipping_address && typeof order.shipping_address === 'object' && ( // Check if shipping_address is an object
                  <Card>
                    <CardHeader>
                      <CardTitle>Alamat Pengiriman</CardTitle>
                      <CardDescription>Detail alamat pengiriman</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="font-medium">{(order.shipping_address as any).name}</p>
                      <p>{(order.shipping_address as any).address}</p>
                      <p>
                        {(order.shipping_address as any).city}, {(order.shipping_address as any).postal_code}
                      </p>
                      <p>{(order.shipping_address as any).country}</p>
                      <p className="font-medium mt-2">{(order.shipping_address as any).phone}</p>
                    </CardContent>
                  </Card>
                )}


                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Item Pesanan</CardTitle>
                    <CardDescription>Daftar produk dalam pesanan ini</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border dark:border-gray-800">
                      <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                          <thead className="[&_tr]:border-b dark:border-gray-800">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted dark:border-gray-800">
                              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                Produk
                              </th>
                              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                Harga
                              </th>
                              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                Jumlah
                              </th>
                              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                Subtotal
                              </th>
                            </tr>
                          </thead>
                          <tbody className="[&_tr:last-child]:border-0">
                            {order.items.map((item) => (
                              <tr
                                key={item.id}
                                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted dark:border-gray-800"
                              >
                                <td className="p-4 align-middle">
                                  <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 relative rounded overflow-hidden">
                                      <Image
                                        src={item.product_image || "/placeholder.svg"}
                                        alt={item.product_name}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                    <div>
                                      <p className="font-medium">{item.product_name}</p>
                                      <p className="text-xs text-muted-foreground">ID: {item.product_id}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 align-middle">Rp {item.price.toLocaleString("id-ID")}</td>
                                <td className="p-4 align-middle">{item.quantity}</td>
                                <td className="p-4 align-middle font-medium">
                                  Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div></div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Pesanan</p>
                      <p className="text-xl font-bold">Rp {order.total_amount.toLocaleString("id-ID")}</p>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
