import axios from 'axios'

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

  constructor(baseURL: string = API_BASE_URL) {
    // Use relative URLs if no base URL is set (same origin)
    this.baseURL = baseURL || ''
  }

  async getTrending(count: number = 20): Promise<VideoMetadata[]> {
    try {
      const url = this.baseURL ? `${this.baseURL}/api/trending` : '/api/trending'
      const response = await axios.get(url, {
        params: { count },
        timeout: 30000, // 30 second timeout
      })
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format')
      }
      
      return response.data
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
      const url = this.baseURL ? `${this.baseURL}/api/video/${id}` : `/api/video/${id}`
      const response = await axios.get(url, {
        timeout: 30000,
      })
      
      if (!response.data || !response.data.id) {
        throw new Error('Invalid video data')
      }
      
      return response.data
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
      const url = this.baseURL ? `${this.baseURL}/api/interaction` : '/api/interaction'
      await axios.post(url, interaction, {
        timeout: 10000, // 10 second timeout for interactions
      })
    } catch (error) {
      // Don't throw - interactions should not block UI
      // But log for monitoring
      console.error('Error recording interaction:', error)
    }
  }
}

export const videoAPI = new VideoAPI()

