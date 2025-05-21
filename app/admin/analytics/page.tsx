"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react" 
import Link from "next/link" 
import { useRouter } from "next/navigation" 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AnalyticsChart from "@/components/analytics-chart"
import { Loader2, ArrowUp, ArrowDown, ArrowUpDown, ArrowLeft, RefreshCw } from "lucide-react" 
import ProtectedRoute from "@/components/protected-route"
import { getRealAnalytics, type ProductAnalyticsData, type CategoryAnalyticsData } from "@/lib/analytics"
import { Button } from "@/components/ui/button" 

type SortConfig<T> = {
  key: keyof T;
  direction: 'ascending' | 'descending';
} | null;


export default function AnalyticsPage() {
  const router = useRouter(); 
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [productAnalytics, setProductAnalytics] = useState<ProductAnalyticsData[]>([])
  const [categoryAnalytics, setCategoryAnalytics] = useState<CategoryAnalyticsData[]>([])
  const [overallAnalytics, setOverallAnalytics] = useState({ totalSales: 0, totalRevenue: 0 })

  const [productSortConfig, setProductSortConfig] = useState<SortConfig<ProductAnalyticsData>>({ key: 'sales', direction: 'descending' });
  const [categorySortConfig, setCategorySortConfig] = useState<SortConfig<CategoryAnalyticsData>>({ key: 'category', direction: 'ascending' });

  const fetchData = useCallback(async (isRefresh = false) => {
    if(isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    console.log("AnalyticsPage: Calling getRealAnalytics...");
    try {
      const analytics = await getRealAnalytics()
      console.log("AnalyticsPage: Data received:", analytics); 
      setProductAnalytics(analytics.products)
      setCategoryAnalytics(analytics.categories)
      setOverallAnalytics(analytics.overall)
    } catch (error) {
      console.error("AnalyticsPage: Failed to fetch analytics data:", error)
      setProductAnalytics([])
      setCategoryAnalytics([])
      setOverallAnalytics({ totalSales: 0, totalRevenue: 0 })
    } finally {
      if(isRefresh) setIsRefreshing(false);
      else setIsLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchData(); 
  }, [fetchData]) 

  const sortedProductAnalytics = useMemo(() => {
    let sortableItems = [...productAnalytics];
    if (productSortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[productSortConfig.key as keyof ProductAnalyticsData];
        const valB = b[productSortConfig.key as keyof ProductAnalyticsData];
        let comparison = 0;
        if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        }
        return productSortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [productAnalytics, productSortConfig]);

  const requestProductSort = (key: keyof ProductAnalyticsData) => {
    let currentDirection = productSortConfig?.direction;
    let nextDirection: 'ascending' | 'descending';
    if (productSortConfig && productSortConfig.key === key) {
      nextDirection = currentDirection === 'ascending' ? 'descending' : 'ascending';
    } else {
      nextDirection = key === 'name' ? 'ascending' : 'descending';
    }
    setProductSortConfig({ key, direction: nextDirection });
  };

  const sortedCategoryAnalytics = useMemo(() => {
    let sortableItems = [...categoryAnalytics];
    if (categorySortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[categorySortConfig.key as keyof CategoryAnalyticsData];
        const valB = b[categorySortConfig.key as keyof CategoryAnalyticsData];
        let comparison = 0;
        if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        }
        return categorySortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [categoryAnalytics, categorySortConfig]);

  const requestCategorySort = (key: keyof CategoryAnalyticsData) => {
    let currentDirection = categorySortConfig?.direction;
    let nextDirection: 'ascending' | 'descending';
    if (categorySortConfig && categorySortConfig.key === key) {
      nextDirection = currentDirection === 'ascending' ? 'descending' : 'ascending';
    } else {
      nextDirection = key === 'category' ? 'ascending' : 'descending';
    }
    setCategorySortConfig({ key, direction: nextDirection });
  };

  const getSortIndicatorIcon = <T,>(key: keyof T, sortConfig: SortConfig<T>) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-1 h-4 w-4 opacity-30 flex-shrink-0" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp className="ml-1 h-4 w-4 flex-shrink-0" />;
    }
    return <ArrowDown className="ml-1 h-4 w-4 flex-shrink-0" />;
  };
  
  const topSalesProductsData = useMemo(() => {
    const sortedBySales = [...productAnalytics].sort((a, b) => b.sales - a.sales);
    return {
      labels: sortedBySales.slice(0, 5).map(p => p.name.length > 12 ? p.name.substring(0, 10) + "..." : p.name),
      values: sortedBySales.slice(0, 5).map(p => p.sales),
    };
  }, [productAnalytics]);

  const topRevenueProductsData = useMemo(() => {
    const sortedByRevenue = [...productAnalytics].sort((a, b) => b.revenue - a.revenue);
    return {
      labels: sortedByRevenue.slice(0, 5).map(p => p.name.length > 12 ? p.name.substring(0, 10) + "..." : p.name),
      values: sortedByRevenue.slice(0, 5).map(p => p.revenue),
    };
  }, [productAnalytics]);

  const salesByCategoryData = useMemo(() => {
    const sortedBySales = [...categoryAnalytics].sort((a,b) => b.sales - a.sales);
    return {
        labels: sortedBySales.map(c => c.category),
        values: sortedBySales.map(c => c.sales),
    }
  }, [categoryAnalytics]);

  const revenueByCategoryData = useMemo(() => {
    const sortedByRevenue = [...categoryAnalytics].sort((a,b) => b.revenue - a.revenue);
    return {
        labels: sortedByRevenue.map(c => c.category),
        values: sortedByRevenue.map(c => c.revenue),
    }
  }, [categoryAnalytics]);

  if (isLoading && !isRefreshing) { 
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
        <div className="flex items-center justify-between mb-6"> 
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => router.push('/admin')} className="mr-4"> 
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Analitik Produk</h1>
          </div>
          <Button variant="outline" onClick={() => fetchData(true)} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh Data
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Penjualan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overallAnalytics.totalSales.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendapatan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {overallAnalytics.totalRevenue.toLocaleString("id-ID")}
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
                  Analisis performa produk berdasarkan penjualan dan pendapatan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>Analisis performa produk.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px] cursor-pointer hover:bg-muted/50" onClick={() => requestProductSort('name')}>
                        <div className="flex items-center">Nama {getSortIndicatorIcon('name', productSortConfig)}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestProductSort('sales')}>
                         <div className="flex items-center">Penjualan {getSortIndicatorIcon('sales', productSortConfig)}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestProductSort('revenue')}>
                        <div className="flex items-center">Pendapatan {getSortIndicatorIcon('revenue', productSortConfig)}</div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedProductAnalytics.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-center">Tidak ada data produk untuk ditampilkan.</TableCell></TableRow>
                    ) : (
                        sortedProductAnalytics.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.sales.toLocaleString()}</TableCell>
                            <TableCell>Rp {product.revenue.toLocaleString("id-ID")}</TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <AnalyticsChart
                title="Produk Terlaris (Top 5)"
                description="Produk dengan penjualan tertinggi"
                type="bar"
                data={topSalesProductsData}
              />
              <AnalyticsChart
                title="Pendapatan per Produk (Top 5)"
                description="Produk dengan pendapatan tertinggi"
                type="pie"
                data={topRevenueProductsData}
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
                      <TableHead className="w-[200px] cursor-pointer hover:bg-muted/50" onClick={() => requestCategorySort('category')}>
                         <div className="flex items-center">Kategori {getSortIndicatorIcon('category', categorySortConfig)}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestCategorySort('productCount')}>
                         <div className="flex items-center">Jumlah Produk {getSortIndicatorIcon('productCount', categorySortConfig)}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestCategorySort('sales')}>
                         <div className="flex items-center">Penjualan {getSortIndicatorIcon('sales', categorySortConfig)}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestCategorySort('revenue')}>
                         <div className="flex items-center">Pendapatan {getSortIndicatorIcon('revenue', categorySortConfig)}</div>
                      </TableHead>
                      <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => requestCategorySort('avgRevenuePerProduct')}>
                         <div className="flex items-center justify-end">Rata-rata Pendapatan per Produk {getSortIndicatorIcon('avgRevenuePerProduct', categorySortConfig)}</div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {sortedCategoryAnalytics.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center">Tidak ada data kategori untuk ditampilkan.</TableCell></TableRow>
                    ) : (
                        sortedCategoryAnalytics.map((category) => (
                          <TableRow key={category.id}>
                            <TableCell className="font-medium">{category.category}</TableCell>
                            <TableCell>{category.productCount}</TableCell>
                            <TableCell>{category.sales.toLocaleString()}</TableCell>
                            <TableCell>Rp {category.revenue.toLocaleString("id-ID")}</TableCell>
                            <TableCell className="text-right">
                              Rp {category.avgRevenuePerProduct !== undefined ? category.avgRevenuePerProduct.toLocaleString("id-ID") : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <AnalyticsChart
                title="Penjualan per Kategori"
                description="Kategori dengan penjualan tertinggi"
                type="bar"
                data={salesByCategoryData}
              />
              <AnalyticsChart
                title="Pendapatan per Kategori"
                description="Kategori dengan pendapatan tertinggi"
                type="pie"
                data={revenueByCategoryData}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
