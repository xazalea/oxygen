'use client'

import { useState } from 'react'
import { SearchBar } from '@/components/Search/SearchBar'
import { VideoFeed } from '@/components/VideoFeed'
import { BottomNav } from '@/components/Navigation/BottomNav'
import { RecommendationEngineProvider } from '@/components/RecommendationEngine'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { TrendingUp, Hash, Music, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { LiquidGlass } from '@/components/UI/LiquidGlass'
import { UiverseButton } from '@/components/UI/UiverseButton'

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<'trending' | 'hashtags' | 'users' | 'music'>('trending')

  const tabs = [
    { id: 'trending' as const, label: 'Trending', icon: TrendingUp },
    { id: 'hashtags' as const, label: 'Hashtags', icon: Hash },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'music' as const, label: 'Music', icon: Music },
  ]

  return (
    <ErrorBoundary>
      <RecommendationEngineProvider>
        <div className="h-screen w-screen bg-black flex flex-col">
          {/* Header */}
          <header className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold gradient-text-uiverse">Discover</h1>
              <div className="flex-1">
                <SearchBar />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-3 mt-4 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <LiquidGlass
                    key={tab.id}
                    preset={isActive ? 'pulse' : 'frost'}
                    className="rounded-full"
                  >
                    <UiverseButton
                      onClick={() => setActiveTab(tab.id)}
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap relative"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                      <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-white' : 'text-white/60'}`} />
                      <span className={`text-sm font-semibold relative z-10 ${isActive ? 'text-white' : 'text-white/60'}`}>
                        {tab.label}
                      </span>
                    </UiverseButton>
                  </LiquidGlass>
                )
              })}
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-hidden">
            {activeTab === 'trending' && <VideoFeed />}
            {activeTab === 'hashtags' && (
              <div className="h-full flex items-center justify-center">
                <p className="text-white/60">Hashtags page coming soon</p>
              </div>
            )}
            {activeTab === 'users' && (
              <div className="h-full flex items-center justify-center">
                <p className="text-white/60">Users page coming soon</p>
              </div>
            )}
            {activeTab === 'music' && (
              <div className="h-full flex items-center justify-center">
                <p className="text-white/60">Music page coming soon</p>
              </div>
            )}
          </main>

          <BottomNav />
        </div>
      </RecommendationEngineProvider>
    </ErrorBoundary>
  )
}

