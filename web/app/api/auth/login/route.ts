import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface LoginRequest {
  email?: string
  username?: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()

    if (!body.password || (!body.email && !body.username)) {
      return NextResponse.json(
        { error: 'Email/username and password are required' },
        { status: 400 }
      )
    }

    // In production, verify credentials with database
    // For now, create a mock user
    const user = {
      id: `user-${Date.now()}`,
      username: body.username || body.email?.split('@')[0] || 'user',
      email: body.email || `${body.username}@example.com`,
      displayName: body.username || body.email?.split('@')[0] || 'User',
      avatar: null,
      bio: '',
      followers: 0,
      following: 0,
      likes: 0,
      verified: false,
    }

    // In production, generate JWT token
    const token = `mock-token-${Date.now()}`

    return NextResponse.json(
      { user, token },
      {
        headers: {
          'Set-Cookie': `oxygen_token=${token}; Path=/; HttpOnly; SameSite=Lax`,
        },
      }
    )
  } catch (error) {
    console.error('Error in login API:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}

