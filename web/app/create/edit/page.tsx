'use client'

import React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { VideoEditor } from '@/components/VideoEditor/VideoEditor'
import { ArrowLeft } from 'lucide-react'

export default function EditPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const videoId = searchParams.get('videoId')
  const videoUrl = searchParams.get('videoUrl')

  const handleExport = () => {
    // Implement export logic
    console.log('Exporting video...')
    // For now, just navigate back
    router.push('/create')
  }

  const handleCancel = () => {
    router.back()
  }

  if (!videoId && !videoUrl) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="mb-4">No video selected for editing.</p>
          <button 
            onClick={() => router.push('/create')}
            className="text-indigo-400 hover:text-indigo-300 underline"
          >
            Go back to Create
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-black flex flex-col">
      <header className="px-4 py-3 border-b border-white/10 flex items-center gap-4">
        <button 
          onClick={handleCancel}
          className="p-2 hover:bg-white/10 rounded-full text-white"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold gradient-text-uiverse">Video Editor</h1>
      </header>

      <div className="flex-1 overflow-hidden">
        <VideoEditor 
          initialVideoId={videoId || undefined}
          initialVideoUrl={videoUrl || undefined}
          onExport={handleExport}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}


