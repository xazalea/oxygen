"""
Addiction engine - makes recommendations super addicting.

Based on insights from reverse-engineered TikTok source and psychology research.
Implements variable reward schedules, obsession loops, and engagement maximization.
"""

import numpy as np
import random
from typing import List, Dict, Optional
from collections import deque, defaultdict
import time

from lib.data.schemas import RankingCandidate, Interaction, SessionContext


class VariableRewardScheduler:
    """
    Variable reward schedule - unpredictable but rewarding patterns.
    
    Based on Skinner box psychology - variable ratio schedules create
    the strongest addiction.
    """
    
    def __init__(self, base_reward_rate: float = 0.3):
        """
        Initialize variable reward scheduler.
        
        Args:
            base_reward_rate: Base probability of high-reward content
        """
        self.base_reward_rate = base_reward_rate
        self.reward_history: Dict[int, deque] = defaultdict(lambda: deque(maxlen=20))
        self.reward_counts: Dict[int, int] = defaultdict(int)
    
    def should_show_high_reward(
        self,
        user_id: int,
        candidate: RankingCandidate
    ) -> bool:
        """
        Decide if high-reward content should be shown.
        
        Uses variable ratio schedule - unpredictable but frequent rewards.
        
        Args:
            user_id: User ID
            candidate: Candidate video
        
        Returns:
            True if high-reward content should be shown
        """
        history = self.reward_history[user_id]
        
        # Variable ratio schedule
        # After some low-reward content, increase probability
        recent_low_rewards = sum(1 for r in list(history)[-5:] if r < 0.5)
        
        if recent_low_rewards >= 3:
            # High probability after low rewards (gambling effect)
            probability = 0.8
        else:
            # Variable probability
            probability = self.base_reward_rate + random.uniform(-0.2, 0.2)
        
        return random.random() < probability
    
    def record_reward(self, user_id: int, reward: float):
        """
        Record reward for user.
        
        Args:
            user_id: User ID
            reward: Reward value (0-1)
        """
        self.reward_history[user_id].append(reward)
        if reward > 0.7:
            self.reward_counts[user_id] += 1


class ObsessionLoopDetector:
    """
    Detects and reinforces obsession loops.
    
    When users repeatedly engage with similar content, create a loop.
    """
    
    def __init__(self, similarity_threshold: float = 0.85):
        """
        Initialize obsession loop detector.
        
        Args:
            similarity_threshold: Similarity threshold for loop detection
        """
        self.similarity_threshold = similarity_threshold
        self.user_loops: Dict[int, Dict] = defaultdict(dict)
    
    def detect_obsession(
        self,
        user_id: int,
        recent_interactions: List[Interaction],
        content_embeddings: Dict[int, np.ndarray]
    ) -> Optional[Dict]:
        """
        Detect if user is in an obsession loop.
        
        Args:
            user_id: User ID
            recent_interactions: Recent interactions
            content_embeddings: Content embeddings dict
        
        Returns:
            Obsession loop info or None
        """
        if len(recent_interactions) < 5:
            return None
        
        # Get recent video embeddings
        recent_embeddings = []
        for interaction in recent_interactions[-10:]:
            if interaction.video_id in content_embeddings:
                recent_embeddings.append(
                    content_embeddings[interaction.video_id]
                )
        
        if len(recent_embeddings) < 5:
            return None
        
        # Compute average embedding (centroid)
        centroid = np.mean(recent_embeddings, axis=0)
        
        # Check similarity to centroid
        similarities = []
        for emb in recent_embeddings:
            sim = np.dot(emb, centroid) / (
                np.linalg.norm(emb) * np.linalg.norm(centroid)
            )
            similarities.append(sim)
        
        avg_similarity = np.mean(similarities)
        
        if avg_similarity > self.similarity_threshold:
            # User is in obsession loop
            return {
                "centroid": centroid,
                "similarity": avg_similarity,
                "boost_factor": 2.0  # Strong boost for obsession content
            }
        
        return None
    
    def apply_obsession_boost(
        self,
        candidates: List[RankingCandidate],
        obsession_info: Dict,
        content_embeddings: Dict[int, np.ndarray]
    ) -> List[RankingCandidate]:
        """
        Apply obsession loop boost to candidates.
        
        Args:
            candidates: Candidate videos
            obsession_info: Obsession loop info
            content_embeddings: Content embeddings dict
        
        Returns:
            Boosted candidates
        """
        centroid = obsession_info["centroid"]
        boost_factor = obsession_info["boost_factor"]
        
        for candidate in candidates:
            if candidate.video_id in content_embeddings:
                content_emb = content_embeddings[candidate.video_id]
                similarity = np.dot(content_emb, centroid) / (
                    np.linalg.norm(content_emb) * np.linalg.norm(centroid)
                )
                
                if similarity > 0.8:  # High similarity
                    # Strong boost
                    candidate.ranking_score *= boost_factor
                elif similarity > 0.7:  # Medium similarity
                    # Moderate boost
                    candidate.ranking_score *= (boost_factor * 0.7)
        
        # Re-sort
        candidates.sort(key=lambda x: x.ranking_score, reverse=True)
        
        return candidates


