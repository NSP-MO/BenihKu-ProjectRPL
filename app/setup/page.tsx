"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

export default function SetupPage() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("instructions")

  const sqlScript = `-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  image TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  is_popular BOOLEAN DEFAULT false,
  care_instructions JSONB,
  seller JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample product data
INSERT INTO products (name, price, image, category, description, is_popular, care_instructions, seller)
VALUES
  (
    'Monstera Deliciosa',
    250000,
    '/placeholder.svg?height=500&width=500',
    'Tanaman Hias',
    'Monstera Deliciosa atau Swiss Cheese Plant adalah tanaman hias populer dengan daun besar berlubang yang unik.',
    true,
    '{
      "light": "Cahaya tidak langsung yang terang.",
      "water": "Siram saat lapisan atas tanah kering.",
      "soil": "Campuran tanah yang kaya nutrisi dengan drainase yang baik.",
      "humidity": "Menyukai kelembaban tinggi.",
      "temperature": "Suhu ideal 18-30°C.",
      "fertilizer": "Pupuk setiap bulan selama musim pertumbuhan."
    }',
    '{
      "name": "Toko Tanaman Sejahtera",
      "rating": 4.8,
      "response_time": "± 1 jam"
    }'
  ),
  (
    'Fiddle Leaf Fig',
    350000,
    '/placeholder.svg?height=500&width=500',
    'Tanaman Indoor',
    'Fiddle Leaf Fig (Ficus lyrata) adalah tanaman indoor populer dengan daun besar berbentuk biola.',
    true,
    '{
      "light": "Cahaya tidak langsung yang terang.",
      "water": "Siram saat 5-7 cm lapisan atas tanah kering.",
      "soil": "Tanah yang kaya nutrisi dengan drainase yang baik.",
      "humidity": "Menyukai kelembaban sedang hingga tinggi.",
      "temperature": "Suhu ideal 18-24°C.",
      "fertilizer": "Pupuk setiap 4-6 minggu selama musim pertumbuhan."
    }',
    '{
      "name": "Garden Center Indonesia",
      "rating": 4.9,
      "response_time": "± 30 menit"
    }'
  ),
  (
    'Snake Plant',
    150000,
    '/placeholder.svg?height=500&width=500',
    'Tanaman Indoor',
    'Snake Plant (Sansevieria) adalah tanaman yang sangat mudah dirawat dengan daun tegak yang kaku.',
    true,
    '{
      "light": "Toleran terhadap berbagai kondisi cahaya.",
      "water": "Siram hanya ketika tanah benar-benar kering.",
      "soil": "Campuran tanah kaktus atau tanah dengan drainase sangat baik.",
      "humidity": "Toleran terhadap kelembaban rendah.",
      "temperature": "Suhu ideal 18-27°C.",
      "fertilizer": "Pupuk ringan setiap 3-4 bulan."
    }',
    '{
      "name": "Kebun Hijau",
      "rating": 4.7,
      "response_time": "± 2 jam"
    }'
  );

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  total_amount INTEGER NOT NULL,
  shipping_info JSONB NOT NULL,
  payment_method TEXT NOT NULL,
  shipping_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container py-12">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Setup Database</CardTitle>
          <CardDescription>
            Siapkan database untuk aplikasi BenihKu dengan menjalankan SQL script di Supabase Dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="instructions">Instruksi</TabsTrigger>
              <TabsTrigger value="sql">SQL Script</TabsTrigger>
            </TabsList>
            <TabsContent value="instructions">
              <div className="space-y-4">
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTitle className="text-yellow-800">Perhatian</AlertTitle>
                  <AlertDescription className="text-yellow-800">
                    Anda perlu menjalankan SQL script di Supabase Dashboard untuk menyiapkan database.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Langkah-langkah Setup Database:</h3>
                  <ol className="list-decimal pl-5 space-y-4">
                    <li>
                      <p>Buka Supabase Dashboard dan pilih project Anda</p>
                      <a
                        href="https://app.supabase.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline flex items-center mt-1"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Buka Supabase Dashboard
                      </a>
                    </li>
                    <li>
                      <p>Pilih "SQL Editor" dari menu sidebar</p>
                    </li>
                    <li>
                      <p>Klik "New Query" untuk membuat query baru</p>
                    </li>
                    <li>
                      <p>
                        Salin SQL script di bawah ini dan paste ke dalam editor SQL
                        <Button variant="outline" size="sm" className="ml-2" onClick={copyToClipboard}>
                          {copied ? (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Disalin!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              Salin SQL
                            </>
                          )}
                        </Button>
                      </p>
                    </li>
                    <li>
                      <p>Klik tombol "Run" untuk menjalankan script</p>
                    </li>
                    <li>
                      <p>Setelah script berhasil dijalankan, kembali ke aplikasi dan refresh halaman</p>
                    </li>
                  </ol>
                </div>

                <Separator className="my-4" />

                <div>
                  <h3 className="text-lg font-semibold mb-2">Tabel yang akan dibuat:</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>products</strong> - Menyimpan data produk tanaman
                    </li>
                    <li>
                      <strong>cart_items</strong> - Menyimpan item di keranjang belanja pengguna
                    </li>
                    <li>
                      <strong>orders</strong> - Menyimpan data pesanan
                    </li>
                    <li>
                      <strong>order_items</strong> - Menyimpan item dalam pesanan
                    </li>
                    <li>
                      <strong>profiles</strong> - Menyimpan data profil pengguna
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="sql">
              <div className="relative">
                <Button variant="outline" size="sm" className="absolute right-2 top-2" onClick={copyToClipboard}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Disalin!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Salin SQL
                    </>
                  )}
                </Button>
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[500px] text-sm">{sqlScript}</pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/")}>
            Kembali ke Beranda
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => {
              setActiveTab("sql")
              setTimeout(() => {
                copyToClipboard()
              }, 100)
            }}
          >
            Lihat SQL Script
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
