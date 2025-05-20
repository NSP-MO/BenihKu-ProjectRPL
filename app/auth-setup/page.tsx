"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function AuthSetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const setupCustomAuth = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/setup-custom-auth")
      const data = await response.json()

      if (data.success) {
        setResult({ success: true, message: "Autentikasi kustom berhasil diatur!" })
      } else {
        setResult({ success: false, message: `Error: ${data.error}` })
      }
    } catch (error: any) {
      setResult({ success: false, message: `Error: ${error.message}` })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Setup Autentikasi Kustom</CardTitle>
            <CardDescription className="text-center">
              Siapkan sistem autentikasi kustom untuk aplikasi Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}
            <p className="text-sm text-muted-foreground">
              Klik tombol di bawah untuk membuat tabel dan kebijakan yang diperlukan untuk autentikasi kustom. Ini akan
              memungkinkan pendaftaran tanpa validasi email yang ketat.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={setupCustomAuth} className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Setup Autentikasi Kustom"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
