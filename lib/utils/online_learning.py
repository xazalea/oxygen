"""
Online learning and feedback loop mechanisms.

Handles real-time updates and batch retraining.
"""

import numpy as np
import torch
import torch.nn as nn
from typing import List, Dict, Optional, Deque
from collections import deque
from datetime import datetime, timedelta

from lib.data.schemas import Interaction, UserFeatures, VideoFeatures
from lib.models.user_representation import ShortTermInterest
from lib.ranking.multi_objective_ranker import MultiObjectiveRanker


class RealTimeUpdater:
    """Handles real-time updates to embeddings and models."""
    
    def __init__(
        self,
        short_term_updater: ShortTermInterest,
        embedding_table: Dict[int, Dict[str, np.ndarray]]
    ):
        """
        Initialize real-time updater.
        
        Args:
            short_term_updater: Short-term interest updater
            embedding_table: Embedding storage (user_id -> embeddings)
        """
        self.short_term_updater = short_term_updater
        self.embedding_table = embedding_table
        
        # Track update frequencies
        self.video_update_counts: Dict[int, int] = {}
        self.video_update_threshold = 10  # Update every 10 interactions
    
    def update_from_interaction(
        self,
        interaction: Interaction,
        content_embedding: np.ndarray
    ):
        """
        Update embeddings from interaction.
        
        Args:
            interaction: New interaction
            content_embedding: Content embedding of interacted video
        """
        user_id = interaction.user_id
        video_id = interaction.video_id
        
        # Update user short-term embedding
        if user_id not in self.embedding_table:
            self.embedding_table[user_id] = {
                "short_term": None,
                "mid_term": None,
                "long_term": None
            }
        
        current_short_term = self.embedding_table[user_id].get("short_term")
        
        new_short_term = self.short_term_updater.update(
            user_id,
            interaction,
            content_embedding,
            current_short_term
        )
        
        self.embedding_table[user_id]["short_term"] = new_short_term
        
        # Update video embedding (aggregated)
        self._update_video_embedding(video_id, interaction, content_embedding)
    
    def _update_video_embedding(
        self,
        video_id: int,
        interaction: Interaction,
        content_embedding: np.ndarray
    ):
        """Update video interaction embedding (aggregated)."""
        # Track update count
        if video_id not in self.video_update_counts:
            self.video_update_counts[video_id] = 0
        
        self.video_update_counts[video_id] += 1
        
        # Update every N interactions
        if self.video_update_counts[video_id] >= self.video_update_threshold:
            # In practice, update video interaction embedding
            # For now, just reset counter
            self.video_update_counts[video_id] = 0


class IncrementalModelUpdater:
    """Handles incremental model updates."""
    
    def __init__(
        self,
        ranking_model: MultiObjectiveRanker,
        learning_rate: float = 0.001,
        batch_size: int = 1024
    ):
        """
        Initialize incremental updater.
        
        Args:
            ranking_model: Ranking model to update
            learning_rate: Learning rate for updates
            batch_size: Batch size for updates
        """
        self.ranking_model = ranking_model
        self.learning_rate = learning_rate
        self.batch_size = batch_size
        
        # Buffer for interactions
        self.interaction_buffer: Deque[Interaction] = deque(maxlen=10000)
    
    def add_interaction(self, interaction: Interaction):
        """Add interaction to buffer."""
        self.interaction_buffer.append(interaction)
    
    def incremental_update(
        self,
        content_embeddings: Dict[int, np.ndarray],
        user_embeddings: Dict[int, UserFeatures]
    ):
        """
        Perform incremental model update.
        
        Args:
            content_embeddings: Content embeddings dict
            user_embeddings: User embeddings dict
        """
        if len(self.interaction_buffer) < self.batch_size:
            return
        
        # Sample batch
        batch = list(self.interaction_buffer)[-self.batch_size:]
        
        # In practice, compute gradients and update model
        # For now, this is a placeholder structure
        
        # Set model to train mode
        self.ranking_model.train_mode()
        
        # Compute loss and update (simplified)
        # loss = compute_loss(batch, content_embeddings, user_embeddings)
        # loss.backward()
        # optimizer.step()
        
        # Set back to eval mode
        self.ranking_model.eval()
        
        # Clear buffer
        self.interaction_buffer.clear()


class BatchRetrainer:
    """Handles batch retraining of models."""
    
    def __init__(
        self,
        ranking_model: MultiObjectiveRanker,
        train_data: List[Interaction],
        val_data: List[Interaction]
    ):
        """
        Initialize batch retrainer.
        
        Args:
            ranking_model: Ranking model to retrain
            train_data: Training interactions
            val_data: Validation interactions
        """
        self.ranking_model = ranking_model
        self.train_data = train_data
        self.val_data = val_data
    
    def retrain_ranking_model(
        self,
        epochs: int = 10,
        batch_size: int = 1024,
        learning_rate: float = 0.001
    ):
        """
        Retrain ranking model on accumulated data.
        
        Args:
            epochs: Number of training epochs
            batch_size: Batch size
            learning_rate: Learning rate
        """
        # In practice, implement full training loop
        # For now, this is a placeholder structure
        
        self.ranking_model.train_mode()
        
        # Create data loaders
        # train_loader = create_data_loader(self.train_data, batch_size)
        # val_loader = create_data_loader(self.val_data, batch_size)
        
        # Training loop
        for epoch in range(epochs):
            # for batch in train_loader:
            #     loss = compute_loss(batch)
            #     loss.backward()
            #     optimizer.step()
            pass
        
        # Validation
        # val_loss = evaluate(val_loader)
        
        self.ranking_model.eval()


