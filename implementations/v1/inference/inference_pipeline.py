"""
Inference pipeline for TikTok FYP replica.

Handles:
- Candidate generation
- Ranking
- Exploration/exploitation
- Diversity enforcement
- Feed generation
"""

import numpy as np
from typing import List, Dict, Optional
from pathlib import Path

from lib.data.schemas import (
    UserFeatures, VideoFeatures, RankingCandidate, SessionContext, Interaction
)
from lib.ranking.multi_objective_ranker import MultiObjectiveRanker
from lib.ranking.cold_start import ViralityEngine, ColdStartEngine
from lib.ranking.exploration import ExplorationExploitationManager
from lib.utils.failure_modes import FailureModeHandler
from lib.utils.online_learning import OnlineLearningManager


class InferencePipeline:
    """Complete inference pipeline for serving recommendations."""
    
    def __init__(
        self,
        ranking_model: MultiObjectiveRanker,
        content_embeddings: Dict[int, np.ndarray],
        user_embeddings: Dict[int, UserFeatures],
        video_features: Dict[int, VideoFeatures],
        config: Dict
    ):
        """
        Initialize inference pipeline.
        
        Args:
            ranking_model: Trained ranking model
            content_embeddings: Content embeddings dict
            user_embeddings: User embeddings dict
            video_features: Video features dict
            config: Inference configuration
        """
        self.ranking_model = ranking_model
        self.content_embeddings = content_embeddings
        self.user_embeddings = user_embeddings
        self.video_features = video_features
        self.config = config
        
        # Initialize components
        self.cold_start_engine = ColdStartEngine(
            initial_cohort_size=config.get("cold_start", {}).get("cohort_size", 500),
            expansion_threshold=config.get("cold_start", {}).get("expansion_threshold", 1.2)
        )
        self.virality_engine = ViralityEngine(self.cold_start_engine)
        self.exploration_manager = ExplorationExploitationManager(
            bandit_alpha=config.get("exploration", {}).get("bandit_alpha", 1.0),
            novelty_rate=config.get("exploration", {}).get("novelty_rate", 0.15)
        )
        self.failure_handler = FailureModeHandler()
        
        # Online learning (optional)
        self.online_learning: Optional[OnlineLearningManager] = None
    
    def generate_feed(
        self,
        user_id: int,
        session_context: SessionContext,
        candidate_pool_size: int = 1000,
        feed_size: int = 20
    ) -> List[RankingCandidate]:
        """
        Generate personalized feed for user.
        
        Args:
            user_id: User ID
            session_context: Current session context
            candidate_pool_size: Size of candidate pool
            feed_size: Size of final feed
        
        Returns:
            Ranked feed candidates
        """
        # 1. Get user features
        user_features = self.user_embeddings.get(user_id)
        if user_features is None:
            # Cold start user
            user_features = self._create_cold_start_user(user_id)
        
        # 2. Candidate generation
        candidates = self._generate_candidates(
            user_id, user_features, candidate_pool_size
        )
        
        # 3. Ranking
        ranked = self.ranking_model.rank(
            user_features,
            [self.video_features[c.video_id] for c in candidates],
            session_context
        )
        
        # 4. Exploration/exploitation
        user_history = session_context.recent_interactions
        ranked = self.exploration_manager.process_candidates(
            user_features,
            ranked,
            user_history,
            self.content_embeddings,
            session_context.current_length,
            k=feed_size * 2
        )
        
        # 5. Diversity enforcement
        ranked = self.failure_handler.enforce_diversity(
            ranked,
            user_history,
            self.content_embeddings
        )
        
        # 6. Spam suppression
        video_interactions = self._get_video_interactions()
        ranked = self.failure_handler.suppress_spam(
            ranked,
            video_interactions
        )
        
        # 7. Feedback loop stabilization
        if self.online_learning:
            ranked = self.online_learning.stabilize_feed(
                ranked,
                user_history,
                self.content_embeddings
            )
        
        # Return top-k
        return ranked[:feed_size]
    
    def process_interaction(
        self,
        interaction: Interaction
    ):
        """
        Process user interaction for online learning.
        
        Args:
            interaction: New interaction
        """
        if self.online_learning:
            content_emb = self.content_embeddings.get(interaction.video_id)
            if content_emb is not None:
                self.online_learning.process_interaction(
                    interaction, content_emb
                )
        
        # Update exploration bandit
        user_features = self.user_embeddings.get(interaction.user_id)
        video_features = self.video_features.get(interaction.video_id)
        
        if user_features and video_features:
            self.exploration_manager.update_from_interaction(
                user_features, interaction, video_features
            )
    
    def process_new_video(
        self,
        video_id: int,
        video_features: VideoFeatures,
        user_pool: List[int]
    ) -> List[int]:
        """
        Process new video through cold start.
        
        Args:
            video_id: New video ID
            video_features: Video features
            user_pool: Pool of available users
        
        Returns:
            List of user IDs for initial exposure
        """
        # Store video features
        self.video_features[video_id] = video_features
        
        # Extract and store content embedding
        if video_features.content_embedding is not None:
            self.content_embeddings[video_id] = video_features.content_embedding
        
        # Cold start exposure
        exposed_users = self.virality_engine.process_new_video(
            video_id, video_features, user_pool
        )
        
        return exposed_users
    
    def _generate_candidates(
        self,
        user_id: int,
        user_features: UserFeatures,
        pool_size: int
    ) -> List[VideoFeatures]:
        """
        Generate candidate videos.
        
        Args:
            user_id: User ID
            user_features: User features
            pool_size: Size of candidate pool
        
        Returns:
            Candidate video features
        """
        # In practice, use multiple candidate generation strategies:
        # 1. Content-based (similar to user interests)
        # 2. Collaborative filtering (similar users)
        # 3. Popular/trending
        # 4. Cold start (new videos)
        
        # For now, sample from all videos
        all_video_ids = list(self.video_features.keys())
        
        # Sample candidates
        candidate_ids = np.random.choice(
            all_video_ids,
            size=min(pool_size, len(all_video_ids)),
            replace=False
        )
        
        candidates = [self.video_features[vid] for vid in candidate_ids]
        
        return candidates
    
    def _create_cold_start_user(self, user_id: int) -> UserFeatures:
        """Create cold start user features."""
        user_features = UserFeatures(
            user_id=user_id,
            short_term_embedding=np.random.randn(128).astype(np.float32),
            mid_term_embedding=np.random.randn(256).astype(np.float32),
            long_term_embedding=np.random.randn(512).astype(np.float32)
        )
        
        # Normalize
        for emb_name in ["short_term_embedding", "mid_term_embedding", "long_term_embedding"]:
            emb = getattr(user_features, emb_name)
            if emb is not None:
                norm = np.linalg.norm(emb)
                if norm > 0:
                    setattr(user_features, emb_name, emb / norm)
        
        # Store
        self.user_embeddings[user_id] = user_features
        
        return user_features
    
    def _get_video_interactions(self) -> Dict[int, List[Interaction]]:
        """Get video interactions (for spam detection)."""
        # In practice, load from database
        # For now, return empty dict
        return {}


