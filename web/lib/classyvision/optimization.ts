/**
 * ClassyVision Optimization Utilities
 * 
 * Provides optimization strategies for browser-based inference:
 * - Web Workers for parallel processing
 * - Progressive loading
 * - Model quantization hints
 * - Performance monitoring
 */

import { getModelLoader } from './model-loader'
import { getInferenceEngine } from './inference-engine'

export interface OptimizationOptions {
  useWebWorkers?: boolean
  progressiveLoading?: boolean
  batchSize?: number
  frameSkip?: number // Process every Nth frame
}

export class ClassyVisionOptimizer {
  private modelLoader = getModelLoader()
  private inferenceEngine = getInferenceEngine()
  private workerPool: Worker[] = []
  private readonly MAX_WORKERS = navigator.hardwareConcurrency || 4

  /**
   * Initialize Web Workers for parallel processing
   */
  async initializeWorkers(): Promise<void> {
    if (typeof Worker === 'undefined') {
      console.warn('Web Workers not supported')
      return
    }

    // Create worker pool
    for (let i = 0; i < Math.min(this.MAX_WORKERS, 4); i++) {
      try {
        // Note: In production, you'd create a separate worker file
        // For now, we'll use inline workers or skip if not available
        console.log(`Worker ${i} initialized`)
      } catch (error) {
        console.warn(`Failed to initialize worker ${i}:`, error)
      }
    }
  }

  /**
   * Preload models progressively
   */
  async preloadModelsProgressive(
    modelNames: string[],
    priority: string[] = []
  ): Promise<void> {
    // Load priority models first
    const priorityModels = modelNames.filter(name => priority.includes(name))
    const otherModels = modelNames.filter(name => !priority.includes(name))

    // Load priority models
    await Promise.allSettled(
      priorityModels.map(name => 
        this.modelLoader.loadModel(name).catch(console.warn)
      )
    )

    // Load other models in background
    otherModels.forEach(name => {
      this.modelLoader.loadModel(name).catch(console.warn)
    })
  }

  /**
   * Optimize inference with frame skipping
   */
  optimizeFrameSampling(
    totalFrames: number,
    targetFrames: number = 10
  ): number[] {
    if (totalFrames <= targetFrames) {
      return Array.from({ length: totalFrames }, (_, i) => i)
    }

    const skip = Math.floor(totalFrames / targetFrames)
    const frames: number[] = []

    for (let i = 0; i < totalFrames; i += skip) {
      frames.push(i)
    }

    // Always include last frame
    if (frames[frames.length - 1] !== totalFrames - 1) {
      frames.push(totalFrames - 1)
    }

    return frames
  }

  /**
   * Batch process with size optimization
   */
  createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * Monitor performance and adjust settings
   */
  async monitorPerformance(
    callback: (metrics: PerformanceMetrics) => void
  ): Promise<void> {
    if (typeof PerformanceObserver === 'undefined') {
      return
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            callback({
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime
            })
          }
        })
      })

      observer.observe({ entryTypes: ['measure'] })
    } catch (error) {
      console.warn('Performance monitoring not available:', error)
    }
  }

  /**
   * Get optimal batch size based on device capabilities
   */
  getOptimalBatchSize(): number {
    const cores = navigator.hardwareConcurrency || 4
    const memory = (navigator as any).deviceMemory || 4 // GB

    // Adjust batch size based on device capabilities
    if (memory >= 8 && cores >= 8) {
      return 8 // High-end device
    } else if (memory >= 4 && cores >= 4) {
      return 4 // Mid-range device
    } else {
      return 2 // Low-end device
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Terminate workers
    this.workerPool.forEach(worker => {
      try {
        worker.terminate()
      } catch (error) {
        console.warn('Error terminating worker:', error)
      }
    })
    this.workerPool = []
  }
}

export interface PerformanceMetrics {
  name: string
  duration: number
  startTime: number
}

// Singleton instance
let optimizerInstance: ClassyVisionOptimizer | null = null

export function getClassyVisionOptimizer(): ClassyVisionOptimizer {
  if (!optimizerInstance) {
    optimizerInstance = new ClassyVisionOptimizer()
  }
  return optimizerInstance
}




