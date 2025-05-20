import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const fileName = searchParams.get("file")

  if (!fileName) {
    return NextResponse.json({ error: "File name is required" }, { status: 400 })
  }

  try {
    const filePath = path.join(process.cwd(), fileName)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const fileContent = fs.readFileSync(filePath, "utf8")
    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": "text/plain",
      },
    })
  } catch (error) {
    console.error("Error reading SQL file:", error)
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 })
  }
}
