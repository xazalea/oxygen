/**
 * Telegram Database Schema
 * 
 * Defines all database tables and their schemas.
 * Each table is stored as a JSON file in Telegram Cloud Storage.
 */

export interface VideoRecord {
  id: string
  tiktokId: string
  telegramFileId?: string
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
  hashtags?: string[]
  timestamp: number
  downloadedAt?: number
  downloadStatus: 'pending' | 'downloading' | 'completed' | 'failed'
  createdAt: number
  updatedAt: number
}

export interface UserRecord {
  id: string
  username: string
  displayName: string
  email?: string
  avatar?: string
  bio?: string
  followers: number
  following: number
  likes: number
  isPrivate: boolean
  preferences: {
    theme: 'dark' | 'light' | 'auto'
    autoplay: boolean
    notifications: boolean
    language: string
  }
  socialGraph: {
    followers: string[]
    following: string[]
    blocked: string[]
    muted: string[]
    closeFriends: string[]
  }
  createdAt: number
  updatedAt: number
}

export interface InteractionRecord {
  id: string
  userId: string
  videoId: string
  type: 'like' | 'share' | 'comment' | 'watch' | 'skip' | 'follow' | 'save'
  value: boolean | number
  timestamp: number
  metadata?: {
    watchDuration?: number
    completionRate?: number
    commentText?: string
  }
  createdAt: number
}

export interface RecommendationRecord {
  id: string
  userId: string
  sessionId: string
  videoIds: string[]
  algorithmState: {
    userEmbedding?: number[]
    lastUpdated: number
  }
  createdAt: number
  updatedAt: number
}

export interface DownloadRecord {
  id: string
  videoId: string
  tiktokId: string
  status: 'queued' | 'downloading' | 'uploading' | 'completed' | 'failed'
  priority: number
  progress: number
  error?: string
  telegramFileId?: string
  createdAt: number
  updatedAt: number
  completedAt?: number
}

export interface StoryRecord {
  id: string
  userId: string
  telegramFileId?: string
  mediaUrl?: string
  mediaType: 'image' | 'video'
  caption?: string
  expiresAt: number
  views: number
  reactions: {
    userId: string
    type: string
    timestamp: number
  }[]
  replies: {
    userId: string
    text: string
    timestamp: number
  }[]
  isHighlight: boolean
  highlightId?: string
  createdAt: number
}

export interface TextPostRecord {
  id: string
  userId: string
  content: string
  threadId?: string // For replies
  parentId?: string // For threaded conversations
  mediaUrls?: string[]
  hashtags?: string[]
  mentions?: string[]
  likes: number
  reposts: number
  replies: number
  isRepost: boolean
  originalPostId?: string
  createdAt: number
  updatedAt: number
}

export interface MessageRecord {
  id: string
  chatId: string
  senderId: string
  recipientId?: string // For DMs
  type: 'text' | 'media' | 'voice' | 'video'
  content: string
  mediaUrl?: string
  telegramFileId?: string
  isDisappearing: boolean
  expiresAt?: number
  isRead: boolean
  readAt?: number
  reactions?: {
    userId: string
    emoji: string
    timestamp: number
  }[]
  createdAt: number
}

export interface CommunityRecord {
  id: string
  name: string
  description?: string
  avatar?: string
  isPublic: boolean
  members: string[]
  admins: string[]
  moderators: string[]
  settings: {
    allowMemberPosts: boolean
    requireApproval: boolean
    rules?: string[]
  }
  createdAt: number
  updatedAt: number
}

export interface LiveStreamRecord {
  id: string
  userId: string
  title: string
  description?: string
  streamUrl: string
  thumbnailUrl?: string
  viewers: number
  isLive: boolean
  startedAt: number
  endedAt?: number
  chat: {
    userId: string
    message: string
    timestamp: number
  }[]
  createdAt: number
}

export interface CollectionRecord {
  id: string
  userId: string
  name: string
  description?: string
  type: 'playlist' | 'collection' | 'saved'
  items: {
    type: 'video' | 'post' | 'story'
    id: string
    addedAt: number
  }[]
  isPublic: boolean
  isCollaborative: boolean
  collaborators?: string[]
  createdAt: number
  updatedAt: number
}

export interface NotificationRecord {
  id: string
  userId: string
  type: 'like' | 'comment' | 'follow' | 'mention' | 'message' | 'story'
  title: string
  message: string
  relatedId?: string // Video ID, post ID, etc.
  isRead: boolean
  readAt?: number
  createdAt: number
}

/**
 * Table names
 */
export const TABLES = {
  VIDEOS: 'videos',
  USERS: 'users',
  INTERACTIONS: 'interactions',
  RECOMMENDATIONS: 'recommendations',
  DOWNLOADS: 'downloads',
  STORIES: 'stories',
  TEXT_POSTS: 'text_posts',
  MESSAGES: 'messages',
  COMMUNITIES: 'communities',
  LIVE_STREAMS: 'live_streams',
  COLLECTIONS: 'collections',
  NOTIFICATIONS: 'notifications'
} as const

/**
 * Schema validation helpers
 */
export function validateVideoRecord(record: any): record is VideoRecord {
  return (
    typeof record.id === 'string' &&
    typeof record.tiktokId === 'string' &&
    typeof record.videoUrl === 'string' &&
    typeof record.duration === 'number' &&
    typeof record.description === 'string' &&
    record.author &&
    typeof record.author.id === 'string' &&
    typeof record.author.username === 'string'
  )
}

export function validateUserRecord(record: any): record is UserRecord {
  return (
    typeof record.id === 'string' &&
    typeof record.username === 'string' &&
    typeof record.displayName === 'string' &&
    typeof record.followers === 'number' &&
    typeof record.following === 'number'
  )
}

export function validateInteractionRecord(record: any): record is InteractionRecord {
  return (
    typeof record.id === 'string' &&
    typeof record.userId === 'string' &&
    typeof record.videoId === 'string' &&
    typeof record.type === 'string' &&
    typeof record.timestamp === 'number'
  )
}

