# 🌐 Custom Domain Deployment Guide

**Deploy Kaminskyi Messenger on Your Own Domain**

This guide shows you how to deploy the application on your custom domain (e.g., `messenger.yourdomain.com`) instead of using Daily.co's domain.

---

## 📋 Prerequisites

- ✅ Custom domain (e.g., `yourdomain.com`)
- ✅ DNS access for your domain
- ✅ Daily.co account with API key
- ✅ OpenAI API key (for transcription)
- ✅ Railway account (or other hosting)

---

## 🎯 Architecture Overview

```
User visits: messenger.yourdomain.com
         ↓
    DNS resolves to Railway server
         ↓
    Your Go application serves UI
         ↓
For group video calls:
    Embeds Daily.co iframe (uses Daily.co's infrastructure)

For 1-on-1 audio calls:
    Direct P2P WebRTC (your domain only)
```

**Key Point:** Daily.co is embedded IN YOUR SITE, not a redirect!

---

## 🚀 Deployment Steps

### Step 1: Deploy to Railway

#### 1.1 Install Railway CLI

```bash
# macOS
brew install railway

# npm
npm install -g @railway/cli

# Or use web interface: https://railway.app
```

#### 1.2 Login to Railway

```bash
railway login
```

#### 1.3 Initialize Project

```bash
cd "/Users/olehkaminskyi/Desktop/go messenger"

# Initialize Railway project
railway init

# Give it a name
# Name: kaminskyi-messenger

# Link to project
railway link
```

#### 1.4 Set Environment Variables

```bash
# Daily.co
railway variables set DAILY_API_KEY=dop_v1_YOUR_KEY_HERE
railway variables set DAILY_DOMAIN=your-subdomain.daily.co
railway variables set DAILY_WEBHOOK_SECRET=your_webhook_secret

# OpenAI
railway variables set OPENAI_API_KEY=sk-YOUR_KEY_HERE
railway variables set WHISPER_MODEL=whisper-1
railway variables set GPT_MODEL=gpt-4o

# Redis (Railway will auto-provision)
# You'll add Redis plugin via Railway dashboard

# Server
railway variables set PORT=8080
railway variables set PUBLIC_DOMAIN=messenger.yourdomain.com

# Auth
railway variables set HOST_USERNAME=Oleh
railway variables set HOST_PASSWORD=YourSecurePassword123!
railway variables set SESSION_SECRET=$(openssl rand -base64 32)
```

#### 1.5 Add Redis Plugin

```bash
# Via CLI
railway add

# Select: Redis
# This will auto-set REDIS_URL variable
```

Or via web dashboard:
1. Go to your project
2. Click "New" → "Database" → "Redis"
3. Railway automatically sets `REDIS_URL`

#### 1.6 Deploy

```bash
# Build and deploy
railway up

# Watch logs
railway logs
```

Railway will give you a URL like: `kaminskyi-messenger.up.railway.app`

---

### Step 2: Configure Custom Domain

#### Option A: Railway Custom Domain (Easiest)

**On Railway Dashboard:**

1. Go to your project
2. Click "Settings" → "Domains"
3. Click "Custom Domain"
4. Enter: `messenger.yourdomain.com`
5. Railway shows you DNS settings

**On Your DNS Provider (Namecheap, CloudFlare, etc.):**

Add CNAME record:
```
Type: CNAME
Name: messenger
Value: kaminskyi-messenger.up.railway.app
TTL: 3600
```

**Wait for DNS propagation** (5-60 minutes)

**Verify:**
```bash
dig messenger.yourdomain.com

# Should show:
# messenger.yourdomain.com. 3600 IN CNAME kaminskyi-messenger.up.railway.app.
```

#### Option B: CloudFlare Proxy (Better Performance)

**Why CloudFlare:**
- ✅ Free SSL certificate
- ✅ CDN (faster worldwide)
- ✅ DDoS protection
- ✅ Analytics

**Setup:**

1. **Add your domain to CloudFlare**
   - Go to https://cloudflare.com
   - Add site: `yourdomain.com`
   - CloudFlare gives you nameservers

