import { NextRequest, NextResponse } from 'next/server'

// In-memory store for signaling data (not persistent across restarts/serverless cold starts, but fine for dev/demo)
// Map<StreamId, { broadcasterId: string, offer: any, viewers: Map<ViewerId, { answer: any, candidates: any[] }> }>
const streams = new Map<string, any>()

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, streamId, userId, data } = body

  if (!streamId) return NextResponse.json({ error: 'Missing streamId' }, { status: 400 })

  let stream = streams.get(streamId)

  switch (type) {
    case 'start_stream': // Broadcaster starts
      streams.set(streamId, {
        broadcasterId: userId,
        offers: {}, // Map<ViewerId, Offer>
        answers: {}, // Map<ViewerId, Answer>
        candidates: [] // Broadcaster candidates
      })
      return NextResponse.json({ success: true })

    case 'join_stream': // Viewer joins
      // Viewer signals they are here. Broadcaster needs to create an offer for them.
      // For simple-peer (initiator: true), Broadcaster creates offer.
      // So Viewer just registers presence.
      if (!stream) return NextResponse.json({ error: 'Stream not found' }, { status: 404 })
      
      // Store viewer intention
      if (!stream.viewers) stream.viewers = []
      if (!stream.viewers.includes(userId)) stream.viewers.push(userId)
      
      return NextResponse.json({ success: true })

    case 'signal': // Exchange offers/answers/candidates
      if (!stream) return NextResponse.json({ error: 'Stream not found' }, { status: 404 })
      
      const { targetId, signal } = data
      
      // Security check to prevent object injection
      if (!targetId || typeof targetId !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(targetId)) {
        return NextResponse.json({ error: 'Invalid targetId' }, { status: 400 })
      }
      
      // Store the signal for the target to pick up
      // In a real app, we'd push this via WebSocket
      // Here we just store it in a mailbox
      if (!stream.mailbox) stream.mailbox = {}
      if (!stream.mailbox[targetId]) stream.mailbox[targetId] = []
      stream.mailbox[targetId].push({ from: userId, signal })
      
      return NextResponse.json({ success: true })
      
    default:
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const streamId = searchParams.get('streamId')
  const userId = searchParams.get('userId')

  if (!streamId || !userId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const stream = streams.get(streamId)
  if (!stream) {
    return NextResponse.json({ active: false })
  }

  // Retrieve messages for this user
  const messages = stream.mailbox?.[userId] || []
  
  // Clear retrieved messages
  if (stream.mailbox?.[userId]) {
    stream.mailbox[userId] = []
  }

  return NextResponse.json({
    active: true,
    broadcasterId: stream.broadcasterId,
    messages,
    viewers: stream.viewers || [] // Let broadcaster know who is watching
  })
}

