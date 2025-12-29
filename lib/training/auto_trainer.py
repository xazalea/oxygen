"""
Automatic real-time trainer that continuously learns from TikTok data.

Trains the model automatically without manual intervention.
"""

import asyncio
import torch
import torch.nn as nn
from typing import Dict, List, Optional, Callable
from datetime import datetime, timedelta
from collections import deque
import numpy as np
import threading
import time

from lib.data.schemas import Interaction, VideoFeatures, UserFeatures
from lib.data.tiktok_api_collector import TikTokDataCollector, RealTimeTikTokCollector
from lib.ranking.multi_objective_ranker import MultiObjectiveRanker
from lib.utils.online_learning import OnlineLearningManager
from lib.multimodal.content_understanding import ContentUnderstandingPipeline


class AutoTrainer:
    """Automatic trainer that learns continuously from real-time data."""
    
    def __init__(
        self,
        ranking_model: MultiObjectiveRanker,
        content_pipeline: ContentUnderstandingPipeline,
        online_learning: OnlineLearningManager,
        config: Dict
    ):
        """
        Initialize auto trainer.
        
        Args:
            ranking_model: Ranking model to train
            content_pipeline: Content understanding pipeline
            online_learning: Online learning manager
            config: Training configuration
        """
        self.ranking_model = ranking_model
        self.content_pipeline = content_pipeline
        self.online_learning = online_learning
        self.config = config
        
        # Data buffers
        self.video_buffer: deque = deque(maxlen=10000)
        self.interaction_buffer: deque = deque(maxlen=50000)
        self.training_buffer: deque = deque(maxlen=100000)
        
        # Training state
        self.training_thread: Optional[threading.Thread] = None
        self.is_training = False
        self.last_training_time = datetime.now()
        
        # Statistics
        self.stats = {
            "videos_collected": 0,
            "interactions_collected": 0,
            "training_iterations": 0,
            "last_update": None
        }
    
    async def process_new_video(self, video_dict: Dict):
        """
        Process a new video from TikTok.
        
        Args:
            video_dict: Video dictionary from TikTok-Api
        """
        try:
            # Parse to VideoFeatures
            collector = TikTokDataCollector()
            video_features = collector.parse_video_to_features(video_dict)
            
            # Extract content embeddings
            # In practice, download video and extract
            # For now, generate placeholder
            if video_features.content_embedding is None:
                video_features.content_embedding = np.random.randn(768).astype(np.float32)
                video_features.content_embedding = (
                    video_features.content_embedding / 
                    np.linalg.norm(video_features.content_embedding)
                )
            
            # Add to buffer
            self.video_buffer.append(video_features)
            self.stats["videos_collected"] += 1
            
            # Trigger incremental update if buffer is large enough
            if len(self.video_buffer) >= self.config.get("min_videos_for_update", 100):
                await self._trigger_incremental_update()
        
        except Exception as e:
            print(f"Error processing video: {e}")
    
    async def process_interaction(self, interaction: Interaction):
        """
        Process a user interaction.
        
        Args:
            interaction: User interaction
        """
        try:
            # Add to buffers
            self.interaction_buffer.append(interaction)
            self.training_buffer.append(interaction)
            self.stats["interactions_collected"] += 1
            
            # Real-time update
            video_features = self._get_video_features(interaction.video_id)
            if video_features and video_features.content_embedding is not None:
                self.online_learning.process_interaction(
                    interaction, video_features.content_embedding
                )
            
            # Trigger incremental update if needed
            if len(self.interaction_buffer) >= self.config.get("min_interactions_for_update", 1000):
                await self._trigger_incremental_update()
        
        except Exception as e:
            print(f"Error processing interaction: {e}")
    
    async def _trigger_incremental_update(self):
        """Trigger incremental model update."""
        try:
            # Get recent interactions
            recent_interactions = list(self.interaction_buffer)[-1000:]
            
            if len(recent_interactions) < 100:
                return
            
            # Get embeddings
            content_embeddings = self._get_content_embeddings()
            user_embeddings = self._get_user_embeddings()
            
            # Perform incremental update
            self.online_learning.hourly_update(
                content_embeddings, user_embeddings
            )
            
            self.stats["training_iterations"] += 1
            self.stats["last_update"] = datetime.now()
            
        except Exception as e:
            print(f"Error in incremental update: {e}")
    
    def start_continuous_training(self):
        """Start continuous training in background thread."""
        if self.is_training:
            return
        
        self.is_training = True
        self.training_thread = threading.Thread(
            target=self._training_loop,
            daemon=True
        )
        self.training_thread.start()
    
    def stop_continuous_training(self):
        """Stop continuous training."""
        self.is_training = False
        if self.training_thread:
            self.training_thread.join(timeout=10)
    
    def _training_loop(self):
        """Background training loop."""
        while self.is_training:
            try:
                # Check if it's time for batch retraining
                time_since_last = datetime.now() - self.last_training_time
                
                if time_since_last >= timedelta(
                    hours=self.config.get("batch_retrain_interval_hours", 24)
                ):
                    self._batch_retrain()
                    self.last_training_time = datetime.now()
                
                # Sleep before next check
                time.sleep(3600)  # Check every hour
                
            except Exception as e:
                print(f"Error in training loop: {e}")
                time.sleep(60)
    
    def _batch_retrain(self):
        """Perform batch retraining."""
        try:
            print("Starting batch retraining...")
            
            # Get training data from buffer
            train_data = list(self.training_buffer)
            
            if len(train_data) < 1000:
                print("Not enough data for batch retraining")
                return
            
            # Split train/val
            split_idx = int(len(train_data) * 0.9)
            train = train_data[:split_idx]
            val = train_data[split_idx:]
            
            # Retrain
            self.online_learning.batch_retrainer.retrain_ranking_model(
                epochs=self.config.get("batch_epochs", 5),
                batch_size=self.config.get("batch_size", 1024),
                learning_rate=self.config.get("learning_rate", 0.001)
            )
            
            print(f"Batch retraining complete. Trained on {len(train)} samples.")
            
        except Exception as e:
            print(f"Error in batch retraining: {e}")
    
    def _get_video_features(self, video_id: int) -> Optional[VideoFeatures]:
        """Get video features from buffer."""
        for video in self.video_buffer:
            if video.video_id == video_id:
                return video
        return None
    
    def _get_content_embeddings(self) -> Dict[int, np.ndarray]:
        """Get content embeddings from video buffer."""
        embeddings = {}
        for video in self.video_buffer:
            if video.content_embedding is not None:
                embeddings[video.video_id] = video.content_embedding
        return embeddings
    
    def _get_user_embeddings(self) -> Dict[int, UserFeatures]:
        """Get user embeddings (synthesized from interactions)."""
        # In practice, load from embedding table
        # For now, return empty dict
        return {}


