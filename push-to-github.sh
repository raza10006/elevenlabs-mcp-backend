#!/bin/bash
# Script to push ElevenLabs MCP backend to GitHub

echo "🚀 Setting up GitHub repository..."

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Add only the project files (not other directories)
echo "📝 Adding project files..."
git add package.json package-lock.json tsconfig.json .gitignore
git add src/
git add sql/
git add README.md ELEVENLABS_SETUP.md DEPLOYMENT.md GITHUB_SETUP.md SUPABASE_SETUP.md
git add env.example
git add test.sh scripts/

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "⚠️  No changes to commit. Files might already be committed."
else
    echo "💾 Committing files..."
    git commit -m "Initial commit: ElevenLabs MCP backend with Supabase integration"
fi

echo ""
echo "✅ Files are ready to push!"
echo ""
echo "📋 Next steps:"
echo "1. Create a new repository on GitHub: https://github.com/new"
echo "2. Name it: elevenlabs-mcp-backend"
echo "3. DO NOT initialize with README (we already have files)"
echo "4. Then run these commands (replace YOUR_USERNAME):"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/elevenlabs-mcp-backend.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""

