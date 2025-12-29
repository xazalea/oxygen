'use client'

import { BottomNav } from '@/components/Navigation/BottomNav'
import { Bookmark, Grid } from 'lucide-react'
import { LiquidGlass } from '@/components/UI/LiquidGlass'
import { VideoFeed } from '@/components/VideoFeed'
import { RecommendationEngineProvider } from '@/components/RecommendationEngine'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function SavedPage() {
  return (
    <ErrorBoundary>
      <RecommendationEngineProvider>
        <div className="h-screen w-screen bg-black flex flex-col">
          {/* Header */}
          <header className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
            <Bookmark className="w-5 h-5 text-white" />
            <h1 className="text-xl font-bold gradient-text-uiverse">Saved videos</h1>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-hidden">
            <VideoFeed />
          </main>

          <BottomNav />
        </div>
      </RecommendationEngineProvider>
    </ErrorBoundary>
  )
}

