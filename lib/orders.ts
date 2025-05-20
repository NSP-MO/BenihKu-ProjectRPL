"use server"

import { createServerSupabaseClient } from "@/lib/supabase"

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled"

export type Order = {
  id: string
  user_id: string
  status: OrderStatus
  total: number
  created_at: string
  updated_at: string
  shipping_address?: {
    name: string
    address: string
    city: string
    postal_code: string
    country: string
    phone: string
  }
  payment_method?: string
  payment_status?: string
}

export type OrderItem = {
  id: number
  order_id: string
  product_id: number
  product_name: string
  quantity: number
  price: number
  subtotal: number
  product_image?: string
}

export type OrderWithItems = Order & {
  items: OrderItem[]
}

export async function getOrders() {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
      return []
    }

    return data as Order[]
  } catch (error) {
    console.error("Error fetching orders:", error)
    return []
  }
}

export async function getOrderById(id: string): Promise<OrderWithItems | null> {
  const supabase = createServerSupabaseClient()

  try {
    // Get order details
    const { data: orderData, error: orderError } = await supabase.from("orders").select("*").eq("id", id).single()

    if (orderError) {
      console.error(`Error fetching order with id ${id}:`, orderError)
      return null
    }

    // Get order items
    const { data: itemsData, error: itemsError } = await supabase.from("order_items").select("*").eq("order_id", id)

    if (itemsError) {
      console.error(`Error fetching items for order ${id}:`, itemsError)
      return null
    }

    // Combine order with items
    const orderWithItems: OrderWithItems = {
      ...orderData,
      items: itemsData,
    }

    return orderWithItems
  } catch (error) {
    console.error(`Error fetching order with id ${id}:`, error)
    return null
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const supabase = createServerSupabaseClient()

  try {
    const { error } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error(`Error updating status for order ${id}:`, error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error(`Error updating status for order ${id}:`, error)
    return { success: false, error: error.message }
  }
}
