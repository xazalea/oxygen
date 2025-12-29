# Implementation Guide

## Quick Start

### 1. Setup Environment

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Download Datasets

Download and extract the following datasets:

- **MicroLens**: https://github.com/westlake-repl/MicroLens
- **KuaiRec**: https://github.com/chongminggao/KuaiRec
- **KuaiRand**: https://github.com/chongminggao/KuaiRand

Place them in the `data/` directory:

```
data/
├── microlens/
├── kuairec/
└── kuairand/
```

### 3. Configure

Edit `implementations/v1/configs/default_config.json` to set dataset paths and hyperparameters.

### 4. Train Model

```bash
python implementations/v1/training/training_pipeline.py
```

### 5. Serve Recommendations

```python
from implementations.v1.inference.inference_pipeline import ServingService, InferencePipeline
from lib.ranking.multi_objective_ranker import MultiObjectiveRanker

# Load trained model and embeddings
ranking_model = MultiObjectiveRanker()
content_embeddings = load_content_embeddings()
user_embeddings = load_user_embeddings()
video_features = load_video_features()

# Create inference pipeline
inference_pipeline = InferencePipeline(
    ranking_model=ranking_model,
    content_embeddings=content_embeddings,
    user_embeddings=user_embeddings,
    video_features=video_features,
    config=load_config()
)

# Create serving service
service = ServingService(inference_pipeline)

# Get recommendations
feed = service.get_recommendations(
    user_id=123,
    session_id=456,
    session_start_time=1234567890,
    current_length=5,
    recent_interactions=[]
)
```

## Architecture Overview

See `docs/SYSTEM_ARCHITECTURE.md` for complete system design.

## Key Components

### Data Layer
- **Schemas**: Unified data structures for users, videos, interactions
- **Loaders**: Dataset-specific loaders with normalization

### Multimodal Understanding
- **Visual**: ViT-based frame extraction + temporal aggregation
- **Audio**: Wav2Vec + MIR features
- **Text**: BERT-based caption/OCR/ASR processing
- **Fusion**: Attention-based multimodal fusion

### User Representation
- **Short-term**: Real-time updates (minutes)
- **Mid-term**: GRU-based sequence modeling (days)
- **Long-term**: Topic modeling (weeks)

### Ranking
- **Multi-objective**: Watch time, completion, rewatch, continuation
- **Penalties**: Skip and fatigue penalties
- **Weighted combination**: Learned objective weights

### Cold Start & Virality
- **Initial exposure**: Random cohort selection
- **Performance normalization**: Baseline comparison
- **Exponential expansion**: Viral growth mechanism

### Exploration/Exploitation
- **Contextual bandits**: LinUCB for exploration
- **Fast taste discovery**: Rapid preference learning
- **Novelty injection**: Controlled diversity

### Online Learning
- **Real-time updates**: Immediate embedding updates
- **Incremental training**: Hourly model updates
- **Batch retraining**: Daily full retraining

### Failure Mode Handling
- **Spam detection**: Engagement farming detection
- **Loop prevention**: Temporal diversity enforcement
- **Over-personalization**: Category diversity
- **Homogenization**: Global diversity monitoring

## Integration with Monolith

To integrate with ByteDance's Monolith framework:

1. **Embedding Tables**: Use Monolith's collisionless embedding tables for user/video embeddings
2. **Real-time Training**: Use Monolith's real-time training pipeline
3. **Serving**: Deploy ranking model through Monolith's serving infrastructure
4. **Feature Store**: Use Monolith's feature store for sparse features

See Monolith documentation: https://github.com/bytedance/monolith

## Customization

### Adjust Ranking Weights

Edit `implementations/v1/configs/default_config.json`:

```json
{
  "model": {
    "weights": {
      "watch_time": 0.4,
      "completion": 0.2,
      "rewatch": 0.15,
      "continuation": 0.15,
      "skip_penalty": 0.05,
      "fatigue_penalty": 0.05
    }
  }
}
```

### Modify Exploration Rate

```json
{
  "exploration": {
    "bandit_alpha": 1.0,
    "novelty_rate": 0.15
  }
}
```

### Adjust Cold Start Parameters

```json
{
  "cold_start": {
    "cohort_size": 500,
    "expansion_threshold": 1.2,
    "expansion_factor": 2.0
  }
}
```

## Performance Tuning

### Embedding Dimensions

- **User short-term**: 128 (fast updates)
- **User mid-term**: 256 (sequence modeling)
- **User long-term**: 512 (topic modeling)
- **Content**: 768 (multimodal fusion)

### Model Architecture

- **Ranking model**: 3-layer MLP (512 → 256 → 128)
- **Sequence model**: 2-layer GRU (256 hidden)
- **Transformer**: 4-layer encoder (768 hidden)

### Training

- **Batch size**: 1024
- **Learning rate**: 0.001
- **Epochs**: 10 (can increase for better performance)

## Monitoring

Key metrics to monitor:

- **Engagement**: Watch time, completion rate, session length
- **Diversity**: Content similarity, category distribution
- **Cold start**: New video performance, viral expansion
- **Failure modes**: Spam rate, loop detection, homogenization

## Troubleshooting

### Out of Memory

- Reduce batch size
- Use gradient accumulation
- Process datasets in chunks

### Slow Training

- Use GPU acceleration
- Reduce embedding dimensions
- Use mixed precision training

### Poor Recommendations

- Increase training data
- Tune ranking weights
- Adjust exploration rate
- Check for data quality issues

## Next Steps

1. **Implement actual model training**: Replace placeholder training loops
2. **Add evaluation metrics**: NDCG, recall, precision
3. **Integrate Monolith**: Full production deployment
4. **A/B testing**: Compare different configurations
5. **Scale up**: Process full datasets (billions of interactions)

