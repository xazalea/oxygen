/**
 * Enhanced TikTok API Service
 * 
 * Based on:
 * - https://github.com/davidteather/TikTok-Api (TikTok-Api Python library)
 * - https://github.com/huaji233333/tiktok_source (Reverse-engineered TikTok source)
 * 
 * Implements TikTok API integration using insights from both sources.
 */

interface TikTokApiConfig {
  msToken?: string
  deviceId?: string
  userAgent?: string
}

interface TikTokVideoRaw {
  id: string
  createTime: number
  desc: string
  text?: string
  video: {
    downloadAddr?: string
    playAddr?: string
    playUrl?: string
    cover?: string
    dynamicCover?: string
    originCover?: string
    duration?: number
  }
  author: {
    id: string
    uniqueId: string
    nickname: string
    avatarThumb?: string
    avatarMedium?: string
  }
  authorId?: string
  nickname?: string
  stats: {
    diggCount?: number
    likeCount?: number
    shareCount: number
    commentCount: number
    playCount?: number
    viewCount?: number
  }
  music?: {
    title?: string
    titleName?: string
    authorName?: string
    author?: string
  }
}

interface TikTokApiResponse {
  itemList?: TikTokVideoRaw[]
  hasMore?: boolean
  cursor?: string
  statusCode?: number
  extra?: {
    logid?: string
    now?: number
  }
}

/**
 * Get TikTok API configuration based on reverse-engineered source insights
 * 
 * From tiktok_source analysis:
 * - Main functionality in df_miniapp
 * - Uses specific headers and device IDs
 * - Requires proper User-Agent and cookies
 */
function getTikTokConfig(): TikTokApiConfig {
  const msToken = process.env.TIKTOK_MS_TOKEN
  
  // Device ID pattern from TikTok source analysis
  const deviceId = process.env.TIKTOK_DEVICE_ID || generateDeviceId()
  
  // User-Agent based on TikTok app patterns
  const userAgent = 'com.ss.android.ugc.trill/33.0.0 (Linux; U; Android 12; en_US; Pixel 6; Build/SP1A.210812.016; Cronet/107.0.5304.54)'
  
  return {
    msToken,
    deviceId,
    userAgent,
  }
}

function generateDeviceId(): string {
  // Generate a device ID similar to TikTok's pattern
  const chars = '0123456789abcdef'
  let deviceId = ''
  for (let i = 0; i < 16; i++) {
    deviceId += chars[Math.floor(Math.random() * chars.length)]
  }
  return deviceId
}

/**
 * Fetch trending videos using TikTok's API
 * 
 * Based on TikTok-Api library approach:
 * - Uses /api/recommend/item_list endpoint
 * - Requires proper headers and authentication
 * - Handles pagination with cursor
 */
export async function fetchTrendingVideos(
  count: number = 20,
  cursor: string = '0'
): Promise<{ videos: TikTokVideoRaw[]; nextCursor: string }> {
  const config = getTikTokConfig()
  
  // TikTok API endpoint from TikTok-Api library analysis
  const url = new URL('https://www.tiktok.com/api/recommend/item_list')
  url.searchParams.set('aid', '1988')
  url.searchParams.set('app_name', 'tiktok_web')
  url.searchParams.set('device_platform', 'web')
  url.searchParams.set('device_id', config.deviceId || '')
  url.searchParams.set('region', 'US')
  url.searchParams.set('priority_region', 'US')
  url.searchParams.set('os', 'android')
  url.searchParams.set('referer', '')
  url.searchParams.set('root_referer', '')
  url.searchParams.set('count', String(count))
  url.searchParams.set('min_cursor', cursor)
  url.searchParams.set('max_cursor', '0')
  url.searchParams.set('from_page', 'fyp')
  url.searchParams.set('version_code', '330000')
  url.searchParams.set('version_name', '33.0.0')
  
  try {
    const headers: HeadersInit = {
      'User-Agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.tiktok.com/',
      'Origin': 'https://www.tiktok.com',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
    }
    
    // Add ms_token cookie if available
    if (config.msToken) {
      headers['Cookie'] = `ms_token=${config.msToken}`
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      next: { revalidate: 60 }, // Cache for 60 seconds
    })
    
    if (!response.ok) {
      throw new Error(`TikTok API returned ${response.status}: ${response.statusText}`)
    }
    
    const data: TikTokApiResponse = await response.json()
    
    if (data.statusCode && data.statusCode !== 0) {
      throw new Error(`TikTok API error: ${data.statusCode}`)
    }
    
    if (!data.itemList || data.itemList.length === 0) {
      throw new Error('No videos returned from TikTok API')
    }
    
    return {
      videos: data.itemList,
      nextCursor: data.cursor || '0',
    }
  } catch (error) {
    console.error('Error fetching trending videos:', error)
    throw error
  }
}

/**
 * Fetch video by ID
 * 
 * Uses TikTok's video detail endpoint
 */
