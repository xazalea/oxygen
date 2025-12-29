# Quick Setup Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies

```bash
pip install -r requirements.txt
python -m playwright install chromium
```

### 2. Set TikTok Token (Optional)

```bash
export TIKTOK_MS_TOKEN="your_token_from_tiktok_cookies"
```

See `docs/REAL_TIME_SETUP.md` for detailed instructions.

### 3. Start the Service

```bash
python scripts/start_real_time_service.py
```

**That's it!** The system will automatically:
- ✅ Collect data from TikTok
- ✅ Train models continuously
- ✅ Improve itself over time
- ✅ Serve recommendations

No manual training required!

## 📖 Full Documentation

- **Real-Time Setup**: `docs/REAL_TIME_SETUP.md` - Complete setup guide
- **System Architecture**: `docs/SYSTEM_ARCHITECTURE.md` - System design
- **Implementation Guide**: `docs/IMPLEMENTATION_GUIDE.md` - Customization

## 🎯 Features

- **EXACT TikTok Replica**: Mirrors TikTok's FYP algorithm
- **Real-Time Training**: Learns automatically from live data
- **Self-Improving**: Gets better over time
- **Zero Manual Intervention**: Fully automated

## ⚠️ Requirements

- Python 3.9+
- GPU recommended (but works on CPU)
- Internet connection for TikTok data

## 🐛 Troubleshooting

See `docs/REAL_TIME_SETUP.md` for troubleshooting guide.

---

**Ready to go!** Just run the start script and the system trains itself! 🎉

