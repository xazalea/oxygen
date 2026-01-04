'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Reply, MoreVertical } from 'lucide-react'
import { UiverseButton } from '../UI/UiverseButton'
import { UiverseCard } from '../UI/UiverseCard'
import { TextPost } from '../Posts/TextPost'
import { getDBOperations } from '@/lib/telegram-db-operations'
import { TextPostRecord } from '@/lib/telegram-db-schema'

interface ThreadViewProps {
  threadId: string
  onBack?: () => void
}

export function ThreadView({ threadId, onBack }: ThreadViewProps) {
  const [thread, setThread] = useState<TextPostRecord | null>(null)
  const [replies, setReplies] = useState<TextPostRecord[]>([])

  useEffect(() => {
    loadThread()
  }, [threadId])

  const loadThread = async () => {
    try {
      const db = getDBOperations()
      const threadPosts = await db.getThreadPosts(threadId)
      
      if (threadPosts.length > 0) {
        setThread(threadPosts[0]) // Main post
        setReplies(threadPosts.slice(1)) // Replies
      }
    } catch (error) {
      console.error('Error loading thread:', error)
    }
  }

  return (
    <div className="h-screen w-screen bg-black flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm p-4 flex items-center gap-4">
        {onBack && (
          <UiverseButton variant="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </UiverseButton>
        )}
        <h1 className="text-xl font-bold text-white">Thread</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {thread && (
          <TextPost post={thread} />
        )}

        {/* Replies */}
        <div className="space-y-4">
          <h2 className="text-white font-semibold px-2">
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </h2>
          {replies.map((reply) => (
            <motion.div
              key={reply.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-8 border-l-2 border-white/10 pl-4"
            >
              <TextPost post={reply} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}