export async function fetchVideoById(videoId: string): Promise<TikTokVideoRaw | null> {
  const config = getTikTokConfig()
  
  const url = new URL('https://www.tiktok.com/api/post/item_list')
  url.searchParams.set('aid', '1988')
  url.searchParams.set('app_name', 'tiktok_web')
  url.searchParams.set('device_platform', 'web')
  url.searchParams.set('itemId', videoId)
  
  try {
    const headers: HeadersInit = {
      'User-Agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Referer': 'https://www.tiktok.com/',
    }
    
    if (config.msToken) {
      headers['Cookie'] = `ms_token=${config.msToken}`
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    })
    
    if (!response.ok) {
      return null
    }
    
    const data: TikTokApiResponse = await response.json()
    
    if (data.itemList && data.itemList.length > 0) {
      return data.itemList[0]
    }
    
    return null
  } catch (error) {
    console.error('Error fetching video by ID:', error)
    return null
  }
}

/**
 * Fetch user videos
 * 
 * First gets secUid from profile page, then fetches videos
 */
export async function fetchUserVideos(
  username: string,
  count: number = 20,
  cursor: string = '0'
): Promise<{ videos: TikTokVideoRaw[]; nextCursor: string }> {
  const config = getTikTokConfig()
  
  try {
    // 1. Get secUid
    const profileUrl = `https://www.tiktok.com/@${username}`
    const profileResponse = await fetch(profileUrl, {
      headers: {
        'User-Agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    })
    
    if (!profileResponse.ok) {
      throw new Error(`Failed to fetch user profile: ${profileResponse.status}`)
    }
    
    const html = await profileResponse.text()
    
    // Extract secUid (simple regex, might need updates if TikTok changes HTML)
    // Looking for "secUid":"..." or "sec_uid":"..."
    const secUidMatch = html.match(/"secUid":"([^"]+)"/) || html.match(/"sec_uid":"([^"]+)"/)
    
    if (!secUidMatch) {
      throw new Error('Could not find secUid for user')
    }
    
    const secUid = secUidMatch[1]
    
    // 2. Fetch videos using secUid
    const url = new URL('https://www.tiktok.com/api/post/item_list')
    url.searchParams.set('aid', '1988')
    url.searchParams.set('app_name', 'tiktok_web')
    url.searchParams.set('device_platform', 'web')
    url.searchParams.set('secUid', secUid)
    url.searchParams.set('count', String(count))
    url.searchParams.set('cursor', cursor)
    
    const headers: HeadersInit = {
      'User-Agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.tiktok.com/',
    }
    
    if (config.msToken) {
      headers['Cookie'] = `ms_token=${config.msToken}`
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    })
    
    if (!response.ok) {
      throw new Error(`TikTok API returned ${response.status}: ${response.statusText}`)
    }
    
    const data: TikTokApiResponse = await response.json()
    
    if (!data.itemList || data.itemList.length === 0) {
      return { videos: [], nextCursor: cursor }
    }
    
    return {
      videos: data.itemList,
      nextCursor: data.cursor || '0',
    }
    
  } catch (error) {
    console.error('Error fetching user videos:', error)
    throw error
  }
}

/**
 * Extract hashtags from text
 * Based on TikTok source analysis
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#(\w+)/g
  const matches = text.match(hashtagRegex)
  return matches ? matches.map(m => m.substring(1)) : []
}

/**
 * Parse TikTok video data to our format
 * Handles various field name variations from TikTok API
 */
export function parseTikTokVideo(videoData: TikTokVideoRaw): {
  id: string
  videoUrl: string
  thumbnailUrl?: string
  duration: number
  description: string
  author: {
    id: string
    username: string
    avatar?: string
  }
  stats: {
    likes: number
    shares: number
    comments: number
    views: number
  }
  music?: {
    title: string
    author: string
  }
  hashtags: string[]
  timestamp: number
} {
  return {
    id: videoData.id || String(videoData.createTime || Date.now()),
    videoUrl: videoData.video?.downloadAddr || 
              videoData.video?.playAddr || 
              videoData.video?.playUrl || 
              '',
    thumbnailUrl: videoData.video?.cover || 
                  videoData.video?.dynamicCover || 
                  videoData.video?.originCover,
    duration: (videoData.video?.duration || 0) / 1000,
    description: videoData.desc || videoData.text || '',
    author: {
      id: videoData.author?.id || videoData.authorId || '',
      username: videoData.author?.uniqueId || 
                videoData.author?.nickname || 
                videoData.nickname || 
                'unknown',
      avatar: videoData.author?.avatarThumb || 
              videoData.author?.avatarMedium,
    },
    stats: {
      likes: videoData.stats?.diggCount || 
             videoData.stats?.likeCount || 
             0,
      shares: videoData.stats?.shareCount || 0,
      comments: videoData.stats?.commentCount || 0,
      views: videoData.stats?.playCount || 
             videoData.stats?.viewCount || 
             0,
    },
    music: videoData.music ? {
      title: videoData.music.title || 
             videoData.music.titleName || 
             '',
      author: videoData.music.authorName || 
              videoData.music.author || 
              '',
    } : undefined,
    hashtags: extractHashtags(videoData.desc || videoData.text || ''),
    timestamp: videoData.createTime || Date.now(),
  }
}



