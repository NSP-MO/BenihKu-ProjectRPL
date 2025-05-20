"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Product {
  id: number
  name: string
  price: number
  category: string
  is_popular: boolean
  stock: number
  image: string
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, category, is_popular, stock, image")
        .order("id", { ascending: true })

      if (error) {
        throw error
      }

      setProducts(data || [])
    } catch (err: any) {
      console.error("Error fetching products:", err)
      setError(err.message || "Failed to fetch products")
    } finally {
      setLoading(false)
    }
  }

  const updateStock = async (id: number, newStock: number) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const { error } = await supabase.from("products").update({ stock: newStock }).eq("id", id)

      if (error) {
        throw error
      }

      setSuccess(`Stock updated successfully for product #${id}`)

      // Update local state
      setProducts(products.map((product) => (product.id === id ? { ...product, stock: newStock } : product)))
    } catch (err: any) {
      console.error("Error updating stock:", err)
      setError(err.message || "Failed to update stock")
    } finally {
      setLoading(false)
    }
  }

  const togglePopular = async (id: number, currentStatus: boolean) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const { error } = await supabase.from("products").update({ is_popular: !currentStatus }).eq("id", id)

      if (error) {
        throw error
      }

      setSuccess(`Popular status toggled for product #${id}`)

      // Update local state
      setProducts(products.map((product) => (product.id === id ? { ...product, is_popular: !currentStatus } : product)))
    } catch (err: any) {
      console.error("Error toggling popular status:", err)
      setError(err.message || "Failed to toggle popular status")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 border-green-600">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Product Management</CardTitle>
          <CardDescription>View and manage your plant products</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center p-8">
              <p>No products found. Please add some products to your database.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Price</th>
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-left">Popular</th>
                    <th className="px-4 py-2 text-left">Stock</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-2">{product.id}</td>
                      <td className="px-4 py-2">{product.name}</td>
                      <td className="px-4 py-2">Rp {product.price.toLocaleString()}</td>
                      <td className="px-4 py-2">
                        <Badge variant="outline">{product.category}</Badge>
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          className="cursor-pointer"
                          variant={product.is_popular ? "default" : "outline"}
                          onClick={() => togglePopular(product.id, product.is_popular)}
                        >
                          {product.is_popular ? "Yes" : "No"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateStock(product.id, Math.max(0, product.stock - 1))}
                            disabled={product.stock <= 0}
                          >
                            -
                          </Button>
                          <span>{product.stock}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateStock(product.id, product.stock + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={fetchProducts} variant="outline" className="mr-2">
            Refresh
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">Add New Product</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
