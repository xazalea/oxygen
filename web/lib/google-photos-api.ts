/**
 * Google Photos API Client
 * 
 * Handles interaction with Google Photos API, including:
 * - OAuth token management
 * - Media upload (Resumable Upload Protocol)
 * - Media item creation
 * - Device spoofing integration
 */

import { getDeviceSpoofer } from './google-photos-spoof'

export interface GooglePhotosUploadOptions {
  mimeType: string
  fileName: string
  description?: string
  accessToken: string
}

export interface UploadResult {
  uploadToken: string
  fileId?: string // Only if we can extract it or create the media item immediately
}

export interface MediaItemResult {
  id: string
  productUrl: string
  baseUrl: string
  mimeType: string
  mediaMetadata: {
    creationTime: string
    width: string
    height: string
    photo?: any
    video?: any
  }
  filename: string
}

export class GooglePhotosApiClient {
  private spoofer = getDeviceSpoofer()
  
  // Internal/Private API endpoints often used by the Android app
  // Using public API endpoint for now but prepared for internal ones
  private readonly UPLOAD_URL = 'https://photoslibrary.googleapis.com/v1/uploads'
  private readonly BATCH_CREATE_URL = 'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate'
  
  // Helper to refresh token if needed (placeholder for now)
  private async refreshAccessToken(refreshToken: string): Promise<string> {
    const clientId = process.env.GOOGLE_PHOTOS_CLIENT_ID
    const clientSecret = process.env.GOOGLE_PHOTOS_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      throw new Error('Google Photos Client ID/Secret not configured')
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    })

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`)
    }

    const data = await response.json()
    return data.access_token
  }

  /**
   * Upload a file using the Resumable Upload Protocol
   * This matches how the Android app uploads files, but uses the public API endpoint
   * coupled with spoofed headers.
   */
  async uploadMedia(
    buffer: Buffer,
    options: GooglePhotosUploadOptions
  ): Promise<string> {
    const spoofer = getDeviceSpoofer()
    const spoofHeaders = spoofer.getSpoofHeaders()

    // 1. Start Upload Session
    const headers = {
      'Authorization': `Bearer ${options.accessToken}`,
      'Content-Type': 'application/octet-stream',
      'X-Goog-Upload-Content-Type': options.mimeType,
      'X-Goog-Upload-Protocol': 'raw', // 'resumable' is more complex, 'raw' is simpler for small files
      ...spoofHeaders
    }

    // Note: For true 'unlimited' storage, we might need to use the internal API:
    // https://photos.googleapis.com/upload/
    // But that requires protobuf construction.
    // We'll stick to the public API with headers for now and hope for the best,
    // or try to switch to the internal endpoint if we can replicate the handshake.
    
    try {
      const response = await fetch(this.UPLOAD_URL, {
        method: 'POST',
        headers,
        body: buffer
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
      }

      // The response body contains the upload token
      const uploadToken = await response.text()
      return uploadToken
    } catch (error) {
      console.error('Google Photos Upload Error:', error)
      throw error
    }
  }

  /**
   * Create a media item from an upload token
   */
  async createMediaItem(
    uploadToken: string,
    options: GooglePhotosUploadOptions
  ): Promise<MediaItemResult> {
    const spoofer = getDeviceSpoofer()
    const spoofHeaders = spoofer.getSpoofHeaders()

    const body = {
      newMediaItems: [
        {
          description: options.description || '',
          simpleMediaItem: {
            uploadToken: uploadToken,
            fileName: options.fileName
          }
        }
      ]
    }

    const response = await fetch(this.BATCH_CREATE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${options.accessToken}`,
        'Content-Type': 'application/json',
        ...spoofHeaders
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`Create Media Item failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.newMediaItemResults && data.newMediaItemResults.length > 0) {
      const result = data.newMediaItemResults[0]
      if (result.status.message === 'Success' || result.status.message === 'OK' || !result.status.message) {
        return result.mediaItem
      }
      throw new Error(`Media creation failed: ${JSON.stringify(result.status)}`)
    }

    throw new Error('No media item results returned')
  }

  /**
   * Get a download URL for a media item
   * Note: Base URLs are temporary and expire.
   */
  async getMediaItem(mediaItemId: string, accessToken: string): Promise<MediaItemResult> {
    const response = await fetch(`https://photoslibrary.googleapis.com/v1/mediaItems/${mediaItemId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Get Media Item failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }
}

// Singleton
let instance: GooglePhotosApiClient | null = null

export function getGooglePhotosClient(): GooglePhotosApiClient {
  if (!instance) {
    instance = new GooglePhotosApiClient()
  }
  return instance
}