2. **Update nameservers at your registrar**
   ```
   At Namecheap/GoDaddy:
   - Go to Domain settings
   - Change nameservers to CloudFlare's
   - Example:
     - ns1.cloudflare.com
     - ns2.cloudflare.com
   ```

3. **Wait for activation** (can take 24h, usually faster)

4. **Add DNS record in CloudFlare**
   ```
   Type: CNAME
   Name: messenger
   Content: kaminskyi-messenger.up.railway.app
   Proxy status: Proxied (orange cloud ☁️)
   TTL: Auto
   ```

5. **Configure SSL**
   - CloudFlare → SSL/TLS
   - Mode: Full (strict)
   - Edge Certificates: On
   - Always Use HTTPS: On

6. **Enable Performance**
   - Speed → Optimization
   - Auto Minify: JS, CSS, HTML
   - Brotli: On
   - HTTP/2: On

**Verify:**
```bash
curl -I https://messenger.yourdomain.com

# Should return 200 OK
```

---

### Step 3: Configure Daily.co Webhook

Daily.co needs to send webhooks to YOUR domain for recording notifications.

**In Daily.co Dashboard:**

1. Go to https://dashboard.daily.co
2. Navigate to "Developers" → "Webhooks"
3. Click "Add Webhook Endpoint"
4. Enter URL: `https://messenger.yourdomain.com/api/daily/webhook`
5. Select events:
   - ✅ `recording.ready`
   - ✅ `recording.started`
   - ✅ `recording.stopped`
   - ✅ `recording.error`
6. Copy the webhook secret
7. Add to Railway:
   ```bash
   railway variables set DAILY_WEBHOOK_SECRET=your_webhook_secret
   ```

**Test Webhook:**

```bash
# Daily.co dashboard has "Send Test Event" button
# Or test manually:

curl -X POST https://messenger.yourdomain.com/api/daily/webhook \
  -H "Content-Type: application/json" \
  -H "X-Daily-Signature: test" \
  -d '{
    "type": "recording.ready",
    "room_name": "test-room",
    "recording_id": "rec_test",
    "download_link": "https://example.com/test.mp4",
    "duration": 300
  }'

# Check Railway logs:
railway logs

# Should see:
# [DAILY-WEBHOOK] 📨 Received event: recording.ready
```

---

### Step 4: Update Application Settings

#### 4.1 Update Environment Variables

```bash
# Make sure PUBLIC_DOMAIN is set
railway variables set PUBLIC_DOMAIN=messenger.yourdomain.com

# Redeploy
railway up
```

#### 4.2 Update Landing Page

Edit `static/landing-improved.html`:

```html
<!-- Change all instances of "your-domain.com" to your actual domain -->
<link rel="canonical" href="https://messenger.yourdomain.com/">
<meta property="og:url" content="https://messenger.yourdomain.com/">
<meta property="twitter:url" content="https://messenger.yourdomain.com/">

<!-- Update asset URLs -->
<meta property="og:image" content="https://messenger.yourdomain.com/static/assets/og-image.jpg">
```

#### 4.3 Create Sitemap

Create `static/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://messenger.yourdomain.com/</loc>
    <lastmod>2025-10-09</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://messenger.yourdomain.com/login</loc>
    <lastmod>2025-10-09</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

#### 4.4 Create robots.txt

Create `static/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /ws
Disallow: /ws-audio

Sitemap: https://messenger.yourdomain.com/sitemap.xml
```

---

### Step 5: SSL Certificate (Automatic)

**Railway:**
- ✅ Automatic SSL via Let's Encrypt
- ✅ Auto-renewal
- ✅ No configuration needed

**CloudFlare:**
- ✅ Free SSL included
- ✅ Works immediately
- ✅ Universal SSL certificate

**Verify SSL:**
```bash
# Check certificate
openssl s_client -connect messenger.yourdomain.com:443 -servername messenger.yourdomain.com

# Or visit in browser:
https://messenger.yourdomain.com

# Should show 🔒 lock icon
```

---

## 🧪 Testing Your Deployment

### Test 1: Landing Page

```bash
curl https://messenger.yourdomain.com

