"""
Core recommendation algorithm for Pyodide.
Lightweight version optimized for browser execution.
"""

import json
import numpy as np
from typing import List, Dict, Optional
from ranking import MultiObjectiveRanker
from user_model import UserModel


class RecommendationEngine:
    """Main recommendation engine."""
    
    def __init__(self):
        """Initialize recommendation engine."""
        self.ranker = MultiObjectiveRanker()
        self.user_model = UserModel()
        
        # In-memory storage (in production, use IndexedDB)
        self.video_features: Dict[str, Dict] = {}
        self.user_embeddings: Dict[str, np.ndarray] = {}
        self.interactions: List[Dict] = []
        
        # Video pool (will be populated from API)
        self.video_pool: List[str] = []
    
    def get_recommendations(
        self,
        user_id: str,
        session_id: str,
        interactions: List[Dict],
        count: int = 20
    ) -> List[str]:
        """
        Get personalized recommendations.
        
        Args:
            user_id: User ID
            session_id: Session ID
            interactions: List of user interactions
            count: Number of recommendations to return
        
        Returns:
            List of video IDs
        """
        # Update user model with interactions
        if interactions:
            self.user_model.update_from_interactions(user_id, interactions)
        
        # Get user embedding
        user_embedding = self.user_model.get_user_embedding(user_id)
        
        # If no video pool, return empty
        if not self.video_pool:
            return []
        
        # Score all videos
        scores = []
        for video_id in self.video_pool:
            video_features = self.video_features.get(video_id, {})
            if not video_features:
                # Default features for unknown videos
                video_features = {
                    'embedding': np.random.randn(768).astype(np.float32),
                    'duration': 30.0,
                    'engagement': 0.5,
                }
            
            # Compute ranking score
            score = self.ranker.score(
                user_embedding,
                video_features.get('embedding', np.zeros(768)),
                video_features
            )
            
            scores.append((video_id, score))
        
        # Sort by score and return top-k
        scores.sort(key=lambda x: x[1], reverse=True)
        return [video_id for video_id, _ in scores[:count]]
    
    def record_interaction(self, interaction: Dict):
        """
        Record user interaction.
        
        Args:
            interaction: Interaction dictionary
        """
        self.interactions.append(interaction)
        
        # Update user model
        user_id = interaction.get('userId', 'anonymous')
        self.user_model.record_interaction(user_id, interaction)
    
    def add_videos(self, videos: List[Dict]):
        """
        Add videos to the pool.
        
        Args:
            videos: List of video dictionaries with metadata
        """
        for video in videos:
            video_id = video.get('id', str(len(self.video_pool)))
            
            # Extract features
            self.video_features[video_id] = {
                'embedding': np.random.randn(768).astype(np.float32),  # Placeholder
                'duration': video.get('duration', 30.0),
                'engagement': self._compute_engagement(video),
            }
            
            if video_id not in self.video_pool:
                self.video_pool.append(video_id)
    
    def _compute_engagement(self, video: Dict) -> float:
        """Compute engagement score from video stats."""
        stats = video.get('stats', {})
        views = stats.get('views', 1)
        likes = stats.get('likes', 0)
        shares = stats.get('shares', 0)
        comments = stats.get('comments', 0)
        
        # Normalized engagement score
        engagement = (likes * 1.0 + shares * 2.0 + comments * 1.5) / max(views, 1)
        return min(engagement, 1.0)


