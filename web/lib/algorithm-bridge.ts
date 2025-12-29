import { loadPyodideInstance, getPyodideInstance } from './pyodide-loader'

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

class AlgorithmBridge {
  private pyodide: any = null
  private isInitialized = false
  private userState: UserState | null = null
  private engineInstance: any = null

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
      const videosJson = JSON.stringify(videos).replace(/'/g, "\\'")
      this.pyodide.runPython(`
import json
from algorithm_core import RecommendationEngine

# Get or create engine instance
try:
    engine
except NameError:
    engine = RecommendationEngine()

videos = json.loads('${videosJson}')
engine.add_videos(videos)
      `)
    } catch (error) {
      console.error('Error adding videos:', error)
    }
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

