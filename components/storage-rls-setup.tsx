"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export function StorageRLSSetup() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const setupRLS = async () => {
    setIsLoading(true)
    setError(null)
    setResults(null)
    setSuccess(false)

    try {
      const response = await fetch("/api/storage/setup-rls")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to set up RLS policies")
      }

      setResults(data.results)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage RLS Setup</CardTitle>
        <CardDescription>
          Configure Row Level Security (RLS) policies for your storage buckets to allow uploads
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-500 text-green-500">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>RLS policies have been configured successfully</AlertDescription>
          </Alert>
        )}

        {results && results.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-medium">Results:</h3>
            <ul className="space-y-1 text-sm">
              {results.map((result, index) => (
                <li key={index} className={result.success ? "text-green-500" : "text-red-500"}>
                  {result.bucket}: {result.success ? "Success" : `Failed - ${result.error}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={setupRLS} disabled={isLoading}>
          {isLoading ? "Setting up..." : "Setup RLS Policies"}
        </Button>
      </CardFooter>
    </Card>
  )
}
