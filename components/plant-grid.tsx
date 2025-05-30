// components/plant-grid.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Loader2 } from "lucide-react"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { getProducts, getPopularProducts, type Product, type ProductTypeFilter } from "@/lib/products"
import { Badge } from "@/components/ui/badge"

interface PlantGridProps {
  showPopular?: boolean;
  productTypeFilter?: ProductTypeFilter; // Tambahkan prop baru
}

export default function PlantGrid({ showPopular = false, productTypeFilter = 'all' }: PlantGridProps) {
  const [plants, setPlants] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPlants() {
      setLoading(true);
      try {
        const data = showPopular 
          ? await getPopularProducts(productTypeFilter) 
          : await getProducts(productTypeFilter);
        setPlants(data)
      } catch (error) {
        console.error("Error loading plants:", error)
        setPlants([])
      } finally {
        setLoading(false)
      }
    }

    loadPlants()
  }, [showPopular, productTypeFilter]) // Tambahkan productTypeFilter ke dependency array

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (plants.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {showPopular ? "Tidak ada produk populer yang ditampilkan saat ini untuk filter ini." : "Tidak ada produk yang tersedia untuk filter ini."}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
      {plants.map((plant) => (
        <Link key={plant.id} href={`/product/${plant.id}`} passHref>
          <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-square relative">
              <Image
                src={plant.image || "/placeholder.svg"}
                alt={plant.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {plant.is_popular && plant.category !== "Benih" && ( // Hanya tampilkan "Populer" jika bukan benih (opsional)
                <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full z-10">
                  Populer
                </div>
              )}
               {plant.is_popular && plant.category === "Benih" && (
                <Badge className="absolute top-2 right-2 bg-blue-600 text-white text-xs z-10" variant="default">Benih Populer</Badge>
              )}
              {plant.is_published === false && (
                <Badge
                  variant="outline"
                  className="absolute top-2 left-2 bg-yellow-500 text-white border-yellow-600 z-10"
                >
                  Draft
                </Badge>
              )}
            </div>
            <CardContent className="p-4">
              <h3 className="font-medium">{plant.name}</h3>
              <p className="text-sm text-muted-foreground">{plant.category}</p>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <p className="font-bold">Rp {plant.price.toLocaleString("id-ID")}</p>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  )
}
