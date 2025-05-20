import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Query to get column names from the orders table
    const { data, error } = await supabase.from("orders").select("*").limit(1)

    if (error) {
      console.error("Error checking orders schema:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Get the column names from the first row
    const columnNames = data && data.length > 0 ? Object.keys(data[0]) : []

    return NextResponse.json({
      success: true,
      columnNames,
      sampleData: data && data.length > 0 ? data[0] : null,
    })
  } catch (error: any) {
    console.error("Error checking orders schema:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
