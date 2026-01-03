/**
 * Video Frame Processor
 * 
 * Extracts and preprocesses frames from videos for model inference.
 * Optimized for browser performance with frame sampling and batching.
 */

export interface FrameData {
  imageData: ImageData
  timestamp: number // in seconds
  frameIndex: number
}

export interface ProcessingOptions {
  sampleRate?: number // frames per second to extract (default: 1)
  maxFrames?: number // maximum number of frames to process
  targetSize?: [number, number] // [width, height]
  batchSize?: number // frames per batch
}

export class VideoProcessor {
  private canvas: OffscreenCanvas | HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null

  constructor() {
    // Initialize canvas for frame extraction
    if (typeof OffscreenCanvas !== 'undefined') {
      this.canvas = new OffscreenCanvas(224, 224)
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D
    } else {
      this.canvas = document.createElement('canvas')
      this.canvas.width = 224
      this.canvas.height = 224
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })
    }
  }

  /**
   * Extract frames from video element
   */
  async extractFrames(
    video: HTMLVideoElement,
    options: ProcessingOptions = {}
  ): Promise<FrameData[]> {
    const {
      sampleRate = 1, // 1 frame per second
      maxFrames = 30,
      targetSize = [224, 224]
    } = options

    const frames: FrameData[] = []
    const duration = video.duration
    const frameInterval = 1 / sampleRate // seconds between frames

    // Set canvas size
    if (this.canvas) {
      this.canvas.width = targetSize[0]
      this.canvas.height = targetSize[1]
    }

    for (let time = 0; time < duration && frames.length < maxFrames; time += frameInterval) {
      try {
        const frame = await this.extractFrameAtTime(video, time, targetSize)
        if (frame) {
          frames.push({
            imageData: frame,
            timestamp: time,
            frameIndex: frames.length
          })
        }
      } catch (error) {
        console.warn(`Failed to extract frame at ${time}s:`, error)
      }
    }

    return frames
  }

  /**
   * Extract a single frame at a specific time
   */
  private async extractFrameAtTime(
    video: HTMLVideoElement,
    time: number,
    targetSize: [number, number]
  ): Promise<ImageData | null> {
    return new Promise((resolve, reject) => {
      const currentTime = video.currentTime
      const seeking = time !== currentTime

      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked)
        try {
          if (this.ctx && this.canvas) {
            this.canvas.width = targetSize[0]
            this.canvas.height = targetSize[1]
            
            // Calculate aspect ratio preserving dimensions
            const videoAspect = video.videoWidth / video.videoHeight
            const targetAspect = targetSize[0] / targetSize[1]
            
            let drawWidth = targetSize[0]
            let drawHeight = targetSize[1]
            let offsetX = 0
            let offsetY = 0

            if (videoAspect > targetAspect) {
              // Video is wider - fit to height
              drawHeight = targetSize[1]
              drawWidth = drawHeight * videoAspect
              offsetX = (targetSize[0] - drawWidth) / 2
            } else {
              // Video is taller - fit to width
              drawWidth = targetSize[0]
              drawHeight = drawWidth / videoAspect
              offsetY = (targetSize[1] - drawHeight) / 2
            }

            // Clear canvas
            this.ctx.fillStyle = '#000000'
            this.ctx.fillRect(0, 0, targetSize[0], targetSize[1])
            
            // Draw video frame
            this.ctx.drawImage(
              video,
              offsetX,
              offsetY,
              drawWidth,
              drawHeight
            )

            // Extract image data
            const imageData = this.ctx.getImageData(0, 0, targetSize[0], targetSize[1])
            resolve(imageData)
          } else {
            reject(new Error('Canvas context not available'))
          }
        } catch (error) {
          reject(error)
        }
      }

      if (seeking) {
        video.addEventListener('seeked', onSeeked, { once: true })
        video.currentTime = time
      } else {
        onSeeked()
      }
    })
  }

  /**
   * Preprocess frame for model input
   * Normalizes pixel values and converts to tensor format
   */
  preprocessFrame(
    imageData: ImageData,
    mean: number[] = [0.485, 0.456, 0.406],
    std: number[] = [0.229, 0.224, 0.225]
  ): Float32Array {
    const { data, width, height } = imageData
    const channels = 3
    const size = width * height * channels
    const tensor = new Float32Array(size)

    // Convert RGBA to RGB and normalize
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4] / 255.0
      const g = data[i * 4 + 1] / 255.0
      const b = data[i * 4 + 2] / 255.0

      // Normalize with mean and std
      const rNorm = (r - mean[0]) / std[0]
      const gNorm = (g - mean[1]) / std[1]
      const bNorm = (b - mean[2]) / std[2]

      // CHW format (channels first)
      tensor[i] = rNorm
      tensor[i + width * height] = gNorm
      tensor[i + 2 * width * height] = bNorm
    }

    return tensor
  }

  /**
   * Preprocess batch of frames
   */
  preprocessBatch(
    frames: FrameData[],
    mean: number[] = [0.485, 0.456, 0.406],
    std: number[] = [0.229, 0.224, 0.225]
  ): Float32Array {
    const batchSize = frames.length
    const [width, height] = [224, 224] // Assuming standard input size
    const channels = 3
    const size = batchSize * channels * width * height
    const tensor = new Float32Array(size)

    frames.forEach((frame, batchIdx) => {
      const preprocessed = this.preprocessFrame(frame.imageData, mean, std)
      const frameSize = channels * width * height
      tensor.set(preprocessed, batchIdx * frameSize)
    })

    return tensor
  }

  /**
   * Extract frames from video URL (for server-side processing)
   */
  async extractFramesFromURL(
    videoUrl: string,
    options: ProcessingOptions = {}
  ): Promise<FrameData[]> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.preload = 'auto'

      video.addEventListener('loadedmetadata', async () => {
        try {
          const frames = await this.extractFrames(video, options)
          resolve(frames)
        } catch (error) {
          reject(error)
        }
      })

      video.addEventListener('error', reject)
      video.src = videoUrl
    })
  }
}


