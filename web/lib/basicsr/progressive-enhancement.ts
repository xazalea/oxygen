/**
 * Progressive Enhancement System
 * 
 * Shows original video immediately, enhances in background,
 * then swaps to enhanced version when ready.
 * Provides seamless transition with no user-visible delay.
 */

import { getEnhancementService } from '../enhancement-service'
import { getFastInferencePipeline } from './fast-inference'
import { EnhancementOptions } from '../basicsr-bridge'

export interface ProgressiveEnhancementResult {
  original: ImageData
  enhanced: ImageData | null
  isReady: boolean
  progress: number
}

class ProgressiveEnhancement {
  private enhancements = new Map<string, ProgressiveEnhancementResult>()
  private activeEnhancements = new Map<string, Promise<ImageData>>()

  /**
   * Start progressive enhancement for a video frame
   */
  async enhanceFrame(
    frameId: string,
    frame: ImageData | HTMLVideoElement | HTMLCanvasElement,
    options: EnhancementOptions = {}
  ): Promise<ProgressiveEnhancementResult> {
    // Return original immediately
    const original = this.getImageData(frame)
    const result: ProgressiveEnhancementResult = {
      original,
      enhanced: null,
      isReady: false,
      progress: 0
    }
    this.enhancements.set(frameId, result)

    // Start enhancement in background
    const enhancementPromise = this.performEnhancement(frame, options)
    this.activeEnhancements.set(frameId, enhancementPromise)

    enhancementPromise
      .then(enhanced => {
        result.enhanced = enhanced
        result.isReady = true
        result.progress = 100
        this.activeEnhancements.delete(frameId)
      })
      .catch(error => {
        console.error('Progressive enhancement failed:', error)
        this.activeEnhancements.delete(frameId)
      })

    return result
  }

  /**
   * Get current enhancement state
   */
  getEnhancement(frameId: string): ProgressiveEnhancementResult | null {
    return this.enhancements.get(frameId) || null
  }

  /**
   * Wait for enhancement to complete
   */
  async waitForEnhancement(frameId: string, timeout: number = 10000): Promise<ImageData | null> {
    const promise = this.activeEnhancements.get(frameId)
    if (!promise) {
      return this.enhancements.get(frameId)?.enhanced || null
    }

    try {
      const enhanced = await Promise.race([
        promise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), timeout))
      ])
      return enhanced
    } catch (error) {
      console.error('Enhancement wait failed:', error)
      return null
    }
  }

  /**
   * Perform the actual enhancement
   */
  private async performEnhancement(
    frame: ImageData | HTMLVideoElement | HTMLCanvasElement,
    options: EnhancementOptions
  ): Promise<ImageData> {
    const service = getEnhancementService()
    const pipeline = getFastInferencePipeline()

    // Use fast inference for speed
    const imageData = this.getImageData(frame)
    const result = await pipeline.infer(imageData, options)

    // Convert to ImageData
    if (result.enhanced instanceof ImageData) {
      return result.enhanced
    } else {
      // Assume it's Uint8Array
      const width = Math.sqrt(result.enhanced.length / 4)
      const height = width
      return new ImageData(
        new Uint8ClampedArray(result.enhanced),
        width,
        height
      )
    }
  }

  /**
   * Get ImageData from various sources
   */
  private getImageData(source: ImageData | HTMLVideoElement | HTMLCanvasElement): ImageData {
    if (source instanceof ImageData) {
      return source
    }

    const canvas = document.createElement('canvas')
    if (source instanceof HTMLVideoElement) {
      canvas.width = source.videoWidth
      canvas.height = source.videoHeight
    } else {
      canvas.width = source.width
      canvas.height = source.height
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Cannot get 2D context')
    }

    ctx.drawImage(source, 0, 0)
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  }

  /**
   * Clear enhancement cache
   */
  clearCache(): void {
    this.enhancements.clear()
    this.activeEnhancements.clear()
  }

  /**
   * Remove specific enhancement
   */
  removeEnhancement(frameId: string): void {
    this.enhancements.delete(frameId)
    this.activeEnhancements.delete(frameId)
  }
}

// Singleton instance
let enhancementInstance: ProgressiveEnhancement | null = null

export function getProgressiveEnhancement(): ProgressiveEnhancement {
  if (!enhancementInstance) {
    enhancementInstance = new ProgressiveEnhancement()
  }
  return enhancementInstance
}

export default ProgressiveEnhancement




