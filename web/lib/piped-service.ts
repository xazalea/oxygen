export interface PipedVideo {
  url: string
  type: string
  title: string
  thumbnail: string
  uploaderName: string
  uploaderUrl: string
  uploaderAvatar: string
  uploaded: number
  duration: number
  views: number
}

// Minimal YouTube scraper to avoid external Piped API calls
// Runs on client via proxy

/**
 * Fetch videos from a YouTube channel by scraping the channel page via proxy
 */
export async function fetchChannelVideos(channelId: string): Promise<PipedVideo[]> {
  try {
    // 1. Fetch channel videos page (tab=videos) via Proxy (Try cache first)
    // Note: This relies on YouTube's initial data structure which might change
    // But it's "direct integration" without 3rd party API
    const channelUrl = `https://www.youtube.com/channel/${channelId}/videos`
    const cacheKey = `youtube/${channelId}`
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(channelUrl)}&useCache=true&cacheKey=${cacheKey}`
    
    const response = await fetch(proxyUrl)
    
    if (!response.ok) {
      throw new Error(`YouTube Proxy error: ${response.status}`)
    }
    
    const html = await response.text()
    
    // 2. Extract ytInitialData
    const jsonMatch = html.match(/var ytInitialData = ({.*?});/)
    
    if (!jsonMatch) {
      throw new Error('Could not find ytInitialData in YouTube page')
    }
    
    const ytInitialData = JSON.parse(jsonMatch[1])
    
    // 3. Navigate the JSON tree to find videos
    // Paths vary, but usually: contents.twoColumnBrowseResultsRenderer.tabs[...].tabRenderer.content.richGridRenderer.contents
    
    const tabs = ytInitialData.contents?.twoColumnBrowseResultsRenderer?.tabs
    const videosTab = tabs?.find((t: any) => t.tabRenderer?.selected)
    
    if (!videosTab) {
       return []
    }
    
    const contents = videosTab.tabRenderer.content?.richGridRenderer?.contents
    
    if (!contents) {
      return []
    }
    
    const videos: PipedVideo[] = []
    
    for (const item of contents) {
      const videoRenderer = item.richItemRenderer?.content?.videoRenderer
      
      if (videoRenderer) {
        const videoId = videoRenderer.videoId
        const title = videoRenderer.title?.runs[0]?.text
        const thumbnail = videoRenderer.thumbnail?.thumbnails?.pop()?.url // Get highest res
        const viewCountText = videoRenderer.viewCountText?.simpleText
        const lengthText = videoRenderer.lengthText?.simpleText // e.g. "10:30"
        
        // Parse duration
        let duration = 0
        if (lengthText) {
          const parts = lengthText.split(':').map(Number)
          if (parts.length === 2) {
             duration = parts[0] * 60 + parts[1]
          } else if (parts.length === 3) {
             duration = parts[0] * 3600 + parts[1] * 60 + parts[2]
          }
        }
        
        videos.push({
          url: `/watch?v=${videoId}`,
          type: 'stream',
          title: title || 'Unknown Title',
          thumbnail: thumbnail || '',
          uploaderName: '', // Could extract from channel info
          uploaderUrl: `/channel/${channelId}`,
          uploaderAvatar: '',
          uploaded: Date.now(), // Estimate
          duration,
          views: viewCountText ? parseInt(viewCountText.replace(/\D/g, '')) : 0
        })
      }
    }
    
    return videos
  } catch (error) {
    console.error('Error fetching channel videos directly:', error)
    // Fallback? No, user explicitly said don't use Piped API.
    throw error
  }
}
