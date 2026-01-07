/**
 * Google Photos Storage Service
 * 
 * Handles file upload/download to Google Photos using the API Client
 * with device spoofing enabled.
 * 
 * Features:
 * - Device Spoofing (Pixel XL/5/6) for unlimited storage potential
 * - Steganography (File-to-Image) for storing non-media files
 */

import { getGooglePhotosClient, GooglePhotosApiClient, MediaItemResult } from './google-photos-api'
import { getSteganographyService } from './steganography'

export interface UploadOptions {
  mimeType?: string
  description?: string
  caption?: string
}

export interface GooglePhotosFileMetadata {
  fileId: string
  fileName: string
  fileSize?: number
  mimeType?: string
  uploadedAt: number
  baseUrl?: string
  productUrl?: string
  isEncoded?: boolean // Track if we encoded this file
  originalMimeType?: string
}

export class GooglePhotosStorage {
  private client: GooglePhotosApiClient
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private fileMetadataCache: Map<string, GooglePhotosFileMetadata> = new Map()
  private steganography = getSteganographyService()

  constructor() {
    this.client = getGooglePhotosClient()
    this.refreshToken = process.env.GOOGLE_PHOTOS_REFRESH_TOKEN || null
  }

  /**
   * Initialize storage backend
   */
  async initialize(): Promise<void> {
    if (!this.refreshToken) {
      console.warn('GOOGLE_PHOTOS_REFRESH_TOKEN is not set. Google Photos storage will not work.')
      return
    }

    try {
      // Refresh token to get initial access token
      this.accessToken = await (this.client as any).refreshAccessToken(this.refreshToken)
    } catch (error) {
      console.warn('Failed to initialize Google Photos storage:', error)
      throw error
    }
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureAuth(): Promise<void> {
    if (!this.accessToken && this.refreshToken) {
      await this.initialize()
    }
    if (!this.accessToken) {
      throw new Error('Google Photos not authenticated')
    }
  }

  /**
   * Check if file needs encoding
   * We encode if it's NOT an image or video supported by Google Photos
   */
  private shouldEncode(mimeType?: string): boolean {
    if (!mimeType) return true // Unknown type, encode to be safe
    if (mimeType.startsWith('image/')) return false
    if (mimeType.startsWith('video/')) return false
    return true
  }

  /**
   * Upload file to Google Photos
   */
  async uploadFile(
    fileName: string,
    buffer: Buffer,
    options?: UploadOptions
  ): Promise<GooglePhotosFileMetadata> {
    await this.ensureAuth()

    if (!this.accessToken) {
        throw new Error('Authentication failed')
    }

    const mimeType = options?.mimeType || 'application/octet-stream'
    const needsEncoding = this.shouldEncode(mimeType)
    
    let uploadBuffer = buffer
    let uploadMimeType = mimeType
    let uploadFileName = fileName

    // Encode if necessary
    if (needsEncoding) {
      console.log(`Encoding ${fileName} (${mimeType}) to PNG for Google Photos storage...`)
      uploadBuffer = await this.steganography.encode(buffer)
      uploadMimeType = 'image/png'
      uploadFileName = `${fileName}.enc.png`
    }

    try {
      // 1. Upload bytes
      const uploadToken = await this.client.uploadMedia(uploadBuffer, {
        fileName: uploadFileName,
        mimeType: uploadMimeType,
        accessToken: this.accessToken!
      })

      // 2. Create media item
      const mediaItem = await this.client.createMediaItem(uploadToken, {
        fileName: uploadFileName,
        mimeType: uploadMimeType,
        description: options?.description || options?.caption || (needsEncoding ? `Encoded file: ${fileName}` : undefined),
        accessToken: this.accessToken!
      })

      const metadata: GooglePhotosFileMetadata = {
        fileId: mediaItem.id,
        fileName: mediaItem.filename,
        mimeType: uploadMimeType, // Store the mime type of what's ON Google Photos
        uploadedAt: Date.now(),
        baseUrl: mediaItem.baseUrl,
        productUrl: mediaItem.productUrl,
        fileSize: buffer.length, // Original size
        isEncoded: needsEncoding,
        originalMimeType: mimeType
      }

      this.fileMetadataCache.set(metadata.fileId, metadata)
      return metadata

    } catch (error) {
      console.error('Error uploading to Google Photos:', error)
      throw error
    }
  }

  /**
   * Download file from Google Photos
   */
  async downloadFileById(fileId: string): Promise<Buffer | null> {
    await this.ensureAuth()
    
    // Check cache first
    let metadata = this.fileMetadataCache.get(fileId)
    
    // If not in cache, try to fetch it
    if (!metadata) {
      try {
        const item = await this.client.getMediaItem(fileId, this.accessToken!)
        
        // Detect if it was encoded based on filename
        const isEncoded = item.filename.endsWith('.enc.png')
        
        metadata = {
            fileId: item.id,
            fileName: item.filename,
            mimeType: item.mimeType,
            uploadedAt: Date.now(),
            baseUrl: item.baseUrl,
            productUrl: item.productUrl,
            isEncoded
        }
        this.fileMetadataCache.set(fileId, metadata)
      } catch (e) {
        console.error('Failed to get media item:', e)
        return null
      }
    }

    if (!metadata.baseUrl) {
      return null
    }

    // Google Photos baseUrls allow download with =d parameter
    const downloadUrl = `${metadata.baseUrl}=d`

    try {
      const response = await fetch(downloadUrl)
      if (!response.ok) return null
      
      const arrayBuffer = await response.arrayBuffer()
      let buffer = Buffer.from(arrayBuffer)
      
      // Decode if necessary
      if (metadata.isEncoded) {
        console.log(`Decoding ${metadata.fileName} from PNG...`)
        buffer = await this.steganography.decode(buffer)
      }
      
      return buffer
    } catch (error) {
      console.error('Error downloading from Google Photos:', error)
      return null
    }
  }

  /**
   * Get file URL (baseUrl)
   * Note: If encoded, this returns the PNG URL. 
   * The client might need to know it's encoded to display it (it won't look like the original file).
   */
  getFileUrl(fileId: string): string {
    const meta = this.fileMetadataCache.get(fileId)
    if (meta?.baseUrl) {
      return meta.baseUrl
    }
    return ''
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<GooglePhotosFileMetadata | null> {
    await this.ensureAuth()
    
    // Check cache
    if (this.fileMetadataCache.has(fileId)) {
        return this.fileMetadataCache.get(fileId)!
    }

    try {
        const item = await this.client.getMediaItem(fileId, this.accessToken!)
        const isEncoded = item.filename.endsWith('.enc.png')
        const meta: GooglePhotosFileMetadata = {
            fileId: item.id,
            fileName: item.filename,
            mimeType: item.mimeType,
            uploadedAt: Date.now(),
            baseUrl: item.baseUrl,
            productUrl: item.productUrl,
            isEncoded
        }
        this.fileMetadataCache.set(fileId, meta)
        return meta
    } catch (e) {
        return null
    }
  }
}

// Singleton
let instance: GooglePhotosStorage | null = null

export function getGooglePhotosStorage(): GooglePhotosStorage {
  if (!instance) {
    instance = new GooglePhotosStorage()
  }
  return instance
}
