import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rgsmubwxaddbakgdzcrf.supabase.co"
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc211Ynd4YWRkYmFrZ2R6Y3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NDY4MzgsImV4cCI6MjA2MzEyMjgzOH0.qN_fe1yuPMKZVJQpFKqtezn-cLZ-3sWVDqKJ3fLLCgQ"
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc211Ynd4YWRkYmFrZ2R6Y3JmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU0NjgzOCwiZXhwIjoyMDYzMTIyODM4fQ.awIkDOpAeUziVVik81XC6wi7l1VTskEvDrB0fxLcUco"

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "[v0] Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  )
}

let clientInstance: ReturnType<typeof createClient> | null = null

// Export the supabase client
export const supabase = (() => {
  // For server-side rendering, return a dummy client to avoid errors
  if (typeof window === "undefined") {
    // We're in a server environment, create a minimal client
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }

  // Client-side: reuse the instance if it exists
  if (clientInstance) return clientInstance

  // Create and cache the client instance
  clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return clientInstance
})()

// Server-side client with service role for admin operations
export const createServerSupabaseClient = () => {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}
