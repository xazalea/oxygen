/**
 * Individuality Profiler
 * 
 * Analyzes user's personality, preferences, and behavior patterns to create
 * a deep understanding of their individuality for personalization.
 */

import { BehaviorData } from '../neuroscience/behavior-tracker'

export interface PersonalityTraits {
  openness: number // 0-1: Openness to experience
  conscientiousness: number // 0-1: Organization and dependability
  extraversion: number // 0-1: Social energy and assertiveness
  agreeableness: number // 0-1: Trust and cooperation
  neuroticism: number // 0-1: Emotional stability (inverted)
}

export interface ContentPreferences {
  categories: Record<string, number> // Category preference scores
  topics: Record<string, number> // Topic preference scores
  emotions: Record<string, number> // Emotional content preferences
  length: {
    short: number // < 30s
    medium: number // 30s - 2min
    long: number // > 2min
  }
  complexity: number // 0-1: Preference for complex vs simple content
}

export interface InteractionPatterns {
  scrollSpeed: number // Average pixels per second
  pauseFrequency: number // Pauses per minute
  rewatchRate: number // Percentage of videos rewatched
  skipRate: number // Percentage of videos skipped
  engagementDepth: number // 0-1: How deep they engage (likes, comments, shares)
  socialActivity: number // 0-1: Frequency of social interactions
}

export interface TemporalPatterns {
  peakHours: number[] // Hours of day with highest engagement
  sessionLength: number // Average session duration in minutes
  sessionFrequency: number // Sessions per day
  breakPatterns: {
    averageBreakDuration: number // minutes
    breakFrequency: number // breaks per hour
  }
  timeOfDayPreferences: {
    morning: number // 0-1
    afternoon: number // 0-1
    evening: number // 0-1
    night: number // 0-1
  }
}

export interface EmotionalPatterns {
  joyTriggers: string[] // Content types that trigger joy
  excitementTriggers: string[] // Content types that trigger excitement
  curiosityTriggers: string[] // Content types that trigger curiosity
  stressIndicators: string[] // Content types that cause stress
  relaxationIndicators: string[] // Content types that cause relaxation
  emotionalJourney: Array<{
    timestamp: number
    emotion: string
    intensity: number
  }>
}

export interface CognitiveStyle {
  processingSpeed: number // 0-1: Fast vs slow information processing
  attentionSpan: number // Average attention span in seconds
  multitasking: number // 0-1: Tendency to multitask
  decisionMaking: 'impulsive' | 'deliberate' | 'balanced'
  informationDensity: number // 0-1: Preference for dense vs sparse info
}

export interface IndividualityProfile {
  userId: string
  personalityTraits: PersonalityTraits
  contentPreferences: ContentPreferences
  interactionPatterns: InteractionPatterns
  temporalPatterns: TemporalPatterns
  emotionalPatterns: EmotionalPatterns
  cognitiveStyle: CognitiveStyle
  mbtiType?: string // MBTI-inspired type
  lastUpdated: number
  confidence: number // 0-1: How confident we are in this profile
}

export class IndividualityProfiler {
  private profiles: Map<string, IndividualityProfile> = new Map()

