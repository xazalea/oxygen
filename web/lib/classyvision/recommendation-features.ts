/**
 * Recommendation Features Service
 * 
 * Extracts features from videos for recommendation algorithm.
 * Combines visual, temporal, and classification features.
 */

import { getFeatureExtractor, VideoFeatures } from './feature-extractor'
import { getClassificationService } from './classification-service'
import { getModerationService } from './moderation-service'

export interface RecommendationFeatures {
  visualFeatures: Float32Array // Visual embedding
  temporalFeatures?: Float32Array // Motion/pace features
  category: string // Video category
  categoryConfidence: number
  tags: string[] // Content tags
  isSafe: boolean // Moderation result
  metadata: {
    duration: number
    frameCount: number
    processingTime: number
  }
}

export interface ExtractionOptions {
  includeTemporal?: boolean
  includeModeration?: boolean
  sampleRate?: number
  maxFrames?: number
}

export class RecommendationFeaturesService {
  private featureExtractor = getFeatureExtractor()
  private classificationService = getClassificationService()
  private moderationService = getModerationService()

  /**
   * Extract comprehensive features for recommendation
   */
  async extractFeatures(
    video: HTMLVideoElement,
    options: ExtractionOptions = {}
  ): Promise<RecommendationFeatures> {
    const {
      includeTemporal = true,
      includeModeration = true,
      sampleRate = 1,
      maxFrames = 30
    } = options

    const startTime = performance.now()

    // Extract visual features
    const videoFeatures = await this.featureExtractor.extractFromVideo(video, {
      sampleRate,
      maxFrames,
      includeTemporal
    })

    // Classify video
    const classification = await this.classificationService.classifyVideo(video, {
      sampleRate,
      maxFrames: Math.min(maxFrames, 10) // Fewer frames for classification
    })

    // Get tags
    const tags = await this.classificationService.getCategoryTags(video, {
      sampleRate,
      maxFrames: Math.min(maxFrames, 10)
    })

    // Check moderation (optional, can be expensive)
    let isSafe = true
    if (includeModeration) {
      const moderation = await this.moderationService.quickCheck(video)
      isSafe = moderation
    }

    const processingTime = performance.now() - startTime

    return {
      visualFeatures: videoFeatures.embedding,
      temporalFeatures: videoFeatures.temporalFeatures,
      category: classification.category,
      categoryConfidence: classification.confidence,
      tags,
      isSafe,
      metadata: {
        duration: video.duration,
        frameCount: videoFeatures.frameFeatures.length,
        processingTime
      }
    }
  }

  /**
   * Extract features from video URL
   */
  async extractFeaturesFromURL(
    videoUrl: string,
    options: ExtractionOptions = {}
  ): Promise<RecommendationFeatures> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.preload = 'auto'

      video.addEventListener('loadedmetadata', async () => {
        try {
          const features = await this.extractFeatures(video, options)
          resolve(features)
        } catch (error) {
          reject(error)
        }
      })

      video.addEventListener('error', reject)
      video.src = videoUrl
    })
  }

  /**
   * Combine features with interaction data for recommendation
   */
  combineWithInteractions(
    features: RecommendationFeatures,
    interactions: {
      likes: number
      views: number
      watchTime: number
      completionRate: number
    }
  ): Float32Array {
    // Create combined feature vector
    const featureSize = features.visualFeatures.length
    const combinedSize = featureSize + 
      (features.temporalFeatures?.length || 0) + 
      4 + // interaction features
      1   // category encoding

    const combined = new Float32Array(combinedSize)
    let offset = 0

    // Add visual features
    combined.set(features.visualFeatures, offset)
    offset += featureSize

    // Add temporal features if available
    if (features.temporalFeatures) {
      combined.set(features.temporalFeatures, offset)
      offset += features.temporalFeatures.length
    }

    // Add interaction features (normalized)
    const maxViews = 1000000 // Normalization factor
    const maxWatchTime = 60 // seconds
    combined[offset++] = Math.min(interactions.likes / 1000, 1) // Normalize likes
    combined[offset++] = Math.min(interactions.views / maxViews, 1) // Normalize views
    combined[offset++] = Math.min(interactions.watchTime / maxWatchTime, 1) // Normalize watch time
    combined[offset++] = interactions.completionRate // Already 0-1

    // Add category confidence
    combined[offset] = features.categoryConfidence

    return combined
  }

  /**
   * Compute similarity between two feature sets
   */
  computeSimilarity(
    features1: RecommendationFeatures,
    features2: RecommendationFeatures
  ): number {
    // Primary similarity based on visual features
    const visualSim = this.featureExtractor.cosineSimilarity(
      features1.visualFeatures,
      features2.visualFeatures
    )

    // Category match bonus
    const categoryMatch = features1.category === features2.category ? 0.1 : 0

    // Tag overlap bonus
    const tagOverlap = this.computeTagOverlap(features1.tags, features2.tags)

    // Combine similarities
    return Math.min(1, visualSim + categoryMatch + tagOverlap * 0.1)
  }

  /**
   * Compute tag overlap between two tag lists
   */
  private computeTagOverlap(tags1: string[], tags2: string[]): number {
    if (tags1.length === 0 || tags2.length === 0) return 0

    const set1 = new Set(tags1)
    const set2 = new Set(tags2)
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])

    return intersection.size / union.size // Jaccard similarity
  }
}

// Singleton instance
let recommendationFeaturesInstance: RecommendationFeaturesService | null = null

export function getRecommendationFeaturesService(): RecommendationFeaturesService {
  if (!recommendationFeaturesInstance) {
    recommendationFeaturesInstance = new RecommendationFeaturesService()
  }
  return recommendationFeaturesInstance
}



