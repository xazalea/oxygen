/**
 * Premium Features Service
 * 
 * Manages premium feature unlocks using OXY currency.
 */

import { getCurrencyService } from './currency-service'
import { getDBOperations } from '../telegram-db-operations'

export interface PremiumFeature {
  id: string
  name: string
  description: string
  cost: number
  type: 'filter' | 'effect' | 'tool' | 'ad_free' | 'support'
  duration?: number // hours, undefined = permanent
}

export interface UserPremiumFeature {
  userId: string
  featureId: string
  unlockedAt: number
  expiresAt?: number
  isActive: boolean
}

const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: 'premium_filters',
    name: 'Premium Filters',
    description: 'Access to exclusive AR filters and effects',
    cost: 200,
    type: 'filter'
  },
  {
    id: 'advanced_editing',
    name: 'Advanced Editing Tools',
    description: 'Unlock professional video editing features',
    cost: 300,
    type: 'tool'
  },
  {
    id: 'exclusive_ar',
    name: 'Exclusive AR Filters',
    description: 'Limited edition AR filters and effects',
    cost: 500,
    type: 'effect'
  },
  {
    id: 'ad_free',
    name: 'Ad-Free Experience',
    description: 'Remove all ads for 30 days',
    cost: 1000,
    type: 'ad_free',
    duration: 720 // 30 days in hours
  },
  {
    id: 'priority_support',
    name: 'Priority Support',
    description: 'Get priority customer support',
    cost: 500,
    type: 'support',
    duration: 168 // 7 days
  }
]

export class PremiumService {
  private currencyService = getCurrencyService()
  private db = getDBOperations()

  /**
   * Get all available premium features
   */
  getAvailableFeatures(): PremiumFeature[] {
    return PREMIUM_FEATURES
  }

  /**
   * Unlock a premium feature
   */
  async unlockFeature(
    userId: string,
    featureId: string
  ): Promise<{ success: boolean; error?: string }> {
    const feature = PREMIUM_FEATURES.find(f => f.id === featureId)
    if (!feature) {
      return {
        success: false,
        error: 'Feature not found'
      }
    }

    // Check if already unlocked and active
    const existing = await this.getUserFeature(userId, featureId)
    if (existing && existing.isActive) {
      if (!feature.duration) {
        return {
          success: false,
          error: 'Feature already unlocked permanently'
        }
      }
      // Can extend duration
    }

    // Spend currency
    const spendResult = await this.currencyService.spendCurrency(
      userId,
      feature.cost,
      'premium',
      { featureId, featureName: feature.name }
    )

    if (!spendResult.success) {
      return {
        success: false,
        error: spendResult.error || 'Failed to unlock feature'
      }
    }

    // Create or update user feature
    const expiresAt = feature.duration
      ? Date.now() + (feature.duration * 60 * 60 * 1000)
      : undefined

    const userFeatureData: Omit<UserPremiumFeature, 'id'> = {
      userId,
      featureId,
      unlockedAt: Date.now(),
      expiresAt,
      isActive: true,
      createdAt: Date.now()
    }

    if (existing) {
      // Update existing
      await this.db.update('user_premium_features', existing.id, userFeatureData)
    } else {
      // Create new
      await this.db.create('user_premium_features', userFeatureData)
    }

    return { success: true }
  }

  /**
   * Get user's premium feature
   */
  async getUserFeature(userId: string, featureId: string): Promise<UserPremiumFeature | null> {
    const features = await this.db.read('user_premium_features', {
      where: {
        userId,
        featureId
      },
      limit: 1
    })

    if (features.length === 0) {
      return null
    }

    const feature = features[0] as any
    const userFeature: UserPremiumFeature = {
      userId: feature.userId,
      featureId: feature.featureId,
      unlockedAt: feature.unlockedAt,
      expiresAt: feature.expiresAt,
      isActive: this.isFeatureActive(feature)
    }

    return userFeature
  }

  /**
   * Check if feature is active
   */
  private isFeatureActive(feature: any): boolean {
    if (!feature.expiresAt) return true // Permanent
    return feature.expiresAt > Date.now()
  }

  /**
   * Get all active premium features for user
   */
  async getActiveFeatures(userId: string): Promise<UserPremiumFeature[]> {
    const features = await this.db.read('user_premium_features', {
      where: { userId }
    })

    return features
      .map(f => {
        const feature = f as any
        return {
          id: feature.id,
          userId: feature.userId,
          featureId: feature.featureId,
          unlockedAt: feature.unlockedAt,
          expiresAt: feature.expiresAt,
          isActive: this.isFeatureActive(feature),
          createdAt: feature.createdAt,
          updatedAt: feature.updatedAt
        } as UserPremiumFeature
      })
      .filter(f => f.isActive)
  }

  /**
   * Check if user has feature unlocked
   */
  async hasFeature(userId: string, featureId: string): Promise<boolean> {
    const feature = await this.getUserFeature(userId, featureId)
    return feature !== null && feature.isActive
  }
}

// Singleton instance
let premiumServiceInstance: PremiumService | null = null

export function getPremiumService(): PremiumService {
  if (!premiumServiceInstance) {
    premiumServiceInstance = new PremiumService()
  }
  return premiumServiceInstance
}

