import { NextResponse } from "next/server"
import { initializeStorageBuckets } from "./actions"

export async function GET() {
  try {
    const result = await initializeStorageBuckets()

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, messages: result.messages })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
