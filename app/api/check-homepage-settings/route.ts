import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Check if the homepage_settings table exists
    const { data, error } = await supabase.from("homepage_settings").select("*").limit(1)

    if (error && error.code === "PGRST204") {
      // Table doesn't exist
      return NextResponse.json({ exists: false })
    }

    return NextResponse.json({ exists: true })
  } catch (error: any) {
    console.error("Error checking homepage settings table:", error)
    return NextResponse.json({ exists: false, error: error.message }, { status: 500 })
  }
}
