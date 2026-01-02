/**
 * Post Boost Service
 * 
 * Allows users to spend OXY to boost post visibility.
 */

import { getCurrencyService } from './currency-service'
import { getDBOperations } from '../telegram-db-operations'

export interface BoostRecord {
  id: string
  userId: string
  postId: string
  amount: number
  duration: number // hours
  reach: number // estimated reach multiplier
  startTime: number
  endTime: number
  status: 'active' | 'expired' | 'cancelled'
  createdAt: number
  updatedAt?: number
}

export class BoostService {
  private currencyService = getCurrencyService()
  private db = getDBOperations()

  /**
   * Boost a post
   */
  async boostPost(
    userId: string,
    postId: string,
    amount: number
  ): Promise<{ success: boolean; boostId?: string; error?: string }> {
    // Calculate boost duration and reach based on amount
    // 100 OXY = 24 hours, 500 OXY = 72 hours, 1000 OXY = 168 hours (1 week)
    const duration = this.calculateDuration(amount)
    const reach = this.calculateReach(amount)

    // Spend currency
    const spendResult = await this.currencyService.spendCurrency(
      userId,
      amount,
      'boost',
      { postId, duration, reach }
    )

    if (!spendResult.success) {
      return {
        success: false,
        error: spendResult.error || 'Failed to boost post'
      }
    }

    // Create boost record
    const boostData: Omit<BoostRecord, 'id'> = {
      userId,
      postId,
      amount,
      duration,
      reach,
      startTime: Date.now(),
      endTime: Date.now() + (duration * 60 * 60 * 1000),
      status: 'active',
      createdAt: Date.now()
    }

    const boostCreated = await this.db.create('boosts', boostData)
    const boost: BoostRecord = {
      ...boostData,
      id: boostCreated.id
    }

    return {
      success: true,
      boostId: boost.id
    }
  }

  /**
   * Calculate boost duration in hours
   */
  private calculateDuration(amount: number): number {
    if (amount >= 1000) return 168 // 1 week
    if (amount >= 500) return 72 // 3 days
    if (amount >= 250) return 48 // 2 days
    if (amount >= 100) return 24 // 1 day
    return Math.floor((amount / 100) * 24) // Proportional
  }

  /**
   * Calculate reach multiplier
   */
  private calculateReach(amount: number): number {
    // Base reach: 1.5x for 100 OXY, up to 5x for 1000 OXY
    return 1.5 + ((amount / 1000) * 3.5)
  }

  /**
   * Get active boosts for a post
   */
  async getActiveBoosts(postId: string): Promise<BoostRecord[]> {
    const boosts = await this.db.read('boosts', {
      where: {
        postId,
        status: 'active'
      }
    }) as BoostRecord[]

    // Filter out expired boosts
    const now = Date.now()
    return boosts.filter(boost => boost.endTime > now)
  }

  /**
   * Check if post is boosted
   */
  async isPostBoosted(postId: string): Promise<boolean> {
    const boosts = await this.getActiveBoosts(postId)
    return boosts.length > 0
  }

  /**
   * Get total boost multiplier for a post
   */
  async getBoostMultiplier(postId: string): Promise<number> {
    const boosts = await this.getActiveBoosts(postId)
    if (boosts.length === 0) return 1

    // Sum all reach multipliers (stacking)
    return boosts.reduce((sum, boost) => sum + boost.reach, 0)
  }
}

// Singleton instance
let boostServiceInstance: BoostService | null = null

export function getBoostService(): BoostService {
  if (!boostServiceInstance) {
    boostServiceInstance = new BoostService()
  }
  return boostServiceInstance
}

