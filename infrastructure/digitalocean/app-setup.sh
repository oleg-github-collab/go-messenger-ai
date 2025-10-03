#!/bin/bash
set -e

# ==================================================
# KAMINSKYI MESSENGER - APPLICATION SERVER SETUP
# Ultra-optimized for WebRTC performance
# ==================================================

echo "=== KAMINSKYI MESSENGER APP SERVER SETUP ==="
echo "Starting at: $(date)"

# ==================================================
# SETUP SSH KEY FIRST (before anything else)
# ==================================================
echo "Setting up SSH key..."
mkdir -p /root/.ssh
chmod 700 /root/.ssh

cat > /root/.ssh/authorized_keys << 'EOF'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAIaoikgpKK8y2hLpkuwHtzENYCt6SZHoeFBKWRoeJmn work.olegkaminskyi@gmail.com
EOF

chmod 600 /root/.ssh/authorized_keys
echo "✅ SSH key installed"

# Get server's public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address)
echo "Public IP: $PUBLIC_IP"

# Update system
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get upgrade -y

# Install essential packages
apt-get install -y \
    nginx \
    certbot \
    python3-certbot-nginx \
    redis-server \
    git \
    curl \
    wget \
    ufw \
    fail2ban \
    htop \
    iftop \
    netdata \
    prometheus-node-exporter \
    build-essential \
    supervisor

# ==================================================
# INSTALL GO 1.21
# ==================================================
echo "Installing Go 1.21..."
cd /tmp
wget -q https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
rm -rf /usr/local/go
tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile
export PATH=$PATH:/usr/local/go/bin

# ==================================================
# SYSTEM OPTIMIZATION FOR WEBRTC
# ==================================================
echo "Optimizing system for WebRTC..."

# Increase file descriptor limits
cat >> /etc/security/limits.conf <<EOF
* soft nofile 65536
* hard nofile 65536
root soft nofile 65536
root hard nofile 65536
EOF

# Kernel optimization for network performance
cat >> /etc/sysctl.conf <<EOF

# Kaminskyi Messenger Network Optimizations
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 87380 67108864
net.ipv4.tcp_wmem = 4096 65536 67108864
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_slow_start_after_idle = 0
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 10240 65535
net.core.somaxconn = 8192

# WebRTC UDP optimization
net.core.rmem_default = 26214400
net.core.wmem_default = 26214400
EOF

sysctl -p

# ==================================================
# CONFIGURE REDIS
# ==================================================
echo "Configuring Redis..."

# Generate Redis password if not provided
REDIS_PASSWORD="${redis_password}"
if [ -z "$REDIS_PASSWORD" ]; then
    REDIS_PASSWORD=$(openssl rand -base64 32)
fi

# Backup original config
cp /etc/redis/redis.conf /etc/redis/redis.conf.backup

# Configure Redis for optimal performance
cat > /etc/redis/redis.conf <<EOF
# Kaminskyi Messenger Redis Configuration

bind 127.0.0.1
protected-mode yes
port 6379

# Authentication
requirepass $REDIS_PASSWORD

# Performance
tcp-backlog 511
timeout 300
tcp-keepalive 300
daemonize yes
supervised systemd
pidfile /var/run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log

# Persistence
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# Memory management
maxmemory 512mb
maxmemory-policy allkeys-lru

# Append only file
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Slow log
slowlog-log-slower-than 10000
slowlog-max-len 128

# Latency monitor
latency-monitor-threshold 100
EOF

# Restart Redis
systemctl restart redis-server
systemctl enable redis-server

echo "Redis password: $REDIS_PASSWORD" > /root/redis-password.txt
chmod 600 /root/redis-password.txt

# ==================================================
# SETUP APPLICATION USER
# ==================================================
echo "Creating application user..."
useradd -m -s /bin/bash messenger
usermod -aG sudo messenger

# Create application directory
mkdir -p /opt/messenger
chown messenger:messenger /opt/messenger

