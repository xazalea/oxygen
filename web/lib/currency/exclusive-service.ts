/**
 * Exclusive Content Service
 * 
 * Manages paywall content and exclusive access using OXY.
 */

import { getCurrencyService } from './currency-service'
import { getDBOperations } from '../telegram-db-operations'

export interface ExclusiveContent {
  id: string
  postId: string
  creatorId: string
  price: number
  title: string
  description?: string
  previewUrl?: string
  isActive: boolean
  createdAt: number
  updatedAt?: number
}

export interface ExclusiveAccess {
  id?: string
  userId: string
  contentId: string
  purchasedAt: number
  expiresAt?: number // If time-limited
  createdAt?: number
  updatedAt?: number
}

export class ExclusiveService {
  private currencyService = getCurrencyService()
  private db = getDBOperations()

  /**
   * Create exclusive content (paywall)
   */
  async createExclusiveContent(
    creatorId: string,
    postId: string,
    price: number,
    options: {
      title?: string
      description?: string
      previewUrl?: string
    } = {}
  ): Promise<{ success: boolean; contentId?: string; error?: string }> {
    const contentData: Omit<ExclusiveContent, 'id'> = {
      postId,
      creatorId,
      price,
      title: options.title || 'Exclusive Content',
      description: options.description,
      previewUrl: options.previewUrl,
      isActive: true,
      createdAt: Date.now()
    }

    const contentCreated = await this.db.create('exclusive_content', contentData)
    const content: ExclusiveContent = {
      ...contentData,
      id: contentCreated.id
    }

    return {
      success: true,
      contentId: content.id
    }
  }

  /**
   * Purchase access to exclusive content
   */
  async purchaseAccess(
    userId: string,
    contentId: string
  ): Promise<{ success: boolean; error?: string }> {
    // Get content
    const contents = await this.db.read('exclusive_content', {
      where: { id: contentId },
      limit: 1
    })

    if (contents.length === 0) {
      return {
        success: false,
        error: 'Content not found'
      }
    }

    const content = contents[0] as ExclusiveContent

    if (!content.isActive) {
      return {
        success: false,
        error: 'Content is not available'
      }
    }

    // Check if already purchased
    const existing = await this.hasAccess(userId, contentId)
    if (existing) {
      return {
        success: false,
        error: 'Already have access'
      }
    }

    // Spend currency
    const spendResult = await this.currencyService.spendCurrency(
      userId,
      content.price,
      'exclusive',
      { contentId, postId: content.postId, creatorId: content.creatorId }
    )

    if (!spendResult.success) {
      return {
        success: false,
        error: spendResult.error || 'Failed to purchase access'
      }
    }

    // Grant access
    const accessData: Omit<ExclusiveAccess, 'id'> = {
      userId,
      contentId,
      purchasedAt: Date.now(),
      createdAt: Date.now()
    }

    await this.db.create('exclusive_access', accessData)

    // Add currency to creator (they receive payment)
    await this.currencyService.addCurrency(
      content.creatorId,
      content.price,
      'exclusive',
      { contentId, buyerId: userId }
    )

    return { success: true }
  }

  /**
   * Check if user has access to exclusive content
   */
  async hasAccess(userId: string, contentId: string): Promise<boolean> {
    const accesses = await this.db.read('exclusive_access', {
      where: {
        userId,
        contentId
      },
      limit: 1
    })

    if (accesses.length === 0) {
      return false
    }

    const access = accesses[0] as any
    if (access.expiresAt && access.expiresAt < Date.now()) {
      return false // Expired
    }

    return true
  }

  /**
   * Get exclusive content for a post
   */
  async getExclusiveContent(postId: string): Promise<ExclusiveContent | null> {
    const contents = await this.db.read('exclusive_content', {
      where: { postId, isActive: true },
      limit: 1
    })

    if (contents.length === 0) {
      return null
    }

    return contents[0] as ExclusiveContent
  }

  /**
   * Get user's purchased exclusive content
   */
  async getUserExclusiveContent(userId: string): Promise<ExclusiveContent[]> {
    const accesses = await this.db.read('exclusive_access', {
      where: { userId }
    })

    const contentIds = accesses.map(a => (a as any).contentId)
    if (contentIds.length === 0) {
      return []
    }

    const contents = await this.db.read('exclusive_content', {
      where: { id: { $in: contentIds } }
    })

    return contents as ExclusiveContent[]
  }
}

// Singleton instance
let exclusiveServiceInstance: ExclusiveService | null = null

export function getExclusiveService(): ExclusiveService {
  if (!exclusiveServiceInstance) {
    exclusiveServiceInstance = new ExclusiveService()
  }
  return exclusiveServiceInstance
}

