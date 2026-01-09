import { CacheEntry, CachePackageStructure, CACHE_TTL } from './types';

// In a real browser/node environment, we would use fetch or fs
// Since this is a library, we provide helpers to generate the structure

export class CacheManager {
  private cache: CachePackageStructure;

  constructor(initialData?: Partial<CachePackageStructure>) {
    this.cache = {
      tiktok: initialData?.tiktok || {},
      youtube: initialData?.youtube || {},
      metadata: initialData?.metadata || {
        lastUpdated: Date.now(),
        version: '0.1.0'
      }
    };
  }

  public getTikTokUser(username: string): any | null {
    const entry = this.cache.tiktok[username];
    if (!entry) return null;
    
    // Check TTL
    if (Date.now() - entry.lastUpdated > CACHE_TTL.TIKTOK_USER * 1000) {
      return null;
    }
    
    return entry;
  }

  public updateTikTokUser(username: string, data: any): void {
    this.cache.tiktok[username] = {
      ...data,
      lastUpdated: Date.now()
    };
    this.updateMetadata();
  }

  public getYouTubeChannel(channelId: string): any | null {
    const entry = this.cache.youtube[channelId];
    if (!entry) return null;

    if (Date.now() - entry.lastUpdated > CACHE_TTL.YOUTUBE_CHANNEL * 1000) {
      return null;
    }

    return entry;
  }

  public updateYouTubeChannel(channelId: string, data: any): void {
    this.cache.youtube[channelId] = {
      ...data,
      lastUpdated: Date.now()
    };
    this.updateMetadata();
  }

  private updateMetadata(): void {
    this.cache.metadata.lastUpdated = Date.now();
  }

  public export(): CachePackageStructure {
    return this.cache;
  }
}


