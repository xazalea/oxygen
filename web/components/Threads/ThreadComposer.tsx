'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image as ImageIcon, Smile, Paperclip, X } from 'lucide-react'
import { LiquidGlass } from '@/components/UI/LiquidGlass'
import { UiverseButton } from '@/components/UI/UiverseButton'

interface ThreadComposerProps {
  onSubmit: (content: string, media?: File) => Promise<void>
}

export function ThreadComposer({ onSubmit }: ThreadComposerProps) {
  const [content, setContent] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [media, setMedia] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMedia(file)
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!content.trim() && !media) return
    
    setIsSubmitting(true)
    try {
      await onSubmit(content, media || undefined)
      setContent('')
      setMedia(null)
      setPreview(null)
      setIsExpanded(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <LiquidGlass preset="glass" className="rounded-xl overflow-hidden mb-6">
      <div className="p-4">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 shrink-0" />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder="What is happening?!"
              className="w-full bg-transparent text-white placeholder-white/40 border-none focus:ring-0 resize-none min-h-[50px] text-lg"
              rows={isExpanded ? 3 : 1}
            />

            <AnimatePresence>
              {preview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative rounded-xl overflow-hidden mb-4"
                >
                  <img src={preview} alt="Preview" className="w-full max-h-[300px] object-cover" />
                  <button
                    onClick={() => {
                      setMedia(null)
                      setPreview(null)
                    }}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <div className="flex gap-2">
                <label className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-full cursor-pointer transition-colors">
                  <input type="file" className="hidden" accept="image/*,video/*" onChange={handleMediaSelect} />
                  <ImageIcon className="w-5 h-5" />
                </label>
                <button className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-full transition-colors">
                  <Smile className="w-5 h-5" />
                </button>
                <button className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-full transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>

              <UiverseButton
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={(!content.trim() && !media) || isSubmitting}
                className="px-6 rounded-full"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </UiverseButton>
            </div>
          </div>
        </div>
      </div>
    </LiquidGlass>
  )
}

