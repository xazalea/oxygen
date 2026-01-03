/**
 * Neuroscience Engine
 * 
 * Implements addiction psychology principles:
 * - Variable reward schedules (slot machine effect)
 * - Social validation triggers
 * - FOMO mechanisms
 * - Infinite scroll optimization
 * - Instant gratification systems
 * - Habit formation loops
 */

import { getBehaviorTracker, BehaviorData } from './behavior-tracker'

export interface RewardSchedule {
  type: 'fixed' | 'variable'
  interval: number
  lastReward: number
  nextReward: number
}

export interface SocialValidation {
  likes: number
  shares: number
  comments: number
  followers: number
  notifications: number
}

export interface HabitLoop {
  cue: string
  routine: string
  reward: string
  strength: number
  lastTriggered: number
}

class NeuroscienceEngine {
  private rewardSchedules: Map<string, RewardSchedule> = new Map()
  private socialValidation: SocialValidation = {
    likes: 0,
    shares: 0,
    comments: 0,
    followers: 0,
    notifications: 0
  }
  private habitLoops: HabitLoop[] = []
  private fomoTriggers: {
    type: string
    timestamp: number
    intensity: number
  }[] = []

  /**
   * Initialize the neuroscience engine
   */
  init(): void {
    // Setup default reward schedules
    this.setupRewardSchedules()
    
    // Setup habit loops
    this.setupHabitLoops()
  }

  /**
   * Setup default reward schedules
   */
  private setupRewardSchedules(): void {
    // Variable reward for notifications (slot machine effect)
    this.rewardSchedules.set('notifications', {
      type: 'variable',
      interval: this.getVariableInterval(5000, 30000), // 5-30 seconds
      lastReward: 0,
      nextReward: Date.now() + this.getVariableInterval(5000, 30000)
    })

    // Variable reward for content discovery
    this.rewardSchedules.set('content', {
      type: 'variable',
      interval: this.getVariableInterval(10000, 60000), // 10-60 seconds
      lastReward: 0,
      nextReward: Date.now() + this.getVariableInterval(10000, 60000)
    })

    // Variable reward for social interactions
    this.rewardSchedules.set('social', {
      type: 'variable',
      interval: this.getVariableInterval(3000, 20000), // 3-20 seconds
      lastReward: 0,
      nextReward: Date.now() + this.getVariableInterval(3000, 20000)
    })
  }

  /**
   * Get variable interval (for slot machine effect)
   */
  private getVariableInterval(min: number, max: number): number {
    return min + Math.random() * (max - min)
  }

  /**
   * Setup default habit loops
   */
  private setupHabitLoops(): void {
    // Cue-Routine-Reward loops based on research
    this.habitLoops = [
      {
        cue: 'open_app',
        routine: 'scroll_feed',
        reward: 'new_content',
        strength: 0.5,
        lastTriggered: 0
      },
      {
        cue: 'notification',
        routine: 'check_app',
        reward: 'social_validation',
        strength: 0.7,
        lastTriggered: 0
      },
      {
        cue: 'boredom',
        routine: 'infinite_scroll',
        reward: 'dopamine_hit',
        strength: 0.6,
        lastTriggered: 0
      }
    ]
  }

  /**
   * Check if reward should be triggered (variable reward schedule)
   */
  shouldTriggerReward(type: string): boolean {
    const schedule = this.rewardSchedules.get(type)
    if (!schedule) {
      return false
    }

    const now = Date.now()
    if (now >= schedule.nextReward) {
      // Trigger reward and schedule next
      schedule.lastReward = now
      schedule.nextReward = now + this.getVariableInterval(
        schedule.interval * 0.5,
        schedule.interval * 1.5
      )
      return true
    }

    return false
  }

  /**
   * Trigger social validation
   */
  triggerSocialValidation(type: 'like' | 'share' | 'comment' | 'follow' | 'notification'): void {
    switch (type) {
      case 'like':
        this.socialValidation.likes++
        break
      case 'share':
        this.socialValidation.shares++
        break
      case 'comment':
        this.socialValidation.comments++
        break
      case 'follow':
        this.socialValidation.followers++
        break
      case 'notification':
        this.socialValidation.notifications++
        break
    }

    // Record dopamine trigger
    const tracker = getBehaviorTracker()
    tracker.recordDopamineTrigger(`social_${type}`, 0.8)
  }

