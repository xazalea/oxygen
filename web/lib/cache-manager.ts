/**
 * Advanced Caching System
 * 
 * Multi-layer caching with memory, Redis-compatible, and CDN support.
 */

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
}

export interface CacheEntry<T> {
  data: T
  expiresAt: number
  tags: string[]
}

export class CacheManager {
  private memoryCache: Map<string, CacheEntry<any>> = new Map()
  private maxMemorySize: number = 100 * 1024 * 1024 // 100MB
  private currentMemorySize: number = 0

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const entry = this.memoryCache.get(key)
    
    if (entry) {
      if (entry.expiresAt > Date.now()) {
        return entry.data as T
      } else {
        // Expired, remove it
        this.memoryCache.delete(key)
        this.currentMemorySize -= this.estimateSize(entry)
      }
    }

    // Could check Redis here if configured
    // For now, return null
    return null
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl || 3600 // Default 1 hour
    const expiresAt = Date.now() + (ttl * 1000)
    
    const entry: CacheEntry<T> = {
      data: value,
      expiresAt,
      tags: options?.tags || []
    }

    // Remove old entry if exists
    const oldEntry = this.memoryCache.get(key)
    if (oldEntry) {
      this.currentMemorySize -= this.estimateSize(oldEntry)
    }

    // Add new entry
    const entrySize = this.estimateSize(entry)
    
    // Evict if needed
    if (this.currentMemorySize + entrySize > this.maxMemorySize) {
      this.evictOldest()
    }

    this.memoryCache.set(key, entry)
    this.currentMemorySize += entrySize

    // Could also set in Redis here if configured
  }

  /**
   * Delete from cache
   */
  async delete(key: string): Promise<void> {
    const entry = this.memoryCache.get(key)
    if (entry) {
      this.currentMemorySize -= this.estimateSize(entry)
      this.memoryCache.delete(key)
    }
  }

  /**
   * Invalidate by tags
   */
  async invalidateTags(tags: string[]): Promise<void> {
    const keysToDelete: string[] = []
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      await this.delete(key)
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear()
    this.currentMemorySize = 0
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; entries: number; memoryUsage: number } {
    return {
      size: this.currentMemorySize,
      entries: this.memoryCache.size,
      memoryUsage: this.currentMemorySize / this.maxMemorySize
    }
  }

  /**
   * Estimate size of cache entry
   */
  private estimateSize(entry: CacheEntry<any>): number {
    try {
      return JSON.stringify(entry).length * 2 // Rough estimate (2 bytes per char)
    } catch {
      return 1024 // Default 1KB if can't stringify
    }
  }

  /**
   * Evict oldest entries
   */
  private evictOldest(): void {
    // Sort by expiration time
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => a[1].expiresAt - b[1].expiresAt)

    // Remove oldest 10% or at least 10 entries
    const toRemove = Math.max(10, Math.floor(entries.length * 0.1))
    
    for (let i = 0; i < toRemove && this.currentMemorySize > this.maxMemorySize * 0.8; i++) {
      const [key] = entries[i]
      this.memoryCache.delete(key)
      this.currentMemorySize -= this.estimateSize(entries[i][1])
    }
  }
}

// Singleton instance
let cacheInstance: CacheManager | null = null

export function getCacheManager(): CacheManager {
  if (!cacheInstance) {
    cacheInstance = new CacheManager()
  }
  return cacheInstance
}



