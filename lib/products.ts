"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { getSetting } from "@/lib/settings" // Import the new getSetting function

export type Product = {
  id: number
  name: string
  price: number
  image: string
  category: string
  description: string
  is_popular: boolean; 
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
  status?: string; 
}

// ... (getProducts, getProductById, getProductsByCategory remain the same) ...
export async function getProducts() {
  const supabase = createServerSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
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
      .select("*")
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
// Updated function
export async function getPopularProducts() { // Removed explicit limit parameter
  const supabase = createServerSupabaseClient();
  let limit = 6; // Default limit

  try {
    const limitSetting = await getSetting('homepage_product_limit');
    if (limitSetting && !isNaN(parseInt(limitSetting))) {
      limit = parseInt(limitSetting);
    }
  } catch (e) {
    console.error("Failed to fetch homepage_product_limit setting, using default:", e);
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_popular", true) 
      .eq("is_published", true)
      .limit(limit) // Use the fetched or default limit

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
