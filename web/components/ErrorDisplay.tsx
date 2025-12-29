'use client'

import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorDisplayProps {
  message?: string
  onRetry?: () => void
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center px-4 max-w-md"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          className="mb-4 flex justify-center"
        >
          <AlertCircle className="w-16 h-16 text-red-500" />
        </motion.div>
        <h2 className="text-xl font-bold text-white mb-2">Unable to Load Videos</h2>
        <p className="text-white/60 mb-6">
          {message || 'Failed to fetch videos. Please check your connection and try again.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-semibold hover:bg-white/90 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          className="mt-4 block w-full text-white/60 hover:text-white text-sm underline"
        >
          Reload Page
        </button>
      </motion.div>
    </div>
  )
}

