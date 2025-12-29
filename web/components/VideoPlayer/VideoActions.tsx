'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, Bookmark, Flag, Download, MoreVertical, UserPlus, UserMinus, Scissors } from 'lucide-react'
import { VideoMetadata } from '@/lib/video-api'
import { UiverseIconButton } from '@/components/UI/UiverseIconButton'

interface VideoActionsProps {
  video: VideoMetadata
  isLiked: boolean
  onLike: () => void
  onComment: () => void
  onShare: () => void
  isFollowing?: boolean
  onFollow?: () => void
  onDuet?: () => void
}

export function VideoActions({
  video,
  isLiked,
  onLike,
  onComment,
  onShare,
  isFollowing = false,
  onFollow,
  onDuet,
}: VideoActionsProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
    // In production, call API to save/unsave
  }

  const handleDownload = () => {
    // In production, trigger video download
    window.open(video.videoUrl, '_blank')
  }

  const handleReport = () => {
    // In production, open report modal
    alert('Report functionality coming soon')
    setShowMoreMenu(false)
  }

  return (
    <div className="absolute right-4 bottom-20 flex flex-col gap-6 items-center z-10">
      {/* Follow Button */}
      {onFollow && (
        <div className="flex flex-col items-center gap-2">
          <UiverseIconButton
            icon={isFollowing ? <UserMinus className="w-6 h-6 text-white" /> : <UserPlus className="w-6 h-6 text-white" />}
            onClick={onFollow}
            variant={isFollowing ? 'default' : 'danger'}
            size="md"
          />
        </div>
      )}

      {/* Like */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.1 }}
        onClick={onLike}
        className="flex flex-col items-center gap-2 cursor-pointer"
      >
        <motion.div
          animate={{ 
            scale: isLiked ? [1, 1.4, 1.2] : 1,
          }}
          transition={{ duration: 0.3 }}
          className={`icon-btn-uiverse ${isLiked ? 'bg-gradient-to-br from-red-500 to-pink-500 glow-uiverse' : 'bg-white/10 border-white/20'}`}
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

      {/* Comment */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.1 }}
        onClick={onComment}
        className="flex flex-col items-center gap-2 cursor-pointer"
      >
        <div className="icon-btn-uiverse">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <span className="text-xs font-semibold text-white drop-shadow-lg">
          {formatNumber(video.stats.comments)}
        </span>
      </motion.button>

      {/* Share */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.1 }}
        onClick={onShare}
        className="flex flex-col items-center gap-2 cursor-pointer"
      >
        <div className="icon-btn-uiverse">
          <Share2 className="w-6 h-6 text-white" />
        </div>
        <span className="text-xs font-semibold text-white drop-shadow-lg">
          {formatNumber(video.stats.shares)}
        </span>
      </motion.button>

      {/* Save/Bookmark */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.1 }}
        onClick={handleSave}
        className="flex flex-col items-center gap-2 cursor-pointer"
      >
        <div className={`icon-btn-uiverse ${isSaved ? 'bg-gradient-to-br from-indigo-500 to-purple-500' : ''}`}>
          <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-white text-white' : 'text-white'}`} />
        </div>
      </motion.button>

      {/* Duet/Stitch */}
      {onDuet && (
        <UiverseIconButton
          icon={<Scissors className="w-6 h-6 text-white" />}
          onClick={onDuet}
          size="md"
        />
      )}

      {/* More Menu */}
      <div className="relative">
        <UiverseIconButton
          icon={<MoreVertical className="w-6 h-6 text-white" />}
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          size="md"
        />

        {showMoreMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-16 right-0 glass-strong rounded-xl p-2 min-w-[160px] shadow-2xl"
          >
            <motion.button
              onClick={handleDownload}
              whileHover={{ x: 3 }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white hover:bg-white/10 transition-all ripple-uiverse"
            >
              <Download className="w-4 h-4" />
              Download
            </motion.button>
            {onDuet && (
              <motion.button
                onClick={onDuet}
                whileHover={{ x: 3 }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white hover:bg-white/10 transition-all ripple-uiverse"
              >
                <Scissors className="w-4 h-4" />
                Duet/Stitch
              </motion.button>
            )}
            <motion.button
              onClick={handleReport}
              whileHover={{ x: 3 }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all ripple-uiverse"
            >
              <Flag className="w-4 h-4" />
              Report
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

