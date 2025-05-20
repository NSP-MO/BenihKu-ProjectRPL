"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function StorageSetup() {
  const [isLoading, setIsLoading] = useState(true)
  const [buckets, setBuckets] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    checkStorageBuckets()
  }, [])

  const checkStorageBuckets = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.storage.listBuckets()

      if (error) {
        throw error
      }

      setBuckets(data.map((bucket) => bucket.name))
    } catch (err: any) {
      console.error("Error checking storage buckets:", err)
      setError(err.message || "Failed to check storage buckets")
    } finally {
      setIsLoading(false)
    }
  }

  const createProductsBucket = async () => {
    setIsCreating(true)
    setError(null)
    setSuccess(null)

    try {
      const { data, error } = await supabase.storage.createBucket("products", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
      })

      if (error) {
        throw error
      }

      setSuccess("Products bucket created successfully!")
      setBuckets((prev) => [...prev, "products"])
    } catch (err: any) {
      console.error("Error creating products bucket:", err)
      setError(err.message || "Failed to create products bucket")
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Buckets</CardTitle>
        <CardDescription>Manage storage buckets for image uploads</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-600">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {buckets.length === 0 ? (
          <div className="text-center p-4 border rounded-md bg-gray-50 dark:bg-gray-900">
            <p className="mb-4">No storage buckets found. You need to create a bucket to upload images.</p>
            <Button onClick={createProductsBucket} disabled={isCreating} className="bg-green-600 hover:bg-green-700">
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Products Bucket"
              )}
            </Button>
          </div>
        ) : (
          <div>
            <h3 className="font-medium mb-2">Available Buckets:</h3>
            <ul className="list-disc pl-5 space-y-1">
              {buckets.map((bucket) => (
                <li key={bucket}>{bucket}</li>
              ))}
            </ul>

            {!buckets.includes("products") && (
              <div className="mt-4">
                <p className="mb-2">Products bucket not found. Create it now:</p>
                <Button
                  onClick={createProductsBucket}
                  disabled={isCreating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Products Bucket"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={checkStorageBuckets}>
          Refresh Buckets
        </Button>
      </CardFooter>
    </Card>
  )
}
