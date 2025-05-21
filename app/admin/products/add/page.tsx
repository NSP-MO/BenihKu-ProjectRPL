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
import { Alert, AlertDescription } from "@/components/ui/alert" // Keep if used for error/success
import ProtectedRoute from "@/components/protected-route"
import { createProduct } from "@/lib/admin"
import { ImageUpload } from "@/components/image-upload"
import { toast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox" // Import Checkbox

// Define a more specific type for form data if needed, or use Product from lib/products
interface FormData {
  name: string;
  price: string; // Input fields are initially strings
  description: string;
  category: string;
  stock: string; // Input fields are initially strings
  image_url: string;
  image_path: string;
  show_on_homepage: boolean;
  is_popular: boolean;
  status: string; // Or use a specific type 'published' | 'draft'
  careInstructions: {
    light: string;
    water: string;
    soil: string;
    humidity: string;
    temperature: string;
    fertilizer: string;
  };
}


export default function AddProductPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  // const [error, setError] = useState("") // Handled by toast
  // const [success, setSuccess] = useState("") // Handled by toast

  const [formData, setFormData] = useState<FormData>({ // Use the interface here
    name: "",
    price: "",
    description: "",
    category: "",
    stock: "",
    image_url: "",
    image_path: "",
    show_on_homepage: false,
    is_popular: false,
    status: "published",
    careInstructions: {
      light: "", water: "", soil: "", humidity: "", temperature: "", fertilizer: "",
    },
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value, }))
  }
  
  const handleCheckboxChange = (name: keyof Pick<FormData, 'is_popular' | 'show_on_homepage'>, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked, }));
  };

  const handleSelectChange = (name: keyof Pick<FormData, 'category' | 'status'>, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value, }))
  }
  
  const handleCareInstructionsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      careInstructions: {
        // @ts-ignore
        ...(prev.careInstructions || {}), 
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const result = await createProduct({
        name: formData.name,
        price: Number.parseFloat(formData.price) || 0,
        description: formData.description,
        category: formData.category,
        stock: Number.parseInt(formData.stock) || 0,
        image_url: formData.image_url,
        image_path: formData.image_path,
        show_on_homepage: formData.show_on_homepage,
        is_popular: formData.is_popular,
        is_published: formData.status === "published",
        care_instructions: formData.careInstructions,
      })

      if (result.success) {
        toast({ title: "Success", description: "Product added successfully" })
        router.push("/admin/dashboard") // Redirect to main admin dashboard
      } else {
        toast({ title: "Error", description: result.error || "Failed to add product", variant: "destructive"})
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "An unexpected error occurred", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ProtectedRoute adminOnly>
      <div className="container py-12">
        <Link href="/admin/dashboard" className="inline-flex items-center mb-6"> {/* Link to main admin dashboard */}
          <Button variant="ghost" className="p-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dashboard
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Tambah Produk Baru</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>Batal</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>) : "Simpan Produk"}
            </Button>
          </div>
        </div>

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
                <CardDescription>Informasi dasar tentang produk.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Produk</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Harga (Rp)</Label>
                    <Input id="price" name="price" type="number" value={formData.price} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                      <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
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
                    <Input id="stock" name="stock" type="number" value={formData.stock} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                      <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">Dipublikasikan</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                   <div className="flex items-center space-x-2 pt-8">
                    <Checkbox
                      id="is_popular"
                      checked={formData.is_popular}
                      onCheckedChange={(checked) => handleCheckboxChange("is_popular", !!checked)}
                    />
                    <Label htmlFor="is_popular">Tandai sebagai produk populer</Label>
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="show_on_homepage"
                    checked={formData.show_on_homepage}
                    onCheckedChange={(checked) => handleCheckboxChange("show_on_homepage", !!checked)}
                  />
                  <Label htmlFor="show_on_homepage">Tampilkan di Homepage</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={5} required />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="care">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Perawatan</CardTitle>
                <CardDescription>Detail cara merawat tanaman.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Care Instructions Fields */}
                {Object.keys(formData.careInstructions).map((key) => (
                  <div className="space-y-2" key={key}>
                    <Label htmlFor={key} className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                    <Textarea
                      id={key}
                      name={key}
                      // @ts-ignore
                      value={formData.careInstructions[key]}
                      onChange={handleCareInstructionsChange}
                      rows={2}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="images" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gambar Produk</CardTitle>
                <CardDescription>Unggah gambar untuk produk ini.</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  onImageUploaded={(url, path) => {
                    setFormData(prev => ({ ...prev, image_url: url, image_path: path, }));
                  }}
                  onError={(errorMsg) => { // Changed from 'error' to 'errorMsg' to avoid conflict
                    toast({ title: "Error", description: errorMsg, variant: "destructive" });
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
