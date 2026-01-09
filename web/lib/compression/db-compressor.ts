/**
 * Database Compression System
 * 
 * Compresses database files before uploading to Telegram.
 * Uses gzip/brotli compression for JSON data.
 */

import pako from 'pako'

export interface CompressionOptions {
  algorithm: 'gzip' | 'brotli'
  level?: number // 0-9 for gzip, 0-11 for brotli
}

export interface CompressionResult {
  compressed: Uint8Array
  originalSize: number
  compressedSize: number
  compressionRatio: number
  algorithm: string
}

class DatabaseCompressor {
  /**
   * Compress data
   */
  compress(
    data: string | Uint8Array | ArrayBuffer,
    options: CompressionOptions = { algorithm: 'gzip', level: 6 }
  ): CompressionResult {
    const input = typeof data === 'string' 
      ? new TextEncoder().encode(data)
      : data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : data

    const originalSize = input.length
    let compressed: Uint8Array
    let algorithm: string

    if (options.algorithm === 'gzip') {
      compressed = pako.gzip(input, { level: options.level || 6 })
      algorithm = 'gzip'
    } else {
      // Brotli is not available in pako, fallback to gzip
      compressed = pako.gzip(input, { level: options.level || 6 })
      algorithm = 'gzip' // Fallback
    }

    const compressedSize = compressed.length
    const compressionRatio = compressedSize / originalSize

    return {
      compressed,
      originalSize,
      compressedSize,
      compressionRatio,
      algorithm
    }
  }

  /**
   * Decompress data
   */
  decompress(compressed: Uint8Array, algorithm: 'gzip' | 'brotli' = 'gzip'): Uint8Array {
    if (algorithm === 'gzip') {
      return pako.ungzip(compressed)
    } else {
      // Brotli fallback
      return pako.ungzip(compressed)
    }
  }

  /**
   * Compress JSON data
   */
  compressJSON(
    data: any,
    options: CompressionOptions = { algorithm: 'gzip', level: 6 }
  ): CompressionResult {
    const jsonString = JSON.stringify(data)
    return this.compress(jsonString, options)
  }

  /**
   * Decompress JSON data
   */
  decompressJSON(compressed: Uint8Array, algorithm: 'gzip' | 'brotli' = 'gzip'): any {
    const decompressed = this.decompress(compressed, algorithm)
    const jsonString = new TextDecoder().decode(decompressed)
    return JSON.parse(jsonString)
  }

  /**
   * Get compression statistics
   */
  getCompressionStats(
    originalSize: number,
    compressedSize: number
  ): {
    ratio: number
    savings: number
    savingsPercent: number
  } {
    const ratio = compressedSize / originalSize
    const savings = originalSize - compressedSize
    const savingsPercent = (savings / originalSize) * 100

    return {
      ratio,
      savings,
      savingsPercent
    }
  }
}

// Singleton instance
let compressorInstance: DatabaseCompressor | null = null

export function getDatabaseCompressor(): DatabaseCompressor {
  if (!compressorInstance) {
    compressorInstance = new DatabaseCompressor()
  }
  return compressorInstance
}

export default DatabaseCompressor




