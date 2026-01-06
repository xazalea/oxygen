import { NextRequest, NextResponse } from 'next/server'
import { generateVideo, AIModelKey, AI_MODELS } from '@/lib/ai-service'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, prompt, modelKey } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User ID required' },
        { status: 401 }
      )
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    if (!modelKey || !AI_MODELS[modelKey as AIModelKey]) {
      return NextResponse.json(
        { error: 'Invalid model key' },
        { status: 400 }
      )
    }

    // Check rate limit
    const limitCheck = await checkRateLimit(userId)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { 
          error: limitCheck.error,
          remaining: 0,
          limit: 20
        },
        { status: 429 }
      )
    }

    // Generate video
    try {
      const videoUrl = await generateVideo(modelKey as AIModelKey, prompt)
      
      return NextResponse.json({
        success: true,
        videoUrl,
        remaining: limitCheck.remaining
      })
    } catch (genError) {
      console.error('Generation error:', genError)
      return NextResponse.json(
        { error: 'Failed to generate video. Please try again later.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

