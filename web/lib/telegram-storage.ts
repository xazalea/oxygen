/**
 * Telegram Cloud Storage Service
 * 
 * Handles file upload/download to Telegram using Bot API.
 * Inspired by: https://github.com/ebinxavier/telegramCloudStorage
 */

import TelegramBot from 'node-telegram-bot-api'

export interface UploadOptions {
  mimeType?: string
  description?: string
  caption?: string
}

export interface FileMetadata {
  fileId: string
  fileUniqueId: string
  fileName: string
  fileSize?: number
  mimeType?: string
  uploadedAt: number
}

export class TelegramStorage {
  private bot: TelegramBot | null = null
  private chatId: string
  private dbChatId: string
  private fileMetadataCache: Map<string, FileMetadata> = new Map()

  constructor() {
    this.chatId = process.env.TELEGRAM_CHAT_ID || ''
    this.dbChatId = process.env.TELEGRAM_DB_CHAT_ID || this.chatId
    
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (token) {
      this.bot = new TelegramBot(token, { polling: false })
    }
  }

  /**
   * Initialize the bot (call this before using)
   */
  async initialize(): Promise<void> {
    if (!this.bot) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set')
    }
    if (!this.chatId) {
      throw new Error('TELEGRAM_CHAT_ID is not set')
    }
  }

  /**
   * Upload a file to Telegram
   */
  async uploadFile(
    fileName: string,
    buffer: Buffer,
    options?: UploadOptions
  ): Promise<FileMetadata> {
    if (!this.bot) {
      await this.initialize()
    }

    if (!this.bot) {
      throw new Error('Telegram bot not initialized')
    }

    try {
      // Determine file type and upload method
      const mimeType = options?.mimeType || 'application/octet-stream'
      const isVideo = mimeType.startsWith('video/')
      const isImage = mimeType.startsWith('image/')
      const isAudio = mimeType.startsWith('audio/')
      const isDocument = !isVideo && !isImage && !isAudio

      let fileId: string
      let fileSize: number

      if (isVideo) {
        const result = await this.bot.sendVideo(this.chatId, buffer, {
          caption: options?.caption || options?.description,
          filename: fileName
        })
        fileId = result.video?.file_id || ''
        fileSize = result.video?.file_size || buffer.length
      } else if (isImage) {
        const result = await this.bot.sendPhoto(this.chatId, buffer, {
          caption: options?.caption || options?.description,
          filename: fileName
        })
        fileId = result.photo?.[result.photo.length - 1]?.file_id || ''
        fileSize = result.photo?.[result.photo.length - 1]?.file_size || buffer.length
      } else if (isAudio) {
        const result = await this.bot.sendAudio(this.chatId, buffer, {
          caption: options?.caption || options?.description,
          filename: fileName
        })
        fileId = result.audio?.file_id || ''
        fileSize = result.audio?.file_size || buffer.length
      } else {
        // Document
        const result = await this.bot.sendDocument(this.chatId, buffer, {
          caption: options?.caption || options?.description,
          filename: fileName
        })
        fileId = result.document?.file_id || ''
        fileSize = result.document?.file_size || buffer.length
      }

      const metadata: FileMetadata = {
        fileId,
        fileUniqueId: fileId, // Telegram provides unique ID separately, using fileId for now
        fileName,
        fileSize,
        mimeType,
        uploadedAt: Date.now()
      }

      // Cache metadata
      this.fileMetadataCache.set(fileName, metadata)

      return metadata
    } catch (error) {
      console.error('Error uploading file to Telegram:', error)
      throw error
    }
  }

  /**
   * Upload a database file (to separate chat if configured)
   */
  async uploadDatabaseFile(
    fileName: string,
    buffer: Buffer,
    options?: UploadOptions
  ): Promise<FileMetadata> {
    const originalChatId = this.chatId
    this.chatId = this.dbChatId
    
    try {
      return await this.uploadFile(fileName, buffer, options)
    } finally {
      this.chatId = originalChatId
    }
  }

  /**
   * Download a file from Telegram by file ID
   */
  async downloadFileById(fileId: string): Promise<Buffer | null> {
    if (!this.bot) {
      await this.initialize()
    }

    if (!this.bot) {
      throw new Error('Telegram bot not initialized')
    }

    try {
      const fileStream = this.bot.getFileStream(fileId)
      const chunks: Buffer[] = []

      return new Promise((resolve, reject) => {
        fileStream.on('data', (chunk: Buffer) => {
          chunks.push(chunk)
        })

        fileStream.on('end', () => {
          resolve(Buffer.concat(chunks))
        })

        fileStream.on('error', (error) => {
          reject(error)
        })
      })
    } catch (error) {
      console.error('Error downloading file from Telegram:', error)
      return null
    }
  }

  /**
   * Download a file by searching for it in chat history
   * Note: This is a simplified version. In production, you'd maintain a file index.
   */
  async downloadFile(fileName: string): Promise<Buffer | null> {
    // First check cache for file ID
    const metadata = this.fileMetadataCache.get(fileName)
    if (metadata) {
      return await this.downloadFileById(metadata.fileId)
    }

    // If not in cache, we'd need to search chat history
    // For now, return null - in production, maintain a file index
    console.warn(`File ${fileName} not found in cache. File indexing needed.`)
    return null
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<any> {
    if (!this.bot) {
      await this.initialize()
    }

    if (!this.bot) {
      throw new Error('Telegram bot not initialized')
    }

    try {
      return await this.bot.getFile(fileId)
    } catch (error) {
      console.error('Error getting file metadata:', error)
      return null
    }
  }

  /**
   * Delete a message (and thus the file) from Telegram
   */
  async deleteFile(fileId: string, messageId?: number): Promise<boolean> {
    if (!this.bot) {
      await this.initialize()
    }

    if (!this.bot || !messageId) {
      // Can't delete without message ID
      return false
    }

    try {
      await this.bot.deleteMessage(this.chatId, messageId)
      return true
    } catch (error) {
      console.error('Error deleting file from Telegram:', error)
      return false
    }
  }

  /**
   * Get file download URL
   */
  getFileUrl(fileId: string): string {
    const token = process.env.TELEGRAM_BOT_TOKEN || ''
    return `https://api.telegram.org/file/bot${token}/${fileId}`
  }

  /**
   * Store file metadata for later retrieval
   */
  storeFileMetadata(fileName: string, metadata: FileMetadata): void {
    this.fileMetadataCache.set(fileName, metadata)
  }

  /**
   * Get cached file metadata
   */
  getCachedMetadata(fileName: string): FileMetadata | undefined {
    return this.fileMetadataCache.get(fileName)
  }
}

// Singleton instance
let storageInstance: TelegramStorage | null = null

export function getTelegramStorage(): TelegramStorage {
  if (!storageInstance) {
    storageInstance = new TelegramStorage()
  }
  return storageInstance
}


