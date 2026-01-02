/**
 * Investment Service
 * 
 * Manages user investments in posts with proportional returns for early investors.
 */

import { getDBOperations } from '../telegram-db-operations'
import { getCurrencyService } from '../currency/currency-service'
import { getValuationCalculator, ValuationCalculator } from './valuation-calculator'
import { InvestmentRecord, InvestmentPoolRecord, InvestmentReturnRecord } from '../telegram-db-schema'

export interface InvestmentStats {
  totalInvested: number
  totalReturns: number
  activeInvestments: number
  averageROI: number
  bestInvestment?: {
    postId: string
    roi: number
    returnAmount: number
  }
}

export interface InvestmentOpportunity {
  postId: string
  currentValuation: number
  investorCount: number
  potentialReturn: number
  riskLevel: 'low' | 'medium' | 'high'
}

export class InvestmentService {
  private db = getDBOperations()
  private currencyService = getCurrencyService()
  private valuationCalculator = getValuationCalculator()

  /**
   * Invest OXY in a post
   */
  async investInPost(
    userId: string,
    postId: string,
    amount: number
  ): Promise<{ success: boolean; investmentId?: string; error?: string }> {
    // Check if user has enough balance
    const wallet = await this.currencyService.getOrCreateWallet(userId)
    if (wallet.balance < amount) {
      return {
        success: false,
        error: 'Insufficient balance'
      }
    }

    // Get or create investment pool
    const pool = await this.getOrCreatePool(postId)

    // Spend currency
    const spendResult = await this.currencyService.spendCurrency(
      userId,
      amount,
      'investment',
      { postId }
    )

    if (!spendResult.success) {
      return {
        success: false,
        error: spendResult.error || 'Failed to spend currency'
      }
    }

    // Create investment record
    const investmentData: Omit<InvestmentRecord, 'id'> = {
      userId,
      postId,
      amount,
      timestamp: Date.now(),
      initialValuation: pool.currentValuation,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    const investmentRecord = await this.db.create('investments', investmentData)
    const investment: InvestmentRecord = {
      ...investmentData,
      id: investmentRecord.id
    }

    // Update investment pool
    await this.updatePool(postId, {
      totalInvested: pool.totalInvested + amount,
      investorCount: pool.investorCount + 1
    })

    return {
      success: true,
      investmentId: investment.id
    }
  }

  /**
   * Get or create investment pool for a post
   */
  async getOrCreatePool(postId: string): Promise<InvestmentPoolRecord> {
    try {
      // Try to find by postId (using postId as the id)
      const pool = await this.db.findById('investment_pools', postId)
      if (pool) {
        return pool as InvestmentPoolRecord
      }

      // Try to find by postId field
      const pools = await this.db.read('investment_pools', {
        where: { postId },
        limit: 1
      })

      if (pools.length > 0) {
        return pools[0] as InvestmentPoolRecord
      }
    } catch (error) {
      // Table might not exist yet, create it
      console.log('Pool not found, creating new one')
    }

    // Create new pool
    const poolData: Omit<InvestmentPoolRecord, 'id'> = {
      postId,
      totalInvested: 0,
      investorCount: 0,
      currentValuation: 0,
      initialValuation: 0,
      performanceMetrics: {
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        engagementRate: 0
      },
      creatorReputation: 0.5, // Default reputation
      timeDecayFactor: 1,
      lastUpdated: Date.now(),
      createdAt: Date.now()
    }

    try {
      // Use postId as the id for easy lookup
      const poolRecord = await this.db.create('investment_pools', poolData)
      // Update with postId as id for consistency
      if (poolRecord.id !== postId) {
        await this.db.update('investment_pools', poolRecord.id, { id: postId })
        return { ...poolData, id: postId } as InvestmentPoolRecord
      }
      return { ...poolData, id: poolRecord.id } as InvestmentPoolRecord
    } catch (error) {
      console.error('Error creating pool:', error)
      return { ...poolData, id: postId } as InvestmentPoolRecord
    }
  }

  /**
   * Update investment pool
   */
  async updatePool(
    postId: string,
    updates: Partial<InvestmentPoolRecord>
  ): Promise<InvestmentPoolRecord> {
    const pool = await this.getOrCreatePool(postId)
    
    // Get post performance metrics (would come from video stats)
    // For now, we'll update what we can
    const updatedPool: InvestmentPoolRecord = {
      ...pool,
      ...updates,
      lastUpdated: Date.now()
    }

    // Recalculate valuation
    const valuation = this.valuationCalculator.calculateValuation({
      totalInvested: updatedPool.totalInvested,
      views: updatedPool.performanceMetrics.views,
      likes: updatedPool.performanceMetrics.likes,
      shares: updatedPool.performanceMetrics.shares,
      comments: updatedPool.performanceMetrics.comments,
      postAgeHours: (Date.now() - pool.createdAt) / (1000 * 60 * 60),
      creatorReputation: updatedPool.creatorReputation
    })

    updatedPool.currentValuation = valuation.currentValuation
    updatedPool.timeDecayFactor = valuation.timeDecayFactor

    if (pool.initialValuation === 0 && updatedPool.totalInvested > 0) {
      updatedPool.initialValuation = valuation.currentValuation
    }

    // Find the pool by postId (might be stored with postId as id or in postId field)
    const existingPool = await this.db.findById('investment_pools', postId) || 
                         (await this.db.read('investment_pools', { where: { postId }, limit: 1 }))[0]
    if (existingPool) {
      await this.db.update('investment_pools', existingPool.id, updatedPool)
    } else {
      // Create if doesn't exist
      await this.db.create('investment_pools', updatedPool)
    }
    return updatedPool
  }

  /**
   * Update pool with post performance metrics
   */
  async updatePoolMetrics(
    postId: string,
    metrics: Partial<InvestmentPoolRecord['performanceMetrics']>
  ): Promise<void> {
    const pool = await this.getOrCreatePool(postId)
    
    await this.updatePool(postId, {
      performanceMetrics: {
        ...pool.performanceMetrics,
        ...metrics
      }
    })
  }

  /**
   * Calculate and process returns for an investment
   */
  async processReturns(investmentId: string): Promise<InvestmentReturnRecord | null> {
    const investments = await this.db.read('investments', {
      where: { id: investmentId },
      limit: 1
    })

    if (investments.length === 0) {
      return null
    }

    const investment = investments[0] as InvestmentRecord
    if (investment.status !== 'active') {
      return null
    }

    const pool = await this.getOrCreatePool(investment.postId)
    const postAge = Date.now() - pool.createdAt
    const investmentTime = investment.timestamp - pool.createdAt

    // Calculate return
    const returnAmount = this.valuationCalculator.calculateReturn(
      investment.amount,
      investment.initialValuation || pool.initialValuation,
      pool.currentValuation,
      investmentTime,
      postAge
    )

    const roi = this.valuationCalculator.calculateROI(investment.amount, returnAmount)

    // Update investment
    const updatedInvestment: InvestmentRecord = {
      ...investment,
      returnAmount,
      returnTimestamp: Date.now(),
      status: 'returned',
      roi,
      updatedAt: Date.now()
    }

    await this.db.update('investments', investmentId, updatedInvestment)

    // Add currency to user wallet
    await this.currencyService.addCurrency(
      investment.userId,
      returnAmount,
      'investment',
      {
        investmentId,
        postId: investment.postId,
        originalAmount: investment.amount,
        roi
      }
    )

    // Create return record
    const returnData: Omit<InvestmentReturnRecord, 'id'> = {
      investmentId,
      userId: investment.userId,
      postId: investment.postId,
      originalAmount: investment.amount,
      returnAmount,
      roi,
      earlyBonus: this.valuationCalculator.calculateEarlyBonus(investmentTime, postAge),
      valuationMultiplier: pool.currentValuation / (investment.initialValuation || pool.initialValuation),
      processedAt: Date.now(),
      createdAt: Date.now()
    }

    const returnRecordCreated = await this.db.create('investment_returns', returnData)
    const returnRecord: InvestmentReturnRecord = {
      ...returnData,
      id: returnRecordCreated.id
    }

    return returnRecord
  }

  /**
   * Get user's investment portfolio
   */
  async getPortfolio(userId: string): Promise<{
    active: InvestmentRecord[]
    completed: InvestmentRecord[]
    stats: InvestmentStats
  }> {
    const investments = await this.db.read('investments', {
      where: { userId },
      orderBy: 'timestamp',
      orderDirection: 'desc'
    }) as InvestmentRecord[]

    const active = investments.filter(inv => inv.status === 'active')
    const completed = investments.filter(inv => inv.status === 'returned')

    // Calculate stats
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0)
    const totalReturns = completed.reduce((sum, inv) => sum + (inv.returnAmount || 0), 0)
    const averageROI = completed.length > 0
      ? completed.reduce((sum, inv) => sum + (inv.roi || 0), 0) / completed.length
      : 0

    const bestInvestment = completed.length > 0
      ? completed.reduce((best, inv) => {
          const invROI = inv.roi || 0
          const bestROI = best.roi || 0
          return invROI > bestROI ? inv : best
        })
      : undefined

    const stats: InvestmentStats = {
      totalInvested,
      totalReturns,
      activeInvestments: active.length,
      averageROI,
      bestInvestment: bestInvestment ? {
        postId: bestInvestment.postId,
        roi: bestInvestment.roi || 0,
        returnAmount: bestInvestment.returnAmount || 0
      } : undefined
    }

    return {
      active,
      completed,
      stats
    }
  }

