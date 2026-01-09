/**
 * TikTok Source Code Insights
 * 
 * Based on reverse-engineered TikTok source:
 * https://github.com/huaji233333/tiktok_source
 * 
 * Key insights for improving recommendations and engagement tracking
 */

/**
 * Screenshot detection keywords from TikTok source
 * From: TakeScreenshotManager.java
 */
export const SCREENSHOT_KEYWORDS = [
  'screenshot', 'screen_shot', 'screen-shot', 'screen shot',
  'screencapture', 'screen_capture', 'screen-capture', 'screen capture',
  'screencap', 'screen_cap', 'screen-cap', 'screen cap', '截屏'
]

/**
 * Key tracking mechanisms from TikTok source
 */
export interface TikTokTrackingInsights {
  locationTracking: {
    enabled: boolean
    granularity: 'fine' | 'coarse'
    purpose: 'contextual_recommendations'
  }
  deviceTracking: {
    wifiNetworks: boolean
    phoneCalls: boolean
    screenshots: boolean
    purpose: 'user_profiling'
  }
  biometricTracking: {
    facialRecognition: boolean
    purpose: 'content_moderation_and_targeting'
  }
}

/**
 * Get tracking insights from reverse-engineered source
 */
export function getTikTokTrackingInsights(): TikTokTrackingInsights {
  return {
    locationTracking: {
      enabled: true,
      granularity: 'fine', // Fine-grained location from TMALocation.java
      purpose: 'contextual_recommendations',
    },
    deviceTracking: {
      wifiNetworks: true, // ApiGetWifiListCtrl.java
      phoneCalls: true, // PhoneCallImpl.java
      screenshots: true, // TakeScreenshotManager.java
      purpose: 'user_profiling',
    },
    biometricTracking: {
      facialRecognition: true, // FacialVerifyProtocolActivity.java
      purpose: 'content_moderation_and_targeting',
    },
  }
}

/**
 * Engagement events tracked by TikTok
 * Based on source analysis
 */
export const ENGAGEMENT_EVENTS = [
  'watch',
  'skip',
  'like',
  'share',
  'comment',
  'screenshot', // Tracked via TakeScreenshotManager
  'rewatch',
  'follow',
] as const

export type EngagementEvent = typeof ENGAGEMENT_EVENTS[number]

/**
 * Check if text contains screenshot-related keywords
 * Based on TakeScreenshotManager.java
 */
export function containsScreenshotKeywords(text: string): boolean {
  const lowerText = text.toLowerCase()
  return SCREENSHOT_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()))
}

/**
 * Main app module from TikTok source
 * Most functionality is in df_miniapp
 */
export const MAIN_MODULE = 'df_miniapp'

/**
 * Recommendation patterns from source analysis
 */
export interface RecommendationPatterns {
  realTime: boolean
  contextual: boolean
  multimodal: boolean
  usesLocation: boolean
  usesDevice: boolean
  usesBiometric: boolean
}

export function getRecommendationPatterns(): RecommendationPatterns {
  return {
    realTime: true,
    contextual: true,
    multimodal: true,
    usesLocation: true,
    usesDevice: true,
    usesBiometric: true,
  }
}




