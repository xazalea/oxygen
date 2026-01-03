# TikTok FYP Algorithm: Complete System Architecture

## Executive Summary

This document specifies a production-grade recommendation system that replicates TikTok's For You Page (FYP) algorithm using only public data and open-source frameworks. The system is built on ByteDance's Monolith framework and integrates real large-scale datasets to achieve behavioral fidelity to TikTok's recommendation engine.

---

## 1. Core Framework: Monolith Integration

### 1.1 Why Monolith Matches TikTok's Infrastructure

**Monolith** is ByteDance's open-source deep learning framework specifically designed for large-scale recommendation systems. It is the production framework used internally by ByteDance (TikTok's parent company), making it the ideal foundation for replicating TikTok's FYP.

**Key Matching Characteristics:**
- **Collisionless Embedding Tables**: Ensures unique representations for billions of users and videos
- **Real-time Training**: Supports online learning from streaming interactions
- **Hybrid Training**: Combines batch and real-time updates seamlessly
- **Sparse Feature Support**: Handles high-dimensional categorical features efficiently
- **Production-Grade Serving**: Low-latency inference at scale

### 1.2 Monolith Configuration for Short-Video Recommendation

#### Online Components (Real-time Serving)
```
┌─────────────────────────────────────────┐
│  Online Serving Stack                    │
├─────────────────────────────────────────┤
│  • Real-time inference service          │
│  • Embedding lookup service             │
│  • Feature extraction service           │
│  • Ranking model serving                │
│  • Exploration/exploitation logic      │
└─────────────────────────────────────────┘
```

**Responsibilities:**
- Serve recommendations with <100ms latency
- Update user embeddings in real-time from interactions
- Inject exploration candidates
- Apply diversity constraints

#### Offline Components (Batch Processing)
```
┌─────────────────────────────────────────┐
│  Offline Processing Stack                │
├─────────────────────────────────────────┤
│  • Batch model training                 │
│  • Feature engineering pipelines        │
│  • Content embedding generation         │
│  • User embedding aggregation           │
│  • Model evaluation and validation      │
└─────────────────────────────────────────┘
```

**Responsibilities:**
- Train deep ranking models on historical data
- Generate multimodal content embeddings
- Aggregate long-term user interest vectors
- Perform A/B testing and model validation

### 1.3 Embeddings, Sparse Features, and Real-time Updates

#### Embedding Architecture in Monolith

**User Embeddings:**
- **Short-term** (128-dim): Updated every interaction via real-time training
- **Mid-term** (256-dim): Aggregated daily from interaction sequences
- **Long-term** (512-dim): Learned from weekly behavior patterns

**Video Embeddings:**
- **Content embedding** (768-dim): Fused multimodal features
- **Interaction embedding** (256-dim): Learned from user feedback
- **Temporal embedding** (128-dim): Captures trending patterns

**Storage:**
- Monolith's collisionless embedding tables store embeddings
- Real-time updates use incremental gradient descent
- Batch updates use full gradient descent on accumulated data

#### Sparse Features

**User Sparse Features:**
- Device type, OS version, location (coarse), time of day
- Recent interaction types (one-hot encoded)
- Session context (session length, scroll velocity)

**Video Sparse Features:**
- Category, tags, music genre
- Creator metadata (anonymized)
- Upload timestamp, duration bucket

**Handling:**
- Monolith's sparse feature layers handle high-cardinality features
- Hash-based feature hashing for unknown categories
- Feature crossing for interaction terms

#### Real-time Updates

**Update Frequency:**
- User embeddings: Updated immediately after each interaction
- Video embeddings: Updated every 10 interactions (aggregated)
- Model weights: Updated hourly via incremental training

**Update Mechanism:**
```python
# Pseudocode for real-time embedding update
def update_user_embedding(user_id, interaction):
    current_embedding = embedding_table.lookup(user_id)
    gradient = compute_gradient(interaction, current_embedding)
    new_embedding = current_embedding + learning_rate * gradient
    embedding_table.update(user_id, new_embedding)
```

---

## 2. Real Large-Scale Training Data

### 2.1 Dataset Integration Strategy

We integrate three complementary datasets to achieve scale and diversity:

#### 2.1.1 MicroLens Dataset

**Scale:**
- 1 billion interactions
- 34 million users
- 1 million videos
- Raw multimodal data (text, audio, video files)

