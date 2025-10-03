#!/bin/bash

# Check if servers are ready after cloud-init

echo "=== Checking Kaminskyi Messenger Servers ==="
echo ""

APP_IP="134.199.188.251"
TURN_IP="209.38.115.168"

echo "📱 Application Server: $APP_IP"
echo "-------------------------------------------"

# Try to SSH and check if setup is complete
ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@$APP_IP "
    if [ -f /root/messenger-server-info.txt ]; then
        echo '✅ Setup COMPLETE'
        echo ''
        echo 'Services status:'
        systemctl is-active nginx && echo '  ✅ Nginx running' || echo '  ❌ Nginx not running'
        systemctl is-active redis-server && echo '  ✅ Redis running' || echo '  ❌ Redis not running'
        systemctl is-active netdata && echo '  ✅ Netdata running' || echo '  ❌ Netdata not running'
        echo ''
        echo 'Ready for deployment!'
    else
        echo '⏳ Still setting up...'
        echo ''
        echo 'Last 10 lines from cloud-init:'
        tail -n 10 /var/log/cloud-init-output.log 2>/dev/null || echo 'Log not available yet'
    fi
" 2>/dev/null || echo "❌ Cannot connect yet (server still booting)"

echo ""
echo "🔄 TURN Server: $TURN_IP"
echo "-------------------------------------------"

ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@$TURN_IP "
    if [ -f /root/turn-server-info.txt ]; then
        echo '✅ Setup COMPLETE'
        echo ''
        echo 'Services status:'
        systemctl is-active coturn && echo '  ✅ Coturn running' || echo '  ❌ Coturn not running'
        systemctl is-active ufw && echo '  ✅ Firewall active' || echo '  ❌ Firewall not active'
        echo ''
        echo 'Ready for SSL setup!'
    else
        echo '⏳ Still setting up...'
        echo ''
        echo 'Last 10 lines from cloud-init:'
        tail -n 10 /var/log/cloud-init-output.log 2>/dev/null || echo 'Log not available yet'
    fi
" 2>/dev/null || echo "❌ Cannot connect yet (server still booting)"

echo ""
echo "=============================================="
echo ""
echo "If servers show '⏳ Still setting up...', wait a few minutes and run again:"
echo "  ./infrastructure/check-servers.sh"
echo ""
echo "Once both show '✅ Setup COMPLETE':"
echo "  1. Configure DNS for your domain"
echo "  2. Setup SSL certificates"
echo "  3. Deploy app with: ./infrastructure/deploy.sh"
echo ""
