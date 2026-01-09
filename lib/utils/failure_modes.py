"""
Failure mode detection and mitigation.

Handles:
- Engagement farming
- Loop exploitation
- Over-personalization
- Content homogenization
"""

import numpy as np
from typing import List, Dict, Set, Optional
from collections import defaultdict, Counter

from lib.data.schemas import Interaction, RankingCandidate, VideoFeatures


class EngagementFarmingDetector:
    """Detects engagement farming patterns."""
    
    def __init__(
        self,
        bot_threshold: float = 0.95,
        coordinated_threshold: int = 10
    ):
        """
        Initialize engagement farming detector.
        
        Args:
            bot_threshold: Threshold for bot-like behavior
            coordinated_threshold: Threshold for coordinated activity
        """
        self.bot_threshold = bot_threshold
        self.coordinated_threshold = coordinated_threshold
    
    def detect(
        self,
        video_id: int,
        interactions: List[Interaction]
    ) -> tuple[float, List[str]]:
        """
        Detect engagement farming.
        
        Args:
            video_id: Video ID
            interactions: Interactions for this video
        
        Returns:
            (spam_score, suspicious_signals) tuple
        """
        if len(interactions) == 0:
            return 0.0, []
        
        suspicious_signals = []
        spam_score = 0.0
        
        # 1. Bot-like behavior
        if self._has_bot_pattern(interactions):
            suspicious_signals.append("bot_pattern")
            spam_score += 0.33
        
        # 2. Engagement farming
        if self._has_engagement_farming(interactions):
            suspicious_signals.append("engagement_farming")
            spam_score += 0.33
        
        # 3. Coordinated activity
        if self._has_coordinated_activity(interactions):
            suspicious_signals.append("coordinated")
            spam_score += 0.34
        
        return spam_score, suspicious_signals
    
    def _has_bot_pattern(self, interactions: List[Interaction]) -> bool:
        """Detect bot-like patterns."""
        # Check for unnatural patterns:
        # - All interactions are likes (no skips)
        # - All watch times are identical
        # - No variation in engagement
        
        if len(interactions) < 5:
            return False
        
        skip_rate = sum(1 for i in interactions if i.skip) / len(interactions)
        like_rate = sum(1 for i in interactions if i.like) / len(interactions)
        
        # Bot pattern: very low skip rate + very high like rate
        if skip_rate < 0.05 and like_rate > self.bot_threshold:
            return True
        
        # Check for identical watch times (suspicious)
        watch_times = [i.watch_time for i in interactions]
        if len(set(watch_times)) < len(watch_times) * 0.1:  # Less than 10% unique
            return True
        
        return False
    
    def _has_engagement_farming(self, interactions: List[Interaction]) -> bool:
        """Detect engagement farming."""
        # Engagement farming: high engagement but low diversity
        # - Many likes but no comments/shares
        # - All from same user segment
        
        if len(interactions) < 10:
            return False
        
        like_rate = sum(1 for i in interactions if i.like) / len(interactions)
        comment_rate = sum(1 for i in interactions if i.comment) / len(interactions)
        share_rate = sum(1 for i in interactions if i.share) / len(interactions)
        
        # High likes but no other engagement
        if like_rate > 0.8 and comment_rate < 0.1 and share_rate < 0.1:
            return True
        
        return False
    
    def _has_coordinated_activity(self, interactions: List[Interaction]) -> bool:
        """Detect coordinated activity."""
        # Coordinated: many interactions in short time window
        # from similar users
        
        if len(interactions) < self.coordinated_threshold:
            return False
        
        # Group by time windows
        time_windows = defaultdict(list)
        for interaction in interactions:
            window = interaction.timestamp // 3600  # 1-hour windows
            time_windows[window].append(interaction)
        
        # Check for bursts
        for window, window_interactions in time_windows.items():
            if len(window_interactions) >= self.coordinated_threshold:
                # Check user diversity
                users = set(i.user_id for i in window_interactions)
                if len(users) < len(window_interactions) * 0.5:  # Low diversity
                    return True
        
        return False


