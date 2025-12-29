'use client'

import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { UiverseButton } from '@/components/UI/UiverseButton'
import { LiquidGlass } from '@/components/UI/LiquidGlass'
import { UiverseCard } from '@/components/UI/UiverseCard'

interface ErrorDisplayProps {
  message?: string
  onRetry?: () => void
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-black">
      <LiquidGlass preset="frost" className="rounded-2xl">
        <UiverseCard className="p-8 text-center max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              className="mb-6 flex justify-center"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center border border-red-500/30">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
            </motion.div>
            <h2 className="text-2xl font-bold gradient-text-uiverse mb-3">Unable to Load Videos</h2>
            <p className="text-white/70 mb-6">
              {message || 'Failed to fetch videos. Please check your connection and try again.'}
            </p>
            {onRetry && (
              <UiverseButton
                variant="primary"
                size="md"
                onClick={onRetry}
                className="inline-flex items-center gap-2 mb-4"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </UiverseButton>
            )}
            <button
              onClick={() => window.location.reload()}
              className="block w-full text-white/60 hover:text-white text-sm underline transition-colors"
            >
              Reload Page
            </button>
          </motion.div>
        </UiverseCard>
      </LiquidGlass>
    </div>
  )
}

