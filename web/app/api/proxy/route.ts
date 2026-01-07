import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Generic Proxy Endpoint
 * Allows client-side workers to fetch external resources (bypassing CORS)
 * 
 * Usage: GET /api/proxy?url=<encoded_url>&headers=<json_headers>
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const targetUrl = searchParams.get('url')
    const customHeadersStr = searchParams.get('headers')
    
    if (!targetUrl) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
    }

    let customHeaders = {}
    if (customHeadersStr) {
      try {
        customHeaders = JSON.parse(customHeadersStr)
      } catch (e) {
        // Ignore invalid headers json
      }
    }

    // Check jsDelivr cache if explicitly requested or for supported platforms
    // Pattern: https://cdn.jsdelivr.net/gh/xazalea/oxygen@main/cache-package/data/{platform}/{identifier}.json
    const useCache = searchParams.get('useCache') === 'true'
    const cacheKey = searchParams.get('cacheKey') // e.g., tiktok/username or youtube/channelId
    
    if (useCache && cacheKey) {
      try {
        // Use GitHub CDN instead of npm
        const cacheUrl = `https://cdn.jsdelivr.net/gh/xazalea/oxygen@main/cache-package/data/${cacheKey}.json`
        const cacheResponse = await fetch(cacheUrl)
        
        if (cacheResponse.ok) {
          const cacheBuffer = await cacheResponse.arrayBuffer()
          const cacheUint8Array = new Uint8Array(cacheBuffer)
          
          return new NextResponse(cacheUint8Array, {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=3600',
              'X-Cache-Source': 'jsdelivr-gh'
            }
          })
        }
      } catch (e) {
        // Cache miss or error, fall back to direct fetch
        console.warn('jsDelivr cache miss:', e)
      }
    }

    // Default headers to look like a browser
    const headers: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/json,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      ...customHeaders
    }

    const response = await fetch(targetUrl, {
      headers,
      method: 'GET',
      redirect: 'follow'
    })

    // Get response body
    const contentType = response.headers.get('content-type')
    const buffer = await response.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)

    // Forward status and headers
    return new NextResponse(uint8Array, {
      status: response.status,
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        // Allow the client to read this
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, max-age=0' 
      }
    })

  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 })
  }
}
