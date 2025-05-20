"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import type { Product } from "@/lib/products"

export async function getAdminProducts() {
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

// Update the updateProduct function to include image fields and handle undefined values
export async function updateProduct(id: number, productData: Partial<Product>) {
  try {
    const supabase = createServerSupabaseClient()

    // Ensure numeric fields are properly typed
    const updateData: any = {
      name: productData.name || "",
      description: productData.description || "",
      category: productData.category || "",
      updated_at: new Date().toISOString(),
    }

    // Only include numeric fields if they are valid numbers
    if (typeof productData.price === "number") {
      updateData.price = productData.price
    } else if (typeof productData.price === "string" && !isNaN(Number.parseFloat(productData.price))) {
      updateData.price = Number.parseFloat(productData.price)
    }

    if (typeof productData.stock === "number") {
      updateData.stock = productData.stock
    } else if (typeof productData.stock === "string" && !isNaN(Number.parseInt(productData.stock))) {
      updateData.stock = Number.parseInt(productData.stock)
    }

    // Include boolean fields
    if (typeof productData.is_popular === "boolean") {
      updateData.is_popular = productData.is_popular
    }

    // Include care instructions if provided
    if (productData.care_instructions) {
      updateData.care_instructions = productData.care_instructions
    }

    // Only include image fields if they are provided
    if (productData.image) updateData.image = productData.image
    if (productData.image_path) updateData.image_path = productData.image_path
    if (productData.image_bucket) updateData.image_bucket = productData.image_bucket

    console.log("Updating product with data:", updateData)

    const { error } = await supabase.from("products").update(updateData).eq("id", id)

    if (error) {
      console.error("Error updating product:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in updateProduct:", error)
    return { success: false, error: error.message || "Failed to update product" }
  }
}

// Update the createProduct function to handle undefined values
export async function createProduct({
  name,
  price,
  description,
  category,
  stock,
  image_url,
  image_path,
}: {
  name: string
  price: number | string
  description: string
  category: string
  stock: number | string
  image_url?: string
  image_path?: string
}) {
  try {
    const supabase = createServerSupabaseClient()

    // Ensure numeric fields are properly typed
    const productPrice = typeof price === "string" ? Number.parseFloat(price) || 0 : price || 0
    const productStock = typeof stock === "string" ? Number.parseInt(stock) || 0 : stock || 0

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name: name || "",
          price: productPrice,
          description: description || "",
          category: category || "",
          stock: productStock,
          image: image_url || "",
          image_path: image_path || "",
          is_popular: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error("Error adding product:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Error in addProduct:", error)
    return { success: false, error: error.message || "Failed to add product" }
  }
}

export async function deleteProduct(id: number) {
  const supabase = createServerSupabaseClient()

  try {
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) {
      console.error("Error deleting product:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting product:", error)
    return { success: false, error: error.message }
  }
}
