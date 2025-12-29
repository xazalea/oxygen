'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VideoPlayer } from './VideoPlayer'
import { VideoMetadata, videoAPI } from '@/lib/video-api'
import { useRecommendationEngine } from './RecommendationEngine'
import { LoadingSpinner } from './UI/LoadingSpinner'
import { ErrorDisplay } from './ErrorDisplay'
import { SwipeIndicator } from './UI/SwipeIndicator'
import { LiquidGlass } from './UI/LiquidGlass'

export function VideoFeed() {
  const [videos, setVideos] = useState<VideoMetadata[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef<number>(0)
  const touchEndY = useRef<number>(0)
  const pullStartY = useRef<number>(0)
  const { recordInteraction, getRecommendations } = useRecommendationEngine()

  const loadVideos = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // First, load trending videos
      const trending = await videoAPI.getTrending(20)
      
      // Add videos to algorithm
      const { algorithmBridge } = await import('@/lib/algorithm-bridge')
      await algorithmBridge.addVideos(trending)
      
      // Get recommendations from algorithm
      const recommendedIds = await getRecommendations(20)
      
      // If algorithm returns recommendations, use them; otherwise use trending
      if (recommendedIds.length > 0) {
        // Fetch video metadata for recommended IDs
        const videoPromises = recommendedIds.map(id => {
          // Find video in trending list or fetch
          const existing = trending.find(v => v.id === id)
          if (existing) return Promise.resolve(existing)
          return videoAPI.getVideo(id).catch(() => null)
        })
        const fetchedVideos = (await Promise.all(videoPromises)).filter(v => v !== null) as VideoMetadata[]
        
        if (fetchedVideos.length > 0) {
          setVideos(fetchedVideos)
        } else {
          setVideos(trending)
        }
      } else {
        setVideos(trending)
      }
    } catch (error: any) {
      console.error('Error loading videos:', error)
      setIsLoading(false)
      setError(error.message || 'Failed to load videos. Please try again.')
      setVideos([])
    }
  }, [getRecommendations])

  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  const handleInteraction = useCallback(async (
    type: 'like' | 'share' | 'comment' | 'skip',
    value: boolean
  ) => {
    const currentVideo = videos[currentIndex]
    if (!currentVideo) return

    await recordInteraction({
      type: type as 'like' | 'share' | 'comment' | 'watch' | 'skip',
      videoId: currentVideo.id,
      value,
      timestamp: Date.now(),
    })
  }, [videos, currentIndex, recordInteraction])

  const handleWatchTime = useCallback(async (completionRate: number) => {
    const currentVideo = videos[currentIndex]
    if (!currentVideo) return

    // Record watch time periodically (every 25% progress)
    if (completionRate > 0 && completionRate % 0.25 < 0.05) {
      await recordInteraction({
        type: 'watch',
        videoId: currentVideo.id,
        value: completionRate,
        timestamp: Date.now(),
      })
    }
  }, [videos, currentIndex, recordInteraction])

  const handleSwipe = useCallback((direction: 'up' | 'down') => {
    if (direction === 'up') {
      // Next video
      setCurrentIndex(prev => {
        const next = prev + 1
        if (next >= videos.length - 3) {
          // Load more videos when near end
          loadVideos()
        }
        return Math.min(next, videos.length - 1)
      })
    } else {
      // Previous video
      setCurrentIndex(prev => Math.max(0, prev - 1))
    }
  }, [videos.length, loadVideos])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    pullStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY
    
    // Handle pull-to-refresh at top
    if (currentIndex === 0 && containerRef.current) {
      const scrollTop = containerRef.current.scrollTop
      if (scrollTop === 0) {
        const pullDiff = e.touches[0].clientY - pullStartY.current
        if (pullDiff > 0) {
          setPullDistance(Math.min(pullDiff, 100))
        }
      }
    }
  }

  const handleTouchEnd = () => {
    const diff = touchStartY.current - touchEndY.current
    const threshold = 50

    // Handle pull-to-refresh
    if (currentIndex === 0 && pullDistance > 60) {
      handleRefresh()
      setPullDistance(0)
      return
    }

    // Reset pull distance
    if (pullDistance > 0) {
      setPullDistance(0)
      return
    }

    // Handle swipe
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        handleSwipe('up')
      } else {
        handleSwipe('down')
      }
    }
  }

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await loadVideos()
    setCurrentIndex(0)
    setIsRefreshing(false)
  }, [loadVideos])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) > 50) {
      if (e.deltaY > 0) {
        handleSwipe('up')
      } else {
        handleSwipe('down')
      }
    }
  }, [handleSwipe])

  if (error && videos.length === 0) {
    return <ErrorDisplay message={error} onRetry={loadVideos} />
  }

  if (isLoading && videos.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <AnimatePresence mode="wait">
        {videos.map((video, index) => {
          if (Math.abs(index - currentIndex) > 1) return null

          return (
            <motion.div
              key={video.id}
              initial={{ y: index > currentIndex ? '100%' : '-100%', opacity: 0 }}
              animate={{
                y: index === currentIndex ? 0 : index > currentIndex ? '100%' : '-100%',
                opacity: index === currentIndex ? 1 : 0,
                scale: index === currentIndex ? 1 : 0.95,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <VideoPlayer
                video={video}
                isActive={index === currentIndex}
                onInteraction={handleInteraction}
                onWatchTime={handleWatchTime}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Loading indicator for next videos */}
      {isLoading && videos.length > 0 && (
        <LiquidGlass preset="pulse" className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 rounded-full">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2"
          >
            <div className="flex items-center gap-2">
              <div className="spinner-uiverse w-4 h-4"></div>
              <p className="text-white text-xs font-semibold">Loading more...</p>
            </div>
          </motion.div>
        </LiquidGlass>
      )}

      {/* Pull to refresh indicator */}
      {currentIndex === 0 && pullDistance > 0 && (
        <LiquidGlass preset="pulse" className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20 rounded-full">
          <motion.div
            style={{ opacity: Math.min(pullDistance / 60, 1) }}
            className="px-4 py-2"
          >
            <motion.div
              animate={{ rotate: pullDistance > 60 ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-white text-xs font-semibold">
                {pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'}
              </p>
            </motion.div>
          </motion.div>
        </LiquidGlass>
      )}

      {/* Swipe indicators */}
      <SwipeIndicator 
        direction="up" 
        show={videos.length > 0 && currentIndex < videos.length - 1} 
      />
      <SwipeIndicator 
        direction="down" 
        show={videos.length > 0 && currentIndex > 0} 
      />
    </div>
  )
}

