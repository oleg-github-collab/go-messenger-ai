# Railway Deployment Guide

## Quick Deploy (After GitHub Push Completes)

### 1. Create Railway Project

1. Go to https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Select repository: `oleg-github-collab/go-messenger-ai`
4. Railway will auto-detect Go and start building

### 2. Add Redis Service

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add Redis"**
3. Railway will automatically set `REDIS_URL` environment variable

### 3. Configure Environment Variables

Go to your service → **Variables** tab and add:

```bash
# Daily.co Configuration
DAILY_API_KEY=your_daily_api_key_here
DAILY_DOMAIN=kaminskyichat.daily.co
DAILY_WEBHOOK_SECRET=your_webhook_secret_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
WHISPER_MODEL=whisper-1
GPT_MODEL=gpt-4o

# Server Configuration
ENVIRONMENT=production
PUBLIC_DOMAIN=your-app-name.up.railway.app

# Authentication
HOST_USERNAME=Oleh
HOST_PASSWORD=QwertY24$
SESSION_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# Logging
LOG_LEVEL=INFO
```

**Note:** `PORT` and `REDIS_URL` are automatically set by Railway.

### 4. Deploy

Railway will automatically deploy after:
- Initial GitHub connection
- Every git push to main branch

### 5. Get Your URL

After deployment completes:
1. Go to **Settings** tab
2. Click **"Generate Domain"**
3. Your app will be available at: `https://your-app-name.up.railway.app`

## Manual Deploy via CLI (Alternative)

If you prefer CLI deployment:

```bash
# 1. Link to project (if not already linked)
railway link

# 2. Set environment variables (use your actual keys from .env file)
railway variables set DAILY_API_KEY=your_daily_api_key
railway variables set DAILY_DOMAIN=kaminskyichat.daily.co
railway variables set OPENAI_API_KEY=your_openai_api_key

# 3. Add Redis
railway add

# 4. Deploy
railway up
```

## Verify Deployment

1. Check health: `https://your-app-name.up.railway.app/api/health`
2. Should return:
```json
{
  "status": "ready",
  "redis": true,
  "sfu": true,
  "uptime": 123.45,
  "version": "v1.1.0-role-presets-ui"
}
```

## Features Enabled

✅ Daily.co video calls with automatic recording
✅ Recording polling every 5 minutes
✅ Automatic transcription with Whisper
✅ AI insights with GPT-4o
✅ Color-coded transcripts
✅ 7-day transcript storage in Redis
✅ Graceful shutdown on deploy
✅ Custom SFU for group calls (fallback)
✅ 1-on-1 audio calls (P2P WebRTC)

## Monitoring

- **Logs**: Railway dashboard → Deployments → View logs
- **Polling**: Check logs for `[POLLING]` messages every 5 minutes
- **Health**: `/api/health` endpoint

## Next Steps

After deployment:
1. Test Daily.co integration: Create a room and record a call
2. Wait 5 minutes for polling to discover recording
3. Check logs for transcription progress
4. View transcript in app (once UI is connected)

## Troubleshooting

**Recording not processing?**
- Check logs for `[POLLING]` errors
- Verify DAILY_API_KEY is correct
- Ensure recording is marked as "finished" in Daily.co dashboard

**Transcription failing?**
- Check OPENAI_API_KEY is valid
- Verify audio file format is supported
- Check OpenAI API quota/billing

**Redis connection issues?**
- Ensure Redis service is running in Railway
- Check REDIS_URL is set automatically
- Restart service if needed
