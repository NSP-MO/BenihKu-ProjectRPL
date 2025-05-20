"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"
import { Loader2, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Header from "@/components/header"

type Order = {
  id: string
  user_id: string
  status: string
  total_amount: number
  created_at: string
  items_count: number
}

export default function OrdersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push("/auth/login?redirect=/orders")
      return
    }

    const fetchOrders = async () => {
      try {
        setLoading(true)

        // Get orders from the database
        const { data, error } = await supabase
          .from("orders")
          .select(`
            id, 
            user_id, 
            status, 
            total_amount, 
            created_at,
            order_items (count)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        // Transform data to include item count
        const ordersWithItemCount = data.map((order) => ({
          ...order,
          items_count: order.order_items[0].count,
        }))

        setOrders(ordersWithItemCount)
      } catch (err) {
        console.error("Error fetching orders:", err)
        setError("Gagal memuat pesanan. Silakan coba lagi nanti.")
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user, router])

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
    }).format(date)
  }

  return (
    <>
      <Header />
      <main className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Pesanan Saya</h1>
          <Link href="/">
            <Button variant="outline">Kembali ke Beranda</Button>
          </Link>
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
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Belum Ada Pesanan</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Anda belum memiliki pesanan. Mulai belanja sekarang!
            </p>
            <Link href="/categories">
              <Button className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800">
                Jelajahi Tanaman
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Pesanan #{order.id.substring(0, 8)}</CardTitle>
                      <CardDescription>{formatDate(order.created_at)}</CardDescription>
                    </div>
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
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Jumlah Item:</span>
                      <span className="font-medium">{order.items_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Total:</span>
                      <span className="font-medium">{formatCurrency(order.total_amount)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/orders/${order.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                      Lihat Detail
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
