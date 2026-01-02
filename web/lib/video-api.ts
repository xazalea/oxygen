import axios from 'axios'
import { getDBOperations } from './telegram-db-operations'
import { getTelegramStorage } from './telegram-storage'
import { VideoRecord } from './telegram-db-schema'
import { getTikTokService } from './tiktok-service'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

export interface VideoMetadata {
  id: string
  videoUrl: string
  thumbnailUrl?: string
  duration: number
  description: string
  author: {
    id: string
    username: string
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
  }
  hashtags?: string[]
  timestamp: number
  source?: 'telegram' | 'tiktok' // Indicates where video is served from
}

export interface InteractionData {
  userId: string
  videoId: string
  sessionId: string
  watchTime: number
  completionRate: number
  skipped: boolean
  liked: boolean
  shared: boolean
  commented: boolean
  timestamp: number
}

class VideoAPI {
  private baseURL: string
  private db: ReturnType<typeof getDBOperations>
  private storage: ReturnType<typeof getTelegramStorage>

  constructor(baseURL: string = API_BASE_URL) {
    // Use relative URLs if no base URL is set (same origin)
    this.baseURL = baseURL || ''
    this.db = getDBOperations()
    this.storage = getTelegramStorage()
  }

  /**
   * Convert VideoRecord to VideoMetadata
   */
  private convertToVideoMetadata(record: VideoRecord, source: 'telegram' | 'tiktok' = 'tiktok'): VideoMetadata {
    // If video is in Telegram, use Telegram file URL
    let videoUrl = record.videoUrl
    if (record.telegramFileId && source === 'telegram') {
      videoUrl = this.storage.getFileUrl(record.telegramFileId)
    }

    return {
      id: record.id,
      videoUrl,
      thumbnailUrl: record.thumbnailUrl,
      duration: record.duration,
      description: record.description,
      author: record.author,
      stats: record.stats,
      music: record.music,
      hashtags: record.hashtags,
      timestamp: record.timestamp,
      source
    }
  }

  async getTrending(count: number = 20): Promise<VideoMetadata[]> {
    try {
      // First, try to get from Telegram database
      const dbVideos = await this.db.getTrendingVideos(count)
      
      if (dbVideos.length > 0) {
        // Return videos from Telegram database
        return dbVideos.map(v => this.convertToVideoMetadata(v, 'telegram'))
      }

      // Fallback to TikTok API
      const url = this.baseURL ? `${this.baseURL}/api/trending` : '/api/trending'
      const response = await axios.get(url, {
        params: { count },
        timeout: 30000, // 30 second timeout
      })
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format')
      }
      
      // Store videos in database for future use
      const videos = response.data as VideoMetadata[]
      for (const video of videos) {
        // Check if already exists
        const existing = await this.db.getVideoByTikTokId(video.id)
        if (!existing) {
          await this.db.createVideo({
            tiktokId: video.id,
            videoUrl: video.videoUrl,
            thumbnailUrl: video.thumbnailUrl,
            duration: video.duration,
            description: video.description,
            author: video.author,
            stats: video.stats,
            music: video.music,
            hashtags: video.hashtags,
            timestamp: video.timestamp,
            downloadStatus: 'pending'
          })
        }
      }
      
      return videos.map(v => ({ ...v, source: 'tiktok' as const }))
    } catch (error) {
      console.error('Error fetching trending videos:', error)
      throw new Error('Failed to fetch trending videos. Please try again later.')
    }
  }

  async getVideo(id: string): Promise<VideoMetadata> {
    if (!id) {
      throw new Error('Video ID is required')
    }

    try {
      // First, try to get from Telegram database
      const dbVideo = await this.db.getVideo(id)
      if (dbVideo) {
        return this.convertToVideoMetadata(dbVideo, dbVideo.telegramFileId ? 'telegram' : 'tiktok')
      }

      // Try by TikTok ID
      const dbVideoByTikTok = await this.db.getVideoByTikTokId(id)
      if (dbVideoByTikTok) {
        return this.convertToVideoMetadata(dbVideoByTikTok, dbVideoByTikTok.telegramFileId ? 'telegram' : 'tiktok')
      }

      // Fallback to TikTok API
      const url = this.baseURL ? `${this.baseURL}/api/video/${id}` : `/api/video/${id}`
      const response = await axios.get(url, {
        timeout: 30000,
      })
      
      if (!response.data || !response.data.id) {
        throw new Error('Invalid video data')
      }
      
      const video = response.data as VideoMetadata
      
      // Store in database for future use
      const existing = await this.db.getVideoByTikTokId(video.id)
      if (!existing) {
        await this.db.createVideo({
          tiktokId: video.id,
          videoUrl: video.videoUrl,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          description: video.description,
          author: video.author,
          stats: video.stats,
          music: video.music,
          hashtags: video.hashtags,
          timestamp: video.timestamp,
          downloadStatus: 'pending'
        })
      }
      
      return { ...video, source: 'tiktok' as const }
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Video not found')
      }
      console.error('Error fetching video:', error)
      throw new Error('Failed to fetch video. Please try again later.')
    }
  }

  async recordInteraction(interaction: InteractionData): Promise<void> {
    // Validate interaction data
    if (!interaction.userId || !interaction.videoId || !interaction.sessionId) {
      console.warn('Invalid interaction data:', interaction)
      return
    }

    try {
      // Store in Telegram database
      await this.db.createInteraction({
        userId: interaction.userId,
        videoId: interaction.videoId,
        type: interaction.liked ? 'like' : interaction.shared ? 'share' : interaction.commented ? 'comment' : 'watch',
        value: interaction.liked || interaction.shared || interaction.commented ? true : interaction.completionRate,
        timestamp: interaction.timestamp,
        metadata: {
          watchDuration: interaction.watchTime,
          completionRate: interaction.completionRate,
          commentText: interaction.commented ? 'User commented' : undefined
        }
      })

      // Also send to API endpoint for backward compatibility
      const url = this.baseURL ? `${this.baseURL}/api/interaction` : '/api/interaction'
      await axios.post(url, interaction, {
        timeout: 10000, // 10 second timeout for interactions
      }).catch(() => {
        // Ignore API errors if database write succeeded
      })
    } catch (error) {
      // Don't throw - interactions should not block UI
      // But log for monitoring
      console.error('Error recording interaction:', error)
    }
  }
}

export const videoAPI = new VideoAPI()

