'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react'
import { LiquidGlass } from '../UI/LiquidGlass'
import { UiverseTabs } from '../UI/UiverseComponents'
import { getInvestmentService } from '@/lib/investing/investment-service'

interface PortfolioViewProps {
  userId: string
}

export function PortfolioView({ userId }: PortfolioViewProps) {
  const [portfolio, setPortfolio] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPortfolio()
  }, [userId])

  const loadPortfolio = async () => {
    try {
      const response = await fetch(`/api/investments/portfolio?userId=${userId}`)
      if (response.ok) {
        const portfolioData = await response.json()
        setPortfolio(portfolioData)
      }
    } catch (error) {
      console.error('Error loading portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <LiquidGlass className="p-6 rounded-2xl">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </LiquidGlass>
    )
  }

  const tabs = [
    {
      id: 'active',
      label: `Active (${portfolio.active.length})`,
      content: (
        <div className="space-y-3">
          {portfolio.active.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No active investments
            </div>
          ) : (
            portfolio.active.map((investment: any) => (
              <motion.div
                key={investment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">
                      Post {investment.postId.slice(0, 8)}...
                    </div>
                    <div className="text-gray-400 text-sm">
                      Invested: {investment.amount.toLocaleString()} OXY
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">
                      Active
                    </div>
                    <div className="text-gray-400 text-xs">
                      {new Date(investment.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )
    },
    {
      id: 'completed',
      label: `Completed (${portfolio.completed.length})`,
      content: (
        <div className="space-y-3">
          {portfolio.completed.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No completed investments
            </div>
          ) : (
            portfolio.completed.map((investment: any) => (
              <motion.div
                key={investment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">
                      Post {investment.postId.slice(0, 8)}...
                    </div>
                    <div className="text-gray-400 text-sm">
                      Invested: {investment.amount.toLocaleString()} OXY
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      investment.roi && investment.roi > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {investment.returnAmount?.toLocaleString() || 0} OXY
                    </div>
                    {investment.roi !== undefined && (
                      <div className={`text-xs ${
                        investment.roi > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {investment.roi > 0 ? '+' : ''}{investment.roi.toFixed(1)}% ROI
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )
    }
  ]

  return (
    <LiquidGlass className="p-6 rounded-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">Investment Portfolio</h2>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white/5 rounded-xl">
          <div className="text-gray-400 text-sm mb-1">Total Invested</div>
          <div className="text-xl font-bold text-white">
            {portfolio.stats.totalInvested.toLocaleString()} OXY
          </div>
        </div>
        <div className="p-4 bg-white/5 rounded-xl">
          <div className="text-gray-400 text-sm mb-1">Total Returns</div>
          <div className="text-xl font-bold text-green-400">
            {portfolio.stats.totalReturns.toLocaleString()} OXY
          </div>
        </div>
        <div className="p-4 bg-white/5 rounded-xl">
          <div className="text-gray-400 text-sm mb-1">Avg ROI</div>
          <div className={`text-xl font-bold ${
            portfolio.stats.averageROI > 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {portfolio.stats.averageROI > 0 ? '+' : ''}{portfolio.stats.averageROI.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Tabs */}
      <UiverseTabs tabs={tabs} />
    </LiquidGlass>
  )
}