  /**
   * Get investment opportunities (posts with high potential)
   */
  async getInvestmentOpportunities(limit: number = 10): Promise<InvestmentOpportunity[]> {
    const pools = await this.db.read('investment_pools', {
      orderBy: 'currentValuation',
      orderDirection: 'desc',
      limit: limit * 2 // Get more to filter
    }) as InvestmentPoolRecord[]

    // Filter and calculate opportunities
    const opportunities: InvestmentOpportunity[] = pools
      .filter(pool => pool.totalInvested > 0)
      .map(pool => {
        // Calculate potential return (simplified)
        const potentialReturn = pool.currentValuation / pool.totalInvested
        
        // Risk level based on investor count and engagement
        let riskLevel: 'low' | 'medium' | 'high' = 'medium'
        if (pool.investorCount > 10 && pool.performanceMetrics.engagementRate > 0.1) {
          riskLevel = 'low'
        } else if (pool.investorCount < 3) {
          riskLevel = 'high'
        }

        return {
          postId: pool.postId,
          currentValuation: pool.currentValuation,
          investorCount: pool.investorCount,
          potentialReturn,
          riskLevel
        }
      })
      .sort((a, b) => b.potentialReturn - a.potentialReturn)
      .slice(0, limit)

    return opportunities
  }

  /**
   * Get investment leaderboard
   */
  async getLeaderboard(type: 'investors' | 'posts' = 'investors', limit: number = 10): Promise<any[]> {
    if (type === 'investors') {
      // Get top investors by total returns
      const returns = await this.db.read('investment_returns', {
        orderBy: 'returnAmount',
        orderDirection: 'desc',
        limit: limit * 5 // Get more to aggregate
      }) as InvestmentReturnRecord[]

      // Aggregate by user
      const userStats = new Map<string, { totalReturns: number; count: number }>()
      returns.forEach(ret => {
        const existing = userStats.get(ret.userId) || { totalReturns: 0, count: 0 }
        userStats.set(ret.userId, {
          totalReturns: existing.totalReturns + ret.returnAmount,
          count: existing.count + 1
        })
      })

      return Array.from(userStats.entries())
        .map(([userId, stats]) => ({
          userId,
          totalReturns: stats.totalReturns,
          investmentCount: stats.count
        }))
        .sort((a, b) => b.totalReturns - a.totalReturns)
        .slice(0, limit)
    } else {
      // Get top posts by total invested
      const pools = await this.db.read('investment_pools', {
        orderBy: 'totalInvested',
        orderDirection: 'desc',
        limit
      }) as InvestmentPoolRecord[]

      return pools.map(pool => ({
        postId: pool.postId,
        totalInvested: pool.totalInvested,
        investorCount: pool.investorCount,
        currentValuation: pool.currentValuation
      }))
    }
  }
}

// Singleton instance
let investmentServiceInstance: InvestmentService | null = null

export function getInvestmentService(): InvestmentService {
  if (!investmentServiceInstance) {
    investmentServiceInstance = new InvestmentService()
  }
  return investmentServiceInstance
}

