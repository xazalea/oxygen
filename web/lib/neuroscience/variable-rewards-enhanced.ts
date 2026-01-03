/**
 * Enhanced Variable Reward System
 * 
 * Extends the base variable reward system with investment and currency rewards.
 */

import { getCurrencyService } from '../currency/currency-service'
import { getInvestmentService } from '../investing/investment-service'

export interface VariableReward {
  type: 'investment' | 'currency' | 'content' | 'achievement'
  amount?: number
  multiplier?: number
  message: string
  timestamp: number
}

export class VariableRewardsEnhanced {
  private currencyService = getCurrencyService()
  private investmentService = getInvestmentService()
  private rewardHistory: VariableReward[] = []
  private lastRewardTime: number = 0
  private rewardInterval: number = 30000 // 30 seconds minimum between rewards

  /**
   * Trigger variable investment reward
   */
  async triggerInvestmentReward(
    userId: string,
    investmentId: string
  ): Promise<VariableReward | null> {
    // Random chance for bonus (10% chance)
    if (Math.random() > 0.1) {
      return null
    }

    // Calculate bonus (10-50 OXY)
    const bonusAmount = 10 + Math.random() * 40

    await this.currencyService.addCurrency(
      userId,
      bonusAmount,
      'investment',
      { investmentId, type: 'bonus' }
    )

    const reward: VariableReward = {
      type: 'investment',
      amount: bonusAmount,
      message: `Lucky investment bonus! +${bonusAmount.toFixed(0)} OXY`,
      timestamp: Date.now()
    }

    this.rewardHistory.push(reward)
    return reward
  }

  /**
   * Trigger variable currency drop
   */
  async triggerCurrencyDrop(userId: string): Promise<VariableReward | null> {
    const now = Date.now()
    if (now - this.lastRewardTime < this.rewardInterval) {
      return null
    }

    // Variable interval (30 seconds to 5 minutes)
    const interval = 30000 + Math.random() * 270000
    if (now - this.lastRewardTime < interval) {
      return null
    }

    // Random amount (5-25 OXY)
    const amount = 5 + Math.random() * 20

    await this.currencyService.addCurrency(
      userId,
      amount,
      'achievement',
      { type: 'random_drop' }
    )

    this.lastRewardTime = now

    const reward: VariableReward = {
      type: 'currency',
      amount,
      message: `Random OXY drop! +${amount.toFixed(0)} OXY`,
      timestamp: now
    }

    this.rewardHistory.push(reward)
    return reward
  }

  /**
   * Trigger streak bonus
   */
  async triggerStreakBonus(userId: string, streak: number): Promise<VariableReward | null> {
    // Bonus increases with streak
    const bonusAmount = Math.min(100, streak * 5)

    await this.currencyService.addCurrency(
      userId,
      bonusAmount,
      'streak',
      { streak }
    )

    const reward: VariableReward = {
      type: 'currency',
      amount: bonusAmount,
      message: `${streak}-day streak! +${bonusAmount} OXY bonus`,
      timestamp: Date.now()
    }

    this.rewardHistory.push(reward)
    return reward
  }

  /**
   * Trigger surprise content unlock
   */
  triggerContentUnlock(contentId: string): VariableReward {
    const reward: VariableReward = {
      type: 'content',
      message: 'Exclusive content unlocked!',
      timestamp: Date.now()
    }

    this.rewardHistory.push(reward)
    return reward
  }

  /**
   * Trigger achievement unlock
   */
  async triggerAchievementUnlock(
    userId: string,
    achievementId: string,
    amount: number
  ): Promise<VariableReward> {
    await this.currencyService.awardAchievement(userId, achievementId, amount)

    const reward: VariableReward = {
      type: 'achievement',
      amount,
      message: `Achievement unlocked! +${amount} OXY`,
      timestamp: Date.now()
    }

    this.rewardHistory.push(reward)
    return reward
  }

  /**
   * Get reward history
   */
  getRewardHistory(limit: number = 20): VariableReward[] {
    return this.rewardHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Check if should trigger reward (variable interval)
   */
  shouldTriggerReward(type: string): boolean {
    const now = Date.now()
    const lastReward = this.rewardHistory
      .filter(r => r.type === type)
      .sort((a, b) => b.timestamp - a.timestamp)[0]

    if (!lastReward) return true

    // Variable interval based on type
    const intervals: Record<string, number> = {
      investment: 60000, // 1 minute
      currency: 300000, // 5 minutes
      content: 180000, // 3 minutes
      achievement: 3600000 // 1 hour
    }

    const interval = intervals[type] || 300000
    const variableInterval = interval + (Math.random() * interval * 0.5) // ±50% variation

    return now - lastReward.timestamp > variableInterval
  }
}

// Singleton instance
let variableRewardsInstance: VariableRewardsEnhanced | null = null

export function getVariableRewardsEnhanced(): VariableRewardsEnhanced {
  if (!variableRewardsInstance) {
    variableRewardsInstance = new VariableRewardsEnhanced()
  }
  return variableRewardsInstance
}


