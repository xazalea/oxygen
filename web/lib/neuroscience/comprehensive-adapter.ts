/**
 * Comprehensive Adaptation System
 * 
 * Dynamically adjusts ALL aspects of the platform based on user behavior:
 * - UI Adaptation (colors, layout, density, animations)
 * - Algorithm Adaptation (recommendation parameters, feed frequency)
 * - Feature Adaptation (show/hide, placement, defaults)
 * - Content Adaptation (type preferences, topics, creators)
 * - Timing Adaptation (notifications, updates, interactions)
 */

import { getBehaviorTracker, BehaviorData } from './behavior-tracker'
import { getNeuroscienceEngine } from './neuroscience-engine'

export interface UIAdaptation {
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
  }
  layout: {
    density: 'compact' | 'normal' | 'spacious'
    sidebar: 'left' | 'right' | 'hidden'
    navigation: 'top' | 'bottom' | 'floating'
  }
  animations: {
    speed: 'slow' | 'normal' | 'fast'
    enabled: boolean
    intensity: number
  }
  componentSizes: {
    buttons: 'small' | 'medium' | 'large'
    text: 'small' | 'medium' | 'large'
    spacing: 'tight' | 'normal' | 'loose'
  }
}

export interface AlgorithmAdaptation {
  recommendationParams: {
    diversity: number
    novelty: number
    popularity: number
    recency: number
  }
  feedFrequency: number // milliseconds
  contentDiscovery: {
    exploreWeight: number
    followingWeight: number
    trendingWeight: number
  }
  rankingWeights: {
    engagement: number
    recency: number
    relevance: number
  }
}

export interface FeatureAdaptation {
  visible: string[]
  hidden: string[]
  prominent: string[]
  defaultSettings: Record<string, any>
}

export interface ContentAdaptation {
  typePreferences: {
    video: number
    text: number
    story: number
    image: number
  }
  lengthPreferences: {
    short: number // < 30s
    medium: number // 30s - 2min
    long: number // > 2min
  }
  topicPreferences: Record<string, number>
  creatorPreferences: Record<string, number>
}

export interface TimingAdaptation {
  notificationTiming: {
    optimalWindows: number[] // hours of day
    frequency: number // per hour
    delay: number // milliseconds
  }
  feedUpdateFrequency: number // milliseconds
  autoPlay: boolean
  interactionPrompts: {
    timing: number // milliseconds
    frequency: number
  }
}

export interface ComprehensiveAdaptation {
  ui: UIAdaptation
  algorithm: AlgorithmAdaptation
  features: FeatureAdaptation
  content: ContentAdaptation
  timing: TimingAdaptation
}

class ComprehensiveAdapter {
  private currentAdaptation: ComprehensiveAdaptation
  private adaptationHistory: ComprehensiveAdaptation[] = []
  private lastAdaptationTime = 0
  private adaptationInterval = 60000 // 1 minute

  constructor() {
    this.currentAdaptation = this.getDefaultAdaptation()
  }

  /**
   * Get default adaptation
   */
  private getDefaultAdaptation(): ComprehensiveAdaptation {
    return {
      ui: {
        colors: {
          primary: '#000000',
          secondary: '#ffffff',
          background: '#000000',
          text: '#ffffff'
        },
        layout: {
          density: 'normal',
          sidebar: 'left',
          navigation: 'bottom'
        },
        animations: {
          speed: 'normal',
          enabled: true,
          intensity: 0.5
        },
        componentSizes: {
          buttons: 'medium',
          text: 'medium',
          spacing: 'normal'
        }
      },
      algorithm: {
        recommendationParams: {
          diversity: 0.5,
          novelty: 0.5,
          popularity: 0.5,
          recency: 0.5
        },
        feedFrequency: 5000,
        contentDiscovery: {
          exploreWeight: 0.3,
          followingWeight: 0.5,
          trendingWeight: 0.2
        },
        rankingWeights: {
          engagement: 0.4,
          recency: 0.3,
          relevance: 0.3
        }
      },
      features: {
        visible: ['feed', 'discover', 'create', 'inbox', 'profile'],
        hidden: [],
        prominent: ['feed'],
        defaultSettings: {}
      },
      content: {
        typePreferences: {
          video: 0.7,
          text: 0.2,
          story: 0.05,
          image: 0.05
        },
        lengthPreferences: {
          short: 0.6,
          medium: 0.3,
          long: 0.1
        },
        topicPreferences: {},
        creatorPreferences: {}
      },
      timing: {
        notificationTiming: {
          optimalWindows: [9, 12, 15, 18, 21], // 9am, 12pm, 3pm, 6pm, 9pm
          frequency: 3, // 3 per hour
          delay: 0
        },
        feedUpdateFrequency: 5000,
        autoPlay: true,
        interactionPrompts: {
          timing: 3000,
          frequency: 5
        }
      }
    }
  }