**Schema:**
```python
MicroLensInteraction = {
    "user_id": int64,
    "video_id": int64,
    "timestamp": int64,
    "interaction_type": enum["watch", "like", "share", "comment", "follow"],
    "watch_duration": float,  # seconds
    "completion_rate": float,  # 0.0 to 1.0
    "skip": bool,
    "rewatch": bool,
    "session_id": int64,
    "content_features": {
        "title": string,
        "audio_file": path,
        "video_file": path,
        "thumbnail": path
    }
}
```

**Mapping to TikTok Signals:**
- `watch_duration` → TikTok watch time
- `skip=True` → Fast skip signal
- `completion_rate > 0.9` → Completion signal
- `rewatch=True` → Rewatch signal
- Sequential `session_id` → Session continuation

**Normalization:**
- Platform-specific watch time distributions differ; we normalize using quantile matching
- Skip thresholds vary; we use relative skip rates (top 20% fastest skips)

#### 2.1.2 KuaiRec Dataset

**Scale:**
- Fully observed user-item matrix
- Dense interactions (minimal missing values)
- 25,000 users, 5M+ interactions

**Schema:**
```python
KuaiRecInteraction = {
    "user_id": int64,
    "video_id": int64,
    "timestamp": int64,
    "watch_time": float,
    "like": bool,
    "share": bool,
    "comment": bool,
    "follow_creator": bool,
    "category": string,
    "duration": float,
    "user_features": {
        "age": int,
        "gender": enum,
        "city": string
    }
}
```

**Mapping to TikTok Signals:**
- `watch_time` → Direct watch time signal
- `like=True` → Positive engagement
- `share=True` → High-value engagement
- Sequential patterns → Interest drift detection

**Normalization:**
- KuaiRec has denser observations; we use it for cold-start learning
- Watch time scales differ; we normalize by video duration

#### 2.1.3 KuaiRand Dataset

**Scale:**
- Unbiased sequential recommendations
- Randomly exposed videos (naturalistic)
- 14.6M recommendation events
- 8 interaction types

**Schema:**
```python
KuaiRandInteraction = {
    "user_id": int64,
    "video_id": int64,
    "timestamp": int64,
    "exposure_position": int,  # Position in feed
    "clicked": bool,
    "watch_time": float,
    "like": bool,
    "skip": bool,
    "session_id": int64,
    "sequence_length": int  # Length of session so far
}
```

**Mapping to TikTok Signals:**
- `exposure_position` → Feed position (affects engagement)
- `clicked=False` → Skip signal
- `sequence_length` → Session continuation proxy
- Random exposure → Unbiased exploration data

**Normalization:**
- Position bias: We debias using inverse propensity weighting
- Session effects: We model session fatigue explicitly

### 2.2 Unified Data Schema

After normalization, we create a unified schema:

```python
UnifiedInteraction = {
    # Identifiers
    "user_id": int64,
    "video_id": int64,
    "session_id": int64,
    "timestamp": int64,
    
    # Engagement signals
    "watch_time": float,  # Normalized to [0, 1]
    "completion_rate": float,  # [0, 1]
    "skip": bool,
    "rewatch": bool,
    "like": bool,
    "share": bool,
    "comment": bool,
    
    # Context
    "feed_position": int,
    "session_length": int,
    "time_since_last_interaction": float,
    
    # Content features (pre-extracted)
    "content_embedding": float[768],
    "video_duration": float,
    "category": string,
    
    # User features (pre-computed)
    "user_short_term_embedding": float[128],
    "user_mid_term_embedding": float[256],
    "user_long_term_embedding": float[512],
}
```

### 2.3 Data Preprocessing Pipeline

```python
def preprocess_datasets():
    # 1. Load raw datasets
    microlens = load_microlens()
    kuairec = load_kuairec()
    kuairand = load_kuairand()
    
    # 2. Normalize schemas
    microlens_norm = normalize_microlens(microlens)
    kuairec_norm = normalize_kuairec(kuairec)
    kuairand_norm = normalize_kuairand(kuairand)
    
    # 3. Merge and deduplicate
    unified = merge_datasets([microlens_norm, kuairec_norm, kuairand_norm])
    
    # 4. Extract multimodal features (see Section 3)
    unified = extract_content_features(unified)
    
    # 5. Compute user embeddings (see Section 4)
    unified = compute_user_embeddings(unified)
    
    # 6. Split train/val/test
    train, val, test = temporal_split(unified, ratios=[0.8, 0.1, 0.1])
    
    return train, val, test
```

---

## 3. Multimodal Content Understanding

### 3.1 Visual Embedding Pipeline

**Model Architecture:**
- **Base Model**: Vision Transformer (ViT-B/16) pretrained on ImageNet-21k
- **Temporal Aggregation**: 3D CNN + Transformer for video sequences
- **Output**: 512-dim visual embedding

