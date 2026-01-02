/**
 * Storage Optimization System
 * 
 * Optimizes storage usage across all content:
 * - Deduplication of similar content
 * - Smart caching of compressed versions
 * - Storage quota management
 * - Cleanup of unused/old content
 */

import { getVideoCompressor, CompressionResult } from './video-compressor'
import { getDatabaseCompressor } from './db-compressor'

export interface StorageStats {
  totalSize: number
  compressedSize: number
  savings: number
  savingsPercent: number
  items: number
  duplicates: number
}

export interface DeduplicationResult {
  removed: number
  saved: number
  duplicates: Array<{ original: string; duplicate: string }>
}

class StorageOptimizer {
  private videoCompressor = getVideoCompressor()
  private dbCompressor = getDatabaseCompressor()
  private cache: Map<string, { data: Blob; timestamp: number }> = new Map()
  private cacheExpiry = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Optimize video storage
   */
  async optimizeVideo(video: File | Blob, quality: 'high' | 'medium' | 'low' = 'medium'): Promise<CompressionResult> {
    const compressor = getVideoCompressor()
    return compressor.compressVideo(video, { quality, format: 'mp4' })
  }

  /**
   * Optimize database storage
   */
  optimizeDatabase(data: any): { compressed: Uint8Array; stats: StorageStats } {
    const compressor = getDatabaseCompressor()
    const result = compressor.compressJSON(data)
    
    const stats: StorageStats = {
      totalSize: result.originalSize,
      compressedSize: result.compressedSize,
      savings: result.originalSize - result.compressedSize,
      savingsPercent: (1 - result.compressionRatio) * 100,
      items: Array.isArray(data) ? data.length : 1,
      duplicates: 0
    }

    return {
      compressed: result.compressed,
      stats
    }
  }

  /**
   * Deduplicate content
   */
  async deduplicate(items: Array<{ id: string; hash?: string; size: number }>): Promise<DeduplicationResult> {
    const duplicates: Array<{ original: string; duplicate: string }> = []
    const seen = new Map<string, string>() // hash -> id

    for (const item of items) {
      if (item.hash) {
        if (seen.has(item.hash)) {
          const originalId = seen.get(item.hash)!
          duplicates.push({ original: originalId, duplicate: item.id })
        } else {
          seen.set(item.hash, item.id)
        }
      }
    }

    const saved = duplicates.reduce((sum, dup) => {
      const item = items.find(i => i.id === dup.duplicate)
      return sum + (item?.size || 0)
    }, 0)

    return {
      removed: duplicates.length,
      saved,
      duplicates
    }
  }

  /**
   * Cache compressed content
   */
  cacheCompressed(key: string, data: Blob): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Get cached compressed content
   */
  getCached(key: string): Blob | null {
    const cached = this.cache.get(key)
    if (!cached) {
      return null
    }

    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * Cleanup old cache entries
   */
  cleanupCache(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get storage statistics
   */
  getStorageStats(items: Array<{ size: number; compressedSize?: number }>): StorageStats {
    const totalSize = items.reduce((sum, item) => sum + item.size, 0)
    const compressedSize = items.reduce(
      (sum, item) => sum + (item.compressedSize || item.size),
      0
    )
    const savings = totalSize - compressedSize
    const savingsPercent = totalSize > 0 ? (savings / totalSize) * 100 : 0

    return {
      totalSize,
      compressedSize,
      savings,
      savingsPercent,
      items: items.length,
      duplicates: 0
    }
  }

  /**
   * Manage storage quota
   */
  async manageQuota(
    items: Array<{ id: string; size: number; lastAccessed: number }>,
    maxSize: number
  ): Promise<{ removed: string[]; freed: number }> {
    const sorted = [...items].sort((a, b) => a.lastAccessed - b.lastAccessed)
    const currentSize = sorted.reduce((sum, item) => sum + item.size, 0)
    
    if (currentSize <= maxSize) {
      return { removed: [], freed: 0 }
    }

    const toRemove: string[] = []
    let freed = 0
    let remainingSize = currentSize

    for (const item of sorted) {
      if (remainingSize <= maxSize) {
        break
      }
      toRemove.push(item.id)
      freed += item.size
      remainingSize -= item.size
    }

    return { removed: toRemove, freed }
  }
}

// Singleton instance
let optimizerInstance: StorageOptimizer | null = null

export function getStorageOptimizer(): StorageOptimizer {
  if (!optimizerInstance) {
    optimizerInstance = new StorageOptimizer()
    // Cleanup cache periodically
    setInterval(() => {
      optimizerInstance?.cleanupCache()
    }, 60 * 60 * 1000) // Every hour
  }
  return optimizerInstance
}

export default StorageOptimizer

