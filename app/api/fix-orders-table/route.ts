import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Check if orders table exists by attempting to query it
    const { data: ordersCheck, error: ordersError } = await supabase.from("orders").select("id").limit(1).maybeSingle()

    // If there's an error with a specific message pattern, the table might not exist
    const tableNotExist =
      ordersError && ordersError.message.includes("relation") && ordersError.message.includes("does not exist")

    if (tableNotExist) {
      // Create the orders table with all required columns
      const { error: createError } = await supabase.rpc("create_orders_table", {})

      if (createError) {
        // If the RPC function doesn't exist, we'll need to handle this differently
        console.error("Error creating orders table:", createError)

        // Try a direct approach - create a migration in the UI
        return NextResponse.json({
          success: false,
          error:
            "Could not create orders table automatically. Please run the SQL script manually in the Supabase dashboard.",
          sqlScript: `
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shipping_address TEXT,
  payment_method VARCHAR(50),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50)
);
          `,
        })
      }
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: "Orders table check completed",
      tableExists: !tableNotExist,
    })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `An unexpected error occurred: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
