"use client"
import { checkAndGetBucket } from "@/app/api/storage/actions"
import { createClient } from "@supabase/supabase-js"

// Create a service role client that bypasses RLS
const createServiceRoleClient = () => {
  const supabaseUrl = "https://rgsmubwxaddbakgdzcrf.supabase.co"
  const supabaseServiceKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc211Ynd4YWRkYmFrZ2R6Y3JmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU0NjgzOCwiZXhwIjoyMDYzMTIyODM4fQ.awIkDOpAeUziVVik81XC6wi7l1VTskEvDrB0fxLcUco"

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function uploadProfileImage(file: File, userId: string) {
  try {
    // First, check for available buckets using a server action
    const bucketResult = await checkAndGetBucket()

    if (!bucketResult.success) {
      console.error("Error getting bucket:", bucketResult.error)
      return { success: false, error: bucketResult.error }
    }

    const bucketName = bucketResult.bucketName
    console.log(`Using bucket: ${bucketName} for profile image upload`)

    // Create a unique file path for the user's avatar
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `${fileName}`

    // Convert file to array buffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Use service role client to bypass RLS
    const serviceClient = createServiceRoleClient()

    // Upload the file to Supabase Storage using service role client
    const { error: uploadError, data } = await serviceClient.storage.from(bucketName).upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    })

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      return { success: false, error: uploadError.message }
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = serviceClient.storage.from(bucketName).getPublicUrl(filePath)

    return {
      success: true,
      url: publicUrl,
      path: filePath,
      bucket: bucketName,
    }
  } catch (error: any) {
    console.error("Error in uploadProfileImage:", error)
    return { success: false, error: error.message || "An error occurred during upload" }
  }
}

export async function uploadProductImage(file: File) {
  try {
    // First, check for available buckets using a server action
    const bucketResult = await checkAndGetBucket()

    if (!bucketResult.success) {
      console.error("Error getting bucket:", bucketResult.error)
      return { success: false, error: bucketResult.error }
    }

    const bucketName = bucketResult.bucketName
    console.log(`Using bucket: ${bucketName} for product image upload`)

    // Create a unique file path
    const fileExt = file.name.split(".").pop()
    const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `${fileName}`

    // Convert file to array buffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Use service role client to bypass RLS
    const serviceClient = createServiceRoleClient()

    // Upload the file to Supabase Storage using service role client
    const { error: uploadError } = await serviceClient.storage.from(bucketName).upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    })

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      return { success: false, error: uploadError.message }
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = serviceClient.storage.from(bucketName).getPublicUrl(filePath)

    return {
      success: true,
      url: publicUrl,
      path: filePath,
      bucket: bucketName,
    }
  } catch (error: any) {
    console.error("Error in uploadProductImage:", error)
    return { success: false, error: error.message || "An error occurred during upload" }
  }
}

export async function deleteStorageFile(bucket: string, path: string) {
  if (!path) return { success: true }

  try {
    // Use service role client to bypass RLS
    const serviceClient = createServiceRoleClient()

    const { error } = await serviceClient.storage.from(bucket).remove([path])

    if (error) {
      console.error("Error deleting file:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in deleteStorageFile:", error)
    return { success: false, error: error.message || "An error occurred during deletion" }
  }
}
