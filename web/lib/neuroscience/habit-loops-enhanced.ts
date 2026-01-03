/**
 * Enhanced Habit Formation Loops
 * 
 * Extends habit formation with daily rewards, challenges, and currency integration.
 */

import { getCurrencyService } from '../currency/currency-service'
import { getInvestmentService } from '../investing/investment-service'
import { getProgressSystem } from './progress-system'

export interface DailyChallenge {
  id: string
  name: string
  description: string
  type: 'login' | 'invest' | 'interact' | 'streak'
  target: number
  current: number
  reward: number
  expiresAt: number
  completed: boolean
}

export interface WeeklyChallenge {
  id: string
  name: string
  description: string
  type: 'portfolio' | 'investments' | 'returns' | 'social'
  target: number
  current: number
  reward: number
  expiresAt: number
  completed: boolean
}

export class HabitLoopsEnhanced {
  private currencyService = getCurrencyService()
  private investmentService = getInvestmentService()
  private progressSystem = getProgressSystem()

  /**
   * Get daily challenges
   */
  async getDailyChallenges(userId: string): Promise<DailyChallenge[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    const stats = await this.currencyService.getCurrencyStats(userId)
    const portfolio = await this.investmentService.getPortfolio(userId)

    const challenges: DailyChallenge[] = [
      {
        id: 'daily_login',
        name: 'Daily Login',
        description: 'Log in today',
        type: 'login',
        target: 1,
        current: 1, // Assumed logged in
        reward: 50,
        expiresAt: todayEnd.getTime(),
        completed: true
      },
      {
        id: 'daily_invest',
        name: 'Make an Investment',
        description: 'Invest in at least one post today',
        type: 'invest',
        target: 1,
        current: portfolio.active.length, // Active investments today
        reward: 100,
        expiresAt: todayEnd.getTime(),
        completed: portfolio.active.length >= 1
      },
      {
        id: 'daily_interact',
        name: 'Engage with Content',
        description: 'Like, comment, or share 5 posts',
        type: 'interact',
        target: 5,
        current: 0, // Would need to track interactions
        reward: 75,
        expiresAt: todayEnd.getTime(),
        completed: false
      },
      {
        id: 'daily_streak',
        name: 'Maintain Streak',
        description: `Keep your ${stats.streak}-day streak going`,
        type: 'streak',
        target: stats.streak + 1,
        current: stats.streak,
        reward: stats.streak * 10,
        expiresAt: todayEnd.getTime(),
        completed: false // Will be checked when claiming daily reward
      }
    ]

    return challenges
  }

  /**
   * Get weekly challenges
   */
  async getWeeklyChallenges(userId: string): Promise<WeeklyChallenge[]> {
    const now = new Date()
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()))
    weekEnd.setHours(23, 59, 59, 999)

    const portfolio = await this.investmentService.getPortfolio(userId)

    const challenges: WeeklyChallenge[] = [
      {
        id: 'weekly_portfolio',
        name: 'Portfolio Builder',
        description: 'Have 10 active investments',
        type: 'portfolio',
        target: 10,
        current: portfolio.active.length,
        reward: 500,
        expiresAt: weekEnd.getTime(),
        completed: portfolio.active.length >= 10
      },
      {
        id: 'weekly_returns',
        name: 'Profit Seeker',
        description: 'Earn 1,000 OXY in returns this week',
        type: 'returns',
        target: 1000,
        current: portfolio.stats.totalReturns, // Would need weekly tracking
        reward: 750,
        expiresAt: weekEnd.getTime(),
        completed: false
      },
      {
        id: 'weekly_investments',
        name: 'Active Investor',
        description: 'Make 20 investments this week',
        type: 'investments',
        target: 20,
        current: portfolio.active.length + portfolio.completed.length, // Would need weekly tracking
        reward: 600,
        expiresAt: weekEnd.getTime(),
        completed: false
      }
    ]

    return challenges
  }

  /**
   * Complete daily challenge
   */
  async completeDailyChallenge(
    userId: string,
    challengeId: string
  ): Promise<{ success: boolean; reward?: number; error?: string }> {
    const challenges = await this.getDailyChallenges(userId)
    const challenge = challenges.find(c => c.id === challengeId)

    if (!challenge) {
      return { success: false, error: 'Challenge not found' }
    }

    if (challenge.completed) {
      return { success: false, error: 'Challenge already completed' }
    }

    if (Date.now() > challenge.expiresAt) {
      return { success: false, error: 'Challenge expired' }
    }

    // Award reward
    await this.currencyService.addCurrency(
      userId,
      challenge.reward,
      'achievement',
      { challengeId, type: 'daily_challenge' }
    )

    return {
      success: true,
      reward: challenge.reward
    }
  }

  /**
   * Complete weekly challenge
   */
  async completeWeeklyChallenge(
    userId: string,
    challengeId: string
  ): Promise<{ success: boolean; reward?: number; error?: string }> {
    const challenges = await this.getWeeklyChallenges(userId)
    const challenge = challenges.find(c => c.id === challengeId)

    if (!challenge) {
      return { success: false, error: 'Challenge not found' }
    }

    if (challenge.completed) {
      return { success: false, error: 'Challenge already completed' }
    }

    if (Date.now() > challenge.expiresAt) {
      return { success: false, error: 'Challenge expired' }
    }

    // Award reward
    await this.currencyService.addCurrency(
      userId,
      challenge.reward,
      'achievement',
      { challengeId, type: 'weekly_challenge' }
    )

    return {
      success: true,
      reward: challenge.reward
    }
  }

  /**
   * Claim daily login reward (with streak bonus)
   */
  async claimDailyReward(userId: string): Promise<{
    claimed: boolean
    amount: number
    streak?: number
  }> {
    return await this.currencyService.claimDailyLoginReward(userId)
  }

  /**
   * Get monthly achievements
   */
  async getMonthlyAchievements(userId: string): Promise<any[]> {
    const progress = await this.progressSystem.getProgressSummary(userId)
    
    // Filter achievements unlocked this month
    const thisMonth = new Date().getMonth()
    const achievements = progress.achievements.filter(a => {
      if (!a.unlockedAt) return false
      const achievementDate = new Date(a.unlockedAt)
      return achievementDate.getMonth() === thisMonth
    })

    return achievements
  }

  /**
   * Check and maintain streak
   */
  async checkStreak(userId: string): Promise<{
    current: number
    maintained: boolean
    bonus?: number
  }> {
    const stats = await this.currencyService.getCurrencyStats(userId)
    const result = await this.claimDailyReward(userId)

    return {
      current: stats.streak,
      maintained: result.claimed,
      bonus: result.streak ? result.streak * 10 : undefined
    }
  }
}

// Singleton instance
let habitLoopsInstance: HabitLoopsEnhanced | null = null

export function getHabitLoopsEnhanced(): HabitLoopsEnhanced {
  if (!habitLoopsInstance) {
    habitLoopsInstance = new HabitLoopsEnhanced()
  }
  return habitLoopsInstance
}


