#!/bin/bash

# Navigate to cache package
cd cache-package

# In the GitHub-based approach, "publishing" means committing the data to the repository.
# jsDelivr will automatically serve the files from the repo.

# Ensure we are at the project root if the script was run from there
# or handle relative paths correctly. We assume we are in project root.

echo "Staging all changes..."
git add .

echo "Committing cache updates..."
git commit -m "chore: update cache data and infrastructure"

echo "Pushing to GitHub..."
git push origin main

echo "Cache updated! Changes should be live on jsDelivr shortly."
