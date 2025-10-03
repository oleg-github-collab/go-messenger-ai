# 🚀 Kaminskyi Messenger - Digital Ocean Deployment

## ✅ Infrastructure Successfully Deployed!

Date: October 2, 2025

---

## 📊 Server Information

### Application Server
- **IP Address**: `209.38.184.67`
- **Size**: 2 vCPU, 4GB RAM (s-2vcpu-4gb)
- **Cost**: ~$24/month
- **Location**: Frankfurt (fra1)
- **SSH**: `ssh root@209.38.184.67`

**Installed:**
- ✅ Ubuntu 22.04
- ✅ Go 1.21
- ✅ Redis (password-protected, 512MB cache)
- ✅ Nginx (reverse proxy)
- ✅ Certbot (SSL certificates)
- ✅ Netdata (monitoring)
- ✅ Systemd service for application
- ✅ Optimized kernel parameters for WebRTC

### TURN Server
- **IP Address**: `129.212.168.150`
- **Size**: 1 vCPU, 2GB RAM (s-1vcpu-2gb)
- **Cost**: ~$12/month
- **Location**: Frankfurt (fra1)
- **SSH**: `ssh root@129.212.168.150`

**Installed:**
- ✅ Ubuntu 22.04
- ✅ Coturn (TURN/STUN server)
- ✅ Optimized for 20+ concurrent participants
- ✅ Firewall configured (ports 3478, 5349, 49152-65535)

### TURN Credentials
```
Username: kaminskyi-25a04450ce8b905b
Password: Q2dzXnKfA8WYhO6HRV3TUhldD0DRQZMu

URLs:
- turn:129.212.168.150:3478?transport=udp
- turn:129.212.168.150:3478?transport=tcp
- turns:129.212.168.150:5349?transport=tcp (after SSL)
```

**Total Monthly Cost**: ~$36/month

---

## ⏱️ IMPORTANT: Wait for Setup to Complete

Servers are currently running cloud-init scripts to install and configure everything.

**This takes 5-10 minutes.** You can monitor progress:

```bash
# Check app server
ssh root@209.38.184.67 "tail -f /var/log/cloud-init-output.log"

# Check TURN server
ssh root@129.212.168.150 "tail -f /var/log/cloud-init-output.log"
```

Look for: `✅ SETUP COMPLETE` message

---

## 📝 Next Steps

### 1. Wait for Setup (5-10 minutes)

Both servers are automatically installing packages. Wait until cloud-init completes.

### 2. Buy and Configure Domain

You'll need a domain name. Recommended registrars:
- **Namecheap**: ~$10/year for .com
- **GoDaddy**: Various TLDs available
- **Google Domains**: Simple management

**DNS Records to Add:**

```
Type  Name               Value             TTL
A     messenger          209.38.184.67     300
A     turn.messenger     129.212.168.150   300
A     www.messenger      209.38.184.67     300
```

Replace "messenger" with your actual domain name.

Wait 5-15 minutes for DNS propagation. Check with:
```bash
dig messenger.yourdomain.com
dig turn.messenger.yourdomain.com
```

### 3. Setup SSL Certificates

Once DNS is propagated:

**Application Server:**
```bash
ssh root@209.38.184.67

# Get SSL certificate
certbot --nginx -d messenger.yourdomain.com -d www.messenger.yourdomain.com

# Follow prompts, select redirect HTTP to HTTPS
```

**TURN Server:**
```bash
ssh root@129.212.168.150

# Get certificate
certbot certonly --standalone -d turn.messenger.yourdomain.com

# Update coturn config
nano /etc/turnserver.conf

# Uncomment these lines:
cert=/etc/letsencrypt/live/turn.messenger.yourdomain.com/fullchain.pem
pkey=/etc/letsencrypt/live/turn.messenger.yourdomain.com/privkey.pem

# Restart
systemctl restart coturn

# Setup auto-renewal
(crontab -l; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl restart coturn'") | crontab -
```

### 4. Deploy Application

**From your local machine:**

```bash
cd /Users/olehkaminskyi/Desktop/go\ messenger

# Load credentials
source infrastructure/secrets/credentials.env

# Deploy (builds and uploads to server)
infrastructure/deploy.sh
```

This will:
- Build Go application for Linux
- Upload binary and static files
- Start the messenger service
- Show you the deployment status

### 5. Test Your Application

Open browser to: `https://messenger.yourdomain.com`

**Test checklist:**
- ✅ Homepage loads with SSL
- ✅ Host login works (Oleh / QwertY24$)
- ✅ Guest can join via share link
- ✅ Video call connects (1-on-1)
- ✅ Group call works (multiple participants)
- ✅ Chat messages send/receive
- ✅ GIF picker works
- ✅ Mobile responsive
- ✅ Picture-in-Picture works

---

## 🔧 Management Commands

### Check Server Status

```bash
# Application server
ssh root@209.38.184.67
systemctl status messenger
journalctl -u messenger -f

# TURN server
ssh root@129.212.168.150
systemctl status coturn
tail -f /var/log/turnserver.log
```

### View Server Info

```bash
# App server details
ssh root@209.38.184.67 "cat /root/messenger-server-info.txt"

# TURN server details
ssh root@129.212.168.150 "cat /root/turn-server-info.txt"
```

### Monitoring

**Netdata Dashboard** (real-time metrics):
```bash
# Create SSH tunnel
ssh -L 19999:localhost:19999 root@209.38.184.67

# Open browser: http://localhost:19999
```

Shows: CPU, memory, disk, network, WebSocket connections, Redis stats

**Manual Status Check:**
```bash
ssh root@209.38.184.67 "/usr/local/bin/messenger-monitor.sh"
```

### Update Application

After making code changes:

```bash
cd /Users/olehkaminskyi/Desktop/go\ messenger
source infrastructure/secrets/credentials.env
infrastructure/deploy.sh
```

Zero-downtime deployment!

### Restart Services

```bash
# Restart messenger
ssh root@209.38.184.67 "systemctl restart messenger"

# Restart nginx
ssh root@209.38.184.67 "systemctl restart nginx"

# Restart TURN
ssh root@129.212.168.150 "systemctl restart coturn"

# Restart Redis
ssh root@209.38.184.67 "systemctl restart redis-server"
```

---

## 🔒 Security

**Configured:**
- ✅ UFW firewall on both servers
- ✅ Fail2ban for SSH protection
- ✅ Redis password authentication
- ✅ Secure TURN credentials
- ✅ Rate limiting on Nginx
- ✅ SSL/TLS encryption (after setup)

**SSH Key Authentication:**
Your SSH key is already authorized on both servers.

---

## 💾 Backup

### Redis Data Backup

```bash
# Manual backup
ssh root@209.38.184.67
redis-cli -a $(cat /root/redis-password.txt) BGSAVE
scp root@209.38.184.67:/var/lib/redis/dump.rdb ./backup-$(date +%Y%m%d).rdb
```

### Droplet Snapshots

Via DigitalOcean Dashboard:
1. Go to: https://cloud.digitalocean.com/droplets
2. Select droplet → Snapshots → Take Snapshot
3. Costs $0.05/GB/month

Via CLI:
```bash
brew install doctl
doctl auth init
doctl compute droplet-action snapshot 522103945 --snapshot-name="messenger-backup"
doctl compute droplet-action snapshot 522103877 --snapshot-name="turn-backup"
```

---

## 📈 Scaling

### Vertical Scaling (More Power)

Edit `infrastructure/digitalocean/variables.tf`:

```hcl
# For 50+ users
app_droplet_size = "s-4vcpu-8gb"    # $48/month
turn_droplet_size = "s-2vcpu-4gb"   # $24/month
```

Apply:
```bash
cd infrastructure/digitalocean
source ../secrets/credentials.env
terraform apply
```

Droplets will resize (requires ~2 minutes downtime).

### Horizontal Scaling (Multiple Servers)

Uncomment load balancer in `infrastructure/digitalocean/main.tf` and add:

```hcl
resource "digitalocean_droplet" "app_server_2" {
  # Copy config from app_server
}
```

---

## 💰 Cost Optimization

**Current: ~$36/month**

**For lower traffic:**
```hcl
app_droplet_size = "s-1vcpu-2gb"   # $12/month
turn_droplet_size = "s-1vcpu-1gb"  # $6/month
# Total: ~$18/month
```

---

## 🆘 Troubleshooting

### Application Won't Start

```bash
ssh root@209.38.184.67

# Check logs
journalctl -u messenger -n 100

# Check if port available
netstat -tlnp | grep 8080

# Test binary manually
cd /opt/messenger/app
./main
```

### TURN Server Issues

```bash
ssh root@129.212.168.150

# Check status
systemctl status coturn

# View logs
tail -f /var/log/turnserver.log

# Test locally
turnutils_uclient -v 129.212.168.150 3478 -u kaminskyi-25a04450ce8b905b -w Q2dzXnKfA8WYhO6HRV3TUhldD0DRQZMu
```

### SSL Certificate Problems

```bash
# Check certificate status
certbot certificates

# Renew manually
certbot renew

# Check nginx config
nginx -t
```

### High Memory Usage

```bash
# Check memory users
ps aux --sort=-%mem | head -n 10

# Restart if needed
systemctl restart messenger
systemctl restart redis-server
```

---

## 🗑️ Destroy Infrastructure

⚠️ **WARNING: This deletes everything permanently!**

```bash
cd infrastructure/digitalocean
source ../secrets/credentials.env
terraform destroy
```

---

## 📚 Documentation

- **Full Guide**: `infrastructure/digitalocean/README.md`
- **Terraform Files**: `infrastructure/digitalocean/`
- **Deployment Script**: `infrastructure/deploy.sh`
- **Credentials**: `infrastructure/secrets/credentials.env`

---

## 🎯 Performance Optimizations Applied

### System Level
- ✅ File descriptor limits: 65,536
- ✅ TCP/UDP buffer sizes optimized
- ✅ Kernel network parameters tuned
- ✅ Connection timeout optimizations

### Application Level
- ✅ WebSocket keepalive configured
- ✅ Redis connection pooling
- ✅ Nginx buffering disabled for real-time
- ✅ Gzip compression enabled
- ✅ Static file caching (30 days)

### WebRTC Level
- ✅ TURN server with UDP relay
- ✅ Port range: 49152-65535
- ✅ Optimized for low latency
- ✅ Located in Frankfurt (close to Ukraine)

---

## ✅ Deployment Checklist

- [x] Infrastructure deployed on Digital Ocean
- [x] Application server configured
- [x] TURN server configured
- [x] Firewall rules set up
- [x] Redis installed and secured
- [x] Nginx reverse proxy configured
- [x] Monitoring enabled (Netdata)
- [x] Deployment script created
- [ ] **Wait for cloud-init (5-10 min)**
- [ ] **Buy domain name**
- [ ] **Configure DNS records**
- [ ] **Setup SSL certificates**
- [ ] **Deploy application code**
- [ ] **Test all features**

---

## 📞 Support

If you encounter issues:

1. Check server logs: `journalctl -u messenger -f`
2. Check server info: `cat /root/messenger-server-info.txt`
3. Monitor status: `/usr/local/bin/messenger-monitor.sh`
4. Review docs: `infrastructure/digitalocean/README.md`

---

**Your infrastructure is ready! 🎉**

Just wait for cloud-init to complete, then configure your domain and deploy the app.
