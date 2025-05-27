// lib/products.ts
"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { getSetting } from "@/lib/settings" // Import the new getSetting function

export type Product = {
  id: number
  name: string
  price: number
  image: string // Assuming this is the primary image URL for the grid
  category: string
  description: string // Kept for potential use, though grid might not show full desc
  is_popular: boolean
  is_published?: boolean
  stock?: number
  image_path?: string // For potential image construction if 'image' is not a direct URL
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
  status?: string // This seems redundant if is_published is used
}

// Define the columns needed for the product grid on the homepage
const PRODUCT_GRID_COLUMNS = "id, name, price, image, category, is_popular, is_published"

export async function getProducts() {
  const supabase = createServerSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_GRID_COLUMNS) // Optimized to select specific columns
      .eq("is_published", true)
      .order("id")

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
    // For individual product page, we might want all details, so select("*") can remain,
    // or be more specific if certain large JSON fields are not always needed immediately.
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
      .select(PRODUCT_GRID_COLUMNS) // Optimized to select specific columns
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

export async function getPopularProducts() {
  const supabase = createServerSupabaseClient()
  let limit = 6 // Default limit

  try {
    const limitSetting = await getSetting("homepage_product_limit")
    if (limitSetting && !isNaN(Number.parseInt(limitSetting))) {
      limit = Number.parseInt(limitSetting)
    }
  } catch (e) {
    console.error("Failed to fetch homepage_product_limit setting, using default:", e)
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_GRID_COLUMNS) // Optimized to select specific columns
      .eq("is_popular", true)
      .eq("is_published", true)
      .limit(limit)

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
      return ["Tanaman Hias", "Tanaman Indoor", "Tanaman Outdoor", "Tanaman Gantung", "Kaktus & Sukulen"]
    }

    const categories = [...new Set(data.map((item) => item.category))]
      .filter(Boolean)
      .sort()

    if (categories.length === 0) {
      return ["Tanaman Hias", "Tanaman Indoor", "Tanaman Outdoor", "Tanaman Gantung", "Kaktus & Sukulen"]
    }

    return categories
  } catch (error) {
    console.error("Error fetching categories:", error)
    return ["Tanaman Hias", "Tanaman Indoor", "Tanaman Outdoor", "Tanaman Gantung", "Kaktus & Sukulen"]
  }
}
