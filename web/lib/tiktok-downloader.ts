/**
 * TikTok Video Downloader
 * 
 * Downloads TikTok videos without watermarks using tiktok-scraper.
 * Reference: https://github.com/drawrowfly/tiktok-scraper
 */

// Note: tiktok-scraper library API may vary
// This is a wrapper that adapts to the actual library interface
let TikTokScraper: any = null

try {
  // Try to import tiktok-scraper - adjust based on actual package
  TikTokScraper = require('tiktok-scraper')
} catch (error) {
  console.warn('tiktok-scraper not available, using fallback')
}

export interface DownloadOptions {
  noWatermark?: boolean
  hd?: boolean
}

export interface DownloadResult {
  videoUrl: string
  thumbnailUrl?: string
  metadata: {
    id: string
    description: string
    author: {
      id: string
      username: string
      nickname: string
      avatar?: string
    }
    stats: {
      likes: number
      shares: number
      comments: number
      views: number
    }
    music?: {
      title: string
      author: string
      url?: string
    }
    hashtags?: string[]
    duration: number
    timestamp: number
  }
}

export class TikTokDownloader {
  private scraper: any

  constructor() {
    // Initialize TikTok scraper if available
    // Adjust initialization based on actual library API
    if (TikTokScraper) {
      try {
        // Try different initialization patterns
        if (typeof TikTokScraper === 'function') {
          this.scraper = new TikTokScraper({
            download: false,
            filepath: '/tmp',
            filetype: 'mp4'
          })
        } else if (TikTokScraper.default) {
          this.scraper = new TikTokScraper.default({
            download: false,
            filepath: '/tmp',
            filetype: 'mp4'
          })
        }
      } catch (error) {
        console.warn('Failed to initialize TikTok scraper:', error)
      }
    }
  }

  /**
   * Download video by URL
   */
  async downloadByUrl(url: string, options?: DownloadOptions): Promise<DownloadResult> {
    try {
      let videoData: any

      if (this.scraper) {
        // Use tiktok-scraper library if available
        // Adjust method calls based on actual library API
        if (this.scraper.getVideoMeta) {
          videoData = await this.scraper.getVideoMeta(url, {
            hd: options?.hd || false
          })
        } else if (this.scraper.video) {
          videoData = await this.scraper.video(url)
        } else {
          // Fallback: use TikTok API directly
          return await this.downloadViaAPI(url, options)
        }
      } else {
        // Fallback: use TikTok API directly
        return await this.downloadViaAPI(url, options)
      }

      // Get download URL (without watermark if requested)
      const downloadUrl = options?.noWatermark 
        ? videoData.videoUrlNoWaterMark || videoData.videoUrl || videoData.downloadUrl
        : videoData.videoUrl || videoData.downloadUrl

      return {
        videoUrl: downloadUrl,
        thumbnailUrl: videoData.cover || videoData.thumbnail,
        metadata: {
          id: videoData.id || videoData.aweme_id,
          description: videoData.text || videoData.desc || '',
          author: {
            id: videoData.authorId || videoData.author?.id || '',
            username: videoData.authorMeta?.name || videoData.author?.unique_id || '',
            nickname: videoData.authorMeta?.nickName || videoData.author?.nickname || '',
            avatar: videoData.authorMeta?.avatar || videoData.author?.avatar
          },
          stats: {
            likes: videoData.diggCount || videoData.statistics?.digg_count || 0,
            shares: videoData.shareCount || videoData.statistics?.share_count || 0,
            comments: videoData.commentCount || videoData.statistics?.comment_count || 0,
            views: videoData.playCount || videoData.statistics?.play_count || 0
          },
          music: videoData.musicMeta || videoData.music ? {
            title: (videoData.musicMeta?.musicName || videoData.music?.title) || '',
            author: (videoData.musicMeta?.musicAuthor || videoData.music?.author) || '',
            url: videoData.musicMeta?.musicUrl || videoData.music?.play_url
          } : undefined,
          hashtags: this.extractHashtags(videoData.text || videoData.desc || ''),
          duration: videoData.duration || videoData.video?.duration || 0,
          timestamp: videoData.createTime || videoData.create_time || Date.now()
        }
      }
    } catch (error) {
      console.error('Error downloading TikTok video:', error)
      // Fallback to API method
      return await this.downloadViaAPI(url, options)
    }
  }

  /**
   * Fallback: Download via TikTok API
   */
  private async downloadViaAPI(url: string, options?: DownloadOptions): Promise<DownloadResult> {
    // Use existing TikTok service functions as fallback
    const { getVideoById } = require('./tiktok-service')
    
    // Extract video ID from URL
    const videoIdMatch = url.match(/video\/(\d+)/)
    if (!videoIdMatch) {
      throw new Error('Invalid TikTok URL')
    }

    const video = await getVideoById(videoIdMatch[1])
    if (!video) {
      throw new Error('Video not found')
    }

    return {
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      metadata: {
        id: video.id,
        description: video.description,
        author: {
          id: video.author.id,
          username: video.author.username,
          nickname: video.author.username,
          avatar: video.author.avatar
        },
        stats: video.stats,
        music: video.music,
        hashtags: video.hashtags,
        duration: video.duration,
        timestamp: video.timestamp
      }
    }
  }

  /**
   * Download video by ID
   */
  async downloadById(videoId: string, options?: DownloadOptions): Promise<DownloadResult> {
    // Construct URL from ID
    const url = `https://www.tiktok.com/@user/video/${videoId}`
    return await this.downloadByUrl(url, options)
  }

  /**
   * Download video file to buffer
   */
  async downloadToBuffer(videoUrl: string): Promise<Buffer> {
    try {
      const response = await fetch(videoUrl)
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`)
      }
      
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error('Error downloading video to buffer:', error)
      throw error
    }
  }

  /**
   * Extract hashtags from text
   */
  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#(\w+)/g
    const matches = text.match(hashtagRegex)
    return matches ? matches.map(m => m.substring(1)) : []
  }

  /**
   * Get video metadata without downloading
   */
  async getMetadata(url: string): Promise<DownloadResult['metadata']> {
    const result = await this.downloadByUrl(url, { noWatermark: false })
    return result.metadata
  }
}

// Singleton instance
let downloaderInstance: TikTokDownloader | null = null

export function getTikTokDownloader(): TikTokDownloader {
  if (!downloaderInstance) {
    downloaderInstance = new TikTokDownloader()
  }
  return downloaderInstance
}

