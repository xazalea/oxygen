'use client'

import { useState, useEffect, useRef } from 'react'
import { BottomNav } from '@/components/Navigation/BottomNav'
import { ShieldCheck, Wifi, Send, ArrowLeft, KeyRound, Lock, Radio } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { LiquidGlass } from '@/components/UI/LiquidGlass'
import type { ChatMessage, PeerInfo } from '@/lib/p2p/types'

export default function InboxPage() {
  const [isReady, setIsReady] = useState(false)
  const [peers, setPeers] = useState<PeerInfo[]>([])
  const [selectedPeer, setSelectedPeer] = useState<PeerInfo | null>(null)
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({})
  const [inputText, setInputText] = useState('')
  const [mySession, setMySession] = useState<string>('')
  const [sas, setSas] = useState<Record<string, string>>({})
  const [room, setRoom] = useState('quantum-mesh')
  const [secret, setSecret] = useState('shared-secret')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true
    const initP2P = async () => {
      const { chatManager } = await import('@/lib/p2p/chat')
      const { discovery } = await import('@/lib/p2p/dht')
      await chatManager.init()
      await chatManager.setRoom(room, secret)

      if (!mounted) return

      discovery.on('peer:discovered', (peer: PeerInfo) => {
        setPeers(prev => {
          if (prev.find(p => p.sessionId === peer.sessionId)) return prev
          return [...prev, peer]
        })
      })

      chatManager.on('message', ({ peerId, message }: { peerId: string, message: ChatMessage, sas?: string }) => {
        setMessages(prev => ({
          ...prev,
          [peerId]: [...(prev[peerId] || []), message]
        }))
      })

      chatManager.on('sas', ({ peerId, sas }: { peerId: string, sas: string }) => {
        setSas(prev => ({ ...prev, [peerId]: sas }))
      })

      if (discovery.libp2pNode) {
        setMySession(discovery.libp2pNode.peerId.toString())
      }
      setPeers(discovery.getPeers())
      setIsReady(true)
    }

    initP2P().catch(console.error)
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (selectedPeer) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, selectedPeer])

  const handleSendMessage = async () => {
    if (!selectedPeer || !inputText.trim()) return
    const { chatManager } = await import('@/lib/p2p/chat')
    chatManager.sendMessage(selectedPeer.transportId, inputText)
    setInputText('')
  }

  const handleConnect = async (peer: PeerInfo) => {
    const { chatManager } = await import('@/lib/p2p/chat')
    chatManager.connectToPeer(peer)
    setSelectedPeer(peer)
  }

  const handleJoinRoom = async () => {
    const { chatManager } = await import('@/lib/p2p/chat')
    const { discovery } = await import('@/lib/p2p/dht')
    await chatManager.setRoom(room, secret)
    setPeers(discovery.getPeers())
  }

  return (
    <div className="h-screen w-screen bg-black flex flex-col">
      <header className="px-4 py-3 border-b border-white/10 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold gradient-text-uiverse">Secure Rendezvous</h1>
          <p className="text-xs text-white/40">Ephemeral, PQ-safe mesh chat</p>
        </div>
        <div className="flex items-center gap-2">
          <Wifi className={`w-4 h-4 ${isReady ? 'text-green-500' : 'text-yellow-500 animate-pulse'}`} />
          <span className="text-[10px] text-white/50 font-mono">{peers.length} peers</span>
        </div>
      </header>

      <div className="p-4 space-y-3 border-b border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <LiquidGlass preset="clean" className="p-4 rounded-xl flex items-center gap-3">
            <Lock className="text-purple-400" />
            <div>
              <p className="text-white text-sm font-semibold">Ephemeral Identity</p>
              <p className="text-white/50 text-xs">Rotates every session; no global IDs.</p>
            </div>
          </LiquidGlass>
          <LiquidGlass preset="clean" className="p-4 rounded-xl flex items-center gap-3">
            <KeyRound className="text-green-400" />
            <div>
              <p className="text-white text-sm font-semibold">Hybrid PQ Handshake</p>
              <p className="text-white/50 text-xs">X25519 + Kyber + Double Ratchet.</p>
            </div>
          </LiquidGlass>
          <LiquidGlass preset="clean" className="p-4 rounded-xl flex items-center gap-3">
            <ShieldCheck className="text-blue-400" />
            <div>
              <p className="text-white text-sm font-semibold">Hard Security</p>
              <p className="text-white/50 text-xs">No fallbacks. PFS + PCS enforced.</p>
            </div>
          </LiquidGlass>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <LiquidGlass preset="frost" className="p-4 rounded-xl flex-1 space-y-2">
            <p className="text-white/70 text-sm font-semibold">Join a Room</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="Room name"
              />
              <input
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="Shared secret"
              />
            </div>
            <button
              onClick={handleJoinRoom}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm px-4 py-2 rounded-lg w-fit"
            >
              Join / Rotate Identity
            </button>
            <p className="text-[10px] text-white/40 font-mono break-all">
              Transport ID: {mySession || 'initializing...'}
            </p>
          </LiquidGlass>
          <LiquidGlass preset="clean" className="p-4 rounded-xl w-full md:w-64">
            <p className="text-white/60 text-xs mb-2">Safety Number</p>
            <p className="text-white font-mono text-sm">
              {selectedPeer ? sas[selectedPeer.transportId] || 'Waiting…' : 'Connect to view SAS'}
            </p>
            <p className="text-[10px] text-white/40 mt-1">Verify out-of-band (QR / voice)</p>
          </LiquidGlass>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <AnimatePresence mode="wait">
          {!selectedPeer ? (
            <motion.div
              key="mesh"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 overflow-y-auto p-4 space-y-3"
            >
              {peers.length === 0 ? (
                <div className="text-center py-12 text-white/40">
                  <Radio className="w-10 h-10 mx-auto mb-3 animate-pulse" />
                  <p>Waiting for peers in this room/secret…</p>
                </div>
              ) : (
                peers.map((peer) => (
                  <LiquidGlass
                    key={peer.sessionId}
                    preset="pulse"
                    className="p-4 rounded-xl cursor-pointer"
                    onClick={() => handleConnect(peer)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-mono text-sm truncate">{peer.sessionId}</p>
                        <p className="text-green-400 text-xs">PQ bundle ready · expires in ~1m</p>
                      </div>
                      <div className="text-white/60 text-xs">tap to connect</div>
                    </div>
                  </LiquidGlass>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 flex flex-col bg-black"
            >
              <div className="px-4 py-2 border-b border-white/10 flex items-center gap-3 bg-black/50 backdrop-blur-sm z-10">
                <button onClick={() => setSelectedPeer(null)} className="p-2 -ml-2 text-white/80 hover:text-white">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex-1 overflow-hidden">
                  <p className="text-white font-mono text-sm truncate">{selectedPeer.sessionId}</p>
                  <p className="text-xs text-green-400">Double Ratchet · PQ hybrid</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(messages[selectedPeer.transportId] || []).length === 0 && (
                  <div className="text-center text-white/30 py-10">
                    <p>Start the conversation securely.</p>
                    <p className="text-xs mt-2 font-mono">No plaintext, padded frames, timing obfuscation</p>
                  </div>
                )}
                {(messages[selectedPeer.transportId] || []).map((msg) => {
                  const isMe = msg.sender === mySession
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] p-3 rounded-2xl ${
                          isMe
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none'
                            : 'bg-white/10 text-white rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p className="text-[10px] opacity-50 mt-1 text-right">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-black border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Message..."
                    className="flex-1 bg-white/10 border-none rounded-full px-4 py-3 text-white focus:ring-1 focus:ring-purple-500 outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="p-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  )
}