  /**
   * Adapt based on behavior data
   */
  adapt(behaviorData: BehaviorData): ComprehensiveAdaptation {
    const now = Date.now()
    
    // Only adapt if enough time has passed
    if (now - this.lastAdaptationTime < this.adaptationInterval) {
      return this.currentAdaptation
    }

    // Get neuroscience engine insights
    const engine = getNeuroscienceEngine()
    const engagementScore = engine.getEngagementScore(behaviorData)
    const cognitiveLoad = behaviorData.cognitiveLoad

    // Adapt UI
    this.adaptUI(behaviorData, engagementScore, cognitiveLoad)

    // Adapt Algorithm
    this.adaptAlgorithm(behaviorData, engagementScore)

    // Adapt Features
    this.adaptFeatures(behaviorData, engagementScore)

    // Adapt Content
    this.adaptContent(behaviorData, engagementScore)

    // Adapt Timing
    this.adaptTiming(behaviorData, engagementScore)

    // Save adaptation history
    this.adaptationHistory.push({ ...this.currentAdaptation })
    if (this.adaptationHistory.length > 100) {
      this.adaptationHistory.shift()
    }

    this.lastAdaptationTime = now
    return this.currentAdaptation
  }

  /**
   * Adapt UI based on behavior
   */
  private adaptUI(behaviorData: BehaviorData, engagementScore: number, cognitiveLoad: number): void {
    // Color preferences from interactions
    const focusedElements = behaviorData.attentionPatterns.focusedElements
    // Simple heuristic: detect color preferences from element classes
    // In a real implementation, this would analyze actual color usage

    // Layout density based on cognitive load
    if (cognitiveLoad > 0.7) {
      this.currentAdaptation.ui.layout.density = 'spacious'
    } else if (cognitiveLoad < 0.3) {
      this.currentAdaptation.ui.layout.density = 'compact'
    } else {
      this.currentAdaptation.ui.layout.density = 'normal'
    }

    // Animation speed based on scroll patterns
    const avgScrollSpeed = behaviorData.scrollPatterns.length > 0
      ? behaviorData.scrollPatterns.reduce((sum, p) => sum + p.speed, 0) / behaviorData.scrollPatterns.length
      : 0
    
    if (avgScrollSpeed > 100) {
      this.currentAdaptation.ui.animations.speed = 'fast'
    } else if (avgScrollSpeed < 30) {
      this.currentAdaptation.ui.animations.speed = 'slow'
    } else {
      this.currentAdaptation.ui.animations.speed = 'normal'
    }

    // Component sizes based on dwell time
    const avgDwellTime = behaviorData.dwellTimes.length > 0
      ? behaviorData.dwellTimes.reduce((sum, d) => sum + d.duration, 0) / behaviorData.dwellTimes.length
      : 0
    
    if (avgDwellTime > 5000) {
      this.currentAdaptation.ui.componentSizes.buttons = 'large'
      this.currentAdaptation.ui.componentSizes.text = 'large'
    } else if (avgDwellTime < 1000) {
      this.currentAdaptation.ui.componentSizes.buttons = 'small'
      this.currentAdaptation.ui.componentSizes.text = 'small'
    }
  }

  /**
   * Adapt algorithm based on behavior
   */
  private adaptAlgorithm(behaviorData: BehaviorData, engagementScore: number): void {
    // Adjust recommendation parameters based on engagement
    if (engagementScore > 0.7) {
      // High engagement: favor novelty and diversity
      this.currentAdaptation.algorithm.recommendationParams.novelty = 0.7
      this.currentAdaptation.algorithm.recommendationParams.diversity = 0.7
    } else if (engagementScore < 0.3) {
      // Low engagement: favor popularity
      this.currentAdaptation.algorithm.recommendationParams.popularity = 0.7
    }

    // Adjust feed frequency based on scroll patterns
    const avgScrollSpeed = behaviorData.scrollPatterns.length > 0
      ? behaviorData.scrollPatterns.reduce((sum, p) => sum + p.speed, 0) / behaviorData.scrollPatterns.length
      : 0
    
    if (avgScrollSpeed > 100) {
      this.currentAdaptation.algorithm.feedFrequency = 2000 // Faster updates
    } else {
      this.currentAdaptation.algorithm.feedFrequency = 5000 // Normal updates
    }

    // Adjust ranking weights based on interactions
    const interactions = behaviorData.engagementMetrics.interactions
    if (interactions > 50) {
      this.currentAdaptation.algorithm.rankingWeights.engagement = 0.6
      this.currentAdaptation.algorithm.rankingWeights.relevance = 0.2
    }
  }

