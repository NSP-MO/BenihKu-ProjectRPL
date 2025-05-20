"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { handleAuthStateChange } from "@/lib/custom-auth"

export default function ConfirmPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [countdown, setCountdown] = useState(5)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if we have a session
        const { data } = await supabase.auth.getSession()

        if (data.session) {
          // We have a session, so the user is authenticated
          setStatus("success")
          setMessage("Anda berhasil masuk! Anda akan dialihkan ke halaman utama dalam beberapa detik.")

          // Store user in localStorage
          await handleAuthStateChange()

          // Start countdown
          let count = 5
          const timer = setInterval(() => {
            count -= 1
            setCountdown(count)

            if (count <= 0) {
              clearInterval(timer)
              router.push("/")
            }
          }, 1000)

          return () => clearInterval(timer)
        } else {
          // No session, but we might be in the process of confirming email
          setStatus("loading")
          setMessage("Memverifikasi akun Anda...")

          // Wait a bit to see if the session gets established
          setTimeout(async () => {
            const { data: refreshedData } = await supabase.auth.getSession()

            if (refreshedData.session) {
              // Now we have a session
              setStatus("success")
              setMessage("Akun Anda berhasil diverifikasi! Anda akan dialihkan ke halaman login dalam beberapa detik.")

              // Store user in localStorage
              await handleAuthStateChange()

              // Start countdown
              let count = 5
              const timer = setInterval(() => {
                count -= 1
                setCountdown(count)

                if (count <= 0) {
                  clearInterval(timer)
                  router.push("/")
                }
              }, 1000)

              return () => clearInterval(timer)
            } else {
              // Still no session, show error
              setStatus("error")
              setMessage("Tidak dapat memverifikasi akun Anda. Silakan coba lagi atau hubungi dukungan.")
            }
          }, 2000)
        }
      } catch (error) {
        console.error("Error checking session:", error)
        setStatus("error")
        setMessage("Terjadi kesalahan saat memverifikasi akun Anda. Silakan coba lagi.")
      }
    }

    checkSession()
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Verifikasi Akun</h1>

          {status === "loading" && (
            <div className="mt-4 flex flex-col items-center justify-center space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
              <p className="text-muted-foreground">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="mt-4 space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-foreground">{message}</p>
              <p className="text-sm text-muted-foreground">
                Mengalihkan dalam <span className="font-medium text-primary">{countdown}</span> detik...
              </p>
              <div className="pt-2">
                <Link href="/" className="text-sm font-medium text-primary hover:text-primary/90">
                  Klik di sini jika Anda tidak dialihkan
                </Link>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="mt-4 space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-foreground">{message}</p>
              <div className="flex justify-center space-x-4 pt-4">
                <Link
                  href="/auth/login"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Kembali ke Login
                </Link>
                <Link
                  href="/"
                  className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                >
                  Ke Beranda
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
