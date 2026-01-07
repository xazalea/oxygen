import fs from 'fs';
import path from 'path';

// Define the cache structure types locally to avoid dependency issues if the package isn't linked
interface CachedTikTokUser {
  username: string;
  secUid: string;
  videos: any[];
  lastUpdated: number;
}

interface CachedYouTubeChannel {
  channelId: string;
  videos: any[];
  lastUpdated: number;
}

// In a real production environment, this would interface with a git repository
// to commit and push changes, which would then trigger a new npm publish.
// For this implementation, we'll simulate the file updates in the cache-package directory.

const CACHE_PACKAGE_PATH = path.join(process.cwd(), '..', 'cache-package');
const DATA_DIR = path.join(CACHE_PACKAGE_PATH, 'data');

export class CachePublisher {
  
  constructor() {
    this.ensureDirectories();
  }

  private ensureDirectories() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    const tiktokDir = path.join(DATA_DIR, 'tiktok');
    if (!fs.existsSync(tiktokDir)) {
      fs.mkdirSync(tiktokDir, { recursive: true });
    }
    
    const youtubeDir = path.join(DATA_DIR, 'youtube');
    if (!fs.existsSync(youtubeDir)) {
      fs.mkdirSync(youtubeDir, { recursive: true });
    }
  }

  public async updateTikTokUser(username: string, data: any): Promise<void> {
    const filePath = path.join(DATA_DIR, 'tiktok', `${username}.json`);
    
    const cacheEntry: CachedTikTokUser = {
      username,
      secUid: data.secUid || '',
      videos: data.videos || [],
      lastUpdated: Date.now()
    };
    
    await fs.promises.writeFile(filePath, JSON.stringify(cacheEntry, null, 2));
    await this.incrementVersion();
  }

  public async updateYouTubeChannel(channelId: string, data: any): Promise<void> {
    const filePath = path.join(DATA_DIR, 'youtube', `${channelId}.json`);
    
    const cacheEntry: CachedYouTubeChannel = {
      channelId,
      videos: data.videos || [],
      lastUpdated: Date.now()
    };
    
    await fs.promises.writeFile(filePath, JSON.stringify(cacheEntry, null, 2));
    await this.incrementVersion();
  }

  private async incrementVersion(): Promise<void> {
    // In this GitHub-based approach, we don't need to increment npm versions.
    // The files are simply committed to the repo.
    // We'll log a message to indicate an update happened.
    console.log(`Cache updated at ${new Date().toISOString()}. Commit and push 'cache-package/data' to deploy updates.`);
  }
}

export const cachePublisher = new CachePublisher();

