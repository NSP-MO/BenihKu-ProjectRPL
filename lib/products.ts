"use server"

import { createServerSupabaseClient } from "@/lib/supabase"

export interface Product {
  id: number
  name: string
  price: number
  image: string
  category: string
  description: string
  is_popular: boolean
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
  stock?: number
  image_path?: string
  image_bucket?: string
}

export async function getProducts(): Promise<Product[]> {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase.from("products").select("*").order("id")

    if (error) {
      console.error("Error fetching products:", error)
      return []
    }

    return data as Product[]
  } catch (error) {
    console.error("Error fetching products:", error)
    return []
  }
}

export async function getPopularProducts(): Promise<Product[]> {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase.from("products").select("*").eq("is_popular", true).order("id")

    if (error) {
      console.error("Error fetching popular products:", error)
      return []
    }

    return data as Product[]
  } catch (error) {
    console.error("Error fetching popular products:", error)
    return []
  }
}

export async function getFeaturedProducts(productIds: number[]): Promise<Product[]> {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase.from("products").select("*").in("id", productIds).order("id")

    if (error) {
      console.error("Error fetching featured products:", error)
      return []
    }

    // Sort the products in the same order as the productIds array
    const sortedProducts = productIds
      .map((id) => data.find((product) => product.id === id))
      .filter(Boolean) as Product[]

    return sortedProducts
  } catch (error) {
    console.error("Error fetching featured products:", error)
    return []
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

    if (error) {
      console.error(`Error fetching product with id ${id}:`, error)
      return null
    }

    return data as Product
  } catch (error) {
    console.error(`Error fetching product with id ${id}:`, error)
    return null
  }
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase.from("products").select("*").eq("category", category).order("id")

    if (error) {
      console.error(`Error fetching products in category ${category}:`, error)
      return []
    }

    return data as Product[]
  } catch (error) {
    console.error(`Error fetching products in category ${category}:`, error)
    return []
  }
}
