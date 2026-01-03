/**
 * Unified Storage Abstraction
 * 
 * Provides a unified interface for multiple storage backends.
 * Implements round-robin distribution strategy between Telegram and Streamtape.
 */

import { TelegramStorage, FileMetadata as TelegramFileMetadata } from './telegram-storage'
import { StreamtapeStorage, StreamtapeFileMetadata } from './streamtape-storage'

export interface UploadOptions {
  mimeType?: string
  description?: string
  caption?: string
  folder?: string
}

export interface FileMetadata {
  fileId: string
  fileUniqueId: string
  fileName: string
  fileSize?: number
  mimeType?: string
  uploadedAt: number
  storageType: 'telegram' | 'streamtape'
  link?: string
}

export type StorageType = 'telegram' | 'streamtape'

export class UnifiedStorage {
  private telegramStorage: TelegramStorage
  private streamtapeStorage: StreamtapeStorage
  private lastUsedStorage: StorageType = 'telegram'
  private storageMap: Map<string, StorageType> = new Map() // Track which storage each file is in

  constructor() {
    // Only initialize server-side modules when running on the server
    if (typeof window === 'undefined') {
      try {
        const { getTelegramStorage } = require('./telegram-storage')
        const { getStreamtapeStorage } = require('./streamtape-storage')
        this.telegramStorage = getTelegramStorage()
        this.streamtapeStorage = getStreamtapeStorage()
      } catch (e) {
        // Fallback if modules can't be loaded
        console.warn('Failed to initialize storage backends:', e)
        this.telegramStorage = null as any
        this.streamtapeStorage = null as any
      }
    } else {
      // Client-side: use placeholders
      this.telegramStorage = null as any
      this.streamtapeStorage = null as any
    }
  }

  /**
   * Initialize storage backends
   */
  async initialize(): Promise<void> {
    if (typeof window !== 'undefined') {
      return // Client-side, skip initialization
    }

    try {
      if (this.telegramStorage) {
        await this.telegramStorage.initialize()
      }
    } catch (error) {
      console.warn('Failed to initialize Telegram storage:', error)
    }

    try {
      if (this.streamtapeStorage) {
        await this.streamtapeStorage.initialize()
      }
    } catch (error) {
      console.warn('Failed to initialize Streamtape storage:', error)
    }
  }

  /**
   * Get next storage for round-robin distribution
   */
  private getNextStorage(): StorageType {
    this.lastUsedStorage = this.lastUsedStorage === 'telegram' ? 'streamtape' : 'telegram'
    return this.lastUsedStorage
  }

  /**
   * Convert Telegram metadata to unified format
   */
  private convertTelegramMetadata(metadata: TelegramFileMetadata): FileMetadata {
    return {
      fileId: metadata.fileId,
      fileUniqueId: metadata.fileUniqueId,
      fileName: metadata.fileName,
      fileSize: metadata.fileSize,
      mimeType: metadata.mimeType,
      uploadedAt: metadata.uploadedAt,
      storageType: 'telegram',
    }
  }

  /**
   * Convert Streamtape metadata to unified format
   */
  private convertStreamtapeMetadata(metadata: StreamtapeFileMetadata): FileMetadata {
    return {
      fileId: metadata.fileId,
      fileUniqueId: metadata.fileId, // Streamtape uses fileId as unique ID
      fileName: metadata.fileName,
      fileSize: metadata.fileSize,
      mimeType: metadata.mimeType,
      uploadedAt: metadata.uploadedAt,
      storageType: 'streamtape',
      link: metadata.link,
    }
  }

  /**
   * Upload file using round-robin strategy
   */
  async uploadFile(
    fileName: string,
    buffer: Buffer,
    options?: UploadOptions
  ): Promise<FileMetadata> {
    if (typeof window !== 'undefined') {
      throw new Error('Upload is only available server-side')
    }

    const storageType = this.getNextStorage()
    let metadata: FileMetadata
    let lastError: Error | null = null

    // Try primary storage
    try {
      if (storageType === 'telegram' && this.telegramStorage) {
        const telegramMeta = await this.telegramStorage.uploadFile(fileName, buffer, {
          mimeType: options?.mimeType,
          description: options?.description,
          caption: options?.caption,
        })
        metadata = this.convertTelegramMetadata(telegramMeta)
        this.storageMap.set(metadata.fileId, 'telegram')
        return metadata
      } else if (storageType === 'streamtape' && this.streamtapeStorage) {
        const streamtapeMeta = await this.streamtapeStorage.uploadFile(fileName, buffer, {
          folder: options?.folder,
          mimeType: options?.mimeType,
        })
        metadata = this.convertStreamtapeMetadata(streamtapeMeta)
        this.storageMap.set(metadata.fileId, 'streamtape')
        return metadata
      }
    } catch (error) {
      lastError = error as Error
      console.warn(`Failed to upload to ${storageType}, trying fallback:`, error)
    }

    // Fallback to other storage
    const fallbackType: StorageType = storageType === 'telegram' ? 'streamtape' : 'telegram'
    try {
      if (fallbackType === 'telegram' && this.telegramStorage) {
        const telegramMeta = await this.telegramStorage.uploadFile(fileName, buffer, {
          mimeType: options?.mimeType,
          description: options?.description,
          caption: options?.caption,
        })
        metadata = this.convertTelegramMetadata(telegramMeta)
        this.storageMap.set(metadata.fileId, 'telegram')
        return metadata
      } else if (fallbackType === 'streamtape' && this.streamtapeStorage) {
        const streamtapeMeta = await this.streamtapeStorage.uploadFile(fileName, buffer, {
          folder: options?.folder,
          mimeType: options?.mimeType,
        })
        metadata = this.convertStreamtapeMetadata(streamtapeMeta)
        this.storageMap.set(metadata.fileId, 'streamtape')
        return metadata
      }
    } catch (error) {
      console.error('Fallback upload also failed:', error)
      throw lastError || new Error('Both storage backends failed')
    }

    throw new Error('No storage backends available')
  }

