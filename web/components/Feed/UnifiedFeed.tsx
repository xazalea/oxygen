'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { VideoPlayer } from '../VideoPlayer'
import { StoriesFeed } from '../Stories/StoriesFeed'
import { TextPost } from '../Posts/TextPost'
import { VideoMetadata } from '@/lib/video-api'
import { TextPostRecord } from '@/lib/telegram-db-schema'
import { StoryRecord } from '@/lib/telegram-db-schema'
import { getDBOperations } from '@/lib/telegram-db-operations'
import { videoAPI } from '@/lib/video-api'

export type FeedItemType = 'video' | 'story' | 'text' | 'image'

export interface UnifiedFeedItem {
  id: string
  type: FeedItemType
  data: VideoMetadata | TextPostRecord | StoryRecord | any
  timestamp: number
}

interface UnifiedFeedProps {
  userId?: string
  feedType?: 'all' | 'videos' | 'stories' | 'text' | 'following'
}

export function UnifiedFeed({ userId, feedType = 'all' }: UnifiedFeedProps) {
  const [items, setItems] = useState<UnifiedFeedItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeed()
  }, [feedType, userId])

  const loadFeed = async () => {
    setLoading(true)
    try {
      const db = getDBOperations()
      const feedItems: UnifiedFeedItem[] = []

      // Load videos
      if (feedType === 'all' || feedType === 'videos') {
        const videos = await videoAPI.getTrending(20)
        videos.forEach(video => {
          feedItems.push({
            id: video.id,
            type: 'video',
            data: video,
            timestamp: video.timestamp
          })
        })
      }

      // Load text posts
      if (feedType === 'all' || feedType === 'text') {
        // Fallback since getDBOperations doesn't expose generic read
        // In a real implementation, we would add getTextPosts to TelegramDBOperations
        const posts: TextPostRecord[] = [] 
        
        posts.forEach(post => {
          feedItems.push({
            id: post.id,
            type: 'text',
            data: post,
            timestamp: post.createdAt
          })
        })
      }

      // Load stories
      if (feedType === 'all' || feedType === 'stories') {
        // Fallback since getDBOperations doesn't expose generic read
        const stories: StoryRecord[] = []
        
        stories.forEach(story => {
          feedItems.push({
            id: story.id,
            type: 'story',
            data: story,
            timestamp: story.createdAt
          })
        })
      }

      // Sort by timestamp
      feedItems.sort((a, b) => b.timestamp - a.timestamp)
      setItems(feedItems)
    } catch (error) {
      console.error('Error loading feed:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderItem = (item: UnifiedFeedItem, index: number) => {
    const isActive = index === currentIndex

    switch (item.type) {
      case 'video':
        return (
          <div key={item.id} className="w-full h-full">
            <VideoPlayer
              video={item.data as VideoMetadata}
              isActive={isActive}
              onInteraction={(type, value) => {
                // Handle interaction
              }}
              onWatchTime={(time) => {
                // Handle watch time
              }}
            />
          </div>
        )

      case 'text':
        return (
          <div key={item.id} className="w-full p-4">
            <TextPost post={item.data as TextPostRecord} />
          </div>
        )

      case 'story':
        return (
          <div key={item.id} className="w-full h-full">
            {isActive && (
              <StoriesFeed userId={(item.data as StoryRecord).userId} />
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading feed...</div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-black overflow-hidden">
      <div className="h-full overflow-y-auto snap-y snap-mandatory">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="h-screen snap-start"
            onScroll={() => {
              // Update current index based on scroll
              const scrollTop = window.scrollY
              const itemTop = index * window.innerHeight
              if (scrollTop >= itemTop && scrollTop < itemTop + window.innerHeight) {
                setCurrentIndex(index)
              }
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

