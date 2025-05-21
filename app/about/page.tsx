import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  Leaf,
  Mail,
  MapPin,
  Phone,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function AboutPage() {
  return (
    <div className="container py-12">
      <Link href="/" className="inline-flex items-center mb-6">
        <Button variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      </Link>

      <div className="grid gap-12">
        {/* ---------- Tentang  ---------- */}
        <section>
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 items-center">
            <div>
              <h1 className="text-3xl font-bold mb-4">Tentang BenihKu</h1>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                BenihKu adalah platform e-commerce tanaman terkemuka di Indonesia
                yang menghubungkan pecinta tanaman dengan penjual tanaman
                berkualitas. Kami berkomitmen untuk menyediakan berbagai jenis
                tanaman dengan informasi perawatan yang lengkap dan akurat.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Didirikan pada tahun 2020, BenihKu telah melayani lebih dari
                50 000 pelanggan dan mengirimkan lebih dari 100 000 tanaman ke
                seluruh Indonesia. Kami bekerja sama dengan lebih dari 200
                penjual tanaman terpercaya untuk memastikan kualitas produk yang
                kami tawarkan.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800">
                  Jelajahi Koleksi
                </Button>
                <Button
                  variant="outline"
                  className="dark:border-green-700 dark:text-green-400"
                >
                  Hubungi Kami
                </Button>
              </div>
            </div>
            <div className="order-first md:order-last">
              <Image
                src="https://rgsmubwxaddbakgdzcrf.supabase.co/storage/v1/object/public/images/uploads/Beech-trees.-GettyImages-98871576-5cc0f6f.webp"
                alt="BenihKu Team"
                width={600}
                height={400}
                className="rounded-lg object-cover w-full"
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* ---------- Mengapa memilih kami ---------- */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-center">
            Mengapa Memilih Kami
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {/* kartu 1 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 rounded-full bg-green-100 dark:bg-green-900 p-3">
                    <Leaf className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Kualitas Terjamin
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Semua tanaman kami dipilih dengan teliti dan diperiksa
                    kualitasnya sebelum dikirim ke pelanggan.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* kartu 2 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 rounded-full bg-green-100 p-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Informasi Lengkap
                  </h3>
                  <p className="text-gray-500">
                    Setiap tanaman dilengkapi dengan informasi perawatan yang
                    detail untuk membantu Anda merawat tanaman dengan baik.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* kartu 3 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 rounded-full bg-green-100 p-3">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Dukungan Pelanggan
                  </h3>
                  <p className="text-gray-500">
                    Tim dukungan pelanggan kami siap membantu Anda dengan
                    pertanyaan atau masalah yang Anda hadapi.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* ---------- Hubungi Kami ---------- */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Hubungi Kami</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* kolom informasi */}
            <div>
              <p className="text-gray-700 mb-6">
                Jika Anda memiliki pertanyaan atau ingin mengetahui lebih lanjut
                tentang produk kami, jangan ragu untuk menghubungi kami melalui
                informasi kontak di bawah ini.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Alamat</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Jl. Raya Dramaga, Kampus IPB Dramaga Bogor, 16680 West Java, Indonesia
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      benihku.site@gmail.com
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Telepon</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      +62 895 0757 4743
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* kolom peta */}
            <div>
              <iframe
                src="https://www.google.com/maps?q=-6.5604259,106.7242142&z=14&output=embed"
                width="600"
                height="300"
                className="rounded-lg w-full h-[300px] border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
