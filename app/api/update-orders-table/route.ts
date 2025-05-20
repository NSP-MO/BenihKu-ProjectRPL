import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Get the SQL script content
    const scriptPath = path.join(process.cwd(), "update-orders-table.sql")
    const sqlScript = fs.readFileSync(scriptPath, "utf8")

    // Execute the SQL script
    const { error } = await supabase.rpc("exec_sql", { sql: sqlScript })

    if (error) {
      console.error("Error updating orders table:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Orders table updated successfully" })
  } catch (error: any) {
    console.error("Error updating orders table:", error)
    return NextResponse.json({ success: false, error: error.message || "Unknown error" }, { status: 500 })
  }
}
