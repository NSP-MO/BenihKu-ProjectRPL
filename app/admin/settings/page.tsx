"use client"
import Link from "next/link"
import type React from "react"

import { useState, useEffect } from "react"
import { ArrowLeft, Loader2, Save } from "lucide-react" // Renamed SettingsIcon to Settings (assuming it's not used, if it is, import it as SettingsIcon)
import { Button } from "@/components/ui/button"
// import StorageSetup from "@/components/storage-setup" // Dihapus karena tab dihilangkan
import ProtectedRoute from "@/components/protected-route"
// import { StorageRLSSetup } from "@/components/storage-rls-setup" // Dihapus karena tab dihilangkan
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert" // Dihapus karena tidak ada aksi database lagi di sini
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // Dihapus karena tab dihilangkan
// import { supabase } from "@/lib/supabase" // Dihapus karena tidak ada aksi database lagi di sini
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getHomepageProductLimitSetting, updateHomepageProductLimitSetting } from "@/lib/settings"
import { toast } from "@/components/ui/use-toast"
// import Header from "@/components/header" // Dihapus jika tidak digunakan

export default function PengaturanPage() {
  // State untuk aksi database dihapus karena tabnya dihilangkan
  // const [isLoadingDbAction, setIsLoadingDbAction] = useState(false)
  // const [dbActionResult, setDbActionResult] = useState<{ success: boolean; message: string } | null>(null)

  const [homepageProductLimit, setHomepageProductLimit] = useState<number>(6)
  const [isLimitLoading, setIsLimitLoading] = useState(true)
  const [isLimitSaving, setIsLimitSaving] = useState(false)

  useEffect(() => {
    const fetchLimit = async () => {
      setIsLimitLoading(true)
      const limit = await getHomepageProductLimitSetting()
      setHomepageProductLimit(limit)
      setIsLimitLoading(false)
    }
    fetchLimit()
  }, [])

  // Fungsi untuk aksi database dihapus
  // const addMoreProductsViaSQL = async () => { ... }

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      setHomepageProductLimit(value)
    } else if (e.target.value === "") {
      setHomepageProductLimit(0) // Atau nilai default lain jika string kosong
    }
  }

  const handleSaveHomepageLimit = async () => {
    setIsLimitSaving(true)
    const result = await updateHomepageProductLimitSetting(homepageProductLimit)
    if (result.success) {
      toast({ title: "Sukses", description: result.message || "Pengaturan berhasil disimpan." })
    } else {
      toast({ title: "Error", description: result.error || "Gagal menyimpan pengaturan.", variant: "destructive" })
    }
    setIsLimitSaving(false)
  }

  return (
    <ProtectedRoute adminOnly>
      <div className="container py-12">
        <Link href="/admin/dashboard" className="inline-flex items-center mb-6">
          <Button variant="ghost" className="p-0 hover:bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dashboard
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Pengaturan Tampilan</h1>
        </div>

        {/* Komponen Tabs dihapus, langsung tampilkan pengaturan tampilan */}
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Tampilan Beranda</CardTitle>
            <CardDescription>Atur jumlah produk populer yang ditampilkan di beranda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLimitLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Memuat pengaturan...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="homepageProductLimit">Jumlah Produk di Beranda</Label>
                <Input
                  id="homepageProductLimit"
                  type="number"
                  value={homepageProductLimit}
                  onChange={handleLimitChange}
                  min="1"
                  max="20"
                  className="w-full md:w-1/3"
                />
                <p className="text-xs text-muted-foreground">Masukkan angka (misal: 4, 6, 8).</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSaveHomepageLimit}
              disabled={isLimitSaving || isLimitLoading}
              className="w-full sm:w-auto"
            >
              {isLimitSaving ? (
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
          </CardFooter>
        </Card>
        {/* Akhir dari konten yang tadinya di dalam TabsContent "display" */}

      </div>
    </ProtectedRoute>
  )
}
