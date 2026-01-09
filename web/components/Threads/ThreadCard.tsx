'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Repeat, Share, MoreHorizontal } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Thread } from '@/lib/threads-service'
import { LiquidGlass } from '@/components/UI/LiquidGlass'
import { UiverseIconButton } from '@/components/UI/UiverseIconButton'

interface ThreadCardProps {
  thread: Thread
  onLike?: (id: string) => void
  onReply?: (id: string) => void
  onRepost?: (id: string) => void
}

export function ThreadCard({ thread, onLike, onReply, onRepost }: ThreadCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(thread.likesCount)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1)
    onLike?.(thread.id)
  }

  return (
    <LiquidGlass preset="glass" className="mb-4 rounded-xl overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
            <div>
              <p className="font-bold text-white text-sm">User_{thread.userId.slice(0, 6)}</p>
              <p className="text-white/40 text-xs">
                {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <button className="text-white/40 hover:text-white">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="pl-13 mb-3">
          <p className="text-white text-base mb-3 whitespace-pre-wrap">{thread.content}</p>
          
          {thread.mediaUrl && (
            <div className="rounded-xl overflow-hidden mb-3 border border-white/10">
              {thread.mediaType === 'video' ? (
                <video src={thread.mediaUrl} controls className="w-full max-h-[400px] object-cover" />
              ) : (
                <img src={thread.mediaUrl} alt="Content" className="w-full max-h-[400px] object-cover" />
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between text-white/50 px-2">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 group transition-colors ${isLiked ? 'text-pink-500' : 'hover:text-pink-500'}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likesCount}</span>
          </button>

          <button 
            onClick={() => onReply?.(thread.id)}
            className="flex items-center gap-2 hover:text-blue-400 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{thread.repliesCount}</span>
          </button>

          <button 
            onClick={() => onRepost?.(thread.id)}
            className="flex items-center gap-2 hover:text-green-400 transition-colors"
          >
            <Repeat className="w-5 h-5" />
            <span className="text-sm">{thread.repostsCount}</span>
          </button>

          <button className="flex items-center gap-2 hover:text-indigo-400 transition-colors">
            <Share className="w-5 h-5" />
          </button>
        </div>
      </div>
    </LiquidGlass>
  )
}


