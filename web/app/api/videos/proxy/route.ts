import { NextRequest, NextResponse } from 'next/server'
import { getUnifiedStorage } from '@/lib/unified-storage'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Proxy endpoint to serve videos from unified storage (Telegram or Streamtape)
 * GET /api/videos/proxy?fileId=xxx&storageType=telegram|streamtape (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fileId = searchParams.get('fileId')
    const storageType = searchParams.get('storageType') as 'telegram' | 'streamtape' | null

    if (!fileId) {
      return NextResponse.json(
        { error: 'fileId parameter is required' },
        { status: 400 }
      )
    }

    const storage = getUnifiedStorage()
    await storage.initialize()
    
    // Try to get file URL first (for Streamtape, we can redirect to direct URL)
    const fileUrl = storage.getFileUrl(fileId, storageType || undefined)
    
    // Check if it's a Streamtape URL (can be accessed directly)
    if (fileUrl.includes('streamtape.com') || fileUrl.includes('tapecontent.net')) {
      // For Streamtape, redirect to the direct URL
      return NextResponse.redirect(fileUrl, { status: 302 })
    }
    
    // For Telegram or if URL is not available, download and proxy
    const buffer = await storage.downloadFileById(fileId)
    
    if (!buffer) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Get file metadata to determine content type
    const metadata = await storage.getFileMetadata(fileId)
    const contentType = metadata?.mimeType || 'video/mp4'
    
    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(buffer)
    
    // Return file with appropriate headers
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (error) {
    console.error('Error proxying video from storage:', error)
    return NextResponse.json(
      { error: 'Failed to proxy video' },
      { status: 500 }
    )
  }
}

