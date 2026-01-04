'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Clock, DollarSign } from 'lucide-react'
import { UiverseModal } from '../UI/UiverseComponents'
import { UiverseButton } from '../UI/UiverseButton'
import { UiverseInput } from '../UI/UiverseInput'
import { LiquidGlass } from '../UI/LiquidGlass'
import { getCurrencyService } from '@/lib/currency/currency-service'
import { getInvestmentService } from '@/lib/investing/investment-service'

interface InvestmentModalProps {
  postId: string
  userId: string
  currentValuation: number
  investorCount: number
  userInvestment?: number
  onInvest: (amount: number) => void
  onClose: () => void
}

export function InvestmentModal({
  postId,
  userId,
  currentValuation,
  investorCount,
  userInvestment,
  onInvest,
  onClose
}: InvestmentModalProps) {
  const [amount, setAmount] = useState('')
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadBalance()
  }, [userId])

  const loadBalance = async () => {
    try {
      const currencyService = getCurrencyService()
      const wallet = await currencyService.getOrCreateWallet(userId)
      setBalance(wallet.balance)
    } catch (error) {
      console.error('Error loading balance:', error)
    }
  }

  const quickAmounts = [50, 100, 250, 500, 1000]

  const handleInvest = async () => {
    const investAmount = parseInt(amount)
    if (!investAmount || investAmount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (investAmount > balance) {
      alert('Insufficient balance')
      return
    }

    setLoading(true)
    try {
      await onInvest(investAmount)
    } finally {
      setLoading(false)
    }
  }

  const potentialReturn = currentValuation > 0 && userInvestment
    ? (parseInt(amount) || 0) * (currentValuation / (userInvestment || 1))
    : 0

  return (
    <UiverseModal isOpen={true} onClose={onClose} title="Invest in Post" size="md">
      <LiquidGlass className="p-6 rounded-2xl">
        <div className="space-y-6">
          {/* Current Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-yellow-400" />
                <span className="text-gray-400 text-sm">Current Valuation</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {currentValuation.toLocaleString()} OXY
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-gray-400 text-sm">Investors</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {investorCount}
              </div>
            </div>
          </div>

          {/* Your Investment */}
          {userInvestment && (
            <div className="p-4 bg-blue-500/20 rounded-xl border border-blue-500/30">
              <div className="text-sm text-blue-300 mb-1">Your Investment</div>
              <div className="text-xl font-bold text-white">
                {userInvestment.toLocaleString()} OXY
              </div>
            </div>
          )}

          {/* Investment Amount */}
          <div>
            <label className="block text-white font-medium mb-2">
              Investment Amount
            </label>
            <UiverseInput
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              icon={<DollarSign className="w-5 h-5" />}
            />
            <div className="mt-2 text-sm text-gray-400">
              Available: {balance.toLocaleString()} OXY
            </div>
          </div>

          {/* Quick Amounts */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Quick amounts:</div>
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((quickAmount) => (
                <UiverseButton
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  disabled={quickAmount > balance}
                >
                  {quickAmount}
                </UiverseButton>
              ))}
            </div>
          </div>

          {/* Potential Return */}
          {parseInt(amount) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-green-300 text-sm">Potential Return</span>
              </div>
              <div className="text-2xl font-bold text-white">
                ~{potentialReturn.toLocaleString()} OXY
              </div>
              <div className="text-xs text-gray-400 mt-1">
                *Returns vary based on post performance
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <UiverseButton
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </UiverseButton>
            <UiverseButton
              variant="primary"
              onClick={handleInvest}
              disabled={loading || !amount || parseInt(amount) <= 0 || parseInt(amount) > balance}
              className="flex-1"
            >
              {loading ? 'Investing...' : 'Invest'}
            </UiverseButton>
          </div>
        </div>
      </LiquidGlass>
    </UiverseModal>
  )
}



