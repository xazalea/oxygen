"""
Cold start and virality engine.

Handles new video exposure, performance normalization, and viral expansion.
"""

import numpy as np
import random
from typing import List, Dict, Optional, Set
from collections import defaultdict

from lib.data.schemas import Interaction, VideoFeatures


class ColdStartEngine:
    """Handles cold start for new videos."""
    
    def __init__(
        self,
        initial_cohort_size: int = 500,
        expansion_threshold: float = 1.2,
        expansion_factor: float = 2.0,
        decay_factor: float = 0.9
    ):
        """
        Initialize cold start engine.
        
        Args:
            initial_cohort_size: Size of initial random cohort
            expansion_threshold: Performance threshold for expansion
            expansion_factor: Multiplicative factor for expansion
            decay_factor: Decay factor for underperforming videos
        """
        self.initial_cohort_size = initial_cohort_size
        self.expansion_threshold = expansion_threshold
        self.expansion_factor = expansion_factor
        self.decay_factor = decay_factor
        
        # Track video states
        self.video_states: Dict[int, Dict] = {}
        self.cohort_baselines: Dict[int, Dict] = {}  # cohort_id -> baseline metrics
    
    def initial_exposure(
        self,
        video_id: int,
        user_pool: List[int],
        cohort_id: Optional[int] = None
    ) -> List[int]:
        """
        Select initial cohort for new video.
        
        Args:
            video_id: New video ID
            user_pool: Pool of available users
            cohort_id: Optional cohort ID (for tracking)
        
        Returns:
            List of user IDs in initial cohort
        """
        # Select random cohort
        cohort_size = random.randint(
            self.initial_cohort_size // 2,
            self.initial_cohort_size * 2
        )
        cohort = random.sample(user_pool, min(cohort_size, len(user_pool)))
        
        # Initialize video state
        if cohort_id is None:
            cohort_id = hash((video_id, len(self.video_states)))
        
        self.video_states[video_id] = {
            "cohort_id": cohort_id,
            "cohort": cohort,
            "exposure_count": len(cohort),
            "interactions": [],
            "performance_score": 0.0,
            "stage": "initial"
        }
        
        # Initialize cohort baseline if needed
        if cohort_id not in self.cohort_baselines:
            self.cohort_baselines[cohort_id] = {
                "watch_time_avg": 0.5,  # Default baseline
                "completion_rate": 0.3,
                "skip_rate": 0.4
            }
        
        return cohort
    
    def normalize_performance(
        self,
        video_id: int,
        interactions: List[Interaction]
    ) -> float:
        """
        Normalize video performance against cohort baseline.
        
        Args:
            video_id: Video ID
            interactions: Interactions from initial exposure
        
        Returns:
            Normalized performance score
        """
        if video_id not in self.video_states:
            return 0.0
        
        state = self.video_states[video_id]
        cohort_id = state["cohort_id"]
        baseline = self.cohort_baselines[cohort_id]
        
        # Compute metrics from interactions
        if len(interactions) == 0:
            return 0.0
        
        watch_times = [i.watch_time for i in interactions]
        completion_rates = [i.completion_rate for i in interactions]
        skip_rates = [1.0 if i.skip else 0.0 for i in interactions]
        
        avg_watch_time = np.mean(watch_times)
        avg_completion = np.mean(completion_rates)
        avg_skip = np.mean(skip_rates)
        
        # Normalize against baseline
        normalized_watch_time = (
            avg_watch_time / baseline["watch_time_avg"]
            if baseline["watch_time_avg"] > 0 else 0.0
        )
        normalized_completion = (
            avg_completion / baseline["completion_rate"]
            if baseline["completion_rate"] > 0 else 0.0
        )
        normalized_skip = (
            avg_skip / baseline["skip_rate"]
            if baseline["skip_rate"] > 0 else 1.0
        )
        
        # Compute performance score
        performance_score = (
            normalized_watch_time * 0.4 +
            normalized_completion * 0.4 -
            normalized_skip * 0.2
        )
        
        # Update state
        state["performance_score"] = performance_score
        state["interactions"] = interactions
        
        return performance_score
    
    def viral_expansion(
        self,
        video_id: int,
        user_pool: List[int],
        user_similarity_map: Optional[Dict[int, List[int]]] = None
    ) -> List[int]:
        """
        Expand exposure for viral videos.
        
        Args:
            video_id: Video ID
            user_pool: Pool of available users
            user_similarity_map: Optional map of user_id -> similar user IDs
        
        Returns:
            List of new user IDs for expansion
        """
        if video_id not in self.video_states:
            return []
        
        state = self.video_states[video_id]
        performance_score = state["performance_score"]
        current_exposure = state["exposure_count"]
        
        if performance_score > self.expansion_threshold:
            # Exponential growth
            next_exposure = int(current_exposure * self.expansion_factor)
            new_exposures = next_exposure - current_exposure
            
            # Select users
            if user_similarity_map is not None:
                # Select similar to engaged users
                engaged_users = [
                    i.user_id for i in state["interactions"]
                    if i.watch_time > 0.5 and not i.skip
                ]
                
                if len(engaged_users) > 0:
                    # Get similar users
                    similar_users = set()
                    for engaged_user in engaged_users[:10]:  # Top 10 engaged
                        if engaged_user in user_similarity_map:
                            similar_users.update(
                                user_similarity_map[engaged_user][:20]
                            )
                    
                    # Filter to available users
                    available = [
                        u for u in similar_users
                        if u in user_pool and u not in state.get("exposed_users", set())
                    ]
                    
                    new_users = available[:new_exposures]
                else:
                    # Fallback to random
                    new_users = random.sample(
                        user_pool,
                        min(new_exposures, len(user_pool))
                    )
            else:
                # Random selection
                new_users = random.sample(
                    user_pool,
                    min(new_exposures, len(user_pool))
                )
            
            # Update state
            state["exposure_count"] = next_exposure
            state["stage"] = "expanding"
            if "exposed_users" not in state:
                state["exposed_users"] = set(state["cohort"])
            state["exposed_users"].update(new_users)
            
            return new_users
        else:
            # Decay exposure
            state["exposure_count"] = int(current_exposure * self.decay_factor)
            state["stage"] = "decaying"
            return []
    
    def get_video_state(self, video_id: int) -> Optional[Dict]:
        """Get current state of video."""
        return self.video_states.get(video_id)
    
    def update_cohort_baseline(
        self,
        cohort_id: int,
        watch_time_avg: float,
        completion_rate: float,
        skip_rate: float
    ):
        """Update cohort baseline metrics."""
        self.cohort_baselines[cohort_id] = {
            "watch_time_avg": watch_time_avg,
            "completion_rate": completion_rate,
            "skip_rate": skip_rate
        }


