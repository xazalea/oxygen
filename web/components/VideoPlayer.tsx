'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VideoMetadata } from '@/lib/video-api'
import { Volume2, VolumeX, Play, Pause } from 'lucide-react'
import { VideoStats } from './UI/VideoStats'
import { VideoActions } from './VideoPlayer/VideoActions'
import { CommentsModal } from './Comments/CommentsModal'
import { ShareModal } from './Share/ShareModal'
import { DuetOptions } from './Duet/DuetOptions'
import { UiverseIconButton } from './UI/UiverseIconButton'
import { UiverseButton } from './UI/UiverseButton'
import { LiquidGlass } from './UI/LiquidGlass'

interface VideoPlayerProps {
  video: VideoMetadata
  isActive: boolean
  onInteraction: (type: 'like' | 'share' | 'comment' | 'skip', value: boolean) => void
  onWatchTime: (time: number) => void
}

export function VideoPlayer({ video, isActive, onInteraction, onWatchTime }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [showControls, setShowControls] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [watchTime, setWatchTime] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showDuet, setShowDuet] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(console.error)
      setIsPlaying(true)
    } else if (videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [isActive])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted
    }
  }, [isMuted])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed
    }
  }, [playbackSpeed])

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime
      const duration = videoRef.current.duration
      setWatchTime(currentTime)
      onWatchTime(currentTime / duration)
    }
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    onInteraction('like', !isLiked)
  }

  const handleComment = () => {
    setShowComments(true)
    onInteraction('comment', true)
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    // In production, call API to follow/unfollow
  }

  const handleShare = () => {
    setShowShare(true)
    onInteraction('share', true)
  }

  const showControlsTemporarily = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Get video source URL - use proxy for Telegram videos
  const getVideoSrc = () => {
    if (video.source === 'telegram' && video.videoUrl.includes('api.telegram.org')) {
      // Extract file ID from Telegram URL or use proxy
      const fileIdMatch = video.videoUrl.match(/file\/bot[\w:]+\/(.+)/)
      if (fileIdMatch) {
        return `/api/videos/proxy?fileId=${encodeURIComponent(fileIdMatch[1])}`
      }
    }
    return video.videoUrl
  }

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={getVideoSrc()}
        className="w-full h-full object-contain"
        loop
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onClick={showControlsTemporarily}
        onTouchStart={showControlsTemporarily}
        crossOrigin="anonymous"
      />

      {/* Progress bar with gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 backdrop-blur-sm">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 via-primary-400 to-primary-300 shadow-lg shadow-primary-500/50"
          initial={{ width: 0 }}
          animate={{ width: `${(watchTime / video.duration) * 100}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
      
      {/* Time indicator */}
      {showControls && videoRef.current && (
        <LiquidGlass preset="pulse" className="absolute bottom-12 left-1/2 transform -translate-x-1/2 rounded-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 py-2"
          >
            <span className="text-white text-xs font-semibold">
              {Math.floor(videoRef.current.currentTime)}s / {Math.floor(video.duration)}s
            </span>
          </motion.div>
        </LiquidGlass>
      )}

      {/* Controls overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 flex items-center justify-center"
            onClick={() => setShowControls(false)}
          >
            <div className="flex gap-4">
              <LiquidGlass preset="edge" className="rounded-full">
                <UiverseIconButton
                  icon={<span className="text-white font-semibold">-10s</span>}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (videoRef.current) {
                      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10)
                    }
                  }}
                  size="md"
                />
              </LiquidGlass>
              <LiquidGlass preset="default" className="rounded-full">
                <UiverseIconButton
                  icon={isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (videoRef.current) {
                      if (videoRef.current.paused) {
                        videoRef.current.play()
                        setIsPlaying(true)
                      } else {
                        videoRef.current.pause()
                        setIsPlaying(false)
                      }
                    }
                  }}
                  variant="primary"
                  size="lg"
                />
              </LiquidGlass>
              <LiquidGlass preset="edge" className="rounded-full">
                <UiverseIconButton
                  icon={<span className="text-white font-semibold">+10s</span>}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (videoRef.current) {
                      videoRef.current.currentTime = Math.min(
                        videoRef.current.duration,
                        videoRef.current.currentTime + 10
                      )
                    }
                  }}
                  size="md"
                />
              </LiquidGlass>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right side actions */}
      <VideoActions
        video={video}
        isLiked={isLiked}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        onDuet={() => setShowDuet(true)}
      />

      {/* Comments Modal */}
      <CommentsModal
        video={video}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        commentCount={video.stats.comments}
      />

      {/* Share Modal */}
      <ShareModal
        video={video}
        isOpen={showShare}
        onClose={() => setShowShare(false)}
      />

      {/* Duet Options */}
      <DuetOptions
        video={video}
        isOpen={showDuet}
        onClose={() => setShowDuet(false)}
      />

      {/* Bottom info */}
      <motion.div 
        className="absolute bottom-20 left-4 right-20 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <LiquidGlass preset="default" className="rounded-full">
            <motion.div 
              className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-base shadow-xl"
              whileHover={{ scale: 1.15, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              {video.author.avatar ? (
                <img 
                  src={video.author.avatar} 
                  alt={video.author.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                video.author.username[0].toUpperCase()
              )}
            </motion.div>
          </LiquidGlass>
          <div className="flex-1">
            <motion.span 
              className="font-bold text-white text-lg drop-shadow-lg block"
              whileHover={{ x: 5 }}
            >
              @{video.author.username}
            </motion.span>
            {video.stats.views > 0 && (
              <span className="text-white/60 text-xs">
                {formatNumber(video.stats.views)} views
              </span>
            )}
          </div>
        </div>
        <motion.p 
          className="text-white text-sm mb-3 line-clamp-3 drop-shadow-lg font-medium leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {video.description}
        </motion.p>
        {video.hashtags && video.hashtags.length > 0 && (
          <motion.div 
            className="flex flex-wrap gap-2 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {video.hashtags.slice(0, 3).map((tag, idx) => (
              <LiquidGlass key={idx} preset="pulse" className="rounded-full">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 text-xs font-semibold hover:from-indigo-300 hover:to-purple-300 cursor-pointer px-2 py-1 block">
                  #{tag}
                </span>
              </LiquidGlass>
            ))}
          </motion.div>
        )}
        {video.music && (
          <LiquidGlass preset="frost" className="rounded-full w-fit">
            <motion.div 
              className="flex items-center gap-2 text-white text-xs font-semibold px-4 py-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-base animate-pulse">🎵</span>
              <span className="truncate max-w-[200px]">
                {video.music.title} - {video.music.author}
              </span>
            </motion.div>
          </LiquidGlass>
        )}
      </motion.div>

      {/* Video Stats */}
      <VideoStats
        views={video.stats.views}
        likes={video.stats.likes + (isLiked ? 1 : 0)}
        comments={video.stats.comments}
        shares={video.stats.shares}
        isTrending={video.stats.views > 100000}
      />

      {/* Top controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-20">
        {/* Playback speed */}
        <div className="relative">
          <LiquidGlass preset="edge" className="rounded-full">
            <UiverseIconButton
              icon={<span className="text-white text-xs font-semibold">{playbackSpeed}x</span>}
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              size="sm"
            />
          </LiquidGlass>
          {showSpeedMenu && (
            <LiquidGlass preset="frost" className="absolute top-12 right-0 rounded-xl">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2 min-w-[100px]"
              >
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                  <UiverseButton
                    key={speed}
                    onClick={() => {
                      setPlaybackSpeed(speed)
                      setShowSpeedMenu(false)
                    }}
                    variant={playbackSpeed === speed ? 'primary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start text-xs"
                  >
                    {speed}x
                  </UiverseButton>
                ))}
              </motion.div>
            </LiquidGlass>
          )}
        </div>

        {/* Volume control */}
        <LiquidGlass preset="edge" className="rounded-full">
          <UiverseIconButton
            icon={isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
            onClick={() => setIsMuted(!isMuted)}
            size="sm"
          />
        </LiquidGlass>
      </div>
    </div>
  )
}

