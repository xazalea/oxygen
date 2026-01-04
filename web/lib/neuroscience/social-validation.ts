/**
 * Social Validation System
 * 
 * Provides social validation through leaderboards, badges, and public recognition.
 */

import { getInvestmentService } from '../investing/investment-service'
import { getBadgeService } from '../currency/badge-service'
import { getCurrencyService } from '../currency/currency-service'

export interface SocialValidationEvent {
  type: 'leaderboard' | 'badge' | 'recognition' | 'achievement'
  message: string
  public: boolean
  timestamp: number
}

export class SocialValidationSystem {
  private investmentService = getInvestmentService()
  private badgeService = getBadgeService()
  private currencyService = getCurrencyService()
  private validationHistory: SocialValidationEvent[] = []

  /**
   * Get investment leaderboard position
   */
  async getLeaderboardPosition(userId: string): Promise<{
    rank: number
    totalReturns: number
    message?: string
  }> {
    const leaderboard = await this.investmentService.getLeaderboard('investors', 100)
    const userIndex = leaderboard.findIndex(entry => entry.userId === userId)

    if (userIndex === -1) {
      return { rank: 0, totalReturns: 0 }
    }

    const rank = userIndex + 1
    const entry = leaderboard[userIndex]

    let message: string | undefined
    if (rank === 1) {
      message = '🏆 #1 Top Investor!'
    } else if (rank <= 3) {
      message = `🥇 Top ${rank} Investor!`
    } else if (rank <= 10) {
      message = `⭐ Top 10 Investor!`
    } else if (rank <= 100) {
      message = `📈 Top 100 Investor!`
    }

    return {
      rank,
      totalReturns: entry.totalReturns,
      message
    }
  }

  /**
   * Check and award top investor badge
   */
  async checkTopInvestorBadge(userId: string): Promise<SocialValidationEvent | null> {
    const position = await this.getLeaderboardPosition(userId)

    if (position.rank > 0 && position.rank <= 10) {
      // Check if already has badge
      const hasBadge = await this.badgeService.hasBadge(userId, 'top_investor')
      if (!hasBadge) {
        await this.badgeService.grantBadge(userId, 'top_investor', 'earned')
        
        const event: SocialValidationEvent = {
          type: 'badge',
          message: position.message || 'Top Investor Badge Earned!',
          public: true,
          timestamp: Date.now()
        }

        this.validationHistory.push(event)
        return event
      }
    }

    return null
  }

  /**
   * Get user badges for display
   */
  async getUserBadges(userId: string): Promise<Array<{ id: string; name: string; icon: string }>> {
    const userBadges = await this.badgeService.getUserBadges(userId)
    const allBadges = this.badgeService.getAvailableBadges()

    return userBadges.map(ub => {
      const badge = allBadges.find(b => b.id === ub.badgeId)
      return {
        id: ub.badgeId,
        name: badge?.name || ub.badgeId,
        icon: badge?.icon || '🏅'
      }
    })
  }

  /**
   * Create public recognition event
   */
  createRecognition(
    userId: string,
    type: 'milestone' | 'achievement' | 'investment',
    message: string
  ): SocialValidationEvent {
    const event: SocialValidationEvent = {
      type: 'recognition',
      message,
      public: true,
      timestamp: Date.now()
    }

    this.validationHistory.push(event)
    return event
  }

  /**
   * Get validation history
   */
  getValidationHistory(limit: number = 20): SocialValidationEvent[] {
    return this.validationHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Share achievement publicly
   */
  async shareAchievement(
    userId: string,
    achievementId: string
  ): Promise<SocialValidationEvent> {
    const badge = this.badgeService.getAvailableBadges().find(b => b.id === achievementId)
    const message = badge
      ? `${badge.icon} ${badge.name} unlocked!`
      : 'Achievement unlocked!'

    return this.createRecognition(userId, 'achievement', message)
  }
}

// Singleton instance
let socialValidationInstance: SocialValidationSystem | null = null

export function getSocialValidationSystem(): SocialValidationSystem {
  if (!socialValidationInstance) {
    socialValidationInstance = new SocialValidationSystem()
  }
  return socialValidationInstance
}



