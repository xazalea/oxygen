# Oxygen - TikTok Clone

A modern, addictive TikTok clone with AI-powered recommendations, built with Next.js, TypeScript, and Pyodide.

![Oxygen](https://img.shields.io/badge/Oxygen-TikTok%20Clone-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black)

## 🚀 Features

- 🎥 **Vertical Video Feed** - Smooth infinite scroll with swipe gestures
- 🤖 **AI-Powered Recommendations** - Python algorithm running in browser via Pyodide
- 🎨 **Modern UI** - Minimal, bold, and highly addictive design
- ⚡ **Real-Time Data** - Integrated with TikTok API using [TikTok-Api](https://github.com/davidteather/TikTok-Api) and insights from [reverse-engineered source](https://github.com/huaji233333/tiktok_source)
- 📱 **Mobile-First** - Optimized for mobile and desktop
- 🔄 **Pull-to-Refresh** - Native-like mobile experience
- 🎯 **Personalized Feed** - Adapts to user behavior in real-time

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Next.js Frontend (Vercel)                             │
│  - React + TypeScript                                   │
│  - Tailwind CSS + Framer Motion                        │
│  - Pyodide (Python in Browser)                         │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  TikTok API Integration                                 │
│  - TikTok-Api library approach                          │
│  - Reverse-engineered source insights                   │
│  - Real-time video data                                 │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Algorithm**: Python (Pyodide) - runs in browser
- **API**: Next.js API Routes
- **Hosting**: Vercel (free tier)
- **CDN**: jsdelivr (Pyodide runtime)

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/xazalea/oxygen.git
cd oxygen

# Install dependencies
cd web
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Configuration

### Environment Variables

Create `.env.local` in the `web/` directory:

```env
# Optional but recommended for better rate limits
TIKTOK_MS_TOKEN=your_tiktok_ms_token_here
```

### Getting TikTok Token

1. Go to [tiktok.com](https://www.tiktok.com) and log in
2. Open browser developer tools (F12)
3. Go to Application/Storage → Cookies → tiktok.com
4. Find `ms_token` cookie and copy its value

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub:
   ```bash
   ./publish.sh
   ```

2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `web`
   - **Framework**: Next.js (auto-detected)
5. Set environment variable `TIKTOK_MS_TOKEN` (optional)
6. Deploy!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Complete deployment instructions
- [TikTok Integration](./TIKTOK_INTEGRATION.md) - API integration details
- [Production Migration](./PRODUCTION_MIGRATION.md) - Migration from mock data

## 🎯 Key Components

### Frontend
- `VideoFeed.tsx` - Main vertical scrolling feed
- `VideoPlayer.tsx` - Full-screen video player
- `RecommendationEngine.tsx` - Pyodide integration wrapper
- `UI/` - Reusable UI components

### API Routes
- `/api/trending` - Get trending videos
- `/api/video/[id]` - Get video by ID
- `/api/interaction` - Record user interactions
- `/api/health` - Health check

### Algorithm
- `algorithm_core.py` - Core recommendation logic
- `ranking.py` - Ranking algorithms
- `user_model.py` - User representation

## 🔗 Resources

- **TikTok-Api**: [davidteather/TikTok-Api](https://github.com/davidteather/TikTok-Api)
- **TikTok Source**: [huaji233333/tiktok_source](https://github.com/huaji233333/tiktok_source)
- **Pyodide**: [pyodide.org](https://pyodide.org)

## 🎨 Design Principles

- **Minimal**: Clean, uncluttered interface
- **Modern**: Smooth animations, glassmorphism effects
- **Bold**: High contrast, vibrant colors, strong visual hierarchy
- **Addictive**: Infinite scroll, instant feedback, haptic-like interactions

## 📝 License

See LICENSE file for details.

## 🙏 Acknowledgments

- [TikTok-Api](https://github.com/davidteather/TikTok-Api) for TikTok data access
- [huaji233333/tiktok_source](https://github.com/huaji233333/tiktok_source) for reverse-engineered insights
- [Pyodide](https://pyodide.org) for Python in the browser

## 🚧 Roadmap

- [ ] User authentication
- [ ] Video upload
- [ ] Social features (follow, comments)
- [ ] Advanced algorithm optimizations
- [ ] Analytics dashboard

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

---

**Built with ❤️ using Next.js, TypeScript, and Pyodide**
