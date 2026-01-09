'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { algorithmBridge, Interaction } from '@/lib/algorithm-bridge'

interface RecommendationContextType {
  isReady: boolean
  isLoading: boolean
  getRecommendations: (count?: number) => Promise<string[]>
  recordInteraction: (interaction: Interaction) => Promise<void>
}

const RecommendationContext = createContext<RecommendationContextType | null>(null)

export function RecommendationEngineProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        await algorithmBridge.initialize()
        if (mounted) {
          setIsReady(true)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Failed to initialize recommendation engine:', error)
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  const getRecommendations = async (count: number = 20): Promise<string[]> => {
    if (!isReady) {
      return []
    }
    return algorithmBridge.getRecommendations(count)
  }

  const recordInteraction = async (interaction: Interaction): Promise<void> => {
    if (!isReady) {
      return
    }
    await algorithmBridge.recordInteraction(interaction)
  }

  return (
    <RecommendationContext.Provider
      value={{
        isReady,
        isLoading,
        getRecommendations,
        recordInteraction,
      }}
    >
      {children}
    </RecommendationContext.Provider>
  )
}

export function useRecommendationEngine() {
  const context = useContext(RecommendationContext)
  if (!context) {
    throw new Error('useRecommendationEngine must be used within RecommendationEngineProvider')
  }
  return context
}




