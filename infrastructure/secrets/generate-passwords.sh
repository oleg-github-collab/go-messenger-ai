#!/bin/bash
# Generate secure passwords for all services

echo "=== KAMINSKYI MESSENGER - SECURE PASSWORDS ==="
echo "Generated on: $(date)"
echo ""

# TURN Server Password
TURN_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
echo "TURN_PASSWORD=$TURN_PASSWORD"

# TURN Username
TURN_USERNAME="kaminskyi-$(openssl rand -hex 8)"
echo "TURN_USERNAME=$TURN_USERNAME"

# Redis Password
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
echo "REDIS_PASSWORD=$REDIS_PASSWORD"

# JWT Secret
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
echo "JWT_SECRET=$JWT_SECRET"

# Session Secret
SESSION_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
echo "SESSION_SECRET=$SESSION_SECRET"

# Host Password (secure admin password)
HOST_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-24)
echo "HOST_PASSWORD=$HOST_PASSWORD"

# API Key for monitoring
API_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
echo "API_KEY=$API_KEY"

echo ""
echo "=== COPY THESE TO YOUR .env FILE ==="
echo ""
echo "# Railway / Production"
echo "TURN_SERVER=turn:YOUR_DIGITALOCEAN_IP:3478"
echo "TURN_USERNAME=$TURN_USERNAME"
echo "TURN_PASSWORD=$TURN_PASSWORD"
echo "REDIS_URL=redis://:$REDIS_PASSWORD@YOUR_REDIS_HOST:6379"
echo "JWT_SECRET=$JWT_SECRET"
echo "SESSION_SECRET=$SESSION_SECRET"
echo "HOST_USERNAME=oleh"
echo "HOST_PASSWORD=$HOST_PASSWORD"
echo "API_KEY=$API_KEY"
echo ""
echo "⚠️  SAVE THESE PASSWORDS SECURELY - THEY WON'T BE SHOWN AGAIN!"
