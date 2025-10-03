#!/bin/bash

# Generate secure passwords for Kaminskyi Messenger infrastructure

echo "=== Generating secure passwords ==="
echo ""

# Generate TURN credentials
TURN_USERNAME="kaminskyi-$(openssl rand -hex 8)"
TURN_PASSWORD=$(openssl rand -base64 24)

# Generate Redis password
REDIS_PASSWORD=$(openssl rand -base64 32)

# Save to file
cat > secrets/credentials.env <<EOF
# Kaminskyi Messenger Credentials
# Generated: $(date)
# KEEP THIS FILE SECURE!

# DigitalOcean
export DO_TOKEN="${DO_TOKEN:-YOUR_DO_TOKEN_HERE}"

# SSH Key Fingerprint (get with: doctl compute ssh-key list)
export TF_VAR_ssh_key_fingerprint="${SSH_KEY_FINGERPRINT:-YOUR_SSH_KEY_FINGERPRINT}"

# TURN Server
export TF_VAR_turn_username="$TURN_USERNAME"
export TF_VAR_turn_password="$TURN_PASSWORD"

# Redis
export TF_VAR_redis_password="$REDIS_PASSWORD"

# Terraform (for convenience)
export TF_VAR_do_token="\$DO_TOKEN"
EOF

chmod 600 secrets/credentials.env

echo "✅ Passwords generated and saved to: secrets/credentials.env"
echo ""
echo "To use them, run:"
echo "  source infrastructure/secrets/credentials.env"
echo ""
echo "⚠️  IMPORTANT: Keep this file secure! Add to .gitignore"
