"""
Multi-objective ranking system for TikTok FYP replica.

Implements ranking with multiple objectives:
- Watch time prediction
- Completion probability
- Rewatch probability
- Session continuation
- Skip penalty
- Fatigue penalty
"""

import numpy as np
import torch
import torch.nn as nn
from typing import List, Dict, Optional

from lib.data.schemas import (
    UserFeatures, VideoFeatures, RankingCandidate, SessionContext
)


class WatchTimePredictor(nn.Module):
    """Predicts expected watch time."""
    
    def __init__(self, user_dim: int = 896, content_dim: int = 768):
        """
        Initialize watch time predictor.
        
        Args:
            user_dim: Combined user embedding dimension (128+256+512)
            content_dim: Content embedding dimension
        """
        super().__init__()
        
        input_dim = user_dim + content_dim
        
        self.model = nn.Sequential(
            nn.Linear(input_dim, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 1),
            nn.Sigmoid()  # Output normalized watch time [0, 1]
        )
    
    def forward(
        self,
        user_short: torch.Tensor,
        user_mid: torch.Tensor,
        user_long: torch.Tensor,
        content: torch.Tensor
    ) -> torch.Tensor:
        """
        Predict watch time.
        
        Args:
            user_short: Short-term embedding [128]
            user_mid: Mid-term embedding [256]
            user_long: Long-term embedding [512]
            content: Content embedding [768]
        
        Returns:
            Predicted watch time [0, 1]
        """
        # Concatenate user embeddings
        user_combined = torch.cat([user_short, user_mid, user_long], dim=-1)  # [896]
        
        # Concatenate with content
        features = torch.cat([user_combined, content], dim=-1)  # [1664]
        
        # Predict
        watch_time = self.model(features)
        
        return watch_time


class CompletionPredictor(nn.Module):
    """Predicts completion probability."""
    
    def __init__(self, user_dim: int = 896, content_dim: int = 768):
        """Initialize completion predictor."""
        super().__init__()
        
        input_dim = user_dim + content_dim
        
        self.model = nn.Sequential(
            nn.Linear(input_dim, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 1),
            nn.Sigmoid()
        )
    
    def forward(
        self,
        user_short: torch.Tensor,
        user_mid: torch.Tensor,
        user_long: torch.Tensor,
        content: torch.Tensor
    ) -> torch.Tensor:
        """Predict completion probability."""
        user_combined = torch.cat([user_short, user_mid, user_long], dim=-1)
        features = torch.cat([user_combined, content], dim=-1)
        completion = self.model(features)
        return completion


class RewatchPredictor(nn.Module):
    """Predicts rewatch probability."""
    
    def __init__(self, user_dim: int = 896, content_dim: int = 768):
        """Initialize rewatch predictor."""
        super().__init__()
        
        input_dim = user_dim + content_dim
        
        self.model = nn.Sequential(
            nn.Linear(input_dim, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 1),
            nn.Sigmoid()
        )
    
    def forward(
        self,
        user_short: torch.Tensor,
        user_mid: torch.Tensor,
        user_long: torch.Tensor,
        content: torch.Tensor
    ) -> torch.Tensor:
        """Predict rewatch probability."""
        user_combined = torch.cat([user_short, user_mid, user_long], dim=-1)
        features = torch.cat([user_combined, content], dim=-1)
        rewatch = self.model(features)
        return rewatch


class SessionContinuationPredictor(nn.Module):
    """Predicts session continuation probability."""
    
    def __init__(self, user_dim: int = 896, content_dim: int = 768, session_dim: int = 64):
        """Initialize session continuation predictor."""
        super().__init__()
        
        input_dim = user_dim + content_dim + session_dim
        
        self.model = nn.Sequential(
            nn.Linear(input_dim, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 1),
            nn.Sigmoid()
        )
    
    def forward(
        self,
        user_short: torch.Tensor,
        user_mid: torch.Tensor,
        user_long: torch.Tensor,
        content: torch.Tensor,
        session_context: torch.Tensor
    ) -> torch.Tensor:
        """Predict session continuation probability."""
        user_combined = torch.cat([user_short, user_mid, user_long], dim=-1)
        features = torch.cat([user_combined, content, session_context], dim=-1)
        continuation = self.model(features)
        return continuation


class SkipPredictor(nn.Module):
    """Predicts fast skip probability."""
    
    def __init__(self, user_dim: int = 896, content_dim: int = 768):
        """Initialize skip predictor."""
        super().__init__()
        
        input_dim = user_dim + content_dim
        
        self.model = nn.Sequential(
            nn.Linear(input_dim, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 1),
            nn.Sigmoid()
        )
    
    def forward(
        self,
        user_short: torch.Tensor,
        user_mid: torch.Tensor,
        user_long: torch.Tensor,
        content: torch.Tensor
    ) -> torch.Tensor:
        """Predict skip probability."""
        user_combined = torch.cat([user_short, user_mid, user_long], dim=-1)
        features = torch.cat([user_combined, content], dim=-1)
        skip_prob = self.model(features)
        return skip_prob


