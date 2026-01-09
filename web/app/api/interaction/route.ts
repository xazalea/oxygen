import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface InteractionData {
  userId: string
  videoId: string
  sessionId: string
  watchTime: number
  completionRate: number
  skipped: boolean
  liked: boolean
  shared: boolean
  commented: boolean
  timestamp: number
}

export async function POST(request: NextRequest) {
  try {
    const body: InteractionData = await request.json()

    // Validate required fields
    if (!body.userId || !body.videoId || !body.sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, videoId, sessionId' },
        { status: 400 }
      )
    }

    // Validate data types
    if (
      typeof body.watchTime !== 'number' ||
      typeof body.completionRate !== 'number' ||
      typeof body.skipped !== 'boolean' ||
      typeof body.liked !== 'boolean' ||
      typeof body.shared !== 'boolean' ||
      typeof body.commented !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'Invalid data types' },
        { status: 400 }
      )
    }

    // Validate ranges
    if (body.watchTime < 0 || body.completionRate < 0 || body.completionRate > 1) {
      return NextResponse.json(
        { error: 'Invalid value ranges' },
        { status: 400 }
      )
    }

    // In production, store interaction in database
    // For now, we just validate and return success
    // You can integrate with a database like Vercel Postgres, Supabase, etc.

    return NextResponse.json(
      { success: true, message: 'Interaction recorded' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in interaction API:', error)
    return NextResponse.json(
      { error: 'Failed to record interaction' },
      { status: 500 }
    )
  }
}




