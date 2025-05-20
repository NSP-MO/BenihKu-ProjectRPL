"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import Header from "@/components/header"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/lib/products"

export default function CategoryPage() {
  const params = useParams()
  const categoryName = decodeURIComponent(params.category as string)

  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProductsByCategory = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data, error } = await supabase.from("products").select("*").eq("category", categoryName)

        if (error) {
          throw error
        }

        setProducts(data as Product[])
      } catch (err: any) {
        console.error(`Error fetching products in category ${categoryName}:`, err)
        setError(err.message || "Failed to load products")
      } finally {
        setIsLoading(false)
      }
    }

    if (categoryName) {
      fetchProductsByCategory()
    }
  }, [categoryName])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container py-12">
        <Link href="/categories" className="inline-flex items-center mb-6">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Kategori
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">{categoryName}</h1>
          <p className="text-gray-500 dark:text-gray-400">Menampilkan {products.length} produk dalam kategori ini</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <Button className="mt-4 bg-green-600 hover:bg-green-700" onClick={() => window.location.reload()}>
              Coba Lagi
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Tidak ada produk dalam kategori ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`}>
                <Card className="h-full overflow-hidden transition-all hover:shadow-md dark:border-gray-800">
                  <div className="aspect-square overflow-hidden">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      width={500}
                      height={500}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="line-clamp-1 text-lg font-semibold">{product.name}</h3>
                    <p className="line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{product.description}</p>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between p-4 pt-0">
                    <p className="font-medium">Rp {product.price.toLocaleString("id-ID")}</p>
                    {product.is_popular && (
                      <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
                        Populer
                      </span>
                    )}
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
