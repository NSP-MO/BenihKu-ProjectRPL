import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "setup-orders-tables.sql")
    const sqlScript = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL script
    const { error } = await supabase.rpc("exec_sql", { sql_query: sqlScript })

    if (error) {
      console.error("Error setting up orders tables:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Orders tables set up successfully" })
  } catch (error: any) {
    console.error("Error setting up orders tables:", error)
    return NextResponse.json({ success: false, error: error.message || "Unknown error" }, { status: 500 })
  }
}
