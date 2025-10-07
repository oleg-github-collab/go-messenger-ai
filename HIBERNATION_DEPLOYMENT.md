# Droplet Hibernation System - Deployment Guide

This guide will help you deploy the complete droplet hibernation system to save up to 90% on server costs during development.

## Architecture Overview

The hibernation system consists of three components:

1. **CloudFlare Worker** - Always-on proxy that wakes sleeping droplets
2. **Health Check Endpoint** - Verifies services are ready (`/api/health`)
3. **Sleep Controller** - Monitors activity and shuts down after idle period

## Cost Savings

- **Without hibernation**: $24/month (2 droplets × $12/month)
- **With hibernation (20% uptime)**: $4.80/month
- **Savings**: $19.20/month (80%)

## Prerequisites

- CloudFlare account (free tier)
- DigitalOcean API token
- SSH access to both droplets
- Root privileges on droplets

## Part 1: Deploy Sleep Controller on Droplets

### Step 1: Upload Sleep Controller Script

On your local machine:

```bash
# Upload to messenger droplet
scp sleep-controller.sh root@64.227.116.250:/usr/local/bin/sleep-controller.sh
ssh root@64.227.116.250 "chmod +x /usr/local/bin/sleep-controller.sh"

# Upload to TURN droplet
scp sleep-controller.sh root@64.226.72.235:/usr/local/bin/sleep-controller.sh
ssh root@64.226.72.235 "chmod +x /usr/local/bin/sleep-controller.sh"
```

### Step 2: Create Systemd Service

On **both droplets**, create the service file:

```bash
cat > /etc/systemd/system/sleep-controller.service << 'EOF'
[Unit]
Description=Droplet Sleep Controller
After=network.target messenger.service redis-server.service nginx.service
Wants=messenger.service redis-server.service nginx.service

[Service]
Type=simple
ExecStart=/usr/local/bin/sleep-controller.sh
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Security
NoNewPrivileges=false
PrivateTmp=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target
EOF
```

### Step 3: Configure Sleep Timeout (Optional)

Edit the script to adjust idle timeout:

```bash
nano /usr/local/bin/sleep-controller.sh
```

Change these values:
- `IDLE_TIMEOUT=3600` - Time in seconds before sleep (default: 1 hour)
- `CHECK_INTERVAL=300` - How often to check activity (default: 5 minutes)

### Step 4: Enable and Start Service

On **both droplets**:

```bash
# Reload systemd to recognize new service
systemctl daemon-reload

# Enable service to start on boot
systemctl enable sleep-controller.service

# Start the service
systemctl start sleep-controller.service

# Check status
systemctl status sleep-controller.service

# View logs
journalctl -u sleep-controller.service -f
```

### Step 5: Verify Health Endpoint

Test that the health endpoint works:

```bash
# From messenger droplet
curl http://localhost:8080/api/health

# Should return:
# {
#   "status": "ready",
#   "redis": true,
#   "sfu": true,
#   "uptime": 123.45,
#   "timestamp": 1759863702
# }
```

## Part 2: Deploy CloudFlare Worker

### Step 1: Create Worker

