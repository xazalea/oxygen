'use client'

import { VideoFeed } from '@/components/VideoFeed'
import { RecommendationEngineProvider } from '@/components/RecommendationEngine'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function Home() {
  return (
    <ErrorBoundary>
      <RecommendationEngineProvider>
        <main className="h-screen w-screen overflow-hidden bg-black">
          <VideoFeed />
        </main>
      </RecommendationEngineProvider>
    </ErrorBoundary>
  )
}

