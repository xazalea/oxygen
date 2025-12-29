'use client'

import { motion } from 'framer-motion'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface SwipeIndicatorProps {
  direction: 'up' | 'down'
  show: boolean
}

export function SwipeIndicator({ direction, show }: SwipeIndicatorProps) {
  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: direction === 'up' ? -20 : 20 }}
      animate={{ 
        opacity: show ? 1 : 0,
        y: 0,
      }}
      exit={{ opacity: 0 }}
      className={`absolute ${direction === 'up' ? 'bottom-32' : 'top-32'} left-1/2 transform -translate-x-1/2 z-10`}
    >
      <motion.div
        animate={{ 
          y: direction === 'up' ? [0, -10, 0] : [0, 10, 0],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="glass px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2"
      >
        {direction === 'up' ? (
          <ChevronUp className="w-4 h-4 text-white/80" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/80" />
        )}
        <span className="text-xs font-medium text-white/80">
          {direction === 'up' ? 'Swipe up' : 'Swipe down'}
        </span>
      </motion.div>
    </motion.div>
  )
}