# Should return HTML
```

### Test 2: Login

```bash
curl -X POST https://messenger.yourdomain.com/login \
  -H "Content-Type: application/json" \
  -d '{"username": "Oleh", "password": "YourPassword"}'

# Should return:
# {"success": true, "token": "..."}
```

### Test 3: Create Meeting

```bash
# First, get auth token from login
TOKEN="your_token_here"

curl -X POST "https://messenger.yourdomain.com/create?mode=group&name=TestHost" \
  -H "Cookie: auth_token=$TOKEN"

# Should return:
# {
#   "meeting_id": "...",
#   "daily_url": "https://...",
#   "join_url": "https://messenger.yourdomain.com/join/..."
# }
```

### Test 4: Join as Guest

1. Open browser
2. Visit the `join_url` from above
3. Should see guest join page
4. Enter name and join
5. Should load Daily.co video call

### Test 5: Audio Call

```bash
curl -X POST "https://messenger.yourdomain.com/create?mode=audio&name=Host" \
  -H "Cookie: auth_token=$TOKEN"

# Returns join URL
# Open in 2 browsers to test P2P audio
```

---

## 🔒 Security Checklist

### SSL/HTTPS
- [ ] Site accessible via HTTPS
- [ ] HTTP redirects to HTTPS
- [ ] Valid SSL certificate
- [ ] No mixed content warnings

### Environment Variables
- [ ] All secrets in Railway variables (not in code)
- [ ] `SESSION_SECRET` is random and strong
- [ ] `DAILY_WEBHOOK_SECRET` set correctly
- [ ] Passwords changed from defaults

### Headers
Add security headers in `main.go`:

```go
// Add to all responses
w.Header().Set("X-Frame-Options", "SAMEORIGIN")
w.Header().Set("X-Content-Type-Options", "nosniff")
w.Header().Set("X-XSS-Protection", "1; mode=block")
w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
```

### Rate Limiting
- [ ] Login rate limited (5 attempts / 5 min)
- [ ] Meeting creation limited (10 / min)
- [ ] WebSocket messages limited (30 / 30s)

---

## 📊 Monitoring

### Railway Dashboard
- CPU usage
- Memory usage
- Request count
- Error rate

### Logs
```bash
# Real-time logs
railway logs --follow

# Filter errors
railway logs | grep ERROR

# Last 100 lines
railway logs --lines 100
```

### Health Check
```bash
# Check server health
curl https://messenger.yourdomain.com/api/health

# Should return:
# {
#   "status": "ready",
#   "redis": true,
#   "daily": true,
#   "openai": true,
#   "uptime": 3600.5
# }
```

### Uptime Monitoring

**Free Services:**
- UptimeRobot: https://uptimerobot.com
- Pingdom: https://pingdom.com (free tier)
- Better Uptime: https://betteruptime.com

**Setup:**
1. Add monitor for: `https://messenger.yourdomain.com/api/health`
2. Check interval: 5 minutes
3. Alert email: your@email.com
4. Expected response: "ready"

---

## 🎨 Customization

### Branding

**Logo:**
- Replace: `/static/assets/logo.png`
- Size: 512x512px
- Format: PNG with transparency

**Favicon:**
- Replace: `/static/assets/favicon-32x32.png`
- Use: https://realfavicongenerator.net

**Colors:**
Edit `static/landing-improved.html`:
```css
:root {
    --primary: #4ECDC4;    /* Change to your brand color */
    --secondary: #FF6B6B;  /* Accent color */
    --dark: #1a1a2e;       /* Background */
}
```

### Email Settings

For "share via email" feature:

```bash
railway variables set SMTP_HOST=smtp.gmail.com
railway variables set SMTP_PORT=587
railway variables set SMTP_USER=your-email@gmail.com
railway variables set SMTP_PASS=your-app-password
```

---

## 🐛 Troubleshooting

### Issue: Site not accessible

**Check DNS:**
```bash
dig messenger.yourdomain.com
nslookup messenger.yourdomain.com
```