**Extracted Features:**
- **Motion Dynamics**: Optical flow between frames
- **Facial Features**: Face detection + emotion recognition
- **Scene Cuts**: Shot boundary detection
- **Pacing**: Frame-level attention weights (fast vs slow cuts)

**Implementation:**
```python
class VisualEmbeddingExtractor:
    def __init__(self):
        self.vit = load_pretrained_vit()
        self.temporal_encoder = TemporalTransformer()
        self.face_detector = MTCNN()
        self.emotion_model = load_emotion_classifier()
    
    def extract(self, video_path):
        # Extract frames (1 fps for efficiency)
        frames = extract_frames(video_path, fps=1)
        
        # Frame-level features
        frame_features = [self.vit.encode(frame) for frame in frames]
        
        # Temporal aggregation
        temporal_features = self.temporal_encoder(frame_features)
        
        # Motion features
        motion = compute_optical_flow(frames)
        
        # Face and emotion
        faces = self.face_detector.detect(frames)
        emotions = [self.emotion_model(f) for f in faces]
        
        # Combine
        visual_embedding = concat([
            temporal_features,  # 256-dim
            motion,             # 128-dim
            emotions,           # 64-dim
            scene_cuts          # 64-dim
        ])  # Total: 512-dim
        
        return visual_embedding
```

### 3.2 Audio Embedding Pipeline

**Model Architecture:**
- **Base Model**: Wav2Vec 2.0 (pretrained on LibriSpeech)
- **Music Analysis**: Music Information Retrieval (MIR) features
- **Output**: 256-dim audio embedding

**Extracted Features:**
- **Speech Content**: ASR transcription embeddings
- **Music Genre**: Genre classification
- **Rhythm/Tempo**: Beat tracking and tempo estimation
- **Emotional Tone**: Valence-arousal from audio

**Implementation:**
```python
class AudioEmbeddingExtractor:
    def __init__(self):
        self.wav2vec = load_pretrained_wav2vec2()
        self.asr_model = load_whisper()
        self.mir_extractor = MIRFeatureExtractor()
    
    def extract(self, audio_path):
        # Load audio
        audio, sr = load_audio(audio_path)
        
        # Wav2Vec features
        wav2vec_features = self.wav2vec.encode(audio)
        
        # ASR transcription
        transcript = self.asr_model.transcribe(audio)
        transcript_embedding = encode_text(transcript)
        
        # Music features
        tempo, beat = self.mir_extractor.extract_tempo(audio)
        genre = self.mir_extractor.classify_genre(audio)
        valence, arousal = self.mir_extractor.extract_emotion(audio)
        
        # Combine
        audio_embedding = concat([
            wav2vec_features,      # 128-dim
            transcript_embedding,  # 64-dim
            tempo,                 # 16-dim
            genre,                 # 32-dim
            [valence, arousal]     # 2-dim
        ])  # Total: 242-dim → 256-dim (padded)
        
        return audio_embedding
```

### 3.3 Text Embedding Pipeline

**Sources:**
- Video captions/subtitles
- OCR from video frames
- ASR transcripts
- User-generated comments (aggregated)

**Model Architecture:**
- **Base Model**: BERT-base (multilingual)
- **Output**: 256-dim text embedding

**Implementation:**
```python
class TextEmbeddingExtractor:
    def __init__(self):
        self.bert = load_multilingual_bert()
        self.ocr = load_easyocr()
    
    def extract(self, video_path, captions=None):
        # Captions
        caption_embedding = self.bert.encode(captions) if captions else None
        
        # OCR from key frames
        key_frames = extract_key_frames(video_path)
        ocr_texts = [self.ocr.read(frame) for frame in key_frames]
        ocr_embedding = self.bert.encode(" ".join(ocr_texts))
        
        # Combine
        text_embedding = mean([caption_embedding, ocr_embedding])  # 256-dim
        
        return text_embedding
```

### 3.4 Multimodal Fusion

**Fusion Strategy:**
- **Method**: Attention-based fusion with learned weights
- **Architecture**: Multi-head attention over modality embeddings
- **Output**: 768-dim unified content embedding

