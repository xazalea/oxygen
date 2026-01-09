/**
 * Performance Monitoring
 * 
 * Tracks performance metrics for the application.
 */

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
  tags?: Record<string, string>
}

export interface PerformanceStats {
  videoLoadTime: number[]
  apiResponseTime: number[]
  errorCount: number
  userEngagement: {
    avgWatchTime: number
    completionRate: number
  }
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private maxMetrics: number = 1000
  private stats: PerformanceStats = {
    videoLoadTime: [],
    apiResponseTime: [],
    errorCount: 0,
    userEngagement: {
      avgWatchTime: 0,
      completionRate: 0
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, unit: string = 'ms', tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags
    }

    this.metrics.push(metric)

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Update stats based on metric type
    this.updateStats(metric)
  }

  /**
   * Record video load time
   */
  recordVideoLoadTime(videoId: string, loadTime: number): void {
    this.recordMetric('video_load_time', loadTime, 'ms', { videoId })
    this.stats.videoLoadTime.push(loadTime)
    
    // Keep only last 100
    if (this.stats.videoLoadTime.length > 100) {
      this.stats.videoLoadTime = this.stats.videoLoadTime.slice(-100)
    }
  }

  /**
   * Record API response time
   */
  recordAPIResponseTime(endpoint: string, responseTime: number): void {
    this.recordMetric('api_response_time', responseTime, 'ms', { endpoint })
    this.stats.apiResponseTime.push(responseTime)
    
    // Keep only last 100
    if (this.stats.apiResponseTime.length > 100) {
      this.stats.apiResponseTime = this.stats.apiResponseTime.slice(-100)
    }
  }

  /**
   * Record error
   */
  recordError(error: Error, context?: Record<string, string>): void {
    this.stats.errorCount++
    this.recordMetric('error', 1, 'count', {
      errorName: error.name,
      errorMessage: error.message,
      ...context
    })
  }

  /**
   * Record user engagement
   */
  recordEngagement(watchTime: number, completionRate: number): void {
    // Update running averages
    const currentAvg = this.stats.userEngagement.avgWatchTime
    const count = this.stats.videoLoadTime.length || 1
    this.stats.userEngagement.avgWatchTime = 
      (currentAvg * (count - 1) + watchTime) / count

    const currentCompletion = this.stats.userEngagement.completionRate
    this.stats.userEngagement.completionRate = 
      (currentCompletion * (count - 1) + completionRate) / count
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats & {
    avgVideoLoadTime: number
    avgAPIResponseTime: number
    p95VideoLoadTime: number
    p95APIResponseTime: number
  } {
    const avgVideoLoadTime = this.stats.videoLoadTime.length > 0
      ? this.stats.videoLoadTime.reduce((a, b) => a + b, 0) / this.stats.videoLoadTime.length
      : 0

    const avgAPIResponseTime = this.stats.apiResponseTime.length > 0
      ? this.stats.apiResponseTime.reduce((a, b) => a + b, 0) / this.stats.apiResponseTime.length
      : 0

    const p95VideoLoadTime = this.getPercentile(this.stats.videoLoadTime, 95)
    const p95APIResponseTime = this.getPercentile(this.stats.apiResponseTime, 95)

    return {
      ...this.stats,
      avgVideoLoadTime,
      avgAPIResponseTime,
      p95VideoLoadTime,
      p95APIResponseTime
    }
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(limit: number = 100): PerformanceMetric[] {
    return this.metrics.slice(-limit)
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name)
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
    this.stats = {
      videoLoadTime: [],
      apiResponseTime: [],
      errorCount: 0,
      userEngagement: {
        avgWatchTime: 0,
        completionRate: 0
      }
    }
  }

  /**
   * Update stats based on metric
   */
  private updateStats(metric: PerformanceMetric): void {
    // Stats are updated in specific record methods
  }

  /**
   * Calculate percentile
   */
  private getPercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0
    
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }
}

// Singleton instance
let monitorInstance: PerformanceMonitor | null = null

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor()
  }
  return monitorInstance
}




