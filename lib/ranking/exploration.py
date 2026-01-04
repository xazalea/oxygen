"""
Exploration vs exploitation strategies.

Implements contextual bandits, novelty injection, and fast taste discovery.
"""

import numpy as np
import torch
from typing import List, Dict, Optional, Set
import random

from lib.data.schemas import UserFeatures, VideoFeatures, RankingCandidate, Interaction


class ContextualBandit:
    """Contextual bandit for exploration/exploitation."""
    
    def __init__(self, alpha: float = 1.0, context_dim: int = 1664):
        """
        Initialize contextual bandit (LinUCB).
        
        Args:
            alpha: Exploration parameter
            context_dim: Dimension of context vector
        """
        self.alpha = alpha
        self.context_dim = context_dim
        
        # Per-arm statistics
        self.A: Dict[int, np.ndarray] = {}  # Covariance matrices
        self.b: Dict[int, np.ndarray] = {}  # Reward vectors
    
    def select_arms(
        self,
        user_features: UserFeatures,
        candidates: List[RankingCandidate],
        k: int = 10
    ) -> List[RankingCandidate]:
        """
        Select top-k arms using UCB.
        
        Args:
            user_features: User features
            candidates: Candidate videos with ranking scores
            k: Number of arms to select
        
        Returns:
            Top-k candidates with exploration bonuses
        """
        scored_candidates = []
        
        for candidate in candidates:
            # Get context
            context = self._get_context(user_features, candidate.video_features)
            
            # Compute UCB score
            if candidate.video_id not in self.A:
                # Cold start: high uncertainty
                ucb_score = float('inf')
                is_exploration = True
            else:
                # Exploitation score (use ranking score as base)
                theta = np.linalg.solve(
                    self.A[candidate.video_id],
                    self.b[candidate.video_id]
                )
                exploitation = np.dot(theta, context)
                
                # Exploration bonus
                uncertainty = self.alpha * np.sqrt(
                    context.T @ np.linalg.solve(
                        self.A[candidate.video_id],
                        context
                    )
                )
                
                ucb_score = exploitation + uncertainty
                is_exploration = uncertainty > exploitation * 0.1
            
            # Update candidate
            candidate.exploration_bonus = ucb_score - candidate.ranking_score
            candidate.is_exploration = is_exploration
            candidate.ranking_score = ucb_score
            
            scored_candidates.append(candidate)
        
        # Sort by UCB score
        scored_candidates.sort(key=lambda x: x.ranking_score, reverse=True)
        
        return scored_candidates[:k]
    
    def update(
        self,
        video_id: int,
        user_features: UserFeatures,
        video_features: VideoFeatures,
        reward: float
    ):
        """
        Update bandit statistics from interaction.
        
        Args:
            video_id: Video ID
            user_features: User features
            video_features: Video features
            reward: Observed reward (e.g., watch_time)
        """
        # Get context
        context = self._get_context(user_features, video_features)
        
        # Initialize if needed
        if video_id not in self.A:
            self.A[video_id] = np.eye(self.context_dim)
            self.b[video_id] = np.zeros(self.context_dim)
        
        # Update
        self.A[video_id] += np.outer(context, context)
        self.b[video_id] += reward * context
    
    def _get_context(
        self,
        user_features: UserFeatures,
        video_features: VideoFeatures
    ) -> np.ndarray:
        """Extract context vector."""
        # Concatenate user and video embeddings
        user_short = user_features.short_term_embedding or np.zeros(128)
        user_mid = user_features.mid_term_embedding or np.zeros(256)
        user_long = user_features.long_term_embedding or np.zeros(512)
        content = video_features.content_embedding or np.zeros(768)
        
        context = np.concatenate([
            user_short,
            user_mid,
            user_long,
            content
        ])
        
        # Pad or truncate to context_dim
        if len(context) < self.context_dim:
            padding = np.zeros(self.context_dim - len(context))
            context = np.concatenate([context, padding])
        else:
            context = context[:self.context_dim]
        
        return context


class FastTasteDiscovery:
    """Rapidly discovers user preferences from initial interactions."""
    
    def __init__(self, threshold: float = 0.5, min_interactions: int = 5):
        """
        Initialize fast taste discovery.
        
        Args:
            threshold: Engagement threshold for preference detection
            min_interactions: Minimum interactions before analysis
        """
        self.threshold = threshold
        self.min_interactions = min_interactions
    
    def discover_preferences(
        self,
        user_id: int,
        recent_interactions: List[Interaction],
        content_embeddings: Dict[int, np.ndarray]
    ) -> Optional[Dict]:
        """
        Discover user preferences from recent interactions.
        
        Args:
            user_id: User ID
            recent_interactions: Recent interactions (first 5-10)
            content_embeddings: Dict mapping video_id to content embedding
        
        Returns:
            Dict with preferred categories/features or None
        """
        if len(recent_interactions) < self.min_interactions:
            return None
        
        # Analyze patterns
        high_engagement = [
            i for i in recent_interactions
            if i.watch_time > self.threshold and not i.skip
        ]
        
        if len(high_engagement) == 0:
            return None
        
        # Extract preferred content embeddings
        preferred_embeddings = []
        for interaction in high_engagement:
            if interaction.video_id in content_embeddings:
                preferred_embeddings.append(
                    content_embeddings[interaction.video_id]
                )
        
        if len(preferred_embeddings) == 0:
            return None
        
        # Compute centroid of preferred content
        preferred_centroid = np.mean(preferred_embeddings, axis=0)
        
        # Compute boost factor
        boost_factor = 1.5  # Boost similar content
        
        return {
            "preferred_centroid": preferred_centroid,
            "boost_factor": boost_factor,
            "num_preferred": len(high_engagement)
        }
    
    def apply_boost(
        self,
        candidates: List[RankingCandidate],
        preferences: Dict
    ) -> List[RankingCandidate]:
        """
        Apply boost to candidates similar to discovered preferences.
        
        Args:
            candidates: Candidate videos
            preferences: Discovered preferences
        
        Returns:
            Candidates with boosted scores
        """
        preferred_centroid = preferences["preferred_centroid"]
        boost_factor = preferences["boost_factor"]
        
        for candidate in candidates:
            content_emb = candidate.video_features.content_embedding
            
            if content_emb is not None:
                # Compute similarity
                similarity = np.dot(content_emb, preferred_centroid) / (
                    np.linalg.norm(content_emb) * np.linalg.norm(preferred_centroid)
                )
                
                # Apply boost
                if similarity > 0.7:  # High similarity threshold
                    candidate.ranking_score *= boost_factor
        
        # Re-sort
        candidates.sort(key=lambda x: x.ranking_score, reverse=True)
        
        return candidates


