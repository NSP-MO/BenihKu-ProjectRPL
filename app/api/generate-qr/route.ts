import { type NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"

export async function GET(request: NextRequest) {
  try {
    // Get URL and name from query parameters
    const url = request.nextUrl.searchParams.get("url")
    const name = request.nextUrl.searchParams.get("name") || "qrcode"

    if (!url) {
      return new NextResponse("URL parameter is required", { status: 400 })
    }

    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: "H",
      type: "png",
      margin: 1,
      width: 300,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })

    // Return the QR code as a PNG image
    return new NextResponse(qrBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${name.replace(/\s+/g, "-").toLowerCase()}-qr-code.png"`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Error generating QR code:", error)
    return new NextResponse("Error generating QR code", { status: 500 })
  }
}
