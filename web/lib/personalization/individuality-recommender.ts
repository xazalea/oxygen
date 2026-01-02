/**
 * Individuality-Based Recommendation System
 * 
 * Combines ClassyVision features with personality traits, emotional state,
 * cognitive load, temporal patterns, and social graph for personalized recommendations.
 */

import { IndividualityProfile } from './individuality-profiler'
import { DeepPersonalizationResult } from './deep-personalization'
// import { getRecommendationFeaturesService, RecommendationFeatures } from '../classyvision/recommendation-features'

export interface RecommendationScore {
  contentId: string
  score: number
  factors: {
    personalityMatch: number
    emotionalMatch: number
    temporalMatch: number
    visualSimilarity: number
    socialMatch: number
    novelty: number
  }
}

export interface ContentCandidate {
  id: string
  visualFeatures?: Float32Array
  category?: string
  topic?: string
  emotion?: string
  length?: number
  complexity?: number
  creatorId?: string
  timestamp: number
  stats?: {
    views: number
    likes: number
    shares: number
    comments: number
  }
}

export class IndividualityRecommender {
  // private recommendationFeatures = getRecommendationFeaturesService()

  /**
   * Generate personalized recommendations
   */
  async recommend(
    profile: IndividualityProfile,
    personalization: DeepPersonalizationResult,
    candidates: ContentCandidate[],
    userVisualFeatures?: Float32Array,
    limit: number = 20
  ): Promise<RecommendationScore[]> {
    const scores: RecommendationScore[] = []

    for (const candidate of candidates) {
      const score = await this.scoreContent(
        profile,
        personalization,
        candidate,
        userVisualFeatures
      )
      scores.push(score)
    }

    // Sort by score and return top results
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  /**
   * Score a single content candidate
   */
  private async scoreContent(
    profile: IndividualityProfile,
    personalization: DeepPersonalizationResult,
    candidate: ContentCandidate,
    userVisualFeatures?: Float32Array
  ): Promise<RecommendationScore> {
    // Personality match
    const personalityMatch = this.calculatePersonalityMatch(profile, candidate)

    // Emotional match
    const emotionalMatch = this.calculateEmotionalMatch(
      personalization.emotionalState,
      candidate
    )

    // Temporal match
    const temporalMatch = this.calculateTemporalMatch(profile, candidate)

    // Visual similarity (if features available)
    const visualSimilarity = userVisualFeatures && candidate.visualFeatures
      ? this.calculateVisualSimilarity(userVisualFeatures, candidate.visualFeatures)
      : 0.5 // Default if no features

    // Social match (would need social graph data)
    const socialMatch = 0.5 // Placeholder

    // Novelty vs familiarity balance
    const novelty = this.calculateNovelty(profile, candidate)

    // Combine scores with weights
    const finalScore = (
      personalityMatch * 0.25 +
      emotionalMatch * 0.20 +
      temporalMatch * 0.15 +
      visualSimilarity * 0.20 +
      socialMatch * 0.10 +
      novelty * 0.10
    )

    return {
      contentId: candidate.id,
      score: finalScore,
      factors: {
        personalityMatch,
        emotionalMatch,
        temporalMatch,
        visualSimilarity,
        socialMatch,
        novelty
      }
    }
  }

  /**
   * Calculate personality match
   */
  private calculatePersonalityMatch(
    profile: IndividualityProfile,
    candidate: ContentCandidate
  ): number {
    // Match content complexity to cognitive style
    const complexityMatch = candidate.complexity !== undefined
      ? 1 - Math.abs(profile.cognitiveStyle.informationDensity - candidate.complexity)
      : 0.5

    // Match content length to preferences
    const lengthMatch = candidate.length !== undefined
      ? this.matchLengthPreference(profile, candidate.length)
      : 0.5

    // Match category/topic to preferences
    const topicMatch = candidate.topic
      ? profile.contentPreferences.topics[candidate.topic] || 0
      : 0.5

    return (complexityMatch * 0.4 + lengthMatch * 0.3 + topicMatch * 0.3)
  }

  /**
   * Match length preference
   */
  private matchLengthPreference(profile: IndividualityProfile, length: number): number {
    if (length < 30) {
      return profile.contentPreferences.length.short
    } else if (length < 120) {
      return profile.contentPreferences.length.medium
    } else {
      return profile.contentPreferences.length.long
    }
  }

  /**
   * Calculate emotional match
   */
  private calculateEmotionalMatch(
    emotionalState: DeepPersonalizationResult['emotionalState'],
    candidate: ContentCandidate
  ): number {
    if (!candidate.emotion) return 0.5

    // Match target emotion
    if (candidate.emotion === emotionalState.target) {
      return 1.0
    }

    // Match current emotion (lower weight)
    if (candidate.emotion === emotionalState.current) {
      return 0.7
    }

    // Check if in recommendations
    if (emotionalState.recommendations.includes(candidate.emotion)) {
      return 0.8
    }

    return 0.3
  }

  /**
   * Calculate temporal match
   */
  private calculateTemporalMatch(
    profile: IndividualityProfile,
    candidate: ContentCandidate
  ): number {
    const now = new Date()
    const hour = now.getHours()
    const candidateAge = (Date.now() - candidate.timestamp) / (1000 * 60 * 60) // hours

    // Time of day match
    let timeMatch = 0.5
    if (hour >= 6 && hour < 12) {
      timeMatch = profile.temporalPatterns.timeOfDayPreferences.morning
    } else if (hour >= 12 && hour < 18) {
      timeMatch = profile.temporalPatterns.timeOfDayPreferences.afternoon
    } else if (hour >= 18 && hour < 22) {
      timeMatch = profile.temporalPatterns.timeOfDayPreferences.evening
    } else {
      timeMatch = profile.temporalPatterns.timeOfDayPreferences.night
    }

    // Recency match (prefer recent content for some personalities)
    const recencyMatch = profile.personalityTraits.conscientiousness > 0.6
      ? Math.max(0, 1 - candidateAge / 24) // Prefer content from last 24 hours
      : 0.5

    return (timeMatch * 0.7 + recencyMatch * 0.3)
  }

  /**
   * Calculate visual similarity
   */
  private calculateVisualSimilarity(
    userFeatures: Float32Array,
    candidateFeatures: Float32Array
  ): number {
    if (userFeatures.length !== candidateFeatures.length) {
      return 0.5
    }

    // Cosine similarity
    let dotProduct = 0
    let normUser = 0
    let normCandidate = 0

    for (let i = 0; i < userFeatures.length; i++) {
      dotProduct += userFeatures[i] * candidateFeatures[i]
      normUser += userFeatures[i] * userFeatures[i]
      normCandidate += candidateFeatures[i] * candidateFeatures[i]
    }

    const denominator = Math.sqrt(normUser) * Math.sqrt(normCandidate)
    if (denominator === 0) return 0

    return dotProduct / denominator
  }

  /**
   * Calculate novelty vs familiarity balance
   */
  private calculateNovelty(
    profile: IndividualityProfile,
    candidate: ContentCandidate
  ): number {
    // Open personalities prefer novelty
    const noveltyPreference = profile.personalityTraits.openness

    // For high openness, prefer novel content
    // For low openness, prefer familiar content
    // This would need to check against user's content history
    // For now, return a balanced score
    return 0.5 + (noveltyPreference - 0.5) * 0.3
  }

  /**
   * Adapt recommendations based on cognitive load
   */
  adaptForCognitiveLoad(
    recommendations: RecommendationScore[],
    cognitiveLoad: number
  ): RecommendationScore[] {
    // High cognitive load: prefer simpler, shorter content
    // Low cognitive load: can handle complex content

    return recommendations.map(rec => {
      // Adjust score based on cognitive load
      // This would need content complexity data
      const adjustedScore = rec.score * (1 - cognitiveLoad * 0.2)
      return {
        ...rec,
        score: adjustedScore
      }
    }).sort((a, b) => b.score - a.score)
  }
}

// Singleton instance
let individualityRecommenderInstance: IndividualityRecommender | null = null

export function getIndividualityRecommender(): IndividualityRecommender {
  if (!individualityRecommenderInstance) {
    individualityRecommenderInstance = new IndividualityRecommender()
  }
  return individualityRecommenderInstance
}

