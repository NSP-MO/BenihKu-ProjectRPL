"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, KeyRound, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context" //
import { Button } from "@/components/ui/button" //
import { Input } from "@/components/ui/input" //
import { Label } from "@/components/ui/label" //
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card" //
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert" //
import { useToast } from "@/components/ui/use-toast" //

function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const { resetPasswordFromContext } = useAuth() // Renamed for clarity
  const { toast } = useToast()
  const searchParams = useSearchParams() // Use to get URL parameters

  // Supabase typically puts the access_token in the URL hash after a password reset link is clicked.
  // We need to extract it.
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1)) // Remove #
      const accessToken = params.get('access_token')
      if (accessToken) {
        // Store it or handle it. For this example, we assume Supabase handles it internally
        // when `updateUser` is called with the new password.
        // If Supabase client doesn't pick it up automatically, you might need to set the session.
        console.log("Access token found in URL hash:", accessToken)
      }
    }
  }, [])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    if (password.length < 6) {
      setError("Password baru harus minimal 6 karakter.")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Password baru dan konfirmasi password tidak cocok.")
      setLoading(false)
      return
    }

    try {
      // The resetPasswordFromContext function in useAuth should handle
      // calling supabase.auth.updateUser with the new password.
      // Supabase client should pick up the access_token from the URL hash
      // or from the session if the user was redirected from the email link.
      const result = await resetPasswordFromContext(password)

      if (result.success) {
        setSuccessMessage("Password Anda berhasil direset. Anda akan diarahkan ke halaman login.")
        toast({
          title: "Password Berhasil Direset",
          description: "Anda sekarang dapat login dengan password baru Anda.",
        })
        setTimeout(() => {
          router.push("/auth/login")
        }, 3000)
      } else {
        setError(result.error || "Gagal mereset password.")
        toast({
          title: "Error Reset Password",
          description: result.error || "Gagal mereset password. Link mungkin sudah kedaluwarsa atau tidak valid.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.")
      toast({
        title: "Error",
        description: err.message || "Terjadi kesalahan.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-start mb-4">
             <Button variant="ghost" onClick={() => router.push("/auth/login")} className="p-0 h-auto">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Kembali ke Login
            </Button>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Reset Password Anda</CardTitle>
          <CardDescription className="text-center mt-2">
            Masukkan password baru Anda di bawah ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="password">
                <KeyRound className="h-4 w-4 mr-2 inline" />
                Password Baru
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password baru"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">
                <KeyRound className="h-4 w-4 mr-2 inline" />
                Konfirmasi Password Baru
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Konfirmasi password baru"
                className="mt-1"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700">
                 <AlertTitle className="text-green-700 dark:text-green-300">Sukses</AlertTitle>
                <AlertDescription className="text-green-600 dark:text-green-200">{successMessage}</AlertDescription>
              </Alert>
            )}

            <div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mereset...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Wrap with Suspense for useSearchParams
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
