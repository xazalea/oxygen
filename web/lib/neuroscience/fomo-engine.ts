/**
 * FOMO (Fear of Missing Out) Engine
 * 
 * Creates urgency and FOMO through limited-time opportunities, trending investments,
 * and exclusive content notifications.
 */

import { getInvestmentService } from '../investing/investment-service'
import { getExclusiveService } from '../currency/exclusive-service'

export interface FOMOEvent {
  type: 'investment' | 'exclusive' | 'trending' | 'limited_time'
  title: string
  message: string
  urgency: 'low' | 'medium' | 'high'
  expiresAt?: number
  actionUrl?: string
  metadata?: Record<string, any>
}

export class FOMOEngine {
  private investmentService = getInvestmentService()
  private exclusiveService = getExclusiveService()
  private activeEvents: FOMOEvent[] = []

  /**
   * Generate FOMO events for user
   */
  async generateFOMOEvents(userId: string): Promise<FOMOEvent[]> {
    const events: FOMOEvent[] = []

    // Investment opportunities
    const investmentFOMO = await this.generateInvestmentFOMO(userId)
    events.push(...investmentFOMO)

    // Exclusive content
    const exclusiveFOMO = await this.generateExclusiveFOMO(userId)
    events.push(...exclusiveFOMO)

    // Trending investments
    const trendingFOMO = await this.generateTrendingFOMO()
    events.push(...trendingFOMO)

    // Limited time bonuses
    const limitedTimeFOMO = this.generateLimitedTimeFOMO()
    events.push(...limitedTimeFOMO)

    this.activeEvents = events
    return events
  }

  /**
   * Generate investment FOMO
   */
  private async generateInvestmentFOMO(userId: string): Promise<FOMOEvent[]> {
    const events: FOMOEvent[] = []

    // Get investment opportunities
    const opportunities = await this.investmentService.getInvestmentOpportunities(5)

    opportunities.forEach(opp => {
      if (opp.investorCount > 0 && opp.investorCount < 10) {
        events.push({
          type: 'investment',
          title: 'Investment Opportunity',
          message: `${opp.investorCount} people already invested in this post`,
          urgency: opp.investorCount < 5 ? 'high' : 'medium',
          actionUrl: `/post/${opp.postId}`,
          metadata: { postId: opp.postId, investorCount: opp.investorCount }
        })
      }
    })

    return events
  }

  /**
   * Generate exclusive content FOMO
   */
  private async generateExclusiveFOMO(userId: string): Promise<FOMOEvent[]> {
    const events: FOMOEvent[] = []

    // Check for exclusive content user doesn't have access to
    // This would need to query exclusive content
    // For now, return placeholder

    return events
  }

  /**
   * Generate trending investment FOMO
   */
  private async generateTrendingFOMO(): Promise<FOMOEvent[]> {
    const events: FOMOEvent[] = []

    const leaderboard = await this.investmentService.getLeaderboard('posts', 5)
    
    leaderboard.slice(0, 3).forEach((post, index) => {
      events.push({
        type: 'trending',
        title: 'Trending Investment',
        message: `${post.totalInvested.toLocaleString()} OXY invested - Don't miss out!`,
        urgency: index === 0 ? 'high' : 'medium',
        actionUrl: `/post/${post.postId}`,
        metadata: { postId: post.postId, totalInvested: post.totalInvested }
      })
    })

    return events
  }

  /**
   * Generate limited time bonus FOMO
   */
  private generateLimitedTimeFOMO(): FOMOEvent[] {
    const events: FOMOEvent[] = []

    // Check if it's a special time (e.g., weekend, evening)
    const hour = new Date().getHours()
    const day = new Date().getDay()

    // Weekend bonus
    if (day === 0 || day === 6) {
      const expiresAt = new Date()
      expiresAt.setHours(23, 59, 59, 999)
      if (day === 0) expiresAt.setDate(expiresAt.getDate() + 1) // Sunday -> Monday

      events.push({
        type: 'limited_time',
        title: 'Weekend Investment Bonus',
        message: '2x returns on all investments this weekend!',
        urgency: 'high',
        expiresAt: expiresAt.getTime(),
        metadata: { bonus: '2x' }
      })
    }

    // Evening bonus
    if (hour >= 18 && hour < 22) {
      const expiresAt = new Date()
      expiresAt.setHours(22, 0, 0, 0)

      events.push({
        type: 'limited_time',
        title: 'Evening Bonus',
        message: '50% extra OXY on investments until 10 PM!',
        urgency: 'medium',
        expiresAt: expiresAt.getTime(),
        metadata: { bonus: '1.5x' }
      })
    }

    return events
  }

  /**
   * Create FOMO notification
   */
  createFOMONotification(event: FOMOEvent): string {
    const urgencyEmoji = {
      low: '💡',
      medium: '⚡',
      high: '🔥'
    }

    return `${urgencyEmoji[event.urgency]} ${event.message}`
  }

  /**
   * Get active FOMO events
   */
  getActiveEvents(): FOMOEvent[] {
    const now = Date.now()
    return this.activeEvents.filter(event => {
      if (event.expiresAt) {
        return event.expiresAt > now
      }
      return true
    })
  }

  /**
   * Get highest urgency event
   */
  getHighestUrgencyEvent(): FOMOEvent | null {
    const active = this.getActiveEvents()
    if (active.length === 0) return null

    const urgencyOrder = { high: 3, medium: 2, low: 1 }
    return active.sort((a, b) => 
      urgencyOrder[b.urgency] - urgencyOrder[a.urgency]
    )[0]
  }
}

// Singleton instance
let fomoEngineInstance: FOMOEngine | null = null

export function getFOMOEngine(): FOMOEngine {
  if (!fomoEngineInstance) {
    fomoEngineInstance = new FOMOEngine()
  }
  return fomoEngineInstance
}

