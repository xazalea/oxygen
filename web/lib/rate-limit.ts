import { getTelegramDatabase } from './telegram-db'

const TABLE_NAME = 'video_usage_logs'
const DAILY_LIMIT = 20

export async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number; error?: string }> {
  const db = getTelegramDatabase()
  const today = new Date().toISOString().split('T')[0]
  
  try {
    const records = await db.read(TABLE_NAME, {
      where: {
        userId,
        date: today
      }
    })

    if (records.length > 0) {
      const record = records[0]
      if (record.count >= DAILY_LIMIT) {
        return {
          allowed: false,
          remaining: 0,
          error: `Daily limit of ${DAILY_LIMIT} videos reached.`
        }
      }
      
      // Increment count
      await db.update(TABLE_NAME, record.id, {
        count: record.count + 1
      })
      
      return {
        allowed: true,
        remaining: DAILY_LIMIT - (record.count + 1)
      }
    } else {
      // Create new record
      await db.create(TABLE_NAME, {
        userId,
        date: today,
        count: 1
      })
      
      return {
        allowed: true,
        remaining: DAILY_LIMIT - 1
      }
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // Fail open or closed? Let's fail open but log error to avoid blocking users on DB failure
    // But for strict enforcement, maybe fail closed? 
    // Given it's a "free" feature limit, failing open (allowing) on error might be safer for UX, 
    // but failing closed prevents abuse. Let's return allowed: true with warning if DB fails.
    return { allowed: true, remaining: DAILY_LIMIT }
  }
}

export async function getUsageStats(userId: string): Promise<{ today: number; limit: number }> {
  const db = getTelegramDatabase()
  const today = new Date().toISOString().split('T')[0]
  
  try {
    const records = await db.read(TABLE_NAME, {
      where: {
        userId,
        date: today
      }
    })
    
    const count = records.length > 0 ? records[0].count : 0
    return { today: count, limit: DAILY_LIMIT }
  } catch (error) {
    return { today: 0, limit: DAILY_LIMIT }
  }
}