# ==================================================
# CLONE AND BUILD APPLICATION
# ==================================================
echo "Setting up application..."
cd /opt/messenger

# For now, we'll create placeholder - actual deploy will use git or upload
mkdir -p /opt/messenger/app
mkdir -p /opt/messenger/logs
mkdir -p /opt/messenger/static

# Create systemd service
cat > /etc/systemd/system/messenger.service <<EOF
[Unit]
Description=Kaminskyi Messenger WebRTC Application
After=network.target redis-server.service

[Service]
Type=simple
User=messenger
WorkingDirectory=/opt/messenger/app
Environment="PORT=8080"
Environment="REDIS_ADDR=127.0.0.1:6379"
Environment="REDIS_PASSWORD=$REDIS_PASSWORD"
Environment="TURN_SERVER=${turn_server_ip}:3478"
Environment="TURN_USERNAME=${turn_username}"
Environment="TURN_PASSWORD=${turn_password}"
Environment="ENV=${environment}"
ExecStart=/opt/messenger/app/main
Restart=always
RestartSec=5
StandardOutput=append:/opt/messenger/logs/app.log
StandardError=append:/opt/messenger/logs/error.log

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/messenger/logs

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

# ==================================================
# CONFIGURE NGINX
# ==================================================
echo "Configuring Nginx..."

# Optimize nginx for WebRTC
cat > /etc/nginx/nginx.conf <<'NGINX_CONF'
user www-data;
worker_processes auto;
worker_rlimit_nofile 65535;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # File upload size for media
    client_max_body_size 100M;
    client_body_buffer_size 1M;
    client_body_timeout 15s;
    client_header_timeout 15s;

    # MIME types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log warn;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=websocket:10m rate=100r/s;
    limit_conn_zone $binary_remote_addr zone=addr:10m;

    # Include site configs
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
NGINX_CONF

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Create app config (without SSL - will be added after domain setup)
cat > /etc/nginx/sites-available/messenger <<'NGINX_SITE'
upstream messenger_backend {
    server 127.0.0.1:8080;
    keepalive 32;
}