class LoopExploitationDetector:
    """Detects loop exploitation (repeated exposure to same content)."""
    
    def __init__(self, similarity_threshold: float = 0.8):
        """
        Initialize loop detector.
        
        Args:
            similarity_threshold: Similarity threshold for loop detection
        """
        self.similarity_threshold = similarity_threshold
    
    def detect(
        self,
        recent_interactions: List[Interaction],
        content_embeddings: Dict[int, np.ndarray]
    ) -> tuple[bool, Optional[str]]:
        """
        Detect loop exploitation.
        
        Args:
            recent_interactions: Recent interactions
            content_embeddings: Content embeddings dict
        
        Returns:
            (is_loop, reason) tuple
        """
        if len(recent_interactions) < 5:
            return False, None
        
        # Get content embeddings
        video_embeddings = []
        for interaction in recent_interactions[-20:]:  # Last 20
            if interaction.video_id in content_embeddings:
                video_embeddings.append(
                    content_embeddings[interaction.video_id]
                )
        
        if len(video_embeddings) < 5:
            return False, None
        
        # Compute pairwise similarities
        similarities = []
        for i in range(len(video_embeddings)):
            for j in range(i + 1, len(video_embeddings)):
                sim = np.dot(video_embeddings[i], video_embeddings[j]) / (
                    np.linalg.norm(video_embeddings[i]) *
                    np.linalg.norm(video_embeddings[j])
                )
                similarities.append(sim)
        
        # Check for high similarity cluster
        if len(similarities) > 0:
            mean_sim = np.mean(similarities)
            if mean_sim > self.similarity_threshold:
                return True, "high_similarity_loop"
        
        return False, None
    
    def enforce_temporal_diversity(
        self,
        candidates: List[RankingCandidate],
        recent_interactions: List[Interaction],
        content_embeddings: Dict[int, np.ndarray],
        min_similarity: float = 0.7
    ) -> List[RankingCandidate]:
        """
        Enforce temporal diversity in candidates.
        
        Args:
            candidates: Ranked candidates
            recent_interactions: Recent interactions
            content_embeddings: Content embeddings dict
        
        Returns:
            Filtered candidates with diversity
        """
        # Get recent video IDs
        recent_video_ids = set(i.video_id for i in recent_interactions[-20:])
        
        # Filter candidates
        filtered = []
        seen_embeddings = []
        
        for candidate in candidates:
            # Skip if recently seen
            if candidate.video_id in recent_video_ids:
                continue
            
            # Check similarity to recent content
            if candidate.video_id in content_embeddings:
                candidate_emb = content_embeddings[candidate.video_id]
                
                # Check similarity to seen candidates
                is_similar = False
                for seen_emb in seen_embeddings:
                    sim = np.dot(candidate_emb, seen_emb) / (
                        np.linalg.norm(candidate_emb) * np.linalg.norm(seen_emb)
                    )
                    if sim > min_similarity:
                        is_similar = True
                        break
                
                if not is_similar:
                    filtered.append(candidate)
                    seen_embeddings.append(candidate_emb)
            else:
                filtered.append(candidate)
        
        return filtered


class OverPersonalizationDetector:
    """Detects over-personalization."""
    
    def __init__(self, diversity_threshold: float = 0.3):
        """
        Initialize over-personalization detector.
        
        Args:
            diversity_threshold: Minimum diversity threshold
        """
        self.diversity_threshold = diversity_threshold
    
    def detect(
        self,
        feed_candidates: List[RankingCandidate],
        content_embeddings: Dict[int, np.ndarray]
    ) -> tuple[bool, float]:
        """
        Detect over-personalization.
        
        Args:
            feed_candidates: Feed candidates
            content_embeddings: Content embeddings dict
        
        Returns:
            (is_over_personalized, diversity_score) tuple
        """
        if len(feed_candidates) < 3:
            return False, 1.0
        
        # Get embeddings
        embeddings = []
        for candidate in feed_candidates:
            if candidate.video_id in content_embeddings:
                embeddings.append(content_embeddings[candidate.video_id])
        
        if len(embeddings) < 3:
            return False, 1.0
        
        # Compute pairwise similarities
        similarities = []
        for i in range(len(embeddings)):
            for j in range(i + 1, len(embeddings)):
                sim = np.dot(embeddings[i], embeddings[j]) / (
                    np.linalg.norm(embeddings[i]) * np.linalg.norm(embeddings[j])
                )
                similarities.append(sim)
        
        # Diversity = 1 - mean similarity
        mean_sim = np.mean(similarities) if similarities else 0.0
        diversity_score = 1.0 - mean_sim
        
        is_over_personalized = diversity_score < self.diversity_threshold
        
        return is_over_personalized, diversity_score
    
    def enforce_category_diversity(
        self,
        candidates: List[RankingCandidate],
        max_per_category: int = 3
    ) -> List[RankingCandidate]:
        """
        Enforce category diversity.
        
        Args:
            candidates: Ranked candidates
            max_per_category: Maximum candidates per category
        
        Returns:
            Filtered candidates with category diversity
        """
        category_counts = Counter()
        filtered = []
        
        for candidate in candidates:
            category = candidate.video_features.category
            
            if category is None:
                # No category, allow through
                filtered.append(candidate)
            else:
                if category_counts[category] < max_per_category:
                    filtered.append(candidate)
                    category_counts[category] += 1
        
        return filtered


