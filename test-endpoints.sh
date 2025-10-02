#!/bin/bash

# Test Endpoints Script
echo "🧪 Testing Kaminskyi AI Messenger Endpoints..."
echo ""

BASE_URL="http://localhost:8080"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=$3

    echo -n "Testing $name... "

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")

    if [ "$response" -eq "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_code, got $response)"
    fi
}

echo "📡 Basic Endpoints:"
test_endpoint "Home Page" "$BASE_URL/" 200
test_endpoint "Login Page" "$BASE_URL/login" 200
test_endpoint "Static Files" "$BASE_URL/static/home.js" 200

echo ""
echo "🔐 Authentication:"
test_endpoint "Login (no auth)" "$BASE_URL/home" 302
test_endpoint "TURN Credentials (no auth)" "$BASE_URL/api/turn-credentials" 401

echo ""
echo "🎥 WebRTC:"
# These should fail without auth but should exist
test_endpoint "Create Meeting (no auth)" "$BASE_URL/create?mode=1on1" 401
test_endpoint "WebSocket (should fail properly)" "$BASE_URL/ws" 400

echo ""
echo "✅ Testing complete!"
echo ""
echo "To test authenticated endpoints, login first at: $BASE_URL/login"
echo "Username: Oleh"
echo "Password: QwertY24$"
