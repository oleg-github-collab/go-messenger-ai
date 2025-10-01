# 🏗️ ULTIMATE ARCHITECTURE - Kaminskyi AI Messenger Platform

## 🎯 ВИМОГИ ТА РЕАЛІЗАЦІЯ

### ✅ 1. ЛОКАЛЬНЕ ВІДЕО - ВИПРАВЛЕНО
- **Проблема:** Локальне відео не відображалось
- **Рішення:** Додано z-index та правильне позиціонування
- **Статус:** ВИПРАВЛЕНО ✅

### ✅ 2. АВТЕНТИФІКАЦІЯ ТІЛЬКИ ДЛЯ ХОСТА
- **Хост:** Oleh - єдиний з логіном/паролем
- **Гості:** БЕЗ логіну - тільки ім'я
- **Реалізація:**
  - `/login` - тільки для хоста
  - `/join/{roomID}` - для гостей (ім'я + налаштування медіа)
  - Автоматичний редірект в браузер

### ✅ 3. ГОСТЬОВИЙ ВХІД
**Створено:** `guest.html`, `guest.css`, `guest.js`

**Функції:**
- ✅ Введення імені
- ✅ Вибір: камера ON/OFF
- ✅ Вибір: мікрофон ON/OFF
- ✅ Preview відео перед входом
- ✅ Вибір камери/мікрофону
- ✅ Красивий анімований інтерфейс

### 🔗 4. ПОШИРЕННЯ ПОСИЛАННЯ (TODO)
**Додати в home.html:**
```
┌─────────────────────────────────────┐
│  Meeting Link                        │
│  https://app.railway.app/room/xyz   │
│  [📋 Copy]  [✉️ Email]  [📱 SMS]    │
└─────────────────────────────────────┘
```

**Функції:**
- Copy to clipboard
- Share via email
- Share via SMS (mobile)
- QR code generation
- Link expiration warning

---

## 🗄️ REDIS НА RAILWAY

### Налаштування Redis:
1. Railway Dashboard → New → Database → Redis
2. Отримати `REDIS_URL` з Variables
3. Підключити в Go:

```go
import "github.com/redis/go-redis/v9"

rdb := redis.NewClient(&redis.Options{
    Addr: os.Getenv("REDIS_URL"),
})
```

### Використання Redis:

#### 1. Сесії Дзвінків (TTL: 8 годин)
```
Key: meeting:{roomID}
Value: {
    "host": "user_123",
    "created": "2025-10-01T10:00:00Z",
    "participants": ["guest_456", "guest_789"],
    "active": true
}
TTL: 28800 (8 hours)
```

#### 2. Учасники
```
Key: participant:{userID}
Value: {
    "name": "John Doe",
    "roomID": "xyz-789",
    "joinedAt": "2025-10-01T10:05:00Z",
    "isHost": false,
    "video": true,
    "audio": true
}
TTL: 28800
```

#### 3. WebRTC ICE Candidates (короткотривалі)
```
Key: ice:{roomID}:{userID}
Value: [candidate1, candidate2, ...]
TTL: 300 (5 minutes)
```

#### 4. Reconnect Tokens
```
Key: reconnect:{token}
Value: {
    "userID": "user_123",
    "roomID": "xyz-789",
    "expiresAt": "2025-10-01T18:00:00Z"
}
TTL: 60 (1 minute для швидкого реконекту)
```

---

## ⏱️ 8-ГОДИННЕ З'ЄДНАННЯ

### Стратегія Стабільності:

#### 1. WebSocket Keep-Alive
```javascript
// Ping every 30 seconds
setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }));
    }
}, 30000);
```

#### 2. Automatic Reconnection
```javascript
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 50; // ~25 хвилин спроб

socket.onclose = () => {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        setTimeout(() => {
            reconnect();
            reconnectAttempts++;
        }, 30000); // Спроба кожні 30 секунд
    }
};
```

#### 3. WebRTC ICE Restart
```javascript
peerConnection.oniceconnectionstatechange = () => {
    if (peerConnection.iceConnectionState === 'disconnected') {
        // Restart ICE
        peerConnection.createOffer({ iceRestart: true })
            .then(offer => peerConnection.setLocalDescription(offer))
            .then(() => sendSignal('offer', offer));
    }
};
```

#### 4. Network Quality Monitoring
```javascript
const stats = await peerConnection.getStats();
stats.forEach(report => {
    if (report.type === 'inbound-rtp') {
        const packetLoss = report.packetsLost / report.packetsReceived;
        if (packetLoss > 0.1) {
            // Reduce quality автоматично
            reduceQuality();
        }
    }
});
```

---

## 🔄 DIGITALOCEAN TURN/STUN AUTOMATION

### 1. Створення Droplet (Terraform)

**File:** `infrastructure/digitalocean/turn-server.tf`

```hcl
terraform {
  required_providers {
    digitalocean = {
      source = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

resource "digitalocean_droplet" "turn_server" {
  image  = "ubuntu-22-04-x64"
  name   = "kaminskyi-turn-${var.environment}"
  region = "fra1"  # Frankfurt (близько до України)
  size   = "s-2vcpu-4gb"  # Для 20 учасників

  ssh_keys = [var.ssh_key_id]

  user_data = file("${path.module}/turn-setup.sh")

  tags = ["turn-server", "production"]
}

resource "digitalocean_firewall" "turn_firewall" {
  name = "turn-server-firewall"

  droplet_ids = [digitalocean_droplet.turn_server.id]

  # TURN TCP
  inbound_rule {
    protocol         = "tcp"
    port_range       = "3478"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # TURN UDP
  inbound_rule {
    protocol         = "udp"
    port_range       = "3478"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # TURN TLS
  inbound_rule {
    protocol         = "tcp"
    port_range       = "5349"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # RTP/RTCP Range
  inbound_rule {
    protocol         = "udp"
    port_range       = "49152-65535"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # SSH
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = [var.admin_ip]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range           = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range           = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

output "turn_server_ip" {
  value = digitalocean_droplet.turn_server.ipv4_address
}
```

### 2. TURN Server Setup Script

**File:** `infrastructure/digitalocean/turn-setup.sh`

```bash
#!/bin/bash

# Update system
apt-get update && apt-get upgrade -y

# Install coturn (TURN server)
apt-get install -y coturn certbot

# Enable coturn
sed -i 's/#TURNSERVER_ENABLED=1/TURNSERVER_ENABLED=1/' /etc/default/coturn

# Configure coturn
cat > /etc/turnserver.conf <<EOF
# Listening IP
listening-ip=0.0.0.0
relay-ip=\$(curl -s http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address)

# External IP for NAT
external-ip=\$(curl -s http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address)

# Ports
listening-port=3478
tls-listening-port=5349
min-port=49152
max-port=65535

# Authentication
lt-cred-mech
user=kaminskyi:STRONG_RANDOM_PASSWORD_HERE
realm=turn.kaminskyi.ai

# SSL Certificates (після налаштування DNS)
# cert=/etc/letsencrypt/live/turn.kaminskyi.ai/fullchain.pem
# pkey=/etc/letsencrypt/live/turn.kaminskyi.ai/privkey.pem

# Logging
log-file=/var/log/turnserver.log
verbose

# Performance
max-bps=1000000
bps-capacity=0
EOF

# Generate strong password
TURN_PASSWORD=\$(openssl rand -base64 32)
sed -i "s/STRONG_RANDOM_PASSWORD_HERE/\$TURN_PASSWORD/" /etc/turnserver.conf

# Save credentials
echo "TURN_PASSWORD=\$TURN_PASSWORD" > /root/turn-credentials.txt

# Start coturn
systemctl restart coturn
systemctl enable coturn

# Install monitoring
apt-get install -y prometheus-node-exporter

echo "TURN server setup complete!"
echo "Credentials saved in /root/turn-credentials.txt"
```

### 3. Auto-Scaling Logic

**File:** `infrastructure/scaling/turn-autoscale.go`

```go
package main

import (
    "context"
    "github.com/digitalocean/godo"
    "golang.org/x/oauth2"
)

type TURNScaler struct {
    client *godo.Client
    dropletID int
}

func (ts *TURNScaler) ShouldScale(activeConnections int) bool {
    // Scale up якщо:
    // 1. > 5 активних з'єднань
    // 2. P2P не працює (обидва за NAT)
    return activeConnections > 5
}

func (ts *TURNScaler) PowerOn() error {
    ctx := context.Background()

    // Check if already running
    droplet, _, err := ts.client.Droplets.Get(ctx, ts.dropletID)
    if err != nil {
        return err
    }

    if droplet.Status == "active" {
        return nil // Already running
    }

    // Power on
    _, _, err = ts.client.DropletActions.PowerOn(ctx, ts.dropletID)
    return err
}

func (ts *TURNScaler) PowerOff() error {
    ctx := context.Background()

    // Power off after 10 minutes of inactivity
    _, _, err := ts.client.DropletActions.PowerOff(ctx, ts.dropletID)
    return err
}
```

### 4. WebRTC Config з Fallback

```javascript
const getTURNConfig = async () => {
    // Спочатку тільки STUN (Google)
    let config = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    // Якщо P2P не працює, додаємо TURN
    if (needsTURN) {
        const turnServer = await fetch('/api/turn-credentials');
        const creds = await turnServer.json();

        config.iceServers.push({
            urls: [
                `turn:${creds.host}:3478?transport=udp`,
                `turn:${creds.host}:3478?transport=tcp`,
                `turns:${creds.host}:5349?transport=tcp`
            ],
            username: creds.username,
            credential: creds.password
        });
    }

    return config;
};
```

---

## 👥 SFU ДЛЯ КОНФЕРЕНЦІЙ (ДО 20 ОСІБ)

### Архітектура SFU:

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Client  │────→│   SFU   │←────│ Client  │
│    1    │     │ Server  │     │    2    │
└─────────┘     └────┬────┘     └─────────┘
                     │
                ┌────┴────┐
                │ Client  │
                │    3    │
                └─────────┘
```

### Використання Pion WebRTC (Go):

**File:** `sfu/sfu-server.go`

```go
package sfu

import (
    "github.com/pion/webrtc/v3"
    "sync"
)

type SFUServer struct {
    rooms map[string]*SFURoom
    mu    sync.RWMutex
}

type SFURoom struct {
    participants map[string]*Participant
    mu           sync.RWMutex
}

type Participant struct {
    ID             string
    Name           string
    PeerConnection *webrtc.PeerConnection
    Tracks         []*webrtc.TrackLocalStaticRTP
}

func (s *SFUServer) AddParticipant(roomID, participantID string) {
    s.mu.Lock()
    defer s.mu.Unlock()

    room, exists := s.rooms[roomID]
    if !exists {
        room = &SFURoom{
            participants: make(map[string]*Participant),
        }
        s.rooms[roomID] = room
    }

    // Create peer connection
    peerConnection, err := webrtc.NewPeerConnection(webrtc.Configuration{
        ICEServers: []webrtc.ICEServer{
            {URLs: []string{"stun:stun.l.google.com:19302"}},
        },
    })

    participant := &Participant{
        ID:             participantID,
        PeerConnection: peerConnection,
        Tracks:         make([]*webrtc.TrackLocalStaticRTP, 0),
    }

    // Handle incoming tracks
    peerConnection.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
        // Forward this track to all other participants
        room.broadcastTrack(track, participantID)
    })

    room.mu.Lock()
    room.participants[participantID] = participant
    room.mu.Unlock()
}

