/**
 * Real-Time Adaptation System
 * 
 * Adapts the platform in real-time during sessions based on current
 * engagement state, mood shifts, and predicted next actions.
 */

import { IndividualityProfile } from './individuality-profiler'
import { AdvancedBehaviorData } from './advanced-tracker'
import { DeepPersonalizationResult } from './deep-personalization'
import { getDeepPersonalizationEngine } from './deep-personalization'

export interface RealtimeAdaptation {
  contentFlow: {
    nextContentType: 'video' | 'text' | 'story' | 'image'
    pacing: 'fast' | 'normal' | 'slow'
    complexity: number
  }
  uiAdjustments: {
    showInvestmentButton: boolean
    showSocialFeatures: boolean
    animationSpeed: number
    informationDensity: number
  }
  engagementOptimization: {
    showPrompt: boolean
    promptType?: 'like' | 'comment' | 'share' | 'invest'
    timing: number
  }
  moodShift: {
    detected: boolean
    from: string
    to: string
    contentAdjustment: string[]
  }
}

export class RealtimeAdapter {
  private personalizationEngine = getDeepPersonalizationEngine()
  private adaptationHistory: RealtimeAdaptation[] = []
  private lastMood: string = 'neutral'
  private engagementTrend: 'increasing' | 'decreasing' | 'stable' = 'stable'

  /**
   * Adapt in real-time based on current session state
   */
  adapt(
    profile: IndividualityProfile,
    behaviorData: AdvancedBehaviorData,
    personalization: DeepPersonalizationResult
  ): RealtimeAdaptation {
    // Detect mood shift
    const moodShift = this.detectMoodShift(behaviorData)

    // Predict next action
    const nextAction = this.predictNextAction(behaviorData, profile)

    // Optimize content flow
    const contentFlow = this.optimizeContentFlow(profile, behaviorData, moodShift)

    // Adjust UI
    const uiAdjustments = this.adjustUI(profile, behaviorData, personalization)

    // Optimize engagement
    const engagementOptimization = this.optimizeEngagement(behaviorData, profile)

    const adaptation: RealtimeAdaptation = {
      contentFlow,
      uiAdjustments,
      engagementOptimization,
      moodShift
    }

    this.adaptationHistory.push(adaptation)
    if (this.adaptationHistory.length > 50) {
      this.adaptationHistory.shift()
    }

    return adaptation
  }

  /**
   * Detect mood shift
   */
  private detectMoodShift(behaviorData: AdvancedBehaviorData): {
    detected: boolean
    from: string
    to: string
    contentAdjustment: string[]
  } {
    if (behaviorData.emotionalIndicators.length < 2) {
      return {
        detected: false,
        from: this.lastMood,
        to: this.lastMood,
        contentAdjustment: []
      }
    }

    const recent = behaviorData.emotionalIndicators.slice(-5)
    const previous = behaviorData.emotionalIndicators.slice(-10, -5)

    const recentDominant = this.getDominantEmotion(recent)
    const previousDominant = this.getDominantEmotion(previous)

    if (recentDominant !== previousDominant && recentDominant !== null) {
      this.lastMood = recentDominant
      return {
        detected: true,
        from: previousDominant || 'neutral',
        to: recentDominant,
        contentAdjustment: this.getContentForMood(recentDominant)
      }
    }

    return {
      detected: false,
      from: this.lastMood,
      to: this.lastMood,
      contentAdjustment: []
    }
  }

  /**
   * Get dominant emotion from indicators
   */
  private getDominantEmotion(indicators: any[]): string | null {
    if (indicators.length === 0) return null

    const emotionCounts: Record<string, number> = {}
    indicators.forEach(i => {
      emotionCounts[i.emotion] = (emotionCounts[i.emotion] || 0) + i.intensity
    })

    let dominant: string | null = null
    let maxScore = 0

    Object.entries(emotionCounts).forEach(([emotion, score]) => {
      if (score > maxScore) {
        maxScore = score
        dominant = emotion
      }
    })

    return dominant
  }

  /**
   * Get content recommendations for mood
   */
  private getContentForMood(mood: string): string[] {
    const moodContent: Record<string, string[]> = {
      joy: ['comedy', 'happy', 'uplifting'],
      excitement: ['action', 'adventure', 'thrilling'],
      curiosity: ['educational', 'mystery', 'documentary'],
      boredom: ['entertaining', 'engaging', 'interactive'],
      stress: ['relaxing', 'calming', 'meditation'],
      relaxation: ['peaceful', 'nature', 'music']
    }

    return moodContent[mood] || []
  }

  /**
   * Predict next action
   */
  private predictNextAction(
    behaviorData: AdvancedBehaviorData,
    profile: IndividualityProfile
  ): 'scroll' | 'pause' | 'interact' | 'skip' {
    // Analyze recent patterns
    const recentInteractions = behaviorData.microInteractions.slice(-10)
    const scrollCount = recentInteractions.filter(i => i.type === 'scroll').length
    const pauseCount = recentInteractions.filter(i => i.type === 'pause').length
    const clickCount = recentInteractions.filter(i => i.type === 'click').length

    // Predict based on patterns
    if (scrollCount > pauseCount && scrollCount > clickCount) {
      return 'scroll'
    } else if (pauseCount > clickCount) {
      return 'pause'
    } else if (clickCount > 0) {
      return 'interact'
    } else {
      return 'skip'
    }
  }

