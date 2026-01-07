'use client'

import { useEffect, useRef, ReactNode } from 'react'
import html2canvas from 'html2canvas'

interface LiquidGlassProps {
  children: ReactNode
  className?: string
  preset?: 'default' | 'alien' | 'pulse' | 'frost' | 'edge'
  refraction?: number
  bevelDepth?: number
  bevelWidth?: number
  frost?: number
  shadow?: boolean
  specular?: boolean
}

export function LiquidGlass({
  children,
  className = '',
  preset = 'default',
  refraction,
  bevelDepth,
  bevelWidth,
  frost,
  shadow,
  specular,
}: LiquidGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Load liquidGL scripts
    const loadLiquidGL = async () => {
      // Expose html2canvas globally for liquidGL
      if (typeof window !== 'undefined' && !(window as any).html2canvas) {
        (window as any).html2canvas = html2canvas
      }

      // Check if already loaded
      if ((window as any).liquidGL) {
        initLiquidGL()
        return
      }

      // Load liquidGL
      if (!document.querySelector('script[src*="liquidGL"]')) {
        const liquidGLScript = document.createElement('script')
        liquidGLScript.src = 'https://cdn.jsdelivr.net/gh/naughtyduk/liquidGL@main/scripts/liquidGL.js'
        liquidGLScript.defer = true
        document.head.appendChild(liquidGLScript)
        await new Promise((resolve) => {
          liquidGLScript.onload = resolve
        })
      }

      // Wait a bit for initialization
      setTimeout(initLiquidGL, 100)
    }

    const initLiquidGL = () => {
      if (!containerRef.current || !(window as any).liquidGL) return

      const presets: Record<string, any> = {
        default: { refraction: 0, bevelDepth: 0.052, bevelWidth: 0.211, frost: 2, shadow: true, specular: true },
        alien: { refraction: 0.073, bevelDepth: 0.2, bevelWidth: 0.156, frost: 2, shadow: true, specular: false },
        pulse: { refraction: 0.03, bevelDepth: 0, bevelWidth: 0.273, frost: 0, shadow: false, specular: false },
        frost: { refraction: 0, bevelDepth: 0.035, bevelWidth: 0.119, frost: 0.9, shadow: true, specular: true },
        edge: { refraction: 0.047, bevelDepth: 0.136, bevelWidth: 0.076, frost: 2, shadow: true, specular: false },
      }

      // Security check: ensure preset is a valid key to prevent object injection
      const safePreset = Object.prototype.hasOwnProperty.call(presets, preset) ? preset : 'default'
      const config = presets[safePreset]
      
      // Override with custom props if provided
      if (refraction !== undefined) config.refraction = refraction
      if (bevelDepth !== undefined) config.bevelDepth = bevelDepth
      if (bevelWidth !== undefined) config.bevelWidth = bevelWidth
      if (frost !== undefined) config.frost = frost
      if (shadow !== undefined) config.shadow = shadow
      if (specular !== undefined) config.specular = specular

      // Generate unique class name
      const uniqueClass = `liquid-glass-${Math.random().toString(36).substr(2, 9)}`
      containerRef.current.classList.add(uniqueClass)

      try {
        ;(window as any).liquidGL({
          snapshot: 'body',
          target: `.${uniqueClass}`,
          resolution: 2.0,
          ...config,
        })
      } catch (error) {
        console.warn('liquidGL initialization failed, falling back to CSS glassmorphism:', error)
      }
    }

    loadLiquidGL()

    return () => {
      // Cleanup if needed
    }
  }, [preset, refraction, bevelDepth, bevelWidth, frost, shadow, specular])

  return (
    <div
      ref={containerRef}
      className={`liquid-glass-container ${className}`}
      style={{ position: 'relative', zIndex: 10 }}
    >
      <div className="content" style={{ position: 'relative', zIndex: 3 }}>
        {children}
      </div>
    </div>
  )
}



