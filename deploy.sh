#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to echo with timestamp
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if repository is properly configured
if ! git remote get-url origin >/dev/null 2>&1; then
    error "No remote 'origin' found. Setting up remote..."
    git remote add origin https://github.com/joak3s/portfolio-redo.git || error "Failed to add remote repository"
fi

# Fetch the latest changes
log "📥 Fetching latest changes..."
git fetch origin || error "Failed to fetch from remote"

# Stage all changes
log "📦 Staging changes..."
git add . || error "Failed to stage changes"

# Check if there are changes to commit
if git diff --cached --quiet; then
    error "No changes to commit. Make some changes first!"
fi

# Prompt for commit message
read -p "Enter commit message: " commit_message

if [ -z "$commit_message" ]; then
    error "Commit message cannot be empty"
fi

# Commit changes
log "💾 Committing changes..."
git commit -m "$commit_message" || error "Failed to commit changes"

# Push to GitHub
log "🚀 Pushing to GitHub..."
git push origin main || error "Failed to push to GitHub. Try pulling the latest changes first with 'git pull origin main'"

log "${GREEN}✅ Changes pushed to GitHub${NC}"
log "${GREEN}🌐 Vercel deployment should start automatically${NC}" 