"use server"

import { createServerSupabaseClient } from "@/lib/supabase"

export async function updateUserProfile(
  userId: string,
  profileData: {
    name?: string
    avatar_url?: string
    avatar_path?: string
  },
) {
  try {
    const supabase = createServerSupabaseClient()

    const updates = {
      ...profileData,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("profiles").update(updates).eq("id", userId)

    if (error) {
      console.error("Error updating profile:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in updateUserProfile:", error)
    return { success: false, error: error.message || "Failed to update profile" }
  }
}

export async function getUserProfile(userId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching profile:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Error in getUserProfile:", error)
    return { success: false, error: error.message || "Failed to fetch profile" }
  }
}
