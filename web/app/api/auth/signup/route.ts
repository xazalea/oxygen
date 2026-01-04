import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface SignupRequest {
  username: string
  email: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json()

    if (!body.username || !body.email || !body.password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      )
    }

    // Validate username
    if (body.username.length < 3 || body.username.length > 20) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 20 characters' },
        { status: 400 }
      )
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password
    if (body.password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // In production, create user in database
    const user = {
      id: `user-${Date.now()}`,
      username: body.username,
      email: body.email,
      displayName: body.username,
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
        status: 201,
        headers: {
          'Set-Cookie': `oxygen_token=${token}; Path=/; HttpOnly; SameSite=Lax`,
        },
      }
    )
  } catch (error) {
    console.error('Error in signup API:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}



