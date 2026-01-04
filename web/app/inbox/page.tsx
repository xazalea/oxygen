'use client'

import { useState, useEffect, useRef } from 'react'
import { BottomNav } from '@/components/Navigation/BottomNav'
import { Bell, MessageCircle, UserPlus, Heart, MessageSquare, Send, ArrowLeft, Wifi, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { UiverseCard } from '@/components/UI/UiverseCard'
import { LiquidGlass } from '@/components/UI/LiquidGlass'
import type { ChatMessage, PeerInfo } from '@/lib/p2p/types'

interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'mention'
  user: {
    username: string
    avatar?: string
  }
  text: string
  timestamp: number
  read: boolean
}

export default function InboxPage() {
  // Mock notifications (Restored from original)
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'like',
      user: { username: 'user1' },
      text: 'liked your video',
      timestamp: Date.now() - 1000 * 60 * 5,
      read: false,
    },
    {
      id: '2',
      type: 'comment',
      user: { username: 'user2' },
      text: 'commented on your video',
      timestamp: Date.now() - 1000 * 60 * 30,
      read: false,
    },
    {
      id: '3',
      type: 'follow',
      user: { username: 'user3' },
      text: 'started following you',
      timestamp: Date.now() - 1000 * 60 * 60,
      read: true,
    },
  ]

  // P2P State
  const [isReady, setIsReady] = useState(false)
  const [peers, setPeers] = useState<PeerInfo[]>([])
  const [selectedPeer, setSelectedPeer] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({})
  const [inputText, setInputText] = useState('')
  const [myId, setMyId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialization
  useEffect(() => {
    let mounted = true;

    const initP2P = async () => {
      try {
        const { chatManager } = await import('@/lib/p2p/chat');
        const { discovery } = await import('@/lib/p2p/dht');

        if (!mounted) return;

        discovery.on('peer:discovered', (peer: PeerInfo) => {
          setPeers(prev => {
            if (prev.find(p => p.peerId === peer.peerId)) return prev;
            return [...prev, peer];
          });
        });

        chatManager.on('message', ({ peerId, message }: { peerId: string, message: ChatMessage }) => {
          setMessages(prev => ({
            ...prev,
            [peerId]: [...(prev[peerId] || []), message]
          }));
        });

        await chatManager.init();
        
        if (discovery.libp2pNode) {
          setMyId(discovery.libp2pNode.peerId.toString());
        }
        setIsReady(true);
        setPeers(discovery.getPeers());
      } catch (err) {
        console.error("Failed to init P2P", err);
      }
    };

    initP2P();

    return () => {
      mounted = false;
    };
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    if (selectedPeer) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedPeer]);

  const handleSendMessage = async () => {
    if (!selectedPeer || !inputText.trim()) return;
    const { chatManager } = await import('@/lib/p2p/chat');
    chatManager.sendMessage(selectedPeer, inputText);
    setInputText('');
  };

  const handleConnect = async (peerId: string) => {
    const { chatManager } = await import('@/lib/p2p/chat');
    chatManager.connectToPeer(peerId);
    setSelectedPeer(peerId);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-blue-500" />
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />
      default:
        return <Bell className="w-5 h-5 text-white/60" />
    }
  }

  const formatTime = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="h-screen w-screen bg-black flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 border-b border-white/10 flex justify-between items-center">
        <h1 className="text-xl font-bold gradient-text-uiverse">
          {selectedPeer ? 'Chat' : 'Inbox'}
        </h1>
        {isReady && (
           <div className="flex items-center gap-2">
             <Wifi className={`w-3 h-3 ${peers.length > 0 ? 'text-green-500' : 'text-yellow-500'}`} />
             <span className="text-[10px] text-white/40 font-mono">{peers.length} peers</span>
           </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <AnimatePresence mode="wait">
          {!selectedPeer ? (
            <motion.div 
              key="inbox"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 overflow-y-auto"
            >
              {/* Notifications Section */}
              <div className="px-4 py-2">
                <h2 className="text-white/60 text-sm font-semibold mb-3">Notifications</h2>
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <LiquidGlass
                      key={notification.id}
                      preset={notification.read ? 'frost' : 'pulse'}
                      className="rounded-xl"
                    >
                      <motion.div
                        whileHover={{ x: 5, scale: 1.02 }}
                        className="flex items-center gap-3 p-4"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-lg">
                          {notification.user.username[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm">
                            <span className="font-semibold">@{notification.user.username}</span>{' '}
                            {notification.text}
                          </p>
                          <p className="text-white/50 text-xs mt-1">{formatTime(notification.timestamp)}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {getIcon(notification.type)}
                        </div>
                        {!notification.read && (
                          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex-shrink-0 glow-uiverse" />
                        )}
                      </motion.div>
                    </LiquidGlass>
                  ))}
                </div>
              </div>

              {/* Messages / Peers Section */}
              <div className="px-4 py-2 pb-20">
                <h2 className="text-white/60 text-sm font-semibold mb-3 flex items-center justify-between">
                  <span>Messages (P2P Mesh)</span>
                  {myId && <span className="text-[10px] font-mono opacity-50">ID: {myId.slice(0,6)}...</span>}
                </h2>
                
                {peers.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-2 animate-pulse" />
                    <p className="text-white/60 text-sm">Discovering peers...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                     {peers.map(peer => (
                        <LiquidGlass
                           key={peer.peerId}
                           onClick={() => handleConnect(peer.peerId)}
                           preset="clean"
                           className="rounded-xl cursor-pointer"
                        >
                           <motion.div 
                              whileHover={{ scale: 1.01 }}
                              className="flex items-center gap-3 p-4"
                           >
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white">
                                <User className="w-6 h-6" />
                              </div>
                              <div className="flex-1">
                                 <p className="text-white font-mono text-sm truncate">{peer.peerId}</p>
                                 <p className="text-green-400 text-xs flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> 
                                    Online via Mesh
                                 </p>
                              </div>
                           </motion.div>
                        </LiquidGlass>
                     ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 flex flex-col bg-black"
            >
              {/* Chat Header */}
              <div className="px-4 py-2 border-b border-white/10 flex items-center gap-3 bg-black/50 backdrop-blur-sm z-10">
                 <button onClick={() => setSelectedPeer(null)} className="p-2 -ml-2 text-white/80 hover:text-white">
                    <ArrowLeft className="w-6 h-6" />
                 </button>
                 <div className="flex-1 overflow-hidden">
                    <p className="text-white font-mono text-sm truncate">{selectedPeer}</p>
                    <p className="text-xs text-green-400">Encrypted P2P Connection</p>
                 </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {(messages[selectedPeer] || []).length === 0 && (
                    <div className="text-center text-white/30 py-10">
                       <p>Start the conversation securely.</p>
                       <p className="text-xs mt-2 font-mono">End-to-end encrypted direct channel</p>
                    </div>
                 )}
                 {(messages[selectedPeer] || []).map((msg) => {
                    const isMe = msg.sender === myId;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[75%] p-3 rounded-2xl ${
                              isMe 
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none' 
                              : 'bg-white/10 text-white rounded-bl-none'
                           }`}>
                              <p className="text-sm">{msg.text}</p>
                              <p className="text-[10px] opacity-50 mt-1 text-right">
                                 {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                           </div>
                        </div>
                    )
                 })}
                 <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
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
