'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, Bookmark, Flag, Download, MoreVertical, UserPlus, UserMinus, Scissors } from 'lucide-react'
import { VideoMetadata } from '@/lib/video-api'
import { UiverseIconButton } from '@/components/UI/UiverseIconButton'
import { UiverseButton } from '@/components/UI/UiverseButton'
import { LiquidGlass } from '@/components/UI/LiquidGlass'

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
      <div className="flex flex-col items-center gap-2">
        <UiverseIconButton
          icon={
            <motion.div
              animate={{ 
                scale: isLiked ? [1, 1.4, 1.2] : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-white text-white' : 'text-white'}`} />
            </motion.div>
          }
          onClick={onLike}
          variant={isLiked ? 'danger' : 'default'}
          size="md"
          className={isLiked ? 'bg-gradient-to-br from-red-500 to-pink-500 glow-uiverse' : ''}
        />
        <motion.span 
          className="text-xs font-semibold text-white drop-shadow-lg"
          animate={{ scale: isLiked ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.3 }}
        >
          {formatNumber(video.stats.likes + (isLiked ? 1 : 0))}
        </motion.span>
      </div>

      {/* Comment */}
      <div className="flex flex-col items-center gap-2">
        <UiverseIconButton
          icon={<MessageCircle className="w-6 h-6 text-white" />}
          onClick={onComment}
          size="md"
        />
        <span className="text-xs font-semibold text-white drop-shadow-lg">
          {formatNumber(video.stats.comments)}
        </span>
      </div>

      {/* Share */}
      <div className="flex flex-col items-center gap-2">
        <UiverseIconButton
          icon={<Share2 className="w-6 h-6 text-white" />}
          onClick={onShare}
          size="md"
        />
        <span className="text-xs font-semibold text-white drop-shadow-lg">
          {formatNumber(video.stats.shares)}
        </span>
      </div>

      {/* Save/Bookmark */}
      <UiverseIconButton
        icon={<Bookmark className={`w-6 h-6 ${isSaved ? 'fill-white text-white' : 'text-white'}`} />}
        onClick={handleSave}
        variant={isSaved ? 'primary' : 'default'}
        size="md"
        className={isSaved ? 'bg-gradient-to-br from-indigo-500 to-purple-500' : ''}
      />

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
          <LiquidGlass preset="pulse" className="absolute bottom-16 right-0 rounded-xl p-2 min-w-[160px] shadow-2xl">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="space-y-1"
            >
            <UiverseButton
              onClick={handleDownload}
              variant="ghost"
              size="sm"
              className="w-full flex items-center gap-3 justify-start text-white"
            >
              <Download className="w-4 h-4" />
              Download
            </UiverseButton>
            {onDuet && (
              <UiverseButton
                onClick={onDuet}
                variant="ghost"
                size="sm"
                className="w-full flex items-center gap-3 justify-start text-white"
              >
                <Scissors className="w-4 h-4" />
                Duet/Stitch
              </UiverseButton>
            )}
            <UiverseButton
              onClick={handleReport}
              variant="ghost"
              size="sm"
              className="w-full flex items-center gap-3 justify-start text-red-400 hover:text-red-300"
            >
              <Flag className="w-4 h-4" />
              Report
            </UiverseButton>
            </motion.div>
          </LiquidGlass>
        )}
      </div>
    </div>
  )
}

