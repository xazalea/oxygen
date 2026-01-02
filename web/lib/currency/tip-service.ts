/**
 * Creator Tip Service
 * 
 * Allows users to tip creators with OXY.
 */

import { getCurrencyService } from './currency-service'
import { getDBOperations } from '../telegram-db-operations'

export interface TipRecord {
  id: string
  fromUserId: string
  toUserId: string
  postId?: string // Optional: tip for specific post
  amount: number
  message?: string
  isPublic: boolean
  createdAt: number
  updatedAt?: number
}

export class TipService {
  private currencyService = getCurrencyService()
  private db = getDBOperations()

  /**
   * Tip a creator
   */
  async tipCreator(
    fromUserId: string,
    toUserId: string,
    amount: number,
    options: {
      postId?: string
      message?: string
      isPublic?: boolean
    } = {}
  ): Promise<{ success: boolean; tipId?: string; error?: string }> {
    const { postId, message, isPublic = true } = options

    // Minimum tip amount
    if (amount < 10) {
      return {
        success: false,
        error: 'Minimum tip amount is 10 OXY'
      }
    }

    // Spend currency from tipper
    const spendResult = await this.currencyService.spendCurrency(
      fromUserId,
      amount,
      'tip',
      { toUserId, postId }
    )

    if (!spendResult.success) {
      return {
        success: false,
        error: spendResult.error || 'Failed to send tip'
      }
    }

    // Add currency to creator (they receive the tip)
    await this.currencyService.addCurrency(
      toUserId,
      amount,
      'tip',
      { fromUserId, postId }
    )

    // Create tip record
    const tipData: Omit<TipRecord, 'id'> = {
      fromUserId,
      toUserId,
      postId,
      amount,
      message,
      isPublic,
      createdAt: Date.now()
    }

    const tipCreated = await this.db.create('tips', tipData)
    const tip: TipRecord = {
      ...tipData,
      id: tipCreated.id
    }

    return {
      success: true,
      tipId: tip.id
    }
  }

  /**
   * Get tips received by a creator
   */
  async getTipsReceived(userId: string, limit: number = 50): Promise<TipRecord[]> {
    const tips = await this.db.read('tips', {
      where: { toUserId: userId },
      orderBy: 'createdAt',
      orderDirection: 'desc',
      limit
    }) as TipRecord[]

    return tips
  }

  /**
   * Get tips sent by a user
   */
  async getTipsSent(userId: string, limit: number = 50): Promise<TipRecord[]> {
    const tips = await this.db.read('tips', {
      where: { fromUserId: userId },
      orderBy: 'createdAt',
      orderDirection: 'desc',
      limit
    }) as TipRecord[]

    return tips
  }

  /**
   * Get total tips received
   */
  async getTotalTipsReceived(userId: string): Promise<number> {
    const tips = await this.getTipsReceived(userId, 1000)
    return tips.reduce((sum, tip) => sum + tip.amount, 0)
  }

  /**
   * Get public tips for a post
   */
  async getPublicTipsForPost(postId: string): Promise<TipRecord[]> {
    const tips = await this.db.read('tips', {
      where: {
        postId,
        isPublic: true
      },
      orderBy: 'createdAt',
      orderDirection: 'desc',
      limit: 20
    }) as TipRecord[]

    return tips
  }
}

// Singleton instance
let tipServiceInstance: TipService | null = null

export function getTipService(): TipService {
  if (!tipServiceInstance) {
    tipServiceInstance = new TipService()
  }
  return tipServiceInstance
}

