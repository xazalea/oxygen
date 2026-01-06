'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, AlertCircle, Video } from 'lucide-react'
import { UiverseButton } from '@/components/UI/UiverseButton'
import { UiverseInput } from '@/components/UI/UiverseInput'
import { LiquidGlass } from '@/components/UI/LiquidGlass'
import { AI_MODELS, AIModelKey } from '@/lib/ai-constants'
import { getCurrentUser } from '@/lib/auth'

export default function AICreationPage() {
  const router = useRouter()
  const [selectedModel, setSelectedModel] = useState<AIModelKey>('veo3')
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultVideo, setResultVideo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)

  const handleGenerate = async () => {
    const user = getCurrentUser()
    if (!user) {
      setError('You must be logged in to generate videos.')
      return
    }

    // Check age restriction
    const model = AI_MODELS[selectedModel];
    if ('is18Plus' in model && model.is18Plus && !user.isOver18) {
       setError('This model is restricted to users over 18.');
       return;
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setResultVideo(null)

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          modelKey: selectedModel,
          prompt: prompt.trim()
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate video')
      }

      if (data.success && data.videoUrl) {
        setResultVideo(data.videoUrl)
        setRemaining(data.remaining)
      } else {
        throw new Error('No video URL returned')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold gradient-text-uiverse">AI Video Generation</h1>
      </header>

      <div className="max-w-md mx-auto space-y-6">
        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">Select Model</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(AI_MODELS) as [AIModelKey, typeof AI_MODELS[AIModelKey]][]).map(([key, model]) => {
              // Type guard to check for is18Plus property safely
              const isRestricted = 'is18Plus' in model && (model as any).is18Plus;
              const user = getCurrentUser();
              
              // Hide restricted models if user is not over 18 or not logged in
              if (isRestricted && (!user || !user.isOver18)) {
                return null;
              }

              return (
              <LiquidGlass
                key={key}
                preset={selectedModel === key ? 'pulse' : 'default'}
                className={`rounded-xl cursor-pointer transition-all ${selectedModel === key ? 'ring-2 ring-indigo-500' : ''}`}
              >
                <div
                  onClick={() => setSelectedModel(key)}
                  className="p-3 h-full flex flex-col justify-center relative"
                >
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-sm truncate">{model.name}</p>
                    {isRestricted && (
                      <span className="px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">
                        18+
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 truncate">{model.description}</p>
                </div>
              </LiquidGlass>
            )})}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the video you want to generate..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none text-white"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {/* Generate Button */}
        <UiverseButton
          onClick={handleGenerate}
          disabled={isGenerating}
          variant="primary"
          size="lg"
          className="w-full relative overflow-hidden"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 animate-spin" />
              Generating...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Generate Video
            </span>
          )}
        </UiverseButton>

        {/* Status Info */}
        {remaining !== null && (
          <p className="text-center text-xs text-white/40">
            You have {remaining} generations left today.
          </p>
        )}

        {/* Result */}
        {resultVideo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden border border-white/10 bg-white/5"
          >
            <video
              src={resultVideo}
              controls
              autoPlay
              loop
              className="w-full aspect-video object-cover"
            />
            <div className="p-4 flex gap-2">
              <UiverseButton
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => {
                  // Basic download or save logic
                  const a = document.createElement('a');
                  a.href = resultVideo;
                  a.download = `generated-${Date.now()}.mp4`;
                  a.click();
                }}
              >
                Download
              </UiverseButton>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

