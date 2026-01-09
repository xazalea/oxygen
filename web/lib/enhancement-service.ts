/**
 * Video/Image Enhancement Service
 * 
 * Service to enhance videos and images using BasicSR.
 * Provides automatic enhancement for uploaded content and on-demand enhancement for viewing.
 */

import { getBasicSRBridge, EnhancementOptions, EnhancementResult } from './basicsr-bridge'

export interface EnhancementRequest {
  source: ImageData | Uint8Array | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  options?: EnhancementOptions
  priority?: 'low' | 'normal' | 'high'
}

export interface EnhancementCache {
  [key: string]: {
    result: EnhancementResult
    timestamp: number
    expiresAt: number
  }
}

class EnhancementService {
  private cache: EnhancementCache = {}
  private queue: EnhancementRequest[] = []
  private processing = false
  private cacheExpiry = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Enhance an image
   */
  async enhanceImage(
    image: ImageData | HTMLImageElement | HTMLCanvasElement,
    options: EnhancementOptions = {}
  ): Promise<EnhancementResult> {
    // Convert to ImageData if needed
    let imageData: ImageData
    if (image instanceof ImageData) {
      imageData = image
    } else if (image instanceof HTMLCanvasElement) {
      const ctx = image.getContext('2d')
      if (!ctx) {
        throw new Error('Cannot get 2D context from canvas')
      }
      imageData = ctx.getImageData(0, 0, image.width, image.height)
    } else if (image instanceof HTMLImageElement) {
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Cannot create canvas context')
      }
      ctx.drawImage(image, 0, 0)
      imageData = ctx.getImageData(0, 0, image.width, image.height)
    } else {
      throw new Error('Unsupported image type')
    }

    // Check cache
    const cacheKey = this.getCacheKey(imageData, options)
    const cached = this.cache[cacheKey]
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result
    }

    // Enhance using BasicSR
    const bridge = await getBasicSRBridge()
    const result = await bridge.enhanceImage(imageData, options)

    // Cache result
    this.cache[cacheKey] = {
      result,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.cacheExpiry
    }

    return result
  }

  /**
   * Enhance a video frame
   */
  async enhanceVideoFrame(
    frame: ImageData | HTMLVideoElement | HTMLCanvasElement,
    options: EnhancementOptions = {}
  ): Promise<EnhancementResult> {
    // Convert video frame to ImageData
    let imageData: ImageData
    if (frame instanceof ImageData) {
      imageData = frame
    } else if (frame instanceof HTMLVideoElement) {
      const canvas = document.createElement('canvas')
      canvas.width = frame.videoWidth
      canvas.height = frame.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Cannot create canvas context')
      }
      ctx.drawImage(frame, 0, 0)
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    } else if (frame instanceof HTMLCanvasElement) {
      const ctx = frame.getContext('2d')
      if (!ctx) {
        throw new Error('Cannot get 2D context from canvas')
      }
      imageData = ctx.getImageData(0, 0, frame.width, frame.height)
    } else {
      throw new Error('Unsupported frame type')
    }

    // Check cache
    const cacheKey = this.getCacheKey(imageData, options)
    const cached = this.cache[cacheKey]
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result
    }

    // Enhance using BasicSR
    const bridge = await getBasicSRBridge()
    const result = await bridge.enhanceVideoFrame(imageData, options)

    // Cache result
    this.cache[cacheKey] = {
      result,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.cacheExpiry
    }

    return result
  }

  /**
   * Queue an enhancement request
   */
  queueEnhancement(request: EnhancementRequest): Promise<EnhancementResult> {
    return new Promise((resolve, reject) => {
      const priority = request.priority || 'normal'
      const requestWithCallback = {
        ...request,
        resolve,
        reject
      }

      if (priority === 'high') {
        this.queue.unshift(requestWithCallback)
      } else {
        this.queue.push(requestWithCallback)
      }

      this.processQueue()
    })
  }

  /**
   * Process the enhancement queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    while (this.queue.length > 0) {
      const request = this.queue.shift()
      if (!request) {
        break
      }

      try {
        let result: EnhancementResult

        if (request.source instanceof HTMLVideoElement) {
          result = await this.enhanceVideoFrame(request.source, request.options)
        } else if (request.source instanceof HTMLImageElement || request.source instanceof HTMLCanvasElement) {
          result = await this.enhanceImage(request.source, request.options)
        } else if (request.source instanceof ImageData) {
          result = await this.enhanceImage(request.source, request.options)
        } else {
          // Assume it's Uint8Array
          const imageData = new ImageData(
            new Uint8ClampedArray(request.source),
            Math.sqrt(request.source.length / 4),
            Math.sqrt(request.source.length / 4)
          )
          result = await this.enhanceImage(imageData, request.options)
        }

        request.resolve(result)
      } catch (error) {
        request.reject(error)
      }
    }

    this.processing = false
  }

  /**
   * Generate cache key from image data and options
   */
  private getCacheKey(imageData: ImageData, options: EnhancementOptions): string {
    // Create a hash from image data and options
    const optionsStr = JSON.stringify(options)
    // Simple hash from first few pixels (for performance)
    const pixelHash = Array.from(imageData.data.slice(0, 100))
      .reduce((acc, val) => acc + val.toString(16), '')
    return `${pixelHash}-${optionsStr}`
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache = {}
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now()
    Object.keys(this.cache).forEach(key => {
      if (this.cache[key].expiresAt <= now) {
        delete this.cache[key]
      }
    })
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number
    entries: number
    oldestEntry: number | null
    newestEntry: number | null
  } {
    const entries = Object.values(this.cache)
    if (entries.length === 0) {
      return {
        size: 0,
        entries: 0,
        oldestEntry: null,
        newestEntry: null
      }
    }

    const timestamps = entries.map(e => e.timestamp)
    return {
      size: entries.reduce((acc, e) => acc + JSON.stringify(e.result).length, 0),
      entries: entries.length,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps)
    }
  }
}

// Singleton instance
let serviceInstance: EnhancementService | null = null

export function getEnhancementService(): EnhancementService {
  if (!serviceInstance) {
    serviceInstance = new EnhancementService()
    // Clear expired cache periodically
    setInterval(() => {
      serviceInstance?.clearExpiredCache()
    }, 60 * 60 * 1000) // Every hour
  }
  return serviceInstance
}

export default EnhancementService