1. Log in to [CloudFlare Dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages** → **Create application** → **Create Worker**
3. Name it: `messenger-hibernation-proxy`
4. Click **Deploy** to create it

### Step 2: Add KV Namespace (for caching)

1. Go to **Workers & Pages** → **KV**
2. Click **Create namespace**
3. Name: `droplet-cache`
4. Copy the namespace ID

### Step 3: Bind KV to Worker

1. Go to your worker → **Settings** → **Variables**
2. Under **KV Namespace Bindings**, click **Add binding**
3. Variable name: `DROPLET_CACHE`
4. KV namespace: Select `droplet-cache`
5. Click **Save**

### Step 4: Upload Worker Code

1. Go to your worker → **Quick edit**
2. Delete the default code
3. Copy the entire content of `cloudflare-worker.js`
4. Paste it into the editor
5. Update the configuration at the top:
   - `DO_API_TOKEN`: Your DigitalOcean API token
   - `DROPLETS.messenger.id`: Your messenger droplet ID
   - `DROPLETS.messenger.ip`: Your messenger droplet IP
   - `DROPLETS.turn.id`: Your TURN droplet ID
   - `DROPLETS.turn.ip`: Your TURN droplet IP
6. Click **Save and Deploy**

### Step 5: Add Custom Route

1. Go to your domain in CloudFlare → **DNS**
2. Make sure you have A records pointing to your droplets:
   - `messenger.kaminskyi.chat` → `64.227.116.250`
   - `turn.kaminskyi.chat` → `64.226.72.235`
3. Go to **Workers & Pages** → **messenger-hibernation-proxy** → **Triggers**
4. Under **Routes**, click **Add route**
5. Add these routes:
   - `messenger.kaminskyi.chat/*`
   - `turn.kaminskyi.chat/*`
6. Select your worker
7. Click **Save**

## Part 3: Testing the System

### Test 1: Manual Shutdown

Manually shut down a droplet and verify CloudFlare Worker wakes it:

```bash
# Shut down messenger droplet
ssh root@64.227.116.250 "shutdown -h now"

# Wait 30 seconds, then visit:
https://messenger.kaminskyi.chat

# You should see a loading screen, then the site loads after ~15 seconds
```

### Test 2: Automatic Sleep

1. Ensure no active connections
2. Wait for idle timeout (default: 1 hour)
3. Check logs:

```bash
ssh root@64.227.116.250 "journalctl -u sleep-controller.service | tail -50"
```

Look for:
```
🌙 INITIATING GRACEFUL SHUTDOWN
💾 Saving Redis data...
🛑 Stopping services gracefully...
💤 Going to sleep. Goodbye!
```

### Test 3: Wake-up Flow

1. After droplet is shut down (off)
2. Visit https://messenger.kaminskyi.chat
3. CloudFlare Worker should:
   - Detect droplet is off
   - Send power_on command to DigitalOcean
   - Show beautiful loading screen
   - Wait for health check to pass
   - Proxy request to droplet

### Test 4: Health Check Monitoring

```bash
# Check health endpoint
curl https://messenger.kaminskyi.chat/api/health

# Check logs for activity monitoring
ssh root@64.227.116.250 "journalctl -u sleep-controller.service -f"
```

## Part 4: Monitoring and Maintenance

### View Sleep Controller Logs

```bash
# Real-time logs
journalctl -u sleep-controller.service -f

# Last 100 lines
journalctl -u sleep-controller.service -n 100

# Logs since boot
journalctl -u sleep-controller.service -b
```

### Check Wake/Sleep History

```bash
# Check for sleep markers
cat /var/run/sleep-controller/sleep_marker

# View sleep controller log file
tail -100 /var/log/sleep-controller.log
```

### Adjust Idle Timeout

To change how long before sleep:

```bash
# Edit sleep-controller.sh
nano /usr/local/bin/sleep-controller.sh

# Find and change:
IDLE_TIMEOUT=3600  # Change to desired seconds

# Restart service
systemctl restart sleep-controller.service
```

### Disable Hibernation (Temporary)

To temporarily disable auto-sleep:

```bash
systemctl stop sleep-controller.service
```

To re-enable:

```bash
systemctl start sleep-controller.service
```

### Permanently Disable Hibernation

```bash
systemctl stop sleep-controller.service
systemctl disable sleep-controller.service
```

## Part 5: Cost Tracking

### Calculate Actual Savings

Check DigitalOcean billing:

1. Go to [DigitalOcean Billing](https://cloud.digitalocean.com/billing)
2. Compare:
   - Previous month (before hibernation)
   - Current month (with hibernation)
3. Savings = Previous - Current

### Monitor Uptime Percentage

```bash
# Check droplet uptime
ssh root@64.227.116.250 "uptime"

# Calculate uptime percentage over 30 days:
# (Uptime seconds / 2592000) × 100
```

## Troubleshooting

### Worker Not Waking Droplet

1. Check DO API token is correct in worker
2. Verify droplet IDs match
3. Check CloudFlare Worker logs:
   - Go to worker → **Logs** → **Begin log stream**
4. Test DO API manually:

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_DO_TOKEN" \
  "https://api.digitalocean.com/v2/droplets/522123497"
```

### Health Check Failing

1. Ensure Redis is running:
```bash
systemctl status redis-server
```

2. Check SFU initialization:
```bash
journalctl -u messenger.service | grep SFU
```

3. Test health endpoint locally:
```bash
curl http://localhost:8080/api/health
```

### Sleep Controller Not Working

1. Check service status:
```bash
systemctl status sleep-controller.service
```

2. View logs for errors:
```bash
journalctl -u sleep-controller.service -n 100
```

3. Verify required commands exist:
```bash
which netstat redis-cli systemctl shutdown
```

4. Test activity detection:
```bash
# Check for active connections
netstat -an | grep ESTABLISHED | wc -l

# Check Redis keys
redis-cli KEYS "*"
```

### Droplet Shuts Down Too Quickly

Increase idle timeout:

```bash
nano /usr/local/bin/sleep-controller.sh
# Change: IDLE_TIMEOUT=7200  # 2 hours
systemctl restart sleep-controller.service
```

### Droplet Won't Wake Up

1. Check DigitalOcean console:
   - Log in to DO dashboard
   - Check droplet status
   - Try manual power_on from console

2. Verify CloudFlare routing:
   - Check DNS settings
   - Verify worker routes are active

3. Test DigitalOcean API:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_DO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"power_on"}' \
  "https://api.digitalocean.com/v2/droplets/522123497/actions"
```

## Security Notes

- ✅ API token is only in CloudFlare Worker (edge), not exposed to clients
- ✅ Health endpoint is public (no sensitive data)
- ✅ Sleep controller runs as root (required for shutdown)
- ✅ Redis data is saved before shutdown
- ✅ Services stopped gracefully

## Performance Notes

- **Wake time**: 15-20 seconds (DigitalOcean boot time)
- **Loading screen**: Shows countdown and auto-refreshes
- **Health check**: Verified before proxying requests
- **Idle detection**: Checks every 5 minutes
- **Grace period**: 5 minutes after boot before monitoring starts

## Expected Behavior

### Normal Operation
1. User visits site
2. If droplet is active → instant load
3. If droplet is sleeping → 15s loading screen → site loads
4. After 1 hour of no activity → graceful shutdown

### Cost Impact
- **Development**: 20% uptime → $4.80/month (80% savings)
- **Light usage**: 40% uptime → $9.60/month (60% savings)
- **Heavy usage**: 80% uptime → $19.20/month (20% savings)

## Rollback Plan

If you need to rollback the hibernation system:

```bash
# On both droplets:
systemctl stop sleep-controller.service
systemctl disable sleep-controller.service
rm /etc/systemd/system/sleep-controller.service
rm /usr/local/bin/sleep-controller.sh
systemctl daemon-reload
```

In CloudFlare:
1. Go to worker → **Triggers**
2. Remove all routes
3. Delete the worker

Your droplets will stay online 24/7 as before.

## Support

If you encounter issues:

1. Check logs: `journalctl -u sleep-controller.service -f`
2. Check CloudFlare Worker logs (real-time)
3. Test health endpoint: `curl https://messenger.kaminskyi.chat/api/health`
4. Verify DigitalOcean API access
5. Check network connectivity

## Conclusion

The hibernation system is now deployed! Your droplets will automatically:
- ✅ Monitor for activity
- ✅ Shut down after idle period
- ✅ Wake up instantly when needed
- ✅ Save you money while developing

Expected savings: **$19.20/month** (80-90% reduction)

---

**System Status**: ✅ Health check deployed, Sleep controller ready, CloudFlare Worker pending setup
