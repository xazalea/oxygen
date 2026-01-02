/**
 * Video Classification Service
 * 
 * Classifies videos by category, topic, and content type using ClassyVision models.
 */

import { getInferenceEngine } from './inference-engine'
import { VideoProcessor, FrameData } from './video-processor'
import { MODEL_CONFIGS, VIDEO_CATEGORIES } from './client-models'

export interface ClassificationResult {
  category: string
  categoryIndex: number
  confidence: number
  allPredictions: Array<{
    category: string
    categoryIndex: number
    confidence: number
  }>
  processingTime: number
}

export interface ClassificationOptions {
  sampleRate?: number
  maxFrames?: number
  topK?: number
  threshold?: number
}

export class ClassificationService {
  private inferenceEngine = getInferenceEngine()
  private videoProcessor = new VideoProcessor()
  private readonly CLASSIFICATION_MODEL = 'video_classifier'

  /**
   * Classify video element
   */
  async classifyVideo(
    video: HTMLVideoElement,
    options: ClassificationOptions = {}
  ): Promise<ClassificationResult> {
    const {
      sampleRate = 1,
      maxFrames = 10,
      topK = 5,
      threshold = 0.1
    } = options

    const startTime = performance.now()

    // Extract frames
    const frames = await this.videoProcessor.extractFrames(video, {
      sampleRate,
      maxFrames,
      targetSize: MODEL_CONFIGS[this.CLASSIFICATION_MODEL].inputSize
    })

    if (frames.length === 0) {
      throw new Error('No frames extracted from video')
    }

    // Run inference on frames
    const results = await this.inferenceEngine.inferVideo(
      this.CLASSIFICATION_MODEL,
      frames,
      { topK, threshold }
    )

    // Aggregate predictions across frames
    const aggregated = this.aggregatePredictions(results)

    // Get top prediction
    const topPrediction = aggregated[0]

    const processingTime = performance.now() - startTime

    return {
      category: VIDEO_CATEGORIES[topPrediction.classIndex] || `Category ${topPrediction.classIndex}`,
      categoryIndex: topPrediction.classIndex,
      confidence: topPrediction.confidence,
      allPredictions: aggregated.map(pred => ({
        category: VIDEO_CATEGORIES[pred.classIndex] || `Category ${pred.classIndex}`,
        categoryIndex: pred.classIndex,
        confidence: pred.confidence
      })),
      processingTime
    }
  }

  /**
   * Classify video from URL
   */
  async classifyVideoURL(
    videoUrl: string,
    options: ClassificationOptions = {}
  ): Promise<ClassificationResult> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.preload = 'auto'

      video.addEventListener('loadedmetadata', async () => {
        try {
          const result = await this.classifyVideo(video, options)
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
   * Classify a single image/frame
   */
  async classifyImage(
    imageData: ImageData,
    options: { topK?: number; threshold?: number } = {}
  ): Promise<ClassificationResult> {
    const { topK = 5, threshold = 0.1 } = options
    const startTime = performance.now()

    const result = await this.inferenceEngine.inferImage(
      this.CLASSIFICATION_MODEL,
      imageData,
      { topK, threshold }
    )

    const topPrediction = result.predictions[0]

    const processingTime = performance.now() - startTime

    return {
      category: VIDEO_CATEGORIES[topPrediction.classIndex] || `Category ${topPrediction.classIndex}`,
      categoryIndex: topPrediction.classIndex,
      confidence: topPrediction.confidence,
      allPredictions: result.predictions.map(pred => ({
        category: VIDEO_CATEGORIES[pred.classIndex] || `Category ${pred.classIndex}`,
        categoryIndex: pred.classIndex,
        confidence: pred.confidence
      })),
      processingTime
    }
  }

  /**
   * Aggregate predictions across multiple frames
   */
  private aggregatePredictions(
    results: Array<{ predictions: Array<{ classIndex: number; confidence: number }> }>
  ): Array<{ classIndex: number; confidence: number }> {
    // Aggregate by averaging confidence scores for each class
    const classScores = new Map<number, { sum: number; count: number }>()

    for (const result of results) {
      for (const pred of result.predictions) {
        const existing = classScores.get(pred.classIndex)
        if (existing) {
          existing.sum += pred.confidence
          existing.count += 1
        } else {
          classScores.set(pred.classIndex, {
            sum: pred.confidence,
            count: 1
          })
        }
      }
    }

    // Compute averages and sort
    const aggregated = Array.from(classScores.entries())
      .map(([classIndex, { sum, count }]) => ({
        classIndex,
        confidence: sum / count
      }))
      .sort((a, b) => b.confidence - a.confidence)

    return aggregated
  }

  /**
   * Get category tags for a video
   */
  async getCategoryTags(
    video: HTMLVideoElement,
    options: ClassificationOptions = {}
  ): Promise<string[]> {
    const result = await this.classifyVideo(video, options)
    
    // Return top categories above threshold
    return result.allPredictions
      .filter(p => p.confidence >= (options.threshold || 0.1))
      .map(p => p.category)
  }
}

// Singleton instance
let classificationServiceInstance: ClassificationService | null = null

export function getClassificationService(): ClassificationService {
  if (!classificationServiceInstance) {
    classificationServiceInstance = new ClassificationService()
  }
  return classificationServiceInstance
}

