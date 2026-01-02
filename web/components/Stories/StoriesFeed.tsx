'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, MessageCircle, Share2, MoreVertical } from 'lucide-react'
import { UiverseIconButton } from '../UI/UiverseIconButton'
import { LiquidGlass } from '../UI/LiquidGlass'
import { getDBOperations } from '@/lib/telegram-db-operations'
import { StoryRecord } from '@/lib/telegram-db-schema'

interface StoriesFeedProps {
  userId?: string
  onClose?: () => void
}

export function StoriesFeed({ userId, onClose }: StoriesFeedProps) {
  const [stories, setStories] = useState<StoryRecord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const progressIntervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    loadStories()
  }, [userId])

  useEffect(() => {
    if (isPlaying && stories.length > 0) {
      const currentStory = stories[currentStoryIndex]
      const duration = 5000 // 5 seconds per story
      
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            nextStory()
            return 0
          }
          return prev + (100 / (duration / 100))
        })
      }, 100)

      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
        }
      }
    }
  }, [isPlaying, currentStoryIndex, stories])

  const loadStories = async () => {
    try {
      const db = getDBOperations()
      const userStories = userId 
        ? await db.getUserStories(userId)
        : [] // Load all stories from followed users
      setStories(userStories)
    } catch (error) {
      console.error('Error loading stories:', error)
    }
  }

  const nextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1)
      setProgress(0)
    } else {
      // Move to next user's stories
      if (currentIndex < stories.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setCurrentStoryIndex(0)
        setProgress(0)
      } else if (onClose) {
        onClose()
      }
    }
  }

  const previousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1)
      setProgress(0)
    } else if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setCurrentStoryIndex(0)
      setProgress(0)
    }
  }

  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width

    if (x < width / 3) {
      previousStory()
    } else if (x > (width * 2) / 3) {
      nextStory()
    } else {
      setIsPlaying(prev => !prev)
    }
  }

  const currentStory = stories[currentStoryIndex]

  if (!currentStory) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <p className="text-white">No stories available</p>
        {onClose && (
          <UiverseIconButton
            onClick={onClose}
            className="absolute top-4 right-4"
          >
            <X className="w-6 h-6" />
          </UiverseIconButton>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 flex gap-1 p-2">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-full bg-white/20 rounded-full overflow-hidden">
            {index === currentStoryIndex && (
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            )}
            {index < currentStoryIndex && (
              <div className="h-full bg-white rounded-full w-full" />
            )}
          </div>
        ))}
      </div>

      {/* Story content */}
      <div 
        className="w-full h-full flex items-center justify-center"
        onClick={handleTap}
      >
        {currentStory.mediaType === 'video' ? (
          <video
            src={currentStory.mediaUrl}
            className="w-full h-full object-contain"
            autoPlay
            loop={false}
            onEnded={nextStory}
          />
        ) : (
          <img
            src={currentStory.mediaUrl}
            alt={currentStory.caption}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* Top bar */}
      <LiquidGlass preset="default" className="absolute top-12 left-0 right-0 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
            <div>
              <p className="text-white font-semibold">@{currentStory.userId}</p>
              <p className="text-white/60 text-xs">2h ago</p>
            </div>
          </div>
          {onClose && (
            <UiverseIconButton onClick={onClose}>
              <X className="w-5 h-5" />
            </UiverseIconButton>
          )}
        </div>
      </LiquidGlass>

      {/* Bottom actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <LiquidGlass preset="default" className="p-4">
          {currentStory.caption && (
            <p className="text-white mb-4">{currentStory.caption}</p>
          )}
          <div className="flex items-center gap-4">
            <UiverseIconButton>
              <Heart className="w-6 h-6" />
            </UiverseIconButton>
            <UiverseIconButton>
              <MessageCircle className="w-6 h-6" />
            </UiverseIconButton>
            <UiverseIconButton>
              <Share2 className="w-6 h-6" />
            </UiverseIconButton>
            <UiverseIconButton>
              <MoreVertical className="w-6 h-6" />
            </UiverseIconButton>
          </div>
        </LiquidGlass>
      </div>
    </div>
  )
}

