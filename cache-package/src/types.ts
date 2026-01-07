export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in seconds
  version: string;
}

export interface CachedTikTokUser {
  username: string;
  secUid: string;
  videos: any[];
  lastUpdated: number;
}

export interface CachedYouTubeChannel {
  channelId: string;
  videos: any[];
  lastUpdated: number;
}

export interface CachePackageStructure {
  tiktok: Record<string, CachedTikTokUser>;
  youtube: Record<string, CachedYouTubeChannel>;
  metadata: {
    lastUpdated: number;
    version: string;
  };
}

export const CACHE_TTL = {
  TIKTOK_USER: 3600, // 1 hour
  YOUTUBE_CHANNEL: 3600, // 1 hour
  METADATA: 86400 // 24 hours
};

