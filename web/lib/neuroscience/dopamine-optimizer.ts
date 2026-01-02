/**
 * Dopamine Optimization System
 * 
 * Optimizes notification timing, variable reward schedules,
 * social validation triggers, achievement systems, and progress indicators
 * for maximum engagement and dopamine release.
 */

import { getNeuroscienceEngine } from './neuroscience-engine'
import { getBehaviorTracker } from './behavior-tracker'

export interface DopamineTrigger {
  type: string
  timestamp: number
  intensity: number
  source: string
}

export interface RewardSchedule {
  type: 'fixed' | 'variable'
  interval: number
  lastReward: number
  nextReward: number
}

class DopamineOptimizer {
  private engine = getNeuroscienceEngine()
  private tracker = getBehaviorTracker()
  private triggers: DopamineTrigger[] = []
  private optimalWindows: number[] = [9, 12, 15, 18, 21] // Hours of day

  /**
   * Optimize notification timing
   */
  getOptimalNotificationTiming(): {
    shouldNotify: boolean
    delay: number
    intensity: number
  } {
    const behaviorData = this.tracker.getBehaviorData()
    const timing = this.engine.getOptimalNotificationTiming(behaviorData)
    
    // Calculate intensity based on engagement
    const engagementScore = this.engine.getEngagementScore(behaviorData)
    const intensity = Math.min(1.0, engagementScore * 1.2)

    // Check if current time is in optimal window
    const currentHour = new Date().getHours()
    const inOptimalWindow = this.optimalWindows.includes(currentHour)

    return {
      shouldNotify: timing.shouldNotify && inOptimalWindow,
      delay: timing.delay,
      intensity
    }
  }

  /**
   * Trigger variable reward
   */
  triggerVariableReward(type: string): boolean {
    const shouldTrigger = this.engine.shouldTriggerReward(type)
    
    if (shouldTrigger) {
      this.recordDopamineTrigger(type, 0.7, 'variable_reward')
    }

    return shouldTrigger
  }

  /**
   * Trigger social validation
   */
  triggerSocialValidation(type: 'like' | 'share' | 'comment' | 'follow'): void {
    this.engine.triggerSocialValidation(type)
    this.recordDopamineTrigger(`social_${type}`, 0.8, 'social_validation')
  }

  /**
   * Record dopamine trigger
   */
  recordDopamineTrigger(type: string, intensity: number, source: string): void {
    this.triggers.push({
      type,
      timestamp: Date.now(),
      intensity,
      source
    })

    // Keep only recent triggers (last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    this.triggers = this.triggers.filter(t => t.timestamp > oneHourAgo)
  }

  /**
   * Get achievement system reward
   */
  getAchievementReward(achievement: string, progress: number): {
    shouldReward: boolean
    intensity: number
    message: string
  } {
    // Reward at milestones (25%, 50%, 75%, 100%)
    const milestones = [0.25, 0.5, 0.75, 1.0]
    const milestone = milestones.find(m => progress >= m && progress < m + 0.1)

    if (milestone) {
      const intensity = milestone * 0.8
      const messages: Record<number, string> = {
        0.25: 'Great start!',
        0.5: 'Halfway there!',
        0.75: 'Almost there!',
        1.0: 'Achievement unlocked!'
      }

      return {
        shouldReward: true,
        intensity,
        message: messages[milestone] || 'Progress!'
      }
    }

    return {
      shouldReward: false,
      intensity: 0,
      message: ''
    }
  }

  /**
   * Get progress indicator update
   */
  getProgressUpdate(current: number, target: number): {
    progress: number
    shouldShow: boolean
    intensity: number
  } {
    const progress = current / target
    const shouldShow = progress > 0 && progress < 1
    const intensity = Math.min(1.0, progress * 1.2)

    return {
      progress,
      shouldShow,
      intensity
    }
  }

  /**
   * Optimize reward schedule
   */
  optimizeRewardSchedule(type: string, baseInterval: number): RewardSchedule {
    // Variable interval for slot machine effect
    const minInterval = baseInterval * 0.5
    const maxInterval = baseInterval * 1.5
    const interval = minInterval + Math.random() * (maxInterval - minInterval)

    return {
      type: 'variable',
      interval,
      lastReward: 0,
      nextReward: Date.now() + interval
    }
  }

  /**
   * Get dopamine trigger history
   */
  getTriggerHistory(minutes: number = 60): DopamineTrigger[] {
    const cutoff = Date.now() - (minutes * 60 * 1000)
    return this.triggers.filter(t => t.timestamp > cutoff)
  }

  /**
   * Get average dopamine intensity
   */
  getAverageIntensity(minutes: number = 60): number {
    const recent = this.getTriggerHistory(minutes)
    if (recent.length === 0) {
      return 0
    }

    return recent.reduce((sum, t) => sum + t.intensity, 0) / recent.length
  }
}

// Singleton instance
let optimizerInstance: DopamineOptimizer | null = null

export function getDopamineOptimizer(): DopamineOptimizer {
  if (!optimizerInstance) {
    optimizerInstance = new DopamineOptimizer()
  }
  return optimizerInstance
}

export default DopamineOptimizer

