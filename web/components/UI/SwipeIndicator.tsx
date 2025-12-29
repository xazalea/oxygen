'use client'

import { motion } from 'framer-motion'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { LiquidGlass } from './LiquidGlass'

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
      <LiquidGlass preset="pulse" className="rounded-full">
        <motion.div
          animate={{ 
            y: direction === 'up' ? [0, -10, 0] : [0, 10, 0],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="px-4 py-2 flex items-center gap-2"
        >
          {direction === 'up' ? (
            <ChevronUp className="w-4 h-4 text-white" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white" />
          )}
          <span className="text-xs font-semibold text-white">
            {direction === 'up' ? 'Swipe up' : 'Swipe down'}
          </span>
        </motion.div>
      </LiquidGlass>
    </motion.div>
  )
}

