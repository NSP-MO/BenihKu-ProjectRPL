"use server"

import { createServerSupabaseClient } from "@/lib/supabase"

export type Product = {
  id: number
  name: string
  price: number
  image: string
  category: string
  description: string
  is_popular: boolean; // This is the primary flag for homepage "Tanaman Populer"
  is_published?: boolean
  stock?: number
  image_path?: string
  image_bucket?: string
  // show_on_homepage?: boolean; // This can be removed if is_popular serves the purpose
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
  status?: string; 
}

export async function getProducts() {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*") // Will select is_popular by default
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
    const { data, error } = await supabase
      .from("products")
      .select("*") // Will select is_popular by default
      .eq("id", id)
      .single() 

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`No product found with id ${id}`);
        return null;
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

// This function will be used by the homepage's "Tanaman Populer" section
export async function getPopularProducts(limit = 6) {
  const supabase = createServerSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_popular", true) // Filter by is_popular
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


export async function getProductsByCategory(category: string) {
  const supabase = createServerSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
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