func (r *SFURoom) broadcastTrack(track *webrtc.TrackRemote, excludeID string) {
    r.mu.RLock()
    defer r.mu.RUnlock()

    // Create local track for forwarding
    localTrack, err := webrtc.NewTrackLocalStaticRTP(
        track.Codec().RTPCodecCapability,
        track.ID(),
        track.StreamID(),
    )

    // Add to all other participants
    for id, participant := range r.participants {
        if id == excludeID {
            continue
        }

        _, err := participant.PeerConnection.AddTrack(localTrack)
        if err != nil {
            log.Printf("Failed to add track: %v", err)
        }
    }

    // Forward RTP packets
    go func() {
        rtpBuf := make([]byte, 1500)
        for {
            i, _, err := track.Read(rtpBuf)
            if err != nil {
                return
            }

            if _, err = localTrack.Write(rtpBuf[:i]); err != nil {
                return
            }
        }
    }()
}
```

### Adaptive Grid Layout:

**CSS для сітки:**
```css
.participants-grid {
    display: grid;
    gap: 8px;
    width: 100%;
    height: 100%;
    padding: 8px;
}

/* 1 person */
.participants-grid[data-count="1"] {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
}

/* 2 people */
.participants-grid[data-count="2"] {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: 1fr;
}

/* 3-4 people */
.participants-grid[data-count="3"],
.participants-grid[data-count="4"] {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
}

