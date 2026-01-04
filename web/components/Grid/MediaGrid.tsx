'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Image as ImageIcon } from 'lucide-react'
import { VideoMetadata } from '@/lib/video-api'

interface MediaGridProps {
  items: (VideoMetadata | { id: string; thumbnailUrl?: string; type: 'video' | 'image' })[]
  columns?: 2 | 3 | 4
  onItemClick?: (item: any) => void
}

export function MediaGrid({ items, columns = 3, onItemClick }: MediaGridProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-1`}>
      {items.map((item, index) => {
        const isVideo = 'videoUrl' in item || item.type === 'video'
        const thumbnail = 'thumbnailUrl' in item ? item.thumbnailUrl : 
                          'videoUrl' in item ? item.videoUrl : undefined

        return (
          <motion.div
            key={item.id}
            className="relative aspect-square bg-white/10 rounded-lg overflow-hidden cursor-pointer group"
            onHoverStart={() => setHoveredIndex(index)}
            onHoverEnd={() => setHoveredIndex(null)}
            onClick={() => onItemClick && onItemClick(item)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={`Media ${index + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {isVideo ? (
                  <Play className="w-12 h-12 text-white/60" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-white/60" />
                )}
              </div>
            )}

            {/* Overlay on hover */}
            {hoveredIndex === index && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/40 flex items-center justify-center"
              >
                {isVideo && (
                  <Play className="w-12 h-12 text-white" />
                )}
              </motion.div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}



