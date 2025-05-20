import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Create a service role client
    const supabaseUrl = "https://rgsmubwxaddbakgdzcrf.supabase.co"
    const supabaseServiceKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc211Ynd4YWRkYmFrZ2R6Y3JmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU0NjgzOCwiZXhwIjoyMDYzMTIyODM4fQ.awIkDOpAeUziVVik81XC6wi7l1VTskEvDrB0fxLcUco"

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get list of buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json({ error: bucketsError.message }, { status: 500 })
    }

    // For each bucket, update the RLS policy to be public
    const results = []
    for (const bucket of buckets || []) {
      try {
        // Make bucket public
        const { error: updateError } = await supabase.storage.updateBucket(bucket.name, {
          public: true,
        })

        if (updateError) {
          results.push({ bucket: bucket.name, success: false, error: updateError.message })
        } else {
          results.push({ bucket: bucket.name, success: true })
        }
      } catch (error: any) {
        results.push({ bucket: bucket.name, success: false, error: error.message })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
