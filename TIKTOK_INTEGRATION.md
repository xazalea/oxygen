# TikTok Integration Documentation

This project integrates insights from two key resources to provide a production-grade TikTok clone:

## Resources Used

### 1. Reverse-Engineered TikTok Source
**Source**: https://github.com/huaji233333/tiktok_source

This repository contains the reverse-engineered Android TikTok app source code, providing insights into:
- **Data Collection Mechanisms**: Location tracking, WiFi networks, phone calls, screenshots
- **Engagement Tracking**: How TikTok tracks user interactions
- **Recommendation Patterns**: Main functionality in `df_miniapp` module
- **Tracking Keywords**: Screenshot detection keywords from `TakeScreenshotManager.java`

**Key Files Referenced**:
- `TMALocation.java` - Location tracking
- `PhoneCallImpl.java` - Phone call metadata
- `TakeScreenshotManager.java` - Screenshot detection
- `ApiGetWifiListCtrl.java` - WiFi network tracking
- `FacialVerifyProtocolActivity.java` - Facial recognition
- `LoadAddressTask.java` - Address information
- `df_miniapp` - Main app functionality

**Implementation**: See `web/lib/tiktok-source-insights.ts`

### 2. TikTok-Api Python Library
**Source**: https://github.com/davidteather/TikTok-Api

This is a Python library that provides programmatic access to TikTok's API using Playwright. We've adapted its approach for TypeScript/Next.js:

- **API Endpoints**: Uses `/api/recommend/item_list` for trending videos
- **Authentication**: Supports `ms_token` for better rate limits
- **Request Headers**: Proper User-Agent, Referer, and cookie handling
- **Pagination**: Cursor-based pagination support

**Implementation**: See `web/lib/tiktok-api-enhanced.ts`

## Integration Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Reverse-Engineered Source (tiktok_source)             │
│  - Tracking insights                                    │
│  - Engagement patterns                                 │
│  - Recommendation strategies                           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  TikTok-Api Library Approach                           │
│  - API endpoint patterns                               │
│  - Authentication methods                              │
│  - Request/response handling                            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Enhanced TypeScript Implementation                     │
│  - tiktok-api-enhanced.ts                               │
│  - tiktok-service.ts                                    │
│  - tiktok-source-insights.ts                            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Next.js API Routes                                     │
│  - /api/trending                                        │
│  - /api/video/[id]                                      │
│  - /api/interaction                                     │
└─────────────────────────────────────────────────────────┘
```

## Key Features Implemented

### 1. Enhanced API Integration (`tiktok-api-enhanced.ts`)

Based on TikTok-Api library patterns:
- Proper endpoint URLs with query parameters
- Device ID generation (similar to TikTok app)
- User-Agent matching TikTok app patterns
- Cookie-based authentication with `ms_token`
- Cursor-based pagination
- Error handling and retry logic

### 2. Source Code Insights (`tiktok-source-insights.ts`)

Based on reverse-engineered source:
- Screenshot detection keywords
- Engagement event tracking
- Tracking mechanism insights
- Recommendation pattern analysis

### 3. Service Layer (`tiktok-service.ts`)

Combines both approaches:
- Uses enhanced API for data fetching
- Applies source insights for better parsing
- Handles various field name variations
- Provides clean TypeScript interfaces

## API Endpoints

### GET /api/trending
Fetches trending videos using TikTok-Api approach:
- Endpoint: `/api/recommend/item_list`
- Parameters: count, cursor, device_id, region
- Returns: Array of video metadata

### GET /api/video/[id]
Fetches individual video:
- Endpoint: `/api/post/item_list`
- Parameter: itemId
- Returns: Single video metadata

### POST /api/interaction
Records user interactions:
- Tracks: watch time, likes, shares, comments, skips
- Based on engagement tracking patterns from source

## Configuration

### Environment Variables

```env
# Optional but recommended for better rate limits
TIKTOK_MS_TOKEN=your_token_here

# Optional: Custom device ID
TIKTOK_DEVICE_ID=your_device_id
```

### Getting ms_token

1. Go to https://www.tiktok.com and log in
2. Open browser developer tools (F12)
3. Go to Application/Storage → Cookies → tiktok.com
4. Find `ms_token` cookie and copy its value

## Benefits of This Approach

1. **Production-Ready**: Uses real TikTok API endpoints
2. **Insightful**: Applies knowledge from reverse-engineered source
3. **Reliable**: Based on proven TikTok-Api library patterns
4. **Type-Safe**: Full TypeScript implementation
5. **No Dependencies**: Pure TypeScript, no Python runtime needed

## References

- **TikTok Source**: https://github.com/huaji233333/tiktok_source
- **TikTok-Api**: https://github.com/davidteather/TikTok-Api
- **Implementation**: `web/lib/tiktok-api-enhanced.ts`
- **Insights**: `web/lib/tiktok-source-insights.ts`
- **Service**: `web/lib/tiktok-service.ts`

## Notes

- The reverse-engineered source provides insights but we don't use it directly (it's Java/Android)
- The TikTok-Api library is Python-based, but we've adapted its approach for TypeScript
- All API calls respect TikTok's rate limits and terms of service
- The implementation is optimized for Vercel serverless functions



