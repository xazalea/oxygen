'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Paperclip, Smile, Phone, Video as VideoIcon, MoreVertical } from 'lucide-react'
import { UiverseButton } from '../UI/UiverseButton'
import { UiverseInput } from '../UI/UiverseInput'
import { UiverseCard } from '../UI/UiverseCard'
import { LiquidGlass } from '../UI/LiquidGlass'
import { getDBOperations } from '@/lib/telegram-db-operations'
import { MessageRecord } from '@/lib/telegram-db-schema'
import { getDisappearingMessages } from '@/lib/disappearing-messages'

interface UnifiedMessagesProps {
  chatId: string
  currentUserId: string
}

export function UnifiedMessages({ chatId, currentUserId }: UnifiedMessagesProps) {
  const [messages, setMessages] = useState<MessageRecord[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const disappearing = getDisappearingMessages()

  useEffect(() => {
    loadMessages()
    // Set up polling for new messages
    const interval = setInterval(loadMessages, 2000)
    return () => clearInterval(interval)
  }, [chatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    try {
      const db = getDBOperations()
      const chatMessages = await db.getChatMessages(chatId, 100)
      setMessages(chatMessages.reverse()) // Reverse to show newest at bottom
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputValue.trim()) return

    try {
      const db = getDBOperations()
      await db.createMessage({
        chatId,
        senderId: currentUserId,
        type: 'text',
        content: inputValue,
        isDisappearing: false,
        isRead: false
      })

      setInputValue('')
      loadMessages()
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const sendDisappearingMessage = async (duration: number) => {
    if (!inputValue.trim()) return

    try {
      await disappearing.createMessage(
        chatId,
        currentUserId,
        inputValue,
        { duration, notifyOnScreenshot: true }
      )

      setInputValue('')
      loadMessages()
    } catch (error) {
      console.error('Error sending disappearing message:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="h-screen w-screen bg-black flex flex-col">
      {/* Header */}
      <LiquidGlass preset="default" className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
          <div>
            <p className="text-white font-semibold">Chat</p>
            <p className="text-white/60 text-xs">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UiverseButton variant="icon">
            <Phone className="w-5 h-5" />
          </UiverseButton>
          <UiverseButton variant="icon">
            <VideoIcon className="w-5 h-5" />
          </UiverseButton>
          <UiverseButton variant="icon">
            <MoreVertical className="w-5 h-5" />
          </UiverseButton>
        </div>
      </LiquidGlass>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence>
          {messages.map((message) => {
            const isOwn = message.senderId === currentUserId
            const isDisappearing = message.isDisappearing && message.expiresAt
            const isExpired = isDisappearing && message.expiresAt! < Date.now()

            if (isExpired) return null

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <UiverseCard
                  className={`max-w-[70%] p-3 ${
                    isOwn
                      ? 'bg-primary-500 text-white'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <span className="text-xs opacity-60">
                      {formatTime(message.createdAt)}
                    </span>
                    {isOwn && message.isRead && (
                      <span className="text-xs">✓✓</span>
                    )}
                    {isDisappearing && (
                      <span className="text-xs">⏱️</span>
                    )}
                  </div>
                </UiverseCard>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <LiquidGlass preset="default" className="p-4">
        <div className="flex items-center gap-2">
          <UiverseButton variant="icon">
            <Paperclip className="w-5 h-5" />
          </UiverseButton>
          <UiverseInput
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Type a message..."
            className="flex-1"
          />
          <UiverseButton variant="icon">
            <Smile className="w-5 h-5" />
          </UiverseButton>
          <UiverseButton
            onClick={sendMessage}
            disabled={!inputValue.trim()}
          >
            <Send className="w-5 h-5" />
          </UiverseButton>
        </div>
      </LiquidGlass>
    </div>
  )
}



