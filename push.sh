#!/bin/bash

echo "🚀 Git Push Script Started..."

trap 'echo ""; echo "❌ Error occurred!"; read -p "Press Enter to exit..."' ERR

# Git init check
if [ ! -d ".git" ]; then
    echo "⚡ Initializing Git..."
    git init
fi

# Force branch to main
CURRENT_BRANCH="main"

# Rename/create branch main
git branch -M main

echo "📌 Branch: $CURRENT_BRANCH"

# Check origin
if git remote get-url origin > /dev/null 2>&1; then
    echo "✅ Origin already exists"
else
    echo "❌ Origin not found"
    read -p "Enter GitHub Repo URL: " REPO_URL
    git remote add origin "$REPO_URL"
fi

# Commit message
read -p "Commit message: " COMMIT_MSG

# Add all
git add .

# Commit
git commit -m "$COMMIT_MSG" || echo "⚠️ Nothing to commit"

# Push force to main
echo "🚀 Pushing to GitHub..."
git push -u origin main -f

echo ""
echo "✅ Push Completed!"

read -p "Press Enter to exit..."