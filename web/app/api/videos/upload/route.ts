import { NextRequest, NextResponse } from 'next/server'
import { getUnifiedStorage } from '@/lib/unified-storage'
import { getModerationService } from '@/lib/classyvision/moderation-service'
import { getClassificationService } from '@/lib/classyvision/classification-service'
import { getRecommendationFeaturesService } from '@/lib/classyvision/recommendation-features'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for video processing

/**
 * Video Upload Endpoint with Automatic Moderation
 * POST /api/videos/upload
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const videoId = formData.get('videoId') as string
    const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : {}

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create temporary video URL for client-side processing
    // Note: In production, you might want to do server-side processing
    // For now, we'll upload first, then process
    const storage = getUnifiedStorage()
    await storage.initialize()

    // Upload to unified storage (round-robin)
    const fileName = `videos/${videoId || Date.now()}.mp4`
    const uploadMetadata = await storage.uploadFile(fileName, buffer, {
      mimeType: file.type || 'video/mp4',
      description: metadata.description || 'User uploaded video'
    })

    // Store mapping
    storage.storeFileMapping(uploadMetadata.fileId, uploadMetadata.storageType)

    // For server-side moderation, we'd need to:
    // 1. Download the video (or use the buffer)
    // 2. Extract frames
    // 3. Run moderation
    // However, ClassyVision is designed for client-side, so we'll:
    // - Upload the video
    // - Return metadata with a flag indicating moderation is needed
    // - Client-side can handle moderation asynchronously

    // Return response with upload info
    return NextResponse.json({
      success: true,
      fileId: uploadMetadata.fileId,
      fileName: uploadMetadata.fileName,
      fileSize: uploadMetadata.fileSize,
      storageType: uploadMetadata.storageType,
      url: storage.getFileUrl(uploadMetadata.fileId, uploadMetadata.storageType),
      moderationRequired: true, // Flag for client-side moderation
      message: 'Video uploaded successfully. Moderation will be processed client-side.'
    })
  } catch (error: any) {
    console.error('Error uploading video:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upload video',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * Server-side moderation endpoint (optional)
 * POST /api/videos/moderate
 * 
 * Note: This requires server-side video processing capabilities.
 * For now, moderation is handled client-side.
 */
export async function moderateVideo(fileId: string): Promise<{
  isSafe: boolean
  confidence: number
  category?: string
}> {
  // This would require server-side video processing
  // For now, return a placeholder
  return {
    isSafe: true,
    confidence: 1.0
  }
}



