# Push to GitHub - Step by Step

## Quick Commands

Run these commands in your terminal (in the `/Users/raza` directory):

### Step 1: Initialize Git (if not already done)

```bash
cd /Users/raza
git init
```

### Step 2: Add All Files

```bash
git add .
```

### Step 3: Commit

```bash
git commit -m "Initial commit: ElevenLabs MCP backend with Supabase integration"
```

### Step 4: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `elevenlabs-mcp-backend` (or any name you like)
3. Description: "MCP server for ElevenLabs Agents - Order lookup with Supabase"
4. Choose: **Public** or **Private**
5. **DO NOT** check "Initialize with README" (we already have files)
6. Click **"Create repository"**

### Step 5: Connect and Push

GitHub will show you commands. Use these (replace `YOUR_USERNAME` with your GitHub username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/elevenlabs-mcp-backend.git
git branch -M main
git push -u origin main
```

If you get authentication errors, you might need to:
- Use a Personal Access Token instead of password
- Or use SSH: `git@github.com:YOUR_USERNAME/elevenlabs-mcp-backend.git`

## What Gets Pushed

✅ **Will be pushed:**
- All source code (`src/`)
- Configuration files (`package.json`, `tsconfig.json`)
- SQL files (`sql/`)
- Documentation (`README.md`, `ELEVENLABS_SETUP.md`, etc.)
- `.gitignore`
- `env.example` (safe - no secrets)

❌ **Will NOT be pushed** (protected by `.gitignore`):
- `.env` (your actual secrets)
- `node_modules/`
- `dist/` (build output)
- Log files

## After Pushing

Once pushed to GitHub:
1. Go to Railway
2. New Project → Deploy from GitHub repo
3. Select your `elevenlabs-mcp-backend` repository
4. Railway will auto-detect and deploy!

## Troubleshooting

### "Repository not found"
- Check the repository name is correct
- Make sure you have access (if private repo, you need to be added)

### "Authentication failed"
- Use GitHub Personal Access Token instead of password
- Or set up SSH keys

### "Nothing to commit"
- Make sure you're in the right directory (`/Users/raza`)
- Check `git status` to see what files are there

