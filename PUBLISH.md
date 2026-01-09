# Publishing to GitHub

## Quick Publish

Run the publish script:

```bash
./publish.sh
```

This will:
1. Initialize git repository (if needed)
2. Add remote origin (https://github.com/xazalea/oxygen)
3. Stage all files
4. Commit with a descriptive message
5. Push to GitHub

## Manual Publish

If you prefer to publish manually:

```bash
# Initialize git (if not already done)
git init

# Add remote
git remote add origin https://github.com/xazalea/oxygen.git

# Stage files
git add .

# Commit
git commit -m "feat: Initial commit - Oxygen TikTok Clone"

# Push
git branch -M main
git push -u origin main
```

## After Publishing

1. Visit https://github.com/xazalea/oxygen to verify
2. Connect to Vercel for deployment
3. Set environment variables in Vercel dashboard

## Notes

- Make sure you have write access to the repository
- The script will create a main branch
- All files are included except those in `.gitignore`




