import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Hardcoded Supabase credentials
const SUPABASE_URL = "https://rgsmubwxaddbakgdzcrf.supabase.co"
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc211Ynd4YWRkYmFrZ2R6Y3JmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU0NjgzOCwiZXhwIjoyMDYzMTIyODM4fQ.awIkDOpAeUziVVik81XC6wi7l1VTskEvDrB0fxLcUco"

export async function POST(request: NextRequest) {
  try {
    console.log("Starting profile image upload process")

    // Create a Supabase client with service role to bypass RLS
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error("Missing Supabase credentials in API route")
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string
    const oldAvatarPath = formData.get("oldAvatarPath") as string
    const oldAvatarBucket = formData.get("oldAvatarBucket") as string

    console.log("Received upload request for user:", userId)

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "No user ID provided" }, { status: 400 })
    }

    // Delete old avatar if it exists
    if (oldAvatarPath && oldAvatarBucket) {
      try {
        await supabase.storage.from(oldAvatarBucket).remove([oldAvatarPath])
        console.log("Deleted old avatar:", oldAvatarPath)
      } catch (deleteError) {
        console.error("Error deleting old avatar:", deleteError)
        // Continue with upload even if deletion fails
      }
    }

    // Get available bucket
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("Error listing buckets:", listError)
      return NextResponse.json({ error: listError.message }, { status: 500 })
    }

    let bucketName = ""

    // Check if any buckets exist
    if (buckets && buckets.length > 0) {
      // Look for specific buckets in order of preference
      const preferredBuckets = ["avatars", "profiles", "media"]

      for (const preferred of preferredBuckets) {
        if (buckets.some((b) => b.name === preferred)) {
          bucketName = preferred
          break
        }
      }

      // If none of our preferred buckets exist, use the first available one
      if (!bucketName) {
        bucketName = buckets[0].name
      }
    } else {
      // If no buckets exist, create one
      const { error: createError } = await supabase.storage.createBucket("avatars", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
      })

      if (createError) {
        console.error("Error creating bucket:", createError)
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }

      bucketName = "avatars"
    }

    console.log("Using bucket:", bucketName)

    // Create a unique file path
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = fileName

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    })

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(filePath)

    console.log("Upload successful, public URL:", publicUrl)

    // Return success response with URL
    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
      bucket: bucketName,
    })
  } catch (error: any) {
    console.error("Error in upload-profile-image:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
