'use client'

import { useParams } from 'next/navigation'
import { BottomNav } from '@/components/Navigation/BottomNav'
import { VideoFeed } from '@/components/VideoFeed'
import { RecommendationEngineProvider } from '@/components/RecommendationEngine'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { UiverseIconButton } from '@/components/UI/UiverseIconButton'
import { LiquidGlass } from '@/components/UI/LiquidGlass'

export default function HashtagPage() {
  const params = useParams()
  const router = useRouter()
  const tag = params.tag as string

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
              <h1 className="text-xl font-bold gradient-text-uiverse">#{tag}</h1>
              <div className="flex items-center gap-2 mt-1">
                <LiquidGlass preset="pulse" className="rounded-full">
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    <span className="text-white/70 text-sm font-medium">1.2M videos</span>
                  </div>
                </LiquidGlass>
              </div>
            </div>
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