**Implementation:**
```python
class MultimodalFusion:
    def __init__(self):
        self.attention = MultiHeadAttention(
            num_heads=8,
            dim=768
        )
        self.projection = Linear(768, 768)
    
    def fuse(self, visual, audio, text):
        # Normalize dimensions
        visual_proj = Linear(512, 768)(visual)
        audio_proj = Linear(256, 768)(audio)
        text_proj = Linear(256, 768)(text)
        
        # Stack modalities
        modalities = stack([visual_proj, audio_proj, text_proj])  # [3, 768]
        
        # Attention fusion
        fused = self.attention(modalities, modalities, modalities)
        
        # Aggregate (mean pooling)
        content_embedding = mean(fused, dim=0)  # [768]
        
        # Final projection
        content_embedding = self.projection(content_embedding)
        
        return content_embedding
```

### 3.5 Storage in Monolith

**Embedding Table Structure:**
```python
# In Monolith configuration
embedding_config = {
    "content_embeddings": {
        "dim": 768,
        "initializer": "random_normal",
        "optimizer": "adam",
        "learning_rate": 0.001
    }
}

# Storage format
content_embedding_table = {
    video_id: content_embedding  # 768-dim vector
}
```

**Update Strategy:**
- **Initial**: Batch compute all embeddings offline
- **Updates**: Recompute when video metadata changes
- **Caching**: Redis cache for hot videos

---

## 4. User Representation

### 4.1 Temporal Interest Vectors

#### 4.1.1 Short-Term Interest (Minutes)

**Purpose:** Capture immediate user preferences from recent interactions

**Time Window:** Last 10-20 interactions (typically 5-15 minutes)

**Learning Method:**
- Real-time updates via gradient descent
- Weighted by recency (exponential decay)

**Implementation:**
```python
class ShortTermInterest:
    def __init__(self, embedding_dim=128):
        self.embedding_dim = embedding_dim
        self.decay_factor = 0.9  # Per interaction
    
    def update(self, user_id, interaction):
        # Get current embedding
        current = embedding_table.lookup(user_id, "short_term")
        
        # Compute gradient from interaction
        video_embedding = content_embedding_table.lookup(interaction.video_id)
        engagement = interaction.watch_time * (1 - interaction.skip)
        
        # Weighted update
        gradient = engagement * video_embedding
        new_embedding = (
            self.decay_factor * current +
            (1 - self.decay_factor) * gradient
        )
        
        # Normalize
        new_embedding = normalize(new_embedding)
        
        # Update table
        embedding_table.update(user_id, "short_term", new_embedding)
        
        return new_embedding
```

#### 4.1.2 Mid-Term Interest (Days)

**Purpose:** Reflect evolving interests over daily periods

**Time Window:** Last 7 days of interactions

**Learning Method:**
- Aggregated from interaction sequences
- Learned via GRU/Transformer

**Implementation:**
```python
class MidTermInterest:
    def __init__(self, embedding_dim=256):
        self.embedding_dim = embedding_dim
        self.sequence_model = GRU(input_dim=768, hidden_dim=256)
    
    def compute(self, user_id, interactions_last_7_days):
        # Sort by timestamp
        sequence = sort(interactions_last_7_days, by="timestamp")
        
        # Extract content embeddings
        content_embeddings = [
            content_embedding_table.lookup(i.video_id)
            for i in sequence
        ]
        
        # Weight by engagement
        weights = [
            i.watch_time * (1 - i.skip) + i.like * 0.5
            for i in sequence
        ]
        weighted_embeddings = [w * e for w, e in zip(weights, content_embeddings)]
        
        # Sequence modeling
        hidden_states = self.sequence_model(weighted_embeddings)
        
        # Aggregate (last hidden state + attention)
        mid_term_embedding = attention_pool(hidden_states)
        
        # Update table
        embedding_table.update(user_id, "mid_term", mid_term_embedding)
        
        return mid_term_embedding
```

#### 4.1.3 Long-Term Interest (Weeks)

**Purpose:** Understand stable user preferences

**Time Window:** Last 4-8 weeks of interactions

**Learning Method:**
- Clustered topic modeling
- Learned via contrastive learning

**Implementation:**
```python
class LongTermInterest:
    def __init__(self, embedding_dim=512):
        self.embedding_dim = embedding_dim
        self.topic_model = TopicModel(num_topics=50)
    
    def compute(self, user_id, interactions_last_month):
        # Aggregate interactions by category/topic
        topic_distribution = self.topic_model.fit(interactions_last_month)
        
        # Extract stable preferences
        stable_topics = [t for t, w in topic_distribution if w > 0.1]
        
        # Embed topics
        topic_embeddings = [topic_embedding_table.lookup(t) for t in stable_topics]
        
        # Weighted combination
        long_term_embedding = weighted_sum(topic_embeddings, topic_distribution)
        
        # Update table
        embedding_table.update(user_id, "long_term", long_term_embedding)
        
        return long_term_embedding
```

