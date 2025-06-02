// lib/products.ts
"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { getSetting } from "@/lib/settings"

export type Product = {
  id: number
  name: string
  price: number
  image: string
  category: string
  description: string
  is_popular: boolean
  is_published?: boolean
  stock?: number
  image_path?: string
  image_bucket?: string
  care_instructions?: {
    light: string
    water: string
    soil: string
    humidity: string
    temperature: string
    fertilizer: string
  }
  seller?: {
    name: string
    rating: number
    response_time: string
  }
  status?: string
}

const PRODUCT_GRID_COLUMNS = "id, name, price, image, category, is_popular, is_published, stock" // Tambahkan stock jika diperlukan untuk tampilan

// Tipe untuk filter produk
export type ProductTypeFilter = 'all' | 'tanaman' | 'benih';

export async function getProducts(productTypeFilter: ProductTypeFilter = 'all') {
  const supabase = createServerSupabaseClient()
  try {
    let query = supabase
      .from("products")
      .select(PRODUCT_GRID_COLUMNS)
      .eq("is_published", true)

    if (productTypeFilter === 'tanaman') {
      query = query.neq("category", "Benih")
    } else if (productTypeFilter === 'benih') {
      query = query.eq("category", "Benih")
    }

    const { data, error } = await query.order("id")

    if (error) {
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        console.error("Products table does not exist. Please run the setup process.")
        return []
      }
      console.error("Error fetching products:", error)
      return []
    }
    return data as Product[]
  } catch (error) {
    console.error("Error fetching products:", error)
    return []
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  const supabase = createServerSupabaseClient()
  try {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single()
    if (error) {
      if (error.code === "PGRST116") {
        console.log(`No product found with id ${id}`)
        return null
      }
      console.error(`Error fetching product with id ${id}:`, error)
      return null
    }
    return data as Product
  } catch (error) {
    console.error(`Error fetching product with id ${id}:`, error)
    return null
  }
}

export async function getProductsByCategory(category: string) {
  const supabase = createServerSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_GRID_COLUMNS)
      .eq("category", category)
      .eq("is_published", true)

    if (error) {
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        console.error("Products table does not exist. Please run the setup process.")
        return []
      }
      console.error(`Error fetching products in category ${category}:`, error)
      return []
    }
    return data as Product[]
  } catch (error) {
    console.error(`Error fetching products in category ${category}:`, error)
    return []
  }
}

export async function getPopularProducts(productTypeFilter: ProductTypeFilter = 'all') {
  const supabase = createServerSupabaseClient()
  let limit = 6

  try {
    const limitSetting = await getSetting("homepage_product_limit")
    if (limitSetting && !isNaN(Number.parseInt(limitSetting))) {
      limit = Number.parseInt(limitSetting)
    }
  } catch (e) {
    console.error("Failed to fetch homepage_product_limit setting, using default:", e)
  }

  try {
    let query = supabase
      .from("products")
      .select(PRODUCT_GRID_COLUMNS)
      .eq("is_popular", true)
      .eq("is_published", true)

    if (productTypeFilter === 'tanaman') {
      query = query.neq("category", "Benih")
    } else if (productTypeFilter === 'benih') {
      query = query.eq("category", "Benih")
    }
    
    const { data, error } = await query.limit(limit)

    if (error) {
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        console.error("Products table does not exist. Please run the setup process.")
        return []
      }
      console.error("Error fetching popular products:", error)
      return []
    }
    return data as Product[]
  } catch (error) {
    console.error("Error fetching popular products:", error)
    return []
  }
}

export async function getAllCategories(): Promise<string[]> {
  const supabase = createServerSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("products")
      .select("category")
      .not("category", "is", null)
      .order("category")

    if (error) {
      console.error("Error fetching categories:", error)
      return ["Tanaman Hias", "Tanaman Indoor", "Tanaman Outdoor", "Tanaman Gantung", "Kaktus & Sukulen", "Benih"] // Tambahkan Benih
    }

    const categories = [...new Set(data.map((item) => item.category))]
      .filter(Boolean)
      .sort()

    if (categories.length === 0) {
      return ["Tanaman Hias", "Tanaman Indoor", "Tanaman Outdoor", "Tanaman Gantung", "Kaktus & Sukulen", "Benih"] // Tambahkan Benih
    }

    // Pastikan "Benih" ada dalam daftar jika ada produk benih
    if (data.some(item => item.category === "Benih") && !categories.includes("Benih")) {
        categories.push("Benih");
        categories.sort();
    }


    return categories
  } catch (error) {
    console.error("Error fetching categories:", error)
    return ["Tanaman Hias", "Tanaman Indoor", "Tanaman Outdoor", "Tanaman Gantung", "Kaktus & Sukulen", "Benih"] // Tambahkan Benih
  }
}
