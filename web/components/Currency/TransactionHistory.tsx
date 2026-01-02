'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpCircle, ArrowDownCircle, Filter } from 'lucide-react'
import { UiverseCard } from '../UI/UiverseCard'
import { UiverseButton } from '../UI/UiverseButton'
import { LiquidGlass } from '../UI/LiquidGlass'
import { getCurrencyService } from '@/lib/currency/currency-service'
import { CurrencyTransactionRecord } from '@/lib/telegram-db-schema'

interface TransactionHistoryProps {
  userId: string
}

export function TransactionHistory({ userId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<CurrencyTransactionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'earned' | 'spent'>('all')

  useEffect(() => {
    loadTransactions()
  }, [userId, filter])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        userId,
        limit: '50',
        ...(filter !== 'all' && { type: filter })
      })
      const response = await fetch(`/api/currency/transactions?${params}`)
      if (response.ok) {
        const history = await response.json()
        setTransactions(history)
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSourceLabel = (source: string): string => {
    const labels: Record<string, string> = {
      investment: 'Investment Return',
      daily_reward: 'Daily Login',
      achievement: 'Achievement',
      boost: 'Post Boost',
      tip: 'Tip',
      premium: 'Premium Feature',
      badge: 'Badge',
      exclusive: 'Exclusive Content',
      referral: 'Referral Bonus',
      streak: 'Streak Bonus'
    }
    return labels[source] || source
  }

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return 'Just now'
  }

  return (
    <LiquidGlass className="p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Transaction History</h2>
        <div className="flex gap-2">
          <UiverseButton
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </UiverseButton>
          <UiverseButton
            variant={filter === 'earned' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('earned')}
          >
            Earned
          </UiverseButton>
          <UiverseButton
            variant={filter === 'spent' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('spent')}
          >
            Spent
          </UiverseButton>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No transactions yet
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${
                  transaction.type === 'earned' 
                    ? 'bg-green-500/20' 
                    : 'bg-red-500/20'
                }`}>
                  {transaction.type === 'earned' ? (
                    <ArrowUpCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <ArrowDownCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div>
                  <div className="text-white font-medium">
                    {getSourceLabel(transaction.source)}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {formatDate(transaction.timestamp)}
                  </div>
                </div>
              </div>
              <div className={`text-lg font-bold ${
                transaction.type === 'earned' ? 'text-green-400' : 'text-red-400'
              }`}>
                {transaction.type === 'earned' ? '+' : '-'}
                {transaction.amount.toLocaleString()} OXY
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </LiquidGlass>
  )
}