### 4.2 Sequential Behavior Modeling

**Architecture:** Transformer-based sequence model

**Input:** Sequence of (video_embedding, engagement) pairs

**Output:** Next video preference prediction

**Implementation:**
```python
class SequentialBehaviorModel:
    def __init__(self):
        self.transformer = TransformerEncoder(
            d_model=768,
            nhead=8,
            num_layers=4
        )
    
    def predict_next(self, user_id, recent_interactions):
        # Build sequence
        sequence = []
        for interaction in recent_interactions:
            video_emb = content_embedding_table.lookup(interaction.video_id)
            engagement = interaction.watch_time
            sequence.append(concat([video_emb, engagement]))
        
        # Encode sequence
        encoded = self.transformer(sequence)
        
        # Predict next preference
        next_preference = encoded[-1]  # Last hidden state
        
        return next_preference
```

### 4.3 Interest Drift Detection

**Mechanism:** Track embedding cosine similarity over time

**Implementation:**
```python
def detect_interest_drift(user_id, current_embedding, history_window=7):
    # Get historical embeddings
    historical = get_historical_embeddings(user_id, days=history_window)
    
    # Compute drift
    similarities = [
        cosine_similarity(current_embedding, h)
        for h in historical
    ]
    
    # Detect sudden changes
    if std(similarities) > threshold:
        return True, "interest_drift_detected"
    
    return False, None
```

### 4.4 Obsession Loop Detection

**Mechanism:** Detect repeated engagement with similar content

**Implementation:**
```python
def detect_obsession_loop(user_id, recent_interactions):
    # Cluster recent videos by content similarity
    video_embeddings = [
        content_embedding_table.lookup(i.video_id)
        for i in recent_interactions
    ]
    
    # Compute similarity matrix
    similarity_matrix = pairwise_cosine_similarity(video_embeddings)
    
    # Detect high similarity clusters
    if mean(similarity_matrix) > 0.8:
        return True, "obsession_loop_detected"
    
    return False, None
```

---

## 5. Ranking Objective

### 5.1 Multi-Objective Formulation

**Primary Objectives:**
1. **Maximize Expected Watch Time**: `E[watch_time | user, video]`
2. **Maximize Completion Probability**: `P(completion | user, video)`
3. **Maximize Rewatch Probability**: `P(rewatch | user, video)`
4. **Maximize Session Continuation**: `P(continue_session | user, video)`
5. **Penalize Fast Skips**: `-λ * P(skip < threshold | user, video)`
6. **Penalize Fatigue**: `-μ * fatigue_score(user, session)`

**Mathematical Formulation:**
```
R(v, u, s) = α₁ * E[watch_time | u, v]
           + α₂ * P(complete | u, v)
           + α₃ * P(rewatch | u, v)
           + α₄ * P(continue | u, v, s)
           - α₅ * P(skip_fast | u, v)
           - α₆ * fatigue(u, s)
```

Where:
- `v`: video
- `u`: user
- `s`: session context
- `αᵢ`: learned weights (via multi-objective optimization)

### 5.2 Implementation

```python
class MultiObjectiveRanker:
    def __init__(self):
        # Sub-models
        self.watch_time_model = WatchTimePredictor()
        self.completion_model = CompletionPredictor()
        self.rewatch_model = RewatchPredictor()
        self.continuation_model = SessionContinuationPredictor()
        self.skip_model = SkipPredictor()
        self.fatigue_model = FatiguePredictor()
        
        # Learned weights (initialized from validation)
        self.weights = {
            "watch_time": 0.4,
            "completion": 0.2,
            "rewatch": 0.15,
            "continuation": 0.15,
            "skip_penalty": 0.05,
            "fatigue_penalty": 0.05
        }
    
    def rank(self, user_id, candidate_videos, session_context):
        scores = []
        
        for video_id in candidate_videos:
            # Get embeddings
            user_short = embedding_table.lookup(user_id, "short_term")
            user_mid = embedding_table.lookup(user_id, "mid_term")
            user_long = embedding_table.lookup(user_id, "long_term")
            content_emb = content_embedding_table.lookup(video_id)
            
            # Predict objectives
            watch_time = self.watch_time_model.predict(
                user_short, user_mid, user_long, content_emb
            )
            completion = self.completion_model.predict(
                user_short, user_mid, user_long, content_emb
            )
            rewatch = self.rewatch_model.predict(
                user_short, user_mid, user_long, content_emb
            )
            continuation = self.continuation_model.predict(
                user_short, user_mid, user_long, content_emb, session_context
            )
            skip_prob = self.skip_model.predict(
                user_short, user_mid, user_long, content_emb
            )
            fatigue = self.fatigue_model.predict(
                user_id, session_context
            )
            
            # Combine
            score = (
                self.weights["watch_time"] * watch_time +
                self.weights["completion"] * completion +
                self.weights["rewatch"] * rewatch +
                self.weights["continuation"] * continuation -
                self.weights["skip_penalty"] * skip_prob -
                self.weights["fatigue_penalty"] * fatigue
            )
            
            scores.append((video_id, score))
        
        # Sort by score
        scores.sort(key=lambda x: x[1], reverse=True)
        
        return scores
```

