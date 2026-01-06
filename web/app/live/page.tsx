'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Video, Mic, MicOff, VideoOff, MessageSquare, Heart, Share2, X, Radio } from 'lucide-react'
import Peer from 'simple-peer'
import { LiquidGlass } from '@/components/UI/LiquidGlass'
import { UiverseButton } from '@/components/UI/UiverseButton'
import { UiverseIconButton } from '@/components/UI/UiverseIconButton'
import { BottomNav } from '@/components/Navigation/BottomNav'
import { getCurrentUser } from '@/lib/auth'

export default function LivePage() {
  const [isLive, setIsLive] = useState(false)
  const [isBroadcaster, setIsBroadcaster] = useState(false)
  const [streamId, setStreamId] = useState('demo-stream')
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [viewers, setViewers] = useState(0)
  const [messages, setMessages] = useState<{user: string, text: string}[]>([])
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const peersRef = useRef<Map<string, Peer.Instance>>(new Map())
  const streamRef = useRef<MediaStream | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const user = getCurrentUser() || { id: `user_${Math.random().toString(36).substr(2, 5)}` }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream()
    }
  }, [])

  const startBroadcast = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      
      setIsLive(true)
      setIsBroadcaster(true)
      
      // Initialize Signaling
      await fetch('/api/signal', {
        method: 'POST',
        body: JSON.stringify({ type: 'start_stream', streamId, userId: user.id })
      })

      // Start polling for viewers
      pollingRef.current = setInterval(async () => {
        const res = await fetch(`/api/signal?streamId=${streamId}&userId=${user.id}`)
        const data = await res.json()
        
        if (data.viewers) {
          setViewers(data.viewers.length)
          
          // Connect to new viewers
          data.viewers.forEach((viewerId: string) => {
            if (!peersRef.current.has(viewerId)) {
              createPeer(viewerId, stream)
            }
          })
        }
        
        // Handle incoming signals (answers)
        if (data.messages) {
          data.messages.forEach((msg: any) => {
            const peer = peersRef.current.get(msg.from)
            if (peer) {
              peer.signal(msg.signal)
            }
          })
        }
      }, 1000)

    } catch (err) {
      console.error("Failed to start stream:", err)
    }
  }

  const joinStream = async () => {
    setIsLive(true)
    setIsBroadcaster(false)

    // Notify intention to join
    await fetch('/api/signal', {
      method: 'POST',
      body: JSON.stringify({ type: 'join_stream', streamId, userId: user.id })
    })

    // Start polling for offers
    pollingRef.current = setInterval(async () => {
      const res = await fetch(`/api/signal?streamId=${streamId}&userId=${user.id}`)
      const data = await res.json()

      if (data.messages) {
        data.messages.forEach((msg: any) => {
          // Received offer from broadcaster
          if (!peersRef.current.has(msg.from)) {
             const peer = new Peer({
               initiator: false,
               trickle: false,
             })
             
             peer.on('signal', signal => {
                fetch('/api/signal', {
                  method: 'POST',
                  body: JSON.stringify({
                    type: 'signal',
                    streamId,
                    userId: user.id,
                    data: { targetId: msg.from, signal }
                  })
                })
             })

             peer.on('stream', stream => {
               if (videoRef.current) videoRef.current.srcObject = stream
             })

             peer.signal(msg.signal)
             peersRef.current.set(msg.from, peer)
          } else {
            // Already connected, maybe renegotiation?
            const peer = peersRef.current.get(msg.from)
            if(peer) peer.signal(msg.signal)
          }
        })
      }
    }, 1000)
  }

  const createPeer = (viewerId: string, stream: MediaStream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream
    })

    peer.on('signal', signal => {
      fetch('/api/signal', {
        method: 'POST',
        body: JSON.stringify({
          type: 'signal',
          streamId,
          userId: user.id,
          data: { targetId: viewerId, signal }
        })
      })
    })

    peersRef.current.set(viewerId, peer)
  }

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    if (pollingRef.current) clearInterval(pollingRef.current)
    peersRef.current.forEach(peer => peer.destroy())
    peersRef.current.clear()
    setIsLive(false)
    setViewers(0)
  }

  return (
    <div className="h-screen bg-black flex flex-col">
      <div className="flex-1 relative overflow-hidden bg-gray-900">
        <video 
          ref={videoRef}
          autoPlay 
          muted={isBroadcaster} // Mute self to avoid echo
          playsInline
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-b from-black/50 via-transparent to-black/50">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              {isLive ? (
                <div className="px-3 py-1 bg-red-600 rounded-md text-white text-xs font-bold animate-pulse flex items-center gap-2">
                  <Radio className="w-3 h-3" /> LIVE
                </div>
              ) : (
                <div className="px-3 py-1 bg-white/20 rounded-md text-white text-xs font-bold">
                  OFFLINE
                </div>
              )}
              {isLive && (
                <div className="px-3 py-1 bg-black/40 backdrop-blur rounded-md text-white text-xs font-semibold flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  {viewers}
                </div>
              )}
            </div>
            
            {isLive && (
              <UiverseIconButton 
                icon={<X className="w-5 h-5" />} 
                onClick={stopStream}
              />
            )}
          </div>

          {!isLive && (
             <div className="absolute inset-0 flex items-center justify-center">
               <div className="flex flex-col gap-4">
                 <UiverseButton 
                    variant="primary" 
                    size="lg" 
                    onClick={startBroadcast}
                    className="bg-red-600 hover:bg-red-700 border-none px-8"
                  >
                    Start Broadcasting
                  </UiverseButton>
                  <UiverseButton 
                    variant="ghost" 
                    size="lg" 
                    onClick={joinStream}
                    className="bg-white/10 hover:bg-white/20 border-white/20 px-8"
                  >
                    Join Demo Stream
                  </UiverseButton>
               </div>
             </div>
          )}

          {isLive && (
            <div className="space-y-4">
              <div className="h-48 overflow-y-auto mask-image-gradient space-y-2 px-2">
                {messages.map((msg, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-baseline gap-2 text-sm"
                  >
                    <span className="font-bold text-white/70">{msg.user}</span>
                    <span className="text-white">{msg.text}</span>
                  </motion.div>
                ))}
              </div>

              <LiquidGlass preset="glass" className="p-4 rounded-2xl flex items-center justify-between">
                {isBroadcaster ? (
                  <div className="flex gap-2">
                    <UiverseIconButton 
                      icon={isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-red-400" />}
                      onClick={() => {
                        const track = streamRef.current?.getAudioTracks()[0]
                        if(track) track.enabled = !isMicOn
                        setIsMicOn(!isMicOn)
                      }}
                    />
                    <UiverseIconButton 
                      icon={isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5 text-red-400" />}
                      onClick={() => {
                        const track = streamRef.current?.getVideoTracks()[0]
                        if(track) track.enabled = !isCameraOn
                        setIsCameraOn(!isCameraOn)
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex gap-2">
                     <UiverseIconButton icon={<Heart className="w-5 h-5 text-pink-500" />} />
                     <UiverseIconButton icon={<Share2 className="w-5 h-5" />} />
                  </div>
                )}
              </LiquidGlass>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
