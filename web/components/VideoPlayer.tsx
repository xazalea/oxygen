'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VideoMetadata } from '@/lib/video-api'
import { Heart, MessageCircle, Share2, MoreVertical, Volume2, VolumeX, Play, Pause } from 'lucide-react'
import { VideoStats } from './UI/VideoStats'

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

  const handleShare = () => {
    onInteraction('share', true)
  }

  const handleComment = () => {
    onInteraction('comment', true)
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

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={video.videoUrl}
        className="w-full h-full object-contain"
        loop
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onClick={showControlsTemporarily}
        onTouchStart={showControlsTemporarily}
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2 glass px-3 py-1.5 rounded-full"
        >
          <span className="text-white text-xs font-medium">
            {Math.floor(videoRef.current.currentTime)}s / {Math.floor(video.duration)}s
          </span>
        </motion.div>
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
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (videoRef.current) {
                    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10)
                  }
                }}
                className="glass px-4 py-2 rounded-full text-white"
              >
                -10s
              </button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
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
                className="glass px-6 py-3 rounded-full text-white flex items-center justify-center"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </motion.button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (videoRef.current) {
                    videoRef.current.currentTime = Math.min(
                      videoRef.current.duration,
                      videoRef.current.currentTime + 10
                    )
                  }
                }}
                className="glass px-4 py-2 rounded-full text-white"
              >
                +10s
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right side actions */}
      <div className="absolute right-4 bottom-20 flex flex-col gap-6 items-center z-10">
        <motion.button
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.1 }}
          onClick={handleLike}
          className="flex flex-col items-center gap-2 cursor-pointer"
        >
          <motion.div
            animate={{ 
              scale: isLiked ? [1, 1.4, 1.2] : 1,
            }}
            transition={{ duration: 0.3 }}
            className={`p-3 rounded-full transition-colors ${
              isLiked ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-white/20 glass hover:bg-white/30'
            }`}
          >
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-white text-white' : 'text-white'}`} />
          </motion.div>
          <motion.span 
            className="text-xs font-semibold text-white drop-shadow-lg"
            animate={{ scale: isLiked ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            {formatNumber(video.stats.likes + (isLiked ? 1 : 0))}
          </motion.span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.1 }}
          onClick={handleComment}
          className="flex flex-col items-center gap-2 cursor-pointer"
        >
          <motion.div 
            className="p-3 rounded-full bg-white/20 glass hover:bg-white/30 transition-colors"
            whileHover={{ scale: 1.1 }}
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </motion.div>
          <span className="text-xs font-semibold text-white drop-shadow-lg">
            {formatNumber(video.stats.comments)}
          </span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.1 }}
          onClick={handleShare}
          className="flex flex-col items-center gap-2 cursor-pointer"
        >
          <motion.div 
            className="p-3 rounded-full bg-white/20 glass hover:bg-white/30 transition-colors"
            whileHover={{ scale: 1.1 }}
          >
            <Share2 className="w-6 h-6 text-white" />
          </motion.div>
          <span className="text-xs font-semibold text-white drop-shadow-lg">
            {formatNumber(video.stats.shares)}
          </span>
        </motion.button>

        <motion.button 
          className="p-3 rounded-full bg-white/20 glass hover:bg-white/30 transition-colors cursor-pointer"
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.1 }}
        >
          <MoreVertical className="w-6 h-6 text-white" />
        </motion.button>
      </div>

      {/* Bottom info */}
      <motion.div 
        className="absolute bottom-20 left-4 right-20 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <motion.div 
            className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center text-white font-bold text-base shadow-xl border-2 border-white/20"
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
              <span
                key={idx}
                className="text-primary-400 text-xs font-semibold hover:text-primary-300 cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </motion.div>
        )}
        {video.music && (
          <motion.div 
            className="flex items-center gap-2 text-white/90 text-xs font-medium bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm w-fit"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05, bg: 'white/20' }}
          >
            <span className="text-base animate-pulse">🎵</span>
            <span className="drop-shadow-md truncate max-w-[200px]">
              {video.music.title} - {video.music.author}
            </span>
          </motion.div>
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
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="p-2 rounded-full bg-white/20 glass hover:bg-white/30 transition-colors"
          >
            <span className="text-white text-xs font-semibold">{playbackSpeed}x</span>
          </button>
          {showSpeedMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-12 right-0 glass rounded-lg p-2 min-w-[80px]"
            >
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                <button
                  key={speed}
                  onClick={() => {
                    setPlaybackSpeed(speed)
                    setShowSpeedMenu(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
                    playbackSpeed === speed
                      ? 'bg-white/30 text-white font-semibold'
                      : 'text-white/80 hover:bg-white/20'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Volume control */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 rounded-full bg-white/20 glass hover:bg-white/30 transition-colors"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>
      </div>
    </div>
  )
}

