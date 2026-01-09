# Oxygen Web - TikTok Clone Frontend

Modern, addictive TikTok clone frontend built with Next.js, TypeScript, and Pyodide.

## Features

- 🎥 Vertical video feed with infinite scroll
- 🤖 AI-powered recommendations via Pyodide (Python in browser)
- 🎨 Minimal, modern, bold UI design
- ⚡ Smooth animations and instant feedback
- 📱 Mobile-first responsive design
- 🔄 Real-time interaction tracking

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
cd web
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Architecture

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Pyodide** - Python algorithm execution in browser
- **Zustand** - State management (if needed)

## Project Structure

```
web/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── VideoFeed.tsx      # Main feed component
│   ├── VideoPlayer.tsx    # Video player
│   ├── RecommendationEngine.tsx  # Pyodide wrapper
│   └── UI/                # UI components
├── lib/                   # Utilities
│   ├── pyodide/           # Python algorithm files
│   ├── pyodide-loader.ts  # Pyodide initialization
│   ├── algorithm-bridge.ts # JS-Python bridge
│   └── video-api.ts       # API client
└── public/                # Static assets
    └── pyodide/           # Python files for Pyodide
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=https://your-api-url.workers.dev
```

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

The `vercel.json` in the root directory is already configured.

## Algorithm Integration

The recommendation algorithm runs in the browser via Pyodide. Python files are loaded from `/public/pyodide/` and executed client-side for privacy and performance.

## Performance Optimization

- Lazy loading of videos
- Prefetching next recommendations
- Caching algorithm results
- Optimized bundle size
- CDN for Pyodide runtime




