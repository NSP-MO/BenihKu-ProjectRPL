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
  is_published: boolean
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

export async function getProducts(includeUnpublished = false) {
  const supabase = createServerSupabaseClient()

  try {
    let query = supabase.from("products").select("*")

    // Only filter by published status if we're not including unpublished products
    if (!includeUnpublished) {
      query = query.eq("is_published", true)
    }

    const { data, error } = await query.order("is_popular", { ascending: false }).order("id")

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

export async function getProductById(id: number, includeUnpublished = false) {
  const supabase = createServerSupabaseClient()

  try {
    let query = supabase.from("products").select("*").eq("id", id)

    // Only filter by published status if we're not including unpublished products
    if (!includeUnpublished) {
      query = query.eq("is_published", true)
    }

    const { data, error } = await query

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
      .eq("is_published", true)
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
      .eq("is_published", true)
      .order("is_popular", { ascending: false })
      .order("id")

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

export async function updateProductPublishedStatus(id: number, isPublished: boolean) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase.from("products").update({ is_published: isPublished }).eq("id", id).select()

    if (error) {
      console.error(`Error updating published status for product ${id}:`, error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error(`Error updating published status for product ${id}:`, error)
    return { success: false, error: error.message }
  }
}

export async function updateProductPopularStatus(id: number, isPopular: boolean) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase.from("products").update({ is_popular: isPopular }).eq("id", id).select()

    if (error) {
      console.error(`Error updating popular status for product ${id}:`, error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error(`Error updating popular status for product ${id}:`, error)
    return { success: false, error: error.message }
  }
}
