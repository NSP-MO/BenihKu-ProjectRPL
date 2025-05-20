"use client"

import type React from "react"

import { useState } from "react"
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
import { createProduct } from "@/lib/admin"
// Add the following imports if they don't exist
import { ImageUpload } from "@/components/image-upload"
import { toast } from "@/components/ui/use-toast"
// Add the import for the ImageUpload component
// import { ImageUpload } from "@/components/image-upload"

export default function AddProductPage() {
  const router = useRouter()

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Add these state variables to the component
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("")
  const [uploadedImagePath, setUploadedImagePath] = useState<string>("")
  const [uploadError, setUploadError] = useState<string>("")

  // Product form state
  const [product, setProduct] = useState({
    name: "",
    price: 0,
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

  // Update the formData state to include image_path
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    stock: "",
    image_url: "",
    image_path: "",
  })

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

  const [isSubmitting, setIsSubmitting] = useState(false)
  // Update the handleSubmit function to include image data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await createProduct({
        name: formData.name,
        price: Number.parseFloat(formData.price),
        description: formData.description,
        category: formData.category,
        stock: Number.parseInt(formData.stock),
        image_url: formData.image_url,
        image_path: formData.image_path,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Product added successfully",
        })
        router.push("/admin/products")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add product",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute adminOnly>
      <div className="container py-12">
        <Link href="/admin" className="inline-flex items-center mb-6">
          <Button variant="ghost" className="p-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dashboard
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Tambah Produk Baru</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/admin")}>
              Batal
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Produk"
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

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="basic">Informasi Dasar</TabsTrigger>
            <TabsTrigger value="care">Perawatan</TabsTrigger>
            <TabsTrigger value="images">Gambar</TabsTrigger>
          </TabsList>
          <TabsContent value="basic">
            <Card>
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
                    <Input id="name" name="name" value={product.name} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Harga (Rp)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={product.price}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <Select value={product.category} onValueChange={(value) => handleSelectChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
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
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={product.status} onValueChange={(value) => handleSelectChange("status", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
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
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
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
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="care">
            <Card>
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
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          // Replace the images TabsContent with this updated version
          <TabsContent value="images" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">Product Image</Label>
              <ImageUpload
                onImageUploaded={(url, path) => {
                  setFormData({
                    ...formData,
                    image_url: url,
                    image_path: path,
                  })
                }}
                onError={(error) => {
                  toast({
                    title: "Error",
                    description: error,
                    variant: "destructive",
                  })
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
