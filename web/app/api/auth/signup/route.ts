import { NextRequest, NextResponse } from 'next/server'
import { getDBOperations } from '@/lib/telegram-db-operations'

export const dynamic = 'force-dynamic'

interface SignupRequest {
  username: string
  email: string
  password: string
  linkedAccounts?: {
    tiktok?: string
    youtube?: string
  }
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

    const db = getDBOperations()

    // Check if user already exists
    const existingUser = await db.getUserByUsername(body.username)
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      )
    }

    // Create user in database
    const newUser = await db.createUser({
      username: body.username,
      email: body.email,
      displayName: body.username,
      avatar: undefined,
      bio: '',
      followers: 0,
      following: 0,
      likes: 0,
      isPrivate: false,
      preferences: {
        theme: 'auto',
        autoplay: true,
        notifications: true,
        language: 'en'
      },
      socialGraph: {
        followers: [],
        following: [],
        blocked: [],
        muted: [],
        closeFriends: []
      },
      linkedAccounts: body.linkedAccounts
    })

    // In production, generate JWT token
    const token = `mock-token-${Date.now()}`

    return NextResponse.json(
      { user: newUser, token },
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