class ServingService:
    """Serving service for recommendations."""
    
    def __init__(self, inference_pipeline: InferencePipeline):
        """
        Initialize serving service.
        
        Args:
            inference_pipeline: Inference pipeline instance
        """
        self.inference_pipeline = inference_pipeline
    
    def get_recommendations(
        self,
        user_id: int,
        session_id: int,
        session_start_time: int,
        current_length: int,
        recent_interactions: List[Interaction]
    ) -> List[RankingCandidate]:
        """
        Get recommendations for user.
        
        Args:
            user_id: User ID
            session_id: Session ID
            session_start_time: Session start timestamp
            current_length: Current session length
            recent_interactions: Recent interactions
        
        Returns:
            Ranked feed candidates
        """
        # Create session context
        session_context = SessionContext(
            user_id=user_id,
            session_id=session_id,
            session_start_time=session_start_time,
            current_length=current_length,
            recent_interactions=recent_interactions,
            scroll_velocity=self._compute_scroll_velocity(recent_interactions),
            avg_engagement=self._compute_avg_engagement(recent_interactions),
            fatigue_score=self._compute_fatigue(current_length, recent_interactions)
        )
        
        # Generate feed
        feed = self.inference_pipeline.generate_feed(
            user_id, session_context
        )
        
        return feed
    
    def record_interaction(self, interaction: Interaction):
        """Record user interaction."""
        self.inference_pipeline.process_interaction(interaction)
    
    def _compute_scroll_velocity(self, interactions: List[Interaction]) -> float:
        """Compute scroll velocity (interactions per minute)."""
        if len(interactions) < 2:
            return 0.0
        
        time_span = interactions[-1].timestamp - interactions[0].timestamp
        if time_span == 0:
            return 0.0
        
        return len(interactions) / (time_span / 60.0)  # per minute
    
    def _compute_avg_engagement(self, interactions: List[Interaction]) -> float:
        """Compute average engagement."""
        if len(interactions) == 0:
            return 0.0
        
        engagements = [
            i.watch_time * (1 - i.skip) + i.like * 0.3
            for i in interactions
        ]
        
        return np.mean(engagements)
    
    def _compute_fatigue(
        self,
        session_length: int,
        interactions: List[Interaction]
    ) -> float:
        """Compute fatigue score."""
        # Simple fatigue model: increases with session length
        base_fatigue = min(1.0, session_length / 50.0)
        
        # Increase if recent interactions show low engagement
        if len(interactions) > 0:
            recent_engagement = self._compute_avg_engagement(interactions[-5:])
            engagement_fatigue = 1.0 - recent_engagement
            base_fatigue = (base_fatigue + engagement_fatigue) / 2.0
        
        return base_fatigue