### 5.3 Why This Produces TikTok-like Addictiveness

**Addictiveness Mechanisms:**
1. **Variable Reward Schedule**: Multi-objective optimization creates unpredictable but rewarding patterns
2. **Session Continuation**: Maximizing continuation keeps users scrolling
3. **Completion Rewards**: High completion probability creates satisfaction loops
4. **Fast Adaptation**: Short-term interest updates adapt to user mood in real-time
5. **Obsession Loops**: Natural emergence from repeated high-engagement content

---

## 6. Cold Start & Virality Engine

### 6.1 Cold-Start Flow

**Stage 1: Initial Exposure**
```python
def cold_start_exposure(video_id):
    # Select random cohort (100-1000 users)
    cohort_size = random.randint(100, 1000)
    cohort = random_sample_users(cohort_size)
    
    # Inject into feed at random positions
    for user_id in cohort:
        position = random.randint(5, 20)  # Not too early, not too late
        inject_into_feed(user_id, video_id, position)
    
    # Track interactions
    interactions = collect_interactions(video_id, time_window=3600)  # 1 hour
    
    return interactions
```

**Stage 2: Performance Normalization**
```python
def normalize_performance(video_id, interactions):
    # Compute engagement metrics
    watch_time_avg = mean([i.watch_time for i in interactions])
    completion_rate = mean([i.completion_rate for i in interactions])
    skip_rate = mean([i.skip for i in interactions])
    
    # Compare to cohort baseline
    cohort_baseline = get_cohort_baseline(interactions.cohort_id)
    
    # Normalize
    normalized_watch_time = watch_time_avg / cohort_baseline.watch_time_avg
    normalized_completion = completion_rate / cohort_baseline.completion_rate
    normalized_skip = skip_rate / cohort_baseline.skip_rate
    
    # Compute performance score
    performance_score = (
        normalized_watch_time * 0.4 +
        normalized_completion * 0.4 -
        normalized_skip * 0.2
    )
    
    return performance_score
```

**Stage 3: Exponential Expansion**
```python
def viral_expansion(video_id, performance_score, current_exposure):
    if performance_score > expansion_threshold:
        # Exponential growth
        next_exposure = current_exposure * expansion_factor
        
        # Select users similar to engaged users
        engaged_users = get_engaged_users(video_id)
        similar_users = find_similar_users(engaged_users, count=next_exposure)
        
        # Inject into feeds
        for user_id in similar_users:
            inject_into_feed(user_id, video_id, position=random.randint(1, 10))
        
        return next_exposure
    else:
        # Decay exposure
        return current_exposure * decay_factor
```

### 6.2 Follower Count Independence

**Key Principle:** Follower count is NOT used in ranking

**Implementation:**
```python
def rank_videos(user_id, candidates):
    # Explicitly exclude follower count
    scores = []
    for video_id in candidates:
        # Get features (NO follower count)
        features = {
            "content_embedding": content_embedding_table.lookup(video_id),
            "engagement_rate": get_engagement_rate(video_id),
            "performance_score": get_performance_score(video_id),
            # NO: "follower_count": get_follower_count(video_id)
        }
        
        score = ranking_model.predict(features)
        scores.append((video_id, score))
    
    return sorted(scores, reverse=True)
```

**Result:** Unknown creators can go viral if content performs well

---

## 7. Exploration vs Exploitation

### 7.1 Contextual Bandits

**Algorithm:** LinUCB (Linear Upper Confidence Bound)