class ContentHomogenizationDetector:
    """Detects content homogenization across platform."""
    
    def __init__(self, global_diversity_threshold: float = 0.2):
        """
        Initialize homogenization detector.
        
        Args:
            global_diversity_threshold: Minimum global diversity threshold
        """
        self.global_diversity_threshold = global_diversity_threshold
    
    def detect(
        self,
        all_feeds: Dict[int, List[RankingCandidate]],
        content_embeddings: Dict[int, np.ndarray]
    ) -> tuple[bool, float]:
        """
        Detect content homogenization.
        
        Args:
            all_feeds: Dict mapping user_id to their feed
            content_embeddings: Content embeddings dict
        
        Returns:
            (is_homogenized, diversity_score) tuple
        """
        # Collect all videos in feeds
        all_videos = set()
        for feed in all_feeds.values():
            for candidate in feed:
                all_videos.add(candidate.video_id)
        
        if len(all_videos) < 10:
            return False, 1.0
        
        # Get embeddings
        embeddings = []
        for video_id in list(all_videos)[:100]:  # Sample 100
            if video_id in content_embeddings:
                embeddings.append(content_embeddings[video_id])
        
        if len(embeddings) < 10:
            return False, 1.0
        
        # Compute pairwise similarities
        similarities = []
        for i in range(len(embeddings)):
            for j in range(i + 1, len(embeddings)):
                sim = np.dot(embeddings[i], embeddings[j]) / (
                    np.linalg.norm(embeddings[i]) * np.linalg.norm(embeddings[j])
                )
                similarities.append(sim)
        
        # Diversity = 1 - mean similarity
        mean_sim = np.mean(similarities) if similarities else 0.0
        diversity_score = 1.0 - mean_sim
        
        is_homogenized = diversity_score < self.global_diversity_threshold
        
        return is_homogenized, diversity_score


class FailureModeHandler:
    """Main handler for all failure modes."""
    
    def __init__(self):
        """Initialize failure mode handler."""
        self.engagement_detector = EngagementFarmingDetector()
        self.loop_detector = LoopExploitationDetector()
        self.over_personalization_detector = OverPersonalizationDetector()
        self.homogenization_detector = ContentHomogenizationDetector()
    
    def suppress_spam(
        self,
        candidates: List[RankingCandidate],
        video_interactions: Dict[int, List[Interaction]],
        penalty_factor: float = 0.5
    ) -> List[RankingCandidate]:
        """
        Suppress spam content in candidates.
        
        Args:
            candidates: Ranked candidates
            video_interactions: Dict mapping video_id to interactions
            penalty_factor: Penalty factor for spam
        
        Returns:
            Candidates with spam penalties applied
        """
        for candidate in candidates:
            video_id = candidate.video_id
            
            if video_id in video_interactions:
                interactions = video_interactions[video_id]
                spam_score, _ = self.engagement_detector.detect(video_id, interactions)
                
                if spam_score > 0.0:
                    # Apply penalty
                    candidate.ranking_score *= (1 - spam_score * penalty_factor)
        
        # Re-sort
        candidates.sort(key=lambda x: x.ranking_score, reverse=True)
        
        return candidates
    
    def enforce_diversity(
        self,
        candidates: List[RankingCandidate],
        user_history: List[Interaction],
        content_embeddings: Dict[int, np.ndarray]
    ) -> List[RankingCandidate]:
        """
        Enforce diversity constraints.
        
        Args:
            candidates: Ranked candidates
            user_history: User interaction history
            content_embeddings: Content embeddings dict
        
        Returns:
            Candidates with diversity enforced
        """
        # 1. Temporal diversity (avoid recent repeats)
        candidates = self.loop_detector.enforce_temporal_diversity(
            candidates, user_history, content_embeddings
        )
        
        # 2. Category diversity
        candidates = self.over_personalization_detector.enforce_category_diversity(
            candidates
        )
        
        return candidates
    
    def check_over_personalization(
        self,
        feed_candidates: List[RankingCandidate],
        content_embeddings: Dict[int, np.ndarray]
    ) -> tuple[bool, float]:
        """Check for over-personalization."""
        return self.over_personalization_detector.detect(
            feed_candidates, content_embeddings
        )
    
    def check_homogenization(
        self,
        all_feeds: Dict[int, List[RankingCandidate]],
        content_embeddings: Dict[int, np.ndarray]
    ) -> tuple[bool, float]:
        """Check for content homogenization."""
        return self.homogenization_detector.detect(all_feeds, content_embeddings)