class ViralityEngine:
    """Manages viral content distribution."""
    
    def __init__(self, cold_start_engine: ColdStartEngine):
        """
        Initialize virality engine.
        
        Args:
            cold_start_engine: Cold start engine instance
        """
        self.cold_start_engine = cold_start_engine
    
    def process_new_video(
        self,
        video_id: int,
        video_features: VideoFeatures,
        user_pool: List[int]
    ) -> List[int]:
        """
        Process a new video through cold start pipeline.
        
        Args:
            video_id: New video ID
            video_features: Video features
            user_pool: Pool of available users
        
        Returns:
            List of user IDs for initial exposure
        """
        # Initial exposure
        cohort = self.cold_start_engine.initial_exposure(
            video_id, user_pool
        )
        
        # Update video features
        video_features.exposure_count = len(cohort)
        video_features.viral_expansion_factor = 1.0
        
        return cohort
    
    def update_from_interactions(
        self,
        video_id: int,
        interactions: List[Interaction],
        user_pool: List[int],
        user_similarity_map: Optional[Dict[int, List[int]]] = None
    ) -> List[int]:
        """
        Update viral expansion based on interactions.
        
        Args:
            video_id: Video ID
            interactions: New interactions
            user_pool: Pool of available users
            user_similarity_map: Optional user similarity map
        
        Returns:
            List of new user IDs for expansion (empty if no expansion)
        """
        # Normalize performance
        performance_score = self.cold_start_engine.normalize_performance(
            video_id, interactions
        )
        
        # Update video features
        state = self.cold_start_engine.get_video_state(video_id)
        if state:
            # Update expansion factor
            if performance_score > self.cold_start_engine.expansion_threshold:
                expansion_factor = state.get("viral_expansion_factor", 1.0)
                expansion_factor *= self.cold_start_engine.expansion_factor
                state["viral_expansion_factor"] = expansion_factor
        
        # Viral expansion
        new_users = self.cold_start_engine.viral_expansion(
            video_id, user_pool, user_similarity_map
        )
        
        return new_users



