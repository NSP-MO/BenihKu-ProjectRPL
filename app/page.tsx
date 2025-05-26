import Link from "next/link"
import { Leaf } from "lucide-react"

import { Button } from "@/components/ui/button"
import PlantGrid from "@/components/plant-grid"
import Header from "@/components/header"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Seksi Hero */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-emerald-50 dark:bg-green-950">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Temukan Tanaman Impian Anda
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 dark:text-gray-400 md:text-xl">
                  Koleksi tanaman hias dan tanaman indoor berkualitas tinggi untuk mempercantik ruangan Anda.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/categories">
                  <Button className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800">
                    Jelajahi Koleksi
                  </Button>
                </Link>
                <Link href="/scanner">
                  <Button variant="outline" className="dark:border-green-700 dark:text-green-400">
                    Scan QR Code
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Seksi Tanaman Populer */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Tanaman Populer</h2>
                <p className="mx-auto max-w-[700px] text-gray-500 dark:text-gray-400 md:text-xl">
                  Tanaman yang paling banyak dicari oleh pelanggan kami.
                </p>
              </div>
            </div>
            <PlantGrid showPopular={true} />
          </div>
        </section>

        {/* Seksi Cara Menggunakan QR Scanner */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-emerald-50 dark:bg-green-950">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Cara Menggunakan QR Scanner</h2>
                <p className="mx-auto max-w-[700px] text-gray-500 dark:text-gray-400 md:text-xl">
                  Scan QR code pada tanaman di toko kami untuk melihat informasi lengkap dan cara perawatannya.
                </p>
              </div>
              <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 dark:border-gray-700">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-800">
                    <span className="text-xl font-bold text-emerald-700 dark:text-emerald-200">1</span>
                  </div>
                  <h3 className="text-xl font-bold">Buka QR Scanner</h3>
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    Klik tombol "QR Scanner" di menu navigasi atau halaman beranda.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 dark:border-gray-700">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-800">
                    <span className="text-xl font-bold text-emerald-700 dark:text-emerald-200">2</span>
                  </div>
                  <h3 className="text-xl font-bold">Scan QR Code</h3>
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    Arahkan kamera ke QR code yang terdapat pada label tanaman.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 dark:border-gray-700 sm:col-span-2 lg:col-span-1 sm:max-w-sm sm:mx-auto">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-800">
                    <span className="text-xl font-bold text-emerald-700 dark:text-emerald-200">3</span>
                  </div>
                  <h3 className="text-xl font-bold">Lihat Informasi</h3>
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    Dapatkan informasi lengkap tentang tanaman dan cara perawatannya.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t bg-background py-8 dark:border-gray-800">
        <div className="container flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo section with flex-1 for desktop */}
          <div className="md:flex-1 flex items-center justify-center md:justify-start gap-2">
            <Leaf className="h-6 w-6 text-green-600 dark:text-green-500" />
            <span className="text-xl font-semibold">BenihKu</span>
          </div>
          {/* Copyright notice - centered text */}
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center order-last md:order-none md:flex-shrink-0">
            © 2025 BenihKu. Semua hak dilindungi.
          </p>
          {/* Links section with flex-1 and content justified to the end for desktop */}
          <div className="md:flex-1 flex justify-center md:justify-end gap-4 sm:gap-6">
            <Link href="#" className="text-sm font-medium hover:text-green-600 dark:hover:text-green-500">
              Syarat & Ketentuan
            </Link>
            <Link href="#" className="text-sm font-medium hover:text-green-600 dark:hover:text-green-500">
              Kebijakan Privasi
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
