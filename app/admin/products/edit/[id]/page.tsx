// app/admin/products/edit/[id]/page.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProtectedRoute from "@/components/protected-route"
import { getProductById, getAllCategories } from "@/lib/products"
import { updateProduct } from "@/lib/admin"
import { ImageUpload } from "@/components/image-upload"
import { toast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import type { Product } from "@/lib/products"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const productId = Number.parseInt(params.id)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | undefined>(undefined)
  const [uploadedImagePath, setUploadedImagePath] = useState<string | undefined>(undefined)
  const [uploadedImageBucket, setUploadedImageBucket] = useState<string | undefined>(undefined)

  const [product, setProduct] = useState<Partial<Product>>({
    id: productId,
    name: "",
    price: 0,
    image: "",
    category: "",
    description: "", // Untuk deskripsi utama produk
    is_published: true,
    stock: 0,
    is_popular: false,
    shipping_info_notes: "Tanaman ini dikirim dalam pot plastik berukuran sesuai dengan ukuran tanaman. Untuk hasil terbaik, segera pindahkan ke pot yang lebih besar setelah menerima tanaman.", // Default jika field baru
    care_instructions: {
      light: "",
      water: "",
      soil: "",
      humidity: "",
      temperature: "",
      fertilizer: "",
    },
  })

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true)
      try {
        const fetchedCategories = await getAllCategories()
        setCategories(fetchedCategories)
      } catch (error) {
        console.error("Failed to load categories:", error)
        toast({
          title: "Error",
          description: "Gagal memuat kategori. Menggunakan daftar default.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingCategories(false)
      }
    }
    loadCategories()
  }, [])

  useEffect(() => {
    if (!productId) {
      toast({ title: "Error", description: "Invalid Product ID.", variant: "destructive" })
      setIsLoading(false)
      return
    }
    const loadProduct = async () => {
      setIsLoading(true)
      try {
        const productData = await getProductById(productId)
        if (productData) {
          setProduct({
            ...productData,
            is_published: productData.is_published !== undefined ? productData.is_published : true,
            is_popular: !!productData.is_popular,
            // Pastikan shipping_info_notes diambil dari database, atau gunakan default jika tidak ada
            shipping_info_notes: productData.shipping_info_notes || "Tanaman ini dikirim dalam pot plastik berukuran sesuai dengan ukuran tanaman. Untuk hasil terbaik, segera pindahkan ke pot yang lebih besar setelah menerima tanaman.",
            care_instructions: productData.care_instructions || {
              light: "",
              water: "",
              soil: "",
              humidity: "",
              temperature: "",
              fertilizer: "",
            },
          })
          if (productData.image) setUploadedImageUrl(productData.image)
          if (productData.image_path) setUploadedImagePath(productData.image_path)
          if (productData.image_bucket) setUploadedImageBucket(productData.image_bucket)
        } else {
          toast({ title: "Error", description: "Produk tidak ditemukan", variant: "destructive" })
        }
      } catch (loadError: any) {
        toast({ title: "Error", description: `Gagal memuat produk: ${loadError.message}`, variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    loadProduct()
  }, [productId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const numValue = name === "price" || name === "stock" ? Number.parseFloat(value) : undefined
    setProduct((prev) => ({ ...prev, [name]: numValue !== undefined && !isNaN(numValue) ? numValue : value }))
  }

  const handleCheckboxChange = (name: "is_popular" | "is_published", checked: boolean | string) => {
    setProduct((prev) => ({ ...prev, [name]: !!checked }))
  }

  const handleSelectChange = (name: "category" | "status", value: string) => {
    if (name === "status") {
      setProduct((prev) => ({ ...prev, is_published: value === "published" }))
    } else {
      setProduct((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleCareInstructionsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProduct((prev) => ({
      ...prev,
      care_instructions: {
        ...(prev.care_instructions || {}),
        [name]: value,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const productDataToUpdate: Partial<Product> = { ...product }
      if (typeof productDataToUpdate.price === "string")
        productDataToUpdate.price = Number.parseFloat(productDataToUpdate.price) || 0
      if (typeof productDataToUpdate.stock === "string")
        productDataToUpdate.stock = Number.parseInt(productDataToUpdate.stock, 10) || 0

      if (uploadedImageUrl && uploadedImageUrl !== product.image) {
        productDataToUpdate.image = uploadedImageUrl
        productDataToUpdate.image_path = uploadedImagePath
        productDataToUpdate.image_bucket = uploadedImageBucket
      }

      // Pastikan shipping_info_notes juga dikirim
      // productDataToUpdate.shipping_info_notes akan sudah ada di product state

      const { success: updateSuccess, error: updateError } = await updateProduct(productId, productDataToUpdate)

      if (updateSuccess) {
        toast({ title: "Sukses", description: "Produk berhasil disimpan!" })
        router.push("/admin/dashboard")
      } else {
        toast({ title: "Error", description: updateError || "Gagal menyimpan.", variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Gagal menyimpan.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ProtectedRoute adminOnly>
      <div className="container py-12">
        <Link href="/admin/dashboard" className="inline-flex items-center mb-6">
          <Button variant="ghost" className="p-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dashboard
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Edit Produk: {product.name || `ID ${productId}`}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
              Batal
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSubmit} disabled={isSaving || isLoading}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : !product.id ? (
          <Alert variant="destructive">
            <AlertDescription>Produk tidak ditemukan atau gagal dimuat.</AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="basic">Informasi Dasar</TabsTrigger>
              <TabsTrigger value="care">Perawatan</TabsTrigger>
              <TabsTrigger value="images">Gambar</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <Card className="dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Informasi Dasar</CardTitle>
                  <CardDescription>Perbarui informasi dasar produk.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* ... (input fields for name, price, category, stock, status, is_popular) ... */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Produk</Label>
                      <Input id="name" name="name" value={product.name || ""} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Harga (Rp)</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        value={product.price || 0}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Kategori</Label>
                      <Select
                        value={product.category || ""}
                        onValueChange={(value) => handleSelectChange("category", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingCategories ? "Memuat kategori..." : "Pilih kategori"} />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingCategories ? (
                            <div className="flex items-center justify-center p-2">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span>Memuat kategori...</span>
                            </div>
                          ) : (
                            categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stok</Label>
                      <Input
                        id="stock"
                        name="stock"
                        type="number"
                        value={product.stock || 0}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status Publikasi</Label>
                      <Select
                        value={product.is_published ? "published" : "draft"}
                        onValueChange={(value) => handleSelectChange("status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="published">Dipublikasikan</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 pt-4 md:pt-8">
                      <Checkbox
                        id="is_popular"
                        checked={!!product.is_popular}
                        onCheckedChange={(checked) => handleCheckboxChange("is_popular", !!checked)}
                      />
                      <Label htmlFor="is_popular">Populer (Tampil di Homepage)</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi Lengkap Produk</Label> {/* Label diperjelas */}
                    <Textarea
                      id="description"
                      name="description"
                      value={product.description || ""}
                      onChange={handleInputChange}
                      rows={5}
                      required
                      placeholder="Masukkan deskripsi lengkap mengenai produk di sini..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shipping_info_notes">Catatan Info Pengiriman Pot</Label>
                    <Textarea
                      id="shipping_info_notes"
                      name="shipping_info_notes"
                      value={product.shipping_info_notes || ""}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Contoh: Tanaman ini dikirim dalam pot plastik..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Teks ini akan muncul di bawah deskripsi lengkap pada halaman produk.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="care">
              <Card className="dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Informasi Perawatan</CardTitle>
                  <CardDescription>Detail cara merawat tanaman.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(product.care_instructions || {}).map(([key, value]) => (
                    <div className="space-y-2" key={key}>
                      <Label htmlFor={key} className="capitalize">
                        {key.replace(/([A-Z])/g, " $1")}
                      </Label>
                      <Textarea
                        id={key}
                        name={key}
                        value={(value as string) || ""}
                        onChange={handleCareInstructionsChange}
                        rows={2}
                      />
                    </div>
                  ))}
                  {["light", "water", "soil", "humidity", "temperature", "fertilizer"].map((key) => {
                    if (!product.care_instructions || !(key in product.care_instructions)) {
                      return (
                        <div className="space-y-2" key={key}>
                          <Label htmlFor={key} className="capitalize">
                            {key}
                          </Label>
                          <Textarea id={key} name={key} value={""} onChange={handleCareInstructionsChange} rows={2} />
                        </div>
                      )
                    }
                    return null
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images">
              <Card className="dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Gambar Produk</CardTitle>
                  <CardDescription>Unggah atau perbarui gambar produk.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    currentImage={product.image || uploadedImageUrl}
                    onImageUploaded={(url, path, bucket) => {
                      setUploadedImageUrl(url)
                      setUploadedImagePath(path)
                      if (bucket) setUploadedImageBucket(bucket)
                      setProduct((prev) => ({ ...prev, image: url, image_path: path, image_bucket: bucket }))
                      toast({ title: "Sukses", description: "Gambar berhasil diunggah!" })
                    }}
                    onError={(errorMsg) => {
                      toast({ title: "Error", description: errorMsg, variant: "destructive" })
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ProtectedRoute>
  )
}
