'use client'

import { BottomNav } from '@/components/Navigation/BottomNav'
import { Radio, Users, Heart, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { LiquidGlass } from '@/components/UI/LiquidGlass'
import { UiverseCard } from '@/components/UI/UiverseCard'

export default function LivePage() {
  // Mock live streams
  const liveStreams = [
    {
      id: '1',
      user: { username: 'streamer1', avatar: null },
      title: 'Live now!',
      viewers: 1250,
      likes: 500,
    },
    {
      id: '2',
      user: { username: 'streamer2', avatar: null },
      title: 'Gaming session',
      viewers: 850,
      likes: 300,
    },
  ]

  return (
    <div className="h-screen w-screen bg-black flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 border-b border-white/10">
        <h1 className="text-xl font-bold gradient-text-uiverse flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-500 animate-pulse" />
          Live
        </h1>
      </header>

      {/* Live Streams */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-4">
          {liveStreams.map((stream) => (
            <LiquidGlass key={stream.id} preset="alien" className="rounded-2xl overflow-hidden">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className="relative aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <LiquidGlass preset="pulse" className="absolute top-2 left-2 rounded-full">
                  <div className="flex items-center gap-2 px-3 py-1.5 badge-uiverse">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold">LIVE</span>
                  </div>
                </LiquidGlass>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                      {stream.user.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">@{stream.user.username}</p>
                      <p className="text-white/80 text-xs">{stream.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-white/80 text-xs">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {stream.viewers.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {stream.likes.toLocaleString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            </LiquidGlass>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