class SessionContinuationMaximizer:
    """
    Maximizes session continuation - keeps users scrolling.
    
    Uses techniques like cliffhangers, perfect pacing, and continuation hooks.
    """
    
    def __init__(self):
        """Initialize session continuation maximizer."""
        self.continuation_patterns: Dict[int, deque] = defaultdict(lambda: deque(maxlen=10))
    
    def optimize_for_continuation(
        self,
        candidates: List[RankingCandidate],
        session_context: SessionContext,
        content_embeddings: Dict[int, np.ndarray]
    ) -> List[RankingCandidate]:
        """
        Optimize feed for maximum session continuation.
        
        Args:
            candidates: Candidate videos
            session_context: Session context
            content_embeddings: Content embeddings dict
        
        Returns:
            Optimized candidates
        """
        # Strategy 1: Perfect pacing
        # Alternate between high and medium engagement to maintain interest
        paced_candidates = self._apply_pacing(candidates)
        
        # Strategy 2: Cliffhanger placement
        # Place high-engagement content at strategic positions
        cliffhanger_candidates = self._apply_cliffhangers(paced_candidates)
        
        # Strategy 3: Continuation hooks
        # Boost content that leads to more scrolling
        hooked_candidates = self._apply_continuation_hooks(
            cliffhanger_candidates, session_context
        )
        
        return hooked_candidates
    
    def _apply_pacing(self, candidates: List[RankingCandidate]) -> List[RankingCandidate]:
        """Apply perfect pacing - alternate engagement levels."""
        if len(candidates) < 3:
            return candidates
        
        # Sort by score
        sorted_candidates = sorted(candidates, key=lambda x: x.ranking_score, reverse=True)
        
        # Create paced sequence: high, medium, high, medium, ...
        paced = []
        high_idx = 0
        medium_idx = len(sorted_candidates) // 2
        
        for i in range(len(sorted_candidates)):
            if i % 2 == 0 and high_idx < len(sorted_candidates) // 2:
                paced.append(sorted_candidates[high_idx])
                high_idx += 1
            elif medium_idx < len(sorted_candidates):
                paced.append(sorted_candidates[medium_idx])
                medium_idx += 1
            elif high_idx < len(sorted_candidates) // 2:
                paced.append(sorted_candidates[high_idx])
                high_idx += 1
        
        return paced
    
    def _apply_cliffhangers(
        self,
        candidates: List[RankingCandidate]
    ) -> List[RankingCandidate]:
        """Place high-engagement content at strategic positions."""
        if len(candidates) < 5:
            return candidates
        
        # Strategic positions: 3, 7, 12, 18 (just before user might stop)
        cliffhanger_positions = [3, 7, 12, 18]
        
        # Get top candidates
        top_candidates = sorted(candidates, key=lambda x: x.ranking_score, reverse=True)
        
        # Place cliffhangers
        result = candidates.copy()
        for i, pos in enumerate(cliffhanger_positions):
            if i < len(top_candidates) and pos < len(result):
                # Insert high-engagement content
                result.insert(pos, top_candidates[i])
        
        return result[:len(candidates)]  # Maintain original length
    
    def _apply_continuation_hooks(
        self,
        candidates: List[RankingCandidate],
        session_context: SessionContext
    ) -> List[RankingCandidate]:
        """Apply continuation hooks - boost content that leads to more scrolling."""
        # Boost content that's likely to lead to session continuation
        for candidate in candidates:
            # Higher continuation score = higher boost
            continuation_score = candidate.continuation_score
            
            if continuation_score > 0.7:
                # Strong continuation hook
                candidate.ranking_score *= 1.3
            elif continuation_score > 0.5:
                # Moderate continuation hook
                candidate.ranking_score *= 1.15
        
        # Re-sort
        candidates.sort(key=lambda x: x.ranking_score, reverse=True)
        
        return candidates


