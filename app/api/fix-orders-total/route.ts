import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "fix-orders-total.sql")
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL query
    const { error } = await supabase.rpc("exec_sql", { sql_query: sqlQuery })

    if (error) {
      console.error("Error executing SQL:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Orders table total column fixed successfully" })
  } catch (error: any) {
    console.error("Error fixing orders total column:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