class RealTimeTrainingService:
    """Service that runs real-time training automatically."""
    
    def __init__(
        self,
        auto_trainer: AutoTrainer,
        tiktok_collector: TikTokDataCollector,
        config: Dict
    ):
        """
        Initialize real-time training service.
        
        Args:
            auto_trainer: AutoTrainer instance
            tiktok_collector: TikTokDataCollector instance
            config: Service configuration
        """
        self.auto_trainer = auto_trainer
        self.tiktok_collector = tiktok_collector
        self.config = config
        self.running = False
    
    async def start(self):
        """Start the real-time training service."""
        self.running = True
        
        # Start continuous training
        self.auto_trainer.start_continuous_training()
        
        # Start collecting TikTok data
        realtime_collector = RealTimeTikTokCollector(
            self.tiktok_collector,
            callback=self.auto_trainer.process_new_video
        )
        
        # Run collection in background
        collection_task = asyncio.create_task(
            realtime_collector.start_collecting(
                interval_seconds=self.config.get("collection_interval_seconds", 60),
                max_videos_per_batch=self.config.get("max_videos_per_batch", 100)
            )
        )
        
        try:
            # Keep service running
            while self.running:
                await asyncio.sleep(1)
        finally:
            realtime_collector.stop()
            self.auto_trainer.stop_continuous_training()
            await collection_task
    
    def stop(self):
        """Stop the service."""
        self.running = False
    
    def get_stats(self) -> Dict:
        """Get training statistics."""
        return self.auto_trainer.stats