class EngagementMaximizer:
    """
    Maximizes engagement through psychological techniques.
    
    Based on insights from reverse-engineered TikTok source and psychology research.
    """
    
    def __init__(self):
        """Initialize engagement maximizer."""
        self.variable_reward = VariableRewardScheduler()
        self.obsession_detector = ObsessionLoopDetector()
        self.continuation_maximizer = SessionContinuationMaximizer()
        
        # Engagement tracking
        self.user_engagement: Dict[int, float] = defaultdict(float)
        self.session_lengths: Dict[int, List[int]] = defaultdict(list)
    
    def maximize_engagement(
        self,
        user_id: int,
        candidates: List[RankingCandidate],
        session_context: SessionContext,
        recent_interactions: List[Interaction],
        content_embeddings: Dict[int, np.ndarray]
    ) -> List[RankingCandidate]:
        """
        Maximize engagement using all addiction techniques.
        
        Args:
            user_id: User ID
            candidates: Candidate videos
            session_context: Session context
            recent_interactions: Recent interactions
            content_embeddings: Content embeddings dict
        
        Returns:
            Maximally engaging candidates
        """
        # 1. Variable reward schedule
        for candidate in candidates:
            if self.variable_reward.should_show_high_reward(user_id, candidate):
                candidate.ranking_score *= 1.2
        
        # 2. Obsession loop detection and reinforcement
        obsession_info = self.obsession_detector.detect_obsession(
            user_id, recent_interactions, content_embeddings
        )
        if obsession_info:
            candidates = self.obsession_detector.apply_obsession_boost(
                candidates, obsession_info, content_embeddings
            )
        
        # 3. Session continuation maximization
        candidates = self.continuation_maximizer.optimize_for_continuation(
            candidates, session_context, content_embeddings
        )
        
        # 4. Anti-fatigue injection
        # If user shows fatigue, inject high-reward content
        if session_context.fatigue_score > 0.7:
            # Boost top candidates to re-engage
            for candidate in candidates[:5]:
                candidate.ranking_score *= 1.5
        
        # Final sort
        candidates.sort(key=lambda x: x.ranking_score, reverse=True)
        
        return candidates
    
    def record_engagement(
        self,
        user_id: int,
        interaction: Interaction,
        session_length: int
    ):
        """
        Record engagement for tracking.
        
        Args:
            user_id: User ID
            interaction: User interaction
            session_length: Current session length
        """
        engagement = (
            interaction.watch_time * (1 - interaction.skip) +
            interaction.like * 0.3 +
            interaction.share * 0.5
        )
        
        self.user_engagement[user_id] = (
            self.user_engagement[user_id] * 0.9 + engagement * 0.1
        )
        
        self.session_lengths[user_id].append(session_length)
        
        # Record reward
        self.variable_reward.record_reward(user_id, engagement)

