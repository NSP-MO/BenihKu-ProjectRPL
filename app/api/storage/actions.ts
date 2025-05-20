"use server"
import { createClient } from "@supabase/supabase-js"

// Update the createServiceRoleClient function to use the hardcoded values instead of environment variables
// Replace the createServiceRoleClient function with this:

const createServiceRoleClient = () => {
  const supabaseUrl = "https://rgsmubwxaddbakgdzcrf.supabase.co"
  const supabaseServiceKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc211Ynd4YWRkYmFrZ2R6Y3JmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU0NjgzOCwiZXhwIjoyMDYzMTIyODM4fQ.awIkDOpAeUziVVik81XC6wi7l1VTskEvDrB0fxLcUco"

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase URL and service key are required")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Server action to check for available buckets and return one to use
export async function checkAndGetBucket() {
  try {
    // Create service client directly instead of using createServerSupabaseClient
    const serviceClient = createServiceRoleClient()

    // List all buckets using the service role client to bypass RLS
    const { data: buckets, error: listError } = await serviceClient.storage.listBuckets()

    if (listError) {
      console.error("Error listing buckets:", listError)
      return { success: false, error: listError.message }
    }

    // Check if any buckets exist
    if (buckets && buckets.length > 0) {
      // Look for specific buckets in order of preference
      const preferredBuckets = ["avatars", "profiles", "media", "products"]

      for (const preferred of preferredBuckets) {
        if (buckets.some((b) => b.name === preferred)) {
          console.log(`Found existing bucket: ${preferred}`)
          return { success: true, bucketName: preferred }
        }
      }

      // If none of our preferred buckets exist, use the first available one
      console.log(`Using existing bucket: ${buckets[0].name}`)
      return { success: true, bucketName: buckets[0].name }
    }

    // If no buckets exist, create one using the service role client
    console.log("No buckets found, creating media bucket...")
    const { error: createError } = await serviceClient.storage.createBucket("media", {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
    })

    if (createError) {
      console.error("Error creating media bucket:", createError)
      return { success: false, error: createError.message }
    }

    return { success: true, bucketName: "media" }
  } catch (error: any) {
    console.error("Error in checkAndGetBucket:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

// Server action to initialize storage buckets
export async function initializeStorageBuckets() {
  try {
    const serviceClient = createServiceRoleClient()

    // List all buckets
    const { data: buckets, error: listError } = await serviceClient.storage.listBuckets()

    if (listError) {
      console.error("Error listing buckets:", listError)
      return { success: false, error: listError.message }
    }

    const results = []
    const requiredBuckets = ["media", "avatars", "products"]

    // Create any missing required buckets
    for (const bucketName of requiredBuckets) {
      if (!buckets?.some((b) => b.name === bucketName)) {
        console.log(`Creating ${bucketName} bucket...`)
        const { error } = await serviceClient.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
        })

        if (error) {
          console.error(`Error creating ${bucketName} bucket:`, error)
          results.push(`Failed to create ${bucketName} bucket: ${error.message}`)
        } else {
          results.push(`Created ${bucketName} bucket successfully`)
        }
      } else {
        results.push(`${bucketName} bucket already exists`)
      }
    }

    return { success: true, messages: results }
  } catch (error: any) {
    console.error("Error in initializeStorageBuckets:", error)
    return { success: false, error: error.message }
  }
}
