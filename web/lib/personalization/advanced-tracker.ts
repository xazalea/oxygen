/**
 * Advanced Behavior Tracker
 * 
 * Enhanced tracking with micro-interactions, attention metrics, and emotional indicators.
 * Extends the base behavior tracker with deeper insights.
 */

import { BehaviorData } from '../neuroscience/behavior-tracker'

export interface MicroInteraction {
  type: 'click' | 'scroll' | 'pause' | 'hover' | 'focus' | 'blur'
  timestamp: number
  position?: { x: number; y: number }
  target?: string
  duration?: number
  intensity?: number
}

export interface AttentionHeatmap {
  element: string
  dwellTime: number
  interactions: number
  focusScore: number // 0-1
}

export interface EmotionalIndicator {
  emotion: 'joy' | 'excitement' | 'curiosity' | 'boredom' | 'stress' | 'relaxation'
  intensity: number // 0-1
  timestamp: number
  trigger: string // What caused this emotion
}

export interface AdvancedBehaviorData extends BehaviorData {
  microInteractions: MicroInteraction[]
  attentionHeatmap: AttentionHeatmap[]
  emotionalIndicators: EmotionalIndicator[]
  scrollPattern: {
    velocity: number[]
    acceleration: number[]
    pauses: Array<{ timestamp: number; duration: number }>
  }
  interactionIntensity: number // 0-1: Average intensity of interactions
  engagementDepth: number // 0-1: How deep they go into content
}

export class AdvancedTracker {
  private microInteractions: MicroInteraction[] = []
  private attentionData: Map<string, { startTime: number; totalTime: number; interactions: number }> = new Map()
  private emotionalIndicators: EmotionalIndicator[] = []
  private scrollHistory: Array<{ timestamp: number; position: number }> = []
  private sessionStart: number = Date.now()

  /**
   * Track micro-interaction
   */
  trackMicroInteraction(interaction: Omit<MicroInteraction, 'timestamp'>): void {
    this.microInteractions.push({
      ...interaction,
      timestamp: Date.now()
    })

    // Keep only last 1000 interactions
    if (this.microInteractions.length > 1000) {
      this.microInteractions.shift()
    }
  }

  /**
   * Track attention on an element
   */
  trackAttention(element: string, isFocused: boolean): void {
    const now = Date.now()
    const existing = this.attentionData.get(element)

    if (isFocused) {
      if (!existing) {
        this.attentionData.set(element, {
          startTime: now,
          totalTime: 0,
          interactions: 0
        })
      }
    } else {
      if (existing) {
        const dwellTime = now - existing.startTime
        existing.totalTime += dwellTime
        existing.startTime = 0
      }
    }
  }

  /**
   * Track scroll pattern
   */
  trackScroll(position: number): void {
    this.scrollHistory.push({
      timestamp: Date.now(),
      position
    })

    // Keep only last 500 scroll events
    if (this.scrollHistory.length > 500) {
      this.scrollHistory.shift()
    }
  }

  /**
   * Detect emotional indicator
   */
  detectEmotion(
    emotion: EmotionalIndicator['emotion'],
    intensity: number,
    trigger: string
  ): void {
    this.emotionalIndicators.push({
      emotion,
      intensity,
      timestamp: Date.now(),
      trigger
    })

    // Keep only last 100 emotional indicators
    if (this.emotionalIndicators.length > 100) {
      this.emotionalIndicators.shift()
    }
  }

  /**
   * Calculate scroll velocity and acceleration
   */
  calculateScrollPattern(): {
    velocity: number[]
    acceleration: number[]
    pauses: Array<{ timestamp: number; duration: number }>
  } {
    if (this.scrollHistory.length < 2) {
      return { velocity: [], acceleration: [], pauses: [] }
    }

    const velocities: number[] = []
    const accelerations: number[] = []
    const pauses: Array<{ timestamp: number; duration: number }> = []

    for (let i = 1; i < this.scrollHistory.length; i++) {
      const prev = this.scrollHistory[i - 1]
      const curr = this.scrollHistory[i]

      const timeDiff = (curr.timestamp - prev.timestamp) / 1000 // seconds
      const positionDiff = Math.abs(curr.position - prev.position)

      if (timeDiff > 0) {
        const velocity = positionDiff / timeDiff
        velocities.push(velocity)

        // Detect pauses (velocity < threshold)
        if (velocity < 10 && timeDiff > 0.5) {
          pauses.push({
            timestamp: curr.timestamp,
            duration: timeDiff
          })
        }
      }

      // Calculate acceleration
      if (i > 1 && velocities.length >= 2) {
        const prevVelocity = velocities[velocities.length - 2]
        const currVelocity = velocities[velocities.length - 1]
        const acceleration = (currVelocity - prevVelocity) / timeDiff
        accelerations.push(acceleration)
      }
    }

    return { velocity: velocities, acceleration: accelerations, pauses }
  }