**Wait:** DNS can take up to 48h to propagate

### Issue: SSL certificate error

**CloudFlare:**
- SSL mode should be "Full (strict)"
- Wait 10-15 minutes after adding domain

**Railway:**
- Custom domain needs to be verified
- Check Railway dashboard for status

### Issue: Daily.co webhook not working

**Verify URL is public:**
```bash
curl https://messenger.yourdomain.com/api/daily/webhook

# Should NOT return 404
```

**Check signature:**
- `DAILY_WEBHOOK_SECRET` must match Daily.co dashboard
- Case-sensitive

**Check logs:**
```bash
railway logs | grep WEBHOOK
```

### Issue: Redis connection error

**Railway:**
```bash
# Check Redis plugin is added
railway variables | grep REDIS_URL

# Should show connection string
```

**Test connection:**
```go
// Add to health check
if err := rdb.Ping(ctx).Err(); err != nil {
    log.Printf("Redis error: %v", err)
}
```

---

## 📈 Performance Optimization

### CloudFlare Settings

**Caching:**
- Browser Cache TTL: 4 hours
- Cache Level: Standard

**Minification:**
- JavaScript: On
- CSS: On
- HTML: On

**Compression:**
- Brotli: On
- Gzip: On

**HTTP/3:**
- Enable HTTP/3 (with QUIC)

### Railway Settings

**Scaling:**
```bash
# Check current resources
railway status

# Upgrade plan if needed
# Starter: $5/month (512MB RAM)
# Pro: $20/month (8GB RAM)
```

**Regions:**
- Deploy in region closest to users
- Use CloudFlare for global CDN

---

## 🎯 Post-Deployment Checklist

- [ ] Domain resolves correctly
- [ ] HTTPS working with valid certificate
- [ ] Landing page loads
- [ ] Login works
- [ ] Can create group video meeting
- [ ] Can create audio call
- [ ] Daily.co webhook receiving events
- [ ] Transcription working
- [ ] Health check returns "ready"
- [ ] Logs show no errors
- [ ] Monitoring configured
- [ ] Security headers set
- [ ] Sitemap accessible
- [ ] robots.txt accessible

---

## 🚀 Going Live

### Before Launch

1. **Test everything** with real meetings
2. **Load test** with multiple users
3. **Check mobile** responsiveness
4. **Verify all links** work
5. **Review logs** for any errors

### Launch Day

1. **Announce** on social media
2. **Monitor** logs and health
3. **Be available** for support
4. **Collect feedback**

### Post-Launch

1. **Setup analytics** (Google Analytics, Plausible)
2. **Monitor performance** (Railway dashboard)
3. **Review costs** (Daily.co, OpenAI usage)
4. **Iterate** based on feedback

---

## 💰 Cost Breakdown

### Monthly Costs

**Railway:**
- Starter: $5/month (512MB RAM, 500GB bandwidth)
- Pro: $20/month (8GB RAM, 1TB bandwidth)

**Daily.co:**
- Free: 10,000 minutes/month (330 hours)
- Pro: $99/month for 50,000 minutes

**OpenAI:**
- Whisper: $0.006/minute ($0.36/hour)
- GPT-4o: ~$0.15/request for insights
- Estimated: $10-50/month (depends on usage)

**CloudFlare:**
- Free plan is sufficient

**Domain:**
- $10-15/year (.com domain)

**Total:**
- **Minimum:** $5/month (Railway) + pay-as-you-go (Daily.co + OpenAI)
- **Typical:** $25-75/month for moderate usage
- **Scale:** $150-300/month for heavy usage

---

## 📞 Support

**Questions?**
- Check `API-DOCUMENTATION.md` for API details
- Read `READY-FOR-API-KEY.md` for setup
- Review `IMPLEMENTATION-COMPLETE.md` for architecture

**Issues?**
- Check Railway logs: `railway logs`
- Verify env variables: `railway variables`
- Test health: `https://messenger.yourdomain.com/api/health`

---

**Deployment Guide Version:** 1.0.0
**Last Updated:** 2025-10-09
**Status:** Production-Ready 🚀
