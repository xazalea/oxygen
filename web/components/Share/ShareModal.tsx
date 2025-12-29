'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, MessageCircle, Mail, Link2, Facebook, Twitter, Instagram } from 'lucide-react'
import { VideoMetadata } from '@/lib/video-api'
import { useState } from 'react'
import { UiverseIconButton } from '@/components/UI/UiverseIconButton'
import { UiverseCard } from '@/components/UI/UiverseCard'
import { UiverseInput } from '@/components/UI/UiverseInput'
import { UiverseButton } from '@/components/UI/UiverseButton'

interface ShareModalProps {
  video: VideoMetadata
  isOpen: boolean
  onClose: () => void
}

export function ShareModal({ video, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const videoUrl = `${window.location.origin}/video/${video.id}`

  const shareOptions = [
    { icon: Copy, label: 'Copy link', action: 'copy' },
    { icon: MessageCircle, label: 'Messages', action: 'message' },
    { icon: Mail, label: 'Email', action: 'email' },
    { icon: Facebook, label: 'Facebook', action: 'facebook' },
    { icon: Twitter, label: 'Twitter', action: 'twitter' },
    { icon: Instagram, label: 'Instagram', action: 'instagram' },
  ]

  const handleShare = async (action: string) => {
    if (action === 'copy') {
      await navigator.clipboard.writeText(videoUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: video.description,
          text: `Check out this video on Oxygen: ${video.description}`,
          url: videoUrl,
        })
        onClose()
      } catch (err) {
        console.error('Error sharing:', err)
      }
    }
  }

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
              <h2 className="text-xl font-bold gradient-text-uiverse">Share</h2>
              <UiverseIconButton
                icon={<X className="w-5 h-5 text-white" />}
                onClick={onClose}
                size="sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {shareOptions.map((option) => {
                const Icon = option.icon
                return (
                  <motion.button
                    key={option.action}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleShare(option.action)}
                    className="flex flex-col items-center gap-3 p-4 glass-strong rounded-xl hover:glass transition-all ripple-uiverse"
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-white text-xs font-semibold text-center">
                      {option.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>

            {copied && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-3 badge-uiverse"
              >
                Link copied!
              </motion.div>
            )}

            <div className="flex items-center gap-3 p-3 glass rounded-xl">
              <Link2 className="w-5 h-5 text-white/60 flex-shrink-0" />
              <UiverseInput
                value={videoUrl}
                onChange={() => {}}
                className="flex-1 bg-transparent border-none"
                disabled
              />
              <UiverseButton
                onClick={() => handleShare('copy')}
                size="sm"
                variant="secondary"
              >
                <span>Copy</span>
              </UiverseButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

