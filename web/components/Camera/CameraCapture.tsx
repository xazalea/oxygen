'use client'

import { useRef, useState, useEffect } from 'react'
import { Camera, X, FlipHorizontal, Image as ImageIcon, Video, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { UiverseButton } from '../UI/UiverseButton'
import { LiquidGlass } from '../UI/LiquidGlass'

interface CameraCaptureProps {
  onCapture: (file: File, type: 'image' | 'video') => void
  onClose: () => void
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [facingMode])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' })
            onCapture(file, 'image')
          }
        }, 'image/jpeg')
      }
    }
  }

  const startRecording = () => {
    if (stream) {
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm'
      })
      
      const chunks: Blob[] = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const file = new File([blob], 'video.webm', { type: 'video/webm' })
        onCapture(file, 'video')
        setRecordedChunks([])
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setMediaRecorder(null)
      setIsRecording(false)
    }
  }

  const flipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <LiquidGlass preset="default" className="p-4">
        <div className="flex items-center justify-between">
          <UiverseButton variant="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </UiverseButton>
          <h2 className="text-white font-bold text-lg">Camera</h2>
          <UiverseButton variant="icon" onClick={flipCamera}>
            <FlipHorizontal className="w-6 h-6" />
          </UiverseButton>
        </div>
      </LiquidGlass>

      {/* Video preview */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* AR Filters overlay would go here */}
        <div className="absolute top-4 right-4">
          <UiverseButton variant="icon">
            <Sparkles className="w-6 h-6" />
          </UiverseButton>
        </div>
      </div>

      {/* Controls */}
      <LiquidGlass preset="default" className="p-6">
        <div className="flex items-center justify-center gap-6">
          <UiverseButton
            variant="icon"
            onClick={capturePhoto}
            className="w-16 h-16 rounded-full border-4 border-white"
          >
            <Camera className="w-8 h-8" />
          </UiverseButton>
          
          {!isRecording ? (
            <UiverseButton
              variant="icon"
              onClick={startRecording}
              className="w-12 h-12 rounded-full bg-red-500"
            >
              <Video className="w-6 h-6" />
            </UiverseButton>
          ) : (
            <UiverseButton
              variant="icon"
              onClick={stopRecording}
              className="w-12 h-12 rounded-full bg-red-500 animate-pulse"
            >
              <div className="w-4 h-4 bg-white rounded" />
            </UiverseButton>
          )}
        </div>
      </LiquidGlass>
    </div>
  )
}



