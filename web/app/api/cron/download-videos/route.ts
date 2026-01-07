import { NextRequest, NextResponse } from 'next/server'
import { getDownloadService } from '@/lib/download-service'
import { getDBOperations } from '@/lib/telegram-db-operations'
import { getUserVideos } from '@/lib/tiktok-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Vercel Cron Job: Download trending videos
 * 
 * This endpoint should be called by Vercel Cron Jobs.
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/download-videos",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const downloadService = getDownloadService()
    const db = getDBOperations()

    // Get videos from linked accounts
    const users = await db.getUsersWithLinkedAccounts()
    let videosToProcess: any[] = []

    console.log(`Found ${users.length} users with linked accounts`)

    for (const user of users) {
      if (user.linkedAccounts?.tiktok) {
        try {
          console.log(`Fetching videos for user: ${user.username} (TikTok: ${user.linkedAccounts.tiktok})`)
          const userVideos = await getUserVideos(user.linkedAccounts.tiktok, 10)
          videosToProcess = [...videosToProcess, ...userVideos]
        } catch (err) {
          console.error(`Failed to fetch videos for user ${user.username}:`, err)
        }
      }
    }

    // Queue downloads for videos not yet downloaded
    let queued = 0
    for (const video of videosToProcess) {
      // Check if already downloaded
      const existing = await db.getVideoByTikTokId(video.id)
      
      if (!existing || existing.downloadStatus !== 'completed') {
        // Queue for download
        await downloadService.queueDownload(
          existing?.id || video.id,
          video.id,
          existing ? 1 : 0 // Higher priority for videos already in DB
        )
        queued++
      }
    }

    // Process download queue
    await downloadService.processQueue()

    return NextResponse.json({
      success: true,
      queued,
      processed: true,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Error in download videos cron job:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process downloads',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

