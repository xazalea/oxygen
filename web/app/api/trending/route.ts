import { NextRequest, NextResponse } from 'next/server'
import { getTrendingVideos } from '@/lib/tiktok-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const count = parseInt(searchParams.get('count') || '20', 10)

    // Validate count
    if (count < 1 || count > 100) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 100' },
        { status: 400 }
      )
    }

    const videos = await getTrendingVideos(count)

    return NextResponse.json(videos, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Error in trending API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trending videos' },
      { status: 500 }
    )
  }
}


