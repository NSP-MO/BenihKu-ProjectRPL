import { createServerSupabaseClient } from "@/lib/supabase"

export async function checkAndUpdateAdminStatus(userId: string) {
  const supabase = createServerSupabaseClient()

  try {
    // First, check if the user exists in the profiles table
    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      return { success: false, error: profileError.message }
    }

    // Check if the user has admin role in profiles
    if (profile && profile.role === "admin") {
      // Update the user_metadata in auth.users to ensure consistency
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role: "admin" },
      })

      if (updateError) {
        console.error("Error updating user metadata:", updateError)
        return { success: false, error: updateError.message }
      }

      return { success: true, isAdmin: true }
    }

    return { success: true, isAdmin: false }
  } catch (error: any) {
    console.error("Error in checkAndUpdateAdminStatus:", error)
    return { success: false, error: error.message }
  }
}

export async function setUserAsAdmin(userId: string) {
  const supabase = createServerSupabaseClient()

  try {
    // Update the profiles table
    const { error: profileError } = await supabase.from("profiles").update({ role: "admin" }).eq("id", userId)

    if (profileError) {
      console.error("Error updating profile:", profileError)
      return { success: false, error: profileError.message }
    }

    // Update the user_metadata in auth.users
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role: "admin" },
    })

    if (updateError) {
      console.error("Error updating user metadata:", updateError)
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in setUserAsAdmin:", error)
    return { success: false, error: error.message }
  }
}
