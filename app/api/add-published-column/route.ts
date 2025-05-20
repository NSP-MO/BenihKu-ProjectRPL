import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Read the SQL script
    const response = await fetch(new URL("/add-published-column.sql", import.meta.url))
    const sqlScript = await response.text()

    // Execute the SQL script
    const { error } = await supabase.rpc("exec_sql", { sql_query: sqlScript })

    if (error) {
      console.error("Error adding published column:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error adding published column:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
