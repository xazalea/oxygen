"""
User representation model for Pyodide.
Lightweight version for browser execution.
"""

import numpy as np
from typing import Dict, List, Optional


class UserModel:
    """User embedding model."""
    
    def __init__(self):
        """Initialize user model."""
        # User embeddings (in production, use IndexedDB)
        self.user_embeddings: Dict[str, np.ndarray] = {}
        
        # Default embedding dimensions
        self.embedding_dim = 768
    
    def get_user_embedding(self, user_id: str) -> np.ndarray:
        """
        Get user embedding.
        
        Args:
            user_id: User ID
        
        Returns:
            User embedding vector
        """
        if user_id not in self.user_embeddings:
            # Cold start: random embedding
            self.user_embeddings[user_id] = self._create_cold_start_embedding()
        
        return self.user_embeddings[user_id]
    
    def update_from_interactions(self, user_id: str, interactions: List[Dict]):
        """
        Update user embedding from interactions.
        
        Args:
            user_id: User ID
            interactions: List of interactions
        """
        if not interactions:
            return
        
        # Get current embedding
        embedding = self.get_user_embedding(user_id)
        
        # Simple update: move embedding towards liked content
        # In production, use more sophisticated learning
        for interaction in interactions:
            if interaction.get('type') == 'like' and interaction.get('value'):
                # Positive signal: move towards content
                # Simplified: just add small random update
                update = np.random.randn(self.embedding_dim).astype(np.float32) * 0.1
                embedding = embedding + update
                embedding = embedding / np.linalg.norm(embedding)  # Normalize
        
        self.user_embeddings[user_id] = embedding
    
    def record_interaction(self, user_id: str, interaction: Dict):
        """
        Record a single interaction.
        
        Args:
            user_id: User ID
            interaction: Interaction dictionary
        """
        # Update embedding incrementally
        embedding = self.get_user_embedding(user_id)
        
        interaction_type = interaction.get('type')
        value = interaction.get('value')
        
        if interaction_type == 'like' and value:
            # Positive update
            update = np.random.randn(self.embedding_dim).astype(np.float32) * 0.05
            embedding = embedding + update
            embedding = embedding / np.linalg.norm(embedding)
            self.user_embeddings[user_id] = embedding
        elif interaction_type == 'skip' and value:
            # Negative update (small)
            update = np.random.randn(self.embedding_dim).astype(np.float32) * 0.02
            embedding = embedding - update
            embedding = embedding / np.linalg.norm(embedding)
            self.user_embeddings[user_id] = embedding
    
    def _create_cold_start_embedding(self) -> np.ndarray:
        """Create cold start user embedding."""
        embedding = np.random.randn(self.embedding_dim).astype(np.float32)
        embedding = embedding / np.linalg.norm(embedding)  # Normalize
        return embedding