  /**
   * Download file - try primary storage, fallback to secondary
   */
  async downloadFileById(fileId: string): Promise<Buffer | null> {
    if (typeof window !== 'undefined') {
      throw new Error('Download is only available server-side')
    }

    // Check which storage this file is in
    const storageType = this.storageMap.get(fileId)

    // Try known storage first
    if (storageType === 'telegram' && this.telegramStorage) {
      const buffer = await this.telegramStorage.downloadFileById(fileId)
      if (buffer) return buffer
    } else if (storageType === 'streamtape' && this.streamtapeStorage) {
      const buffer = await this.streamtapeStorage.downloadFileById(fileId)
      if (buffer) return buffer
    }

    // If not found or storage type unknown, try both
    if (this.telegramStorage) {
      const buffer = await this.telegramStorage.downloadFileById(fileId)
      if (buffer) {
        this.storageMap.set(fileId, 'telegram')
        return buffer
      }
    }

    if (this.streamtapeStorage) {
      const buffer = await this.streamtapeStorage.downloadFileById(fileId)
      if (buffer) {
        this.storageMap.set(fileId, 'streamtape')
        return buffer
      }
    }

    return null
  }

  /**
   * Get file URL for streaming/access
   */
  getFileUrl(fileId: string, storageType?: StorageType): string {
    // Determine storage type
    const type = storageType || this.storageMap.get(fileId) || 'telegram'

    if (type === 'streamtape' && this.streamtapeStorage) {
      return this.streamtapeStorage.getFileUrl(fileId)
    } else if (type === 'telegram' && this.telegramStorage) {
      return this.telegramStorage.getFileUrl(fileId)
    }

    // Fallback
    return `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileId}`
  }

  /**
   * Delete file from storage
   */
  async deleteFile(fileId: string): Promise<boolean> {
    if (typeof window !== 'undefined') {
      throw new Error('Delete is only available server-side')
    }

    const storageType = this.storageMap.get(fileId) || 'telegram'

    try {
      if (storageType === 'telegram' && this.telegramStorage) {
        // Telegram requires messageId for deletion, which we don't track
        // For now, just remove from map
        this.storageMap.delete(fileId)
        return true
      } else if (storageType === 'streamtape' && this.streamtapeStorage) {
        const result = await this.streamtapeStorage.deleteFile(fileId)
        if (result) {
          this.storageMap.delete(fileId)
        }
        return result
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }

    return false
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    if (typeof window !== 'undefined') {
      return null // Client-side, return null
    }

    const storageType = this.storageMap.get(fileId) || 'telegram'

    try {
      if (storageType === 'telegram' && this.telegramStorage) {
        const meta = await this.telegramStorage.getFileMetadata(fileId)
        if (meta) {
          return this.convertTelegramMetadata({
            fileId: meta.file_id,
            fileUniqueId: meta.file_unique_id || meta.file_id,
            fileName: meta.file_path || fileId,
            fileSize: meta.file_size,
            mimeType: undefined,
            uploadedAt: Date.now(),
          })
        }
      } else if (storageType === 'streamtape' && this.streamtapeStorage) {
        const fileInfo = await this.streamtapeStorage.getFileInfo(fileId)
        const fileData = fileInfo[fileId]
        if (fileData) {
          return this.convertStreamtapeMetadata({
            fileId: fileData.id,
            fileName: fileData.name,
            fileSize: fileData.size,
            mimeType: fileData.type,
            uploadedAt: Date.now(),
            link: fileData.link,
            linkId: fileData.linkid,
          })
        }
      }
    } catch (error) {
      console.error('Error getting file metadata:', error)
    }

    return null
  }

  /**
   * Store file metadata mapping
   */
  storeFileMapping(fileId: string, storageType: StorageType): void {
    this.storageMap.set(fileId, storageType)
  }

  /**
   * Get storage type for a file
   */
  getStorageType(fileId: string): StorageType | undefined {
    return this.storageMap.get(fileId)
  }
}

// Singleton instance
let unifiedStorageInstance: UnifiedStorage | null = null

export function getUnifiedStorage(): UnifiedStorage {
  if (!unifiedStorageInstance) {
    unifiedStorageInstance = new UnifiedStorage()
  }
  return unifiedStorageInstance
}


