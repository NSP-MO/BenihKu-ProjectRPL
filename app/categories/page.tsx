// app/categories/page.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Header from "@/components/header"
import { supabase } from "@/lib/supabase"
import { getAllCategories } from "@/lib/products" // Import fungsi baru

type CategoryDisplayInfo = {
  id: number
  name: string
  image: string
  count: number
}

export default function CategoriesPage() {
  const [categoriesDisplay, setCategoriesDisplay] = useState<CategoryDisplayInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategoriesData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const fetchedCategoryNames = await getAllCategories()

        if (fetchedCategoryNames.length === 0) {
          setCategoriesDisplay([])
          setIsLoading(false)
          return
        }

        // Ambil jumlah produk untuk setiap kategori
        const categoryCountsPromises = fetchedCategoryNames.map(async (name) => {
          const { count, error: countError } = await supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("category", name)
            .eq("is_published", true) // Hanya hitung produk yang dipublikasikan
          
          if (countError) {
            console.error(`Error counting products for category ${name}:`, countError)
            return { name, count: 0 }
          }
          return { name, count: count || 0 }
        })

        const categoryCountsResults = await Promise.all(categoryCountsPromises)
        
        const categoryImages: Record<string, string> = {
          "Tanaman Hias": "https://rgsmubwxaddbakgdzcrf.supabase.co/storage/v1/object/public/images/categories/664b4c98f0ed0.jpg?height=300&width=300&text=Hias",
          "Tanaman Indoor": "https://rgsmubwxaddbakgdzcrf.supabase.co/storage/v1/object/public/images/categories/FotoJet-29-3856261290.webp?height=300&width=300&text=Indoor",
          "Tanaman Outdoor": "https://rgsmubwxaddbakgdzcrf.supabase.co/storage/v1/object/public/images/categories/cover_tanaman_hias_tahan_panas.jpg?height=300&width=300&text=Outdoor",
          "Tanaman Gantung": "https://rgsmubwxaddbakgdzcrf.supabase.co/storage/v1/object/public/images/categories/Blog_Jenis-Tanaman-Hias-Gantung-dengan-Bunga-Tercantik.jpg?height=300&width=300&text=Gantung",
          "Kaktus & Sukulen": "https://rgsmubwxaddbakgdzcrf.supabase.co/storage/v1/object/public/images/categories/Succulent-and-cacti-jpj_1200x600.webp?height=300&width=300&text=Kaktus",
          "Tanaman Air": "https://rgsmubwxaddbakgdzcrf.supabase.co/storage/v1/object/public/images/categories/SPR-houseplants-grown-in-water-4177520-hero-264670857d8b4c68a66b6d63c20e179e.jpg?height=300&width=300&text=Air",
          "Tanaman Buah": "https://rgsmubwxaddbakgdzcrf.supabase.co/storage/v1/object/public/images/categories/20220516_tm_blackberry_black_cascade.jpg?height=300&width=300&text=Buah",
          "Tanaman Obat": "https://rgsmubwxaddbakgdzcrf.supabase.co/storage/v1/object/public/images/categories/61b474a55ae0c.jpg?height=300&width=300&text=Obat",
          "Benih": "https://rgsmubwxaddbakgdzcrf.supabase.co/storage/v1/object/public/images/categories/benih-tanaman.jpg", // URL gambar untuk kategori Benih
        }

        const categoryList: CategoryDisplayInfo[] = categoryCountsResults
          .map(({ name, count }, index) => ({
            id: index + 1, // atau gunakan uuid jika ada
            name,
            image: categoryImages[name] || "/placeholder.svg?height=300&width=300",
            count,
          }))
          .filter(cat => cat.count > 0); // Hanya tampilkan kategori yang memiliki produk

        setCategoriesDisplay(categoryList)
      } catch (err: any) {
        console.error("Error fetching categories page data:", err)
        setError(err.message || "Failed to load categories data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategoriesData()
  }, [])


  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container py-12">
        <Link href="/" className="inline-flex items-center mb-6">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Kategori Produk</h1>
          <p className="text-gray-500 dark:text-gray-400">Jelajahi berbagai kategori produk yang kami tawarkan</p>
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
        ) : categoriesDisplay.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Tidak ada kategori yang tersedia saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categoriesDisplay.map((category) => (
              <Link key={category.id} href={`/categories/${encodeURIComponent(category.name)}`}>
                <Card className="overflow-hidden transition-all hover:shadow-md dark:border-gray-700">
                  <Image
                    src={category.image || "/placeholder.svg"}
                    alt={category.name}
                    width={300}
                    height={200}
                    className="h-[140px] sm:h-[160px] w-full object-cover"
                  />
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{category.count} produk</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
