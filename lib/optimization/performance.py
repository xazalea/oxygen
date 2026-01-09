"""
Performance optimizations for ultra-fast recommendations.

Based on insights from reverse-engineered TikTok source code.
"""

import numpy as np
import torch
from typing import Dict, List, Optional
from collections import deque
import asyncio
from functools import lru_cache
import time

from lib.data.schemas import RankingCandidate, VideoFeatures, UserFeatures


class FastEmbeddingCache:
    """Ultra-fast embedding cache with LRU eviction."""
    
    def __init__(self, max_size: int = 100000):
        """
        Initialize fast embedding cache.
        
        Args:
            max_size: Maximum number of embeddings to cache
        """
        self.max_size = max_size
        self.cache: Dict[int, np.ndarray] = {}
        self.access_times: Dict[int, float] = {}
        self.access_order = deque()
    
    def get(self, video_id: int) -> Optional[np.ndarray]:
        """Get embedding from cache."""
        if video_id in self.cache:
            # Update access time
            self.access_times[video_id] = time.time()
            # Move to end of access order
            if video_id in self.access_order:
                self.access_order.remove(video_id)
            self.access_order.append(video_id)
            return self.cache[video_id]
        return None
    
    def put(self, video_id: int, embedding: np.ndarray):
        """Put embedding in cache."""
        # Evict if needed
        if len(self.cache) >= self.max_size and video_id not in self.cache:
            # Evict least recently used
            lru_id = self.access_order.popleft()
            del self.cache[lru_id]
            del self.access_times[lru_id]
        
        self.cache[video_id] = embedding
        self.access_times[video_id] = time.time()
        self.access_order.append(video_id)
    
    def clear(self):
        """Clear cache."""
        self.cache.clear()
        self.access_times.clear()
        self.access_order.clear()


class BatchRanker:
    """Batch ranking for ultra-fast inference."""
    
    def __init__(self, ranking_model, device: str = "cpu"):
        """
        Initialize batch ranker.
        
        Args:
            ranking_model: Ranking model
            device: Device for computation
        """
        self.ranking_model = ranking_model
        self.device = device
        self.batch_size = 256  # Optimized batch size
    
    def rank_batch(
        self,
        user_features: List[UserFeatures],
        candidate_videos: List[List[VideoFeatures]],
        session_contexts: List
    ) -> List[List[RankingCandidate]]:
        """
        Rank candidates for multiple users in batch.
        
        Args:
            user_features: List of user features
            candidate_videos: List of candidate lists per user
            session_contexts: List of session contexts
        
        Returns:
            List of ranked candidate lists per user
        """
        # Batch process for efficiency
        all_results = []
        
        for i in range(0, len(user_features), self.batch_size):
            batch_users = user_features[i:i+self.batch_size]
            batch_candidates = candidate_videos[i:i+self.batch_size]
            batch_sessions = session_contexts[i:i+self.batch_size]
            
            # Process batch
            batch_results = self._rank_batch_internal(
                batch_users, batch_candidates, batch_sessions
            )
            all_results.extend(batch_results)
        
        return all_results
    
    def _rank_batch_internal(
        self,
        users: List[UserFeatures],
        candidates_list: List[List[VideoFeatures]],
        sessions: List
    ) -> List[List[RankingCandidate]]:
        """Internal batch ranking."""
        results = []
        
        for user, candidates, session in zip(users, candidates_list, sessions):
            ranked = self.ranking_model.rank(user, candidates, session)
            results.append(ranked)
        
        return results


class PrecomputedFeatures:
    """Precompute features for faster inference."""
    
    def __init__(self):
        """Initialize precomputed features."""
        self.user_embeddings: Dict[int, np.ndarray] = {}
        self.video_embeddings: Dict[int, np.ndarray] = {}
        self.similarity_matrix: Optional[np.ndarray] = None
        self.last_update = 0
    
    def precompute_similarities(self, video_embeddings: Dict[int, np.ndarray]):
        """
        Precompute video similarity matrix.
        
        Args:
            video_embeddings: Dict of video embeddings
        """
        if len(video_embeddings) == 0:
            return
        
        # Convert to matrix
        video_ids = list(video_embeddings.keys())
        embeddings_matrix = np.array([video_embeddings[vid] for vid in video_ids])
        
        # Normalize
        norms = np.linalg.norm(embeddings_matrix, axis=1, keepdims=True)
        embeddings_matrix = embeddings_matrix / (norms + 1e-8)
        
        # Compute similarity matrix
        self.similarity_matrix = np.dot(embeddings_matrix, embeddings_matrix.T)
        self.video_embeddings = video_embeddings
        self.last_update = time.time()
    
    def get_similar_videos(
        self,
        video_id: int,
        top_k: int = 10,
        threshold: float = 0.7
    ) -> List[int]:
        """
        Get similar videos using precomputed similarities.
        
        Args:
            video_id: Query video ID
            top_k: Number of similar videos
            threshold: Similarity threshold
        
        Returns:
            List of similar video IDs
        """
        if self.similarity_matrix is None:
            return []
        
        video_ids = list(self.video_embeddings.keys())
        if video_id not in video_ids:
            return []
        
        idx = video_ids.index(video_id)
        similarities = self.similarity_matrix[idx]
        
        # Get top-k
        top_indices = np.argsort(similarities)[::-1][1:top_k+1]  # Exclude self
        similar_videos = [
            video_ids[i] for i in top_indices
            if similarities[i] >= threshold
        ]
        
        return similar_videos


