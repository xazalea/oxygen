import { NextRequest, NextResponse } from 'next/server'
import { getDBOperations } from '@/lib/telegram-db-operations'
import { getDownloadService } from '@/lib/download-service'

export const dynamic = 'force-dynamic'

interface WorkerSubmitRequest {
  userId: string
  platform: 'youtube' | 'tiktok'
  videos: any[] // Raw video data from Piped or TikTok
}

export async function POST(request: NextRequest) {
  try {
    const body: WorkerSubmitRequest = await request.json()
    const { userId, platform, videos } = body

    if (!userId || !platform || !Array.isArray(videos)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const db = getDBOperations()
    const downloadService = getDownloadService()

    // Update user's last synced timestamp
    const user = await db.getUser(userId)
    if (user && user.linkedAccounts) {
      await db.updateUser(userId, {
        linkedAccounts: {
          ...user.linkedAccounts,
          lastSyncedAt: Date.now()
        }
      })
    }

    let processedCount = 0

    // Process videos
    if (platform === 'tiktok') {
      // Existing TikTok logic
       const { parseTikTokVideo } = require('@/lib/tiktok-api-enhanced')
       
       for (const videoData of videos) {
         try {
           const parsed = parseTikTokVideo(videoData)
           if (parsed.videoUrl) {
             const existing = await db.getVideoByTikTokId(parsed.id)
             if (!existing || existing.downloadStatus !== 'completed') {
                await downloadService.queueDownload(
                  existing?.id || parsed.id,
                  parsed.id,
                  existing ? 1 : 0
                )
                processedCount++
             }
           }
         } catch (err) {
           console.warn('Error processing TikTok video from worker:', err)
         }
       }
    } else if (platform === 'youtube') {
      // YouTube logic
      // We need to map Piped video format to our VideoRecord format
      // Since our Schema is TikTok-centric (tiktokId), we might need to adapt it
      // For now, we'll store youtube ID in tiktokId field or add a new field (but schema is fixed for now)
      // We will use tiktokId field for generic external ID
      
      for (const video of videos) {
         // Piped video object structure:
         // { url: "/watch?v=...", title: "...", thumbnail: "...", duration: 123, uploaderUrl: "...", uploaderName: "...", uploaded: 123456... }
         
         const videoId = video.url.split('v=')[1]
         if (!videoId) continue
         
         const existing = await db.getVideoByTikTokId(videoId) // Using tiktokId to store YouTube ID for now
         
         if (!existing) {
           // Create new video record
           // We'll queue it for download
           // Note: download-service might need updates to handle YouTube URLs if it uses a specific TikTok downloader
           // But for now we queue it.
           
           // Ideally we should create the DB record here too, but downloadService usually expects ID.
           // Let's create a partial record or just queue it if downloadService handles creation.
           // Looking at previous code, cron job queues (existing?.id || video.id).
           // If it doesn't exist, it passes the external ID as the internal ID too.
           
           await downloadService.queueDownload(
             videoId,
             videoId, // "tiktokId" / external ID
             0
           )
           processedCount++
         }
      }
    }

    // Update cache with new results
    if (processedCount > 0) {
      try {
        await fetch(new URL('/api/cache/update', request.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: platform,
            identifier: platform === 'tiktok' ? videos[0]?.author?.username : videos[0]?.uploaderUrl?.split('/').pop(),
            data: { videos }
          })
        })
      } catch (e) {
        console.error('Failed to trigger cache update:', e)
      }
    }

    return NextResponse.json({ success: true, processed: processedCount })
  } catch (error) {
    console.error('Error in worker submit API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

