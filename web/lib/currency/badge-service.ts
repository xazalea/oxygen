/**
 * Badge Service
 * 
 * Manages badges and achievements that can be purchased or earned.
 */

import { getCurrencyService } from './currency-service'
import { getDBOperations } from '../telegram-db-operations'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  cost?: number // If purchasable
  unlockable?: boolean // If can be earned
  unlockCondition?: string
}

export interface UserBadge {
  id?: string
  userId: string
  badgeId: string
  unlockedAt: number
  source: 'purchased' | 'earned' | 'gifted'
  createdAt?: number
  updatedAt?: number
}

const AVAILABLE_BADGES: Badge[] = [
  {
    id: 'early_investor',
    name: 'Early Investor',
    description: 'Made your first investment',
    icon: '💰',
    rarity: 'common',
    unlockable: true,
    unlockCondition: 'first_investment'
  },
  {
    id: 'top_investor',
    name: 'Top Investor',
    description: 'In top 10% of investors',
    icon: '🏆',
    rarity: 'rare',
    unlockable: true,
    unlockCondition: 'top_investor'
  },
  {
    id: 'whale',
    name: 'Whale',
    description: 'Invested over 10,000 OXY total',
    icon: '🐋',
    rarity: 'epic',
    unlockable: true,
    unlockCondition: 'total_invested_10000'
  },
  {
    id: 'exclusive_badge',
    name: 'Exclusive Member',
    description: 'Limited edition badge',
    icon: '⭐',
    rarity: 'legendary',
    cost: 5000
  },
  {
    id: 'creator_supporter',
    name: 'Creator Supporter',
    description: 'Tipped creators over 1,000 OXY',
    icon: '💝',
    rarity: 'rare',
    unlockable: true,
    unlockCondition: 'total_tips_1000'
  }
]

export class BadgeService {
  private currencyService = getCurrencyService()
  private db = getDBOperations()

  /**
   * Get all available badges
   */
  getAvailableBadges(): Badge[] {
    return AVAILABLE_BADGES
  }

  /**
   * Purchase a badge
   */
  async purchaseBadge(
    userId: string,
    badgeId: string
  ): Promise<{ success: boolean; error?: string }> {
    const badge = AVAILABLE_BADGES.find(b => b.id === badgeId)
    if (!badge) {
      return {
        success: false,
        error: 'Badge not found'
      }
    }

    if (!badge.cost) {
      return {
        success: false,
        error: 'Badge is not purchasable'
      }
    }

    // Check if already owned
    const existing = await this.getUserBadge(userId, badgeId)
    if (existing) {
      return {
        success: false,
        error: 'Badge already owned'
      }
    }

    // Spend currency
    const spendResult = await this.currencyService.spendCurrency(
      userId,
      badge.cost,
      'badge',
      { badgeId, badgeName: badge.name }
    )

    if (!spendResult.success) {
      return {
        success: false,
        error: spendResult.error || 'Failed to purchase badge'
      }
    }

    // Grant badge
    await this.grantBadge(userId, badgeId, 'purchased')

    return { success: true }
  }

  /**
   * Grant badge to user (earned or purchased)
   */
  async grantBadge(
    userId: string,
    badgeId: string,
    source: 'purchased' | 'earned' | 'gifted'
  ): Promise<void> {
    const userBadgeData: Omit<UserBadge, 'id'> = {
      userId,
      badgeId,
      unlockedAt: Date.now(),
      source,
      createdAt: Date.now()
    }

    await this.db.create('user_badges', userBadgeData)
  }

  /**
   * Get user's badge
   */
  async getUserBadge(userId: string, badgeId: string): Promise<UserBadge | null> {
    const badges = await this.db.read('user_badges', {
      where: {
        userId,
        badgeId
      },
      limit: 1
    })

    if (badges.length === 0) {
      return null
    }

    const badge = badges[0] as any
    return {
      id: badge.id,
      userId: badge.userId,
      badgeId: badge.badgeId,
      unlockedAt: badge.unlockedAt,
      source: badge.source,
      createdAt: badge.createdAt,
      updatedAt: badge.updatedAt
    }
  }

  /**
   * Get all user badges
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    const badges = await this.db.read('user_badges', {
      where: { userId },
      orderBy: 'unlockedAt',
      orderDirection: 'desc'
    })

    return badges.map(b => {
      const badge = b as any
      return {
        id: badge.id,
        userId: badge.userId,
        badgeId: badge.badgeId,
        unlockedAt: badge.unlockedAt,
        source: badge.source,
        createdAt: badge.createdAt,
        updatedAt: badge.updatedAt
      }
    })
  }

  /**
   * Check if user has badge
   */
  async hasBadge(userId: string, badgeId: string): Promise<boolean> {
    const badge = await this.getUserBadge(userId, badgeId)
    return badge !== null
  }

  /**
   * Check and unlock badges based on conditions
   */
  async checkUnlockConditions(userId: string, condition: string, value?: number): Promise<void> {
    const badges = AVAILABLE_BADGES.filter(b => 
      b.unlockable && b.unlockCondition === condition
    )

    for (const badge of badges) {
      if (await this.hasBadge(userId, badge.id)) {
        continue // Already unlocked
      }

      // Check condition (simplified - would need more logic for different conditions)
      let shouldUnlock = false

      switch (condition) {
        case 'first_investment':
          shouldUnlock = true
          break
        case 'top_investor':
          // Would need to check leaderboard position
          shouldUnlock = false // Placeholder
          break
        case 'total_invested_10000':
          shouldUnlock = value !== undefined && value >= 10000
          break
        case 'total_tips_1000':
          shouldUnlock = value !== undefined && value >= 1000
          break
      }

      if (shouldUnlock) {
        await this.grantBadge(userId, badge.id, 'earned')
      }
    }
  }
}

// Singleton instance
let badgeServiceInstance: BadgeService | null = null

export function getBadgeService(): BadgeService {
  if (!badgeServiceInstance) {
    badgeServiceInstance = new BadgeService()
  }
  return badgeServiceInstance
}

