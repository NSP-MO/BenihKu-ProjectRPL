"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

type CartItem = {
  id: number
  name: string
  price: number
  quantity: number
  image?: string
}

export async function createOrder(formData: FormData) {
  try {
    const supabase = createServerSupabaseClient()

    // Extract form data
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const address = formData.get("address") as string
    const city = formData.get("city") as string
    const postalCode = formData.get("postalCode") as string
    const country = formData.get("country") as string
    const paymentMethod = formData.get("paymentMethod") as string
    const shippingMethod = (formData.get("shippingMethod") as string) || "regular"
    const cartItemsJson = formData.get("cartItems") as string
    const userId = formData.get("userId") as string
    const notes = (formData.get("notes") as string) || ""

    // Validate required fields
    if (
      !name ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !postalCode ||
      !country ||
      !paymentMethod ||
      !cartItemsJson ||
      !userId
    ) {
      return { success: false, error: "All fields are required" }
    }

    // Parse cart items
    let cartItems: CartItem[] = []
    try {
      cartItems = JSON.parse(cartItemsJson)
    } catch (error) {
      return { success: false, error: "Invalid cart data" }
    }

    if (!cartItems || cartItems.length === 0) {
      return { success: false, error: "Cart is empty" }
    }

    // Calculate total amount
    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    // Add shipping cost if express delivery
    const shippingCost = shippingMethod === "express" ? 20000 : 0
    const finalTotal = totalAmount + shippingCost

    // Create shipping info JSON object to match database structure
    const shippingInfo = {
      name,
      email,
      phone,
      address,
      city,
      province: country, // Using country as province for now
      postalCode,
      notes,
    }

    // Create the order with the correct structure
    const orderData = {
      user_id: userId,
      total_amount: finalTotal,
      shipping_info: shippingInfo,
      payment_method: paymentMethod,
      shipping_method: shippingMethod.toLowerCase(),
      status: "pending",
    }

    console.log("Creating order with data:", orderData)

    const { data: order, error: orderError } = await supabase.from("orders").insert(orderData).select().single()

    if (orderError) {
      console.error("Error creating order:", orderError)
      return {
        success: false,
        error: "Failed to create order. Database error: " + orderError.message,
      }
    }

    // Insert order items with product_name included
    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name, // Include product_name to satisfy the NOT NULL constraint
      quantity: item.quantity,
      price: item.price,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("Error creating order items:", itemsError)
      // Delete the order since we couldn't add items
      await supabase.from("orders").delete().eq("id", order.id)
      return {
        success: false,
        error: "Failed to create order items. Database error: " + itemsError.message,
      }
    }

    // Clear the user's cart in Supabase
    await supabase.from("cart_items").delete().eq("user_id", userId)

    // Revalidate paths
    revalidatePath("/orders")
    revalidatePath("/cart")

    // Return success with order ID
    return { success: true, orderId: order.id }
  } catch (error: any) {
    console.error("Error creating order:", error)
    return {
      success: false,
      error: "An unexpected error occurred: " + (error.message || "Unknown error"),
    }
  }
}
