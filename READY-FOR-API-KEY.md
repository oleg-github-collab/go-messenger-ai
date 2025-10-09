# ✅ Ready for Daily.co API Key

**Status:** All code implemented, waiting for API key
**Date:** 2025-10-09

---

## 🎉 What's Been Done

### ✅ Backend Implementation (Complete)

#### Data Models
- ✅ `internal/models/meeting.go` - Meeting & room structures
- ✅ `internal/models/transcript.go` - Transcript & insights models

#### Daily.co Integration
- ✅ `internal/daily/client.go` - Full API client
  - CreateRoom()
  - GetRoom()
  - DeleteRoom()
  - CreateMeetingToken()
- ✅ `internal/daily/webhook.go` - Webhook handler
  - Signature verification
  - Recording events
  - Error handling

#### Transcript Processing
- ✅ `internal/transcript/processor.go` - Main processor
  - Download recordings
  - Whisper API integration
  - Speaker color assignment
  - Redis storage
- ✅ `internal/transcript/insights.go` - GPT-4o analysis
  - Full transcript analysis
  - Role-specific presets
  - Action items extraction

#### Audio Calls
- ✅ `internal/audio/handler.go` - 1-on-1 audio handler
  - WebSocket signaling
  - P2P WebRTC
  - Room management

### ✅ Frontend Implementation (Complete)

#### JavaScript Modules
- ✅ `static/js/daily-video-call.js` - Daily.co integration
  - Join/leave calls
  - Toggle camera/microphone
  - Screen sharing
  - Recording controls
- ✅ `static/js/audio-call.js` - Audio call module
  - P2P connection
  - WebRTC signaling
  - Mute controls

### ✅ Configuration
- ✅ `.env.example` - Complete environment template
- ✅ Directory structure created
- ✅ Archive completed (old infrastructure safely stored)

---

## 🔑 Next Steps: Add API Keys

### 1. Get Daily.co API Key

```bash
# Go to Daily.co dashboard
open https://dashboard.daily.co/signup

# Steps:
1. Sign up / Log in
2. Navigate to: Dashboard → Developers → API Keys
3. Click "Create API Key"
4. Copy the key (starts with: dop_v1_...)
5. Get your domain (e.g., kaminskyi-messenger.daily.co)
```

### 2. Create `.env` File

```bash
# Copy example file
cp .env.example .env

# Edit .env and add your keys
nano .env
```

Add these values:

```bash
# Daily.co Configuration
DAILY_API_KEY=dop_v1_YOUR_API_KEY_HERE
DAILY_DOMAIN=your-subdomain.daily.co
DAILY_WEBHOOK_SECRET=your_webhook_secret

# OpenAI Configuration (if you have it)
OPENAI_API_KEY=sk-YOUR_OPENAI_KEY_HERE
```

### 3. Update `main.go` with Integrations

You'll need to add the Daily.co integrations to `main.go`. Here's what to add:

```go
package main

import (
    // ... existing imports ...

    "messenger/internal/daily"
    "messenger/internal/audio"
    "messenger/internal/transcript"
    "messenger/internal/models"
)

var (
    // ... existing vars ...

    // New components
    dailyClient      *daily.Client
    dailyWebhook     *daily.WebhookHandler
    audioHandler     *audio.Handler
    transcriptProc   *transcript.Processor
)

func init() {
    // ... existing init ...

    // Initialize Daily.co client
    dailyClient = daily.NewClient()
    if dailyClient.IsConfigured() {
        log.Printf("[DAILY] ✅ Client configured")
    } else {
        log.Printf("[DAILY] ⚠️  Not configured (set DAILY_API_KEY)")
    }

    // Initialize webhook handler
    dailyWebhook = daily.NewWebhookHandler()

    // Initialize audio handler
    audioHandler = audio.NewHandler()

    // Initialize transcript processor
    transcriptProc = transcript.NewProcessor(rdb)

    // Setup webhook callback
    dailyWebhook.SetRecordingCallback(func(recording *models.RecordingWebhook) error {
        log.Printf("[WEBHOOK] Processing recording: %s", recording.RecordingID)

        // Process asynchronously
        go func() {
            transcript, err := transcriptProc.ProcessRecording(ctx, recording)
            if err != nil {
                log.Printf("[WEBHOOK] ❌ Failed to process: %v", err)
                return
            }
            log.Printf("[WEBHOOK] ✅ Transcript ready: %s", transcript.ID)
        }()

        return nil
    })
}

func main() {
    // ... existing code ...

    // Add new endpoints

    // Daily.co webhook
    http.HandleFunc("/api/daily/webhook", dailyWebhook.HandleWebhook)

    // Audio call WebSocket
    http.HandleFunc("/ws-audio", audioHandler.HandleWebSocket)

    // Update /create endpoint to support Daily.co
    http.HandleFunc("/create", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
        userID := r.Header.Get("X-User-ID")
        hostName := r.URL.Query().Get("name")
        if hostName == "" {
            hostName = "Host"
        }

        mode := r.URL.Query().Get("mode")
        if mode == "" {
            mode = "1on1"
        }

        // For GROUP calls, use Daily.co
        if mode == "group" {
            if !dailyClient.IsConfigured() {
                http.Error(w, "Daily.co not configured", http.StatusServiceUnavailable)
                return
            }

            roomName := fmt.Sprintf("meeting-%s", uuid.NewString()[:8])

            room, err := dailyClient.CreateRoom(daily.CreateRoomRequest{
                Name:            roomName,
                Privacy:         "public",
                EnableRecording: true,
                EnableChat:      true,
                EnableScreenShare: true,
                MaxParticipants: 20,
            })

            if err != nil {
                log.Printf("[CREATE] ❌ Failed to create Daily room: %v", err)
                http.Error(w, "Failed to create room", http.StatusInternalServerError)
                return
            }

            // Store meeting in Redis
            meetingID := uuid.NewString()
            storeMeeting(meetingID, userID, hostName, "group")

            // Map Daily room to meeting
            rdb.Set(ctx, fmt.Sprintf("daily_room:%s", meetingID), room.Name, 8*time.Hour)

            // Get public domain
            host := os.Getenv("PUBLIC_DOMAIN")
            if host == "" {
                host = r.Host
            }
            scheme := "https"
            if os.Getenv("PUBLIC_DOMAIN") == "" {
                scheme = "http"
                if r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" {
                    scheme = "https"
                }
            }

            joinURL := fmt.Sprintf("%s://%s/join/%s", scheme, host, meetingID)

            log.Printf("[CREATE] ✅ Group meeting: %s → %s", meetingID, room.URL)

            w.Header().Set("Content-Type", "application/json")
            json.NewEncoder(w).Encode(map[string]string{
                "meeting_id": meetingID,
                "daily_url":  room.URL,
                "join_url":   joinURL,
                "mode":       "group",
            })
            return
        }

        // For AUDIO calls, use our handler
        if mode == "audio" {
            roomID := audioHandler.CreateRoom()

            // Store in Redis
            storeMeeting(roomID, userID, hostName, "audio")

            host := os.Getenv("PUBLIC_DOMAIN")
            if host == "" {
                host = r.Host
            }
            scheme := "https"
            if os.Getenv("PUBLIC_DOMAIN") == "" {
                scheme = "http"
            }

            url := fmt.Sprintf("%s://%s/join/%s", scheme, host, roomID)

            log.Printf("[CREATE] ✅ Audio call: %s", roomID)

            w.Header().Set("Content-Type", "text/plain")
            w.Write([]byte(url))
            return
        }

        // For 1-on-1 video, use existing code
        // ... existing createRoom() logic ...
    }))

    // ... rest of main() ...
}
```