class NoveltyInjector:
    """Injects novel content into feed."""
    
    def __init__(self, novelty_rate: float = 0.15, min_similarity: float = 0.5):
        """
        Initialize novelty injector.
        
        Args:
            novelty_rate: Fraction of feed to be novel
            min_similarity: Minimum similarity threshold for novelty
        """
        self.novelty_rate = novelty_rate
        self.min_similarity = min_similarity
    
    def inject_novelty(
        self,
        user_id: int,
        ranked_candidates: List[RankingCandidate],
        user_history: List[Interaction],
        content_embeddings: Dict[int, np.ndarray],
        session_length: int
    ) -> List[RankingCandidate]:
        """
        Inject novel content into ranked feed.
        
        Args:
            user_id: User ID
            ranked_candidates: Already ranked candidates
            user_history: User's recent interaction history
            content_embeddings: Dict mapping video_id to content embedding
            session_length: Current session length
        
        Returns:
            Feed with injected novelty
        """
        # Compute novelty budget
        novelty_budget = int(session_length * self.novelty_rate)
        
        if novelty_budget == 0:
            return ranked_candidates
        
        # Find novel videos (low similarity to history)
        history_embeddings = []
        for interaction in user_history[-50:]:  # Last 50 interactions
            if interaction.video_id in content_embeddings:
                history_embeddings.append(
                    content_embeddings[interaction.video_id]
                )
        
        if len(history_embeddings) == 0:
            return ranked_candidates
        
        # Compute history centroid
        history_centroid = np.mean(history_embeddings, axis=0)
        
        # Find novel candidates
        novel_candidates = []
        for candidate in ranked_candidates:
            if candidate.video_id in content_embeddings:
                content_emb = content_embeddings[candidate.video_id]
                similarity = np.dot(content_emb, history_centroid) / (
                    np.linalg.norm(content_emb) * np.linalg.norm(history_centroid)
                )
                
                if similarity < self.min_similarity:
                    novel_candidates.append(candidate)
        
        # Select top novel candidates
        novel_candidates = novel_candidates[:novelty_budget]
        
        # Inject at strategic positions
        positions = [5, 10, 15, 20, 25]  # Spread throughout feed
        
        for i, novel_candidate in enumerate(novel_candidates):
            position = positions[i % len(positions)]
            if position < len(ranked_candidates):
                ranked_candidates.insert(position, novel_candidate)
        
        return ranked_candidates


class ExplorationExploitationManager:
    """Manages exploration vs exploitation balance."""
    
    def __init__(
        self,
        bandit_alpha: float = 1.0,
        novelty_rate: float = 0.15
    ):
        """
        Initialize exploration/exploitation manager.
        
        Args:
            bandit_alpha: Bandit exploration parameter
            novelty_rate: Novelty injection rate
        """
        self.bandit = ContextualBandit(alpha=bandit_alpha)
        self.taste_discovery = FastTasteDiscovery()
        self.novelty_injector = NoveltyInjector(novelty_rate=novelty_rate)
    
    def process_candidates(
        self,
        user_features: UserFeatures,
        candidates: List[RankingCandidate],
        user_history: List[Interaction],
        content_embeddings: Dict[int, np.ndarray],
        session_length: int,
        k: int = 20
    ) -> List[RankingCandidate]:
        """
        Process candidates with exploration/exploitation.
        
        Args:
            user_features: User features
            candidates: Ranked candidates
            user_history: User interaction history
            content_embeddings: Content embeddings dict
            session_length: Current session length
            k: Number of final candidates
        
        Returns:
            Final candidates with exploration applied
        """
        # 1. Fast taste discovery (if early in session)
        if session_length < 10:
            preferences = self.taste_discovery.discover_preferences(
                user_features.user_id,
                user_history,
                content_embeddings
            )
            if preferences:
                candidates = self.taste_discovery.apply_boost(
                    candidates, preferences
                )
        
        # 2. Contextual bandit selection
        candidates = self.bandit.select_arms(user_features, candidates, k=k*2)
        
        # 3. Novelty injection
        candidates = self.novelty_injector.inject_novelty(
            user_features.user_id,
            candidates,
            user_history,
            content_embeddings,
            session_length
        )
        
        # Return top-k
        return candidates[:k]
    
    def update_from_interaction(
        self,
        user_features: UserFeatures,
        interaction: Interaction,
        video_features: VideoFeatures
    ):
        """
        Update bandit from interaction.
        
        Args:
            user_features: User features
            interaction: Observed interaction
            video_features: Video features
        """
        # Compute reward
        reward = (
            interaction.watch_time * (1 - interaction.skip) +
            interaction.like * 0.3 +
            interaction.share * 0.5
        )
        
        # Update bandit
        self.bandit.update(
            interaction.video_id,
            user_features,
            video_features,
            reward
        )