**Implementation:**
```python
class ContextualBandit:
    def __init__(self, alpha=1.0):
        self.alpha = alpha  # Exploration parameter
        self.A = {}  # Per-arm covariance matrices
        self.b = {}  # Per-arm reward vectors
    
    def select_arm(self, user_context, candidate_videos):
        scores = []
        
        for video_id in candidate_videos:
            # Get context
            context = get_context(user_context, video_id)
            
            # Compute UCB
            if video_id not in self.A:
                # Cold start: high uncertainty
                ucb_score = float('inf')
            else:
                # Exploitation score
                theta = inv(self.A[video_id]) @ self.b[video_id]
                exploitation = theta.T @ context
                
                # Exploration bonus
                uncertainty = self.alpha * sqrt(
                    context.T @ inv(self.A[video_id]) @ context
                )
                
                ucb_score = exploitation + uncertainty
            
            scores.append((video_id, ucb_score))
        
        # Select top-k with exploration
        return sorted(scores, reverse=True)[:k]
    
    def update(self, video_id, context, reward):
        if video_id not in self.A:
            self.A[video_id] = eye(context_dim)
            self.b[video_id] = zeros(context_dim)
        
        # Update
        self.A[video_id] += context @ context.T
        self.b[video_id] += reward * context
```

### 7.2 Fast Taste Discovery

**Mechanism:** Rapid adaptation within minutes

**Implementation:**
```python
def fast_taste_discovery(user_id, initial_interactions):
    # Analyze first 5-10 interactions
    if len(initial_interactions) < 5:
        return None
    
    # Extract patterns
    categories = [i.category for i in initial_interactions]
    engagement = [i.watch_time for i in initial_interactions]
    
    # Identify high-engagement categories
    preferred_categories = [
        cat for cat, eng in zip(categories, engagement)
        if eng > threshold
    ]
    
    # Update short-term interest immediately
    short_term_embedding = update_short_term_interest(
        user_id, preferred_categories
    )
    
    # Boost similar content in ranking
    boost_factor = 1.5
    return boost_factor
```

### 7.3 Controlled Novelty Injection

**Strategy:** Inject 10-20% novel content per session

**Implementation:**
```python
def inject_novelty(user_id, ranked_videos, session_length):
    # Compute novelty budget
    novelty_budget = int(session_length * novelty_rate)  # e.g., 0.15
    
    # Find novel videos (low similarity to user history)
    user_history = get_recent_history(user_id, limit=50)
    novel_videos = find_novel_videos(
        ranked_videos, user_history, count=novelty_budget
    )
    
    # Inject at strategic positions (not all at once)
    positions = [5, 10, 15, 20]  # Spread throughout feed
    
    for i, video_id in enumerate(novel_videos):
        position = positions[i % len(positions)]
        ranked_videos.insert(position, video_id)
    
    return ranked_videos
```

### 7.4 Implementation in Monolith

**Integration:**
- Exploration logic runs in online serving
- Bandit parameters stored in Monolith's feature store
- Updates happen in real-time training pipeline

---

## 8. Online Learning & Feedback Loops

### 8.1 Real-time Retraining

**What Retrains in Real-time:**
- User short-term embeddings (every interaction)
- Video interaction embeddings (every 10 interactions)
- Ranking model weights (hourly incremental updates)

**Implementation:**
```python
def real_time_update(interaction):
    user_id = interaction.user_id
    video_id = interaction.video_id
    
    # Update user embedding
    update_user_short_term(user_id, interaction)
    
    # Update video embedding (aggregated)
    if should_update_video(video_id):
        update_video_interaction_embedding(video_id, interaction)
    
    # Incremental model update (hourly batch)
    if is_hourly_update_time():
        incremental_model_update()
```

### 8.2 Batch Retraining

**What Retrains in Batch:**
- Full ranking model (daily)
- Multimodal content embeddings (weekly)
- User mid-term and long-term embeddings (daily)
- Exploration bandit parameters (daily)

**Schedule:**
```
Daily (2 AM):
  - Retrain ranking model on last 7 days
  - Update user mid-term embeddings
  - Retrain bandit parameters

Weekly (Sunday 2 AM):
  - Regenerate content embeddings for new videos
  - Update user long-term embeddings
  - Full model evaluation
```

### 8.3 Feedback Loop Stabilization

**Problem:** Feedback loops can cause content homogenization

**Solution:** Diversity constraints and feedback dampening

**Implementation:**
```python
def stabilize_feedback_loops(ranked_videos, user_id):
    # 1. Diversity constraint
    diverse_videos = enforce_diversity(ranked_videos, min_similarity=0.7)
    
    # 2. Temporal diversity (avoid recent repeats)
    recent_videos = get_recent_history(user_id, limit=20)
    filtered = filter_recent_repeats(diverse_videos, recent_videos)
    
    # 3. Category diversity
    category_balanced = balance_categories(filtered, max_per_category=3)
    
    return category_balanced
```

### 8.4 Spam Suppression

