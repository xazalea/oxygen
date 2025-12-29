import { NextRequest, NextResponse } from 'next/server'
import { getTrendingVideos } from '@/lib/tiktok-service'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { tag: string } }
) {
  try {
    const { tag } = params
    const searchParams = request.nextUrl.searchParams
    const count = parseInt(searchParams.get('count') || '20', 10)

    if (!tag) {
      return NextResponse.json(
        { error: 'Hashtag is required' },
        { status: 400 }
      )
    }

    // In production, fetch hashtag videos from TikTok API
    // For now, return trending videos filtered by hashtag
    const videos = await getTrendingVideos(count)
    
    // Filter videos that contain the hashtag
    const hashtagVideos = videos.filter(v => 
      v.hashtags?.some(h => h.toLowerCase() === tag.toLowerCase()) ||
      v.description.toLowerCase().includes(`#${tag.toLowerCase()}`)
    )

    return NextResponse.json(hashtagVideos, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Error in hashtag API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hashtag videos' },
      { status: 500 }
    )
  }
}

