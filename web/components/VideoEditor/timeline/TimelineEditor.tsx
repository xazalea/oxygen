'use client'

import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useEditorStore, Clip } from '@/lib/video-editor/store'

export function TimelineEditor() {
  const { clips, tracks, currentTime, duration, zoom, setCurrentTime, setSelectedClipId } = useEditorStore()
  const timelineRef = useRef<HTMLDivElement>(null)

  const handleTimeClick = (e: React.MouseEvent) => {
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const newTime = x / zoom
      setCurrentTime(newTime)
    }
  }

  return (
    <div className="w-full h-64 bg-black/40 border-t border-white/10 flex flex-col overflow-hidden">
      {/* Time Ruler */}
      <div 
        ref={timelineRef}
        className="h-8 bg-white/5 border-b border-white/10 relative cursor-pointer"
        onClick={handleTimeClick}
      >
        {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
          <div 
            key={i} 
            className="absolute top-0 bottom-0 border-l border-white/20 text-[10px] text-white/50 pl-1"
            style={{ left: i * zoom }}
          >
            {i}s
          </div>
        ))}
        
        {/* Playhead */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
          style={{ left: currentTime * zoom }}
        >
          <div className="w-3 h-3 -ml-1.5 bg-red-500 transform rotate-45 -mt-1.5" />
        </div>
      </div>

      {/* Tracks */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {tracks.map((track) => (
          <div key={track.id} className="h-16 border-b border-white/5 relative bg-white/5">
            <div className="absolute left-2 top-2 text-xs text-white/30 uppercase font-bold tracking-wider pointer-events-none">
              {track.type}
            </div>
            
            {clips
              .filter((c) => c.track === track.id)
              .map((clip) => (
                <ClipItem key={clip.id} clip={clip} zoom={zoom} />
              ))}
          </div>
        ))}
        
        {/* Playhead Line */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-red-500/50 pointer-events-none z-20"
          style={{ left: currentTime * zoom }}
        />
      </div>
    </div>
  )
}

function ClipItem({ clip, zoom }: { clip: Clip; zoom: number }) {
  const setSelectedClipId = useEditorStore((state) => state.setSelectedClipId)
  const selectedClipId = useEditorStore((state) => state.selectedClipId)
  const isSelected = selectedClipId === clip.id

  return (
    <motion.div
      className={`absolute top-1 bottom-1 rounded-md overflow-hidden cursor-pointer border ${
        isSelected ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-white/10'
      }`}
      style={{
        left: clip.start * zoom,
        width: clip.duration * zoom,
        backgroundColor: getClipColor(clip.type),
      }}
      onClick={(e) => {
        e.stopPropagation()
        setSelectedClipId(clip.id)
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="w-full h-full p-2 flex items-center overflow-hidden">
        {clip.thumbnail && (
          <img src={clip.thumbnail} alt="" className="h-full w-auto object-cover mr-2 rounded" />
        )}
        <span className="text-xs font-medium text-white truncate drop-shadow-md">{clip.name}</span>
      </div>
    </motion.div>
  )
}

function getClipColor(type: Clip['type']) {
  switch (type) {
    case 'video': return 'rgba(59, 130, 246, 0.5)' // blue
    case 'audio': return 'rgba(16, 185, 129, 0.5)' // green
    case 'image': return 'rgba(236, 72, 153, 0.5)' // pink
    case 'text': return 'rgba(245, 158, 11, 0.5)' // orange
    default: return 'rgba(107, 114, 128, 0.5)' // gray
  }
}
