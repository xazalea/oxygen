/**
 * Deep Personalization Engine
 * 
 * Adapts content, UI, features, and social aspects based on deep individuality understanding.
 */

import { IndividualityProfile } from './individuality-profiler'
import { AdvancedBehaviorData } from './advanced-tracker'
import { ComprehensiveAdaptation, UIAdaptation, AlgorithmAdaptation, FeatureAdaptation, ContentAdaptation } from '../neuroscience/comprehensive-adapter'

export interface SocialAdaptation {
  showFollowers: boolean
  showFollowing: boolean
  showLikes: boolean
  socialFeatures: {
    comments: boolean
    shares: boolean
    messages: boolean
    groups: boolean
  }
  connectionSuggestions: boolean
}

export interface DeepPersonalizationResult {
  contentAdaptation: ContentAdaptation
  uiAdaptation: UIAdaptation
  featureAdaptation: FeatureAdaptation
  algorithmAdaptation: AlgorithmAdaptation
  socialAdaptation: SocialAdaptation
  emotionalState: {
    current: string
    target: string
    recommendations: string[]
  }
}

export class DeepPersonalizationEngine {
  /**
   * Generate deep personalization based on individuality profile
   */
  personalize(
    profile: IndividualityProfile,
    behaviorData: AdvancedBehaviorData
  ): DeepPersonalizationResult {
    // Content personalization
    const contentAdaptation = this.adaptContent(profile, behaviorData)

    // UI personalization
    const uiAdaptation = this.adaptUI(profile, behaviorData)

    // Feature personalization
    const featureAdaptation = this.adaptFeatures(profile, behaviorData)

    // Algorithm personalization
    const algorithmAdaptation = this.adaptAlgorithm(profile, behaviorData)

    // Social personalization
    const socialAdaptation = this.adaptSocial(profile, behaviorData)

    // Emotional state matching
    const emotionalState = this.determineEmotionalState(profile, behaviorData)

    return {
      contentAdaptation,
      uiAdaptation,
      featureAdaptation,
      algorithmAdaptation,
      socialAdaptation,
      emotionalState
    }
  }

  /**
   * Adapt content based on personality and preferences
   */
  private adaptContent(
    profile: IndividualityProfile,
    behaviorData: AdvancedBehaviorData
  ): ContentAdaptation {
    // Match content type preferences
    const typePreferences = {
      video: profile.contentPreferences.length.medium > 0.5 ? 0.8 : 0.5,
      text: profile.cognitiveStyle.informationDensity > 0.7 ? 0.6 : 0.3,
      story: profile.personalityTraits.extraversion > 0.6 ? 0.7 : 0.4,
      image: profile.cognitiveStyle.processingSpeed > 0.7 ? 0.6 : 0.4
    }

    // Match length preferences
    const lengthPreferences = profile.contentPreferences.length

    // Match topic preferences (top 5)
    const topTopics = Object.entries(profile.contentPreferences.topics)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic)

    const topicPreferences: Record<string, number> = {}
    topTopics.forEach((topic, index) => {
      topicPreferences[topic] = 1 - (index * 0.15) // Decreasing weights
    })

    // Match creator preferences (would come from interaction history)
    const creatorPreferences: Record<string, number> = {}

