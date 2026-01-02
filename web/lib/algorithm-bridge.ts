import { loadPyodideInstance, getPyodideInstance } from './pyodide-loader'
import { getRecommendationFeaturesService, RecommendationFeatures } from './classyvision/recommendation-features'

export interface Interaction {
  type: 'like' | 'share' | 'comment' | 'watch' | 'skip'
  videoId: string
  value: boolean | number
  timestamp: number
}

export interface UserState {
  userId: string
  sessionId: string
  interactions: Interaction[]
}

export interface VideoWithFeatures {
  id: string
  features?: RecommendationFeatures
  visualEmbedding?: Float32Array
  category?: string
  tags?: string[]
}

class AlgorithmBridge {
  private pyodide: any = null
  private isInitialized = false
  private userState: UserState | null = null
  private engineInstance: any = null
  private recommendationFeatures = getRecommendationFeaturesService()
  private videoFeaturesCache: Map<string, RecommendationFeatures> = new Map()

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      const pyodide = await loadPyodideInstance()
      this.pyodide = pyodide

      // Load algorithm Python files
      await this.loadAlgorithmFiles()

      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize algorithm:', error)
      throw error
    }
  }

  private async loadAlgorithmFiles(): Promise<void> {
    if (!this.pyodide) return

    try {
      // Load ranking first (no dependencies)
      const rankingCode = await fetch('/pyodide/ranking.py').then(r => r.text())
      this.pyodide.runPython(rankingCode)

      // Load user model (no dependencies)
      const userModelCode = await fetch('/pyodide/user_model.py').then(r => r.text())
      this.pyodide.runPython(userModelCode)

      // Load algorithm core (depends on ranking and user_model)
      const algorithmCoreCode = await fetch('/pyodide/algorithm_core.py').then(r => r.text())
      this.pyodide.runPython(algorithmCoreCode)
    } catch (error) {
      console.error('Error loading algorithm files:', error)
      // Create minimal fallback implementation
      this.createFallbackImplementation()
    }
  }

  private createFallbackImplementation(): void {
    if (!this.pyodide) return

    // Minimal fallback that just returns random video IDs
    this.pyodide.runPython(`
import json
import random

class RecommendationEngine:
    def __init__(self):
        self.video_pool = []
        self.interactions = []
    
    def get_recommendations(self, user_id, session_id, interactions, count=20):
        if not self.video_pool:
            return []
        return random.sample(self.video_pool, min(count, len(self.video_pool)))
    
    def record_interaction(self, interaction):
        self.interactions.append(interaction)
    
    def add_videos(self, videos):
        for video in videos:
            video_id = video.get('id', str(len(self.video_pool)))
            if video_id not in self.video_pool:
                self.video_pool.append(video_id)
    `)
  }

  setUserState(userState: UserState): void {
    this.userState = userState
  }

  async getRecommendations(count: number = 20): Promise<string[]> {
    if (!this.isInitialized || !this.pyodide) {
      await this.initialize()
    }

    if (!this.userState) {
      // Initialize default user state
      this.userState = {
        userId: `user-${Date.now()}`,
        sessionId: `session-${Date.now()}`,
        interactions: [],
      }
    }

    try {
      // Convert interactions to Python format (escape quotes)
      const interactionsJson = JSON.stringify(this.userState.interactions).replace(/'/g, "\\'")
      
      // Call Python function
      const result = this.pyodide.runPython(`
import json
from algorithm_core import RecommendationEngine

# Get or create engine instance
try:
    engine
except NameError:
    engine = RecommendationEngine()

interactions = json.loads('${interactionsJson}')
recommendations = engine.get_recommendations(
    user_id='${this.userState!.userId}',
    session_id='${this.userState!.sessionId}',
    interactions=interactions,
    count=${count}
)
json.dumps(recommendations)
      `)

      const recommendations = JSON.parse(result)
      return Array.isArray(recommendations) ? recommendations : []
    } catch (error) {
      console.error('Error getting recommendations:', error)
      // Return empty array on error
      return []
    }
  }

  async addVideos(videos: any[]): Promise<void> {
    if (!this.isInitialized || !this.pyodide) {
      await this.initialize()
    }

    try {
      // Enhance videos with ClassyVision features if available
      const videosWithFeatures: VideoWithFeatures[] = await Promise.all(
        videos.map(async (video) => {
          // Check cache first
          const cached = this.videoFeaturesCache.get(video.id)
          if (cached) {
            return {
              ...video,
              features: cached,
              visualEmbedding: cached.visualFeatures,
              category: cached.category,
              tags: cached.tags
            }
          }

          // Try to extract features if video URL is available
          if (video.videoUrl && typeof window !== 'undefined') {
            try {
              const features = await this.recommendationFeatures.extractFeaturesFromURL(
                video.videoUrl,
                { includeTemporal: true, includeModeration: false }
              )
              this.videoFeaturesCache.set(video.id, features)
              return {
                ...video,
                features,
                visualEmbedding: features.visualFeatures,
                category: features.category,
                tags: features.tags
              }
            } catch (error) {
              console.warn(`Failed to extract features for video ${video.id}:`, error)
            }
          }

          return video
        })
      )

      // Convert features to JSON-serializable format
      const videosForPython = videosWithFeatures.map(v => ({
        ...v,
        visualEmbedding: v.visualEmbedding ? Array.from(v.visualEmbedding) : undefined,
        features: undefined // Don't send full features object
      }))

      const videosJson = JSON.stringify(videosForPython).replace(/'/g, "\\'")
      this.pyodide.runPython(`
import json
from algorithm_core import RecommendationEngine
import numpy as np

# Get or create engine instance
try:
    engine
except NameError:
    engine = RecommendationEngine()

videos = json.loads('${videosJson}')
# Convert embeddings to numpy arrays if present
for video in videos:
    if video.get('visualEmbedding'):
        video['visualEmbedding'] = np.array(video['visualEmbedding'], dtype=np.float32)
engine.add_videos(videos)
      `)
    } catch (error) {
      console.error('Error adding videos:', error)
    }
  }

  /**
   * Add video features to cache (called when features are extracted)
   */
  cacheVideoFeatures(videoId: string, features: RecommendationFeatures): void {
    this.videoFeaturesCache.set(videoId, features)
  }

  /**
   * Get cached video features
   */
  getCachedFeatures(videoId: string): RecommendationFeatures | undefined {
    return this.videoFeaturesCache.get(videoId)
  }

  async recordInteraction(interaction: Interaction): Promise<void> {
    if (!this.userState) {
      this.userState = {
        userId: 'anonymous',
        sessionId: `session-${Date.now()}`,
        interactions: [],
      }
    }

    this.userState.interactions.push(interaction)

    // Update algorithm with interaction
    if (this.isInitialized && this.pyodide) {
      try {
        const interactionJson = JSON.stringify(interaction)
        this.pyodide.runPython(`
from algorithm_core import RecommendationEngine
import json

engine = RecommendationEngine()
interaction = json.loads('${interactionJson}')
engine.record_interaction(interaction)
        `)
      } catch (error) {
        console.error('Error recording interaction:', error)
      }
    }
  }
}

export const algorithmBridge = new AlgorithmBridge()