  /**
   * Generate attention heatmap
   */
  generateAttentionHeatmap(): AttentionHeatmap[] {
    const heatmap: AttentionHeatmap[] = []

    this.attentionData.forEach((data, element) => {
      const sessionDuration = (Date.now() - this.sessionStart) / 1000 // seconds
      const focusScore = Math.min(1, data.totalTime / (sessionDuration * 1000))

      heatmap.push({
        element,
        dwellTime: data.totalTime,
        interactions: data.interactions,
        focusScore
      })
    })

    // Sort by focus score
    return heatmap.sort((a, b) => b.focusScore - a.focusScore)
  }

  /**
   * Calculate interaction intensity
   */
  calculateInteractionIntensity(): number {
    if (this.microInteractions.length === 0) return 0

    // Average intensity of interactions
    const intensities = this.microInteractions
      .filter(i => i.intensity !== undefined)
      .map(i => i.intensity || 0)

    if (intensities.length === 0) return 0.5 // Default

    return intensities.reduce((sum, i) => sum + i, 0) / intensities.length
  }

  /**
   * Calculate engagement depth
   */
  calculateEngagementDepth(): number {
    // Based on interaction types and frequency
    const clickCount = this.microInteractions.filter(i => i.type === 'click').length
    const pauseCount = this.microInteractions.filter(i => i.type === 'pause').length
    const hoverCount = this.microInteractions.filter(i => i.type === 'hover').length

    const totalInteractions = this.microInteractions.length
    if (totalInteractions === 0) return 0

    // Weighted engagement score
    const engagementScore = (
      clickCount * 2 +
      pauseCount * 1.5 +
      hoverCount * 1
    ) / totalInteractions

    return Math.min(1, engagementScore / 5) // Normalize to 0-1
  }

  /**
   * Get advanced behavior data
   */
  getAdvancedBehaviorData(baseData: BehaviorData): AdvancedBehaviorData {
    const scrollPattern = this.calculateScrollPattern()
    const attentionHeatmap = this.generateAttentionHeatmap()
    const interactionIntensity = this.calculateInteractionIntensity()
    const engagementDepth = this.calculateEngagementDepth()

    return {
      ...baseData,
      microInteractions: [...this.microInteractions],
      attentionHeatmap,
      emotionalIndicators: [...this.emotionalIndicators],
      scrollPattern,
      interactionIntensity,
      engagementDepth
    }
  }

  /**
   * Reset tracker for new session
   */
  reset(): void {
    this.microInteractions = []
    this.attentionData.clear()
    this.emotionalIndicators = []
    this.scrollHistory = []
    this.sessionStart = Date.now()
  }

  /**
   * Get emotional state
   */
  getCurrentEmotionalState(): {
    dominantEmotion: EmotionalIndicator['emotion'] | null
    intensity: number
  } {
    if (this.emotionalIndicators.length === 0) {
      return { dominantEmotion: null, intensity: 0 }
    }

    // Get most recent emotions (last 10)
    const recent = this.emotionalIndicators.slice(-10)

    // Group by emotion and calculate average intensity
    const emotionScores: Record<string, number> = {}
    recent.forEach(e => {
      emotionScores[e.emotion] = (emotionScores[e.emotion] || 0) + e.intensity
    })

    // Find dominant emotion
    let dominantEmotion: EmotionalIndicator['emotion'] | null = null
    let maxScore = 0

    Object.entries(emotionScores).forEach(([emotion, score]) => {
      if (score > maxScore) {
        maxScore = score
        dominantEmotion = emotion as EmotionalIndicator['emotion']
      }
    })

    return {
      dominantEmotion,
      intensity: maxScore / recent.length
    }
  }
}

// Singleton instance
let advancedTrackerInstance: AdvancedTracker | null = null

export function getAdvancedTracker(): AdvancedTracker {
  if (!advancedTrackerInstance) {
    advancedTrackerInstance = new AdvancedTracker()
  }
  return advancedTrackerInstance
}