  /**
   * Analyze behavior data and create/update individuality profile
   */
  async analyzeUser(
    userId: string,
    behaviorData: BehaviorData,
    contentHistory: Array<{
      contentId: string
      category?: string
      topic?: string
      emotion?: string
      length?: number
      complexity?: number
      timestamp: number
      interactions: {
        liked: boolean
        commented: boolean
        shared: boolean
        watched: boolean
        skipped: boolean
        rewatched: boolean
      }
    }>
  ): Promise<IndividualityProfile> {
    // Analyze personality traits
    const personalityTraits = this.analyzePersonality(behaviorData, contentHistory)

    // Analyze content preferences
    const contentPreferences = this.analyzeContentPreferences(contentHistory)

    // Analyze interaction patterns
    const interactionPatterns = this.analyzeInteractionPatterns(behaviorData, contentHistory)

    // Analyze temporal patterns
    const temporalPatterns = this.analyzeTemporalPatterns(behaviorData)

    // Analyze emotional patterns
    const emotionalPatterns = this.analyzeEmotionalPatterns(contentHistory, behaviorData)

    // Analyze cognitive style
    const cognitiveStyle = this.analyzeCognitiveStyle(behaviorData, contentHistory)

    // Determine MBTI-inspired type
    const mbtiType = this.determineMBTIType(personalityTraits)

    // Calculate confidence based on data volume
    const confidence = this.calculateConfidence(behaviorData, contentHistory)

    const profile: IndividualityProfile = {
      userId,
      personalityTraits,
      contentPreferences,
      interactionPatterns,
      temporalPatterns,
      emotionalPatterns,
      cognitiveStyle,
      mbtiType,
      lastUpdated: Date.now(),
      confidence
    }

    this.profiles.set(userId, profile)
    return profile
  }

  /**
   * Analyze personality traits (Big 5)
   */
  private analyzePersonality(
    behaviorData: BehaviorData,
    contentHistory: any[]
  ): PersonalityTraits {
    // Openness: Based on content diversity and novelty seeking
    const uniqueCategories = new Set(contentHistory.map(c => c.category).filter(Boolean))
    const openness = Math.min(1, uniqueCategories.size / 10)

    // Conscientiousness: Based on completion rates and engagement depth
    const completionRate = contentHistory.length > 0
      ? contentHistory.filter(c => c.interactions.watched && !c.interactions.skipped).length / contentHistory.length
      : 0.5
    const conscientiousness = completionRate

    // Extraversion: Based on social interactions
    const socialInteractions = contentHistory.filter(c => 
      c.interactions.commented || c.interactions.shared
    ).length
    const extraversion = Math.min(1, socialInteractions / (contentHistory.length || 1) * 2)

    // Agreeableness: Based on positive interactions (likes, positive comments)
    const positiveInteractions = contentHistory.filter(c => c.interactions.liked).length
    const agreeableness = Math.min(1, positiveInteractions / (contentHistory.length || 1) * 1.5)

    // Neuroticism (inverted): Based on stress indicators and emotional stability
    const stressContent = contentHistory.filter(c => 
      c.emotion === 'stress' || c.emotion === 'anxiety'
    ).length
    const neuroticism = Math.max(0, 1 - (stressContent / (contentHistory.length || 1) * 2))

    return {
      openness,
      conscientiousness,
      extraversion,
      agreeableness,
      neuroticism
    }
  }

  /**
   * Analyze content preferences
   */
  private analyzeContentPreferences(contentHistory: any[]): ContentPreferences {
    const categories: Record<string, number> = {}
    const topics: Record<string, number> = {}
    const emotions: Record<string, number> = {}
    const lengthCounts = { short: 0, medium: 0, long: 0 }
    let totalComplexity = 0

    contentHistory.forEach(content => {
      // Categories
      if (content.category) {
        categories[content.category] = (categories[content.category] || 0) + 1
      }

      // Topics
      if (content.topic) {
        topics[content.topic] = (topics[content.topic] || 0) + 1
      }

      // Emotions
      if (content.emotion) {
        emotions[content.emotion] = (emotions[content.emotion] || 0) + 1
      }

      // Length
      if (content.length) {
        if (content.length < 30) lengthCounts.short++
        else if (content.length < 120) lengthCounts.medium++
        else lengthCounts.long++
      }

      // Complexity
      if (content.complexity !== undefined) {
        totalComplexity += content.complexity
      }
    })

    const total = contentHistory.length || 1

    // Normalize
    Object.keys(categories).forEach(key => {
      categories[key] = categories[key] / total
    })
    Object.keys(topics).forEach(key => {
      topics[key] = topics[key] / total
    })
    Object.keys(emotions).forEach(key => {
      emotions[key] = emotions[key] / total
    })

    return {
      categories,
      topics,
      emotions,
      length: {
        short: lengthCounts.short / total,
        medium: lengthCounts.medium / total,
        long: lengthCounts.long / total
      },
      complexity: totalComplexity / total
    }
  }