server {
    listen 80;
    server_name _;

    root /opt/messenger/app/static;
    index index.html;

    # Security limits
    limit_req zone=general burst=20 nodelay;
    limit_conn addr 10;

    # Logging
    access_log /var/log/nginx/messenger-access.log;
    error_log /var/log/nginx/messenger-error.log;

    # Static files
    location /static/ {
        alias /opt/messenger/app/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";

        # CORS for media
        add_header Access-Control-Allow-Origin *;
    }

    # WebSocket connections (critical for real-time)
    location /ws {
        limit_req zone=websocket burst=50 nodelay;

        proxy_pass http://messenger_backend;
        proxy_http_version 1.1;

        # WebSocket headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for long connections
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;

        # Buffering off for real-time
        proxy_buffering off;
        proxy_cache off;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://messenger_backend;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";

        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Main app
    location / {
        proxy_pass http://messenger_backend;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
NGINX_SITE

ln -sf /etc/nginx/sites-available/messenger /etc/nginx/sites-enabled/

# Test nginx config
nginx -t

# Start nginx
systemctl restart nginx
systemctl enable nginx

# ==================================================
# CONFIGURE FIREWALL
# ==================================================
echo "Configuring UFW..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp

# ==================================================
# SETUP MONITORING
# ==================================================
echo "Setting up monitoring..."

# Configure netdata
cat > /etc/netdata/netdata.conf <<EOF
[global]
    run as user = netdata
    web files owner = root
    web files group = root
    bind socket to IP = 127.0.0.1
    default port = 19999
    memory mode = dbengine
    page cache size = 32
    dbengine disk space = 256
EOF

systemctl restart netdata
systemctl enable netdata

# Create monitoring script
cat > /usr/local/bin/messenger-monitor.sh <<'MONITOR'
#!/bin/bash
# Messenger Monitoring Script

echo "=== MESSENGER SERVER STATUS ==="
echo "Date: $(date)"
echo ""

echo "Application Status:"
systemctl status messenger --no-pager | grep Active
echo ""

echo "Active WebSocket Connections:"
netstat -an | grep :8080 | grep ESTABLISHED | wc -l
echo ""

echo "Redis Status:"
systemctl status redis-server --no-pager | grep Active
echo ""

echo "Nginx Status:"
systemctl status nginx --no-pager | grep Active
echo ""

echo "Memory Usage:"
free -h
echo ""

echo "Disk Usage:"
df -h / | tail -1
echo ""

echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}'
echo ""

echo "Recent Application Errors (if any):"
tail -20 /opt/messenger/logs/error.log 2>/dev/null | grep -i error || echo "No errors"
MONITOR

chmod +x /usr/local/bin/messenger-monitor.sh

# Setup log rotation
cat > /etc/logrotate.d/messenger <<EOF
/opt/messenger/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 messenger messenger
    sharedscripts
    postrotate
        systemctl reload messenger > /dev/null 2>&1 || true
    endscript
}
EOF

# ==================================================
# CREATE DEPLOYMENT SCRIPT
# ==================================================
cat > /usr/local/bin/deploy-messenger.sh <<'DEPLOY'
#!/bin/bash
set -e

echo "=== DEPLOYING KAMINSKYI MESSENGER ==="

cd /opt/messenger

# Stop application
systemctl stop messenger || true

# Backup current version
if [ -d "app" ]; then
    cp -r app app.backup.$(date +%Y%m%d-%H%M%S)
fi

# This script expects the binary and static files to be uploaded
# to /opt/messenger/deploy/ directory before running

if [ -d "deploy" ]; then
    echo "Deploying new version..."
    rm -rf app
    mv deploy app
    chown -R messenger:messenger app
    chmod +x app/main
else
    echo "ERROR: No deploy directory found!"
    echo "Upload files to /opt/messenger/deploy/ first"
    exit 1
fi

# Start application
systemctl start messenger
systemctl status messenger

echo "✅ Deployment complete!"
echo "Check logs: journalctl -u messenger -f"
DEPLOY

chmod +x /usr/local/bin/deploy-messenger.sh

# ==================================================
# SAVE SERVER INFO
# ==================================================
cat > /root/messenger-server-info.txt <<INFO
KAMINSKYI MESSENGER - APPLICATION SERVER
========================================
Environment: ${environment}
Public IP: $PUBLIC_IP
TURN Server: ${turn_server_ip}

Redis:
  Host: 127.0.0.1:6379
  Password: $REDIS_PASSWORD

Application:
  Directory: /opt/messenger/app
  Logs: /opt/messenger/logs
  Service: messenger.service

Deployment:
1. Upload binary and static files to: /opt/messenger/deploy/
2. Run: /usr/local/bin/deploy-messenger.sh

SSL/Domain Setup:
1. Point domain A record to: $PUBLIC_IP
2. Run: certbot --nginx -d yourdomain.com -d www.yourdomain.com
3. Certbot will auto-configure nginx for HTTPS

Monitoring:
  Status: /usr/local/bin/messenger-monitor.sh
  Netdata: http://$PUBLIC_IP:19999 (localhost only)
  Logs: journalctl -u messenger -f

Useful Commands:
  systemctl status messenger
  systemctl restart messenger
  nginx -t && systemctl reload nginx
  tail -f /opt/messenger/logs/app.log

Generated: $(date)
INFO

chmod 600 /root/messenger-server-info.txt

echo ""
echo "=============================================="
echo "✅ APPLICATION SERVER SETUP COMPLETE!"
echo "=============================================="
echo ""
cat /root/messenger-server-info.txt
echo ""
echo "Next steps:"
echo "1. Deploy application: Upload files and run /usr/local/bin/deploy-messenger.sh"
echo "2. Configure domain: Point DNS to $PUBLIC_IP"
echo "3. Setup SSL: Run certbot --nginx -d yourdomain.com"
echo ""
