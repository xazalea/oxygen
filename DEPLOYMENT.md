# Deployment Guide for Oxygen

This guide covers deploying the Oxygen TikTok clone to production using **Vercel only** (free tier, no setup required).

## Architecture

- **Frontend + API**: Next.js on Vercel (all-in-one)
- **CDN**: Vercel Edge Network (automatic)
- **Runtime**: Node.js 20.x (Vercel serverless functions)

## Prerequisites

- GitHub account
- Vercel account (free tier is sufficient)
- TikTok ms_token (optional but recommended for better API access)

## Getting Your TikTok Token (Optional)

1. Go to [tiktok.com](https://www.tiktok.com) and log in
2. Open browser developer tools (F12)
3. Go to Application/Storage → Cookies → tiktok.com
4. Find `ms_token` cookie and copy its value
5. Save it for the deployment step

## Deployment Steps

### 1. Push to GitHub

```bash
cd /Users/rohan/oxygen
git init  # if not already a git repo
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `web`
   - **Build Command**: `npm install && npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

### 3. Set Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

```
TIKTOK_MS_TOKEN=your_tiktok_ms_token_here
```

**Note**: The ms_token is optional. The app will work without it, but may have rate limiting.

### 4. Deploy

Click "Deploy" and wait for the build to complete. Vercel will automatically:
- Install dependencies
- Build the Next.js app
- Deploy to global CDN
- Provide a production URL

## Post-Deployment

### Verify Deployment

1. Visit your Vercel deployment URL
2. Check `/api/health` endpoint: `https://your-app.vercel.app/api/health`
3. Test trending videos: `https://your-app.vercel.app/api/trending?count=5`

### Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS as instructed by Vercel

## Environment Variables

### Required
None - the app works out of the box!

### Optional
- `TIKTOK_MS_TOKEN` - TikTok API token for better rate limits

## API Endpoints

All endpoints are available at your Vercel domain:

- `GET /api/trending?count=20` - Get trending videos
- `GET /api/video/:id` - Get video by ID
- `POST /api/interaction` - Record user interaction
- `GET /api/health` - Health check

## Troubleshooting

### Build Fails

- Check Node.js version (should be 20.x)
- Verify all dependencies in `package.json`
- Check build logs in Vercel dashboard

### API Errors

- Verify `TIKTOK_MS_TOKEN` is set correctly
- Check Vercel function logs
- Ensure TikTok API is accessible (may be rate-limited)

### Videos Not Loading

- Check browser console for errors
- Verify API endpoints are accessible
- Check TikTok API status

## Performance

Vercel automatically provides:
- Global CDN
- Edge caching
- Serverless function optimization
- Automatic HTTPS

## Cost

**Free Tier Includes:**
- 100GB bandwidth/month
- 100 serverless function invocations/day
- Unlimited static assets
- Automatic deployments

This is sufficient for development and moderate traffic.

## Monitoring

Vercel provides built-in:
- Analytics
- Function logs
- Performance metrics
- Error tracking

Access via Vercel Dashboard → Analytics

## Next Steps

1. Set up monitoring (Vercel Analytics)
2. Configure custom domain
3. Set up error tracking (optional)
4. Optimize for production traffic

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Project Issues: Check GitHub repository
