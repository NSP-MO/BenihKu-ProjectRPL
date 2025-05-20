import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Create a Supabase client with service role for admin operations
    const supabaseUrl = process.env.SUPABASE_URL || ""
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("Error listing buckets:", listError)
      return NextResponse.json({ error: listError.message }, { status: 500 })
    }

    // If buckets exist, return the first one or a preferred one
    if (buckets && buckets.length > 0) {
      // Check for preferred buckets in order
      const preferredBuckets = ["avatars", "profiles", "media"]
      for (const preferred of preferredBuckets) {
        const foundBucket = buckets.find((b) => b.name === preferred)
        if (foundBucket) {
          return NextResponse.json({ bucketName: foundBucket.name })
        }
      }

      // If no preferred bucket found, use the first one
      return NextResponse.json({ bucketName: buckets[0].name })
    }

    // If no buckets exist, create one
    const { data, error } = await supabase.storage.createBucket("avatars", {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
    })

    if (error) {
      console.error("Error creating bucket:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ bucketName: "avatars" })
  } catch (error: any) {
    console.error("Error in get-storage-bucket:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
