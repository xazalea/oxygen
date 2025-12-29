"""
Lightweight ranking system for Pyodide.
Simplified version without PyTorch dependencies.
"""

import numpy as np
from typing import Dict, Optional


class MultiObjectiveRanker:
    """Multi-objective ranking system (simplified for browser)."""
    
    def __init__(self):
        """Initialize ranker."""
        # Simplified weights (no neural networks in browser)
        self.weights = {
            'watch_time': 0.4,
            'completion': 0.2,
            'engagement': 0.2,
            'recency': 0.1,
            'virality': 0.1,
        }
    
    def score(
        self,
        user_embedding: np.ndarray,
        video_embedding: np.ndarray,
        video_features: Dict
    ) -> float:
        """
        Compute ranking score.
        
        Args:
            user_embedding: User embedding vector
            video_embedding: Video content embedding
            video_features: Video metadata
        
        Returns:
            Ranking score
        """
        # Cosine similarity between user and video
        similarity = self._cosine_similarity(user_embedding, video_embedding)
        
        # Engagement score
        engagement = video_features.get('engagement', 0.5)
        
        # Duration preference (prefer shorter videos for better completion)
        duration = video_features.get('duration', 30.0)
        duration_score = 1.0 / (1.0 + duration / 60.0)  # Prefer < 60s
        
        # Combine scores
        score = (
            self.weights['watch_time'] * similarity +
            self.weights['engagement'] * engagement +
            self.weights['completion'] * duration_score +
            self.weights['virality'] * engagement * 0.5  # Viral boost
        )
        
        return float(score)
    
    def _cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        """Compute cosine similarity."""
        if a.shape[0] != b.shape[0]:
            # Pad or truncate to match
            min_len = min(a.shape[0], b.shape[0])
            a = a[:min_len]
            b = b[:min_len]
        
        dot_product = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
        
        return float(dot_product / (norm_a * norm_b))

