/**
 * Video Compression System
 * 
 * Automatic video compression before storage using FFmpeg.js.
 * Supports multiple quality tiers and adaptive compression.
 */

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

export interface CompressionOptions {
  quality: 'original' | 'high' | 'medium' | 'low'
  format: 'mp4' | 'webm'
  bitrate?: number
  resolution?: { width: number; height: number }
}

export interface CompressionResult {
  compressed: Blob
  originalSize: number
  compressedSize: number
  compressionRatio: number
  processingTime: number
}

class VideoCompressor {
  private ffmpeg: FFmpeg | null = null
  private initialized = false

  /**
   * Initialize FFmpeg
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      this.ffmpeg = new FFmpeg()
      await this.ffmpeg.load()
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize FFmpeg:', error)
      throw error
    }
  }

  /**
   * Compress a video file
   */
  async compressVideo(
    videoFile: File | Blob,
    options: CompressionOptions = { quality: 'medium', format: 'mp4' }
  ): Promise<CompressionResult> {
    if (!this.initialized) {
      await this.init()
    }

    if (!this.ffmpeg) {
      throw new Error('FFmpeg not initialized')
    }

    const startTime = performance.now()
    const originalSize = videoFile.size

    try {
      // Write input file
      const inputName = 'input.mp4'
      await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile))

      // Determine compression parameters
      const params = this.getCompressionParams(options)

      // Execute compression
      const outputName = `output.${options.format}`
      await this.ffmpeg.exec([
        '-i', inputName,
        ...params,
        outputName
      ])

      // Read output file
      const data = await this.ffmpeg.readFile(outputName)
      const compressed = new Blob([data], { type: `video/${options.format}` })

      // Cleanup
      await this.ffmpeg.deleteFile(inputName)
      await this.ffmpeg.deleteFile(outputName)

      const processingTime = performance.now() - startTime
      const compressedSize = compressed.size
      const compressionRatio = compressedSize / originalSize

      return {
        compressed,
        originalSize,
        compressedSize,
        compressionRatio,
        processingTime
      }
    } catch (error) {
      console.error('Video compression failed:', error)
      throw error
    }
  }

  /**
   * Get compression parameters based on quality
   */
  private getCompressionParams(options: CompressionOptions): string[] {
    const params: string[] = []

    // Quality-based bitrate
    const bitrates: Record<string, number> = {
      original: 5000,
      high: 3000,
      medium: 1500,
      low: 800
    }

    const bitrate = options.bitrate || bitrates[options.quality] || 1500
    params.push('-b:v', `${bitrate}k`)

    // Resolution scaling if specified
    if (options.resolution) {
      params.push('-vf', `scale=${options.resolution.width}:${options.resolution.height}`)
    } else if (options.quality !== 'original') {
      // Scale down for lower quality
      const scale = options.quality === 'low' ? '0.5' : options.quality === 'medium' ? '0.75' : '1.0'
      params.push('-vf', `scale=iw*${scale}:ih*${scale}`)
    }

    // Codec settings
    if (options.format === 'mp4') {
      params.push('-c:v', 'libx264')
      params.push('-preset', 'medium')
      params.push('-crf', options.quality === 'high' ? '23' : options.quality === 'medium' ? '28' : '32')
    } else if (options.format === 'webm') {
      params.push('-c:v', 'libvpx-vp9')
      params.push('-b:v', `${bitrate}k`)
    }

    // Audio settings
    params.push('-c:a', 'aac')
    params.push('-b:a', '128k')

    return params
  }

  /**
   * Get estimated compression ratio
   */
  getEstimatedCompressionRatio(quality: CompressionOptions['quality']): number {
    const ratios: Record<string, number> = {
      original: 1.0,
      high: 0.6,
      medium: 0.4,
      low: 0.2
    }
    return ratios[quality] || 0.4
  }
}

// Singleton instance
let compressorInstance: VideoCompressor | null = null

export function getVideoCompressor(): VideoCompressor {
  if (!compressorInstance) {
    compressorInstance = new VideoCompressor()
  }
  return compressorInstance
}

export default VideoCompressor




