#!/bin/bash
set -e

# TURN Server Setup Script for Kaminskyi Messenger
# This script sets up Coturn TURN server on Ubuntu 22.04

echo "=== KAMINSKYI TURN SERVER SETUP ==="
echo "Starting at: $(date)"

# Update system
apt-get update
apt-get upgrade -y

# Install required packages
apt-get install -y \
    coturn \
    certbot \
    ufw \
    fail2ban \
    htop \
    iftop \
    prometheus-node-exporter

# Get server's public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address)
echo "Public IP: $PUBLIC_IP"

# Enable coturn
sed -i 's/#TURNSERVER_ENABLED=1/TURNSERVER_ENABLED=1/' /etc/default/coturn

# Configure coturn
cat > /etc/turnserver.conf <<'EOF'
# Kaminskyi Messenger TURN Server Configuration

# Listening interfaces
listening-ip=0.0.0.0
relay-ip=${PUBLIC_IP}

# External IP (for NAT)
external-ip=${PUBLIC_IP}

# Ports
listening-port=3478
tls-listening-port=5349
min-port=49152
max-port=65535

# Authentication
lt-cred-mech
user=${turn_username}:${turn_password}
realm=turn.kaminskyi.ai

# SSL Certificates (will be configured after DNS setup)
# cert=/etc/letsencrypt/live/turn.kaminskyi.ai/fullchain.pem
# pkey=/etc/letsencrypt/live/turn.kaminskyi.ai/privkey.pem

# Logging
log-file=/var/log/turnserver.log
verbose
syslog

# Performance tuning for 20 participants
max-bps=1000000
bps-capacity=0
total-quota=100
stale-nonce=600

# Security
no-multicast-peers
no-cli
no-loopback-peers
no-tcp-relay
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=192.168.0.0-192.168.255.255
denied-peer-ip=172.16.0.0-172.31.255.255

# Fingerprint in messages
fingerprint
EOF

# Replace variables in config
sed -i "s/\${PUBLIC_IP}/$PUBLIC_IP/g" /etc/turnserver.conf
sed -i "s/\${turn_username}/${turn_username}/g" /etc/turnserver.conf
sed -i "s/\${turn_password}/${turn_password}/g" /etc/turnserver.conf

# Set proper permissions
chmod 644 /etc/turnserver.conf

# Configure UFW firewall
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp     # SSH
ufw allow 80/tcp     # HTTP (for Let's Encrypt)
ufw allow 443/tcp    # HTTPS
ufw allow 3478/tcp   # TURN TCP
ufw allow 3478/udp   # TURN UDP
ufw allow 5349/tcp   # TURN TLS
ufw allow 49152:65535/udp # RTP/RTCP

# Configure fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Start coturn
systemctl restart coturn
systemctl enable coturn

# Create monitoring script
cat > /usr/local/bin/turn-monitor.sh <<'MONITOR'
#!/bin/bash
# TURN Server Monitoring Script

echo "=== TURN Server Status ==="
echo "Date: $(date)"
echo ""

echo "Coturn Status:"
systemctl status coturn --no-pager | grep Active
echo ""

echo "Active Connections:"
netstat -an | grep :3478 | wc -l
echo ""

echo "Memory Usage:"
free -h
echo ""

echo "Disk Usage:"
df -h / | tail -1
echo ""

echo "Recent Errors (if any):"
tail -20 /var/log/turnserver.log | grep -i error || echo "No errors"
MONITOR

chmod +x /usr/local/bin/turn-monitor.sh

# Create cron job for monitoring
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/turn-monitor.sh >> /var/log/turn-monitor.log 2>&1") | crontab -

# Save setup info
cat > /root/turn-server-info.txt <<INFO
KAMINSKYI TURN SERVER
=====================
Environment: ${environment}
Public IP: $PUBLIC_IP
Username: ${turn_username}
Password: ${turn_password}

TURN URLs:
- turn:$PUBLIC_IP:3478?transport=udp
- turn:$PUBLIC_IP:3478?transport=tcp
- turns:$PUBLIC_IP:5349?transport=tcp (after SSL setup)

DNS Setup Required:
- Add A record: turn.kaminskyi.ai -> $PUBLIC_IP

SSL Certificate Setup:
1. Configure DNS first
2. Run: certbot certonly --standalone -d turn.kaminskyi.ai
3. Uncomment SSL lines in /etc/turnserver.conf
4. Restart: systemctl restart coturn

Monitoring:
- Status: systemctl status coturn
- Logs: tail -f /var/log/turnserver.log
- Monitor: /usr/local/bin/turn-monitor.sh

Generated: $(date)
INFO

chmod 600 /root/turn-server-info.txt

echo ""
echo "=== SETUP COMPLETE ==="
echo "Server Info saved to: /root/turn-server-info.txt"
echo ""
cat /root/turn-server-info.txt
echo ""
echo "✅ TURN server is ready!"
echo "⚠️  Remember to set up DNS and SSL certificates"
