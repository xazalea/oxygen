'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Video, Users } from 'lucide-react'
import { VideoMetadata } from '@/lib/video-api'
import { UiverseIconButton } from '@/components/UI/UiverseIconButton'
import { UiverseCard } from '@/components/UI/UiverseCard'
import { LiquidGlass } from '@/components/UI/LiquidGlass'

interface DuetOptionsProps {
  video: VideoMetadata
  isOpen: boolean
  onClose: () => void
}

export function DuetOptions({ video, isOpen, onClose }: DuetOptionsProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 glass-strong z-50 rounded-t-3xl border-t border-white/10 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold gradient-text-uiverse">Create with this video</h2>
              <UiverseIconButton
                icon={<X className="w-5 h-5 text-white" />}
                onClick={onClose}
                size="sm"
              />
            </div>

            <div className="space-y-3">
              <LiquidGlass preset="edge" className="rounded-xl">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-4 p-4 ripple-uiverse"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center border border-white/10">
                    <Video className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-semibold text-base">Duet</p>
                    <p className="text-white/70 text-sm mt-0.5">Create a video alongside this one</p>
                  </div>
                </motion.button>
              </LiquidGlass>

              <LiquidGlass preset="edge" className="rounded-xl">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-4 p-4 ripple-uiverse"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center border border-white/10">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-semibold text-base">Stitch</p>
                    <p className="text-white/70 text-sm mt-0.5">Combine clips from this video with yours</p>
                  </div>
                </motion.button>
              </LiquidGlass>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

