/**
 * Video Prefetching System
 * 
 * Prefetches videos for better performance and user experience.
 */

import { getCacheManager } from './cache-manager'
import { videoAPI, VideoMetadata } from './video-api'

export class VideoPrefetch {
  private cache = getCacheManager()
  private prefetchQueue: string[] = []
  private isPrefetching: boolean = false
  private maxPrefetch: number = 5

  /**
   * Prefetch next videos in feed
   */
  async prefetchNextVideos(currentVideoId: string, allVideos: VideoMetadata[]): Promise<void> {
    const currentIndex = allVideos.findIndex(v => v.id === currentVideoId)
    if (currentIndex === -1) return

    // Prefetch next 3-5 videos
    const nextVideos = allVideos.slice(currentIndex + 1, currentIndex + 1 + this.maxPrefetch)
    
    for (const video of nextVideos) {
      if (!this.prefetchQueue.includes(video.id)) {
        this.prefetchQueue.push(video.id)
      }
    }

    // Start prefetching if not already
    if (!this.isPrefetching) {
      this.processPrefetchQueue()
    }
  }

  /**
   * Prefetch video metadata
   */
  async prefetchVideoMetadata(videoId: string): Promise<void> {
    const cacheKey = `video_metadata_${videoId}`
    
    // Check if already cached
    const cached = await this.cache.get<VideoMetadata>(cacheKey)
    if (cached) {
      return
    }

    try {
      const video = await videoAPI.getVideo(videoId)
      await this.cache.set(cacheKey, video, {
        ttl: 3600, // 1 hour
        tags: ['video', `video_${videoId}`]
      })
    } catch (error) {
      console.error(`Error prefetching video ${videoId}:`, error)
    }
  }

  /**
   * Prefetch video file (for Telegram videos)
   */
  async prefetchVideoFile(video: VideoMetadata): Promise<void> {
    if (video.source !== 'telegram') {
      return // Only prefetch Telegram videos
    }

    const cacheKey = `video_file_${video.id}`
    
    // Check if already cached
    const cached = await this.cache.get<ArrayBuffer>(cacheKey)
    if (cached) {
      return
    }

    try {
      // Prefetch video file
      const response = await fetch(video.videoUrl, {
        method: 'HEAD' // Just check if available, don't download full file
      })

      if (response.ok) {
        // Store metadata about availability
        await this.cache.set(cacheKey, { available: true }, {
          ttl: 1800, // 30 minutes
          tags: ['video_file', `video_file_${video.id}`]
        })
      }
    } catch (error) {
      console.error(`Error prefetching video file ${video.id}:`, error)
    }
  }

  /**
   * Process prefetch queue
   */
  private async processPrefetchQueue(): Promise<void> {
    if (this.isPrefetching || this.prefetchQueue.length === 0) {
      return
    }

    this.isPrefetching = true

    while (this.prefetchQueue.length > 0) {
      const videoId = this.prefetchQueue.shift()
      if (videoId) {
        await this.prefetchVideoMetadata(videoId)
        
        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    this.isPrefetching = false
  }

  /**
   * Clear prefetch queue
   */
  clearQueue(): void {
    this.prefetchQueue = []
  }
}

// Singleton instance
let prefetchInstance: VideoPrefetch | null = null

export function getVideoPrefetch(): VideoPrefetch {
  if (!prefetchInstance) {
    prefetchInstance = new VideoPrefetch()
  }
  return prefetchInstance
}



