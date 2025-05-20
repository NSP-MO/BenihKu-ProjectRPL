"use server"

import { createServerSupabaseClient } from "@/lib/supabase"

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled"

export interface OrderItem {
  id: number
  order_id: string
  product_id: number
  product_name: string
  quantity: number
  price: number
  subtotal: number
  product_image?: string
}

export interface Order {
  id: string
  user_id: string
  // Try different possible column names for the total
  amount?: number
  price_total?: number
  order_total?: number
  total?: number
  status: OrderStatus
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
  tracking_number?: string
  notes?: string
  status_history?: {
    status: OrderStatus
    timestamp: string
    note?: string
  }[]
}

export interface OrderWithItems extends Order {
  items: OrderItem[]
}

// Changed from export function to export async function
export async function getOrderTotal(order: Order): Promise<number> {
  // Try different possible column names
  return order.amount ?? order.price_total ?? order.order_total ?? order.total ?? 0
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

    // Fetch product images for each item
    const itemsWithImages = await Promise.all(
      itemsData.map(async (item) => {
        try {
          const { data: productData, error: productError } = await supabase
            .from("products")
            .select("image, image_path")
            .eq("id", item.product_id)
            .single()

          if (productError || !productData) {
            return { ...item, product_image: "/placeholder.svg" }
          }

          return {
            ...item,
            product_image: productData.image || productData.image_path || "/placeholder.svg",
          }
        } catch (error) {
          console.error(`Error fetching product for item ${item.id}:`, error)
          return { ...item, product_image: "/placeholder.svg" }
        }
      }),
    )

    // Get status history if available
    const { data: historyData, error: historyError } = await supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", id)
      .order("timestamp", { ascending: false })

    const statusHistory = historyError ? [] : historyData

    // Calculate total from items if it's missing
    const calculatedTotal = itemsWithImages.reduce((sum, item) => sum + (item.subtotal || 0), 0)

    // Get the order total using our helper function
    const orderTotal = await getOrderTotal(orderData)

    // Combine order with items and history
    return {
      ...orderData,
      // Ensure we have a total value, either from the database or calculated
      total: orderTotal || calculatedTotal,
      items: itemsWithImages,
      status_history: statusHistory,
    } as OrderWithItems
  } catch (error) {
    console.error(`Error fetching order with id ${id}:`, error)
    return null
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient()

  try {
    // Start a transaction
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (updateError) {
      console.error(`Error updating status for order ${orderId}:`, updateError)
      return { success: false, error: updateError.message }
    }

    // Add to status history
    const { error: historyError } = await supabase.from("order_status_history").insert({
      order_id: orderId,
      status,
      timestamp: new Date().toISOString(),
      note,
    })

    if (historyError) {
      console.error(`Error adding status history for order ${orderId}:`, historyError)
      // We don't return an error here as the main update succeeded
      // Just log the error for tracking
    }

    return { success: true }
  } catch (error: any) {
    console.error(`Error updating status for order ${orderId}:`, error)
    return { success: false, error: error.message }
  }
}

export async function getOrdersByStatus(status: OrderStatus) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })

    if (error) {
      console.error(`Error fetching orders with status ${status}:`, error)
      return []
    }

    return data as Order[]
  } catch (error) {
    console.error(`Error fetching orders with status ${status}:`, error)
    return []
  }
}

export async function getOrdersByUser(userId: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error(`Error fetching orders for user ${userId}:`, error)
      return []
    }

    return data as Order[]
  } catch (error) {
    console.error(`Error fetching orders for user ${userId}:`, error)
    return []
  }
}
