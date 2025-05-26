// app/product/[id]/page.tsx
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ArrowLeft, Heart, MessageCircle, ShoppingCart, Loader2 } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ProductQRCode from "@/components/product-qr-code"
import Header from "@/components/header"
import { useAuth } from "@/contexts/auth-context"
import { useCart } from "@/contexts/cart-context"
import { getProductById, type Product } from "@/lib/products"
import { storeNavigationPath } from "@/lib/navigation-utils"
import { toast } from "@/components/ui/use-toast"

export default function ProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { addItem } = useCart()
  const productId = Number.parseInt(params.id)
  const [isFavorite, setIsFavorite] = useState(false)
  const [contactFormOpen, setContactFormOpen] = useState(false)
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Store current path for back navigation
  useEffect(() => {
    if (pathname) {
      storeNavigationPath(pathname)
    }
  }, [pathname])

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true)
      try {
        const productData = await getProductById(productId)
        setProduct(productData)
      } catch (error) {
        console.error("Error loading product:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [productId])

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="container py-12 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Produk tidak ditemukan</h1>
          <p className="mb-6">Maaf, produk yang Anda cari tidak tersedia.</p>
          <Button onClick={() => router.push("/")}>Kembali ke Beranda</Button>
        </div>
      </div>
    )
  }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would send the message to the seller
    alert(`Pesan Anda telah dikirim ke ${product.seller?.name}. Mereka akan segera menghubungi Anda.`)
    setContactFormOpen(false)
    setContactForm({
      name: "",
      email: "",
      message: "",
    })
  }

  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setContactForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddToCart = () => {
    if (product.is_published === false) {
      toast({
        title: "Produk Draft",
        description: "Produk ini masih dalam status draft dan tidak dapat ditambahkan ke keranjang.",
        variant: "destructive",
      })
      return;
    }
    if (!user) {
      // Redirect to login if not authenticated
      router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    })
  }

  const handleBuyNow = () => {
     if (product.is_published === false) {
      toast({
        title: "Produk Draft",
        description: "Produk ini masih dalam status draft dan tidak dapat dipesan.",
        variant: "destructive",
      })
      return;
    }
    if (!user) {
      // Redirect to login if not authenticated
      router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    // Store current path before navigating
    storeNavigationPath(pathname)

    // Add to cart and redirect to checkout
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    })

    router.push("/cart")
  }

  const handleContactSeller = () => {
    if (!user) {
      // Redirect to login if not authenticated
      router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    // Pre-fill form with user data
    setContactForm({
      name: user.user_metadata?.name || "",
      email: user.email || "",
      message: `Saya tertarik dengan ${product.name}. Mohon informasi lebih lanjut.`,
    })
    setContactFormOpen(true)
  }

  const careInstructions = product.care_instructions || {
    light: "Informasi tidak tersedia",
    water: "Informasi tidak tersedia",
    soil: "Informasi tidak tersedia",
    humidity: "Informasi tidak tersedia",
    temperature: "Informasi tidak tersedia",
    fertilizer: "Informasi tidak tersedia",
  }

  const seller = product.seller || {
    name: "Toko BenihKu",
    rating: 4.5,
    response_time: "± 1 jam",
  }
  
  const isProductDraft = product.is_published === false;


  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container py-12">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="relative">
            <Image
              src={product.image || "/placeholder.svg?height=500&width=500"}
              alt={product.name}
              width={500}
              height={500}
              className="w-full rounded-lg object-cover"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-10 w-10 rounded-full bg-white dark:bg-gray-800"
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
              <span className="sr-only">Add to favorites</span>
            </Button>
            {product.is_popular && !isProductDraft && <Badge className="absolute left-4 top-4 bg-green-600 z-10">Populer</Badge>}
            {isProductDraft && (
              <Badge
                variant="outline"
                className="absolute left-4 top-4 bg-yellow-500 text-white border-yellow-600 z-10"
              >
                Draft
              </Badge>
            )}
          </div>

          <div>
            <div className="mb-6">
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{product.category}</p>
              <div className="mt-4 flex items-center">
                <p className="text-2xl font-bold">Rp {product.price.toLocaleString("id-ID")}</p>
              </div>
            </div>
            
            {isProductDraft && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>
                  Produk ini adalah draft dan tidak dapat dibeli atau ditambahkan ke keranjang.
                </AlertDescription>
              </Alert>
            )}


            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Deskripsi</h2>
              <p className="text-gray-700 dark:text-gray-300">{product.description}</p>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{seller.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{seller.name}</p>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <span className="mr-2">⭐ {seller.rating}</span>
                    <span>Respon {seller.response_time}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                onClick={handleBuyNow}
                disabled={isProductDraft}
              >
                Beli Sekarang
              </Button>
              <Button
                variant="outline"
                className="flex-1 dark:border-green-700 dark:text-green-400"
                onClick={handleAddToCart}
                disabled={isProductDraft}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Tambah ke Keranjang
              </Button>
              <Dialog open={contactFormOpen} onOpenChange={setContactFormOpen}>
                <Button variant="outline" className="flex-1" onClick={handleContactSeller}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Hubungi Penjual
                </Button>
                <DialogContent>
                  <form onSubmit={handleContactSubmit}>
                    <DialogHeader>
                      <DialogTitle>Hubungi Penjual</DialogTitle>
                      <DialogDescription>
                        Kirim pesan ke {seller.name} tentang {product.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Nama</Label>
                        <Input
                          id="name"
                          name="name"
                          value={contactForm.name}
                          onChange={handleContactFormChange}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={contactForm.email}
                          onChange={handleContactFormChange}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="message">Pesan</Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={contactForm.message}
                          onChange={handleContactFormChange}
                          rows={4}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        Kirim Pesan
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <ProductQRCode productId={product.id} productName={product.name} />
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <Tabs defaultValue="care" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="care">Cara Merawat</TabsTrigger>
            <TabsTrigger value="details">Detail Produk</TabsTrigger>
          </TabsList>
          <TabsContent value="care" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border p-4 dark:border-gray-700">
                <h3 className="font-semibold mb-2">Cahaya</h3>
                <p className="dark:text-gray-300">{careInstructions.light}</p>
              </div>
              <div className="rounded-lg border p-4 dark:border-gray-700">
                <h3 className="font-semibold mb-2">Penyiraman</h3>
                <p className="dark:text-gray-300">{careInstructions.water}</p>
              </div>
              <div className="rounded-lg border p-4 dark:border-gray-700">
                <h3 className="font-semibold mb-2">Media Tanam</h3>
                <p className="dark:text-gray-300">{careInstructions.soil}</p>
              </div>
              <div className="rounded-lg border p-4 dark:border-gray-700">
                <h3 className="font-semibold mb-2">Kelembaban</h3>
                <p className="dark:text-gray-300">{careInstructions.humidity}</p>
              </div>
              <div className="rounded-lg border p-4 dark:border-gray-700">
                <h3 className="font-semibold mb-2">Suhu</h3>
                <p className="dark:text-gray-300">{careInstructions.temperature}</p>
              </div>
              <div className="rounded-lg border p-4 dark:border-gray-700">
                <h3 className="font-semibold mb-2">Pemupukan</h3>
                <p className="dark:text-gray-300">{careInstructions.fertilizer}</p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="details">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 rounded-lg border p-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Kategori</h3>
                  <p>{product.category}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Penjual</h3>
                  <p>{seller.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Rating Penjual</h3>
                  <p>⭐ {seller.rating}/5</p>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">Deskripsi Lengkap</h3>
                <p className="text-gray-700">{product.description}</p>
                <p className="mt-4 text-gray-700">
                  Tanaman ini dikirim dalam pot plastik berukuran sesuai dengan ukuran tanaman. Untuk hasil terbaik,
                  segera pindahkan ke pot yang lebih besar setelah menerima tanaman.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-8" />

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">QR Code Produk</h2>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-white p-4 rounded-lg border">
              <QRCodeSVG
                value={typeof window !== "undefined" ? `${window.location.origin}/product/${product.id}` : `/product/${product.id}`}
                size={150}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"H"}
                includeMargin={false}
              />
            </div>
            <div>
              <p className="text-gray-700 mb-2">
                Scan QR code ini untuk membagikan produk ini dengan teman atau keluarga.
              </p>
              <p className="text-gray-700">
                Anda juga dapat mengklik tombol bagikan di atas untuk menyalin link atau mengunduh QR code.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
