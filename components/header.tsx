"use client"

import Link from "next/link"
import { Leaf, LogOut, ShoppingCart, Menu, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Header() {
  const { user, logout } = useAuth()
  const { totalItems, isLoading: cartLoading } = useCart()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarKey, setAvatarKey] = useState<number>(0) // Add a key to force re-render

  // Fetch the latest avatar URL from the profile
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user || !user.id) {
        console.log("User or user ID is not available yet")
        return
      }

      try {
        // First check user metadata
        if (user.user_metadata?.avatar_url) {
          setAvatarUrl(user.user_metadata.avatar_url)
        }

        // Then check profile table for most up-to-date avatar
        const { data, error } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single()

        if (error) {
          console.error("Error fetching avatar:", error)
          return
        }

        if (data && data.avatar_url) {
          setAvatarUrl(data.avatar_url)
        }
      } catch (error) {
        console.error("Error fetching avatar:", error)
      }
    }

    if (user) {
      fetchAvatar()
    }

    // Set up a listener for auth state changes to refresh avatar
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "USER_UPDATED") {
        fetchAvatar()
        setAvatarKey((prev) => prev + 1) // Force re-render of avatar
      }
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [user])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Leaf className="h-6 w-6 text-green-600" />
          <span className="text-xl">BenihKu</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="ml-auto hidden md:flex gap-6">
          <Link href="/" className="text-sm font-medium transition-colors hover:text-green-600">
            Beranda
          </Link>
          <Link href="/categories" className="text-sm font-medium transition-colors hover:text-green-600">
            Kategori
          </Link>
          <Link href="/scanner" className="text-sm font-medium transition-colors hover:text-green-600">
            QR Scanner
          </Link>
          <Link href="/about" className="text-sm font-medium transition-colors hover:text-green-600">
            Tentang Kami
          </Link>
        </nav>

        <div className="ml-auto md:ml-4 flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <>
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative">
                  {cartLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      <span className="sr-only">Keranjang</span>
                      {totalItems > 0 && (
                        <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-green-600 text-[10px] font-medium text-white flex items-center justify-center">
                          {totalItems}
                        </span>
                      )}
                    </>
                  )}
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    {avatarUrl ? (
                      <div className="h-8 w-8 rounded-full overflow-hidden">
                        <img
                          key={avatarKey} // Add key to force re-render when avatar changes
                          src={`${avatarUrl}?t=${Date.now()}`} // Add timestamp to prevent caching
                          alt="Profile"
                          className="h-full w-full object-cover"
                          crossOrigin="anonymous"
                        />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <span className="text-sm font-medium text-green-600 dark:text-green-300">
                          {user?.user_metadata?.name
                            ? user.user_metadata.name.charAt(0).toUpperCase()
                            : user?.email?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                    <span className="sr-only">Menu Pengguna</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href="/profile" className="flex w-full">
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/orders" className="flex w-full">
                      Pesanan
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem>
                      <Link href="/admin" className="flex w-full">
                        Dashboard Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Keluar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <div className="hidden md:flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Masuk
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button
                    className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                    size="sm"
                  >
                    Daftar
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/" className="text-base font-medium">
                  Beranda
                </Link>
                <Link href="/categories" className="text-base font-medium">
                  Kategori
                </Link>
                <Link href="/scanner" className="text-base font-medium">
                  QR Scanner
                </Link>
                <Link href="/about" className="text-base font-medium">
                  Tentang Kami
                </Link>
                {!user && (
                  <>
                    <Separator className="my-2" />
                    <Link href="/auth/login" className="text-base font-medium">
                      Masuk
                    </Link>
                    <Link href="/auth/signup" className="text-base font-medium">
                      Daftar
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
