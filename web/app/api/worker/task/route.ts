import { NextRequest, NextResponse } from 'next/server'
import { getDBOperations } from '@/lib/telegram-db-operations'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const db = getDBOperations()
    const users = await db.getUsersWithLinkedAccounts()
    
    // Find a user that hasn't been synced in the last hour
    // Prioritize users who have never been synced
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    
    // Filter for users needing sync
    const usersNeedingSync = users.filter(user => {
      const lastSynced = user.linkedAccounts?.lastSyncedAt || 0
      return lastSynced < oneHourAgo
    })
    
    if (usersNeedingSync.length === 0) {
      return NextResponse.json({ task: null })
    }
    
    // Pick a random user to avoid race conditions with multiple workers
    const targetUser = usersNeedingSync[Math.floor(Math.random() * usersNeedingSync.length)]
    
    // Determine platform to check
    // If both are linked, pick one randomly or based on some logic
    let platform: 'tiktok' | 'youtube' | null = null
    let identifier: string | undefined = undefined
    
    if (targetUser.linkedAccounts?.youtube && targetUser.linkedAccounts?.tiktok) {
       platform = Math.random() > 0.5 ? 'youtube' : 'tiktok'
    } else if (targetUser.linkedAccounts?.youtube) {
       platform = 'youtube'
    } else if (targetUser.linkedAccounts?.tiktok) {
       platform = 'tiktok'
    }
    
    if (platform === 'youtube') {
      identifier = targetUser.linkedAccounts?.youtube
    } else if (platform === 'tiktok') {
      identifier = targetUser.linkedAccounts?.tiktok
    }
    
    if (!platform || !identifier) {
      return NextResponse.json({ task: null })
    }
    
    return NextResponse.json({
      task: {
        type: platform,
        identifier,
        userId: targetUser.id
      }
    })
  } catch (error) {
    console.error('Error fetching worker task:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

