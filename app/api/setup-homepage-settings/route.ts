import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Create the homepage_settings table if it doesn't exist
    const { error: createTableError } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS homepage_settings (
          id SERIAL PRIMARY KEY,
          setting_key TEXT NOT NULL UNIQUE,
          setting_value JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (createTableError) {
      console.error("Error creating homepage_settings table:", createTableError)
      return NextResponse.json({ success: false, error: createTableError.message }, { status: 500 })
    }

    // Check if featured_products setting already exists
    const { data: existingSettings, error: checkError } = await supabase
      .from("homepage_settings")
      .select("*")
      .eq("setting_key", "featured_products")
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking homepage settings:", checkError)
      return NextResponse.json({ success: false, error: checkError.message }, { status: 500 })
    }

    // Only insert default settings if they don't exist
    if (!existingSettings) {
      const defaultSettings = {
        setting_key: "featured_products",
        setting_value: {
          product_ids: [],
          title: "Tanaman Populer",
          description: "Tanaman yang paling banyak dicari oleh pelanggan kami.",
        },
      }

      const { error: insertError } = await supabase.from("homepage_settings").insert([defaultSettings])

      if (insertError) {
        console.error("Error inserting default homepage settings:", insertError)
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: "Homepage settings setup complete" })
  } catch (error: any) {
    console.error("Error setting up homepage settings:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