  /**
   * Trigger FOMO (Fear of Missing Out)
   */
  triggerFOMO(type: string, intensity: number = 0.5): void {
    this.fomoTriggers.push({
      type,
      timestamp: Date.now(),
      intensity
    })

    // Keep only recent triggers (last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    this.fomoTriggers = this.fomoTriggers.filter(t => t.timestamp > oneHourAgo)
  }

  /**
   * Optimize infinite scroll
   */
  optimizeInfiniteScroll(behaviorData: BehaviorData): {
    shouldLoadMore: boolean
    loadDelay: number
    contentDensity: number
  } {
    // Analyze scroll patterns
    const recentScrolls = behaviorData.scrollPatterns.slice(-10)
    const avgSpeed = recentScrolls.length > 0
      ? recentScrolls.reduce((sum, p) => sum + p.speed, 0) / recentScrolls.length
      : 0

    // Determine if should load more content
    const shouldLoadMore = avgSpeed > 50 && behaviorData.scrollPatterns.length > 5

    // Calculate load delay based on scroll speed
    const loadDelay = Math.max(100, 1000 - (avgSpeed * 10))

    // Adjust content density based on cognitive load
    const cognitiveLoad = behaviorData.cognitiveLoad
    const contentDensity = Math.max(0.5, 1 - cognitiveLoad * 0.5)

    return {
      shouldLoadMore,
      loadDelay,
      contentDensity
    }
  }

  /**
   * Provide instant gratification
   */
  provideInstantGratification(action: string): {
    feedback: string
    animation: string
    sound?: string
  } {
    const gratifications: Record<string, { feedback: string; animation: string; sound?: string }> = {
      like: {
        feedback: 'Liked!',
        animation: 'heart-burst',
        sound: 'like-sound'
      },
      share: {
        feedback: 'Shared!',
        animation: 'share-pop',
        sound: 'share-sound'
      },
      comment: {
        feedback: 'Commented!',
        animation: 'comment-bubble',
        sound: 'comment-sound'
      },
      follow: {
        feedback: 'Following!',
        animation: 'follow-check',
        sound: 'follow-sound'
      }
    }

    return gratifications[action] || {
      feedback: 'Done!',
      animation: 'default-pop'
    }
  }

  /**
   * Strengthen habit loop
   */
  strengthenHabitLoop(cue: string): void {
    const loop = this.habitLoops.find(l => l.cue === cue)
    if (loop) {
      // Increase strength (capped at 1.0)
      loop.strength = Math.min(1.0, loop.strength + 0.1)
      loop.lastTriggered = Date.now()
    }
  }

  /**
   * Get optimal notification timing
   */
  getOptimalNotificationTiming(behaviorData: BehaviorData): {
    shouldNotify: boolean
    delay: number
  } {
    // Check if user is actively engaged
    const timeSinceLastInteraction = Date.now() - behaviorData.engagementMetrics.lastInteraction
    const isActive = timeSinceLastInteraction < 60000 // 1 minute

    // Check variable reward schedule
    const shouldReward = this.shouldTriggerReward('notifications')

    // Optimal timing: when user is slightly disengaged but still in app
    const shouldNotify = !isActive && timeSinceLastInteraction > 30000 && shouldReward
    const delay = isActive ? 60000 : 0

    return {
      shouldNotify,
      delay
    }
  }

  /**
   * Get engagement score
   */
  getEngagementScore(behaviorData: BehaviorData): number {
    const metrics = behaviorData.engagementMetrics
    const interactions = metrics.interactions
    const watchTime = metrics.watchTime
    const dopamineTriggers = behaviorData.dopamineTriggers.length

    // Normalize and combine factors
    const score = Math.min(
      (Math.min(interactions / 100, 1) * 0.3) +
      (Math.min(watchTime / 3600000, 1) * 0.4) + // 1 hour = max
      (Math.min(dopamineTriggers / 50, 1) * 0.3),
      1
    )

    return score
  }

  /**
   * Get current state
   */
  getState(): {
    rewardSchedules: Map<string, RewardSchedule>
    socialValidation: SocialValidation
    habitLoops: HabitLoop[]
    fomoTriggers: number
  } {
    return {
      rewardSchedules: new Map(this.rewardSchedules),
      socialValidation: { ...this.socialValidation },
      habitLoops: [...this.habitLoops],
      fomoTriggers: this.fomoTriggers.length
    }
  }
}

// Singleton instance
let engineInstance: NeuroscienceEngine | null = null

export function getNeuroscienceEngine(): NeuroscienceEngine {
  if (!engineInstance) {
    engineInstance = new NeuroscienceEngine()
    engineInstance.init()
  }
  return engineInstance
}

export default NeuroscienceEngine


