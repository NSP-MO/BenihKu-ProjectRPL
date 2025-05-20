import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Create a Supabase client with service role for admin operations
    const supabaseUrl = process.env.SUPABASE_URL || ""
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ success: false, error: "Missing Supabase credentials" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const messages = []
    let success = true

    // Check if avatars bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("Error listing buckets:", listError)
      return NextResponse.json({ success: false, error: listError.message }, { status: 500 })
    }

    // Create avatars bucket if it doesn't exist
    if (!buckets.some((bucket) => bucket.name === "avatars")) {
      const { error: createAvatarsError } = await supabase.storage.createBucket("avatars", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
      })

      if (createAvatarsError) {
        console.error("Error creating avatars bucket:", createAvatarsError)
        messages.push(`Error creating avatars bucket: ${createAvatarsError.message}`)
        success = false
      } else {
        messages.push("Created avatars bucket successfully")
      }
    } else {
      messages.push("Avatars bucket already exists")
    }

    // Create products bucket if it doesn't exist
    if (!buckets.some((bucket) => bucket.name === "products")) {
      const { error: createProductsError } = await supabase.storage.createBucket("products", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
      })

      if (createProductsError) {
        console.error("Error creating products bucket:", createProductsError)
        messages.push(`Error creating products bucket: ${createProductsError.message}`)
        success = false
      } else {
        messages.push("Created products bucket successfully")
      }
    } else {
      messages.push("Products bucket already exists")
    }

    // Set public access for avatars bucket
    if (buckets.some((bucket) => bucket.name === "avatars")) {
      const { error: policyError } = await supabase.storage.from("avatars").createSignedUrl("test.txt", 60)

      if (policyError && policyError.message.includes("policy")) {
        try {
          // Try to set public policy
          await supabase.rpc("create_public_bucket_policy", { bucket_name: "avatars" })
          messages.push("Set public access for avatars bucket")
        } catch (err) {
          console.log("Note: Could not set public policy, may need manual configuration")
        }
      }
    }

    return NextResponse.json({ success, messages })
  } catch (error: any) {
    console.error("Error in setup-storage:", error)
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
