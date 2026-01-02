'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wallet, TrendingUp, Coins } from 'lucide-react'
import { UiverseCard } from '../UI/UiverseCard'
import { UiverseButton } from '../UI/UiverseButton'
import { LiquidGlass } from '../UI/LiquidGlass'
import { getCurrencyService } from '@/lib/currency/currency-service'

interface WalletDisplayProps {
  userId: string
  compact?: boolean
}

export function WalletDisplay({ userId, compact = false }: WalletDisplayProps) {
  const [balance, setBalance] = useState<number | null>(null)
  const [totalEarned, setTotalEarned] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWallet()
  }, [userId])

  const loadWallet = async () => {
    try {
      const response = await fetch(`/api/currency/wallet?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setBalance(data.stats.balance)
        setTotalEarned(data.stats.totalEarned)
      }
    } catch (error) {
      console.error('Error loading wallet:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <LiquidGlass className="p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-white text-sm">Loading...</span>
        </div>
      </LiquidGlass>
    )
  }

  if (compact) {
    return (
      <LiquidGlass className="px-4 py-2 rounded-full">
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Coins className="w-5 h-5 text-yellow-400" />
          <span className="text-white font-bold text-lg">
            {balance?.toLocaleString() || 0} OXY
          </span>
        </motion.div>
      </LiquidGlass>
    )
  }

  return (
    <LiquidGlass className="p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-xl">OXY Wallet</h3>
            <p className="text-gray-300 text-sm">Your balance</p>
          </div>
        </div>
      </div>

      <motion.div
        className="mb-4"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-4xl font-bold text-white mb-1">
          {balance?.toLocaleString() || 0}
          <span className="text-2xl text-yellow-400 ml-2">OXY</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-300">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span>Total Earned: {totalEarned.toLocaleString()} OXY</span>
          </div>
        </div>
      </motion.div>

      <div className="flex gap-2">
        <UiverseButton
          variant="primary"
          size="sm"
          onClick={() => {
            // Navigate to transaction history
            window.location.href = '/wallet'
          }}
        >
          View History
        </UiverseButton>
        <UiverseButton
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              const response = await fetch('/api/currency/daily-reward', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
              })
              const result = await response.json()
              if (result.claimed) {
                await loadWallet()
                // Show notification
                if (typeof window !== 'undefined' && (window as any).showNotification) {
                  (window as any).showNotification(`Daily reward claimed! +${result.amount} OXY`, 'success')
                }
              }
            } catch (error) {
              console.error('Error claiming daily reward:', error)
            }
          }}
        >
          Daily Reward
        </UiverseButton>
      </div>
    </LiquidGlass>
  )
}

