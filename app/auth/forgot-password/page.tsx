"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Mail, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context" //
import { Button } from "@/components/ui/button" //
import { Input } from "@/components/ui/input" //
import { Label } from "@/components/ui/label" //
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card" //
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert" //
import { useToast } from "@/components/ui/use-toast" //

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const { requestPasswordReset } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    if (!email.trim()) {
      setError("Email harus diisi.")
      setLoading(false)
      return
    }

    try {
      const result = await requestPasswordReset(email)

      if (result.success) {
        setSuccessMessage("Jika email Anda terdaftar, Anda akan menerima link untuk mereset password.")
        toast({
          title: "Permintaan Terkirim",
          description: "Silakan periksa email Anda untuk link reset password.",
        })
        setEmail("") // Clear the email field
      } else {
        setError(result.error || "Gagal mengirim permintaan reset password.")
        toast({
          title: "Error",
          description: result.error || "Gagal mengirim permintaan reset password.",
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
          <CardTitle className="text-2xl font-bold text-center">Lupa Password?</CardTitle>
          <CardDescription className="text-center mt-2">
            Masukkan alamat email Anda dan kami akan mengirimkan link untuk mereset password Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Alamat Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
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
                    Mengirim...
                  </>
                ) : (
                  "Kirim Link Reset"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
