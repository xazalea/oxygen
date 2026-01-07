/**
 * Google Photos Device Spoofing Utilities
 * 
 * Provides utilities to generate device fingerprints and HTTP headers
 * that mimic a Google Pixel device to enable specific features/storage options.
 * 
 * Based on GPhotosUnlimited approach of modifying Build properties.
 */

export interface DeviceProfile {
  manufacturer: string
  model: string
  brand: string
  device: string
  product: string
  fingerprint: string
  buildId: string
  release: string
  sdk: number
  type: string
  tags: string
}

// Pixel XL (Unlimited Original Quality)
export const PIXEL_XL_PROFILE: DeviceProfile = {
  manufacturer: 'Google',
  model: 'Pixel XL',
  brand: 'google',
  device: 'marlin',
  product: 'marlin',
  fingerprint: 'google/marlin/marlin:10/QP1A.191005.007.A3/5972272:user/release-keys',
  buildId: 'QP1A.191005.007.A3',
  release: '10',
  sdk: 29,
  type: 'user',
  tags: 'release-keys'
}

// Pixel 5 (Unlimited Storage Saver)
export const PIXEL_5_PROFILE: DeviceProfile = {
  manufacturer: 'Google',
  model: 'Pixel 5',
  brand: 'google',
  device: 'redfin',
  product: 'redfin',
  fingerprint: 'google/redfin/redfin:11/RQ3A.211001.001/7641976:user/release-keys',
  buildId: 'RQ3A.211001.001',
  release: '11',
  sdk: 30,
  type: 'user',
  tags: 'release-keys'
}

// Pixel 6 (Modern example - NOT Unlimited Original, but good for validity)
export const PIXEL_6_PROFILE: DeviceProfile = {
  manufacturer: 'Google',
  model: 'Pixel 6',
  brand: 'google',
  device: 'oriole',
  product: 'oriole',
  fingerprint: 'google/oriole/oriole:12/SP2A.220305.013.A3/8177914:user/release-keys',
  buildId: 'SP2A.220305.013.A3',
  release: '12',
  sdk: 31,
  type: 'user',
  tags: 'release-keys'
}

export class DeviceSpoofer {
  private profile: DeviceProfile

  constructor(profile: DeviceProfile = PIXEL_XL_PROFILE) {
    this.profile = profile
  }

  /**
   * Get the User-Agent string mimicking the Android app on this device
   */
  getUserAgent(appVersion: string = '6.68.0.598567340'): string {
    // Format: AppName/Version (Linux; Android Release; Model Build/BuildId)
    // Example: com.google.android.apps.photos/6.68... (Linux; Android 10; Pixel XL Build/QP1A.191005.007.A3)
    return `com.google.android.apps.photos/${appVersion} (Linux; Android ${this.profile.release}; ${this.profile.model} Build/${this.profile.buildId})`
  }

  /**
   * Get headers that simulate the device properties
   */
  getSpoofHeaders(): Record<string, string> {
    return {
      'User-Agent': this.getUserAgent(),
      'X-Android-Device-Model': this.profile.model,
      'X-Android-Device-Manufacturer': this.profile.manufacturer,
      'X-Android-Device-Brand': this.profile.brand,
      'X-Android-Os-Version': this.profile.release,
      'X-Android-Sdk-Version': this.profile.sdk.toString(),
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Android-Device-Fingerprint': this.profile.fingerprint,
      'X-Android-Device-Product': this.profile.product
    }
  }

  /**
   * Get the current profile
   */
  getProfile(): DeviceProfile {
    return this.profile
  }

  /**
   * Set a specific profile
   */
  setProfile(profile: DeviceProfile) {
    this.profile = profile
  }
}

// Singleton instance
let spooferInstance: DeviceSpoofer | null = null

export function getDeviceSpoofer(modelName?: string): DeviceSpoofer {
  if (!spooferInstance) {
    let profile = PIXEL_XL_PROFILE
    
    // Allow override via env var
    const envModel = process.env.GOOGLE_PHOTOS_DEVICE_MODEL || modelName
    if (envModel) {
      if (envModel.includes('Pixel 5')) profile = PIXEL_5_PROFILE
      else if (envModel.includes('Pixel 6')) profile = PIXEL_6_PROFILE
      else if (envModel.includes('Pixel XL')) profile = PIXEL_XL_PROFILE
    }
    
    spooferInstance = new DeviceSpoofer(profile)
  }
  return spooferInstance
}
