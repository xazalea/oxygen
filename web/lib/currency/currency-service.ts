/**
 * Currency Service (OXY)
 * 
 * Manages user currency wallets, transactions, and rewards.
 * Starting balance: 500 OXY for new users.
 */

import { getDBOperations } from '../telegram-db-operations'
import { CurrencyWalletRecord, CurrencyTransactionRecord, CurrencyRewardRecord } from '../telegram-db-schema'

export interface CurrencyEarnedEvent {
  amount: number
  source: CurrencyTransactionRecord['source']
  metadata?: Record<string, any>
}

export class CurrencyService {
  private db = getDBOperations()
  private readonly STARTING_BALANCE = 500
  private readonly DAILY_LOGIN_REWARD = 50
  private readonly STREAK_BONUS = 10 // Additional OXY per day of streak

  /**
   * Initialize wallet for new user
   */
  async initializeWallet(userId: string): Promise<CurrencyWalletRecord> {
    // Check if wallet already exists
    const existing = await this.getWallet(userId)
    if (existing) {
      return existing
    }

    // Create new wallet with starting balance
    const walletData: Omit<CurrencyWalletRecord, 'id'> = {
      userId,
      balance: this.STARTING_BALANCE,
      totalEarned: this.STARTING_BALANCE,
      totalSpent: 0,
      lastUpdated: Date.now(),
      createdAt: Date.now()
    }

    const walletRecord = await this.db.create('currency_wallets', walletData)
    // Update with userId as id for consistency
    if (walletRecord.id !== userId) {
      await this.db.update('currency_wallets', walletRecord.id, { id: userId })
    }
    const wallet: CurrencyWalletRecord = {
      ...walletData,
      id: userId
    }

    // Record initial balance as earned transaction
    await this.recordTransaction({
      userId,
      type: 'earned',
      amount: this.STARTING_BALANCE,
      source: 'achievement', // Starting balance
      metadata: { type: 'initial_balance' }
    })

    return wallet
  }

  /**
   * Get user wallet
   */
  async getWallet(userId: string): Promise<CurrencyWalletRecord | null> {
    const wallets = await this.db.read('currency_wallets', {
      where: { userId },
      limit: 1
    })
    return wallets[0] as CurrencyWalletRecord || null
  }

  /**
   * Get or create wallet
   */
  async getOrCreateWallet(userId: string): Promise<CurrencyWalletRecord> {
    const wallet = await this.getWallet(userId)
    if (wallet) {
      return wallet
    }
    return await this.initializeWallet(userId)
  }

  /**
   * Add currency to wallet
   */
  async addCurrency(
    userId: string,
    amount: number,
    source: CurrencyTransactionRecord['source'],
    metadata?: Record<string, any>
  ): Promise<CurrencyWalletRecord> {
    const wallet = await this.getOrCreateWallet(userId)

    // Update balance
    const updatedWallet: CurrencyWalletRecord = {
      ...wallet,
      balance: wallet.balance + amount,
      totalEarned: wallet.totalEarned + amount,
      lastUpdated: Date.now()
    }

    // Find wallet by id (might be userId or generated id)
    const walletId = wallet.id || wallet.userId
    await this.db.update('currency_wallets', walletId, updatedWallet)

    // Record transaction
    await this.recordTransaction({
      userId,
      type: 'earned',
      amount,
      source,
      metadata
    })

    return updatedWallet
  }

  /**
   * Spend currency from wallet
   */
  async spendCurrency(
    userId: string,
    amount: number,
    source: CurrencyTransactionRecord['source'],
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    const wallet = await this.getOrCreateWallet(userId)

    if (wallet.balance < amount) {
      return {
        success: false,
        newBalance: wallet.balance,
        error: 'Insufficient balance'
      }
    }

    // Update balance
    const updatedWallet: CurrencyWalletRecord = {
      ...wallet,
      balance: wallet.balance - amount,
      totalSpent: wallet.totalSpent + amount,
      lastUpdated: Date.now()
    }

    // Find wallet by id (might be userId or generated id)
    const walletId = wallet.id || wallet.userId
    await this.db.update('currency_wallets', walletId, updatedWallet)

    // Record transaction
    await this.recordTransaction({
      userId,
      type: 'spent',
      amount,
      source,
      metadata
    })

    return {
      success: true,
      newBalance: updatedWallet.balance
    }
  }

