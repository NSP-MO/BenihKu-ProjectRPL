"use server"

import { createServerSupabaseClient } from "@/lib/supabase"

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
}

export async function getProducts() {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_published", true) // Only get published products
      .order("id")

    if (error) {
      // Check if the error is because the table doesn't exist
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

export async function getProductById(id: number) {
  const supabase = createServerSupabaseClient()

  try {
    // Use .eq() instead of .single() to avoid errors when no rows are found
    const { data, error } = await supabase.from("products").select("*").eq("id", id).eq("is_published", true) // Only get published products

    if (error) {
      console.error(`Error fetching product with id ${id}:`, error)
      return null
    }

    // Check if any data was returned
    if (!data || data.length === 0) {
      console.log(`No product found with id ${id}`)
      return null
    }

    // Return the first matching product
    return data[0] as Product
  } catch (error) {
    console.error(`Error fetching product with id ${id}:`, error)
    return null
  }
}

export async function getPopularProducts(limit = 6) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_popular", true)
      .eq("is_published", true) // Only get published products
      .limit(limit)

    if (error) {
      // Check if the error is because the table doesn't exist
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

export async function getProductsByCategory(category: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", category)
      .eq("is_published", true) // Only get published products

    if (error) {
      // Check if the error is because the table doesn't exist
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
