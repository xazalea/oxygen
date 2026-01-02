/**
 * Progress and Achievement System
 * 
 * Tracks user progress, milestones, and levels based on OXY earned and investments.
 */

import { getCurrencyService } from '../currency/currency-service'
import { getInvestmentService } from '../investing/investment-service'
import { getBadgeService } from '../currency/badge-service'

export interface Milestone {
  id: string
  name: string
  description: string
  target: number
  current: number
  progress: number // 0-1
  reward: number
  unlocked: boolean
}

export interface Level {
  level: number
  name: string
  totalOXYRequired: number
  currentOXY: number
  progress: number // 0-1
  benefits: string[]
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: number
  progress?: number
}

export class ProgressSystem {
  private currencyService = getCurrencyService()
  private investmentService = getInvestmentService()
  private badgeService = getBadgeService()

  /**
   * Get user level
   */
  async getUserLevel(userId: string): Promise<Level> {
    const stats = await this.currencyService.getCurrencyStats(userId)
    const totalOXY = stats.totalEarned

    // Level calculation: 1000 OXY per level
    const level = Math.floor(totalOXY / 1000) + 1
    const currentLevelOXY = totalOXY % 1000
    const progress = currentLevelOXY / 1000

    const levelNames = [
      'Beginner',
      'Explorer',
      'Investor',
      'Trader',
      'Whale',
      'Master',
      'Legend',
      'Mythic'
    ]

    const name = levelNames[Math.min(level - 1, levelNames.length - 1)] || `Level ${level}`

    const benefits = this.getLevelBenefits(level)

    return {
      level,
      name,
      totalOXYRequired: level * 1000,
      currentOXY: totalOXY,
      progress,
      benefits
    }
  }

  /**
   * Get level benefits
   */
  private getLevelBenefits(level: number): string[] {
    const benefits: string[] = []

    if (level >= 2) benefits.push('Unlock premium filters')
    if (level >= 3) benefits.push('Priority support')
    if (level >= 5) benefits.push('Exclusive badges')
    if (level >= 7) benefits.push('VIP content access')
    if (level >= 10) benefits.push('Custom profile theme')

    return benefits
  }

  /**
   * Get investment milestones
   */
  async getInvestmentMilestones(userId: string): Promise<Milestone[]> {
    const portfolio = await this.investmentService.getPortfolio(userId)
    const stats = portfolio.stats

    const milestones: Milestone[] = [
      {
        id: 'first_investment',
        name: 'First Investment',
        description: 'Make your first investment',
        target: 1,
        current: portfolio.active.length + portfolio.completed.length,
        progress: 0,
        reward: 50,
        unlocked: (portfolio.active.length + portfolio.completed.length) >= 1
      },
      {
        id: 'invest_1000',
        name: 'Investor',
        description: 'Invest 1,000 OXY total',
        target: 1000,
        current: stats.totalInvested,
        progress: Math.min(1, stats.totalInvested / 1000),
        reward: 200,
        unlocked: stats.totalInvested >= 1000
      },
      {
        id: 'invest_10000',
        name: 'Whale',
        description: 'Invest 10,000 OXY total',
        target: 10000,
        current: stats.totalInvested,
        progress: Math.min(1, stats.totalInvested / 10000),
        reward: 1000,
        unlocked: stats.totalInvested >= 10000
      },
      {
        id: 'return_1000',
        name: 'Profitable',
        description: 'Earn 1,000 OXY in returns',
        target: 1000,
        current: stats.totalReturns,
        progress: Math.min(1, stats.totalReturns / 1000),
        reward: 500,
        unlocked: stats.totalReturns >= 1000
      },
      {
        id: 'roi_50',
        name: 'Expert Investor',
        description: 'Achieve 50% average ROI',
        target: 50,
        current: stats.averageROI,
        progress: Math.min(1, stats.averageROI / 50),
        reward: 750,
        unlocked: stats.averageROI >= 50
      }
    ]

    return milestones
  }

