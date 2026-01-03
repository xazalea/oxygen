/**
 * Streamtape Cloud Storage Service
 * 
 * Handles file upload/download to Streamtape using their API.
 * API Documentation: https://api.streamtape.com
 */

export interface StreamtapeUploadOptions {
  folder?: string
  sha256?: string
  httponly?: boolean
}

export interface StreamtapeFileMetadata {
  fileId: string
  fileName: string
  fileSize: number
  mimeType?: string
  uploadedAt: number
  link?: string
  linkId?: string
}

export interface StreamtapeApiResponse<T = any> {
  status: number
  msg: string
  result: T
}

export class StreamtapeStorage {
  private apiLogin: string
  private apiKey: string
  private baseUrl = 'https://api.streamtape.com'
  private fileMetadataCache: Map<string, StreamtapeFileMetadata> = new Map()

  constructor() {
    this.apiLogin = process.env.STREAMTAPE_API_LOGIN || ''
    this.apiKey = process.env.STREAMTAPE_API_KEY || ''
  }

  /**
   * Initialize and verify credentials
   */
  async initialize(): Promise<void> {
    if (!this.apiLogin || !this.apiKey) {
      throw new Error('STREAMTAPE_API_LOGIN and STREAMTAPE_API_KEY must be set')
    }

    // Verify credentials by getting account info
    try {
      await this.getAccountInfo()
    } catch (error) {
      throw new Error(`Failed to initialize Streamtape: ${error}`)
    }
  }

