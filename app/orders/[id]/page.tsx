"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, Loader2, Package, Truck, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import Header from "@/components/header"

type OrderItem = {
  id: string
  product_id: string
  order_id: string
  quantity: number
  price: number
  product_name: string
  product_image: string
}

type Order = {
  id: string
  user_id: string
  status: string
  total_amount: number
  created_at: string
  shipping_address: string
  payment_method: string
  items: OrderItem[]
}

export default function OrderDetailsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push("/auth/login?redirect=/orders")
      return
    }

    const fetchOrderDetails = async () => {
      try {
        setLoading(true)

        // Get order details
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select(`
            id, 
            user_id, 
            status, 
            total_amount, 
            created_at,
            shipping_address,
            payment_method
          `)
          .eq("id", orderId)
          .eq("user_id", user.id)
          .single()

        if (orderError) {
          throw orderError
        }

        if (!orderData) {
          router.push("/orders")
          return
        }

        // Get order items
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select(`
            id,
            product_id,
            order_id,
            quantity,
            price,
            product_name
          `)
          .eq("order_id", orderId)

        if (itemsError) {
          throw itemsError
        }

        // Fetch product details for each item
        const itemsWithProductDetails = await Promise.all(
          itemsData.map(async (item) => {
            try {
              // Get product details
              const { data: productData } = await supabase
                .from("products")
                .select("image, image_path, image_url")
                .eq("id", item.product_id)
                .single()

              // Determine the product image
              let productImage = "/placeholder.svg"
              if (productData) {
                if (productData.image_url) {
                  productImage = productData.image_url
                } else if (productData.image_path) {
                  productImage = productData.image_path
                } else if (productData.image) {
                  productImage = productData.image
                }
              }

              return {
                ...item,
                product_image: productImage,
              }
            } catch (err) {
              console.error(`Error fetching product details for product ${item.product_id}:`, err)
              return {
                ...item,
                product_image: "/placeholder.svg",
              }
            }
          }),
        )

        // Set the complete order with items
        setOrder({
          ...orderData,
          items: itemsWithProductDetails,
        })
      } catch (err) {
        console.error("Error fetching order details:", err)
        setError("Gagal memuat detail pesanan. Silakan coba lagi nanti.")
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [user, router, orderId])

  // Function to get the appropriate status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="h-6 w-6 text-yellow-500" />
      case "processing":
        return <Package className="h-6 w-6 text-blue-500" />
      case "shipped":
        return <Truck className="h-6 w-6 text-purple-500" />
      case "delivered":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "cancelled":
        return <AlertCircle className="h-6 w-6 text-red-500" />
      default:
        return <Package className="h-6 w-6 text-gray-500" />
    }
  }

  // Function to get the appropriate badge color based on order status
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
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
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <>
      <Header />
      <main className="container py-8">
        <div className="flex items-center mb-6">
          <Link href="/orders">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Detail Pesanan</h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
            <p className="text-red-800 dark:text-red-300">{error}</p>
            <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
              Coba Lagi
            </Button>
          </div>
        ) : order ? (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Order Summary */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Ringkasan Pesanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">ID Pesanan:</span>
                      <span className="font-medium">{order.id.substring(0, 8)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Tanggal:</span>
                      <span className="font-medium">{formatDate(order.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Status:</span>
                      <Badge className={getStatusBadgeColor(order.status)}>
                        {order.status === "pending"
                          ? "Menunggu Pembayaran"
                          : order.status === "processing"
                            ? "Diproses"
                            : order.status === "shipped"
                              ? "Dikirim"
                              : order.status === "delivered"
                                ? "Terkirim"
                                : order.status === "cancelled"
                                  ? "Dibatalkan"
                                  : order.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Metode Pembayaran:</span>
                      <span className="font-medium">{order.payment_method || "Transfer Bank"}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between font-semibold">
                      <span>Total:</span>
                      <span>{formatCurrency(order.total_amount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Alamat Pengiriman</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300">
                    {order.shipping_address || "Alamat tidak tersedia"}
                  </p>
                </CardContent>
              </Card>

              <div className="mt-6">
                <Link href="/">
                  <Button className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800">
                    Kembali ke Beranda
                  </Button>
                </Link>
              </div>
            </div>

            {/* Order Items */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Item Pesanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 py-3 border-b last:border-0">
                        <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                          {item.product_image ? (
                            <img
                              src={item.product_image || "/placeholder.svg"}
                              alt={item.product_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                              <Package className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/product/${item.product_id}`}>
                            <h4 className="text-base font-medium truncate hover:text-green-600 transition-colors">
                              {item.product_name}
                            </h4>
                          </Link>
                          <div className="flex justify-between mt-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatCurrency(item.price)} x {item.quantity}
                            </span>
                            <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Order Status Timeline */}
              <Card className="mt-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Status Pesanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-4">
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <div className="ml-4">
                        <h4 className="font-medium">
                          {order.status === "pending"
                            ? "Menunggu Pembayaran"
                            : order.status === "processing"
                              ? "Pesanan Diproses"
                              : order.status === "shipped"
                                ? "Pesanan Dikirim"
                                : order.status === "delivered"
                                  ? "Pesanan Terkirim"
                                  : order.status === "cancelled"
                                    ? "Pesanan Dibatalkan"
                                    : order.status}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {order.status === "pending"
                            ? "Silakan selesaikan pembayaran Anda"
                            : order.status === "processing"
                              ? "Pesanan Anda sedang diproses"
                              : order.status === "shipped"
                                ? "Pesanan Anda sedang dalam perjalanan"
                                : order.status === "delivered"
                                  ? "Pesanan Anda telah diterima"
                                  : order.status === "cancelled"
                                    ? "Pesanan Anda telah dibatalkan"
                                    : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pesanan Tidak Ditemukan</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Pesanan yang Anda cari tidak ditemukan atau Anda tidak memiliki akses.
            </p>
            <Link href="/orders">
              <Button variant="outline" className="mr-2">
                Kembali ke Pesanan
              </Button>
            </Link>
            <Link href="/">
              <Button className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800">
                Kembali ke Beranda
              </Button>
            </Link>
          </div>
        )}
      </main>
    </>
  )
}
