# Kaminskyi Messenger - Digital Ocean Deployment

Ultra-optimized deployment on Digital Ocean for maximum WebRTC performance.

This directory contains Terraform configuration for deploying a complete production infrastructure with application server + TURN server.

## Architecture

- **Application Server**: Ubuntu 22.04, 2 vCPU, 4GB RAM (~$18/month)
  - Nginx (reverse proxy with SSL)
  - Redis (session management, 512MB cache)
  - Go application with SFU
  - Netdata monitoring
  - Optimized for WebRTC with high file descriptor limits

- **TURN Server**: Ubuntu 22.04, 1 vCPU, 2GB RAM (~$12/month)
  - Coturn (TURN/STUN server)
  - Optimized for 20+ participants
  - SSL support
  - Port range: 49152-65535

**Total Cost: ~$30/month** for production-ready setup

## Prerequisites

1. **DigitalOcean Account**
   - Create account at https://digitalocean.com
   - Generate API token: Settings → API → Personal Access Tokens

2. **SSH Key**
   ```bash
   # Generate SSH key if you don't have one
   ssh-keygen -t ed25519 -C "messenger-server"

   # Add to DigitalOcean: Settings → Security → SSH Keys
   # Get fingerprint:
   ssh-keygen -lf ~/.ssh/id_ed25519.pub
   ```

3. **Terraform**
   ```bash
   # macOS
   brew install terraform

   # Linux
   curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
   sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
   sudo apt-get update && sudo apt-get install terraform
   ```

## Quick Start

### 1. Generate Credentials

```bash
cd infrastructure
./generate-passwords.sh
```

Edit `secrets/credentials.env` and add your DO token and SSH key:
```bash
export DO_TOKEN="dop_v1_xxxxx"
export TF_VAR_ssh_key_fingerprint="xx:xx:xx:..."
```

Load credentials:
```bash
source secrets/credentials.env
```

### 2. Deploy Infrastructure

```bash
cd digitalocean
terraform init
terraform plan
terraform apply
```

**Wait 5-10 minutes** for cloud-init to complete setup.

### 3. Deploy Application

```bash
cd ..
./deploy.sh
```

### 4. Configure Domain & SSL

```bash
# Point DNS to IPs from terraform output
terraform output deployment_info

# Setup SSL
ssh root@<app_ip> "certbot --nginx -d yourdomain.com"
ssh root@<turn_ip> "certbot certonly --standalone -d turn.yourdomain.com"
```

Done! Your messenger is live at `https://yourdomain.com` 🚀

## Management

### Check Status

```bash
# Application server
ssh root@<app_ip>
systemctl status messenger
journalctl -u messenger -f
/usr/local/bin/messenger-monitor.sh

# TURN server
ssh root@<turn_ip>
systemctl status coturn
tail -f /var/log/turnserver.log
```

### Update Application

```bash
# Make changes to code, then:
./deploy.sh
```

### View Credentials

```bash
# Application server info
ssh root@<app_ip> "cat /root/messenger-server-info.txt"

# TURN server info
ssh root@<turn_ip> "cat /root/turn-server-info.txt"
```

## Monitoring

**Netdata** (real-time dashboard):
```bash
# Setup SSH tunnel
ssh -L 19999:localhost:19999 root@<app_ip>

# Open browser: http://localhost:19999
```

Shows: CPU, memory, disk, network, WebSocket connections, Redis stats

## Cost Optimization

**Current setup: ~$30/month**
- App Server (2vCPU/4GB): $18/month
- TURN Server (1vCPU/2GB): $12/month

**For lower traffic: ~$18/month**
```bash
# Edit variables.tf
app_droplet_size = "s-1vcpu-2gb"   # $12/month
turn_droplet_size = "s-1vcpu-1gb"  # $6/month

terraform apply
```

## Scaling Up

For more participants:
```bash
# Edit variables.tf
app_droplet_size = "s-4vcpu-8gb"   # Up to 50 users
turn_droplet_size = "s-2vcpu-4gb"  # More bandwidth

terraform apply
```

## Backup

```bash
# Redis backup
ssh root@<app_ip>
redis-cli -a <password> BGSAVE
scp root@<ip>:/var/lib/redis/dump.rdb ./backup.rdb

# Droplet snapshot (via web or doctl)
doctl compute droplet-action snapshot <droplet-id> --snapshot-name="backup-$(date +%Y%m%d)"
```

## Troubleshooting

### App won't start
```bash
journalctl -u messenger -n 100
netstat -tlnp | grep 8080
cd /opt/messenger/app && ./main  # Test manually
```

### TURN not working
```bash
systemctl status coturn
tail -f /var/log/turnserver.log
netstat -an | grep :3478
```

### SSL issues
```bash
certbot certificates
certbot renew
nginx -t
```

## Destroy Infrastructure

⚠️ **Deletes everything!**
```bash
terraform destroy
```

## Security

- ✅ UFW firewall configured
- ✅ Fail2ban for SSH protection
- ✅ Secure passwords (24-32 chars)
- ✅ SSL/TLS encryption
- ✅ Redis password protection
- ✅ Private network for Redis
