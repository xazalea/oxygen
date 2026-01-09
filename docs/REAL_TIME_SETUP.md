# Real-Time Setup Guide

## Complete Setup for Automatic Real-Time Training

This guide will help you set up the system to automatically train from TikTok data in real-time.

## Prerequisites

1. **Python 3.9+**
2. **GPU (recommended)** for faster training
3. **TikTok Account** (optional, for better data access)

## Step 1: Installation

```bash
# Clone the repository
git clone <repository-url>
cd oxygen

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers (required for TikTok-Api)
python -m playwright install chromium
```

## Step 2: Get TikTok Token (Recommended)

The `ms_token` improves data collection reliability:

1. **Open TikTok in Browser**
   - Go to https://www.tiktok.com
   - Log in to your account

2. **Open Developer Tools**
   - Press `F12` or right-click → Inspect
   - Go to **Application** tab (Chrome) or **Storage** tab (Firefox)

3. **Find ms_token Cookie**
   - Navigate to: Cookies → https://www.tiktok.com
   - Find cookie named `ms_token`
   - Copy its **Value**

4. **Set Environment Variable**
   ```bash
   # Linux/Mac
   export TIKTOK_MS_TOKEN="your_token_value_here"
   
   # Windows (PowerShell)
   $env:TIKTOK_MS_TOKEN="your_token_value_here"
   
   # Windows (CMD)
   set TIKTOK_MS_TOKEN=your_token_value_here
   ```

**Note**: Token expires after ~90 days. You'll need to refresh it.

## Step 3: Configure (Optional)

Edit `implementations/v1/configs/real_time_config.json`:

```json
{
  "tiktok_api": {
    "collection_interval_seconds": 60,  // How often to collect videos
    "max_videos_per_batch": 100         // Videos per collection
  },
  "auto_training": {
    "min_videos_for_update": 100,       // Min videos before update
    "batch_retrain_interval_hours": 24  // Full retrain frequency
  }
}
```

## Step 4: Start the Service

```bash
# Basic start
python scripts/start_real_time_service.py

# With custom config
python scripts/start_real_time_service.py --config path/to/config.json

# With token
python scripts/start_real_time_service.py --ms-token "your_token"

# With specific browser
python scripts/start_real_time_service.py --browser firefox
```

## What Happens Next

The service will automatically:

1. **Collect Data** (every 60 seconds by default)
   - Fetches trending videos from TikTok
   - Extracts content features
   - Processes through multimodal pipeline

2. **Train Continuously**
   - Updates embeddings in real-time
   - Incremental model updates (hourly)
   - Full batch retraining (daily)

3. **Self-Improve**
   - Monitors performance
   - Adjusts hyperparameters
   - Adapts to trends

4. **Serve Recommendations**
   - Ready to serve personalized feeds
   - Continuously improving quality

## Monitoring

The service prints status every 5 minutes:

```
============================================================
System Status:
  Videos Collected: 1,234
  Interactions Collected: 5,678
  Training Iterations: 42
  Last Update: 2024-01-15 10:30:00
============================================================
```

## Troubleshooting

### "TikTokApi not installed"
```bash
pip install TikTokApi
```

### "Playwright not installed"
```bash
python -m playwright install
```

### "EmptyResponseException"
- TikTok is blocking requests
- Try using a proxy (see TikTok-Api docs)
- Or wait and retry later

### "Browser Has no Attribute"
```bash
python -m playwright install chromium
```

### Service stops collecting
- Check if token expired
- Verify internet connection
- Check TikTok-Api GitHub for updates

## Performance Tips

1. **Use GPU**: Set `"device": "cuda"` in config
2. **Increase Batch Size**: For faster training (if you have memory)
3. **Adjust Collection Interval**: More frequent = more data but more load
4. **Use Multiple Sessions**: Set `num_sessions > 1` for parallel collection

## Advanced: Custom Data Sources

You can also use backup datasets:

```python
# In config, enable dataset loaders
{
  "data": {
    "microlens": {"enabled": true, "path": "data/microlens"},
    "kuairec": {"enabled": true, "path": "data/kuairec"}
  }
}
```

## Production Deployment

For production:

1. **Use Process Manager**: systemd, supervisor, or PM2
2. **Set Up Logging**: Configure proper log rotation
3. **Monitor Resources**: CPU, memory, GPU usage
4. **Backup Models**: Save model checkpoints regularly
5. **Use Monolith**: Integrate with ByteDance's Monolith for scale

## Next Steps

- Read `docs/SYSTEM_ARCHITECTURE.md` for system design
- Read `docs/IMPLEMENTATION_GUIDE.md` for customization
- Check `docs/SUMMARY.md` for overview

## Support

- Check TikTok-Api issues: https://github.com/davidteather/TikTok-Api/issues
- Check project issues for known problems
- Review logs for error messages

---

**That's it!** The system will train itself automatically. Just start it and let it run! 🚀




