'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, DollarSign, Clock } from 'lucide-react'
import { LiquidGlass } from '../UI/LiquidGlass'
import { getInvestmentService } from '@/lib/investing/investment-service'

interface InvestmentStatsProps {
  postId: string
}

export function InvestmentStats({ postId }: InvestmentStatsProps) {
  const [pool, setPool] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPool()
  }, [postId])

  const loadPool = async () => {
    try {
      const response = await fetch(`/api/investments/pool?postId=${postId}`)
      if (response.ok) {
        const poolData = await response.json()
        setPool(poolData)
      }
    } catch (error) {
      console.error('Error loading pool:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !pool) {
    return (
      <LiquidGlass className="p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-white text-sm">Loading...</span>
        </div>
      </LiquidGlass>
    )
  }

  const valuationChange = pool.initialValuation > 0
    ? ((pool.currentValuation - pool.initialValuation) / pool.initialValuation) * 100
    : 0

  return (
    <LiquidGlass className="p-4 rounded-xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-400 text-xs">Valuation</span>
          </div>
          <div className="text-lg font-bold text-white">
            {pool.currentValuation.toLocaleString()} OXY
          </div>
          {valuationChange !== 0 && (
            <div className={`text-xs ${valuationChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {valuationChange > 0 ? '+' : ''}{valuationChange.toFixed(1)}%
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400 text-xs">Investors</span>
          </div>
          <div className="text-lg font-bold text-white">
            {pool.investorCount}
          </div>
        </div>
      </div>
    </LiquidGlass>
  )
}

