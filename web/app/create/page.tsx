'use client'

import { useState } from 'react'
import { BottomNav } from '@/components/Navigation/BottomNav'
import { Upload, Camera, Music, Effects, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { UiverseButton } from '@/components/UI/UiverseButton'
import { UiverseInput } from '@/components/UI/UiverseInput'
import { UiverseIconButton } from '@/components/UI/UiverseIconButton'
import { UiverseCard } from '@/components/UI/UiverseCard'
import { LiquidGlass } from '@/components/UI/LiquidGlass'

export default function CreatePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="h-screen w-screen bg-black flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h1 className="text-xl font-bold gradient-text-uiverse">Create</h1>
        {selectedFile && (
          <UiverseIconButton
            icon={<X className="w-5 h-5 text-white" />}
            onClick={() => {
              setSelectedFile(null)
              setPreview(null)
            }}
            size="sm"
          />
        )}
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        {!preview ? (
          <div className="w-full max-w-md">
            <h2 className="text-white text-xl font-bold mb-6 text-center">Upload a video</h2>
            
            <div className="space-y-4">
              <label className="block">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <LiquidGlass preset="frost" className="rounded-2xl">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/20 rounded-2xl cursor-pointer hover:border-indigo-500 transition-all ripple-uiverse"
                  >
                    <Upload className="w-12 h-12 text-white/70 mb-4" />
                    <p className="text-white font-semibold mb-2">Select video</p>
                    <p className="text-white/60 text-sm">MP4, MOV up to 10 minutes</p>
                  </motion.div>
                </LiquidGlass>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <LiquidGlass preset="edge" className="rounded-xl">
                  <UiverseButton
                    variant="ghost"
                    size="lg"
                    className="flex flex-col items-center gap-3 p-6 w-full h-auto"
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center border border-white/10">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-white text-sm font-semibold">Record</span>
                  </UiverseButton>
                </LiquidGlass>
                <LiquidGlass preset="edge" className="rounded-xl">
                  <UiverseButton
                    variant="ghost"
                    size="lg"
                    className="flex flex-col items-center gap-3 p-6 w-full h-auto"
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center border border-white/10">
                      <Music className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-white text-sm font-semibold">Add Sound</span>
                  </UiverseButton>
                </LiquidGlass>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <div className="relative aspect-[9/16] rounded-2xl overflow-hidden mb-4">
              <video
                src={preview}
                controls
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-3">
              <UiverseInput
                type="text"
                value=""
                onChange={() => {}}
                placeholder="Write a caption..."
                className="rounded-xl"
              />
              <div className="flex gap-2">
                <UiverseButton
                  variant="ghost"
                  size="md"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Effects className="w-5 h-5" />
                  Effects
                </UiverseButton>
                <UiverseButton
                  variant="ghost"
                  size="md"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Music className="w-5 h-5" />
                  Sound
                </UiverseButton>
              </div>
              <UiverseButton
                variant="primary"
                size="lg"
                className="w-full"
              >
                Post
              </UiverseButton>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

