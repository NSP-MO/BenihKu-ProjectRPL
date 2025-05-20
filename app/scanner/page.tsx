"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function QRScanner() {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerId = "qr-reader"

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [])

  const startScanner = async () => {
    try {
      setError(null)
      setPermissionDenied(false)
      setScanning(true)

      await new Promise((resolve) => requestAnimationFrame(resolve))

      const html5QrCode = new Html5Qrcode(scannerContainerId)
      scannerRef.current = html5QrCode

      const qrCodeSuccessCallback = (decodedText: string) => {
        // Stop scanning after successful scan
        html5QrCode.stop().catch(console.error)

        // Check if the URL is for a product
        if (decodedText.includes("/product/")) {
          router.push(decodedText)
        } else {
          // Try to extract a product ID if it's just a number or has a specific format
          const productIdMatch = decodedText.match(/(\d+)/)
          if (productIdMatch) {
            router.push(`/product/${productIdMatch[0]}`)
          } else {
            setError("QR code tidak valid. Silakan scan QR code produk yang valid.")
            setScanning(false)
          }
        }
      }

      const config = { fps: 10, qrbox: { width: 250, height: 250 } }

      await html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback, undefined)
    } catch (err: any) {
      console.error("Error starting scanner:", err)
      setScanning(false)

      if (err.name === "NotAllowedError") {
        setPermissionDenied(true)
      } else {
        setError("Terjadi kesalahan saat memulai scanner. Silakan coba lagi.")
      }
    }
  }

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(console.error)
    }
    setScanning(false)
  }

  return (
    <div className="container max-w-4xl py-12">
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali
      </Button>

      <Card className="dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl">QR Scanner</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Scan QR code pada tanaman untuk melihat informasi lengkap dan cara perawatannya.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          {permissionDenied && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Akses kamera ditolak</AlertTitle>
              <AlertDescription>Mohon izinkan akses kamera untuk menggunakan fitur QR scanner.</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div
            id={scannerContainerId}
            className={`w-full max-w-[300px] h-[300px] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 mb-4 ${scanning ? "block" : "hidden"}`}
          ></div>

          {!scanning ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-4">
                <Camera className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Siap untuk Scan</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Arahkan kamera ke QR code pada label tanaman untuk melihat informasi lengkap.
                </p>
              </div>
              <Button
                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 mt-4"
                onClick={startScanner}
              >
                Mulai Scan
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="mt-4 dark:border-gray-700 dark:text-gray-300" onClick={stopScanner}>
              Berhenti Scan
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
