'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Heart, MoreVertical } from 'lucide-react'
import { VideoMetadata } from '@/lib/video-api'
import { UiverseInput } from '@/components/UI/UiverseInput'
import { UiverseIconButton } from '@/components/UI/UiverseIconButton'
import { UiverseCard } from '@/components/UI/UiverseCard'

interface Comment {
  id: string
  user: {
    id: string
    username: string
    avatar?: string
  }
  text: string
  likes: number
  replies: number
  timestamp: number
  isLiked: boolean
}

interface CommentsModalProps {
  video: VideoMetadata
  isOpen: boolean
  onClose: () => void
  commentCount: number
}

export function CommentsModal({ video, isOpen, onClose, commentCount }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadComments()
      inputRef.current?.focus()
    }
  }, [isOpen, video.id])

  const loadComments = async () => {
    setIsLoading(true)
    // In production, fetch from API
    // For now, generate sample comments
    const sampleComments: Comment[] = Array.from({ length: Math.min(commentCount, 20) }, (_, i) => ({
      id: `comment-${i}`,
      user: {
        id: `user-${i}`,
        username: `user${i + 1}`,
      },
      text: `This is a sample comment ${i + 1}. Great video!`,
      likes: Math.floor(Math.random() * 1000),
      replies: Math.floor(Math.random() * 10),
      timestamp: Date.now() - Math.random() * 86400000 * 7,
      isLiked: false,
    }))
    setComments(sampleComments)
    setIsLoading(false)
  }

  const handleSendComment = async () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      user: {
        id: 'current-user',
        username: 'you',
      },
      text: newComment,
      likes: 0,
      replies: 0,
      timestamp: Date.now(),
      isLiked: false,
    }

    setComments([comment, ...comments])
    setNewComment('')
  }

  const handleLikeComment = (commentId: string) => {
    setComments(comments.map(c => 
      c.id === commentId 
        ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 }
        : c
    ))
  }

  const formatTime = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    return `${Math.floor(seconds / 86400)}d`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[80vh] glass-strong z-50 rounded-t-3xl border-t border-white/10 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-bold gradient-text-uiverse">
                {commentCount.toLocaleString()} comments
              </h2>
              <UiverseIconButton
                icon={<X className="w-5 h-5 text-white" />}
                onClick={onClose}
                size="sm"
              />
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="spinner-uiverse"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <UiverseCard key={comment.id} className="p-4">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-3"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-lg">
                          {comment.user.username[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-white text-sm">
                              @{comment.user.username}
                            </span>
                            <span className="text-white/50 text-xs">
                              {formatTime(comment.timestamp)}
                            </span>
                          </div>
                          <p className="text-white text-sm mb-3 leading-relaxed">{comment.text}</p>
                          <div className="flex items-center gap-4">
                            <motion.button
                              onClick={() => handleLikeComment(comment.id)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="flex items-center gap-1.5 text-white/70 hover:text-red-400 transition-colors"
                            >
                              <Heart
                                className={`w-4 h-4 transition-all ${comment.isLiked ? 'fill-red-500 text-red-500' : ''}`}
                              />
                              <span className="text-xs font-medium">{comment.likes}</span>
                            </motion.button>
                            {comment.replies > 0 && (
                              <button className="text-white/60 hover:text-white text-xs transition-colors font-medium">
                                {comment.replies} replies
                              </button>
                            )}
                            <button className="text-white/60 hover:text-white text-xs transition-colors font-medium">
                              Reply
                            </button>
                          </div>
                        </div>
                        <UiverseIconButton
                          icon={<MoreVertical className="w-4 h-4 text-white" />}
                          onClick={() => {}}
                          size="sm"
                          className="flex-shrink-0"
                        />
                      </motion.div>
                    </UiverseCard>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <UiverseInput
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                  placeholder="Add a comment..."
                  className="flex-1 rounded-full"
                  inputRef={inputRef}
                />
                <UiverseIconButton
                  icon={<Send className="w-5 h-5 text-white" />}
                  onClick={handleSendComment}
                  variant={newComment.trim() ? 'primary' : 'default'}
                  size="md"
                  className={!newComment.trim() ? 'opacity-50' : ''}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
