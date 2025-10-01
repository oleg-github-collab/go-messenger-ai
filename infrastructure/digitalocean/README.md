# DigitalOcean TURN Server Infrastructure

This directory contains Terraform configuration for deploying a production-ready TURN server on DigitalOcean.

## Prerequisites

1. **DigitalOcean Account**
   - Create account at https://digitalocean.com
   - Generate API token: Settings → API → Personal Access Tokens

2. **SSH Key**
   ```bash
   # Generate SSH key if you don't have one
   ssh-keygen -t ed25519 -C "turn-server"

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

## Setup

### 1. Generate Secure Passwords

```bash
cd ../secrets
./generate-passwords.sh > credentials.txt
```

Save the output securely! You'll need:
- `TURN_USERNAME`
- `TURN_PASSWORD`

### 2. Create terraform.tfvars

```bash
cd ../digitalocean
cat > terraform.tfvars <<EOF
do_token              = "YOUR_DIGITALOCEAN_API_TOKEN"
ssh_key_fingerprint   = "YOUR_SSH_KEY_FINGERPRINT"
turn_username         = "kaminskyi-XXXXXXXX"
turn_password         = "YOUR_TURN_PASSWORD"
environment           = "production"
region                = "fra1"  # Frankfurt - closest to Ukraine
droplet_size          = "s-2vcpu-4gb"
EOF

chmod 600 terraform.tfvars
```

### 3. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Deploy
terraform apply

# Get outputs
terraform output turn_server_ip
terraform output turn_config
```

### 4. Configure DNS

After deployment, add DNS records to your domain:

```
A     turn.kaminskyi.ai    →  [TURN_SERVER_IP from output]
AAAA  turn.kaminskyi.ai    →  [IPv6 from output]
```

### 5. Set Up SSL Certificate

SSH into the server:

```bash
# Get IP from Terraform output
ssh root@YOUR_TURN_SERVER_IP

# Wait for DNS to propagate (check with: dig turn.kaminskyi.ai)

# Get SSL certificate
certbot certonly --standalone -d turn.kaminskyi.ai --non-interactive --agree-tos --email your@email.com

# Update coturn config
nano /etc/turnserver.conf
# Uncomment these lines:
# cert=/etc/letsencrypt/live/turn.kaminskyi.ai/fullchain.pem
# pkey=/etc/letsencrypt/live/turn.kaminskyi.ai/privkey.pem

# Restart coturn
systemctl restart coturn

# Set up auto-renewal
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl restart coturn'") | crontab -
```

### 6. Update Railway Environment Variables

In Railway dashboard, add:

```bash
TURN_SERVER=turn:YOUR_TURN_SERVER_IP:3478
TURN_USERNAME=kaminskyi-XXXXXXXX
TURN_PASSWORD=YOUR_TURN_PASSWORD
TURN_URLS=turn:YOUR_IP:3478?transport=udp,turn:YOUR_IP:3478?transport=tcp,turns:turn.kaminskyi.ai:5349?transport=tcp
```

## Testing

### Test TURN Server

```bash
# Install test tool
npm install -g turn-tester

# Test UDP
turn-tester YOUR_TURN_SERVER_IP 3478 kaminskyi-XXX YOUR_PASSWORD

# Test from browser console
const pc = new RTCPeerConnection({
  iceServers: [{
    urls: [
      'turn:YOUR_IP:3478?transport=udp',
      'turn:YOUR_IP:3478?transport=tcp',
      'turns:turn.kaminskyi.ai:5349?transport=tcp'
    ],
    username: 'kaminskyi-XXX',
    credential: 'YOUR_PASSWORD'
  }]
});
```

### Monitor Server

```bash
# SSH to server
ssh root@YOUR_TURN_SERVER_IP

# Check status
systemctl status coturn

# View logs
tail -f /var/log/turnserver.log

# Run monitoring script
/usr/local/bin/turn-monitor.sh

# View monitoring logs
tail -f /var/log/turn-monitor.log
```

## Costs

- **Droplet**: s-2vcpu-4gb @ $18/month
- **Reserved IP**: $4/month
- **Total**: ~$22/month

## Scaling

To handle more users:

```hcl
# In terraform.tfvars
droplet_size = "s-4vcpu-8gb"  # Up to 50 participants
# or
droplet_size = "s-8vcpu-16gb" # Up to 100 participants
```

Then run:
```bash
terraform apply
```

## Destroy Infrastructure

⚠️ **WARNING**: This will delete everything!

```bash
terraform destroy
```

## Troubleshooting

### TURN not working

```bash
# Check if coturn is running
systemctl status coturn

# Check firewall
ufw status

# Check ports
netstat -tulpn | grep turnserver

# Test locally
turnutils_uclient -v YOUR_IP 3478 -u kaminskyi-XXX -w YOUR_PASSWORD
```

### High CPU usage

```bash
# Check active connections
netstat -an | grep :3478 | wc -l

# Check process stats
htop

# View bandwidth
iftop
```

### Certificate renewal fails

```bash
# Renew manually
certbot renew --force-renewal

# Check cert expiry
openssl x509 -in /etc/letsencrypt/live/turn.kaminskyi.ai/fullchain.pem -noout -dates
```

## Security

- ✅ Firewall configured (UFW)
- ✅ Fail2ban for SSH protection
- ✅ Secure passwords (32+ characters)
- ✅ TLS encryption (after SSL setup)
- ✅ Regular security updates
- ⚠️ TODO: Restrict SSH to your IP only

## Monitoring Metrics

- Active connections
- Bandwidth usage
- CPU/Memory
- Error rates
- Certificate expiry

All logged to `/var/log/turn-monitor.log`
