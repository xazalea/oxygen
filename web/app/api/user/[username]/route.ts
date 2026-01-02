import { NextRequest, NextResponse } from 'next/server'
import { getTrendingVideos } from '@/lib/tiktok-service'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate username format
    if (username.length < 1 || username.length > 24) {
      return NextResponse.json(
        { error: 'Username must be between 1 and 24 characters' },
        { status: 400 }
      )
    }

    // Try to find user data from trending videos
    // In a real implementation, we would fetch user profile from TikTok API
    // For now, we'll search through trending videos to find videos by this user
    try {
      const videos = await getTrendingVideos(50)
      const userVideos = videos.filter(v => 
        v.author.username.toLowerCase() === username.toLowerCase()
      )

      if (userVideos.length > 0) {
        // Aggregate stats from user's videos
        const firstVideo = userVideos[0]
        if (!firstVideo?.author) {
          throw new Error('Invalid video data: missing author')
        }

        const totalLikes = userVideos.reduce((sum, v) => sum + (v.stats?.likes || 0), 0)
        const totalViews = userVideos.reduce((sum, v) => sum + (v.stats?.views || 0), 0)

        const user = {
          id: firstVideo.author.id || `user-${username}`,
          username: firstVideo.author.username || username,
          displayName: firstVideo.author.username || username,
          bio: 'Content creator',
          followers: Math.floor(totalViews / 10), // Estimate based on views
          following: 0,
          likes: totalLikes,
          videos: userVideos.length,
          avatar: firstVideo.author.avatar || null,
          verified: false,
        }

        return NextResponse.json(user, {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        })
      }
    } catch (apiError) {
      // If API fails, continue to fallback
      console.warn('Failed to fetch user from TikTok API:', apiError)
    }

    // Fallback: Return structured user data
    // In production, this should integrate with a proper user database
    const user = {
      id: `user-${username}`,
      username,
      displayName: username.charAt(0).toUpperCase() + username.slice(1),
      bio: 'Content creator',
      followers: 0,
      following: 0,
      likes: 0,
      videos: 0,
      avatar: null,
      verified: false,
    }

    return NextResponse.json(user, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error in user API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