/* 5-9 people */
.participants-grid[data-count="5"],
.participants-grid[data-count="6"],
.participants-grid[data-count="7"],
.participants-grid[data-count="8"],
.participants-grid[data-count="9"] {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
}

/* 10-16 people */
.participants-grid[data-count="10"],
.participants-grid[data-count="16"] {
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(4, 1fr);
}

/* 17-20 people */
.participants-grid[data-count="17"],
.participants-grid[data-count="20"] {
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(4, 1fr);
}
```

---

## 🎛️ ХОСТ КОНТРОЛЬ ПАНЕЛЬ

### Функції для Хоста:

1. **Управління Учасниками:**
   - Список всіх учасників
   - Mute/Unmute будь-кого
   - Вимкнути відео будь-кому
   - Видалити учасника (kick)

2. **Управління Дзвінком:**
   - Завершити дзвінок для всіх
   - Lock meeting (заборонити нові входи)
   - Запис дзвінка (опціонально)
   - Поширити екран

3. **Статистика:**
   - Тривалість дзвінка
   - Якість з'єднання кожного
   - Використання bandwidth
   - Network quality indicators

---

## 🚀 CI/CD AUTOMATION

### GitHub Actions Workflow:

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-railway:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm install -g @railway/cli
          railway link ${{ secrets.RAILWAY_PROJECT_ID }}
          railway up --detach

  deploy-turn:
    runs-on: ubuntu-latest
    needs: [deploy-railway]
    steps:
      - uses: actions/checkout@v3

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2

      - name: Terraform Init
        working-directory: ./infrastructure/digitalocean
        run: terraform init

      - name: Terraform Apply
        working-directory: ./infrastructure/digitalocean
        env:
          TF_VAR_do_token: ${{ secrets.DIGITALOCEAN_TOKEN }}
        run: terraform apply -auto-approve
```

---

## 📊 МОНІТОРИНГ ТА АНАЛІТИКА

### Metrics to Track:

1. **Call Quality:**
   - Average packet loss
   - Jitter
   - Round-trip time (RTT)
   - Bitrate

2. **User Experience:**
   - Connection success rate
   - Reconnection frequency
   - Average call duration
   - Device distribution

3. **Infrastructure:**
   - TURN server usage
   - Railway CPU/Memory
   - Redis connections
   - WebSocket connections

---

## 📦 DEPLOYMENT CHECKLIST

- [ ] Railway: Go app deployed
- [ ] Railway: Redis instance created
- [ ] DigitalOcean: TURN server droplet
- [ ] DNS: turn.kaminskyi.ai → Droplet IP
- [ ] SSL: Certbot on TURN server
- [ ] GitHub Actions: CI/CD configured
- [ ] Monitoring: Logs aggregation
- [ ] Testing: Load test with 20 participants

---

**READY TO IMPLEMENT ALL OF THIS!** 🚀
