"""
User representation with temporal interest vectors.

Implements short-term, mid-term, and long-term user embeddings.
"""

import numpy as np
import torch
import torch.nn as nn
from typing import List, Optional, Dict
from collections import deque

from lib.data.schemas import Interaction, UserFeatures


class ShortTermInterest:
    """Short-term user interest (minutes scale)."""
    
    def __init__(self, embedding_dim: int = 128, decay_factor: float = 0.9):
        """
        Initialize short-term interest tracker.
        
        Args:
            embedding_dim: Dimension of embedding
            decay_factor: Exponential decay per interaction
        """
        self.embedding_dim = embedding_dim
        self.decay_factor = decay_factor
        self.learning_rate = 0.01
    
    def update(
        self,
        user_id: int,
        interaction: Interaction,
        content_embedding: np.ndarray,
        current_embedding: Optional[np.ndarray] = None
    ) -> np.ndarray:
        """
        Update short-term interest from interaction.
        
        Args:
            user_id: User ID
            interaction: Latest interaction
            content_embedding: Content embedding of interacted video [768]
            current_embedding: Current short-term embedding [128] or None
        
        Returns:
            Updated short-term embedding [128]
        """
        # Project content embedding to short-term dimension
        if current_embedding is None:
            # Initialize from content embedding (projected)
            current_embedding = np.random.randn(self.embedding_dim).astype(np.float32)
            current_embedding = current_embedding / np.linalg.norm(current_embedding)
        
        # Compute engagement signal
        engagement = (
            interaction.watch_time * (1 - interaction.skip) +
            interaction.like * 0.3 +
            interaction.share * 0.5 +
            interaction.comment * 0.2
        )
        
        # Project content embedding to short-term space
        # In practice, use learned projection matrix
        # For now, use simple dimensionality reduction
        content_proj = content_embedding[:self.embedding_dim]  # Simple truncation
        
        # Weighted update
        gradient = engagement * content_proj
        new_embedding = (
            self.decay_factor * current_embedding +
            (1 - self.decay_factor) * gradient
        )
        
        # Normalize
        norm = np.linalg.norm(new_embedding)
        if norm > 0:
            new_embedding = new_embedding / norm
        
        return new_embedding.astype(np.float32)


class MidTermInterest:
    """Mid-term user interest (days scale)."""
    
    def __init__(self, embedding_dim: int = 256, sequence_model_dim: int = 256):
        """
        Initialize mid-term interest model.
        
        Args:
            embedding_dim: Dimension of embedding
            sequence_model_dim: Hidden dimension of sequence model
        """
        self.embedding_dim = embedding_dim
        self.sequence_model_dim = sequence_model_dim
        
        # GRU for sequence modeling
        self.gru = nn.GRU(
            input_size=768,  # Content embedding dimension
            hidden_size=sequence_model_dim,
            num_layers=2,
            batch_first=True,
            bidirectional=False
        )
        
        # Attention pooling
        self.attention = nn.Sequential(
            nn.Linear(sequence_model_dim, sequence_model_dim),
            nn.Tanh(),
            nn.Linear(sequence_model_dim, 1)
        )
        
        # Projection to mid-term embedding
        self.projection = nn.Linear(sequence_model_dim, embedding_dim)
    
    def compute(
        self,
        interactions: List[Interaction],
        content_embeddings: Dict[int, np.ndarray]
    ) -> np.ndarray:
        """
        Compute mid-term interest from interaction sequence.
        
        Args:
            interactions: List of interactions (last 7 days)
            content_embeddings: Dict mapping video_id to content embedding
        
        Returns:
            Mid-term embedding [256]
        """
        if len(interactions) == 0:
            return np.random.randn(self.embedding_dim).astype(np.float32)
        
        # Sort by timestamp
        interactions = sorted(interactions, key=lambda x: x.timestamp)
        
        # Extract content embeddings and weights
        sequence = []
        weights = []
        
        for interaction in interactions:
            if interaction.video_id in content_embeddings:
                content_emb = content_embeddings[interaction.video_id]
                sequence.append(content_emb)
                
                # Weight by engagement
                weight = (
                    interaction.watch_time * (1 - interaction.skip) +
                    interaction.like * 0.3 +
                    interaction.share * 0.5
                )
                weights.append(weight)
        
        if len(sequence) == 0:
            return np.random.randn(self.embedding_dim).astype(np.float32)
        
        # Convert to tensor
        sequence_tensor = torch.from_numpy(np.array(sequence)).float()  # [T, 768]
        sequence_tensor = sequence_tensor.unsqueeze(0)  # [1, T, 768]
        
        # Apply weights
        weights_tensor = torch.from_numpy(np.array(weights)).float()  # [T]
        weights_tensor = weights_tensor.unsqueeze(0).unsqueeze(-1)  # [1, T, 1]
        sequence_tensor = sequence_tensor * weights_tensor
        
        # GRU encoding
        hidden_states, _ = self.gru(sequence_tensor)  # [1, T, 256]
        hidden_states = hidden_states.squeeze(0)  # [T, 256]
        
        # Attention pooling
        attention_weights = self.attention(hidden_states)  # [T, 1]
        attention_weights = torch.softmax(attention_weights, dim=0)
        aggregated = (hidden_states * attention_weights).sum(dim=0)  # [256]
        
        # Project to mid-term embedding
        mid_term_emb = self.projection(aggregated)  # [256]
        
        # Convert to numpy
        mid_term_emb = mid_term_emb.detach().numpy()
        
        # Normalize
        norm = np.linalg.norm(mid_term_emb)
        if norm > 0:
            mid_term_emb = mid_term_emb / norm
        
        return mid_term_emb.astype(np.float32)


