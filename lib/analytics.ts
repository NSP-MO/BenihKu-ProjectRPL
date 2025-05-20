"use server"

import { createServerSupabaseClient } from "@/lib/supabase"

export type ProductAnalytics = {
  id: number
  name: string
  views: number
  sales: number
  revenue: number
}

export type CategoryAnalytics = {
  category: string
  products: number
  sales: number
  revenue: number
}

export async function getProductAnalytics() {
  const supabase = createServerSupabaseClient()

  try {
    // In a real app, this would query actual analytics data
    // For now, we'll simulate it by joining products with orders
    const { data: products, error: productsError } = await supabase.from("products").select("*")

    if (productsError) {
      console.error("Error fetching products for analytics:", productsError)
      return { products: [], categories: [] }
    }

    // Generate simulated analytics data
    const productAnalytics: ProductAnalytics[] = products.map((product) => {
      // Generate random analytics data for demonstration
      const views = Math.floor(Math.random() * 1000) + 50
      const sales = Math.floor(Math.random() * 50)
      const revenue = sales * product.price

      return {
        id: product.id,
        name: product.name,
        views,
        sales,
        revenue,
      }
    })

    // Group by category
    const categoriesMap = new Map<string, CategoryAnalytics>()

    products.forEach((product) => {
      const category = product.category
      const existingCategory = categoriesMap.get(category)

      // Generate random sales for this product
      const sales = Math.floor(Math.random() * 50)
      const revenue = sales * product.price

      if (existingCategory) {
        categoriesMap.set(category, {
          category,
          products: existingCategory.products + 1,
          sales: existingCategory.sales + sales,
          revenue: existingCategory.revenue + revenue,
        })
      } else {
        categoriesMap.set(category, {
          category,
          products: 1,
          sales,
          revenue,
        })
      }
    })

    const categoryAnalytics = Array.from(categoriesMap.values())

    return {
      products: productAnalytics,
      categories: categoryAnalytics,
    }
  } catch (error) {
    console.error("Error generating analytics:", error)
    return { products: [], categories: [] }
  }
}