  /**
   * Get currency milestones
   */
  async getCurrencyMilestones(userId: string): Promise<Milestone[]> {
    const stats = await this.currencyService.getCurrencyStats(userId)

    const milestones: Milestone[] = [
      {
        id: 'earn_1000',
        name: 'First Thousand',
        description: 'Earn 1,000 OXY total',
        target: 1000,
        current: stats.totalEarned,
        progress: Math.min(1, stats.totalEarned / 1000),
        reward: 100,
        unlocked: stats.totalEarned >= 1000
      },
      {
        id: 'earn_10000',
        name: 'Ten Thousand Club',
        description: 'Earn 10,000 OXY total',
        target: 10000,
        current: stats.totalEarned,
        progress: Math.min(1, stats.totalEarned / 10000),
        reward: 500,
        unlocked: stats.totalEarned >= 10000
      },
      {
        id: 'streak_7',
        name: 'Week Warrior',
        description: '7-day login streak',
        target: 7,
        current: stats.streak,
        progress: Math.min(1, stats.streak / 7),
        reward: 200,
        unlocked: stats.streak >= 7
      },
      {
        id: 'streak_30',
        name: 'Monthly Master',
        description: '30-day login streak',
        target: 30,
        current: stats.streak,
        progress: Math.min(1, stats.streak / 30),
        reward: 1000,
        unlocked: stats.streak >= 30
      }
    ]

    return milestones
  }

  /**
   * Check and unlock milestones
   */
  async checkMilestones(userId: string): Promise<Milestone[]> {
    const investmentMilestones = await this.getInvestmentMilestones(userId)
    const currencyMilestones = await this.getCurrencyMilestones(userId)
    const allMilestones = [...investmentMilestones, ...currencyMilestones]

    const newlyUnlocked: Milestone[] = []

    for (const milestone of allMilestones) {
      if (milestone.unlocked && milestone.progress >= 1) {
        // Check if badge already unlocked
        const hasBadge = await this.badgeService.hasBadge(userId, milestone.id)
        if (!hasBadge) {
          // Award reward
          await this.currencyService.addCurrency(
            userId,
            milestone.reward,
            'achievement',
            { milestoneId: milestone.id }
          )

          // Grant badge
          await this.badgeService.grantBadge(userId, milestone.id, 'earned')

          newlyUnlocked.push(milestone)
        }
      }
    }

    return newlyUnlocked
  }

  /**
   * Get all achievements
   */
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const userBadges = await this.badgeService.getUserBadges(userId)
    const allBadges = this.badgeService.getAvailableBadges()

    return allBadges.map(badge => {
      const userBadge = userBadges.find(ub => ub.badgeId === badge.id)
      return {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        unlocked: !!userBadge,
        unlockedAt: userBadge?.unlockedAt,
        progress: userBadge ? 1 : 0
      }
    })
  }

  /**
   * Get progress summary
   */
  async getProgressSummary(userId: string): Promise<{
    level: Level
    investmentMilestones: Milestone[]
    currencyMilestones: Milestone[]
    achievements: Achievement[]
    nextMilestone?: Milestone
  }> {
    const level = await this.getUserLevel(userId)
    const investmentMilestones = await this.getInvestmentMilestones(userId)
    const currencyMilestones = await this.getCurrencyMilestones(userId)
    const achievements = await this.getUserAchievements(userId)

    // Find next milestone
    const allMilestones = [...investmentMilestones, ...currencyMilestones]
    const nextMilestone = allMilestones
      .filter(m => !m.unlocked)
      .sort((a, b) => b.progress - a.progress)[0]

    return {
      level,
      investmentMilestones,
      currencyMilestones,
      achievements,
      nextMilestone
    }
  }
}

// Singleton instance
let progressSystemInstance: ProgressSystem | null = null

export function getProgressSystem(): ProgressSystem {
  if (!progressSystemInstance) {
    progressSystemInstance = new ProgressSystem()
  }
  return progressSystemInstance
}

