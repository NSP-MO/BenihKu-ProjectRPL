"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function AdminSetup() {
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [currentRole, setCurrentRole] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setCurrentRole(user.user_metadata?.role || "user")
    }
  }, [user])

  const setAsAdmin = async () => {
    if (!user) return

    setLoading(true)
    setStatus("loading")
    setMessage("Setting user as admin...")

    try {
      // First try the API method
      const response = await fetch("/api/set-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to set user as admin")
      }

      // Refresh the user to get updated metadata
      await refreshUser()

      setStatus("success")
      setMessage("User has been set as admin successfully!")
      setCurrentRole("admin")
    } catch (error: any) {
      console.error("Error setting user as admin:", error)
      setStatus("error")
      setMessage(`Error: ${error.message}`)

      // Fallback to direct SQL execution
      setMessage("Trying alternative method...")

      try {
        // Execute SQL directly using the service role client
        const serviceClient = supabase

        // Update profiles table
        const { error: profileError } = await serviceClient.from("profiles").update({ role: "admin" }).eq("id", user.id)

        if (profileError) throw profileError

        // Update user metadata
        const { error: metadataError } = await serviceClient.auth.updateUser({
          data: { role: "admin" },
        })

        if (metadataError) throw metadataError

        // Refresh the user to get updated metadata
        await refreshUser()

        setStatus("success")
        setMessage("User has been set as admin successfully using alternative method!")
        setCurrentRole("admin")
      } catch (fallbackError: any) {
        console.error("Fallback error:", fallbackError)
        setStatus("error")
        setMessage(`Both methods failed. Please run the SQL commands manually: ${fallbackError.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Admin Setup</CardTitle>
          <CardDescription>Set up admin access for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Current User:</p>
              <p>{user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Current Role:</p>
              <p>{currentRole || "Not set"}</p>
            </div>
            {status === "success" && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <p>{message}</p>
              </div>
            )}
            {status === "error" && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                <p>{message}</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={setAsAdmin}
            disabled={loading || currentRole === "admin"}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : currentRole === "admin" ? (
              "Already Admin"
            ) : (
              "Set as Admin"
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-8 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Manual SQL Commands</h2>
        <p className="mb-4">
          If the automatic setup doesn't work, you can run these SQL commands in the Supabase SQL Editor:
        </p>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
          {`-- Update user_metadata in auth.users
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"admin"') 
WHERE id = '${user?.id}';

-- Update the profiles table
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = '${user?.id}';`}
        </pre>
      </div>
    </div>
  )
}