  /**
   * Adapt features based on behavior
   */
  private adaptFeatures(behaviorData: BehaviorData, engagementScore: number): void {
    // Show/hide features based on usage
    const focusedElements = behaviorData.attentionPatterns.focusedElements
    
    // If user never focuses on certain features, hide them
    const hiddenFeatures: string[] = []
    const visibleFeatures = ['feed', 'discover', 'create', 'inbox', 'profile']
    
    visibleFeatures.forEach(feature => {
      if (!focusedElements.some(el => el.toLowerCase().includes(feature))) {
        hiddenFeatures.push(feature)
      }
    })

    this.currentAdaptation.features.hidden = hiddenFeatures
    this.currentAdaptation.features.visible = visibleFeatures.filter(f => !hiddenFeatures.includes(f))

    // Make most used features prominent
    const mostUsed = focusedElements
      .reduce((acc, el) => {
        acc[el] = (acc[el] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    
    const prominent = Object.entries(mostUsed)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([el]) => el)
    
    this.currentAdaptation.features.prominent = prominent
  }

  /**
   * Adapt content based on behavior
   */
  private adaptContent(behaviorData: BehaviorData, engagementScore: number): void {
    // Adjust content type preferences based on watch time
    const watchTime = behaviorData.engagementMetrics.watchTime
    
    // If user watches a lot, favor videos
    if (watchTime > 3600000) { // 1 hour
      this.currentAdaptation.content.typePreferences.video = 0.8
      this.currentAdaptation.content.typePreferences.text = 0.1
    }

    // Adjust length preferences based on dwell time
    const avgDwellTime = behaviorData.dwellTimes.length > 0
      ? behaviorData.dwellTimes.reduce((sum, d) => sum + d.duration, 0) / behaviorData.dwellTimes.length
      : 0
    
    if (avgDwellTime < 2000) {
      // Short attention span: favor short content
      this.currentAdaptation.content.lengthPreferences.short = 0.8
      this.currentAdaptation.content.lengthPreferences.medium = 0.15
      this.currentAdaptation.content.lengthPreferences.long = 0.05
    } else if (avgDwellTime > 10000) {
      // Long attention span: favor longer content
      this.currentAdaptation.content.lengthPreferences.short = 0.3
      this.currentAdaptation.content.lengthPreferences.medium = 0.4
      this.currentAdaptation.content.lengthPreferences.long = 0.3
    }
  }

  /**
   * Adapt timing based on behavior
   */
  private adaptTiming(behaviorData: BehaviorData, engagementScore: number): void {
    const engine = getNeuroscienceEngine()
    const timing = engine.getOptimalNotificationTiming(behaviorData)

    this.currentAdaptation.timing.notificationTiming.delay = timing.delay

    // Adjust feed update frequency based on engagement
    if (engagementScore > 0.7) {
      this.currentAdaptation.timing.feedUpdateFrequency = 3000 // More frequent
    } else {
      this.currentAdaptation.timing.feedUpdateFrequency = 5000 // Normal
    }

    // Auto-play based on engagement
    this.currentAdaptation.timing.autoPlay = engagementScore > 0.5
  }

  /**
   * Get current adaptation
   */
  getCurrentAdaptation(): ComprehensiveAdaptation {
    return { ...this.currentAdaptation }
  }

  /**
   * Get adaptation history
   */
  getAdaptationHistory(): ComprehensiveAdaptation[] {
    return [...this.adaptationHistory]
  }

  /**
   * Reset to default adaptation
   */
  reset(): void {
    this.currentAdaptation = this.getDefaultAdaptation()
    this.adaptationHistory = []
    this.lastAdaptationTime = 0
  }
}

// Singleton instance
let adapterInstance: ComprehensiveAdapter | null = null

export function getComprehensiveAdapter(): ComprehensiveAdapter {
  if (!adapterInstance) {
    adapterInstance = new ComprehensiveAdapter()
  }
  return adapterInstance
}

export default ComprehensiveAdapter