  /**
   * Analyze interaction patterns
   */
  private analyzeInteractionPatterns(
    behaviorData: BehaviorData,
    contentHistory: any[]
  ): InteractionPatterns {
    const scrollSpeed = behaviorData.scrollVelocity || 0
    const pauseFrequency = behaviorData.pauseCount / (behaviorData.sessionDuration / 60) || 0
    const rewatchRate = contentHistory.filter(c => c.interactions.rewatched).length / (contentHistory.length || 1)
    const skipRate = contentHistory.filter(c => c.interactions.skipped).length / (contentHistory.length || 1)
    
    const engagementDepth = (
      contentHistory.filter(c => c.interactions.liked).length +
      contentHistory.filter(c => c.interactions.commented).length * 2 +
      contentHistory.filter(c => c.interactions.shared).length * 3
    ) / (contentHistory.length || 1) / 6 // Normalize to 0-1

    const socialActivity = (
      contentHistory.filter(c => c.interactions.commented).length +
      contentHistory.filter(c => c.interactions.shared).length
    ) / (contentHistory.length || 1)

    return {
      scrollSpeed,
      pauseFrequency,
      rewatchRate,
      skipRate,
      engagementDepth,
      socialActivity
    }
  }

  /**
   * Analyze temporal patterns
   */
  private analyzeTemporalPatterns(behaviorData: BehaviorData): TemporalPatterns {
    const now = new Date()
    const hour = now.getHours()
    
    // Determine time of day preferences (simplified - would need historical data)
    const timeOfDayPreferences = {
      morning: hour >= 6 && hour < 12 ? 0.8 : 0.3,
      afternoon: hour >= 12 && hour < 18 ? 0.8 : 0.3,
      evening: hour >= 18 && hour < 22 ? 0.8 : 0.3,
      night: hour >= 22 || hour < 6 ? 0.8 : 0.3
    }

    return {
      peakHours: [hour], // Would be calculated from historical data
      sessionLength: behaviorData.sessionDuration / 60, // Convert to minutes
      sessionFrequency: 1, // Would be calculated from historical data
      breakPatterns: {
        averageBreakDuration: 5, // Placeholder
        breakFrequency: behaviorData.pauseCount / (behaviorData.sessionDuration / 3600) || 0
      },
      timeOfDayPreferences
    }
  }

  /**
   * Analyze emotional patterns
   */
  private analyzeEmotionalPatterns(
    contentHistory: any[],
    behaviorData: BehaviorData
  ): EmotionalPatterns {
    const joyTriggers: string[] = []
    const excitementTriggers: string[] = []
    const curiosityTriggers: string[] = []
    const stressIndicators: string[] = []
    const relaxationIndicators: string[] = []

    contentHistory.forEach(content => {
      if (content.emotion === 'joy' && content.interactions.liked) {
        if (content.category) joyTriggers.push(content.category)
      }
      if (content.emotion === 'excitement' && content.interactions.liked) {
        if (content.category) excitementTriggers.push(content.category)
      }
      if (content.emotion === 'curiosity' && content.interactions.watched && !content.interactions.skipped) {
        if (content.category) curiosityTriggers.push(content.category)
      }
      if (content.emotion === 'stress' && content.interactions.skipped) {
        if (content.category) stressIndicators.push(content.category)
      }
      if (content.emotion === 'relaxation' && content.interactions.watched && !content.interactions.skipped) {
        if (content.category) relaxationIndicators.push(content.category)
      }
    })

    return {
      joyTriggers: [...new Set(joyTriggers)],
      excitementTriggers: [...new Set(excitementTriggers)],
      curiosityTriggers: [...new Set(curiosityTriggers)],
      stressIndicators: [...new Set(stressIndicators)],
      relaxationIndicators: [...new Set(relaxationIndicators)],
      emotionalJourney: [] // Would be populated from real-time tracking
    }
  }