    return {
      typePreferences,
      lengthPreferences,
      topicPreferences,
      creatorPreferences
    }
  }

  /**
   * Adapt UI based on personality and cognitive style
   */
  private adaptUI(
    profile: IndividualityProfile,
    behaviorData: AdvancedBehaviorData
  ): UIAdaptation {
    // Color adaptation based on personality
    const colors = this.adaptColors(profile)

    // Layout density based on attention patterns
    const density = behaviorData.attentionHeatmap.length > 10 ? 'compact' : 'normal'

    // Animation speed based on processing speed
    const animationSpeed = profile.cognitiveStyle.processingSpeed > 0.7 ? 'fast' : 
                          profile.cognitiveStyle.processingSpeed < 0.3 ? 'slow' : 'normal'

    // Component sizes based on interaction patterns
    const buttonSize = behaviorData.interactionIntensity > 0.7 ? 'large' :
                      behaviorData.interactionIntensity < 0.3 ? 'small' : 'medium'

    return {
      colors,
      layout: {
        density: density as 'compact' | 'normal' | 'spacious',
        sidebar: profile.personalityTraits.extraversion > 0.6 ? 'right' : 'left',
        navigation: 'bottom' // Mobile-first
      },
      animations: {
        speed: animationSpeed as 'slow' | 'normal' | 'fast',
        enabled: true,
        intensity: profile.cognitiveStyle.processingSpeed
      },
      componentSizes: {
        buttons: buttonSize as 'small' | 'medium' | 'large',
        text: profile.cognitiveStyle.informationDensity > 0.7 ? 'small' : 'medium',
        spacing: density === 'compact' ? 'tight' : 'normal'
      }
    }
  }

  /**
   * Adapt colors based on personality
   */
  private adaptColors(profile: IndividualityProfile): UIAdaptation['colors'] {
    // Color psychology adaptation
    if (profile.personalityTraits.extraversion > 0.7) {
      // Extraverted: Vibrant colors
      return {
        primary: '#8B5CF6', // Purple
        secondary: '#EC4899', // Pink
        background: '#0F172A', // Dark blue
        text: '#FFFFFF'
      }
    } else if (profile.personalityTraits.conscientiousness > 0.7) {
      // Conscientious: Professional colors
      return {
        primary: '#3B82F6', // Blue
        secondary: '#10B981', // Green
        background: '#111827', // Dark gray
        text: '#F9FAFB'
      }
    } else if (profile.personalityTraits.openness > 0.7) {
      // Open: Creative colors
      return {
        primary: '#F59E0B', // Amber
        secondary: '#EF4444', // Red
        background: '#1E293B', // Slate
        text: '#FFFFFF'
      }
    } else {
      // Default: Balanced colors
      return {
        primary: '#6366F1', // Indigo
        secondary: '#8B5CF6', // Purple
        background: '#0F172A',
        text: '#FFFFFF'
      }
    }
  }

  /**
   * Adapt features based on usage patterns
   */
  private adaptFeatures(
    profile: IndividualityProfile,
    behaviorData: AdvancedBehaviorData
  ): FeatureAdaptation {
    const visible: string[] = []
    const hidden: string[] = []
    const prominent: string[] = []

    // Show investment features if user is engaged
    if (behaviorData.engagementDepth > 0.5) {
      visible.push('investing')
      prominent.push('investing')
    }

    // Show social features based on extraversion
    if (profile.personalityTraits.extraversion > 0.6) {
      visible.push('comments', 'sharing', 'messages')
      prominent.push('comments')
    } else {
      visible.push('comments', 'sharing')
      hidden.push('messages')
    }

    // Show stories for extraverted users
    if (profile.personalityTraits.extraversion > 0.7) {
      visible.push('stories')
    }

    // Show text posts for users who prefer reading
    if (profile.cognitiveStyle.informationDensity > 0.6) {
      visible.push('text_posts')
    }

    return {
      visible,
      hidden,
      prominent,
      defaultSettings: {
        autoplay: profile.cognitiveStyle.processingSpeed > 0.6,
        notifications: profile.personalityTraits.extraversion > 0.5
      }
    }
  }

  /**
   * Adapt algorithm based on personality
   */
  private adaptAlgorithm(
    profile: IndividualityProfile,
    behaviorData: AdvancedBehaviorData
  ): AlgorithmAdaptation {
    // Diversity: Higher for open personalities
    const diversity = profile.personalityTraits.openness

    // Novelty: Higher for open personalities
    const novelty = profile.personalityTraits.openness * 0.8

    // Popularity: Higher for agreeable personalities
    const popularity = profile.personalityTraits.agreeableness

    // Recency: Higher for conscientious personalities
    const recency = profile.personalityTraits.conscientiousness

    // Feed frequency: Based on attention span
    const feedFrequency = Math.max(1000, profile.cognitiveStyle.attentionSpan * 100)

    return {
      recommendationParams: {
        diversity,
        novelty,
        popularity,
        recency
      },
      feedFrequency,
      contentDiscovery: {
        exploreWeight: profile.personalityTraits.openness,
        followingWeight: profile.personalityTraits.agreeableness,
        trendingWeight: 1 - profile.personalityTraits.openness
      },
      rankingWeights: {
        engagement: behaviorData.engagementDepth,
        recency: profile.personalityTraits.conscientiousness,
        relevance: 0.8 // Base relevance
      }
    }
  }

  /**
   * Adapt social features
   */
  private adaptSocial(
    profile: IndividualityProfile,
    behaviorData: AdvancedBehaviorData
  ): SocialAdaptation {
    return {
      showFollowers: profile.personalityTraits.extraversion > 0.5,
      showFollowing: true,
      showLikes: profile.personalityTraits.extraversion > 0.6,
      socialFeatures: {
        comments: profile.personalityTraits.extraversion > 0.4,
        shares: profile.personalityTraits.extraversion > 0.5,
        messages: profile.personalityTraits.extraversion > 0.6,
        groups: profile.personalityTraits.agreeableness > 0.6
      },
      connectionSuggestions: profile.personalityTraits.extraversion > 0.5
    }
  }

  /**
   * Determine emotional state and recommendations
   */
  private determineEmotionalState(
    profile: IndividualityProfile,
    behaviorData: AdvancedBehaviorData
  ): {
    current: string
    target: string
    recommendations: string[]
  } {
    const emotionalState = behaviorData.emotionalIndicators.length > 0
      ? behaviorData.emotionalIndicators[behaviorData.emotionalIndicators.length - 1].emotion
      : 'neutral'

    // Target emotion: Based on time of day and personality
    const hour = new Date().getHours()
    let targetEmotion: string = 'joy'

    if (hour >= 6 && hour < 12) {
      targetEmotion = 'excitement' // Morning: energize
    } else if (hour >= 12 && hour < 18) {
      targetEmotion = 'curiosity' // Afternoon: engage
    } else if (hour >= 18 && hour < 22) {
      targetEmotion = 'relaxation' // Evening: unwind
    } else {
      targetEmotion = 'relaxation' // Night: calm
    }

    // Recommendations based on emotional triggers
    const recommendations: string[] = []
    if (targetEmotion === 'joy') {
      recommendations.push(...profile.emotionalPatterns.joyTriggers.slice(0, 3))
    } else if (targetEmotion === 'excitement') {
      recommendations.push(...profile.emotionalPatterns.excitementTriggers.slice(0, 3))
    } else if (targetEmotion === 'curiosity') {
      recommendations.push(...profile.emotionalPatterns.curiosityTriggers.slice(0, 3))
    } else if (targetEmotion === 'relaxation') {
      recommendations.push(...profile.emotionalPatterns.relaxationIndicators.slice(0, 3))
    }

    return {
      current: emotionalState,
      target: targetEmotion,
      recommendations
    }
  }
}

// Singleton instance
let deepPersonalizationInstance: DeepPersonalizationEngine | null = null

export function getDeepPersonalizationEngine(): DeepPersonalizationEngine {
  if (!deepPersonalizationInstance) {
    deepPersonalizationInstance = new DeepPersonalizationEngine()
  }
  return deepPersonalizationInstance
}