**Detection:**
```python
def detect_spam(video_id, interactions):
    # Check for unnatural patterns
    suspicious_signals = []
    
    # 1. Bot-like behavior
    if has_bot_pattern(interactions):
        suspicious_signals.append("bot_pattern")
    
    # 2. Engagement farming
    if has_engagement_farming(interactions):
        suspicious_signals.append("engagement_farming")
    
    # 3. Coordinated activity
    if has_coordinated_activity(interactions):
        suspicious_signals.append("coordinated")
    
    # Penalize
    if suspicious_signals:
        spam_score = len(suspicious_signals) / 3.0
        return spam_score
    
    return 0.0
```

**Suppression:**
```python
def suppress_spam(ranked_videos):
    for video_id, score in ranked_videos:
        spam_score = detect_spam(video_id)
        if spam_score > threshold:
            # Reduce ranking score
            adjusted_score = score * (1 - spam_score * penalty_factor)
            ranked_videos[video_id] = adjusted_score
    
    return ranked_videos
```

---

## 9. Failure Modes

### 9.1 Engagement Farming

**Detection:**
- Unnatural interaction patterns (e.g., all likes, no skips)
- Coordinated timing
- Low diversity in engaging users

**Mitigation:**
- Penalize in ranking
- Require diverse engagement signals
- Time-based decay for suspicious content

### 9.2 Loop Exploitation

**Detection:**
- Repeated exposure to same content
- High similarity clusters in feed

**Mitigation:**
- Enforce temporal diversity
- Limit repeat exposure within session
- Break loops with novelty injection

### 9.3 Over-Personalization

**Detection:**
- Feed becomes too narrow
- User engagement drops over time

**Mitigation:**
- Enforce category diversity
- Inject controlled novelty
- Monitor diversity metrics

### 9.4 Content Homogenization

**Detection:**
- All users see similar content
- Low content diversity across platform

**Mitigation:**
- Global diversity constraints
- Boost underrepresented content
- A/B test diversity parameters

---

## 10. System Integration

### 10.1 Training Pipeline

```python
def training_pipeline():
    # 1. Load and preprocess data
    train_data, val_data, test_data = preprocess_datasets()
    
    # 2. Extract content embeddings (offline)
    content_embeddings = extract_all_content_embeddings(train_data)
    
    # 3. Train ranking model
    ranking_model = train_ranking_model(
        train_data, val_data, epochs=10
    )
    
    # 4. Train sub-models
    watch_time_model = train_watch_time_model(train_data)
    completion_model = train_completion_model(train_data)
    # ... etc
    
    # 5. Initialize bandit
    bandit = initialize_bandit(train_data)
    
    # 6. Deploy to Monolith
    deploy_to_monolith(ranking_model, content_embeddings, bandit)
```

### 10.2 Inference Pipeline

```python
def inference_pipeline(user_id, session_context):
    # 1. Candidate generation
    candidates = candidate_generation(user_id)
    
    # 2. Feature extraction
    features = extract_features(user_id, candidates, session_context)
    
    # 3. Ranking
    ranked = ranking_model.predict(features)
    
    # 4. Exploration/exploitation
    ranked = bandit.select(ranked, user_id)
    
    # 5. Diversity and spam filtering
    ranked = apply_diversity_constraints(ranked, user_id)
    ranked = suppress_spam(ranked)
    
    # 6. Return top-k
    return ranked[:feed_size]
```

### 10.3 Default Hyperparameters

```python
DEFAULT_HYPERPARAMETERS = {
    # Embeddings
    "user_short_term_dim": 128,
    "user_mid_term_dim": 256,
    "user_long_term_dim": 512,
    "content_embedding_dim": 768,
    
    # Models
    "ranking_model_hidden_dims": [512, 256, 128],
    "learning_rate": 0.001,
    "batch_size": 1024,
    
    # Ranking weights
    "watch_time_weight": 0.4,
    "completion_weight": 0.2,
    "rewatch_weight": 0.15,
    "continuation_weight": 0.15,
    "skip_penalty": 0.05,
    "fatigue_penalty": 0.05,
    
    # Exploration
    "bandit_alpha": 1.0,
    "novelty_rate": 0.15,
    
    # Cold start
    "initial_cohort_size": 500,
    "expansion_threshold": 1.2,
    "expansion_factor": 2.0,
    
    # Diversity
    "min_content_similarity": 0.7,
    "max_repeats_per_session": 0,
    "max_per_category": 3,
}
```

---

## Conclusion

This architecture provides a complete, trainable system that replicates TikTok's FYP behavior using only public data and open-source frameworks. The system is designed for production deployment and can be trained and served using Monolith.


