/**
 * TikTok API Service
 * Handles TikTok API integration for Next.js API routes
 * 
 * Based on:
 * - https://github.com/davidteather/TikTok-Api (TikTok-Api Python library)
 * - https://github.com/huaji233333/tiktok_source (Reverse-engineered TikTok source)
 */

import {
  fetchTrendingVideos,
  fetchVideoById,
  parseTikTokVideo,
  extractHashtags,
} from './tiktok-api-enhanced'

export interface TikTokVideo {
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

export async function getTrendingVideos(count: number = 20): Promise<TikTokVideo[]> {
  try {
    // Fetch videos using enhanced API based on TikTok-Api library approach
    const { videos: rawVideos } = await fetchTrendingVideos(count)
    const videos: TikTokVideo[] = []

    for (const videoData of rawVideos.slice(0, count)) {
      try {
        const parsed = parseTikTokVideo(videoData)
        
        // Only add videos with valid video URLs
        if (parsed.videoUrl) {
          videos.push(parsed)
        }
      } catch (err) {
        console.warn('Error parsing video:', err)
        // Continue with next video
      }
    }

    if (videos.length === 0) {
      throw new Error('No valid videos found')
    }

    return videos
  } catch (error: any) {
    console.error('Error fetching trending videos:', error)
    throw new Error(
      error.message || 
      'Failed to fetch trending videos. Please check your TikTok API token or try again later.'
    )
  }
}

export async function getVideoById(videoId: string): Promise<TikTokVideo | null> {
  try {
    // First try to fetch directly by ID using TikTok-Api approach
    const videoData = await fetchVideoById(videoId)
    
    if (videoData) {
      return parseTikTokVideo(videoData)
    }

    // Fallback: try to find in trending (cache-friendly)
    try {
      const { videos: trending } = await fetchTrendingVideos(50)
      const found = trending.find((v) => v.id === videoId)
      
      if (found) {
        return parseTikTokVideo(found)
      }
    } catch (err) {
      console.warn('Error checking trending for video:', err)
    }

    return null
  } catch (error) {
    console.error('Error fetching video:', error)
    return null
  }
}

