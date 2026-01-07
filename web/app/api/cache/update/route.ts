import { NextRequest, NextResponse } from 'next/server'
import { cachePublisher } from '@/lib/cache-publisher'

export const dynamic = 'force-dynamic'

interface CacheUpdateRequest {
  type: 'tiktok' | 'youtube'
  identifier: string
  data: any
}

export async function POST(request: NextRequest) {
  try {
    const body: CacheUpdateRequest = await request.json()
    const { type, identifier, data } = body

    if (!type || !identifier || !data) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Security: Validate request source/secret in production
    // For now, we trust the internal API calls

    const cleanIdentifier = identifier.replace(/^@/, '')

    if (type === 'tiktok') {
      await cachePublisher.updateTikTokUser(cleanIdentifier, data)
    } else if (type === 'youtube') {
      await cachePublisher.updateYouTubeChannel(cleanIdentifier, data)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cache update error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