class FatiguePredictor(nn.Module):
    """Predicts user fatigue score."""
    
    def __init__(self, session_dim: int = 64):
        """Initialize fatigue predictor."""
        super().__init__()
        
        self.model = nn.Sequential(
            nn.Linear(session_dim, 128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )
    
    def forward(self, session_context: torch.Tensor) -> torch.Tensor:
        """Predict fatigue score."""
        fatigue = self.model(session_context)
        return fatigue


class MultiObjectiveRanker:
    """Multi-objective ranking system."""
    
    def __init__(
        self,
        weights: Optional[Dict[str, float]] = None,
        device: str = "cpu"
    ):
        """
        Initialize multi-objective ranker.
        
        Args:
            weights: Objective weights (defaults to architecture doc values)
            device: Device for computation
        """
        self.device = device
        
        # Default weights
        self.weights = weights or {
            "watch_time": 0.4,
            "completion": 0.2,
            "rewatch": 0.15,
            "continuation": 0.15,
            "skip_penalty": 0.05,
            "fatigue_penalty": 0.05
        }
        
        # Initialize sub-models
        self.watch_time_model = WatchTimePredictor().to(device)
        self.completion_model = CompletionPredictor().to(device)
        self.rewatch_model = RewatchPredictor().to(device)
        self.continuation_model = SessionContinuationPredictor().to(device)
        self.skip_model = SkipPredictor().to(device)
        self.fatigue_model = FatiguePredictor().to(device)
        
        # Set to eval mode
        self.eval()
    
    def eval(self):
        """Set all models to eval mode."""
        self.watch_time_model.eval()
        self.completion_model.eval()
        self.rewatch_model.eval()
        self.continuation_model.eval()
        self.skip_model.eval()
        self.fatigue_model.eval()
    
    def train_mode(self):
        """Set all models to train mode."""
        self.watch_time_model.train()
        self.completion_model.train()
        self.rewatch_model.train()
        self.continuation_model.train()
        self.skip_model.train()
        self.fatigue_model.train()
    
    def rank(
        self,
        user_features: UserFeatures,
        candidate_videos: List[VideoFeatures],
        session_context: SessionContext
    ) -> List[RankingCandidate]:
        """
        Rank candidate videos.
        
        Args:
            user_features: User features with embeddings
            candidate_videos: List of candidate video features
            session_context: Current session context
        
        Returns:
            List of ranked candidates with scores
        """
        candidates = []
        
        # Prepare user embeddings
        user_short = torch.from_numpy(
            user_features.short_term_embedding
        ).float().to(self.device)
        user_mid = torch.from_numpy(
            user_features.mid_term_embedding
        ).float().to(self.device)
        user_long = torch.from_numpy(
            user_features.long_term_embedding
        ).float().to(self.device)
        
        # Prepare session context
        session_features = self._extract_session_features(session_context)
        session_tensor = torch.from_numpy(session_features).float().to(self.device)
        
        with torch.no_grad():
            for video_features in candidate_videos:
                # Prepare content embedding
                content = torch.from_numpy(
                    video_features.content_embedding
                ).float().to(self.device)
                
                # Predict all objectives
                watch_time = self.watch_time_model(
                    user_short, user_mid, user_long, content
                ).item()
                
                completion = self.completion_model(
                    user_short, user_mid, user_long, content
                ).item()
                
                rewatch = self.rewatch_model(
                    user_short, user_mid, user_long, content
                ).item()
                
                continuation = self.continuation_model(
                    user_short, user_mid, user_long, content, session_tensor
                ).item()
                
                skip_prob = self.skip_model(
                    user_short, user_mid, user_long, content
                ).item()
                
                fatigue = self.fatigue_model(session_tensor).item()
                
                # Compute combined score
                score = (
                    self.weights["watch_time"] * watch_time +
                    self.weights["completion"] * completion +
                    self.weights["rewatch"] * rewatch +
                    self.weights["continuation"] * continuation -
                    self.weights["skip_penalty"] * skip_prob -
                    self.weights["fatigue_penalty"] * fatigue
                )
                
                # Create candidate
                candidate = RankingCandidate(
                    video_id=video_features.video_id,
                    video_features=video_features,
                    ranking_score=score,
                    watch_time_score=watch_time,
                    completion_score=completion,
                    rewatch_score=rewatch,
                    continuation_score=continuation,
                    skip_penalty=skip_prob,
                    fatigue_penalty=fatigue
                )
                candidates.append(candidate)
        
        # Sort by score
        candidates.sort(key=lambda x: x.ranking_score, reverse=True)
        
        return candidates
    
    def _extract_session_features(self, session_context: SessionContext) -> np.ndarray:
        """Extract session features for fatigue prediction."""
        features = np.array([
            session_context.current_length / 100.0,  # Normalized length
            session_context.scroll_velocity / 10.0,  # Normalized velocity
            session_context.avg_engagement,
            session_context.fatigue_score
        ], dtype=np.float32)
        
        # Pad to 64 dimensions (can add more features)
        if len(features) < 64:
            padding = np.zeros(64 - len(features), dtype=np.float32)
            features = np.concatenate([features, padding])
        
        return features[:64]

