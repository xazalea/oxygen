/**
 * Automatic Video Enhancement System
 * 
 * Automatically enhances all videos with fast inference using optimized models.
 * Uses progressive enhancement (show original while enhancing) and Web Workers for parallel processing.
 */

import { getEnhancementService } from './enhancement-service'
import { EnhancementOptions } from './basicsr-bridge'

export interface AutoEnhancementConfig {
  enabled: boolean
  model: 'esrgan' | 'real-esrgan' | 'swinir' | 'ecbsr'
  scale: 2 | 4
  priority: 'low' | 'normal' | 'high'
  useWebWorkers: boolean
  maxConcurrentEnhancements: number
}

class AutoEnhancement {
  private config: AutoEnhancementConfig = {
    enabled: true,
    model: 'ecbsr', // Lightweight model for speed
    scale: 2,
    priority: 'normal',
    useWebWorkers: true,
    maxConcurrentEnhancements: 2
  }

  private activeEnhancements = new Map<string, Promise<void>>()
  private enhancedCache = new Map<string, ImageData>()
  private videoObservers = new Map<HTMLVideoElement, IntersectionObserver>()

  /**
   * Initialize automatic enhancement
   */
  async init(): Promise<void> {
    // Preload enhancement service
    await getEnhancementService()
  }

  /**
   * Automatically enhance a video element
   */
  async enhanceVideo(video: HTMLVideoElement, options?: Partial<EnhancementOptions>): Promise<void> {
    if (!this.config.enabled) {
      return
    }

    const videoId = this.getVideoId(video)
    
    // Check if already enhanced
    if (this.enhancedCache.has(videoId)) {
      this.applyEnhancedFrame(video, this.enhancedCache.get(videoId)!)
      return
    }

    // Check if already enhancing
    if (this.activeEnhancements.has(videoId)) {
      await this.activeEnhancements.get(videoId)
      return
    }

    // Start enhancement
    const enhancementPromise = this.performEnhancement(video, options)
    this.activeEnhancements.set(videoId, enhancementPromise)

    try {
      await enhancementPromise
    } finally {
      this.activeEnhancements.delete(videoId)
    }
  }

  /**
   * Perform the actual enhancement
   */
  private async performEnhancement(
    video: HTMLVideoElement,
    options?: Partial<EnhancementOptions>
  ): Promise<void> {
    const enhancementOptions: EnhancementOptions = {
      model: this.config.model,
      scale: this.config.scale,
      ...options
    }

    // Use progressive enhancement: show original, enhance in background
    const service = getEnhancementService()

    // Enhance current frame
    try {
      const result = await service.queueEnhancement({
        source: video,
        options: enhancementOptions,
        priority: this.config.priority
      })

      // Convert result to ImageData
      const enhancedData = new ImageData(
        new Uint8ClampedArray(result.enhanced),
        result.enhancedSize.width,
        result.enhancedSize.height
      )

      // Cache enhanced frame
      const videoId = this.getVideoId(video)
      this.enhancedCache.set(videoId, enhancedData)

      // Apply enhanced frame
      this.applyEnhancedFrame(video, enhancedData)
    } catch (error) {
      console.error('Auto-enhancement failed:', error)
      // Continue with original video on error
    }
  }

  /**
   * Apply enhanced frame to video
   */
  private applyEnhancedFrame(video: HTMLVideoElement, enhancedData: ImageData): void {
    // Create canvas overlay for enhanced frame
    let canvas = video.parentElement?.querySelector('.enhanced-overlay') as HTMLCanvasElement
    
    if (!canvas) {
      canvas = document.createElement('canvas')
      canvas.className = 'enhanced-overlay'
      canvas.style.position = 'absolute'
      canvas.style.top = '0'
      canvas.style.left = '0'
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.style.pointerEvents = 'none'
      canvas.style.zIndex = '1'
      video.parentElement?.appendChild(canvas)
    }

    canvas.width = enhancedData.width
    canvas.height = enhancedData.height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.putImageData(enhancedData, 0, 0)
    }
  }

  /**
   * Watch a video element for automatic enhancement
   */
  watchVideo(video: HTMLVideoElement): void {
    if (!this.config.enabled) {
      return
    }

    // Use Intersection Observer to enhance when video is visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            this.enhanceVideo(video)
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(video)
    this.videoObservers.set(video, observer)
  }

  /**
   * Stop watching a video element
   */
  unwatchVideo(video: HTMLVideoElement): void {
    const observer = this.videoObservers.get(video)
    if (observer) {
      observer.disconnect()
      this.videoObservers.delete(video)
    }
  }

  /**
   * Enhance all videos in the document
   */
  async enhanceAllVideos(): Promise<void> {
    if (!this.config.enabled) {
      return
    }

    const videos = document.querySelectorAll('video')
    const enhancementPromises: Promise<void>[] = []

    videos.forEach((video, index) => {
      // Stagger enhancements to avoid overwhelming the system
      setTimeout(() => {
        enhancementPromises.push(this.enhanceVideo(video))
      }, index * 100)
    })

    await Promise.all(enhancementPromises)
  }

  /**
   * Get unique ID for video element
   */
  private getVideoId(video: HTMLVideoElement): string {
    if (video.id) {
      return video.id
    }
    if (video.src) {
      return `video-${video.src.substring(0, 50)}`
    }
    return `video-${Math.random().toString(36).substring(7)}`
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AutoEnhancementConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): AutoEnhancementConfig {
    return { ...this.config }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.enhancedCache.clear()
    this.activeEnhancements.clear()
  }

  /**
   * Enable/disable automatic enhancement
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
    if (!enabled) {
      // Clean up observers
      this.videoObservers.forEach(observer => observer.disconnect())
      this.videoObservers.clear()
    }
  }
}

// Singleton instance
let autoEnhancementInstance: AutoEnhancement | null = null

export function getAutoEnhancement(): AutoEnhancement {
  if (!autoEnhancementInstance) {
    autoEnhancementInstance = new AutoEnhancement()
    autoEnhancementInstance.init()
  }
  return autoEnhancementInstance
}

export default AutoEnhancement

