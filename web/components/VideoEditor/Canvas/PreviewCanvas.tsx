import React, { useEffect, useRef } from 'react'
import { useEditorStore } from '@/lib/video-editor/store'

export function PreviewCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { clips, currentTime } = useEditorStore()

  // Simplified render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw active clips (placeholder)
    const activeClips = clips.filter(
      (c) => currentTime >= c.start && currentTime < c.start + c.duration
    )

    if (activeClips.length === 0) {
      // Draw placeholder
      ctx.fillStyle = '#333'
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('No Media', canvas.width / 2, canvas.height / 2)
    }

    activeClips.forEach((clip) => {
      // In a real implementation, we would draw the video/image here
      // using the clip.source
      if (clip.type === 'text') {
        ctx.fillStyle = '#fff'
        ctx.font = '40px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(clip.name, canvas.width / 2, canvas.height / 2)
      } else {
        ctx.fillStyle = getClipColor(clip.type)
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#fff'
        ctx.font = '24px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`${clip.name} (Preview)`, canvas.width / 2, canvas.height / 2)
      }
    })

  }, [currentTime, clips])

  return (
    <div className="flex-1 bg-black flex items-center justify-center p-8">
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="max-w-full max-h-full aspect-video bg-black shadow-2xl border border-white/5"
      />
    </div>
  )
}

function getClipColor(type: string) {
    switch (type) {
        case 'video': return '#1d4ed8'
        case 'image': return '#be185d'
        case 'text': return '#b45309'
        default: return '#374151'
    }
}


