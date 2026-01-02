'use client'

import { VideoFeed } from '@/components/VideoFeed'
import { RecommendationEngineProvider } from '@/components/RecommendationEngine'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { BottomNav } from '@/components/Navigation/BottomNav'
import { SideMenu } from '@/components/Navigation/SideMenu'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { UiverseIconButton } from '@/components/UI/UiverseIconButton'
import { UiverseButton } from '@/components/UI/UiverseButton'
import { LiquidGlass } from '@/components/UI/LiquidGlass'

export default function Home() {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <ErrorBoundary>
      <RecommendationEngineProvider>
        <div className="h-screen w-screen overflow-hidden bg-black flex flex-col">
          {/* Header with Tabs */}
          <header className="px-4 py-3 border-b border-white/10 z-10">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold gradient-text-uiverse">For You</h1>
              <UiverseIconButton
                icon={<Menu className="w-6 h-6 text-white" />}
                onClick={() => setShowMenu(true)}
                size="md"
              />
            </div>
            <div className="flex gap-4">
              <LiquidGlass preset="pulse" className="rounded-full">
                <UiverseButton
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = '/following'}
                  className="text-white font-semibold px-4 py-2"
                >
                  Following
                </UiverseButton>
              </LiquidGlass>
              <UiverseButton
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/'}
                className="text-white/60 font-semibold hover:text-white px-4 py-2"
              >
                For You
              </UiverseButton>
            </div>
          </header>

          {/* Main Feed */}
          <main className="flex-1 overflow-hidden">
            <VideoFeed />
          </main>

          <BottomNav />
          <SideMenu isOpen={showMenu} onClose={() => setShowMenu(false)} />
        </div>
      </RecommendationEngineProvider>
    </ErrorBoundary>
  )
}

