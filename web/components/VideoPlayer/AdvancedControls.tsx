'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  SkipForward, 
  SkipBack,
  FastForward,
  Rewind,
  Settings
} from 'lucide-react'
import { UiverseIconButton } from '../UI/UiverseIconButton'
import { UiverseButton } from '../UI/UiverseButton'
import { LiquidGlass } from '../UI/LiquidGlass'

interface AdvancedControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>
  isPlaying: boolean
  isMuted: boolean
  playbackSpeed: number
  onPlayPause: () => void
  onMuteToggle: () => void
  onSpeedChange: (speed: number) => void
  onSeek: (time: number) => void
  currentTime: number
  duration: number
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0]
const SEEK_STEP = 5 // seconds

export function AdvancedControls({
  videoRef,
  isPlaying,
  isMuted,
  playbackSpeed,
  onPlayPause,
  onMuteToggle,
  onSpeedChange,
  onSeek,
  currentTime,
  duration
}: AdvancedControlsProps) {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [isPictureInPicture, setIsPictureInPicture] = useState(false)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          onPlayPause()
          break
        case 'm':
          e.preventDefault()
          onMuteToggle()
          break
        case 'ArrowLeft':
          e.preventDefault()
          onSeek(Math.max(0, currentTime - SEEK_STEP))
          break
        case 'ArrowRight':
          e.preventDefault()
          onSeek(Math.min(duration, currentTime + SEEK_STEP))
          break
        case 'ArrowUp':
          e.preventDefault()
          onMuteToggle()
          break
        case 'ArrowDown':
          e.preventDefault()
          onMuteToggle()
          break
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'p':
          e.preventDefault()
          togglePictureInPicture()
          break
        case '>':
        case '.':
          e.preventDefault()
          frameStep(1)
          break
        case '<':
        case ',':
          e.preventDefault()
          frameStep(-1)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentTime, duration, onPlayPause, onMuteToggle, onSeek])

  const toggleFullscreen = async () => {
    if (!videoRef.current) return

    if (!document.fullscreenElement) {
      await videoRef.current.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  const togglePictureInPicture = async () => {
    if (!videoRef.current) return

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        setIsPictureInPicture(false)
      } else {
        await videoRef.current.requestPictureInPicture()
        setIsPictureInPicture(true)
      }
    } catch (error) {
      console.error('Picture-in-Picture error:', error)
    }
  }

  const frameStep = (direction: number) => {
    if (!videoRef.current) return
    
    const fps = 30 // Assume 30fps, could be detected
    const frameTime = 1 / fps
    const newTime = currentTime + (frameTime * direction)
    onSeek(Math.max(0, Math.min(duration, newTime)))
  }

  const showControlsTemporarily = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div 
      className="absolute inset-0"
      onMouseMove={showControlsTemporarily}
      onTouchStart={showControlsTemporarily}
    >
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 flex flex-col justify-between p-4"
          >
            {/* Top controls */}
            <div className="flex justify-end gap-2">
              <UiverseIconButton
                onClick={togglePictureInPicture}
                aria-label="Picture in Picture"
              >
                <Maximize2 className="w-5 h-5" />
              </UiverseIconButton>
            </div>

            {/* Center controls */}
            <div className="flex items-center justify-center gap-4">
              <UiverseIconButton
                onClick={() => onSeek(Math.max(0, currentTime - SEEK_STEP))}
                aria-label="Rewind 5 seconds"
              >
                <Rewind className="w-6 h-6" />
              </UiverseIconButton>

              <UiverseIconButton
                onClick={onPlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="w-16 h-16"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </UiverseIconButton>

              <UiverseIconButton
                onClick={() => onSeek(Math.min(duration, currentTime + SEEK_STEP))}
                aria-label="Forward 5 seconds"
              >
                <FastForward className="w-6 h-6" />
              </UiverseIconButton>
            </div>

            {/* Bottom controls */}
            <div className="space-y-2">
              {/* Progress bar */}
              <div className="relative h-2 bg-white/20 rounded-full cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const percent = (e.clientX - rect.left) / rect.width
                  onSeek(percent * duration)
                }}
              >
                <motion.div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>

              {/* Time and controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Speed control */}
                  <div className="relative">
                    <UiverseIconButton
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      aria-label="Playback speed"
                    >
                      <Settings className="w-5 h-5" />
                    </UiverseIconButton>

                    <AnimatePresence>
                      {showSpeedMenu && (
                        <LiquidGlass preset="pulse" className="absolute bottom-full right-0 mb-2 rounded-lg p-2 min-w-[100px]">
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="space-y-1"
                          >
                            {PLAYBACK_SPEEDS.map((speed) => (
                              <UiverseButton
                                key={speed}
                                onClick={() => {
                                  onSpeedChange(speed)
                                  setShowSpeedMenu(false)
                                }}
                                variant={playbackSpeed === speed ? 'primary' : 'ghost'}
                                size="sm"
                                className="w-full justify-start"
                              >
                                {speed}x
                              </UiverseButton>
                            ))}
                          </motion.div>
                        </LiquidGlass>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Volume control */}
                  <UiverseIconButton
                    onClick={onMuteToggle}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </UiverseIconButton>

                  {/* Fullscreen */}
                  <UiverseIconButton
                    onClick={toggleFullscreen}
                    aria-label="Fullscreen"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </UiverseIconButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard shortcuts hint (shown briefly on first interaction) */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white/60 text-xs text-center space-y-1 pointer-events-none">
        <div>Space/K: Play/Pause | M: Mute | ←→: Seek | F: Fullscreen | P: PiP</div>
      </div>
    </div>
  )
}

