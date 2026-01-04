'use client'

import { useEffect, useRef, ReactNode } from 'react'

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
      // Check if already loaded
      if ((window as any).liquidGL) {
        initLiquidGL()
        return
      }

      // Load html2canvas
      if (!document.querySelector('script[src*="html2canvas"]')) {
        const html2canvasScript = document.createElement('script')
        html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
        html2canvasScript.defer = true
        document.head.appendChild(html2canvasScript)
        await new Promise((resolve) => {
          html2canvasScript.onload = resolve
        })
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

      const config = presets[preset] || presets.default
      
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



