"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import type { Product } from "@/lib/products" 

export async function getAdminProducts() {
  const supabase = createServerSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*") // is_popular will be selected
      .order("id")

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

export async function updateProduct(id: number, productData: Partial<Product>) {
  try {
    const supabase = createServerSupabaseClient()
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (productData.name !== undefined) updateData.name = productData.name;
    if (productData.description !== undefined) updateData.description = productData.description;
    if (productData.category !== undefined) updateData.category = productData.category;

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

    if (typeof productData.is_popular === "boolean") {
      updateData.is_popular = productData.is_popular
    }
    
    // If you had show_on_homepage, and want to remove it from updates:
    // delete productData.show_on_homepage; // Or ensure it's not in updateData

     if (typeof productData.is_published === "boolean") { 
      updateData.is_published = productData.is_published
    }

    if (productData.care_instructions) {
      updateData.care_instructions = productData.care_instructions
    }
    if (productData.image) updateData.image = productData.image
    if (productData.image_path) updateData.image_path = productData.image_path
    if (productData.image_bucket) updateData.image_bucket = productData.image_bucket

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

export async function createProduct({
  name,
  price,
  description,
  category,
  stock,
  image_url,
  image_path,
  is_popular = false, 
  is_published = true,
  care_instructions,
}: {
  name: string
  price: number | string
  description: string
  category: string
  stock: number | string
  image_url?: string
  image_path?: string
  is_popular?: boolean; 
  is_published?: boolean;
  care_instructions?: Product['care_instructions']; 
}) {
  try {
    const supabase = createServerSupabaseClient()
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
          image: image_url || "/placeholder.svg",
          image_path: image_path || "",
          is_popular: is_popular,
          is_published: is_published,
          care_instructions: care_instructions || null,
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