class FeedbackLoopStabilizer:
    """Stabilizes feedback loops to prevent content homogenization."""
    
    def __init__(
        self,
        diversity_threshold: float = 0.3,
        min_content_similarity: float = 0.7
    ):
        """
        Initialize feedback loop stabilizer.
        
        Args:
            diversity_threshold: Minimum diversity threshold
            min_content_similarity: Minimum similarity for filtering
        """
        self.diversity_threshold = diversity_threshold
        self.min_content_similarity = min_content_similarity
    
    def stabilize(
        self,
        candidates: List,
        user_history: List[Interaction],
        content_embeddings: Dict[int, np.ndarray]
    ) -> List:
        """
        Stabilize feedback loops.
        
        Args:
            candidates: Ranked candidates
            user_history: User interaction history
            content_embeddings: Content embeddings dict
        
        Returns:
            Stabilized candidates
        """
        # 1. Diversity constraint
        diverse_candidates = self._enforce_diversity(
            candidates, content_embeddings
        )
        
        # 2. Temporal diversity (avoid recent repeats)
        filtered = self._filter_recent_repeats(
            diverse_candidates, user_history
        )
        
        # 3. Category diversity
        balanced = self._balance_categories(filtered)
        
        return balanced
    
    def _enforce_diversity(
        self,
        candidates: List,
        content_embeddings: Dict[int, np.ndarray]
    ) -> List:
        """Enforce content diversity."""
        filtered = []
        seen_embeddings = []
        
        for candidate in candidates:
            video_id = candidate.video_id if hasattr(candidate, 'video_id') else None
            
            if video_id and video_id in content_embeddings:
                candidate_emb = content_embeddings[video_id]
                
                # Check similarity to seen
                is_similar = False
                for seen_emb in seen_embeddings:
                    sim = np.dot(candidate_emb, seen_emb) / (
                        np.linalg.norm(candidate_emb) * np.linalg.norm(seen_emb)
                    )
                    if sim > self.min_content_similarity:
                        is_similar = True
                        break
                
                if not is_similar:
                    filtered.append(candidate)
                    seen_embeddings.append(candidate_emb)
            else:
                filtered.append(candidate)
        
        return filtered
    
    def _filter_recent_repeats(
        self,
        candidates: List,
        user_history: List[Interaction]
    ) -> List:
        """Filter recent repeats."""
        recent_video_ids = set(i.video_id for i in user_history[-20:])
        
        filtered = [
            c for c in candidates
            if not (hasattr(c, 'video_id') and c.video_id in recent_video_ids)
        ]
        
        return filtered
    
    def _balance_categories(self, candidates: List, max_per_category: int = 3) -> List:
        """Balance categories."""
        from collections import Counter
        category_counts = Counter()
        filtered = []
        
        for candidate in candidates:
            category = None
            if hasattr(candidate, 'video_features'):
                category = candidate.video_features.category
            elif hasattr(candidate, 'category'):
                category = candidate.category
            
            if category is None:
                filtered.append(candidate)
            else:
                if category_counts[category] < max_per_category:
                    filtered.append(candidate)
                    category_counts[category] += 1
        
        return filtered


class OnlineLearningManager:
    """Manages all online learning components."""
    
    def __init__(
        self,
        ranking_model: MultiObjectiveRanker,
        embedding_table: Dict[int, Dict[str, np.ndarray]],
        train_data: List[Interaction],
        val_data: List[Interaction]
    ):
        """
        Initialize online learning manager.
        
        Args:
            ranking_model: Ranking model
            embedding_table: Embedding storage
            train_data: Training data
            val_data: Validation data
        """
        short_term_updater = ShortTermInterest()
        
        self.real_time_updater = RealTimeUpdater(
            short_term_updater, embedding_table
        )
        self.incremental_updater = IncrementalModelUpdater(ranking_model)
        self.batch_retrainer = BatchRetrainer(
            ranking_model, train_data, val_data
        )
        self.stabilizer = FeedbackLoopStabilizer()
    
    def process_interaction(
        self,
        interaction: Interaction,
        content_embedding: np.ndarray
    ):
        """
        Process interaction for real-time updates.
        
        Args:
            interaction: New interaction
            content_embedding: Content embedding
        """
        # Real-time embedding update
        self.real_time_updater.update_from_interaction(
            interaction, content_embedding
        )
        
        # Add to incremental update buffer
        self.incremental_updater.add_interaction(interaction)
    
    def hourly_update(
        self,
        content_embeddings: Dict[int, np.ndarray],
        user_embeddings: Dict[int, UserFeatures]
    ):
        """
        Perform hourly incremental update.
        
        Args:
            content_embeddings: Content embeddings dict
            user_embeddings: User embeddings dict
        """
        self.incremental_updater.incremental_update(
            content_embeddings, user_embeddings
        )
    
    def daily_retrain(self):
        """Perform daily batch retraining."""
        self.batch_retrainer.retrain_ranking_model(epochs=10)
    
    def stabilize_feed(
        self,
        candidates: List,
        user_history: List[Interaction],
        content_embeddings: Dict[int, np.ndarray]
    ) -> List:
        """
        Stabilize feed to prevent feedback loops.
        
        Args:
            candidates: Ranked candidates
            user_history: User history
            content_embeddings: Content embeddings dict
        
        Returns:
            Stabilized candidates
        """
        return self.stabilizer.stabilize(
            candidates, user_history, content_embeddings
        )



