"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { handleBackNavigation } from "@/lib/navigation-utils"

export default function CartPage() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, clearCart, totalPrice, isLoading } = useCart()
  const [isClearing, setIsClearing] = useState(false)

  const handleClearCart = async () => {
    if (window.confirm("Apakah Anda yakin ingin mengosongkan keranjang?")) {
      setIsClearing(true)
      await clearCart()
      setIsClearing(false)
    }
  }

  const handleBack = () => {
    handleBackNavigation(router)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="flex justify-center items-center h-40">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-green-600"></div>
        </div>
        <h2 className="text-xl font-semibold mb-2">Memuat Keranjang...</h2>
        <p className="text-gray-500 dark:text-gray-400">Mohon tunggu sebentar.</p>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <ShoppingBag className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Keranjang Anda Kosong</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Anda belum menambahkan produk apapun ke keranjang.</p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={handleBack} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <Link href="/">
            <Button className="bg-green-600 hover:bg-green-700">Mulai Belanja</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleBack} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold">Keranjang Belanja</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Produk</h2>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 hover:text-red-700 border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700"
                onClick={handleClearCart}
                disabled={isClearing}
              >
                {isClearing ? "Mengosongkan..." : "Kosongkan Keranjang"}
              </Button>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((item) => (
                <div key={item.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center">
                  <div className="flex-shrink-0 w-full sm:w-auto mb-4 sm:mb-0">
                    <div className="aspect-square w-20 h-20 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="flex-grow sm:ml-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h3>
                    <p className="text-green-600 font-medium mt-1">Rp {item.price.toLocaleString("id-ID")}</p>
                  </div>

                  <div className="flex items-center mt-4 sm:mt-0">
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                      <button
                        className="px-3 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={isLoading}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-3 py-1 text-gray-700 dark:text-gray-300 min-w-[40px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        className="px-3 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={isLoading}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      className="ml-4 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      onClick={() => removeItem(item.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Ringkasan Pesanan</h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-medium">Rp {totalPrice.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Pengiriman</span>
                <span>Dihitung saat checkout</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between">
                <span className="font-medium">Total</span>
                <span className="font-bold text-lg">Rp {totalPrice.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <Link href="/checkout">
              <Button className="w-full mt-6 bg-green-600 hover:bg-green-700 flex items-center justify-center">
                Lanjut ke Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
