# Kaminskyi AI Messenger

Production-ready 1-on-1 video messenger with WebRTC, Redis, and Railway deployment.

## Features

- 🎥 **HD Video Calls** - 1-on-1 video meetings with WebRTC
- 🔐 **Host Authentication** - Secure login for meeting host
- 👥 **Guest Access** - Join via link without authentication
- 🔗 **Share Links** - Email, SMS, WhatsApp sharing
- ⏰ **8-Hour TTL** - Meetings expire after 8 hours
- 💬 **Live Chat** - Text messaging during calls
- 📱 **Mobile Optimized** - Works on all devices
- 🌐 **Picture-in-Picture** - Background video calls

## Quick Start

### Railway Deployment

1. **Create Railway Project**
   ```bash
   railway init
   ```

2. **Add Redis Database**
   - Go to Railway dashboard
   - Click "New" → "Database" → "Add Redis"
   - Redis URL will be auto-configured

3. **Deploy**
   ```bash
   railway up
   ```

4. **Environment Variables** (Auto-configured by Railway)
   - `REDIS_URL` - Redis connection string
   - `PORT` - Application port (default: 8080)

### Local Development

1. **Start Redis**
   ```bash
   docker run -d -p 6379:6379 redis:alpine
   ```

2. **Set Environment**
   ```bash
   export REDIS_URL="redis://localhost:6379"
   export PORT=8080
   ```

3. **Run Application**
   ```bash
   go run main.go
   ```

4. **Access**
   - Host: http://localhost:8080/login
   - Guest: http://localhost:8080/join/{roomID}

## Host Credentials

- **Username**: `Oleh`
- **Password**: `QwertY24$`

## Architecture

- **Backend**: Go 1.21 with Gorilla WebSocket
- **Database**: Redis (sessions + meetings)
- **WebRTC**: Peer-to-peer with ICE/STUN
- **Frontend**: Vanilla JavaScript + CSS3
- **Deployment**: Railway + Docker

## Session Management

- **Host Sessions**: 24-hour TTL with HTTP-only cookies
- **Meetings**: 8-hour TTL with Redis expiration
- **Guest Access**: No authentication required

## API Endpoints

### Host (Protected)
- `GET /` - Home page
- `GET /create` - Create meeting
- `POST /end` - Terminate meeting
- `GET /logout` - Logout

### Guest (Public)
- `GET /join/{roomID}` - Guest entry page
- `GET /room/{roomID}` - Meeting room
- `WS /ws?room={id}&name={name}` - WebSocket signaling

## WebRTC Signaling

Messages exchanged via WebSocket:
- `join` - User joins room
- `offer` - WebRTC offer
- `answer` - WebRTC answer
- `ice-candidate` - ICE candidates
- `chat` - Text message
- `leave` - User disconnects

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Android)

## License

Private project - All rights reserved
