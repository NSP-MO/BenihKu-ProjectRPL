import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // SQL to create the custom_users table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.custom_users (
        id UUID PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql: createTableSQL })

    if (error) {
      console.error("Error creating custom_users table:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Custom users table created successfully" })
  } catch (error: any) {
    console.error("Error in create-custom-users-table:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
