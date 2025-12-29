'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Eye, Heart } from 'lucide-react'
import { LiquidGlass } from './LiquidGlass'
import { UiverseCard } from './UiverseCard'

interface VideoStatsProps {
  views: number
  likes: number
  comments: number
  shares: number
  isTrending?: boolean
}

export function VideoStats({ views, likes, comments, shares, isTrending }: VideoStatsProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="absolute top-20 right-4 flex flex-col gap-3 z-10"
    >
      {isTrending && (
        <LiquidGlass preset="pulse" className="rounded-full">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="badge-uiverse px-4 py-2 flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-bold">TRENDING</span>
          </motion.div>
        </LiquidGlass>
      )}
      
      <LiquidGlass preset="frost" className="rounded-xl">
        <UiverseCard className="p-3">
          <div className="flex items-center gap-2 text-white text-xs mb-2">
            <Eye className="w-3.5 h-3.5" />
            <span className="font-semibold">{formatNumber(views)}</span>
          </div>
          <div className="flex items-center gap-2 text-white text-xs">
            <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
            <span className="font-semibold">{formatNumber(likes)}</span>
          </div>
        </UiverseCard>
      </LiquidGlass>
    </motion.div>
  )
}

