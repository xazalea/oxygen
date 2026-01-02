/**
 * Feature Extraction Service
 * 
 * Extracts feature vectors/embeddings from videos for recommendation and similarity matching.
 */

import { getInferenceEngine } from './inference-engine'
import { VideoProcessor, FrameData } from './video-processor'
import { MODEL_CONFIGS } from './client-models'

export interface VideoFeatures {
  embedding: Float32Array // Main feature vector
  frameFeatures: Float32Array[] // Per-frame features
  averageFeatures: Float32Array // Average of all frame features
  temporalFeatures?: Float32Array // Temporal/motion features
}

export interface ExtractionOptions {
  sampleRate?: number // frames per second
  maxFrames?: number
  includeTemporal?: boolean
}

export class FeatureExtractor {
  private inferenceEngine = getInferenceEngine()
  private videoProcessor = new VideoProcessor()
  private readonly FEATURE_MODEL = 'feature_extractor'

  /**
   * Extract features from video element
   */
  async extractFromVideo(
    video: HTMLVideoElement,
    options: ExtractionOptions = {}
  ): Promise<VideoFeatures> {
    const {
      sampleRate = 1,
      maxFrames = 30,
      includeTemporal = false
    } = options

    // Extract frames
    const frames = await this.videoProcessor.extractFrames(video, {
      sampleRate,
      maxFrames,
      targetSize: MODEL_CONFIGS[this.FEATURE_MODEL].inputSize
    })

    // Extract features from each frame
    const frameFeatures: Float32Array[] = []
    for (const frame of frames) {
      const features = await this.inferenceEngine.extractFeatures(
        this.FEATURE_MODEL,
        frame.imageData
      )
      frameFeatures.push(features)
    }

    // Compute average features
    const averageFeatures = this.averageFeatures(frameFeatures)

    // Compute temporal features if requested
    let temporalFeatures: Float32Array | undefined
    if (includeTemporal && frameFeatures.length > 1) {
      temporalFeatures = this.computeTemporalFeatures(frameFeatures)
    }

    // Use average as main embedding (or could use a learned aggregation)
    const embedding = averageFeatures

    return {
      embedding,
      frameFeatures,
      averageFeatures,
      temporalFeatures
    }
  }

  /**
   * Extract features from video URL
   */
  async extractFromURL(
    videoUrl: string,
    options: ExtractionOptions = {}
  ): Promise<VideoFeatures> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.preload = 'auto'

      video.addEventListener('loadedmetadata', async () => {
        try {
          const features = await this.extractFromVideo(video, options)
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
   * Extract features from a single image
   */
  async extractFromImage(imageData: ImageData): Promise<Float32Array> {
    return await this.inferenceEngine.extractFeatures(
      this.FEATURE_MODEL,
      imageData
    )
  }

  /**
   * Compute average of feature vectors
   */
  private averageFeatures(features: Float32Array[]): Float32Array {
    if (features.length === 0) {
      throw new Error('No features to average')
    }

    const featureSize = features[0].length
    const average = new Float32Array(featureSize)

    for (const feature of features) {
      for (let i = 0; i < featureSize; i++) {
        average[i] += feature[i]
      }
    }

    // Divide by count
    for (let i = 0; i < featureSize; i++) {
      average[i] /= features.length
    }

    return average
  }

  /**
   * Compute temporal features (motion, pace, etc.)
   */
  private computeTemporalFeatures(features: Float32Array[]): Float32Array {
    if (features.length < 2) {
      return new Float32Array(features[0]?.length || 0)
    }

    const featureSize = features[0].length
    const temporal = new Float32Array(featureSize)

    // Compute differences between consecutive frames
    for (let i = 1; i < features.length; i++) {
      const diff = new Float32Array(featureSize)
      for (let j = 0; j < featureSize; j++) {
        diff[j] = features[i][j] - features[i - 1][j]
      }

      // Accumulate (could use different aggregation methods)
      for (let j = 0; j < featureSize; j++) {
        temporal[j] += Math.abs(diff[j])
      }
    }

    // Normalize by number of differences
    const numDiffs = features.length - 1
    for (let i = 0; i < featureSize; i++) {
      temporal[i] /= numDiffs
    }

    return temporal
  }

  /**
   * Compute cosine similarity between two feature vectors
   */
  cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) {
      throw new Error('Feature vectors must have same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB)
    if (denominator === 0) return 0

    return dotProduct / denominator
  }

  /**
   * Find most similar videos based on features
   */
  findSimilar(
    queryFeatures: Float32Array,
    candidateFeatures: Array<{ id: string; features: Float32Array }>,
    topK: number = 10
  ): Array<{ id: string; similarity: number }> {
    const similarities = candidateFeatures.map(candidate => ({
      id: candidate.id,
      similarity: this.cosineSimilarity(queryFeatures, candidate.features)
    }))

    // Sort by similarity (descending)
    similarities.sort((a, b) => b.similarity - a.similarity)

    return similarities.slice(0, topK)
  }
}

// Singleton instance
let featureExtractorInstance: FeatureExtractor | null = null

export function getFeatureExtractor(): FeatureExtractor {
  if (!featureExtractorInstance) {
    featureExtractorInstance = new FeatureExtractor()
  }
  return featureExtractorInstance
}

