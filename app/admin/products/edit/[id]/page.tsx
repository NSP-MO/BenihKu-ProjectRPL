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
import { Alert, AlertDescription } from "@/components/ui/alert"
import ProtectedRoute from "@/components/protected-route"
import { getProductById } from "@/lib/products"
import { updateProduct } from "@/lib/admin"
// Add the import for the ImageUpload component
import { ImageUpload } from "@/components/image-upload"
import { toast } from "@/components/ui/use-toast"

// Sample plant data - in a real app, this would come from a database
const plantsData = [
  {
    id: 1,
    name: "Monstera Deliciosa",
    price: 250000,
    image: "/placeholder.svg?height=500&width=500",
    category: "Tanaman Hias",
    description:
      "Monstera Deliciosa atau Swiss Cheese Plant adalah tanaman hias populer dengan daun besar berlubang yang unik. Tanaman ini berasal dari hutan hujan tropis Amerika Tengah dan sangat cocok sebagai tanaman indoor.",
    careInstructions: {
      light: "Cahaya tidak langsung yang terang. Hindari sinar matahari langsung yang dapat membakar daun.",
      water: "Siram saat lapisan atas tanah kering (sekitar seminggu sekali). Kurangi penyiraman di musim dingin.",
      soil: "Campuran tanah yang kaya nutrisi dengan drainase yang baik.",
      humidity: "Menyukai kelembaban tinggi. Semprotkan daun secara teratur atau gunakan humidifier.",
      temperature: "Suhu ideal 18-30°C. Hindari suhu di bawah 15°C.",
      fertilizer: "Pupuk setiap bulan selama musim pertumbuhan (musim semi dan musim panas).",
    },
    seller: {
      name: "Toko Tanaman Sejahtera",
      rating: 4.8,
      responseTime: "± 1 jam",
    },
    isPopular: true,
    status: "published",
    stock: 15,
  },
  // ... other plants data
]

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const productId = Number.parseInt(params.id)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add these state variables to the component
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("")
  const [uploadedImagePath, setUploadedImagePath] = useState<string>("")
  const [uploadedImageBucket, setUploadedImageBucket] = useState<string>("")
  const [uploadError, setUploadError] = useState<string>("")

  // Product form state
  const [product, setProduct] = useState({
    id: 0,
    name: "",
    price: 0,
    image: "",
    category: "",
    description: "",
    status: "published",
    stock: 0,
    isPopular: false,
    careInstructions: {
      light: "",
      water: "",
      soil: "",
      humidity: "",
      temperature: "",
      fertilizer: "",
    },
  })

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true)
      try {
        const productData = await getProductById(productId)

        if (productData) {
          setProduct({
            id: productData.id,
            name: productData.name || "",
            price: productData.price || 0,
            image: productData.image || "",
            category: productData.category || "",
            description: productData.description || "",
            status: "published", // Default value
            stock: typeof productData.stock === "number" ? productData.stock : 0,
            isPopular: !!productData.is_popular,
            careInstructions: {
              light: productData.care_instructions?.light || "",
              water: productData.care_instructions?.water || "",
              soil: productData.care_instructions?.soil || "",
              humidity: productData.care_instructions?.humidity || "",
              temperature: productData.care_instructions?.temperature || "",
              fertilizer: productData.care_instructions?.fertilizer || "",
            },
          })
        } else {
          setError("Produk tidak ditemukan")
        }
      } catch (error) {
        console.error("Error loading product:", error)
        setError("Terjadi kesalahan saat memuat data produk")
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [productId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProduct((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCareInstructionsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProduct((prev) => ({
      ...prev,
      careInstructions: {
        ...prev.careInstructions,
        [name]: value,
      },
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setProduct((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setProduct((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  // Update the handleSubmit function to include the uploaded image
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsSaving(true)

    try {
      // Ensure price and stock are valid numbers
      const price = typeof product.price === "string" ? Number.parseFloat(product.price) || 0 : product.price || 0

      const stock = typeof product.stock === "string" ? Number.parseInt(product.stock) || 0 : product.stock || 0

      // Prepare the product data for update
      const productData = {
        name: product.name || "",
        price: price,
        category: product.category || "",
        description: product.description || "",
        is_popular: !!product.isPopular,
        stock: stock,
        care_instructions: product.careInstructions || {
          light: "",
          water: "",
          soil: "",
          humidity: "",
          temperature: "",
          fertilizer: "",
        },
        // Include the uploaded image URL if available
        ...(uploadedImageUrl && { image: uploadedImageUrl }),
        ...(uploadedImagePath && { image_path: uploadedImagePath }),
        ...(uploadedImageBucket && { image_bucket: uploadedImageBucket }),
      }

      const { success, error } = await updateProduct(productId, productData)

      if (success) {
        setSuccess("Produk berhasil disimpan!")
        toast({
          title: "Sukses",
          description: "Produk berhasil disimpan!",
        })

        // Optionally redirect back to admin page after a delay
        setTimeout(() => {
          router.push("/admin/products")
        }, 2000)
      } else {
        setError(error || "Terjadi kesalahan saat menyimpan produk. Silakan coba lagi.")
        toast({
          title: "Error",
          description: error || "Terjadi kesalahan saat menyimpan produk. Silakan coba lagi.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      console.error("Error saving product:", err)
      setError(err.message || "Terjadi kesalahan saat menyimpan produk. Silakan coba lagi.")
      toast({
        title: "Error",
        description: err.message || "Terjadi kesalahan saat menyimpan produk. Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ProtectedRoute adminOnly>
      <div className="container py-12">
        <Link href="/admin/products" className="inline-flex items-center mb-6">
          <Button variant="ghost" className="p-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Produk
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Edit Produk</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/products")}>
              Batal
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-600 text-green-600">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
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
                  <CardDescription>
                    Informasi dasar tentang produk yang akan ditampilkan kepada pelanggan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Produk</Label>
                      <Input
                        id="name"
                        name="name"
                        value={product.name}
                        onChange={handleInputChange}
                        className="dark:bg-gray-800 dark:border-gray-700"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Harga (Rp)</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        value={product.price}
                        onChange={handleInputChange}
                        className="dark:bg-gray-800 dark:border-gray-700"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Kategori</Label>
                      <Select value={product.category} onValueChange={(value) => handleSelectChange("category", value)}>
                        <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                          <SelectItem value="Tanaman Hias">Tanaman Hias</SelectItem>
                          <SelectItem value="Tanaman Indoor">Tanaman Indoor</SelectItem>
                          <SelectItem value="Tanaman Outdoor">Tanaman Outdoor</SelectItem>
                          <SelectItem value="Tanaman Gantung">Tanaman Gantung</SelectItem>
                          <SelectItem value="Kaktus & Sukulen">Kaktus & Sukulen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stok</Label>
                      <Input
                        id="stock"
                        name="stock"
                        type="number"
                        value={product.stock}
                        onChange={handleInputChange}
                        className="dark:bg-gray-800 dark:border-gray-700"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={product.status} onValueChange={(value) => handleSelectChange("status", value)}>
                        <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                          <SelectItem value="published">Dipublikasikan</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 h-full pt-8">
                      <input
                        type="checkbox"
                        id="isPopular"
                        name="isPopular"
                        checked={product.isPopular}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-700"
                      />
                      <Label htmlFor="isPopular">Tandai sebagai produk populer</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={product.description}
                      onChange={handleInputChange}
                      rows={5}
                      className="dark:bg-gray-800 dark:border-gray-700"
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="care">
              <Card className="dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Informasi Perawatan</CardTitle>
                  <CardDescription>
                    Informasi tentang cara merawat tanaman yang akan ditampilkan kepada pelanggan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="light">Cahaya</Label>
                      <Textarea
                        id="light"
                        name="light"
                        value={product.careInstructions.light}
                        onChange={handleCareInstructionsChange}
                        rows={3}
                        className="dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="water">Penyiraman</Label>
                      <Textarea
                        id="water"
                        name="water"
                        value={product.careInstructions.water}
                        onChange={handleCareInstructionsChange}
                        rows={3}
                        className="dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="soil">Media Tanam</Label>
                      <Textarea
                        id="soil"
                        name="soil"
                        value={product.careInstructions.soil}
                        onChange={handleCareInstructionsChange}
                        rows={3}
                        className="dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="humidity">Kelembaban</Label>
                      <Textarea
                        id="humidity"
                        name="humidity"
                        value={product.careInstructions.humidity}
                        onChange={handleCareInstructionsChange}
                        rows={3}
                        className="dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Suhu</Label>
                      <Textarea
                        id="temperature"
                        name="temperature"
                        value={product.careInstructions.temperature}
                        onChange={handleCareInstructionsChange}
                        rows={3}
                        className="dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fertilizer">Pemupukan</Label>
                      <Textarea
                        id="fertilizer"
                        name="fertilizer"
                        value={product.careInstructions.fertilizer}
                        onChange={handleCareInstructionsChange}
                        rows={3}
                        className="dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images">
              <Card className="dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Gambar Produk</CardTitle>
                  <CardDescription>Unggah gambar produk yang akan ditampilkan kepada pelanggan.</CardDescription>
                </CardHeader>
                <CardContent>
                  {uploadError && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertDescription>{uploadError}</AlertDescription>
                    </Alert>
                  )}
                  <ImageUpload
                    currentImage={product.image}
                    onImageUploaded={(url, path, bucket) => {
                      setUploadedImageUrl(url)
                      setUploadedImagePath(path)
                      if (bucket) setUploadedImageBucket(bucket)
                      setUploadError("")

                      // Update product state with the new image URL
                      setProduct((prev) => ({
                        ...prev,
                        image: url,
                      }))

                      toast({
                        title: "Sukses",
                        description: "Gambar berhasil diunggah!",
                      })
                    }}
                    onError={setUploadError}
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
