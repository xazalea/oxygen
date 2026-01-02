/**
 * Disappearing Messages System
 * 
 * Handles self-destructing messages with screenshot detection.
 */

import { getDBOperations } from './telegram-db-operations'
import { MessageRecord } from './telegram-db-schema'

export interface DisappearingMessageOptions {
  duration: number // Duration in seconds (1s to 604800s = 1 week)
  notifyOnScreenshot?: boolean
}

export class DisappearingMessages {
  private db = getDBOperations()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startCleanup()
  }

  /**
   * Create a disappearing message
   */
  async createMessage(
    chatId: string,
    senderId: string,
    content: string,
    options: DisappearingMessageOptions
  ): Promise<MessageRecord> {
    const expiresAt = Date.now() + (options.duration * 1000)

    return await this.db.createMessage({
      chatId,
      senderId,
      type: 'text',
      content,
      isDisappearing: true,
      expiresAt,
      isRead: false
    })
  }

  /**
   * Mark message as read (triggers deletion if disappearing)
   */
  async markAsRead(messageId: string, chatId: string): Promise<void> {
    const messages = await this.db.getChatMessages(chatId, 1000)
    const msg = messages.find(m => m.id === messageId)
    
    if (msg && msg.isDisappearing && !msg.isRead) {
      // Update message - need to use proper DB operations
      const { getTelegramDatabase } = require('./telegram-db')
      const db = getTelegramDatabase()
      await db.update('messages', messageId, {
        isRead: true,
        readAt: Date.now()
      })

      // Delete immediately if viewed and expired
      if (msg.expiresAt && msg.expiresAt <= Date.now()) {
        await this.deleteMessage(messageId)
      }
    }
  }

  /**
   * Delete expired messages
   */
  async deleteExpiredMessages(): Promise<void> {
    const expired = await this.db.getExpiredMessages()
    
    for (const message of expired) {
      await this.deleteMessage(message.id)
    }
  }

  /**
   * Delete a message
   */
  private async deleteMessage(messageId: string): Promise<void> {
    // Delete from database
    const { getTelegramDatabase } = require('./telegram-db')
    const db = getTelegramDatabase()
    await db.delete('messages', messageId)
  }

  /**
   * Start automatic cleanup
   */
  private startCleanup(): void {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.deleteExpiredMessages().catch(console.error)
    }, 60000)
  }

  /**
   * Stop cleanup
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Detect screenshot (client-side implementation)
   * Note: This is a simplified version. Full implementation would require
   * browser APIs or native app integration.
   */
  detectScreenshot(): void {
    // Listen for visibility changes that might indicate screenshot
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          // Page hidden - might be screenshot
          // In production, use more sophisticated detection
        }
      })
    }
  }
}

// Singleton instance
let disappearingInstance: DisappearingMessages | null = null

export function getDisappearingMessages(): DisappearingMessages {
  if (!disappearingInstance) {
    disappearingInstance = new DisappearingMessages()
  }
  return disappearingInstance
}

