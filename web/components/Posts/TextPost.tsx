'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, Repeat2, MoreVertical } from 'lucide-react'
import { UiverseIconButton } from '../UI/UiverseIconButton'
import { UiverseButton } from '../UI/UiverseButton'
import { UiverseCard } from '../UI/UiverseCard'
import { TextPostRecord } from '@/lib/telegram-db-schema'

interface TextPostProps {
  post: TextPostRecord
  onLike?: (postId: string) => void
  onComment?: (postId: string) => void
  onShare?: (postId: string) => void
  onRepost?: (postId: string) => void
}

export function TextPost({ post, onLike, onComment, onShare, onRepost }: TextPostProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
    if (onLike) onLike(post.id)
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <UiverseCard className="p-4">
      {/* Author */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
          {post.userId[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold">@{post.userId}</p>
          <p className="text-white/60 text-xs">
            {new Date(post.createdAt).toLocaleDateString()}
          </p>
        </div>
        <UiverseIconButton
          icon={<MoreVertical className="w-5 h-5" />}
          size="sm"
        />
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-white whitespace-pre-wrap break-words">
          {post.content}
        </p>
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {post.hashtags.map((tag, index) => (
              <span key={index} className="text-primary-400 text-sm">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Media */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          {post.mediaUrls.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Media ${index + 1}`}
              className="w-full h-48 object-cover rounded-lg"
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="flex items-center gap-4">
          <UiverseIconButton
            icon={
              <div className="flex items-center gap-2">
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-400 text-red-400' : 'text-white/60'}`} />
                <span className="text-sm text-white/60">{formatNumber(likeCount)}</span>
              </div>
            }
            onClick={handleLike}
            variant="ghost"
            size="sm"
            className="p-0 h-auto"
          />
          
          <UiverseIconButton
            icon={
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-white/60" />
                <span className="text-sm text-white/60">{formatNumber(post.replies)}</span>
              </div>
            }
            onClick={() => onComment && onComment(post.id)}
            variant="ghost"
            size="sm"
            className="p-0 h-auto"
          />
          
          <UiverseIconButton
            icon={
              <div className="flex items-center gap-2">
                <Repeat2 className="w-5 h-5 text-white/60" />
                <span className="text-sm text-white/60">{formatNumber(post.reposts)}</span>
              </div>
            }
            onClick={() => onRepost && onRepost(post.id)}
            variant="ghost"
            size="sm"
            className="p-0 h-auto"
          />
          
          <UiverseIconButton
            icon={<Share2 className="w-5 h-5 text-white/60" />}
            onClick={() => onShare && onShare(post.id)}
            variant="ghost"
            size="sm"
            className="p-0 h-auto"
          />
        </div>
      </div>
    </UiverseCard>
  )
}

