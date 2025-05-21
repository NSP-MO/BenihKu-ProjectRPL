// app/admin/setup/page.tsx
"use client"

import { useState, useEffect, FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Leaf, Package, Settings, ShoppingBag, LogOut, BarChart3, Save, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { getAllSettings, updateSetting, AppSetting } from "@/lib/settings" // Import settings functions
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AdminSetupPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<AppSetting[]>([])
  const [homepageProductLimit, setHomepageProductLimit] = useState<string>("")

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true)
      try {
        const fetchedSettings = await getAllSettings()
        setSettings(fetchedSettings)
        const limitSetting = fetchedSettings.find(s => s.key === 'homepage_product_limit')
        setHomepageProductLimit(limitSetting?.value || "6") // Default to 6 if not found
      } catch (error) {
        console.error("Failed to load settings:", error)
        toast({
          title: "Error",
          description: "Gagal memuat pengaturan.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const parsedLimit = parseInt(homepageProductLimit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) { // Basic validation
        toast({
          title: "Input Tidak Valid",
          description: "Jumlah produk harus antara 1 dan 50.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const result = await updateSetting('homepage_product_limit', homepageProductLimit)
      if (result.success) {
        toast({
          title: "Sukses",
          description: "Pengaturan berhasil disimpan.",
        })
      } else {
        throw new Error(result.error || "Gagal menyimpan pengaturan.")
      }
    } catch (error: any) {
      console.error("Failed to save settings:", error)
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan pengaturan.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  // You can keep your existing StorageSetup and DatabaseSetup components if they were here
  // For this example, I'll focus on the new setting.

  return (
    <ProtectedRoute adminOnly>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col bg-background border-r dark:border-gray-800">
          <div className="flex h-16 items-center border-b dark:border-gray-800 px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Leaf className="h-6 w-6 text-green-600 dark:text-green-500" />
              <span className="text-xl">BenihKu</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground transition-all"
              >
                <Package className="h-4 w-4" />
                Produk
              </Link>
              <Link
                href="/admin/orders"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground transition-all"
              >
                <ShoppingBag className="h-4 w-4" />
                Pesanan
              </Link>
               <Link
                href="/admin/analytics"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground transition-all"
              >
                <BarChart3 className="h-4 w-4" />
                Analitik
              </Link>
              <Link
                href="/admin/setup"
                className="flex items-center gap-3 rounded-lg bg-accent px-3 py-2 text-accent-foreground transition-all"
              >
                <Settings className="h-4 w-4" />
                Pengaturan
              </Link>
            </nav>
          </div>
           <div className="border-t dark:border-gray-800 p-4">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {user?.user_metadata?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "A"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{user?.user_metadata?.name || user?.email}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground mt-2"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b dark:border-gray-800 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
             <div className="md:hidden flex items-center gap-2 font-semibold">
              <Leaf className="h-6 w-6 text-green-600 dark:text-green-500" />
              <span className="text-xl">BenihKu</span>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="md:hidden" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Keluar</span>
              </Button>
            </div>
          </header>
          <main className="grid flex-1 items-start gap-4 p-4 md:gap-8 md:p-8">
            <h1 className="text-2xl font-bold">Pengaturan Aplikasi</h1>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : (
              <form onSubmit={handleSaveSettings}>
                <Card>
                  <CardHeader>
                    <CardTitle>Pengaturan Tampilan Homepage</CardTitle>
                    <CardDescription>
                      Atur jumlah produk populer yang ditampilkan di halaman utama.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="homepageProductLimit">Jumlah Produk Populer di Homepage</Label>
                      <Input
                        id="homepageProductLimit"
                        type="number"
                        min="1"
                        max="50" // Example max, adjust as needed
                        value={homepageProductLimit}
                        onChange={(e) => setHomepageProductLimit(e.target.value)}
                        className="max-w-xs"
                      />
                       <p className="text-xs text-muted-foreground">
                        Masukkan angka antara 1 dan 50.
                      </p>
                    </div>
                  </CardContent>
                  <CardHeader>
                    <CardTitle>Pengaturan Lainnya</CardTitle>
                     <CardDescription>
                        Pengaturan aplikasi lainnya dapat ditambahkan di sini.
                     </CardDescription>
                  </CardHeader>
                  <CardContent>
                     {/* Placeholder for other settings if you expand this page */}
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Informasi</AlertTitle>
                        <AlertDescription>
                          Bagian pengaturan lainnya sedang dalam pengembangan.
                        </AlertDescription>
                      </Alert>
                  </CardContent>
                  <div className="px-6 py-4 border-t">
                     <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                      {isSaving ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                      ) : (
                        <><Save className="mr-2 h-4 w-4" /> Simpan Pengaturan</>
                      )}
                    </Button>
                  </div>
                </Card>
              </form>
            )}

            {/* You can keep your existing setup components if needed */}
            {/* <StorageSetup /> */}
            {/* <DatabaseSetup /> */}

          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
