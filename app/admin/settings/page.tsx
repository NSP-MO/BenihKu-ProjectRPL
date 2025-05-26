"use client"
import Link from "next/link"
import type React from "react"

import { useState, useEffect } from "react"
import { ArrowLeft, Loader2, Save, Database } from "lucide-react" // Renamed SettingsIcon to avoid conflict and added Database import
import { Button } from "@/components/ui/button"
import StorageSetup from "@/components/storage-setup"
import ProtectedRoute from "@/components/protected-route"
import { StorageRLSSetup } from "@/components/storage-rls-setup"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase" // Assuming supabase client is exported from here
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getHomepageProductLimitSetting, updateHomepageProductLimitSetting } from "@/lib/settings" // Ensure this path is correct
import { toast } from "@/components/ui/use-toast"

export default function PengaturanPage() {
  const [isLoadingDbAction, setIsLoadingDbAction] = useState(false)
  const [dbActionResult, setDbActionResult] = useState<{ success: boolean; message: string } | null>(null)

  const [homepageProductLimit, setHomepageProductLimit] = useState<number>(6) // Default
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

  const addMoreProductsViaSQL = async () => {
    setIsLoadingDbAction(true)
    setDbActionResult(null)
    try {
      // This API route needs to exist and correctly fetch/execute 'add-more-products.sql'
      const response = await fetch("/api/get-sql-script?file=add-more-products.sql")
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Gagal mengambil skrip SQL: ${response.status} ${errorData}`)
      }
      const sqlScript = await response.text()

      // Ensure your Supabase instance has an RPC function named `exec_sql` or adjust as needed.
      // This RPC function should be defined in your Supabase database to execute arbitrary SQL.
      // Example: CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT) RETURNS void AS $$ BEGIN EXECUTE sql_query; END; $$ LANGUAGE plpgsql;
      const { error: rpcError } = await supabase.rpc("exec_sql", { sql_query: sqlScript })
      if (rpcError) throw rpcError

      setDbActionResult({ success: true, message: "Berhasil menambahkan lebih banyak produk!" })
      toast({ title: "Sukses", description: "Produk tambahan berhasil dimuat." })
    } catch (error: any) {
      console.error("Error adding more products:", error)
      setDbActionResult({ success: false, message: `Error: ${error.message || "Gagal menambahkan produk."}` })
      toast({ title: "Error", description: error.message || "Gagal memuat produk tambahan.", variant: "destructive" })
    } finally {
      setIsLoadingDbAction(false)
    }
  }

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      setHomepageProductLimit(value)
    } else if (e.target.value === "") {
      setHomepageProductLimit(0) // Or handle as empty string / default
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
        <Link href="/admin" className="inline-flex items-center mb-6">
          <Button variant="ghost" className="p-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dashboard
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Pengaturan</h1>
        </div>

        <Tabs defaultValue="display" className="w-full mb-8">
          {" "}
          {/* Changed default to display */}
          <TabsList>
            <TabsTrigger value="display">Tampilan</TabsTrigger>
            <TabsTrigger value="storage">Penyimpanan</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
          </TabsList>
          {/* Tab Content for Display Settings */}
          <TabsContent value="display" className="mt-4">
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
                <Button onClick={handleSaveHomepageLimit} disabled={isLimitSaving || isLimitLoading}>
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
          </TabsContent>
          <TabsContent value="storage" className="mt-4">
            <div>
              <h2 className="text-xl font-semibold mb-4">Pengaturan Penyimpanan</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Konfigurasi bucket penyimpanan untuk unggahan gambar.
              </p>
              <div className="space-y-6">
                <StorageSetup />
                <StorageRLSSetup />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="database" className="mt-4">
            <div>
              <h2 className="text-xl font-semibold mb-4">Manajemen Database</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Kelola tabel dan data database Anda.</p>

              {dbActionResult && (
                <Alert
                  className={`mb-6 ${dbActionResult.success ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900" : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900"}`}
                >
                  <AlertTitle>{dbActionResult.success ? "Berhasil!" : "Gagal!"}</AlertTitle>
                  <AlertDescription>{dbActionResult.message}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Tambah Produk Tambahan</CardTitle>
                    <CardDescription>Jalankan skrip SQL untuk menambah produk.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Aksi ini akan menjalankan skrip SQL `add-more-products.sql`.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={addMoreProductsViaSQL}
                      disabled={isLoadingDbAction}
                    >
                      {isLoadingDbAction ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <Database className="mr-2 h-4 w-4" />
                          Jalankan Skrip Produk
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
                {/* You can add more database related actions here */}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