class LongTermInterest:
    """Long-term user interest (weeks scale)."""
    
    def __init__(self, embedding_dim: int = 512, num_topics: int = 50):
        """
        Initialize long-term interest model.
        
        Args:
            embedding_dim: Dimension of embedding
            num_topics: Number of topics for topic modeling
        """
        self.embedding_dim = embedding_dim
        self.num_topics = num_topics
        
        # Topic model (simplified - in practice use LDA or neural topic model)
        self.topic_embeddings = nn.Parameter(
            torch.randn(num_topics, embedding_dim)
        )
    
    def compute(
        self,
        interactions: List[Interaction],
        content_embeddings: Dict[int, np.ndarray]
    ) -> np.ndarray:
        """
        Compute long-term interest from historical interactions.
        
        Args:
            interactions: List of interactions (last 4-8 weeks)
            content_embeddings: Dict mapping video_id to content embedding
        
        Returns:
            Long-term embedding [512]
        """
        if len(interactions) == 0:
            return np.random.randn(self.embedding_dim).astype(np.float32)
        
        # Aggregate interactions by category/topic
        # In practice, use learned topic model
        # For now, use simple clustering
        
        # Collect content embeddings
        content_embs = []
        weights = []
        
        for interaction in interactions:
            if interaction.video_id in content_embeddings:
                content_emb = content_embeddings[interaction.video_id]
                content_embs.append(content_emb)
                
                # Weight by engagement and recency
                recency_weight = 1.0  # In practice, decay by time
                engagement = (
                    interaction.watch_time * (1 - interaction.skip) +
                    interaction.like * 0.3
                )
                weights.append(engagement * recency_weight)
        
        if len(content_embs) == 0:
            return np.random.randn(self.embedding_dim).astype(np.float32)
        
        # Compute topic distribution (simplified)
        content_embs_tensor = torch.from_numpy(np.array(content_embs)).float()  # [N, 768]
        weights_tensor = torch.from_numpy(np.array(weights)).float()  # [N]
        
        # Project to topic space
        # In practice, use learned topic model
        # For now, use simple similarity to topic embeddings
        topic_embs_proj = self.topic_embeddings  # [50, 512]
        
        # Compute similarities (after projection)
        # Project content embeddings to 512
        content_proj = nn.Linear(768, 512)(content_embs_tensor)  # [N, 512]
        
        # Compute topic distribution
        similarities = torch.matmul(content_proj, topic_embs_proj.T)  # [N, 50]
        topic_weights = torch.softmax(similarities, dim=-1)  # [N, 50]
        
        # Weight by engagement
        weighted_topic_weights = topic_weights * weights_tensor.unsqueeze(-1)  # [N, 50]
        topic_distribution = weighted_topic_weights.sum(dim=0)  # [50]
        topic_distribution = topic_distribution / topic_distribution.sum()
        
        # Compute long-term embedding as weighted combination of topics
        long_term_emb = torch.matmul(topic_distribution.unsqueeze(0), topic_embs_proj)  # [1, 512]
        long_term_emb = long_term_emb.squeeze(0)  # [512]
        
        # Convert to numpy
        long_term_emb = long_term_emb.detach().numpy()
        
        # Normalize
        norm = np.linalg.norm(long_term_emb)
        if norm > 0:
            long_term_emb = long_term_emb / norm
        
        return long_term_emb.astype(np.float32)