  /**
   * Optimize content flow
   */
  private optimizeContentFlow(
    profile: IndividualityProfile,
    behaviorData: AdvancedBehaviorData,
    moodShift: RealtimeAdaptation['moodShift']
  ): RealtimeAdaptation['contentFlow'] {
    // Determine next content type based on engagement
    let nextContentType: 'video' | 'text' | 'story' | 'image' = 'video'
    
    if (behaviorData.engagementDepth < 0.3) {
      // Low engagement: try different content type
      if (profile.cognitiveStyle.informationDensity > 0.7) {
        nextContentType = 'text'
      } else if (profile.personalityTraits.extraversion > 0.7) {
        nextContentType = 'story'
      }
    }

    // Adjust pacing based on scroll speed
    let pacing: 'fast' | 'normal' | 'slow' = 'normal'
    const avgScrollSpeed = behaviorData.scrollPattern.velocity.length > 0
      ? behaviorData.scrollPattern.velocity.reduce((a, b) => a + b, 0) / behaviorData.scrollPattern.velocity.length
      : 0

    if (avgScrollSpeed > 500) {
      pacing = 'fast'
    } else if (avgScrollSpeed < 100) {
      pacing = 'slow'
    }

    // Adjust complexity based on cognitive load
    const complexity = Math.max(0.3, 1 - behaviorData.cognitiveLoad)

    return {
      nextContentType,
      pacing,
      complexity
    }
  }

  /**
   * Adjust UI in real-time
   */
  private adjustUI(
    profile: IndividualityProfile,
    behaviorData: AdvancedBehaviorData,
    personalization: DeepPersonalizationResult
  ): RealtimeAdaptation['uiAdjustments'] {
    // Show investment button if engagement is high
    const showInvestmentButton = behaviorData.engagementDepth > 0.6

    // Show social features based on extraversion and engagement
    const showSocialFeatures = profile.personalityTraits.extraversion > 0.5 &&
                               behaviorData.engagementDepth > 0.4

    // Adjust animation speed based on processing speed and engagement
    const animationSpeed = profile.cognitiveStyle.processingSpeed * 
                          (1 - behaviorData.cognitiveLoad * 0.3)

    // Adjust information density
    const informationDensity = profile.cognitiveStyle.informationDensity *
                               (1 - behaviorData.cognitiveLoad * 0.2)

    return {
      showInvestmentButton,
      showSocialFeatures,
      animationSpeed,
      informationDensity
    }
  }

  /**
   * Optimize engagement prompts
   */
  private optimizeEngagement(
    behaviorData: AdvancedBehaviorData,
    profile: IndividualityProfile
  ): RealtimeAdaptation['engagementOptimization'] {
    // Detect engagement trend
    const recentEngagement = behaviorData.engagementDepth
    const engagementTrend = this.calculateEngagementTrend(behaviorData)

    // Show prompt if engagement is decreasing
    const showPrompt = engagementTrend === 'decreasing' && recentEngagement < 0.5

    // Determine prompt type based on personality
    let promptType: 'like' | 'comment' | 'share' | 'invest' | undefined
    if (showPrompt) {
      if (profile.personalityTraits.extraversion > 0.7) {
        promptType = 'comment'
      } else if (profile.personalityTraits.agreeableness > 0.6) {
        promptType = 'like'
      } else if (behaviorData.engagementDepth > 0.6) {
        promptType = 'invest'
      } else {
        promptType = 'share'
      }
    }

    // Timing: Show prompt after watching for a bit
    const timing = profile.cognitiveStyle.attentionSpan * 1000

    return {
      showPrompt,
      promptType,
      timing
    }
  }

  /**
   * Calculate engagement trend
   */
  private calculateEngagementTrend(behaviorData: AdvancedBehaviorData): 'increasing' | 'decreasing' | 'stable' {
    // Compare recent engagement to earlier engagement
    // Simplified - would need historical data
    const currentEngagement = behaviorData.engagementDepth

    if (currentEngagement > 0.6) {
      return 'increasing'
    } else if (currentEngagement < 0.3) {
      return 'decreasing'
    } else {
      return 'stable'
    }
  }

  /**
   * Get adaptation history
   */
  getAdaptationHistory(): RealtimeAdaptation[] {
    return [...this.adaptationHistory]
  }

  /**
   * Reset for new session
   */
  reset(): void {
    this.adaptationHistory = []
    this.lastMood = 'neutral'
    this.engagementTrend = 'stable'
  }
}

// Singleton instance
let realtimeAdapterInstance: RealtimeAdapter | null = null

export function getRealtimeAdapter(): RealtimeAdapter {
  if (!realtimeAdapterInstance) {
    realtimeAdapterInstance = new RealtimeAdapter()
  }
  return realtimeAdapterInstance
}

