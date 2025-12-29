import { NextRequest, NextResponse } from 'next/server'
import { fetchTrendingVideos } from '@/lib/tiktok-api-enhanced'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // In production, fetch user data from TikTok API
    // For now, return mock user data
    const user = {
      id: `user-${username}`,
      username,
      displayName: username.charAt(0).toUpperCase() + username.slice(1),
      bio: 'Content creator',
      followers: Math.floor(Math.random() * 1000000),
      following: Math.floor(Math.random() * 1000),
      likes: Math.floor(Math.random() * 10000000),
      videos: Math.floor(Math.random() * 500),
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

