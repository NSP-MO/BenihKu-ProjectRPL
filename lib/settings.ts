"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import type { Database } from "@/types/supabase" // Assuming your generated types are here

export type AppSetting = Database["public"]["Tables"]["app_settings"]["Row"]

// Function to get a specific setting's value
export async function getSetting(key: string): Promise<string | null> {
  const supabase = createServerSupabaseClient()
  try {
    // Option 1: Call the database function (if RLS allows or using service role)
    // const { data, error } = await supabase.rpc('get_app_setting', { setting_key: key })
    // if (error) throw error;
    // return data as string | null;

    // Option 2: Direct select (usually fine with service role from server components)
    const { data, error } = await supabase.from("app_settings").select("value").eq("key", key).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows found
        console.warn(`Setting with key "${key}" not found.`)
        return null
      }
      console.error(`Error fetching setting "${key}":`, error)
      throw error
    }
    return data?.value || null
  } catch (error) {
    console.error(`Exception fetching setting "${key}":`, error)
    return null
  }
}

// Function to get all settings (for an admin settings page)
export async function getAllSettings(): Promise<AppSetting[]> {
  const supabase = createServerSupabaseClient()
  try {
    const { data, error } = await supabase.from("app_settings").select("*").order("key")

    if (error) {
      console.error("Error fetching all settings:", error)
      throw error
    }
    return data || []
  } catch (error) {
    console.error("Exception fetching all settings:", error)
    return []
  }
}

// Function to update a specific setting's value
export async function updateSetting(key: string, value: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient()
  try {
    // Option 1: Call the database function
    // const { error } = await supabase.rpc('update_app_setting', { setting_key: key, new_value: value })
    // if (error) throw error;
    // return { success: true };

    // Option 2: Direct upsert or update
    const { error } = await supabase
      .from("app_settings")
      .update({ value: value, updated_at: new Date().toISOString() })
      .eq("key", key)

    // If you prefer upsert to also create if not exists (though initial seed should cover it)
    // const { error } = await supabase
    //   .from('app_settings')
    //   .upsert({ key: key, value: value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
      console.error(`Error updating setting "${key}":`, error)
      throw error
    }
    return { success: true }
  } catch (error: any) {
    console.error(`Exception updating setting "${key}":`, error)
    return { success: false, error: error.message || "Failed to update setting." }
  }
}

// Function to get the homepage product limit setting
export async function getHomepageProductLimitSetting(): Promise<number> {
  const limitValue = await getSetting("homepage_product_limit")
  // Default to 6 if not set or invalid
  if (!limitValue) return 6

  const parsedValue = Number.parseInt(limitValue, 10)
  return isNaN(parsedValue) ? 6 : parsedValue
}

// Function to update the homepage product limit setting
export async function updateHomepageProductLimitSetting(
  limit: number,
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Validate the input
    if (isNaN(limit) || limit < 1) {
      return {
        success: false,
        error: "Jumlah produk harus berupa angka positif.",
      }
    }

    const result = await updateSetting("homepage_product_limit", limit.toString())

    if (result.success) {
      return {
        success: true,
        message: "Jumlah produk di beranda berhasil diperbarui.",
      }
    } else {
      return {
        success: false,
        error: result.error || "Gagal memperbarui pengaturan.",
      }
    }
  } catch (error: any) {
    console.error("Error updating homepage product limit:", error)
    return {
      success: false,
      error: error.message || "Terjadi kesalahan saat memperbarui pengaturan.",
    }
  }
}
