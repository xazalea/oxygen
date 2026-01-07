/**
 * Steganography Service
 * 
 * Implements the logic from googlephotos-filestorage to encode arbitrary files
 * into PNG images, allowing them to be stored on Google Photos.
 * 
 * Strategy:
 * - Calculate required dimensions to fit the file bytes (3 bytes per pixel: R, G, B)
 * - Embed file size in the first 4 bytes (first 2 pixels)
 * - Fill pixels with file data
 * - Output as lossless PNG
 */

import sharp from 'sharp'

export class SteganographyService {
  /**
   * Encode a buffer into a PNG image buffer
   */
  async encode(fileBuffer: Buffer): Promise<Buffer> {
    const fileLength = fileBuffer.length
    // We need 4 bytes for size header + file bytes
    const totalBytes = 4 + fileLength
    // Each pixel holds 3 bytes (RGB)
    const totalPixels = Math.ceil(totalBytes / 3)
    
    // Calculate dimensions (aim for square)
    const width = Math.ceil(Math.sqrt(totalPixels))
    const height = Math.ceil(totalPixels / width)
    
    // Create raw pixel buffer (RW x RH x 3 channels)
    // sharp takes raw buffer as Uint8Array or Buffer
    const pixelBuffer = Buffer.alloc(width * height * 3)
    
    // Write Header (File Size) - 4 bytes (UInt32BE)
    let offset = 0
    pixelBuffer.writeUInt32BE(fileLength, 0)
    offset += 4
    
    // Write File Data
    // We can't just copy because the source is continuous bytes, and destination is continuous RGB
    // Actually, for raw RGB input to sharp, it expects: R, G, B, R, G, B...
    // So we CAN just copy the file buffer into the pixel buffer after the header!
    fileBuffer.copy(pixelBuffer, offset)
    
    // The rest of the buffer is already 0-filled (black pixels)
    
    return sharp(pixelBuffer, {
      raw: {
        width,
        height,
        channels: 3
      }
    })
    .png({
      compressionLevel: 9, // Max compression to keep file size low (though entropy is high)
      adaptiveFiltering: true
    })
    .toBuffer()
  }

  /**
   * Decode a PNG image buffer back into the original file buffer
   */
  async decode(imageBuffer: Buffer): Promise<Buffer> {
    // Get raw pixel data
    const { data } = await sharp(imageBuffer)
      .ensureAlpha(0) // Remove alpha channel if present (we only want RGB)
      .raw()
      .toBuffer({ resolveWithObject: true })
      
    // Read Header (File Size)
    // Note: sharp might add alpha channel even if we requested raw, but .raw() usually respects channels if input was RGBA
    // If we saved as RGB PNG, sharp should read as RGB or RGBA. 
    // Let's force RGB output in sharp pipeline above?
    // Actually, .raw() output depends on input. PNG usually has RGB.
    // To be safe, let's assume standard RGB (3 channels).
    
    // Wait, ensureAlpha() adds alpha? No, we want to REMOVE alpha or ignore it.
    // If the PNG has alpha, we need to strip it because we didn't write it.
    // Or we can just read 3 bytes, skip 1 if channels=4.
    
    // Let's re-read with explicit pipeline
    const pipeline = sharp(imageBuffer)
    const metadata = await pipeline.metadata()
    
    const rawBuffer = await pipeline
      .toColourspace('srgb') // Ensure standard RGB
      .removeAlpha()         // Drop alpha channel if exists
      .raw()
      .toBuffer()
      
    // Read size
    const fileLength = rawBuffer.readUInt32BE(0)
    
    // Validate length
    if (fileLength > rawBuffer.length - 4) {
      throw new Error(`Invalid encoded file: Header says ${fileLength} bytes, but image only has ${rawBuffer.length - 4} available`)
    }
    
    // Extract file data
    const fileBuffer = Buffer.alloc(fileLength)
    rawBuffer.copy(fileBuffer, 0, 4, 4 + fileLength)
    
    return fileBuffer
  }
}

// Singleton
let instance: SteganographyService | null = null

export function getSteganographyService(): SteganographyService {
  if (!instance) {
    instance = new SteganographyService()
  }
  return instance
}

