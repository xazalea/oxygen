import { NextRequest, NextResponse } from 'next/server'
import { getThreads, createThread, likeThread, getThreadById } from '@/lib/threads-service'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const replyToId = searchParams.get('replyToId')
  
  try {
    const threads = await getThreads({
      userId: userId || undefined,
      replyToId: replyToId || undefined
    })
    return NextResponse.json(threads)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, userId, threadId, content, mediaUrl, mediaType, replyToId } = body

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (action === 'create') {
      const thread = await createThread(userId, content, mediaUrl, mediaType, replyToId)
      return NextResponse.json(thread)
    }

    if (action === 'like') {
      if (!threadId) return NextResponse.json({ error: 'Thread ID required' }, { status: 400 })
      const isLiked = await likeThread(userId, threadId)
      return NextResponse.json({ liked: isLiked })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


