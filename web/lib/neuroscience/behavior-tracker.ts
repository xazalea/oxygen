/**
 * Behavior Tracking System
 * 
 * Tracks micro-interactions, engagement metrics, cognitive load, and dopamine triggers.
 * Provides comprehensive behavior data for personalization and adaptation.
 */

export interface MouseMovement {
  x: number
  y: number
  timestamp: number
  element?: string
}

export interface ScrollPattern {
  direction: 'up' | 'down'
  speed: number
  distance: number
  timestamp: number
}

export interface DwellTime {
  element: string
  startTime: number
  endTime: number
  duration: number
}

export interface EngagementMetrics {
  likes: number
  shares: number
  comments: number
  watchTime: number
  interactions: number
  lastInteraction: number
}

export interface BehaviorData {
  mouseMovements: MouseMovement[]
  scrollPatterns: ScrollPattern[]
  dwellTimes: DwellTime[]
  engagementMetrics: EngagementMetrics
  attentionPatterns: {
    focusedElements: string[]
    skippedElements: string[]
    revisitedElements: string[]
  }
  cognitiveLoad: number
  dopamineTriggers: {
    type: string
    timestamp: number
    intensity: number
  }[]
}

class BehaviorTracker {
  private data: BehaviorData = {
    mouseMovements: [],
    scrollPatterns: [],
    dwellTimes: [],
    engagementMetrics: {
      likes: 0,
      shares: 0,
      comments: 0,
      watchTime: 0,
      interactions: 0,
      lastInteraction: 0
    },
    attentionPatterns: {
      focusedElements: [],
      skippedElements: [],
      revisitedElements: []
    },
    cognitiveLoad: 0,
    dopamineTriggers: []
  }

  private isTracking = false
  private currentDwell: Map<string, number> = new Map()
  private mouseMovementBuffer: MouseMovement[] = []
  private scrollBuffer: ScrollPattern[] = []
  private lastScrollY = 0
  private lastScrollTime = Date.now()

  /**
   * Start tracking behavior
   */
  startTracking(): void {
    if (this.isTracking) {
      return
    }

    this.isTracking = true
    this.setupEventListeners()
  }

  /**
   * Stop tracking behavior
   */
  stopTracking(): void {
    if (!this.isTracking) {
      return
    }

    this.isTracking = false
    this.removeEventListeners()
  }

  /**
   * Setup event listeners for tracking
   */
  private setupEventListeners(): void {
    // Mouse movement tracking
    document.addEventListener('mousemove', this.handleMouseMove)
    
    // Scroll tracking
    document.addEventListener('scroll', this.handleScroll, { passive: true })
    
    // Click tracking
    document.addEventListener('click', this.handleClick)
    
    // Focus tracking
    document.addEventListener('focusin', this.handleFocusIn)
    document.addEventListener('focusout', this.handleFocusOut)
    
    // Visibility tracking
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('scroll', this.handleScroll)
    document.removeEventListener('click', this.handleClick)
    document.removeEventListener('focusin', this.handleFocusIn)
    document.removeEventListener('focusout', this.handleFocusOut)
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
  }

  /**
   * Handle mouse movement
   */
  private handleMouseMove = (e: MouseEvent): void => {
    const movement: MouseMovement = {
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now(),
      element: (e.target as HTMLElement)?.tagName
    }

    this.mouseMovementBuffer.push(movement)

    // Batch process movements every 100ms
    if (this.mouseMovementBuffer.length >= 10) {
      this.processMouseMovements()
    }
  }

  /**
   * Process batched mouse movements
   */
  private processMouseMovements(): void {
    // Keep only recent movements (last 5 seconds)
    const fiveSecondsAgo = Date.now() - 5000
    this.data.mouseMovements = [
      ...this.data.mouseMovements.filter(m => m.timestamp > fiveSecondsAgo),
      ...this.mouseMovementBuffer
    ]
    this.mouseMovementBuffer = []
  }

  /**
   * Handle scroll events
   */
  private handleScroll = (): void => {
    const currentY = window.scrollY
    const currentTime = Date.now()
    const timeDelta = currentTime - this.lastScrollTime
    const distance = Math.abs(currentY - this.lastScrollY)
    const speed = distance / (timeDelta || 1)

    const pattern: ScrollPattern = {
      direction: currentY > this.lastScrollY ? 'down' : 'up',
      speed,
      distance,
      timestamp: currentTime
    }

    this.scrollBuffer.push(pattern)

    // Process scroll patterns every 500ms
    if (this.scrollBuffer.length >= 5) {
      this.processScrollPatterns()
    }

    this.lastScrollY = currentY
    this.lastScrollTime = currentTime
  }

  /**
   * Process batched scroll patterns
   */
  private processScrollPatterns(): void {
    // Keep only recent patterns (last 10 seconds)
    const tenSecondsAgo = Date.now() - 10000
    this.data.scrollPatterns = [
      ...this.data.scrollPatterns.filter(p => p.timestamp > tenSecondsAgo),
      ...this.scrollBuffer
    ]
    this.scrollBuffer = []
  }

  /**
   * Handle click events
   */
  private handleClick = (e: MouseEvent): void => {
    const element = e.target as HTMLElement
    const elementId = element.id || element.className || element.tagName

    // Track interaction
    this.data.engagementMetrics.interactions++
    this.data.engagementMetrics.lastInteraction = Date.now()

    // Track attention
    if (!this.data.attentionPatterns.focusedElements.includes(elementId)) {
      this.data.attentionPatterns.focusedElements.push(elementId)
    }

    // Detect dopamine triggers
    if (element.classList.contains('like-button') || 
        element.classList.contains('share-button') ||
        element.classList.contains('comment-button')) {
      this.recordDopamineTrigger('interaction', 0.5)
    }
  }

  /**
   * Handle focus in events
   */
  private handleFocusIn = (e: FocusEvent): void => {
    const element = e.target as HTMLElement
    const elementId = element.id || element.className || element.tagName
    this.currentDwell.set(elementId, Date.now())
  }

  /**
   * Handle focus out events
   */
  private handleFocusOut = (e: FocusEvent): void => {
    const element = e.target as HTMLElement
    const elementId = element.id || element.className || element.tagName
    const startTime = this.currentDwell.get(elementId)
    
    if (startTime) {
      const dwellTime: DwellTime = {
        element: elementId,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime
      }
      
      this.data.dwellTimes.push(dwellTime)
      this.currentDwell.delete(elementId)
    }
  }

  /**
   * Handle visibility change
   */
  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      // User left the page - process all pending data
      this.processMouseMovements()
      this.processScrollPatterns()
    }
  }

  /**
   * Record engagement metric
   */
  recordEngagement(type: 'like' | 'share' | 'comment' | 'watch', value: number = 1): void {
    switch (type) {
      case 'like':
        this.data.engagementMetrics.likes += value
        this.recordDopamineTrigger('like', 0.7)
        break
      case 'share':
        this.data.engagementMetrics.shares += value
        this.recordDopamineTrigger('share', 0.8)
        break
      case 'comment':
        this.data.engagementMetrics.comments += value
        this.recordDopamineTrigger('comment', 0.6)
        break
      case 'watch':
        this.data.engagementMetrics.watchTime += value
        break
    }
    
    this.data.engagementMetrics.interactions++
    this.data.engagementMetrics.lastInteraction = Date.now()
  }

  /**
   * Record dopamine trigger
   */
  recordDopamineTrigger(type: string, intensity: number): void {
    this.data.dopamineTriggers.push({
      type,
      timestamp: Date.now(),
      intensity
    })

    // Keep only recent triggers (last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    this.data.dopamineTriggers = this.data.dopamineTriggers.filter(
      t => t.timestamp > oneHourAgo
    )
  }

  /**
   * Calculate cognitive load
   */
  calculateCognitiveLoad(): number {
    // Factors:
    // - Number of elements focused on
    // - Scroll speed (faster = higher load)
    // - Number of interactions
    // - Dwell time patterns

    const focusedElements = this.data.attentionPatterns.focusedElements.length
    const avgScrollSpeed = this.data.scrollPatterns.length > 0
      ? this.data.scrollPatterns.reduce((sum, p) => sum + p.speed, 0) / this.data.scrollPatterns.length
      : 0
    const interactions = this.data.engagementMetrics.interactions
    const avgDwellTime = this.data.dwellTimes.length > 0
      ? this.data.dwellTimes.reduce((sum, d) => sum + d.duration, 0) / this.data.dwellTimes.length
      : 0

    // Normalize and combine factors
    const load = Math.min(
      (focusedElements * 0.1) +
      (Math.min(avgScrollSpeed / 100, 1) * 0.3) +
      (Math.min(interactions / 100, 1) * 0.3) +
      (Math.min(avgDwellTime / 10000, 1) * 0.3),
      1
    )

    this.data.cognitiveLoad = load
    return load
  }

  /**
   * Get current behavior data
   */
  getBehaviorData(): BehaviorData {
    return { ...this.data }
  }

  /**
   * Get recent behavior data (last N minutes)
   */
  getRecentBehaviorData(minutes: number = 5): Partial<BehaviorData> {
    const cutoff = Date.now() - (minutes * 60 * 1000)
    
    return {
      mouseMovements: this.data.mouseMovements.filter(m => m.timestamp > cutoff),
      scrollPatterns: this.data.scrollPatterns.filter(p => p.timestamp > cutoff),
      dwellTimes: this.data.dwellTimes.filter(d => d.startTime > cutoff),
      engagementMetrics: this.data.engagementMetrics,
      dopamineTriggers: this.data.dopamineTriggers.filter(t => t.timestamp > cutoff)
    }
  }

  /**
   * Reset behavior data
   */
  reset(): void {
    this.data = {
      mouseMovements: [],
      scrollPatterns: [],
      dwellTimes: [],
      engagementMetrics: {
        likes: 0,
        shares: 0,
        comments: 0,
        watchTime: 0,
        interactions: 0,
        lastInteraction: 0
      },
      attentionPatterns: {
        focusedElements: [],
        skippedElements: [],
        revisitedElements: []
      },
      cognitiveLoad: 0,
      dopamineTriggers: []
    }
  }
}

// Singleton instance
let trackerInstance: BehaviorTracker | null = null

export function getBehaviorTracker(): BehaviorTracker {
  if (!trackerInstance) {
    trackerInstance = new BehaviorTracker()
    trackerInstance.startTracking()
  }
  return trackerInstance
}

export default BehaviorTracker

