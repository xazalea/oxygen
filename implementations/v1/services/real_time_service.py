"""
Real-time service that automatically trains and serves recommendations.

This is the main service that runs continuously, learning from TikTok
and serving recommendations without manual intervention.
"""

import asyncio
import os
import json
from pathlib import Path
from typing import Dict, Optional
import numpy as np
import torch

from lib.data.tiktok_api_collector import TikTokDataCollector
from lib.training.auto_trainer import AutoTrainer, RealTimeTrainingService
from lib.ranking.multi_objective_ranker import MultiObjectiveRanker
from lib.utils.online_learning import OnlineLearningManager
from lib.multimodal.content_understanding import ContentUnderstandingPipeline
from implementations.v1.inference.inference_pipeline import InferencePipeline, ServingService
from lib.data.schemas import UserFeatures, VideoFeatures


class SeamlessRealTimeService:
    """
    Seamless real-time service that automatically:
    - Collects data from TikTok
    - Trains models continuously
    - Serves recommendations
    - Improves itself over time
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize seamless real-time service.
        
        Args:
            config_path: Path to configuration file
        """
        # Load configuration
        if config_path:
            with open(config_path, 'r') as f:
                self.config = json.load(f)
        else:
            config_path = Path(__file__).parent.parent / "configs" / "default_config.json"
            with open(config_path, 'r') as f:
                self.config = json.load(f)
        
        # Initialize components
        self._initialize_components()
        
        # Service state
        self.running = False
        self.training_service: Optional[RealTimeTrainingService] = None
        self.serving_service: Optional[ServingService] = None
    
    def _initialize_components(self):
        """Initialize all system components."""
        # Initialize ranking model
        self.ranking_model = MultiObjectiveRanker(
            weights=self.config.get("model", {}).get("weights"),
            device=self.config.get("model", {}).get("device", "cpu")
        )
        
        # Initialize content pipeline
        self.content_pipeline = ContentUnderstandingPipeline()
        
        # Initialize embedding storage
        self.embedding_table: Dict[int, Dict[str, np.ndarray]] = {}
        self.content_embeddings: Dict[int, np.ndarray] = {}
        self.user_embeddings: Dict[int, UserFeatures] = {}
        self.video_features: Dict[int, VideoFeatures] = {}
        
        # Initialize online learning
        self.online_learning = OnlineLearningManager(
            ranking_model=self.ranking_model,
            embedding_table=self.embedding_table,
            train_data=[],  # Will be populated from real-time data
            val_data=[]
        )
        
        # Initialize auto trainer
        self.auto_trainer = AutoTrainer(
            ranking_model=self.ranking_model,
            content_pipeline=self.content_pipeline,
            online_learning=self.online_learning,
            config=self.config.get("auto_training", {})
        )
        
        # Initialize TikTok collector
        ms_token = os.environ.get("TIKTOK_MS_TOKEN")
        self.tiktok_collector = TikTokDataCollector(
            ms_token=ms_token,
            num_sessions=self.config.get("tiktok_api", {}).get("num_sessions", 1),
            browser=os.getenv("TIKTOK_BROWSER", "chromium")
        )
        
        # Initialize inference pipeline
        self.inference_pipeline = InferencePipeline(
            ranking_model=self.ranking_model,
            content_embeddings=self.content_embeddings,
            user_embeddings=self.user_embeddings,
            video_features=self.video_features,
            config=self.config.get("inference", {})
        )
        
        # Initialize serving service
        self.serving_service = ServingService(self.inference_pipeline)
    
    async def start(self):
        """Start the seamless real-time service."""
        print("Starting Seamless Real-Time Service...")
        print("=" * 60)
        print("Features:")
        print("  ✓ Automatic data collection from TikTok")
        print("  ✓ Continuous real-time training")
        print("  ✓ Self-improving recommendations")
        print("  ✓ Zero manual intervention required")
        print("=" * 60)
        
        self.running = True
        
        # Initialize training service
        self.training_service = RealTimeTrainingService(
            auto_trainer=self.auto_trainer,
            tiktok_collector=self.tiktok_collector,
            config=self.config.get("real_time_training", {})
        )
        
        # Start training service in background
        training_task = asyncio.create_task(self.training_service.start())
        
        # Start serving (if configured)
        if self.config.get("serving", {}).get("enabled", True):
            serving_task = asyncio.create_task(self._serving_loop())
        else:
            serving_task = None
        
        # Monitor and report
        monitor_task = asyncio.create_task(self._monitor_loop())
        
        try:
            # Keep service running
            await asyncio.gather(
                training_task,
                serving_task if serving_task else asyncio.sleep(float('inf')),
                monitor_task
            )
        except KeyboardInterrupt:
            print("\nShutting down...")
        finally:
            await self.stop()
    
    async def _serving_loop(self):
        """Serving loop (placeholder for actual serving implementation)."""
        # In practice, this would run a web server (FastAPI, Flask, etc.)
        # For now, just keep the service alive
        while self.running:
            await asyncio.sleep(1)
    
    async def _monitor_loop(self):
        """Monitor and report system status."""
        while self.running:
            await asyncio.sleep(300)  # Every 5 minutes
            
            stats = self.training_service.get_stats() if self.training_service else {}
            
            print("\n" + "=" * 60)
            print("System Status:")
            print(f"  Videos Collected: {stats.get('videos_collected', 0)}")
            print(f"  Interactions Collected: {stats.get('interactions_collected', 0)}")
            print(f"  Training Iterations: {stats.get('training_iterations', 0)}")
            print(f"  Last Update: {stats.get('last_update', 'Never')}")
            print("=" * 60)
    
    async def stop(self):
        """Stop the service."""
        print("Stopping service...")
        self.running = False
        
        if self.training_service:
            self.training_service.stop()
        
        print("Service stopped.")
    
    def get_recommendations(
        self,
        user_id: int,
        session_id: int,
        session_start_time: int,
        current_length: int,
        recent_interactions: list
    ):
        """
        Get recommendations for a user.
        
        Args:
            user_id: User ID
            session_id: Session ID
            session_start_time: Session start timestamp
            current_length: Current session length
            recent_interactions: Recent interactions
        
        Returns:
            List of recommended videos
        """
        if not self.serving_service:
            raise RuntimeError("Service not started")
        
        return self.serving_service.get_recommendations(
            user_id=user_id,
            session_id=session_id,
            session_start_time=session_start_time,
            current_length=current_length,
            recent_interactions=recent_interactions
        )
    
    def record_interaction(self, interaction):
        """Record a user interaction."""
        if self.auto_trainer:
            asyncio.create_task(
                self.auto_trainer.process_interaction(interaction)
            )


async def main():
    """Main entry point for the service."""
    service = SeamlessRealTimeService()
    await service.start()


if __name__ == "__main__":
    asyncio.run(main())

