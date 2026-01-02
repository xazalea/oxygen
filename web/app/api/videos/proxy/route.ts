import { NextRequest, NextResponse } from 'next/server'
import { getTelegramStorage } from '@/lib/telegram-storage'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Proxy endpoint to serve videos from Telegram storage
 * GET /api/videos/proxy?fileId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json(
        { error: 'fileId parameter is required' },
        { status: 400 }
      )
    }

    const storage = getTelegramStorage()
    
    // Download file from Telegram
    const buffer = await storage.downloadFileById(fileId)
    
    if (!buffer) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Return file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (error) {
    console.error('Error proxying video from Telegram:', error)
    return NextResponse.json(
      { error: 'Failed to proxy video' },
      { status: 500 }
    )
  }
}

