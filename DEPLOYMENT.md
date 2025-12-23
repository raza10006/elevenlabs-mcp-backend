# Quick Deployment Guide

## Railway Deployment (5 minutes)

### 1. Prepare Your Code

Make sure you have a `package.json` with a `start` script (you already do!).

### 2. Create GitHub Repo (if you haven't)

```bash
cd /Users/raza
git init
git add .
git commit -m "Initial commit: ElevenLabs MCP backend"
# Create repo on GitHub, then:
git remote add origin https://github.com/yourusername/elevenlabs-mcp-backend.git
git push -u origin main
```

### 3. Deploy on Railway

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway auto-detects Node.js and runs `npm start`

### 4. Add Environment Variables

In Railway dashboard → Your project → Variables tab:

```
MCP_SECRET=TRENDYOL_MCP_SECRET_9f83kls
SUPABASE_URL=https://jznericynupuzgllbgct.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bmVyaWN5bnVwdXpnbGxiZ2N0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEzODYwNCwiZXhwIjoyMDgxNzE0NjA0fQ.j7idvzwMFFEbXRTVpivI9XQW9RlVjvhaOs4thN4-kFo
```

### 5. Get Your URL

Railway will give you a URL like: `https://your-app.up.railway.app`

### 6. Test It

```bash
curl https://your-app.up.railway.app/health
```

Done! 🎉

## Alternative: Render Deployment

1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add environment variables (same as Railway)
6. Deploy

## After Deployment

Your MCP Server URL will be: `https://your-app.railway.app/mcp`

Use this URL in ElevenLabs configuration!

