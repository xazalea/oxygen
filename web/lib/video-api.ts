import axios from 'axios'
import { getTikTokService } from './tiktok-service'

// Server-only imports - dynamically loaded to avoid bundling Node.js modules in the browser
// Using a function to prevent webpack from statically analyzing the require
function getServerModules() {
  if (typeof window !== 'undefined') {
    return { getDBOperations: null, getTelegramStorage: null }
  }
  
  try {
    // Use eval to prevent webpack from statically analyzing this
    const dbOps = eval('require')('./telegram-db-operations')
    const storage = eval('require')('./telegram-storage')
    return {
      getDBOperations: dbOps.getDBOperations,
      getTelegramStorage: storage.getTelegramStorage
    }
  } catch (e) {
    return { getDBOperations: null, getTelegramStorage: null }
  }
}

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
  private db: any = null
  private storage: any = null

  constructor(baseURL: string = API_BASE_URL) {
    // Use relative URLs if no base URL is set (same origin)
    this.baseURL = baseURL || ''
    
    // Only initialize server-side modules when running on the server
    if (typeof window === 'undefined') {
      try {
        const { getDBOperations, getTelegramStorage } = getServerModules()
        if (getDBOperations && getTelegramStorage) {
          this.db = getDBOperations()
          this.storage = getTelegramStorage()
        }
      } catch (e) {
        // Ignore if initialization fails
        console.warn('Failed to initialize Telegram storage:', e)
      }
    }
  }

  /**
   * Convert VideoRecord to VideoMetadata
   */
  private convertToVideoMetadata(record: any, source: 'telegram' | 'tiktok' = 'tiktok'): VideoMetadata {
    // If video is in Telegram, use Telegram file URL
    let videoUrl = record.videoUrl
    if (record.telegramFileId && source === 'telegram' && this.storage) {
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
      // First, try to get from Telegram database (server-side only)
      if (this.db) {
        try {
          const dbVideos = await this.db.getTrendingVideos(count)
          
          if (dbVideos.length > 0) {
            // Return videos from Telegram database
            return dbVideos.map(v => this.convertToVideoMetadata(v, 'telegram'))
          }
        } catch (dbError) {
          // If database fails, fall through to API
          console.warn('Database query failed, falling back to API:', dbError)
        }
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
      
      // Store videos in database for future use (server-side only)
      const videos = response.data as VideoMetadata[]
      if (this.db) {
        try {
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
        } catch (dbError) {
          // Ignore database errors - videos will still be returned
          console.warn('Failed to store videos in database:', dbError)
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
      // First, try to get from Telegram database (server-side only)
      if (this.db) {
        try {
          const dbVideo = await this.db.getVideo(id)
          if (dbVideo) {
            return this.convertToVideoMetadata(dbVideo, dbVideo.telegramFileId ? 'telegram' : 'tiktok')
          }

          // Try by TikTok ID
          const dbVideoByTikTok = await this.db.getVideoByTikTokId(id)
          if (dbVideoByTikTok) {
            return this.convertToVideoMetadata(dbVideoByTikTok, dbVideoByTikTok.telegramFileId ? 'telegram' : 'tiktok')
          }
        } catch (dbError) {
          // If database fails, fall through to API
          console.warn('Database query failed, falling back to API:', dbError)
        }
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
      
      // Store in database for future use (server-side only)
      if (this.db) {
        try {
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
        } catch (dbError) {
          // Ignore database errors - video will still be returned
          console.warn('Failed to store video in database:', dbError)
        }
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
      // Store in Telegram database (server-side only)
      if (this.db) {
        try {
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
        } catch (dbError) {
          // Ignore database errors - will still send to API
          console.warn('Failed to store interaction in database:', dbError)
        }
      }

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

