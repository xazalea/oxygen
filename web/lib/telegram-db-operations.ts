/**
 * Telegram Database Operations
 * 
 * High-level CRUD operations for all database tables.
 * Uses the TelegramDatabase abstraction layer with schema validation.
 */

import { TelegramDatabase } from './telegram-db'
import {
  VideoRecord,
  UserRecord,
  InteractionRecord,
  RecommendationRecord,
  DownloadRecord,
  StoryRecord,
  TextPostRecord,
  MessageRecord,
  CommunityRecord,
  LiveStreamRecord,
  CollectionRecord,
  NotificationRecord,
  TABLES,
  validateVideoRecord,
  validateUserRecord,
  validateInteractionRecord
} from './telegram-db-schema'

export class TelegramDBOperations {
  private db: TelegramDatabase

  constructor(db: TelegramDatabase) {
    this.db = db
  }

  // ==================== Videos ====================

  async createVideo(data: Omit<VideoRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<VideoRecord> {
    return await this.db.create(TABLES.VIDEOS, data) as VideoRecord
  }

  async getVideo(id: string): Promise<VideoRecord | null> {
    return await this.db.findById(TABLES.VIDEOS, id) as VideoRecord | null
  }

  async getVideoByTikTokId(tiktokId: string): Promise<VideoRecord | null> {
    const videos = await this.db.read(TABLES.VIDEOS, {
      where: { tiktokId },
      limit: 1
    })
    return (videos[0] as VideoRecord) || null
  }

  async getTrendingVideos(limit: number = 20): Promise<VideoRecord[]> {
    return await this.db.read(TABLES.VIDEOS, {
      orderBy: 'stats.views',
      orderDirection: 'desc',
      limit
    }) as VideoRecord[]
  }

  async updateVideo(id: string, data: Partial<VideoRecord>): Promise<VideoRecord | null> {
    return await this.db.update(TABLES.VIDEOS, id, data) as VideoRecord | null
  }

  async updateVideoDownloadStatus(
    id: string,
    status: VideoRecord['downloadStatus'],
    telegramFileId?: string
  ): Promise<VideoRecord | null> {
    const update: Partial<VideoRecord> = {
      downloadStatus: status,
      updatedAt: Date.now()
    }
    if (telegramFileId) {
      update.telegramFileId = telegramFileId
      update.downloadedAt = Date.now()
    }
    return await this.updateVideo(id, update)
  }

  // ==================== Users ====================

  async createUser(data: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserRecord> {
    return await this.db.create(TABLES.USERS, data) as UserRecord
  }

  async getUser(id: string): Promise<UserRecord | null> {
    return await this.db.findById(TABLES.USERS, id) as UserRecord | null
  }

  async getUserByUsername(username: string): Promise<UserRecord | null> {
    const users = await this.db.read(TABLES.USERS, {
      where: { username },
      limit: 1
    })
    return (users[0] as UserRecord) || null
  }

  async updateUser(id: string, data: Partial<UserRecord>): Promise<UserRecord | null> {
    return await this.db.update(TABLES.USERS, id, data) as UserRecord | null
  }

  async followUser(userId: string, targetUserId: string): Promise<void> {
    const user = await this.getUser(userId)
    const target = await this.getUser(targetUserId)
    
    if (!user || !target) return

    // Add to following/followers
    if (!user.socialGraph.following.includes(targetUserId)) {
      user.socialGraph.following.push(targetUserId)
      target.socialGraph.followers.push(userId)
      
      await this.updateUser(userId, { socialGraph: user.socialGraph })
      await this.updateUser(targetUserId, { socialGraph: target.socialGraph })
    }
  }

  // ==================== Interactions ====================

  async createInteraction(data: Omit<InteractionRecord, 'id' | 'createdAt'>): Promise<InteractionRecord> {
    return await this.db.create(TABLES.INTERACTIONS, data) as InteractionRecord
  }

  async getUserInteractions(userId: string, limit?: number): Promise<InteractionRecord[]> {
    return await this.db.read(TABLES.INTERACTIONS, {
      where: { userId },
      orderBy: 'timestamp',
      orderDirection: 'desc',
      limit
    }) as InteractionRecord[]
  }

  async getVideoInteractions(videoId: string): Promise<InteractionRecord[]> {
    return await this.db.read(TABLES.INTERACTIONS, {
      where: { videoId },
      orderBy: 'timestamp',
      orderDirection: 'desc'
    }) as InteractionRecord[]
  }

  // ==================== Recommendations ====================

  async createRecommendation(data: Omit<RecommendationRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<RecommendationRecord> {
    return await this.db.create(TABLES.RECOMMENDATIONS, data) as RecommendationRecord
  }

  async getRecommendation(userId: string, sessionId: string): Promise<RecommendationRecord | null> {
    const recommendations = await this.db.read(TABLES.RECOMMENDATIONS, {
      where: { userId, sessionId },
      limit: 1
    })
    return (recommendations[0] as RecommendationRecord) || null
  }

  async updateRecommendation(
    userId: string,
    sessionId: string,
    videoIds: string[],
    algorithmState?: RecommendationRecord['algorithmState']
  ): Promise<RecommendationRecord | null> {
    const existing = await this.getRecommendation(userId, sessionId)
    
    if (existing) {
      return await this.db.update(TABLES.RECOMMENDATIONS, existing.id, {
        videoIds,
        algorithmState: algorithmState || existing.algorithmState,
        updatedAt: Date.now()
      }) as RecommendationRecord | null
    } else {
      return await this.createRecommendation({
        userId,
        sessionId,
        videoIds,
        algorithmState: algorithmState || { lastUpdated: Date.now() }
      })
    }
  }

  // ==================== Downloads ====================

  async createDownload(data: Omit<DownloadRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<DownloadRecord> {
    return await this.db.create(TABLES.DOWNLOADS, data) as DownloadRecord
  }

  async getDownload(id: string): Promise<DownloadRecord | null> {
    return await this.db.findById(TABLES.DOWNLOADS, id) as DownloadRecord | null
  }

  async getPendingDownloads(limit?: number): Promise<DownloadRecord[]> {
    return await this.db.read(TABLES.DOWNLOADS, {
      where: { status: 'queued' },
      orderBy: 'priority',
      orderDirection: 'desc',
      limit
    }) as DownloadRecord[]
  }

  async updateDownloadStatus(
    id: string,
    status: DownloadRecord['status'],
    progress?: number,
    telegramFileId?: string,
    error?: string
  ): Promise<DownloadRecord | null> {
    const update: Partial<DownloadRecord> = {
      status,
      updatedAt: Date.now()
    }
    
    if (progress !== undefined) update.progress = progress
    if (telegramFileId) update.telegramFileId = telegramFileId
    if (error) update.error = error
    if (status === 'completed') update.completedAt = Date.now()

    return await this.db.update(TABLES.DOWNLOADS, id, update) as DownloadRecord | null
  }

  // ==================== Stories ====================

  async createStory(data: Omit<StoryRecord, 'id' | 'createdAt'>): Promise<StoryRecord> {
    return await this.db.create(TABLES.STORIES, data) as StoryRecord
  }

  async getUserStories(userId: string): Promise<StoryRecord[]> {
    return await this.db.read(TABLES.STORIES, {
      where: { userId, expiresAt: { $gt: Date.now() } },
      orderBy: 'createdAt',
      orderDirection: 'desc'
    }) as StoryRecord[]
  }

  async getExpiredStories(): Promise<StoryRecord[]> {
    return await this.db.read(TABLES.STORIES, {
      where: { expiresAt: { $lt: Date.now() }, isHighlight: false }
    }) as StoryRecord[]
  }

  // ==================== Text Posts ====================

  async createTextPost(data: Omit<TextPostRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<TextPostRecord> {
    return await this.db.create(TABLES.TEXT_POSTS, data) as TextPostRecord
  }

  async getTextPost(id: string): Promise<TextPostRecord | null> {
    return await this.db.findById(TABLES.TEXT_POSTS, id) as TextPostRecord | null
  }

  async getThreadPosts(threadId: string): Promise<TextPostRecord[]> {
    return await this.db.read(TABLES.TEXT_POSTS, {
      where: { threadId },
      orderBy: 'createdAt',
      orderDirection: 'asc'
    }) as TextPostRecord[]
  }

  // ==================== Messages ====================

  async createMessage(data: Omit<MessageRecord, 'id' | 'createdAt'>): Promise<MessageRecord> {
    return await this.db.create(TABLES.MESSAGES, data) as MessageRecord
  }

  async getChatMessages(chatId: string, limit?: number): Promise<MessageRecord[]> {
    return await this.db.read(TABLES.MESSAGES, {
      where: { chatId },
      orderBy: 'createdAt',
      orderDirection: 'desc',
      limit
    }) as MessageRecord[]
  }

  async getExpiredMessages(): Promise<MessageRecord[]> {
    return await this.db.read(TABLES.MESSAGES, {
      where: { 
        isDisappearing: true,
        expiresAt: { $lt: Date.now() }
      }
    }) as MessageRecord[]
  }

  // ==================== Communities ====================

  async createCommunity(data: Omit<CommunityRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommunityRecord> {
    return await this.db.create(TABLES.COMMUNITIES, data) as CommunityRecord
  }

  async getCommunity(id: string): Promise<CommunityRecord | null> {
    return await this.db.findById(TABLES.COMMUNITIES, id) as CommunityRecord | null
  }

  // ==================== Live Streams ====================

  async createLiveStream(data: Omit<LiveStreamRecord, 'id' | 'createdAt'>): Promise<LiveStreamRecord> {
    return await this.db.create(TABLES.LIVE_STREAMS, data) as LiveStreamRecord
  }

  async getActiveStreams(): Promise<LiveStreamRecord[]> {
    return await this.db.read(TABLES.LIVE_STREAMS, {
      where: { isLive: true },
      orderBy: 'viewers',
      orderDirection: 'desc'
    }) as LiveStreamRecord[]
  }

  // ==================== Collections ====================

  async createCollection(data: Omit<CollectionRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<CollectionRecord> {
    return await this.db.create(TABLES.COLLECTIONS, data) as CollectionRecord
  }

  async getUserCollections(userId: string): Promise<CollectionRecord[]> {
    return await this.db.read(TABLES.COLLECTIONS, {
      where: { userId },
      orderBy: 'updatedAt',
      orderDirection: 'desc'
    }) as CollectionRecord[]
  }

  // ==================== Notifications ====================

  async createNotification(data: Omit<NotificationRecord, 'id' | 'createdAt'>): Promise<NotificationRecord> {
    return await this.db.create(TABLES.NOTIFICATIONS, data) as NotificationRecord
  }

  async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<NotificationRecord[]> {
    const where: any = { userId }
    if (unreadOnly) {
      where.isRead = false
    }
    
    return await this.db.read(TABLES.NOTIFICATIONS, {
      where,
      orderBy: 'createdAt',
      orderDirection: 'desc',
      limit: 50
    }) as NotificationRecord[]
  }

  async markNotificationRead(id: string): Promise<NotificationRecord | null> {
    return await this.db.update(TABLES.NOTIFICATIONS, id, {
      isRead: true,
      readAt: Date.now()
    }) as NotificationRecord | null
  }
}

// Helper function to get operations instance
export function getDBOperations(): TelegramDBOperations {
  const { getTelegramDatabase } = require('./telegram-db')
  const db = getTelegramDatabase()
  return new TelegramDBOperations(db)
}


