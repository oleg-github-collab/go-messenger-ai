# Railway Deployment Guide

## Prerequisites

- GitHub account
- Railway account (https://railway.app)
- Git installed locally

## Step 1: Push to GitHub

If you haven't authenticated with GitHub CLI:

```bash
# Create a new repository on GitHub manually at https://github.com/new
# Name it: kaminskyi-messenger
# Make it private
# Do NOT initialize with README

# Then push your code:
cd "/Users/olehkaminskyi/Desktop/go messenger"
git remote add origin https://github.com/YOUR_USERNAME/kaminskyi-messenger.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Railway

### Option A: Via Railway Dashboard

1. **Go to Railway**: https://railway.app
2. **Login/Sign up** with your GitHub account
3. **Create New Project**: Click "New Project"
4. **Deploy from GitHub Repo**: Select your `kaminskyi-messenger` repository
5. **Add Redis Database**:
   - Click "New" → "Database" → "Add Redis"
   - Railway will automatically create `REDIS_URL` environment variable
6. **Wait for Deployment**: Railway will automatically build and deploy

### Option B: Via Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
cd "/Users/olehkaminskyi/Desktop/go messenger"
railway init

# Add Redis database
railway add

# Select: Redis

# Deploy
railway up
```

## Step 3: Configure Environment Variables

Railway automatically sets:
- `REDIS_URL` - Redis connection string (from Redis database)
- `PORT` - Application port (default: 8080)

No manual configuration needed!

## Step 4: Get Your URL

After deployment completes:

1. Go to your Railway project dashboard
2. Click on your service
3. Go to "Settings" → "Domains"
4. Click "Generate Domain"
5. Your app will be available at: `https://your-app.up.railway.app`

## Step 5: Test the Application

### Test Host Access:
1. Navigate to `https://your-app.up.railway.app/login`
2. Login with:
   - Username: `Oleh`
   - Password: `QwertY24$`
3. Click "Create Meeting"
4. Copy the meeting link

### Test Guest Access:
1. Open the meeting link in incognito window or different browser
2. Enter your name as guest
3. Test video preview
4. Click "Join Meeting"
5. Verify WebRTC connection works

## Step 6: Share Links

Test all sharing methods:
- ✅ Copy link to clipboard
- ✅ Email sharing
- ✅ SMS sharing (mobile)
- ✅ WhatsApp sharing

## Troubleshooting

### Build Fails

Check Railway logs:
```bash
railway logs
```

Common issues:
- Ensure `go.mod` and `go.sum` are committed
- Verify Dockerfile is present and correct
- Check Redis database is running

### Redis Connection Error

Verify `REDIS_URL` environment variable:
```bash
railway variables
```

Should show:
```
REDIS_URL=redis://...
PORT=8080
```

### WebSocket Connection Issues

- Ensure your Railway app is using HTTPS (required for WebRTC)
- Check browser console for errors
- Verify CORS settings allow WebSocket connections

## Monitoring

View real-time logs:
```bash
railway logs --follow
```

Check Redis data:
```bash
railway connect redis
```

Then in Redis CLI:
```
KEYS *
TTL session:*
TTL meeting:*
```

## Scaling

Railway automatically scales your app. For production:
1. Go to project settings
2. Configure "Autoscaling" settings
3. Set minimum/maximum instances

## Cost Estimation

- **Hobby Plan** (Free):
  - $5 free credits/month
  - Sufficient for testing

- **Developer Plan** ($20/month):
  - $20 credits + overage
  - Recommended for production
  - ~500 hours uptime
  - Redis included

## Security Checklist

- ✅ HTTPS enabled (automatic on Railway)
- ✅ HTTP-only cookies for sessions
- ✅ Redis password protected (automatic)
- ✅ Environment variables secured
- ✅ CORS configured properly
- ✅ Rate limiting implemented

## Next Steps

After successful deployment of Variant A:
1. Monitor performance for 24 hours
2. Test with real users
3. Verify 8-hour meeting TTL works correctly
4. Prepare Extended Variant (conferences) - DO NOT DEPLOY YET

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: Report bugs in your repository
