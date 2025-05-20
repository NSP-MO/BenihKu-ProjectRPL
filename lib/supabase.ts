import { createClient } from "@supabase/supabase-js"

// Use environment variables for Supabase credentials
const SUPABASE_URL = "https://rgsmubwxaddbakgdzcrf.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc211Ynd4YWRkYmFrZ2R6Y3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NDY4MzgsImV4cCI6MjA2MzEyMjgzOH0.qN_fe1yuPMKZVJQpFKqtezn-cLZ-3sWVDqKJ3fLLCgQ"
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc211Ynd4YWRkYmFrZ2R6Y3JmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU0NjgzOCwiZXhwIjoyMDYzMTIyODM4fQ.awIkDOpAeUziVVik81XC6wi7l1VTskEvDrB0fxLcUco"

// Create a singleton instance for the client-side
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
