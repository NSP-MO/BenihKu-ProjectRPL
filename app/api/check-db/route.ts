import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Check if products table exists and has data
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })

    if (productsError) {
      if (productsError.message.includes("relation") && productsError.message.includes("does not exist")) {
        return NextResponse.json({
          success: false,
          status: "missing_table",
          message: "Products table does not exist",
        })
      }

      return NextResponse.json({
        success: false,
        status: "error",
        message: productsError.message,
      })
    }

    // Check if cart_items table exists
    const { error: cartError } = await supabase.from("cart_items").select("*", { count: "exact", head: true })

    // Check if orders table exists
    const { error: ordersError } = await supabase.from("orders").select("*", { count: "exact", head: true })

    // Check if order_items table exists
    const { error: orderItemsError } = await supabase.from("order_items").select("*", { count: "exact", head: true })

    // Check if profiles table exists
    const { error: profilesError } = await supabase.from("profiles").select("*", { count: "exact", head: true })

    // Determine database status
    const dbStatus = {
      products: !productsError,
      cart_items: !cartError,
      orders: !ordersError,
      order_items: !orderItemsError,
      profiles: !profilesError,
    }

    const allTablesExist = Object.values(dbStatus).every((status) => status === true)

    return NextResponse.json({
      success: true,
      status: allTablesExist ? "complete" : "partial",
      dbStatus,
      message: allTablesExist ? "Database is fully set up" : "Some tables are missing",
    })
  } catch (error: any) {
    console.error("Error checking database:", error)
    return NextResponse.json({
      success: false,
      status: "error",
      message: error.message || "An error occurred while checking the database",
    })
  }
}