  /**
   * Record transaction
   */
  async recordTransaction(transaction: Omit<CurrencyTransactionRecord, 'id' | 'timestamp' | 'createdAt'>): Promise<CurrencyTransactionRecord> {
    const recordData: Omit<CurrencyTransactionRecord, 'id'> = {
      ...transaction,
      timestamp: Date.now(),
      createdAt: Date.now()
    }

    const recordCreated = await this.db.create('currency_transactions', recordData)
    const record: CurrencyTransactionRecord = {
      ...recordData,
      id: recordCreated.id
    }
    return record
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    userId: string,
    options: {
      limit?: number
      offset?: number
      type?: CurrencyTransactionRecord['type']
      source?: CurrencyTransactionRecord['source']
    } = {}
  ): Promise<CurrencyTransactionRecord[]> {
    const { limit = 50, offset = 0, type, source } = options

    let where: Record<string, any> = { userId }
    if (type) where.type = type
    if (source) where.source = source

    const transactions = await this.db.read('currency_transactions', {
      where,
      limit,
      offset,
      orderBy: 'timestamp',
      orderDirection: 'desc'
    })

    return transactions as CurrencyTransactionRecord[]
  }

  /**
   * Daily login reward
   */
  async claimDailyLoginReward(userId: string): Promise<{ claimed: boolean; amount: number; streak?: number }> {
    // Check if already claimed today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStart = today.getTime()

    const recentRewards = await this.db.read('currency_rewards', {
      where: {
        userId,
        type: 'daily_login',
        claimed: true
      },
      limit: 1,
      orderBy: 'claimedAt',
      orderDirection: 'desc'
    })

    if (recentRewards.length > 0) {
      const lastReward = recentRewards[0] as CurrencyRewardRecord
      if (lastReward.claimedAt && lastReward.claimedAt >= todayStart) {
        return { claimed: false, amount: 0 }
      }
    }

    // Calculate streak
    const streak = await this.calculateStreak(userId)
    const rewardAmount = this.DAILY_LOGIN_REWARD + (streak * this.STREAK_BONUS)

    // Add currency
    await this.addCurrency(userId, rewardAmount, 'daily_reward', {
      streak,
      date: todayStart
    })

    // Create reward record
    const rewardData: Omit<CurrencyRewardRecord, 'id'> = {
      userId,
      type: 'daily_login',
      amount: rewardAmount,
      claimed: true,
      claimedAt: Date.now(),
      metadata: { streak },
      createdAt: Date.now()
    }

    const rewardCreated = await this.db.create('currency_rewards', rewardData)
    const reward: CurrencyRewardRecord = {
      ...rewardData,
      id: rewardCreated.id
    }

    return { claimed: true, amount: rewardAmount, streak }
  }

  /**
   * Calculate login streak
   */
  private async calculateStreak(userId: string): Promise<number> {
    const rewards = await this.db.read('currency_rewards', {
      where: {
        userId,
        type: 'daily_login',
        claimed: true
      },
      limit: 30, // Check last 30 days
      orderBy: 'claimedAt',
      orderDirection: 'desc'
    })

    if (rewards.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < rewards.length; i++) {
      const reward = rewards[i] as CurrencyRewardRecord
      if (!reward.claimedAt) continue

      const rewardDate = new Date(reward.claimedAt)
      rewardDate.setHours(0, 0, 0, 0)

      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - i)

      if (rewardDate.getTime() === expectedDate.getTime()) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  /**
   * Award achievement reward
   */
  async awardAchievement(
    userId: string,
    achievementId: string,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.addCurrency(userId, amount, 'achievement', {
      achievementId,
      ...metadata
    })

    const rewardData: Omit<CurrencyRewardRecord, 'id'> = {
      userId,
      type: 'achievement',
      amount,
      claimed: true,
      claimedAt: Date.now(),
      metadata: { achievementId, ...metadata },
      createdAt: Date.now()
    }

    await this.db.create('currency_rewards', rewardData)
  }

  /**
   * Award referral bonus
   */
  async awardReferral(userId: string, referredUserId: string, amount: number = 100): Promise<void> {
    await this.addCurrency(userId, amount, 'referral', {
      referredUserId
    })
  }

  /**
   * Get total currency statistics
   */
  async getCurrencyStats(userId: string): Promise<{
    balance: number
    totalEarned: number
    totalSpent: number
    transactionsCount: number
    streak: number
  }> {
    const wallet = await this.getOrCreateWallet(userId)
    const transactions = await this.getTransactionHistory(userId, { limit: 1000 })
    const streak = await this.calculateStreak(userId)

    return {
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      totalSpent: wallet.totalSpent,
      transactionsCount: transactions.length,
      streak
    }
  }
}

// Singleton instance
let currencyServiceInstance: CurrencyService | null = null

export function getCurrencyService(): CurrencyService {
  if (!currencyServiceInstance) {
    currencyServiceInstance = new CurrencyService()
  }
  return currencyServiceInstance
}

