/**
 * Content Moderation Service
 * 
 * Detects inappropriate content in videos using ClassyVision models.
 */

import { getInferenceEngine } from './inference-engine'
import { VideoProcessor, FrameData } from './video-processor'
import { MODEL_CONFIGS } from './client-models'

export interface ModerationResult {
  isSafe: boolean
  confidence: number
  unsafeScore: number
  safeScore: number
  flaggedFrames: Array<{
    frameIndex: number
    timestamp: number
    confidence: number
  }>
  processingTime: number
}

export interface ModerationOptions {
  sampleRate?: number
  maxFrames?: number
  threshold?: number // Confidence threshold for flagging (default: 0.7)
  requireMultipleFlags?: boolean // Require multiple frames to flag (default: false)
}

export class ModerationService {
  private inferenceEngine = getInferenceEngine()
  private videoProcessor = new VideoProcessor()
  private readonly MODERATION_MODEL = 'moderation_classifier'
  private readonly DEFAULT_THRESHOLD = 0.7

  /**
   * Check video for inappropriate content
   */
  async checkContent(
    video: HTMLVideoElement,
    options: ModerationOptions = {}
  ): Promise<ModerationResult> {
    const {
      sampleRate = 2, // Higher sample rate for moderation
      maxFrames = 30,
      threshold = this.DEFAULT_THRESHOLD,
      requireMultipleFlags = false
    } = options

    const startTime = performance.now()

    // Extract frames
    const frames = await this.videoProcessor.extractFrames(video, {
      sampleRate,
      maxFrames,
      targetSize: MODEL_CONFIGS[this.MODERATION_MODEL].inputSize
    })

    if (frames.length === 0) {
      // If no frames, assume safe (or could throw error)
      return {
        isSafe: true,
        confidence: 1.0,
        unsafeScore: 0,
        safeScore: 1.0,
        flaggedFrames: [],
        processingTime: performance.now() - startTime
      }
    }

    // Run moderation on each frame
    const frameResults: Array<{
      frameIndex: number
      timestamp: number
      unsafeScore: number
      safeScore: number
    }> = []

    for (const frame of frames) {
      const result = await this.inferenceEngine.inferImage(
        this.MODERATION_MODEL,
        frame.imageData,
        { topK: 2 }
      )

      // Moderation model outputs [safe, unsafe] probabilities
      const safePred = result.predictions.find(p => p.classIndex === 0)
      const unsafePred = result.predictions.find(p => p.classIndex === 1)

      frameResults.push({
        frameIndex: frame.frameIndex,
        timestamp: frame.timestamp,
        unsafeScore: unsafePred?.confidence || 0,
        safeScore: safePred?.confidence || 0
      })
    }

    // Aggregate results
    const averageUnsafe = frameResults.reduce((sum, r) => sum + r.unsafeScore, 0) / frameResults.length
    const averageSafe = frameResults.reduce((sum, r) => sum + r.safeScore, 0) / frameResults.length

    // Find flagged frames
    const flaggedFrames = frameResults
      .filter(r => r.unsafeScore >= threshold)
      .map(r => ({
        frameIndex: r.frameIndex,
        timestamp: r.timestamp,
        confidence: r.unsafeScore
      }))

    // Determine if content is safe
    let isSafe = true
    if (requireMultipleFlags) {
      // Require multiple flagged frames
      isSafe = flaggedFrames.length < 2
    } else {
      // Flag if any frame exceeds threshold
      isSafe = averageUnsafe < threshold
    }

    const processingTime = performance.now() - startTime

    return {
      isSafe,
      confidence: Math.max(averageSafe, averageUnsafe),
      unsafeScore: averageUnsafe,
      safeScore: averageSafe,
      flaggedFrames,
      processingTime
    }
  }

  /**
   * Check video from URL
   */
  async checkContentURL(
    videoUrl: string,
    options: ModerationOptions = {}
  ): Promise<ModerationResult> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.preload = 'auto'

      video.addEventListener('loadedmetadata', async () => {
        try {
          const result = await this.checkContent(video, options)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      video.addEventListener('error', reject)
      video.src = videoUrl
    })
  }

  /**
   * Get moderation score (0 = safe, 1 = unsafe)
   */
  async getModerationScore(
    video: HTMLVideoElement,
    options: ModerationOptions = {}
  ): Promise<number> {
    const result = await this.checkContent(video, options)
    return result.unsafeScore
  }

  /**
   * Filter content based on moderation score
   */
  async filterContent(
    video: HTMLVideoElement,
    options: ModerationOptions & { autoHide?: boolean } = {}
  ): Promise<{
    allowed: boolean
    reason?: string
    score: number
  }> {
    const { autoHide = false, threshold = this.DEFAULT_THRESHOLD } = options

    const result = await this.checkContent(video, options)

    if (result.isSafe) {
      return {
        allowed: true,
        score: result.unsafeScore
      }
    }

    if (autoHide) {
      return {
        allowed: false,
        reason: 'Content flagged by moderation system',
        score: result.unsafeScore
      }
    }

    // If not auto-hiding, still allow but flag
    return {
      allowed: true,
      reason: 'Content may contain inappropriate material',
      score: result.unsafeScore
    }
  }

  /**
   * Quick check (faster, less accurate)
   */
  async quickCheck(
    video: HTMLVideoElement
  ): Promise<boolean> {
    const result = await this.checkContent(video, {
      sampleRate: 0.5, // Lower sample rate
      maxFrames: 10,
      threshold: 0.8 // Higher threshold for quick check
    })

    return result.isSafe
  }
}

// Singleton instance
let moderationServiceInstance: ModerationService | null = null

export function getModerationService(): ModerationService {
  if (!moderationServiceInstance) {
    moderationServiceInstance = new ModerationService()
  }
  return moderationServiceInstance
}


