# Hibernation Proxy Server

Always-on proxy server that automatically wakes sleeping DigitalOcean droplets on demand.

## Features

- 🌅 Automatic droplet wake-up via DigitalOcean API
- 🏥 Health check monitoring before proxying
- ⏳ Beautiful loading screen during boot
- 📦 Status caching for performance
- 🔄 Request proxying with headers
- 💰 Save up to 90% on hosting costs

## Deploy to Railway

### Quick Deploy (Recommended)

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Deploy from this directory:
```bash
cd hibernation-proxy
railway init
railway up
```

4. Set environment variable:
```bash
railway variables set DO_API_TOKEN=YOUR_DIGITALOCEAN_API_TOKEN
```

5. Get your Railway URL:
```bash
railway domain
```

6. Add custom domain in Railway dashboard:
   - Go to your project → Settings → Domains
   - Add: `messenger.kaminskyi.chat`
   - Add: `turn.kaminskyi.chat`

### Manual Setup

If you prefer Railway web interface:

1. Go to [railway.app](https://railway.app)
2. Create New Project → Deploy from GitHub repo
3. Connect your repository
4. Set environment variables:
   - `DO_API_TOKEN`: Your DigitalOcean API token
5. Add custom domains in Settings → Domains

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your DO_API_TOKEN
```

3. Run server:
```bash
npm run dev
```

4. Test locally:
```bash
curl http://localhost:3000/health
```

## Configuration

Edit `server.js` to configure:

```javascript
const CONFIG = {
  DROPLETS: {
    messenger: {
      id: 522123497,           // Your droplet ID
      ip: '64.227.116.250',    // Your droplet IP
      port: 80,                // Target port
      healthPath: '/api/health'
    }
  },
  WAKE_UP_TIMEOUT: 120000,     // 2 minutes
  HEALTH_CHECK_INTERVAL: 3000  // 3 seconds
};
```

## How It Works

1. User visits `messenger.kaminskyi.chat`
2. Proxy checks droplet status via DigitalOcean API
3. If **off**: Send power_on → Show loading screen → Wait for health check
4. If **active**: Check health → Proxy request
5. If **starting**: Show loading screen → Retry

## Endpoints

- `GET /health` - Proxy server health check
- `* *` - All other requests are proxied to droplets

## DNS Configuration

Point your domains to Railway:

1. Get Railway URL from dashboard
2. In your DNS provider (CloudFlare), add CNAME records:
   - `messenger.kaminskyi.chat` → `your-app.up.railway.app`
   - `turn.kaminskyi.chat` → `your-app.up.railway.app`

## Monitoring

View logs in real-time:

```bash
railway logs
```

Or in Railway dashboard → Deployments → View Logs

## Cost

Railway free tier includes:
- 500 hours/month ($5 worth)
- Always-on capable
- Custom domains
- **Perfect for this use case!**

## Troubleshooting

### Droplet not waking up

Check logs:
```bash
railway logs | grep "Wake-up"
```

Verify DO API token:
```bash
railway variables
```

### Health check failing

Test health endpoint directly:
```bash
curl http://64.227.116.250/api/health
```

### Proxy errors

Check Railway logs for detailed error messages:
```bash
railway logs --filter error
```

## Security

- ✅ DO API token stored as environment variable
- ✅ Not exposed in code or to clients
- ✅ HTTPS enabled by default on Railway
- ✅ Headers properly forwarded

## Performance

- 10-second status caching
- Parallel health checks
- Stream-based proxying (no buffering)
- Automatic retry with exponential backoff

## License

MIT
