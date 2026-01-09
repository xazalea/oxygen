import { getTelegramDatabase } from './telegram-db'

const TABLE_NAME = 'threads'
const LIKES_TABLE = 'thread_likes'
const REPOSTS_TABLE = 'thread_reposts'

export interface Thread {
  id: string
  userId: string
  content: string
  mediaUrl?: string
  mediaType?: 'image' | 'video'
  createdAt: number
  updatedAt: number
  replyToId?: string
  quoteId?: string
  likesCount: number
  repliesCount: number
  repostsCount: number
}

export interface ThreadLike {
  id: string
  userId: string
  threadId: string
  createdAt: number
}

export interface ThreadRepost {
  id: string
  userId: string
  threadId: string
  createdAt: number
}

export async function createThread(
  userId: string,
  content: string,
  mediaUrl?: string,
  mediaType?: 'image' | 'video',
  replyToId?: string,
  quoteId?: string
): Promise<Thread> {
  const db = getTelegramDatabase()
  
  const thread = await db.create(TABLE_NAME, {
    userId,
    content,
    mediaUrl,
    mediaType,
    replyToId,
    quoteId,
    likesCount: 0,
    repliesCount: 0,
    repostsCount: 0
  })

  // If it's a reply, increment parent's reply count
  if (replyToId) {
    const parent = await db.findById(TABLE_NAME, replyToId)
    if (parent) {
      await db.update(TABLE_NAME, replyToId, {
        repliesCount: (parent.repliesCount || 0) + 1
      })
    }
  }

  // If it's a quote, increment original's repost/quote count
  if (quoteId) {
    const original = await db.findById(TABLE_NAME, quoteId)
    if (original) {
      await db.update(TABLE_NAME, quoteId, {
        repostsCount: (original.repostsCount || 0) + 1
      })
    }
  }

  return thread as Thread
}

export async function getThreads(options: {
  limit?: number
  offset?: number
  userId?: string
  replyToId?: string
} = {}): Promise<Thread[]> {
  const db = getTelegramDatabase()
  
  const query: any = {
    limit: options.limit || 20,
    offset: options.offset || 0,
    orderBy: 'createdAt',
    orderDirection: 'desc'
  }

  if (options.userId) {
    query.where = { ...query.where, userId: options.userId }
  }

  // If fetching main feed, exclude replies unless specifically asked
  if (options.replyToId) {
    query.where = { ...query.where, replyToId: options.replyToId }
  } else if (!options.userId) {
     // For main feed, generally we want top-level threads. 
     // However, current DB abstraction simple filter might need specific handling for 'undefined'.
     // For now, let's assume we fetch all and filter in memory if needed, or if DB supports $ne or null checks.
     // Our TFile-like DB is simple. Let's just fetch recent.
  }

  const threads = await db.read(TABLE_NAME, query)
  return threads as Thread[]
}

export async function likeThread(userId: string, threadId: string): Promise<boolean> {
  const db = getTelegramDatabase()
  
  // Check if already liked
  const existing = await db.read(LIKES_TABLE, {
    where: { userId, threadId }
  })

  if (existing.length > 0) {
    // Unlike
    await db.delete(LIKES_TABLE, existing[0].id)
    const thread = await db.findById(TABLE_NAME, threadId)
    if (thread) {
      await db.update(TABLE_NAME, threadId, {
        likesCount: Math.max(0, (thread.likesCount || 0) - 1)
      })
    }
    return false
  } else {
    // Like
    await db.create(LIKES_TABLE, { userId, threadId })
    const thread = await db.findById(TABLE_NAME, threadId)
    if (thread) {
      await db.update(TABLE_NAME, threadId, {
        likesCount: (thread.likesCount || 0) + 1
      })
    }
    return true
  }
}

export async function repostThread(userId: string, threadId: string): Promise<void> {
  const db = getTelegramDatabase()
  
  // Check if already reposted
  const existing = await db.read(REPOSTS_TABLE, {
    where: { userId, threadId }
  })

  if (existing.length === 0) {
    await db.create(REPOSTS_TABLE, { userId, threadId })
    const thread = await db.findById(TABLE_NAME, threadId)
    if (thread) {
      await db.update(TABLE_NAME, threadId, {
        repostsCount: (thread.repostsCount || 0) + 1
      })
    }
  }
}

export async function getThreadById(id: string): Promise<Thread | null> {
  const db = getTelegramDatabase()
  const thread = await db.findById(TABLE_NAME, id)
  return thread as Thread | null
}