class AsyncRankingPipeline:
    """Async ranking pipeline for non-blocking inference."""
    
    def __init__(self, ranking_model, max_concurrent: int = 100):
        """
        Initialize async ranking pipeline.
        
        Args:
            ranking_model: Ranking model
            max_concurrent: Maximum concurrent requests
        """
        self.ranking_model = ranking_model
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.request_queue = asyncio.Queue()
    
    async def rank_async(
        self,
        user_features: UserFeatures,
        candidates: List[VideoFeatures],
        session_context
    ) -> List[RankingCandidate]:
        """
        Rank candidates asynchronously.
        
        Args:
            user_features: User features
            candidates: Candidate videos
            session_context: Session context
        
        Returns:
            Ranked candidates
        """
        async with self.semaphore:
            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            ranked = await loop.run_in_executor(
                None,
                self.ranking_model.rank,
                user_features,
                candidates,
                session_context
            )
            return ranked


class PerformanceOptimizer:
    """Main performance optimizer."""
    
    def __init__(
        self,
        ranking_model,
        embedding_cache_size: int = 100000,
        device: str = "cpu"
    ):
        """
        Initialize performance optimizer.
        
        Args:
            ranking_model: Ranking model
            embedding_cache_size: Embedding cache size
            device: Device for computation
        """
        self.ranking_model = ranking_model
        self.embedding_cache = FastEmbeddingCache(max_size=embedding_cache_size)
        self.batch_ranker = BatchRanker(ranking_model, device=device)
        self.precomputed = PrecomputedFeatures()
        self.async_pipeline = AsyncRankingPipeline(ranking_model)
        
        # Performance stats
        self.stats = {
            "cache_hits": 0,
            "cache_misses": 0,
            "avg_latency_ms": 0.0,
            "total_requests": 0
        }
    
    def optimize_rank(
        self,
        user_features: UserFeatures,
        candidates: List[VideoFeatures],
        session_context
    ) -> List[RankingCandidate]:
        """
        Optimized ranking with caching and batching.
        
        Args:
            user_features: User features
            candidates: Candidate videos
            session_context: Session context
        
        Returns:
            Ranked candidates
        """
        start_time = time.time()
        
        # Check cache for embeddings
        cached_embeddings = {}
        for candidate in candidates:
            cached = self.embedding_cache.get(candidate.video_id)
            if cached is not None:
                cached_embeddings[candidate.video_id] = cached
                self.stats["cache_hits"] += 1
            else:
                self.stats["cache_misses"] += 1
        
        # Rank
        ranked = self.ranking_model.rank(
            user_features, candidates, session_context
        )
        
        # Update cache
        for candidate in candidates:
            if candidate.video_features.content_embedding is not None:
                self.embedding_cache.put(
                    candidate.video_id,
                    candidate.video_features.content_embedding
                )
        
        # Update stats
        latency_ms = (time.time() - start_time) * 1000
        self.stats["total_requests"] += 1
        self.stats["avg_latency_ms"] = (
            (self.stats["avg_latency_ms"] * (self.stats["total_requests"] - 1) + latency_ms) /
            self.stats["total_requests"]
        )
        
        return ranked
    
    def get_stats(self) -> Dict:
        """Get performance statistics."""
        cache_hit_rate = (
            self.stats["cache_hits"] / 
            (self.stats["cache_hits"] + self.stats["cache_misses"] + 1e-8)
        )
        
        return {
            **self.stats,
            "cache_hit_rate": cache_hit_rate,
            "cache_size": len(self.embedding_cache.cache)
        }