---

## 🧪 Testing

### 1. Test Daily.co Integration

```bash
# Start server
go run main.go

# Should see:
# [DAILY] ✅ Client configured
# [DAILY] ⚠️  Not configured (set DAILY_API_KEY)  ← Until you add key
```

### 2. Test API Key Works

```bash
# After adding DAILY_API_KEY to .env

# Restart server
go run main.go

# Create test room
curl -X POST http://localhost:8080/create?mode=group&name=TestHost \
  -H "Cookie: auth_token=YOUR_SESSION_TOKEN"

# Should return:
# {
#   "meeting_id": "abc-123",
#   "daily_url": "https://your-domain.daily.co/meeting-xyz",
#   "join_url": "http://localhost:8080/join/abc-123"
# }
```

### 3. Test Audio Calls

```bash
# Create audio call
curl -X POST http://localhost:8080/create?mode=audio&name=Host \
  -H "Cookie: auth_token=YOUR_SESSION_TOKEN"

# Should return join URL
# Open in 2 browser windows to test P2P audio
```

### 4. Test Webhook

```bash
# Test webhook handler
curl -X POST http://localhost:8080/api/daily/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "recording.ready",
    "room_name": "test-room",
    "recording_id": "rec_123",
    "download_link": "https://example.com/recording.mp4",
    "duration": 300
  }'

# Check logs for:
# [DAILY-WEBHOOK] 📨 Received event: recording.ready
# [WEBHOOK] Processing recording: rec_123
```

---

## 📋 Checklist Before Testing

- [ ] Daily.co account created
- [ ] API key copied
- [ ] `.env` file created with API key
- [ ] OpenAI API key added (for transcription)
- [ ] `main.go` updated with integrations
- [ ] Server restarted
- [ ] Test room creation works
- [ ] Test audio call works
- [ ] Webhook endpoint accessible

---

## 🔧 If You Get Errors

### "Daily.co not configured"
→ Check `.env` has `DAILY_API_KEY` set

### "Failed to create room"
→ Check API key is valid, check logs for detailed error

### "Webhook signature verification failed"
→ Set `DAILY_WEBHOOK_SECRET` in `.env` to match Daily.co dashboard

### Audio call connection fails
→ Check WebSocket endpoint (`/ws-audio`) is accessible
→ Check firewall allows WebSocket connections

---

## 🎯 Success Criteria

When everything works, you should be able to:

1. ✅ Create a group video meeting
2. ✅ Open Daily.co room in browser
3. ✅ Join with multiple participants
4. ✅ Start recording (if host)
5. ✅ Receive webhook when recording ready
6. ✅ Create 1-on-1 audio call
7. ✅ Connect two participants via WebRTC
8. ✅ Mute/unmute microphone

---

## 📚 Documentation

All implementation details are in:
- [START-HERE-DAILY-MIGRATION.md](START-HERE-DAILY-MIGRATION.md) - Full guide
- [DAILY-CO-MIGRATION-ARCHITECTURE.md](DAILY-CO-MIGRATION-ARCHITECTURE.md) - Architecture
- [TODO-NEXT.md](TODO-NEXT.md) - Step-by-step todos

---

## 🚀 After Testing Works

Next steps:
1. Create proper UI pages for video/audio calls
2. Add transcript viewer page
3. Deploy to Railway
4. Setup Daily.co webhook URL
5. Test end-to-end with real recordings

---

**Status:** ⏳ Waiting for API keys
**Next:** Add keys to `.env`, update `main.go`, test!

Good luck! 🎉
