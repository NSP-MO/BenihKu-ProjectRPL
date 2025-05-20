"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CreditCard, Truck, ShoppingBag, Loader2 } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { createOrder } from "./actions"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"

const CheckoutPage = () => {
  const router = useRouter()
  const { items, clearCart, refreshCart, isLoading: cartLoading } = useCart()
  const { user, isLoading: authLoading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [shippingMethod, setShippingMethod] = useState("regular")
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const { theme } = useTheme()

  // Force refresh cart when component mounts
  useEffect(() => {
    const loadCart = async () => {
      setIsInitialLoading(true)
      try {
        if (user && refreshCart) {
          await refreshCart()
        }
      } catch (error) {
        console.error("Error refreshing cart:", error)
      } finally {
        setIsInitialLoading(false)
      }
    }

    loadCart()
  }, [user, refreshCart])

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/checkout")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const calculateTotal = () => {
      let newTotal = 0
      if (items && items.length > 0) {
        items.forEach((item) => {
          newTotal += item.price * item.quantity
        })
      }
      setTotal(newTotal)
    }

    calculateTotal()
  }, [items])

  // Show loading state while checking authentication or initial cart loading
  if (authLoading || isInitialLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>

        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Memuat...</h2>
          <p className="text-gray-500 dark:text-gray-400">Mohon tunggu sebentar.</p>
        </div>
      </div>
    )
  }

  // If not authenticated, don't render the form (will redirect in useEffect)
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>

        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>

        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Keranjang Anda Kosong</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Anda belum menambahkan produk apapun ke keranjang.</p>
          <Link href="/">
            <Button className="bg-green-600 hover:bg-green-700">Mulai Belanja</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      formData.append("cartItems", JSON.stringify(items))
      formData.append("userId", user.id)

      // Make sure shipping method is included in the form data
      if (!formData.get("shippingMethod")) {
        formData.append("shippingMethod", shippingMethod)
      }

      console.log("Shipping method in form:", formData.get("shippingMethod"))

      const result = await createOrder(formData)

      if (result.success) {
        // Clear the cart
        clearCart()

        // Redirect to the order details page
        router.push(`/orders/${result.orderId}`)
      } else {
        setError(result.error || "Failed to process your order. Please try again.")
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Checkout error:", error)
      setError("An unexpected error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold">Checkout</h1>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {cartLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mr-2" />
          <span>Memperbarui keranjang...</span>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Truck className="mr-2 h-5 w-5 text-green-600" />
                Informasi Pengiriman
              </h2>

              <form id="checkout-form" onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nama Lengkap"
                      defaultValue={user.user_metadata?.full_name || ""}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Email"
                      defaultValue={user.email || ""}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Nomor Telepon"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Alamat
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Alamat Lengkap"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kota
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Kota"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="postalCode"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Kode Pos
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Kode Pos"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="country"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Negara
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Negara"
                      defaultValue="Indonesia"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Metode Pengiriman
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="regular"
                        checked={shippingMethod === "regular"}
                        onChange={() => setShippingMethod("regular")}
                        className="h-4 w-4 text-green-600 focus:ring-green-500"
                        required
                      />
                      <div className="ml-3">
                        <span className="block font-medium">Pengiriman Reguler</span>
                        <span className="block text-sm text-gray-500 dark:text-gray-400">2-3 hari kerja</span>
                      </div>
                      <span className="ml-auto">Gratis</span>
                    </label>

                    <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="express"
                        checked={shippingMethod === "express"}
                        onChange={() => setShippingMethod("express")}
                        className="h-4 w-4 text-green-600 focus:ring-green-500"
                      />
                      <div className="ml-3">
                        <span className="block font-medium">Pengiriman Express</span>
                        <span className="block text-sm text-gray-500 dark:text-gray-400">1 hari kerja</span>
                      </div>
                      <span className="ml-auto">Rp 20.000</span>
                    </label>
                  </div>
                </div>

                {/* Hidden input to ensure shipping method is always submitted */}
                <input type="hidden" name="shippingMethod" value={shippingMethod} />

                <div className="mb-4">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Catatan Pesanan (Opsional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Tambahkan catatan untuk pesanan Anda"
                  ></textarea>
                </div>
              </form>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <CreditCard className="mr-2 h-5 w-5 text-green-600" />
                Metode Pembayaran
              </h2>

              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    form="checkout-form"
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                    defaultChecked
                    required
                  />
                  <span className="ml-2">Transfer Bank</span>
                </label>

                <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    form="checkout-form"
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                    required
                  />
                  <span className="ml-2">Bayar di Tempat (COD)</span>
                </label>

                <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="e_wallet"
                    form="checkout-form"
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                    required
                  />
                  <span className="ml-2">E-Wallet</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-4">Ringkasan Pesanan</h2>

              <div className="space-y-4 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <div className="h-16 w-16 flex-shrink-0 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span>Rp {total.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Pengiriman</span>
                  <span>{shippingMethod === "express" ? "Rp 20.000" : "Gratis"}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span>
                  <span>Rp {(total + (shippingMethod === "express" ? 20000 : 0)).toLocaleString("id-ID")}</span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                disabled={isSubmitting || cartLoading}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </div>
                ) : (
                  "Selesaikan Pesanan"
                )}
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                Dengan melakukan pemesanan, Anda menyetujui Syarat dan Ketentuan kami.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckoutPage
