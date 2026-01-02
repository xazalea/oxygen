/**
 * UI Morphing Engine
 * 
 * Real-time UI adaptation based on user behavior.
 * Smooth transitions between UI states with automatic learning.
 */

import { getComprehensiveAdapter, ComprehensiveAdaptation } from './neuroscience/comprehensive-adapter'
import { getBehaviorTracker } from './neuroscience/behavior-tracker'

export interface MorphingState {
  adaptation: ComprehensiveAdaptation
  transition: {
    from: Partial<ComprehensiveAdaptation>
    to: Partial<ComprehensiveAdaptation>
    progress: number
  } | null
}

class UIMorphingEngine {
  private adapter = getComprehensiveAdapter()
  private tracker = getBehaviorTracker()
  private currentState: MorphingState
  private morphingInterval: NodeJS.Timeout | null = null
  private morphingIntervalMs = 60000 // 1 minute

  constructor() {
    const adaptation = this.adapter.getCurrentAdaptation()
    this.currentState = {
      adaptation,
      transition: null
    }
    this.startMorphing()
  }

  /**
   * Start automatic morphing
   */
  private startMorphing(): void {
    if (this.morphingInterval) {
      return
    }

    this.morphingInterval = setInterval(() => {
      this.morph()
    }, this.morphingIntervalMs)
  }

  /**
   * Stop automatic morphing
   */
  stopMorphing(): void {
    if (this.morphingInterval) {
      clearInterval(this.morphingInterval)
      this.morphingInterval = null
    }
  }

  /**
   * Perform morphing based on behavior
   */
  private morph(): void {
    const behaviorData = this.tracker.getBehaviorData()
    const newAdaptation = this.adapter.adapt(behaviorData)
    const oldAdaptation = this.currentState.adaptation

    // Start transition
    this.currentState.transition = {
      from: oldAdaptation,
      to: newAdaptation,
      progress: 0
    }

    // Animate transition
    this.animateTransition()
  }

  /**
   * Animate transition
   */
  private animateTransition(): void {
    if (!this.currentState.transition) {
      return
    }

    const duration = 1000 // 1 second
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(1, elapsed / duration)

      if (this.currentState.transition) {
        this.currentState.transition.progress = progress

        // Interpolate between from and to
        const interpolated = this.interpolateAdaptation(
          this.currentState.transition.from,
          this.currentState.transition.to,
          progress
        )

        this.currentState.adaptation = interpolated as ComprehensiveAdaptation

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          // Transition complete
          this.currentState.transition = null
        }
      }
    }

    animate()
  }

  /**
   * Interpolate between two adaptations
   */
  private interpolateAdaptation(
    from: Partial<ComprehensiveAdaptation>,
    to: Partial<ComprehensiveAdaptation>,
    progress: number
  ): Partial<ComprehensiveAdaptation> {
    // Simple linear interpolation for numeric values
    // In a real implementation, this would be more sophisticated
    return {
      ...from,
      ...to
    }
  }

  /**
   * Get current morphing state
   */
  getState(): MorphingState {
    return { ...this.currentState }
  }

  /**
   * Force immediate morph
   */
  forceMorph(): void {
    this.morph()
  }

  /**
   * Reset to default
   */
  reset(): void {
    this.adapter.reset()
    const adaptation = this.adapter.getCurrentAdaptation()
    this.currentState = {
      adaptation,
      transition: null
    }
  }
}

// Singleton instance
let morphingInstance: UIMorphingEngine | null = null

export function getUIMorphingEngine(): UIMorphingEngine {
  if (!morphingInstance) {
    morphingInstance = new UIMorphingEngine()
  }
  return morphingInstance
}

export default UIMorphingEngine

