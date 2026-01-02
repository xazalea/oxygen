/**
 * Background Download Service
 * 
 * Manages video download queue and processes downloads in the background.
 */

import { getTikTokDownloader, TikTokDownloader } from './tiktok-downloader'
import { getUnifiedStorage, UnifiedStorage } from './unified-storage'
import { getDBOperations, TelegramDBOperations } from './telegram-db-operations'
import { DownloadRecord } from './telegram-db-schema'

export interface DownloadQueueItem {
  videoId: string
  tiktokId: string
  priority?: number
}

export class DownloadService {
  private downloader: TikTokDownloader
  private storage: UnifiedStorage
  private db: TelegramDBOperations
  private isProcessing: boolean = false
  private maxConcurrent: number = parseInt(process.env.MAX_CONCURRENT_DOWNLOADS || '3', 10)
  private processingQueue: Set<string> = new Set()

  constructor() {
    this.downloader = getTikTokDownloader()
    this.storage = getUnifiedStorage()
    this.db = getDBOperations()
    // Initialize unified storage
    this.storage.initialize().catch(console.warn)
  }

  /**
   * Add video to download queue
   */
  async queueDownload(videoId: string, tiktokId: string, priority: number = 0): Promise<DownloadRecord> {
    // Check if already in queue or downloading
    const existing = await this.db.getDownload(videoId)
    if (existing && ['queued', 'downloading', 'uploading'].includes(existing.status)) {
      // Update priority if higher
      if (priority > existing.priority) {
        await this.db.updateDownloadStatus(existing.id, existing.status, existing.progress, undefined, undefined)
      }
      return existing
    }

    // Create new download record
    return await this.db.createDownload({
      videoId,
      tiktokId,
      status: 'queued',
      priority,
      progress: 0
    })
  }

  /**
   * Process download queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return
    }

    this.isProcessing = true

    try {
      // Get pending downloads ordered by priority
      const pending = await this.db.getPendingDownloads(this.maxConcurrent)

      // Process downloads concurrently (up to maxConcurrent)
      const promises = pending
        .filter(d => !this.processingQueue.has(d.id))
        .slice(0, this.maxConcurrent)
        .map(download => this.processDownload(download))

      await Promise.allSettled(promises)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Process a single download
   */
  private async processDownload(download: DownloadRecord): Promise<void> {
    if (this.processingQueue.has(download.id)) {
      return
    }

    this.processingQueue.add(download.id)

    try {
      // Update status to downloading
      await this.db.updateDownloadStatus(download.id, 'downloading', 10)

      // Download video from TikTok
      const result = await this.downloader.downloadById(download.tiktokId, {
        noWatermark: true,
        hd: true
      })

      // Update progress
      await this.db.updateDownloadStatus(download.id, 'downloading', 50)

      // Download video to buffer
      const videoBuffer = await this.downloader.downloadToBuffer(result.videoUrl)

      // Update progress
      await this.db.updateDownloadStatus(download.id, 'uploading', 70)

      // Upload to unified storage (round-robin between Telegram and Streamtape)
      const fileName = `videos/${download.videoId}.mp4`
      const metadata = await this.storage.uploadFile(fileName, videoBuffer, {
        mimeType: 'video/mp4',
        description: `TikTok video: ${download.tiktokId}`
      })
      
      // Store mapping for future retrieval
      this.storage.storeFileMapping(metadata.fileId, metadata.storageType)

      // Update progress
      await this.db.updateDownloadStatus(download.id, 'uploading', 90)

      // Update video record in database
      const video = await this.db.getVideoByTikTokId(download.tiktokId)
      if (video) {
        await this.db.updateVideoDownloadStatus(
          video.id,
          'completed',
          metadata.fileId
        )
      } else {
        // Create video record if it doesn't exist
        await this.db.createVideo({
          tiktokId: download.tiktokId,
          telegramFileId: metadata.fileId,
          videoUrl: result.videoUrl, // Fallback URL
          thumbnailUrl: result.thumbnailUrl,
          duration: result.metadata.duration,
          description: result.metadata.description,
          author: {
            id: result.metadata.author.id,
            username: result.metadata.author.username,
            avatar: result.metadata.author.avatar
          },
          stats: result.metadata.stats,
          music: result.metadata.music,
          hashtags: result.metadata.hashtags,
          timestamp: result.metadata.timestamp,
          downloadStatus: 'completed',
          downloadedAt: Date.now()
        })
      }

      // Mark download as completed
      await this.db.updateDownloadStatus(
        download.id,
        'completed',
        100,
        metadata.fileId
      )
    } catch (error) {
      console.error(`Error processing download ${download.id}:`, error)
      
      // Mark as failed
      await this.db.updateDownloadStatus(
        download.id,
        'failed',
        download.progress,
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      )
    } finally {
      this.processingQueue.delete(download.id)
    }
  }

  /**
   * Get download status
   */
  async getDownloadStatus(videoId: string): Promise<DownloadRecord | null> {
    const downloads = await this.db.read('downloads', {
      where: { videoId },
      limit: 1
    })
    return downloads[0] as DownloadRecord || null
  }

  /**
   * Cancel a download
   */
  async cancelDownload(downloadId: string): Promise<boolean> {
    const download = await this.db.getDownload(downloadId)
    if (!download) {
      return false
    }

    if (['queued', 'downloading', 'uploading'].includes(download.status)) {
      await this.db.updateDownloadStatus(download.id, 'failed', download.progress, undefined, 'Cancelled by user')
      this.processingQueue.delete(download.id)
      return true
    }

    return false
  }

  /**
   * Start continuous processing (for background workers)
   */
  startContinuousProcessing(intervalMs: number = 5000): void {
    setInterval(() => {
      this.processQueue().catch(console.error)
    }, intervalMs)
  }
}

// Singleton instance
let serviceInstance: DownloadService | null = null

export function getDownloadService(): DownloadService {
  if (!serviceInstance) {
    serviceInstance = new DownloadService()
  }
  return serviceInstance
}

