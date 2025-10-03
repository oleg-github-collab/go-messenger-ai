#!/bin/bash
set -e

# ==================================================
# KAMINSKYI MESSENGER - DEPLOYMENT SCRIPT
# Deploy to Digital Ocean
# ==================================================

cd "$(dirname "$0")"
PROJECT_ROOT="$(cd .. && pwd)"

echo "=== KAMINSKYI MESSENGER DEPLOYMENT ==="
echo ""

# Check if credentials are loaded
if [ -z "$TF_VAR_do_token" ]; then
    echo "❌ Error: Credentials not loaded!"
    echo ""
    echo "Run: source infrastructure/secrets/credentials.env"
    exit 1
fi

# Get app server IP from terraform
cd digitalocean
APP_SERVER_IP=$(terraform output -raw app_server_ip 2>/dev/null)

if [ -z "$APP_SERVER_IP" ]; then
    echo "❌ Error: Could not get app server IP from terraform"
    echo "Make sure you've run 'terraform apply' first"
    exit 1
fi

echo "📦 Building application..."
cd "$PROJECT_ROOT"

# Build for Linux
GOOS=linux GOARCH=amd64 go build -o main \
    -ldflags="-s -w" \
    -trimpath \
    .

if [ ! -f "main" ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build complete"
echo ""

echo "📤 Preparing deployment package..."

# Create temporary deploy directory
rm -rf /tmp/messenger-deploy
mkdir -p /tmp/messenger-deploy

# Copy binary
cp main /tmp/messenger-deploy/

# Copy static files
cp -r static /tmp/messenger-deploy/

echo "✅ Package ready"
echo ""

echo "🚀 Uploading to server: $APP_SERVER_IP"

# Upload via SSH
ssh -o StrictHostKeyChecking=no root@$APP_SERVER_IP "mkdir -p /opt/messenger/deploy"

scp -r /tmp/messenger-deploy/* root@$APP_SERVER_IP:/opt/messenger/deploy/

echo "✅ Upload complete"
echo ""

echo "⚙️  Deploying on server..."

# Run deployment script on server
ssh root@$APP_SERVER_IP "/usr/local/bin/deploy-messenger.sh"

echo ""
echo "=============================================="
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "=============================================="
echo ""
echo "Application URL: http://$APP_SERVER_IP"
echo ""
echo "Check status: ssh root@$APP_SERVER_IP 'systemctl status messenger'"
echo "View logs: ssh root@$APP_SERVER_IP 'journalctl -u messenger -f'"
echo "Monitor: ssh root@$APP_SERVER_IP '/usr/local/bin/messenger-monitor.sh'"
echo ""
echo "⚠️  Don't forget to:"
echo "  1. Point your domain to: $APP_SERVER_IP"
echo "  2. Setup SSL: ssh root@$APP_SERVER_IP 'certbot --nginx -d yourdomain.com'"
echo ""

# Cleanup
rm -rf /tmp/messenger-deploy
rm -f "$PROJECT_ROOT/main"
