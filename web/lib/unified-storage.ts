/**
 * Unified Storage Abstraction
 * 
 * Provides a unified interface for multiple storage backends.
 * Implements round-robin distribution strategy between Telegram, Streamtape, and Google Photos.
 */

import { TelegramStorage, FileMetadata as TelegramFileMetadata } from './telegram-storage'
import { StreamtapeStorage, StreamtapeFileMetadata } from './streamtape-storage'
import { GooglePhotosStorage, GooglePhotosFileMetadata } from './google-photos-storage'

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
  storageType: 'telegram' | 'streamtape' | 'googlephotos'
  link?: string
}

export type StorageType = 'telegram' | 'streamtape' | 'googlephotos'

export class UnifiedStorage {
  private telegramStorage: TelegramStorage
  private streamtapeStorage: StreamtapeStorage
  private googlePhotosStorage: GooglePhotosStorage
  private lastUsedStorage: StorageType = 'telegram'
  private storageMap: Map<string, StorageType> = new Map() // Track which storage each file is in

  constructor() {
    // Only initialize server-side modules when running on the server
    if (typeof window === 'undefined') {
      try {
        const { getTelegramStorage } = require('./telegram-storage')
        const { getStreamtapeStorage } = require('./streamtape-storage')
        const { getGooglePhotosStorage } = require('./google-photos-storage')
        
        this.telegramStorage = getTelegramStorage()
        this.streamtapeStorage = getStreamtapeStorage()
        this.googlePhotosStorage = getGooglePhotosStorage()
      } catch (e) {
        // Fallback if modules can't be loaded
        console.warn('Failed to initialize storage backends:', e)
        this.telegramStorage = null as any
        this.streamtapeStorage = null as any
        this.googlePhotosStorage = null as any
      }
    } else {
      // Client-side: use placeholders
      this.telegramStorage = null as any
      this.streamtapeStorage = null as any
      this.googlePhotosStorage = null as any
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
      if (this.telegramStorage) await this.telegramStorage.initialize()
    } catch (error) {
      console.warn('Failed to initialize Telegram storage:', error)
    }

    try {
      if (this.streamtapeStorage) await this.streamtapeStorage.initialize()
    } catch (error) {
      console.warn('Failed to initialize Streamtape storage:', error)
    }

    try {
      if (this.googlePhotosStorage) await this.googlePhotosStorage.initialize()
    } catch (error) {
      console.warn('Failed to initialize Google Photos storage:', error)
    }
  }

  /**
   * Get next storage for round-robin distribution
   */
  private getNextStorage(): StorageType {
    // Simple round-robin: telegram -> streamtape -> googlephotos -> telegram
    if (this.lastUsedStorage === 'telegram') {
      this.lastUsedStorage = 'streamtape'
    } else if (this.lastUsedStorage === 'streamtape') {
      this.lastUsedStorage = 'googlephotos'
    } else {
      this.lastUsedStorage = 'telegram'
    }
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
   * Convert Google Photos metadata to unified format
   */
  private convertGooglePhotosMetadata(metadata: GooglePhotosFileMetadata): FileMetadata {
    return {
      fileId: metadata.fileId,
      fileUniqueId: metadata.fileId,
      fileName: metadata.fileName,
      fileSize: metadata.fileSize,
      mimeType: metadata.mimeType,
      uploadedAt: metadata.uploadedAt,
      storageType: 'googlephotos',
      link: metadata.baseUrl
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

    const startStorage = this.getNextStorage()
    let currentStorage = startStorage
    let attempts = 0
    const maxAttempts = 3
    let lastError: Error | null = null

    // Try storages in order until one succeeds
    while (attempts < maxAttempts) {
      try {
        if (currentStorage === 'telegram' && this.telegramStorage) {
          const telegramMeta = await this.telegramStorage.uploadFile(fileName, buffer, {
            mimeType: options?.mimeType,
            description: options?.description,
            caption: options?.caption,
          })
          const metadata = this.convertTelegramMetadata(telegramMeta)
          this.storageMap.set(metadata.fileId, 'telegram')
          return metadata
        } else if (currentStorage === 'streamtape' && this.streamtapeStorage) {
          const streamtapeMeta = await this.streamtapeStorage.uploadFile(fileName, buffer, {
            folder: options?.folder,
            mimeType: options?.mimeType,
          })
          const metadata = this.convertStreamtapeMetadata(streamtapeMeta)
          this.storageMap.set(metadata.fileId, 'streamtape')
          return metadata
        } else if (currentStorage === 'googlephotos' && this.googlePhotosStorage) {
          const gphotosMeta = await this.googlePhotosStorage.uploadFile(fileName, buffer, {
             mimeType: options?.mimeType,
             description: options?.description,
             caption: options?.caption
          })
          const metadata = this.convertGooglePhotosMetadata(gphotosMeta)
          this.storageMap.set(metadata.fileId, 'googlephotos')
          return metadata
        }
      } catch (error) {
        lastError = error as Error
        console.warn(`Failed to upload to ${currentStorage}, trying next:`, error)
      }

      // Move to next storage
      if (currentStorage === 'telegram') currentStorage = 'streamtape'
      else if (currentStorage === 'streamtape') currentStorage = 'googlephotos'
      else currentStorage = 'telegram'
      
      attempts++
    }

    throw lastError || new Error('All storage backends failed')
  }

  /**
   * Download file - try primary storage, fallback to others
   */
  async downloadFileById(fileId: string): Promise<Buffer | null> {
    if (typeof window !== 'undefined') {
      throw new Error('Download is only available server-side')
    }

    // Check which storage this file is in
    const storageType = this.storageMap.get(fileId)

    // Helper to try download
    const tryDownload = async (type: StorageType): Promise<Buffer | null> => {
      if (type === 'telegram' && this.telegramStorage) {
        return await this.telegramStorage.downloadFileById(fileId)
      } else if (type === 'streamtape' && this.streamtapeStorage) {
        return await this.streamtapeStorage.downloadFileById(fileId)
      } else if (type === 'googlephotos' && this.googlePhotosStorage) {
        return await this.googlePhotosStorage.downloadFileById(fileId)
      }
      return null
    }

    // 1. Try known storage
    if (storageType) {
      const buffer = await tryDownload(storageType)
      if (buffer) return buffer
    }

    // 2. Try all storages (fallback)
    const types: StorageType[] = ['telegram', 'streamtape', 'googlephotos']
    for (const type of types) {
      if (type === storageType) continue // Already tried
      
      const buffer = await tryDownload(type)
      if (buffer) {
        this.storageMap.set(fileId, type) // Update mapping
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
    } else if (type === 'googlephotos' && this.googlePhotosStorage) {
      return this.googlePhotosStorage.getFileUrl(fileId)
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
      } else if (storageType === 'googlephotos') {
         // Google Photos API doesn't easily support deletion via ID without album management
         this.storageMap.delete(fileId)
         return true
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
      } else if (storageType === 'googlephotos' && this.googlePhotosStorage) {
          const meta = await this.googlePhotosStorage.getFileMetadata(fileId)
          if (meta) {
              return this.convertGooglePhotosMetadata(meta)
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
