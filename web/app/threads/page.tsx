'use client'

import { useState, useEffect } from 'react'
import { BottomNav } from '@/components/Navigation/BottomNav'
import { ThreadCard } from '@/components/Threads/ThreadCard'
import { ThreadComposer } from '@/components/Threads/ThreadComposer'
import { Thread } from '@/lib/threads-service'
import { getCurrentUser } from '@/lib/auth'

export default function ThreadsPage() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchThreads()
  }, [])

  const fetchThreads = async () => {
    try {
      const res = await fetch('/api/threads')
      if (res.ok) {
        const data = await res.json()
        setThreads(data)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateThread = async (content: string, media?: File) => {
    const user = getCurrentUser()
    if (!user) return // Should redirect to login

    // Handle media upload separately if real implementation
    // For now we just mock the URL
    const mediaUrl = media ? URL.createObjectURL(media) : undefined
    const mediaType = media?.type.startsWith('video') ? 'video' : 'image'

    try {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          userId: user.id,
          content,
          mediaUrl,
          mediaType: media ? mediaType : undefined
        })
      })

      if (res.ok) {
        const newThread = await res.json()
        setThreads(prev => [newThread, ...prev])
      }
    } catch (error) {
      console.error('Failed to post thread:', error)
    }
  }

  const handleLike = async (threadId: string) => {
    const user = getCurrentUser()
    if (!user) return

    await fetch('/api/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'like',
        userId: user.id,
        threadId
      })
    })
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="max-w-xl mx-auto p-4">
        <header className="flex justify-between items-center mb-6 sticky top-0 z-10 bg-black/80 backdrop-blur-md py-4">
          <h1 className="text-xl font-bold gradient-text-uiverse">Threads</h1>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500" />
        </header>

        <ThreadComposer onSubmit={handleCreateThread} />

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map(thread => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                onLike={handleLike}
                onReply={() => {}}
                onRepost={() => {}}
              />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}