  /**
   * Make API request to Streamtape
   */
  private async apiRequest<T>(
    endpoint: string,
    params: Record<string, string | number | boolean | undefined> = {}
  ): Promise<StreamtapeApiResponse<T>> {
    // Add auth params if not present
    if (!params.login && !params.key) {
      params.login = this.apiLogin
      params.key = this.apiKey
    }

    // Build URL with query parameters
    const url = new URL(`${this.baseUrl}${endpoint}`)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Streamtape API error: ${response.status} ${response.statusText}`)
    }

    const data: StreamtapeApiResponse<T> = await response.json()

    if (data.status !== 200) {
      throw new Error(`Streamtape API error: ${data.status} - ${data.msg}`)
    }

    return data
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<any> {
    const response = await this.apiRequest('/account/info')
    return response.result
  }

  /**
   * Get upload URL for a file
   */
  async getUploadUrl(options?: StreamtapeUploadOptions): Promise<{ url: string; validUntil: string }> {
    const params: Record<string, string | number | boolean | undefined> = {}
    if (options?.folder) params.folder = options.folder
    if (options?.sha256) params.sha256 = options.sha256
    if (options?.httponly) params.httponly = options.httponly

    const response = await this.apiRequest<{ url: string; valid_until: string }>('/file/ul', params)
    return {
      url: response.result.url,
      validUntil: response.result.valid_until
    }
  }

  /**
   * Upload a file to Streamtape
   */
  async uploadFile(
    fileName: string,
    buffer: Buffer,
    options?: StreamtapeUploadOptions & { mimeType?: string }
  ): Promise<StreamtapeFileMetadata> {
    if (!this.apiLogin || !this.apiKey) {
      await this.initialize()
    }

    try {
      // Get upload URL
      const { url } = await this.getUploadUrl(options)

      // Create FormData for multipart upload
      const formData = new FormData()
      const blob = new Blob([buffer], { type: options?.mimeType || 'application/octet-stream' })
      formData.append('file1', blob, fileName)

      // Upload file
      const uploadResponse = await fetch(url, {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`)
      }

      const uploadData = await uploadResponse.json()

      if (uploadData.status !== 200) {
        throw new Error(`Upload failed: ${uploadData.msg || 'Unknown error'}`)
      }

      // Get file info to retrieve file ID
      const fileId = uploadData.result?.fileid || uploadData.result?.id
      if (!fileId) {
        throw new Error('File ID not returned from upload')
      }

      // Get file info
      const fileInfo = await this.getFileInfo(fileId)
      const fileData = fileInfo[fileId]

      const metadata: StreamtapeFileMetadata = {
        fileId: fileData.id,
        fileName: fileData.name || fileName,
        fileSize: fileData.size || buffer.length,
        mimeType: fileData.type || options?.mimeType,
        uploadedAt: Date.now(),
        link: fileData.link,
        linkId: fileData.linkid,
      }

      // Cache metadata
      this.fileMetadataCache.set(fileId, metadata)

      return metadata
    } catch (error) {
      console.error('Error uploading file to Streamtape:', error)
      throw error
    }
  }

  /**
   * Get download ticket for a file
   */
  async getDownloadTicket(fileId: string): Promise<{ ticket: string; waitTime: number; validUntil: string }> {
    const response = await this.apiRequest<{
      ticket: string
      wait_time: number
      valid_until: string
    }>('/file/dlticket', { file: fileId })

    return {
      ticket: response.result.ticket,
      waitTime: response.result.wait_time,
      validUntil: response.result.valid_until
    }
  }

  /**
   * Get download link using ticket
   */
  async getDownloadLink(fileId: string, ticket: string, captchaResponse?: string): Promise<{
    name: string
    size: number
    url: string
  }> {
    const params: Record<string, string> = {
      file: fileId,
      ticket: ticket,
    }
    if (captchaResponse) {
      params.captcha_response = captchaResponse
    }

    const response = await this.apiRequest<{
      name: string
      size: number
      url: string
    }>('/file/dl', params)

    return response.result
  }

  /**
   * Download a file from Streamtape by file ID
   */
  async downloadFileById(fileId: string): Promise<Buffer | null> {
    try {
      // Get download ticket
      const { ticket, waitTime } = await this.getDownloadTicket(fileId)

      // Wait if required
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000))
      }

      // Get download link
      const { url } = await this.getDownloadLink(fileId, ticket)

      // Download file
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error('Error downloading file from Streamtape:', error)
      return null
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(fileIds: string | string[]): Promise<Record<string, any>> {
    const fileIdList = Array.isArray(fileIds) ? fileIds.join(',') : fileIds
    const response = await this.apiRequest<Record<string, any>>('/file/info', { file: fileIdList })
    return response.result
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const response = await this.apiRequest('/file/delete', { file: fileId })
      return response.result === true
    } catch (error) {
      console.error('Error deleting file from Streamtape:', error)
      return false
    }
  }

  /**
   * List folder contents
   */
  async listFolder(folderId?: string): Promise<{ folders: any[]; files: any[] }> {
    const params: Record<string, string> = {}
    if (folderId) params.folder = folderId

    const response = await this.apiRequest<{
      folders: any[]
      files: any[]
    }>('/file/listfolder', params)

    return response.result
  }

  /**
   * Create a folder
   */
  async createFolder(name: string, parentId?: string): Promise<string> {
    const params: Record<string, string> = { name }
    if (parentId) params.pid = parentId

    const response = await this.apiRequest<{ folderid: string }>('/file/createfolder', params)
    return response.result.folderid
  }

  /**
   * Rename a folder
   */
  async renameFolder(folderId: string, name: string): Promise<boolean> {
    try {
      const response = await this.apiRequest('/file/renamefolder', {
        folder: folderId,
        name: name
      })
      return response.result === true
    } catch (error) {
      console.error('Error renaming folder:', error)
      return false
    }
  }

  /**
   * Delete a folder
   */
  async deleteFolder(folderId: string): Promise<boolean> {
    try {
      const response = await this.apiRequest('/file/deletefolder', { folder: folderId })
      return response.result === true
    } catch (error) {
      console.error('Error deleting folder:', error)
      return false
    }
  }

  /**
   * Rename a file
   */
  async renameFile(fileId: string, name: string): Promise<boolean> {
    try {
      const response = await this.apiRequest('/file/rename', {
        file: fileId,
        name: name
      })
      return response.result === true
    } catch (error) {
      console.error('Error renaming file:', error)
      return false
    }
  }

  /**
   * Move a file to a different folder
   */
  async moveFile(fileId: string, folderId: string): Promise<boolean> {
    try {
      const response = await this.apiRequest('/file/move', {
        file: fileId,
        folder: folderId
      })
      return response.result === true
    } catch (error) {
      console.error('Error moving file:', error)
      return false
    }
  }

  /**
   * Add remote upload from URL
   */
  async addRemoteUpload(
    url: string,
    folderId?: string,
    headers?: string,
    name?: string
  ): Promise<{ id: string; folderid: string }> {
    const params: Record<string, string> = { url }
    if (folderId) params.folder = folderId
    if (headers) params.headers = headers
    if (name) params.name = name

    const response = await this.apiRequest<{
      id: string
      folderid: string
    }>('/remotedl/add', params)

    return response.result
  }

  /**
   * Remove remote upload
   */
  async removeRemoteUpload(id: string): Promise<boolean> {
    try {
      const response = await this.apiRequest('/remotedl/remove', { id })
      return response.result === true
    } catch (error) {
      console.error('Error removing remote upload:', error)
      return false
    }
  }

  /**
   * Check remote upload status
   */
  async getRemoteUploadStatus(id: string, limit?: number): Promise<any> {
    const params: Record<string, string | number> = { id }
    if (limit) params.limit = limit

    const response = await this.apiRequest<Record<string, any>>('/remotedl/status', params)
    return response.result
  }

  /**
   * Get video thumbnail/splash image
   */
  async getThumbnail(fileId: string): Promise<string> {
    const response = await this.apiRequest<{ result: string }>('/file/getsplash', { file: fileId })
    return response.result
  }

  /**
   * Get file URL for streaming
   */
  getFileUrl(fileId: string): string {
    // Streamtape provides streaming URLs through their API
    // For direct access, we need to use the link from file info
    const metadata = this.fileMetadataCache.get(fileId)
    if (metadata?.link) {
      return metadata.link
    }
    // Fallback: construct URL (may need to get file info first)
    return `https://streamtape.com/v/${fileId}`
  }

  /**
   * Store file metadata for later retrieval
   */
  storeFileMetadata(fileId: string, metadata: StreamtapeFileMetadata): void {
    this.fileMetadataCache.set(fileId, metadata)
  }

  /**
   * Get cached file metadata
   */
  getCachedMetadata(fileId: string): StreamtapeFileMetadata | undefined {
    return this.fileMetadataCache.get(fileId)
  }
}

// Singleton instance
let storageInstance: StreamtapeStorage | null = null

export function getStreamtapeStorage(): StreamtapeStorage {
  if (!storageInstance) {
    storageInstance = new StreamtapeStorage()
  }
  return storageInstance
}


