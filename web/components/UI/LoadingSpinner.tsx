'use client'

import { motion } from 'framer-motion'
import { LiquidGlass } from './LiquidGlass'

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <LiquidGlass preset="pulse" className="rounded-2xl">
        <div className="flex flex-col items-center gap-4 p-8">
          <div className="spinner-uiverse w-16 h-16"></div>
          <p className="text-white/70 text-sm font-medium">Loading your feed...</p>
        </div>
      </LiquidGlass>
    </div>
  )
}

