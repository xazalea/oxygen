'use client'

import { BottomNav } from '@/components/Navigation/BottomNav'
import { Bell, MessageCircle, UserPlus, Heart, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import { UiverseCard } from '@/components/UI/UiverseCard'
import { LiquidGlass } from '@/components/UI/LiquidGlass'

interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'mention'
  user: {
    username: string
    avatar?: string
  }
  text: string
  timestamp: number
  read: boolean
}

export default function InboxPage() {
  // Mock notifications
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'like',
      user: { username: 'user1' },
      text: 'liked your video',
      timestamp: Date.now() - 1000 * 60 * 5,
      read: false,
    },
    {
      id: '2',
      type: 'comment',
      user: { username: 'user2' },
      text: 'commented on your video',
      timestamp: Date.now() - 1000 * 60 * 30,
      read: false,
    },
    {
      id: '3',
      type: 'follow',
      user: { username: 'user3' },
      text: 'started following you',
      timestamp: Date.now() - 1000 * 60 * 60,
      read: true,
    },
  ]

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-blue-500" />
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />
      default:
        return <Bell className="w-5 h-5 text-white/60" />
    }
  }

  const formatTime = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="h-screen w-screen bg-black flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 border-b border-white/10">
        <h1 className="text-xl font-bold gradient-text-uiverse">Inbox</h1>
      </header>

      {/* Notifications */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2">
          <h2 className="text-white/60 text-sm font-semibold mb-3">Notifications</h2>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <LiquidGlass
                key={notification.id}
                preset={notification.read ? 'frost' : 'pulse'}
                className="rounded-xl"
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 5, scale: 1.02 }}
                  className="flex items-center gap-3 p-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-lg">
                    {notification.user.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">
                      <span className="font-semibold">@{notification.user.username}</span>{' '}
                      {notification.text}
                    </p>
                    <p className="text-white/50 text-xs mt-1">{formatTime(notification.timestamp)}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  {!notification.read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex-shrink-0 glow-uiverse" />
                  )}
                </motion.div>
              </LiquidGlass>
            ))}
          </div>
        </div>

        <div className="px-4 py-2">
          <h2 className="text-white/60 text-sm font-semibold mb-3">Messages</h2>
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-2" />
            <p className="text-white/60">No messages yet</p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

