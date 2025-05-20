"use server"

import { createServerSupabaseClient } from "@/lib/supabase"

export interface HomepageSettings {
  product_ids: number[]
  title: string
  description: string
}

export async function getHomepageSettings(): Promise<HomepageSettings> {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("homepage_settings")
      .select("setting_value")
      .eq("setting_key", "featured_products")
      .single()

    if (error) {
      console.error("Error fetching homepage settings:", error)
      return {
        product_ids: [],
        title: "Tanaman Populer",
        description: "Tanaman yang paling banyak dicari oleh pelanggan kami.",
      }
    }

    return data.setting_value as HomepageSettings
  } catch (error) {
    console.error("Error in getHomepageSettings:", error)
    return {
      product_ids: [],
      title: "Tanaman Populer",
      description: "Tanaman yang paling banyak dicari oleh pelanggan kami.",
    }
  }
}

export async function updateHomepageSettings(settings: HomepageSettings) {
  const supabase = createServerSupabaseClient()

  try {
    const { error } = await supabase
      .from("homepage_settings")
      .update({
        setting_value: settings,
        updated_at: new Date().toISOString(),
      })
      .eq("setting_key", "featured_products")

    if (error) {
      console.error("Error updating homepage settings:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in updateHomepageSettings:", error)
    return { success: false, error: error.message || "Failed to update homepage settings" }
  }
}
