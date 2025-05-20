"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AnalyticsChart from "@/components/analytics-chart"
import { Loader2 } from "lucide-react"
import ProtectedRoute from "@/components/protected-route"

// Sample analytics data
const productAnalyticsData = [
  {
    id: 1,
    name: "Monstera Deliciosa",
    views: 850,
    sales: 42,
    revenue: 10500000,
  },
  {
    id: 2,
    name: "Fiddle Leaf Fig",
    views: 720,
    sales: 35,
    revenue: 12250000,
  },
  {
    id: 3,
    name: "Snake Plant",
    views: 600,
    sales: 30,
    revenue: 4500000,
  },
  {
    id: 4,
    name: "Peace Lily",
    views: 550,
    sales: 28,
    revenue: 5040000,
  },
  {
    id: 5,
    name: "ZZ Plant",
    views: 500,
    sales: 25,
    revenue: 5000000,
  },
  {
    id: 6,
    name: "Pothos",
    views: 450,
    sales: 22,
    revenue: 2640000,
  },
]

const categoryAnalyticsData = [
  {
    id: 1,
    category: "Tanaman Hias",
    productCount: 24,
    sales: 120,
    revenue: 25000000,
  },
  {
    id: 2,
    category: "Tanaman Indoor",
    productCount: 18,
    sales: 90,
    revenue: 18000000,
  },
  {
    id: 3,
    category: "Tanaman Outdoor",
    productCount: 15,
    sales: 75,
    revenue: 15000000,
  },
]

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [productAnalytics, setProductAnalytics] = useState(productAnalyticsData)
  const [categoryAnalytics, setCategoryAnalytics] = useState(categoryAnalyticsData)

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <p className="text-sm text-muted-foreground">Memuat data analitik...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute adminOnly>
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">Analitik Produk</h1>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Dilihat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {productAnalytics.reduce((sum, product) => sum + product.views, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Penjualan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {productAnalytics.reduce((sum, product) => sum + product.sales, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendapatan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {productAnalytics.reduce((sum, product) => sum + product.revenue, 0).toLocaleString("id-ID")}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList>
            <TabsTrigger value="products">Produk</TabsTrigger>
            <TabsTrigger value="categories">Kategori</TabsTrigger>
          </TabsList>
          <TabsContent value="products" className="mt-4">
            <Card className="dark:border-gray-800 mb-6">
              <CardHeader>
                <CardTitle>Performa Produk</CardTitle>
                <CardDescription>
                  Analisis performa produk berdasarkan jumlah dilihat, penjualan, dan pendapatan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>Analisis performa produk.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Nama</TableHead>
                      <TableHead>Dilihat</TableHead>
                      <TableHead>Penjualan</TableHead>
                      <TableHead>Pendapatan</TableHead>
                      <TableHead className="text-right">Konversi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productAnalytics.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.views.toLocaleString()}</TableCell>
                        <TableCell>{product.sales.toLocaleString()}</TableCell>
                        <TableCell>Rp {product.revenue.toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-right">
                          {((product.sales / product.views) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <AnalyticsChart
                title="Produk Terlaris"
                description="Produk dengan penjualan tertinggi"
                type="bar"
                data={{
                  labels: productAnalytics
                    .slice(0, 5)
                    .map((p) => (p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name)),
                  values: productAnalytics.slice(0, 5).map((p) => p.sales),
                }}
              />
              <AnalyticsChart
                title="Pendapatan per Produk"
                description="Produk dengan pendapatan tertinggi"
                type="pie"
                data={{
                  labels: productAnalytics
                    .slice(0, 5)
                    .map((p) => (p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name)),
                  values: productAnalytics.slice(0, 5).map((p) => p.revenue),
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="categories" className="mt-4">
            <Card className="dark:border-gray-800 mb-6">
              <CardHeader>
                <CardTitle>Performa Kategori</CardTitle>
                <CardDescription>
                  Analisis performa kategori berdasarkan jumlah produk, penjualan, dan pendapatan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>Analisis performa kategori.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Kategori</TableHead>
                      <TableHead>Jumlah Produk</TableHead>
                      <TableHead>Penjualan</TableHead>
                      <TableHead>Pendapatan</TableHead>
                      <TableHead className="text-right">Rata-rata per Produk</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryAnalytics.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.category}</TableCell>
                        <TableCell>{category.productCount}</TableCell>
                        <TableCell>{category.sales}</TableCell>
                        <TableCell>Rp {category.revenue.toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-right">
                          Rp {Math.round(category.revenue / category.productCount).toLocaleString("id-ID")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <AnalyticsChart
                title="Penjualan per Kategori"
                description="Kategori dengan penjualan tertinggi"
                type="bar"
                data={{
                  labels: categoryAnalytics.map((c) => c.category),
                  values: categoryAnalytics.map((c) => c.sales),
                }}
              />
              <AnalyticsChart
                title="Pendapatan per Kategori"
                description="Kategori dengan pendapatan tertinggi"
                type="pie"
                data={{
                  labels: categoryAnalytics.map((c) => c.category),
                  values: categoryAnalytics.map((c) => c.revenue),
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
