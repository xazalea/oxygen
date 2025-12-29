'use client'

import { useState } from 'react'
import { BottomNav } from '@/components/Navigation/BottomNav'
import { SideMenu } from '@/components/Navigation/SideMenu'
import { Settings, Edit, Grid, Heart, Bookmark } from 'lucide-react'
import { motion } from 'framer-motion'
import { VideoMetadata, videoAPI } from '@/lib/video-api'
import { VideoPlayer } from '@/components/VideoPlayer'
import { UiverseButton } from '@/components/UI/UiverseButton'
import { UiverseIconButton } from '@/components/UI/UiverseIconButton'
import { LiquidGlass } from '@/components/UI/LiquidGlass'
import { UiverseCard } from '@/components/UI/UiverseCard'

export default function ProfilePage() {
  const [showMenu, setShowMenu] = useState(false)
  const [activeTab, setActiveTab] = useState<'videos' | 'liked' | 'saved'>('videos')
  const [videos, setVideos] = useState<VideoMetadata[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  // Mock user data
  const user = {
    id: 'user-1',
    username: 'oxygen_user',
    displayName: 'Oxygen User',
    bio: 'Creating amazing content on Oxygen 🚀',
    followers: 125000,
    following: 450,
    likes: 2500000,
    avatar: undefined,
  }

  const tabs = [
    { id: 'videos' as const, label: 'Videos', icon: Grid },
    { id: 'liked' as const, label: 'Liked', icon: Heart },
    { id: 'saved' as const, label: 'Saved', icon: Bookmark },
  ]

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h1 className="text-xl font-bold gradient-text-uiverse">@{user.username}</h1>
        <div className="flex items-center gap-3">
          <UiverseIconButton
            icon={<Settings className="w-5 h-5 text-white" />}
            onClick={() => setShowMenu(true)}
            size="sm"
          />
        </div>
      </header>

      {/* Profile Info */}
      <div className="px-4 py-6">
        <div className="flex items-start gap-4 mb-4">
          <LiquidGlass preset="default" className="rounded-full">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {user.displayName[0]}
            </div>
          </LiquidGlass>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-1">{user.displayName}</h2>
            <p className="text-white/60 text-sm mb-3">@{user.username}</p>
            <p className="text-white text-sm mb-4">{user.bio}</p>
            <UiverseButton variant="secondary" size="sm">
              Edit profile
            </UiverseButton>
          </div>
        </div>

        {/* Stats */}
        <LiquidGlass preset="frost" className="rounded-xl mb-4">
          <UiverseCard className="p-4">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <p className="text-white font-bold text-xl gradient-text-uiverse">{user.followers.toLocaleString()}</p>
                <p className="text-white/60 text-xs mt-1">Followers</p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <p className="text-white font-bold text-xl gradient-text-uiverse">{user.following.toLocaleString()}</p>
                <p className="text-white/60 text-xs mt-1">Following</p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <p className="text-white font-bold text-xl gradient-text-uiverse">{user.likes.toLocaleString()}</p>
                <p className="text-white/60 text-xs mt-1">Likes</p>
              </div>
            </div>
          </UiverseCard>
        </LiquidGlass>

        {/* Tabs */}
        <div className="flex gap-3 border-b border-white/10 pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <LiquidGlass key={tab.id} preset={isActive ? 'pulse' : 'frost'} className="rounded-full">
                <motion.button
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-3 relative ripple-uiverse"
                >
                  {isActive && (
                    <motion.div
                      layoutId="profileTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-white' : 'text-white/60'}`} />
                  <span className={`font-semibold relative z-10 ${isActive ? 'text-white' : 'text-white/60'}`}>
                    {tab.label}
                  </span>
                </motion.button>
              </LiquidGlass>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'videos' && (
          <div className="h-full">
            {videos.length > 0 ? (
              <VideoPlayer
                video={videos[currentIndex]}
                isActive={true}
                onInteraction={() => {}}
                onWatchTime={() => {}}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-white/60">No videos yet</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'liked' && (
          <div className="h-full flex items-center justify-center">
            <p className="text-white/60">Liked videos coming soon</p>
          </div>
        )}
        {activeTab === 'saved' && (
          <div className="h-full flex items-center justify-center">
            <p className="text-white/60">Saved videos coming soon</p>
          </div>
        )}
      </div>

      <BottomNav />
      <SideMenu isOpen={showMenu} onClose={() => setShowMenu(false)} />
    </div>
  )
}

