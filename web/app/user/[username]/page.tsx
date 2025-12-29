'use client'

import { useParams } from 'next/navigation'
import { BottomNav } from '@/components/Navigation/BottomNav'
import { VideoFeed } from '@/components/VideoFeed'
import { RecommendationEngineProvider } from '@/components/RecommendationEngine'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ArrowLeft, UserPlus, UserMinus, Grid, Heart, Bookmark } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { UiverseButton } from '@/components/UI/UiverseButton'
import { UiverseIconButton } from '@/components/UI/UiverseIconButton'
import { LiquidGlass } from '@/components/UI/LiquidGlass'
import { UiverseCard } from '@/components/UI/UiverseCard'
import { motion } from 'framer-motion'

export default function UserPage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState<'videos' | 'liked'>('videos')

  // Mock user data
  const user = {
    id: `user-${username}`,
    username,
    displayName: username.charAt(0).toUpperCase() + username.slice(1),
    bio: 'Content creator on Oxygen 🚀',
    followers: 125000,
    following: 450,
    likes: 2500000,
    videos: 234,
  }

  return (
    <ErrorBoundary>
      <RecommendationEngineProvider>
        <div className="h-screen w-screen bg-black flex flex-col">
          {/* Header */}
          <header className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
            <UiverseIconButton
              icon={<ArrowLeft className="w-5 h-5 text-white" />}
              onClick={() => router.back()}
              size="sm"
            />
            <div className="flex-1">
              <h1 className="text-lg font-bold gradient-text-uiverse">{user.displayName}</h1>
              <p className="text-white/60 text-xs">{user.videos} videos</p>
            </div>
          </header>

          {/* Profile Info */}
          <div className="px-4 py-6 border-b border-white/10">
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
                <UiverseButton
                  variant={isFollowing ? 'ghost' : 'primary'}
                  size="sm"
                  onClick={() => setIsFollowing(!isFollowing)}
                  className="flex items-center gap-2"
                >
                  {isFollowing ? (
                    <span className="flex items-center gap-2">
                      <UserMinus className="w-4 h-4" />
                      Following
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </span>
                  )}
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
            <div className="flex gap-3">
              <LiquidGlass preset={activeTab === 'videos' ? 'pulse' : 'frost'} className="rounded-full">
                <motion.button
                  onClick={() => setActiveTab('videos')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full ripple-uiverse"
                >
                  <Grid className={`w-4 h-4 ${activeTab === 'videos' ? 'text-white' : 'text-white/60'}`} />
                  <span className={`text-sm font-semibold ${activeTab === 'videos' ? 'text-white' : 'text-white/60'}`}>
                    Videos
                  </span>
                </motion.button>
              </LiquidGlass>
              <LiquidGlass preset={activeTab === 'liked' ? 'pulse' : 'frost'} className="rounded-full">
                <motion.button
                  onClick={() => setActiveTab('liked')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full ripple-uiverse"
                >
                  <Heart className={`w-4 h-4 ${activeTab === 'liked' ? 'text-white' : 'text-white/60'}`} />
                  <span className={`text-sm font-semibold ${activeTab === 'liked' ? 'text-white' : 'text-white/60'}`}>
                    Liked
                  </span>
                </motion.button>
              </LiquidGlass>
            </div>
          </div>

          {/* Content */}
          <main className="flex-1 overflow-hidden">
            {activeTab === 'videos' && <VideoFeed />}
            {activeTab === 'liked' && (
              <div className="h-full flex items-center justify-center">
                <p className="text-white/60">Liked videos</p>
              </div>
            )}
          </main>

          <BottomNav />
        </div>
      </RecommendationEngineProvider>
    </ErrorBoundary>
  )
}