class SequentialBehaviorModel:
    """Models sequential user behavior."""
    
    def __init__(self, hidden_dim: int = 768):
        """
        Initialize sequential behavior model.
        
        Args:
            hidden_dim: Hidden dimension of transformer
        """
        self.hidden_dim = hidden_dim
        
        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=hidden_dim,
            nhead=8,
            dim_feedforward=2048,
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=4)
    
    def predict_next(
        self,
        recent_interactions: List[Interaction],
        content_embeddings: Dict[int, np.ndarray]
    ) -> np.ndarray:
        """
        Predict next video preference from recent interactions.
        
        Args:
            recent_interactions: Recent interaction sequence
            content_embeddings: Dict mapping video_id to content embedding
        
        Returns:
            Predicted preference embedding [768]
        """
        if len(recent_interactions) == 0:
            return np.random.randn(self.hidden_dim).astype(np.float32)
        
        # Build sequence
        sequence = []
        for interaction in recent_interactions:
            if interaction.video_id in content_embeddings:
                video_emb = content_embeddings[interaction.video_id]
                engagement = np.array([interaction.watch_time])
                sequence.append(np.concatenate([video_emb, engagement]))
        
        if len(sequence) == 0:
            return np.random.randn(self.hidden_dim).astype(np.float32)
        
        # Convert to tensor
        sequence_tensor = torch.from_numpy(np.array(sequence)).float()  # [T, 769]
        
        # Project to hidden_dim if needed
        if sequence_tensor.shape[1] != self.hidden_dim:
            projection = nn.Linear(sequence_tensor.shape[1], self.hidden_dim)
            sequence_tensor = projection(sequence_tensor)  # [T, 768]
        
        sequence_tensor = sequence_tensor.unsqueeze(0)  # [1, T, 768]
        
        # Encode with transformer
        encoded = self.transformer(sequence_tensor)  # [1, T, 768]
        
        # Use last hidden state as prediction
        next_preference = encoded[0, -1, :]  # [768]
        
        # Convert to numpy
        next_preference = next_preference.detach().numpy()
        
        return next_preference.astype(np.float32)


class UserInterestDriftDetector:
    """Detects interest drift in user behavior."""
    
    def __init__(self, threshold: float = 0.3):
        """
        Initialize drift detector.
        
        Args:
            threshold: Cosine similarity threshold for drift detection
        """
        self.threshold = threshold
    
    def detect(
        self,
        current_embedding: np.ndarray,
        historical_embeddings: List[np.ndarray]
    ) -> tuple[bool, Optional[str]]:
        """
        Detect interest drift.
        
        Args:
            current_embedding: Current user embedding
            historical_embeddings: Historical embeddings (last 7 days)
        
        Returns:
            (is_drift, reason) tuple
        """
        if len(historical_embeddings) == 0:
            return False, None
        
        # Compute similarities
        similarities = []
        for hist_emb in historical_embeddings:
            similarity = np.dot(current_embedding, hist_emb) / (
                np.linalg.norm(current_embedding) * np.linalg.norm(hist_emb)
            )
            similarities.append(similarity)
        
        # Check for sudden changes
        if len(similarities) > 1:
            std_sim = np.std(similarities)
            if std_sim > self.threshold:
                return True, "interest_drift_detected"
        
        return False, None

