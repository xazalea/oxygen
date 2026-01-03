#!/bin/bash

# Publish Oxygen to GitHub
# Run this script to publish the project to https://github.com/xazalea/oxygen

set -e

echo "🚀 Publishing Oxygen to GitHub..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Add remote if it doesn't exist
if ! git remote | grep -q "origin"; then
    echo "🔗 Adding remote repository..."
    git remote add origin https://github.com/xazalea/oxygen.git
fi

# Stage all files
echo "📝 Staging files..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "feat: Initial commit - Oxygen TikTok Clone

- Next.js frontend with TypeScript
- Pyodide-based recommendation algorithm
- TikTok API integration (TikTok-Api + reverse-engineered source)
- Enhanced UI with modern, minimal, bold design
- Production-ready deployment on Vercel
- Real-time video feed with infinite scroll
- AI-powered personalized recommendations"

# Push to GitHub
echo "⬆️  Pushing to GitHub..."
git branch -M main
git push -u origin main

echo "✅ Successfully published to https://github.com/xazalea/oxygen"
echo ""
echo "Next steps:"
echo "1. Visit https://github.com/xazalea/oxygen to view your repository"
echo "2. Deploy to Vercel by connecting your GitHub repo"
echo "3. Set TIKTOK_MS_TOKEN in Vercel environment variables"


