/**
 * Personalization Database
 * 
 * Stores user behavior patterns, preferences, and adaptation history.
 * Integrates with Telegram database for persistence.
 */

import { TelegramDatabase } from '../telegram-db'
import { TelegramStorage } from '../telegram-storage'
import { ComprehensiveAdaptation } from './comprehensive-adapter'
import { BehaviorData } from './behavior-tracker'

export interface PersonalizationRecord {
  userId: string
  behaviorPatterns: BehaviorData
  adaptationHistory: ComprehensiveAdaptation[]
  preferences: {
    ui: Record<string, any>
    content: Record<string, any>
    features: Record<string, any>
  }
  addictionMetrics: {
    engagementScore: number
    sessionLength: number
    dailyUsage: number
    streak: number
  }
  lastUpdated: number
}

class PersonalizationDatabase {
  private db: any = null
  private initialized = false

  /**
   * Initialize the personalization database
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      const storage = new TelegramStorage()
      await storage.init()
      this.db = new TelegramDatabase(storage)
      await this.db.init()
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize personalization database:', error)
      throw error
    }
  }

  /**
   * Save user personalization data
   */
  async savePersonalization(userId: string, data: Partial<PersonalizationRecord>): Promise<void> {
    if (!this.initialized) {
      await this.init()
    }

    const existing = await this.getPersonalization(userId)
    const record: PersonalizationRecord = {
      userId,
      behaviorPatterns: data.behaviorPatterns || existing?.behaviorPatterns || {} as BehaviorData,
      adaptationHistory: data.adaptationHistory || existing?.adaptationHistory || [],
      preferences: data.preferences || existing?.preferences || {
        ui: {},
        content: {},
        features: {}
      },
      addictionMetrics: data.addictionMetrics || existing?.addictionMetrics || {
        engagementScore: 0,
        sessionLength: 0,
        dailyUsage: 0,
        streak: 0
      },
      lastUpdated: Date.now()
    }

    await this.db.create('personalization', record)
  }

  /**
   * Get user personalization data
   */
  async getPersonalization(userId: string): Promise<PersonalizationRecord | null> {
    if (!this.initialized) {
      await this.init()
    }

    try {
      const records = await this.db.query('personalization', { userId })
      return records.length > 0 ? records[0] : null
    } catch (error) {
      console.error('Failed to get personalization:', error)
      return null
    }
  }

  /**
   * Update behavior patterns
   */
  async updateBehaviorPatterns(userId: string, patterns: BehaviorData): Promise<void> {
    const existing = await this.getPersonalization(userId)
    await this.savePersonalization(userId, {
      behaviorPatterns: patterns,
      adaptationHistory: existing?.adaptationHistory || []
    })
  }

  /**
   * Add adaptation to history
   */
  async addAdaptation(userId: string, adaptation: ComprehensiveAdaptation): Promise<void> {
    const existing = await this.getPersonalization(userId)
    const history = existing?.adaptationHistory || []
    history.push(adaptation)

    // Keep only last 100 adaptations
    if (history.length > 100) {
      history.shift()
    }

    await this.savePersonalization(userId, {
      adaptationHistory: history
    })
  }

  /**
   * Update preferences
   */
  async updatePreferences(
    userId: string,
    category: 'ui' | 'content' | 'features',
    preferences: Record<string, any>
  ): Promise<void> {
    const existing = await this.getPersonalization(userId)
    const currentPreferences = existing?.preferences || {
      ui: {},
      content: {},
      features: {}
    }

    currentPreferences[category] = {
      ...currentPreferences[category],
      ...preferences
    }

    await this.savePersonalization(userId, {
      preferences: currentPreferences
    })
  }

  /**
   * Update addiction metrics
   */
  async updateAddictionMetrics(
    userId: string,
    metrics: Partial<PersonalizationRecord['addictionMetrics']>
  ): Promise<void> {
    const existing = await this.getPersonalization(userId)
    const currentMetrics = existing?.addictionMetrics || {
      engagementScore: 0,
      sessionLength: 0,
      dailyUsage: 0,
      streak: 0
    }

    await this.savePersonalization(userId, {
      addictionMetrics: {
        ...currentMetrics,
        ...metrics
      }
    })
  }

  /**
   * Get adaptation history
   */
  async getAdaptationHistory(userId: string, limit: number = 10): Promise<ComprehensiveAdaptation[]> {
    const personalization = await this.getPersonalization(userId)
    if (!personalization) {
      return []
    }

    return personalization.adaptationHistory.slice(-limit)
  }

  /**
   * Clear personalization data
   */
  async clearPersonalization(userId: string): Promise<void> {
    if (!this.initialized) {
      await this.init()
    }

    try {
      await this.db.delete('personalization', { userId })
    } catch (error) {
      console.error('Failed to clear personalization:', error)
    }
  }
}

// Singleton instance
let dbInstance: PersonalizationDatabase | null = null

export function getPersonalizationDatabase(): PersonalizationDatabase {
  if (!dbInstance) {
    dbInstance = new PersonalizationDatabase()
  }
  return dbInstance
}

export default PersonalizationDatabase

