'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users } from 'lucide-react'
import { UiverseButton } from '../UI/UiverseButton'
import { UiverseIconButton } from '../UI/UiverseIconButton'
import { InvestmentModal } from './InvestmentModal'
import { getInvestmentService } from '@/lib/investing/investment-service'
import { getCurrencyService } from '@/lib/currency/currency-service'

interface InvestmentButtonProps {
  postId: string
  userId: string
  currentValuation?: number
  investorCount?: number
  userInvestment?: number
  compact?: boolean
}

export function InvestmentButton({
  postId,
  userId,
  currentValuation = 0,
  investorCount = 0,
  userInvestment,
  compact = false
}: InvestmentButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleInvest = async (amount: number) => {
    try {
      setLoading(true)
      const response = await fetch('/api/investments/invest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, postId, amount })
      })

      const data = await response.json()
      
      if (data.success) {
        setShowModal(false)
        // Show success notification
        if (typeof window !== 'undefined' && (window as any).showNotification) {
          (window as any).showNotification(`Invested ${amount} OXY!`, 'success')
        }
        // Refresh data
        setTimeout(() => window.location.reload(), 1000)
      } else {
        alert(data.error || 'Failed to invest')
      }
    } catch (error) {
      console.error('Error investing:', error)
      alert('Failed to invest. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <>
        <UiverseIconButton
          icon={<TrendingUp className="w-5 h-5" />}
          onClick={() => setShowModal(true)}
          variant="ghost"
          size="sm"
        />
        {showModal && (
          <InvestmentModal
            postId={postId}
            userId={userId}
            currentValuation={currentValuation}
            investorCount={investorCount}
            userInvestment={userInvestment}
            onInvest={handleInvest}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    )
  }

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <UiverseButton
          variant="primary"
          onClick={() => setShowModal(true)}
          disabled={loading}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <span>Invest</span>
            {investorCount > 0 && (
              <span className="text-xs opacity-80">
                ({investorCount})
              </span>
            )}
          </div>
        </UiverseButton>
      </motion.div>

      {showModal && (
        <InvestmentModal
          postId={postId}
          userId={userId}
          currentValuation={currentValuation}
          investorCount={investorCount}
          userInvestment={userInvestment}
          onInvest={handleInvest}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}

