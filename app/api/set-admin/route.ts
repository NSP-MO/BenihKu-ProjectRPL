import { createServerSupabaseClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    // Update the profiles table
    const { error: profileError } = await supabase.from("profiles").update({ role: "admin" }).eq("id", userId)

    if (profileError) {
      console.error("Error updating profile:", profileError)
      return NextResponse.json({ success: false, error: profileError.message }, { status: 500 })
    }

    // Update the user_metadata in auth.users
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role: "admin" },
    })

    if (updateError) {
      console.error("Error updating user metadata:", updateError)
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in set-admin API:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
