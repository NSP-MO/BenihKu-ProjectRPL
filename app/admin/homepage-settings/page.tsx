"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Leaf, Home, ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import ProtectedRoute from "@/components/protected-route"
import { supabase } from "@/lib/supabase"
import type { HomepageSettings } from "@/lib/homepage-settings"

interface Product {
  id: number
  name: string
  price: number
  category: string
  image: string
  is_popular: boolean
}

export default function HomepageSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [title, setTitle] = useState("Tanaman Populer")
  const [description, setDescription] = useState("Tanaman yang paling banyak dicari oleh pelanggan kami.")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        // Fetch all products
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("id, name, price, category, image, is_popular")
          .order("id")

        if (productsError) {
          console.error("Error fetching products:", productsError)
          return
        }

        setProducts(productsData || [])

        // Fetch homepage settings
        const { data: settingsData, error: settingsError } = await supabase
          .from("homepage_settings")
          .select("setting_value")
          .eq("setting_key", "featured_products")
          .single()

        if (settingsError && settingsError.code !== "PGRST116") {
          console.error("Error fetching homepage settings:", settingsError)
          return
        }

        if (settingsData) {
          const settings = settingsData.setting_value as HomepageSettings
          setSelectedProducts(settings.product_ids || [])
          setTitle(settings.title || "Tanaman Populer")
          setDescription(settings.description || "Tanaman yang paling banyak dicari oleh pelanggan kami.")
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleProductToggle = (productId: number) => {
    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId)
      } else {
        return [...prev, productId]
      }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const settings: HomepageSettings = {
        product_ids: selectedProducts,
        title,
        description,
      }

      const { error } = await supabase
        .from("homepage_settings")
        .update({
          setting_value: settings,
          updated_at: new Date().toISOString(),
        })
        .eq("setting_key", "featured_products")

      if (error) {
        throw error
      }

      toast({
        title: "Pengaturan berhasil disimpan",
        description: "Perubahan telah diterapkan ke homepage",
      })

      router.refresh()
    } catch (error: any) {
      console.error("Error saving settings:", error)
      toast({
        title: "Gagal menyimpan pengaturan",
        description: error.message || "Terjadi kesalahan saat menyimpan pengaturan",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ProtectedRoute adminOnly>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 px-6">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <Leaf className="h-6 w-6 text-green-600" />
            <span className="text-xl">BenihKu</span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Kembali</span>
              </Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Pengaturan Homepage</h1>
              <p className="text-muted-foreground">Kelola produk yang ditampilkan di homepage</p>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Pengaturan
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Section</CardTitle>
                <CardDescription>Sesuaikan judul dan deskripsi untuk section produk di homepage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Section</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Tanaman Populer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi Section</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tanaman yang paling banyak dicari oleh pelanggan kami."
                    rows={3}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  <Home className="inline-block mr-1 h-4 w-4" />
                  Perubahan akan langsung terlihat di homepage setelah disimpan
                </p>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Produk yang Ditampilkan</CardTitle>
                <CardDescription>Pilih produk yang akan ditampilkan di section homepage</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Tidak ada produk yang tersedia</p>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {products.map((product) => (
                      <div key={product.id} className="flex items-center space-x-3 border-b pb-3">
                        <Checkbox
                          id={`product-${product.id}`}
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => handleProductToggle(product.id)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor={`product-${product.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {product.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {product.category} · Rp {product.price.toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">{selectedProducts.length} produk dipilih</p>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