  /**
   * Analyze cognitive style
   */
  private analyzeCognitiveStyle(
    behaviorData: BehaviorData,
    contentHistory: any[]
  ): CognitiveStyle {
    // Processing speed: Based on scroll speed and pause frequency
    const processingSpeed = Math.min(1, (behaviorData.scrollVelocity || 0) / 1000)

    // Attention span: Based on average watch time before skip
    const watchedContent = contentHistory.filter(c => c.interactions.watched)
    const attentionSpan = watchedContent.length > 0
      ? watchedContent.reduce((sum, c) => sum + (c.length || 0), 0) / watchedContent.length
      : 30

    // Multitasking: Based on pause frequency and scroll patterns
    const multitasking = Math.min(1, behaviorData.pauseCount / (behaviorData.sessionDuration / 60) / 2)

    // Decision making: Based on skip rate and engagement
    const skipRate = contentHistory.filter(c => c.interactions.skipped).length / (contentHistory.length || 1)
    let decisionMaking: 'impulsive' | 'deliberate' | 'balanced'
    if (skipRate > 0.7) {
      decisionMaking = 'impulsive'
    } else if (skipRate < 0.3) {
      decisionMaking = 'deliberate'
    } else {
      decisionMaking = 'balanced'
    }

    // Information density: Based on complexity preference
    const avgComplexity = contentHistory.length > 0
      ? contentHistory.reduce((sum, c) => sum + (c.complexity || 0.5), 0) / contentHistory.length
      : 0.5

    return {
      processingSpeed,
      attentionSpan,
      multitasking,
      decisionMaking,
      informationDensity: avgComplexity
    }
  }

  /**
   * Determine MBTI-inspired type
   */
  private determineMBTIType(traits: PersonalityTraits): string {
    // Simplified MBTI determination based on Big 5
    const e = traits.extraversion > 0.5 ? 'E' : 'I'
    const s = traits.openness < 0.5 ? 'S' : 'N'
    const t = traits.agreeableness < 0.5 ? 'T' : 'F'
    const j = traits.conscientiousness > 0.5 ? 'J' : 'P'
    
    return `${e}${s}${t}${j}`
  }

  /**
   * Calculate profile confidence
   */
  private calculateConfidence(
    behaviorData: BehaviorData,
    contentHistory: any[]
  ): number {
    const dataVolume = contentHistory.length
    const sessionData = behaviorData.sessionDuration > 0 ? 1 : 0
    
    // Confidence increases with more data
    return Math.min(1, (dataVolume / 100) * 0.7 + sessionData * 0.3)
  }

  /**
   * Get user profile
   */
  getProfile(userId: string): IndividualityProfile | null {
    return this.profiles.get(userId) || null
  }

  /**
   * Update profile incrementally
   */
  async updateProfile(
    userId: string,
    newBehaviorData: BehaviorData,
    newContentHistory: any[]
  ): Promise<IndividualityProfile> {
    const existing = this.profiles.get(userId)
    
    if (existing) {
      // Merge with existing data (weighted average)
      // For now, re-analyze with combined data
      return await this.analyzeUser(userId, newBehaviorData, newContentHistory)
    } else {
      return await this.analyzeUser(userId, newBehaviorData, newContentHistory)
    }
  }
}

// Singleton instance
let profilerInstance: IndividualityProfiler | null = null

export function getIndividualityProfiler(): IndividualityProfiler {
  if (!profilerInstance) {
    profilerInstance = new IndividualityProfiler()
  }
  return profilerInstance
}




