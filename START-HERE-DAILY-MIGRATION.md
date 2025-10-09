# 🚀 START HERE: Daily.co Migration Guide

**Date:** 2025-10-09
**Status:** Ready to Begin

---

## ✅ Phase 1: Archive Complete

All old infrastructure has been safely archived to `/archive/` directory.
See `ARCHIVE-COMPLETE.md` for details.

---

## 🎯 Phase 2: Daily.co Integration (START HERE)

### Step 1: Create Daily.co Account

1. **Sign up:** https://dashboard.daily.co/signup
2. **Choose plan:**
   - Start with **Free tier** (10,000 minutes/month)
   - Upgrade to **Pro** later if needed ($99/mo for 50,000 min)
3. **Get API key:**
   - Dashboard → Developers → API Keys
   - Create new API key
   - Copy and save securely

### Step 2: Install Dependencies

```bash
# Frontend: Daily.co React/JS SDK
cd static/js
npm init -y
npm install @daily-co/daily-js

# Backend: HTTP client for Daily.co API
# (No Go package needed, use standard HTTP)
```

### Step 3: Environment Variables

Add to `.env`:

```bash
# Daily.co Configuration
DAILY_API_KEY=your_daily_api_key_here
DAILY_DOMAIN=your-subdomain.daily.co
DAILY_WEBHOOK_SECRET=your_webhook_secret

# Example:
# DAILY_API_KEY=abc123def456
# DAILY_DOMAIN=kaminskyi-messenger.daily.co
# DAILY_WEBHOOK_SECRET=webhook_secret_123
```

Add to Railway:

```bash
railway variables set DAILY_API_KEY=your_api_key
railway variables set DAILY_DOMAIN=your-subdomain.daily.co
railway variables set DAILY_WEBHOOK_SECRET=your_webhook_secret
```

### Step 4: Create Daily.co Client (Go)

Create `internal/daily/client.go`:

```go
package daily

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
    "time"
)

type Client struct {
    apiKey string
    domain string
    httpClient *http.Client
}

func NewClient() *Client {
    return &Client{
        apiKey: os.Getenv("DAILY_API_KEY"),
        domain: os.Getenv("DAILY_DOMAIN"),
        httpClient: &http.Client{Timeout: 10 * time.Second},
    }
}

type Room struct {
    Name       string                 `json:"name"`
    URL        string                 `json:"url"`
    Privacy    string                 `json:"privacy"` // "public" or "private"
    Properties map[string]interface{} `json:"properties"`
}

func (c *Client) CreateRoom(name string, enableRecording bool) (*Room, error) {
    url := "https://api.daily.co/v1/rooms"

    payload := map[string]interface{}{
        "name": name,
        "privacy": "public", // or "private" with tokens
        "properties": map[string]interface{}{
            "enable_recording": enableRecording,
            "start_video_off": false,
            "start_audio_off": false,
            "enable_chat": true,
            "enable_screenshare": true,
            "max_participants": 20,
        },
    }

    body, _ := json.Marshal(payload)
    req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer "+c.apiKey)

    resp, err := c.httpClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != 200 {
        return nil, fmt.Errorf("daily API error: %s", resp.Status)
    }

    var room Room
    json.NewDecoder(resp.Body).Decode(&room)
    return &room, nil
}

func (c *Client) DeleteRoom(name string) error {
    url := fmt.Sprintf("https://api.daily.co/v1/rooms/%s", name)
    req, _ := http.NewRequest("DELETE", url, nil)
    req.Header.Set("Authorization", "Bearer "+c.apiKey)

    resp, err := c.httpClient.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    if resp.StatusCode != 200 {
        return fmt.Errorf("failed to delete room: %s", resp.Status)
    }

    return nil
}
```

### Step 5: Update Main.go

Add to `main.go`:

```go
import "messenger/internal/daily"

var dailyClient *daily.Client

func init() {
    dailyClient = daily.NewClient()
}

// Update create meeting endpoint
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

    // For group calls, use Daily.co
    if mode == "group" {
        roomName := fmt.Sprintf("meeting-%s", uuid.NewString()[:8])
        room, err := dailyClient.CreateRoom(roomName, true) // enable recording
        if err != nil {
            http.Error(w, "Failed to create Daily.co room", http.StatusInternalServerError)
            return
        }

        // Store meeting in Redis
        meetingID := uuid.NewString()
        storeMeeting(meetingID, userID, hostName, "group")

        // Store Daily.co room mapping
        rdb.Set(ctx, fmt.Sprintf("daily_room:%s", meetingID), room.Name, 8*time.Hour)

        // Return Daily.co room URL
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]string{
            "meeting_id": meetingID,
            "daily_url": room.URL,
            "join_url": fmt.Sprintf("%s://%s/join/%s", scheme, host, meetingID),
        })
        return
    }

    // For 1-on-1 audio calls, use our WebRTC
    // ... existing code ...
}))
```

### Step 6: Create Frontend Integration

Create `static/js/daily/video-call.js`:

```javascript
// Daily.co Video Call Integration

class DailyVideoCall {
    constructor(dailyRoomUrl, userName) {
        this.roomUrl = dailyRoomUrl;
        this.userName = userName;
        this.callFrame = null;
    }

    async join(containerElement) {
        // Load Daily.co SDK
        if (!window.DailyIframe) {
            await this.loadDailySDK();
        }

        // Create call frame
        this.callFrame = window.DailyIframe.createFrame(containerElement, {
            iframeStyle: {
                width: '100%',
                height: '100%',
                border: '0',
                borderRadius: '8px'
            },
            showLeaveButton: true,
            showFullscreenButton: true,
            showLocalVideo: true,
            showParticipantsBar: true
        });

        // Join call
        await this.callFrame.join({
            url: this.roomUrl,
            userName: this.userName
        });

        // Setup event listeners
        this.setupEventListeners();
    }

    loadDailySDK() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@daily-co/daily-js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupEventListeners() {
        this.callFrame
            .on('joined-meeting', (event) => {
                console.log('Joined Daily.co meeting:', event);
            })
            .on('participant-joined', (event) => {
                console.log('Participant joined:', event.participant);
            })
            .on('participant-left', (event) => {
                console.log('Participant left:', event.participant);
            })
            .on('error', (event) => {
                console.error('Daily.co error:', event);
            });
    }

    leave() {
        if (this.callFrame) {
            this.callFrame.leave();
            this.callFrame.destroy();
        }
    }

    toggleCamera() {
        this.callFrame.setLocalVideo(!this.callFrame.localVideo());
    }

    toggleMicrophone() {
        this.callFrame.setLocalAudio(!this.callFrame.localAudio());
    }

    shareScreen() {
        this.callFrame.startScreenShare();
    }
}

// Usage example
const dailyCall = new DailyVideoCall(
    'https://kaminskyi-messenger.daily.co/meeting-abc123',
    'John Doe'
);

dailyCall.join(document.getElementById('video-container'));
```

### Step 7: Create Video Call Page

Update `static/video-call.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Video Call - Kaminskyi Messenger</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #1a1a2e;
            color: white;
        }

        #video-container {
            width: 100vw;
            height: 100vh;
        }

        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            flex-direction: column;
        }

        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid #4CAF50;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div id="loading" class="loading">
        <div class="spinner"></div>
        <h2>Loading video call...</h2>
    </div>

    <div id="video-container" style="display: none;"></div>

    <script src="/static/js/daily/video-call.js"></script>
    <script>
        // Get meeting info from URL
        const urlParams = new URLSearchParams(window.location.search);
        const meetingId = urlParams.get('meeting');
        const userName = localStorage.getItem('userName') || 'Guest';

        // Fetch Daily.co room URL from server
        fetch(`/api/meeting/${meetingId}`)
            .then(res => res.json())
            .then(data => {
                const dailyRoomUrl = data.daily_url;

                // Hide loading, show video container
                document.getElementById('loading').style.display = 'none';
                document.getElementById('video-container').style.display = 'block';

                // Join call
                const call = new DailyVideoCall(dailyRoomUrl, userName);
                call.join(document.getElementById('video-container'));
            })
            .catch(err => {
                alert('Failed to join call: ' + err.message);
            });
    </script>
</body>
</html>
```

### Step 8: Test Locally

```bash
# 1. Set environment variables
export DAILY_API_KEY=your_api_key
export DAILY_DOMAIN=your-subdomain.daily.co

# 2. Build and run
go build -o messenger .
./messenger

# 3. Test in browser
# - Create group meeting
# - Open link in 2+ browser windows
# - Verify video/audio works
```

---

## 🎤 Phase 3: 1-on-1 Audio Calls

### Keep Existing WebRTC Code

**Good news:** We can keep most of the existing 1-on-1 WebRTC code!

Just modify it to be **audio-only**:

1. Remove video track handling
2. Simplify UI (no video elements)
3. Use STUN only (no TURN needed for audio)

Create `static/js/audio/audio-call.js`:

```javascript
// Simple P2P audio call (no video)
class AudioCall {
    constructor(roomId, userName) {
        this.roomId = roomId;
        this.userName = userName;
        this.peerConnection = null;
        this.ws = null;
    }

    async start() {
        // Get user microphone (audio only)
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
        });

        // Create peer connection (STUN only, no TURN needed)
        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        });

        // Add audio track
        stream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, stream);
        });

        // WebSocket signaling
        this.ws = new WebSocket(`wss://${location.host}/ws-audio?room=${this.roomId}&name=${this.userName}`);

        // ... rest of WebRTC signaling code (same as before) ...
    }
}
```

**Add separate button in UI:**

```html
<button onclick="createAudioCall()">🎤 Audio Call (1-on-1)</button>
<button onclick="createVideoCall()">🎥 Video Call (Group)</button>
```

---

## 📝 Phase 4: Transcript Pipeline

### Step 1: Setup Webhook Handler

Add to `main.go`:

```go
// Daily.co webhook endpoint
http.HandleFunc("/api/daily/webhook", handleDailyWebhook)

func handleDailyWebhook(w http.ResponseWriter, r *http.Request) {
    // Verify webhook signature
    signature := r.Header.Get("X-Daily-Signature")
    if !verifyDailySignature(r.Body, signature) {
        http.Error(w, "Invalid signature", http.StatusUnauthorized)
        return
    }

    var webhook struct {
        Type        string `json:"type"`
        RoomName    string `json:"room_name"`
        RecordingURL string `json:"recording_url"`
        Duration    int    `json:"duration"`
    }

    json.NewDecoder(r.Body).Decode(&webhook)

    if webhook.Type == "recording.ready" {
        // Process recording asynchronously
        go processRecording(webhook.RoomName, webhook.RecordingURL)
    }

    w.WriteHeader(http.StatusOK)
}

func processRecording(roomName, recordingURL string) {
    // 1. Download recording
    recording, _ := downloadRecording(recordingURL)

    // 2. Send to Whisper API for transcription
    transcript, _ := transcribeWithWhisper(recording)

    // 3. Analyze with GPT-4o
    analysis, _ := analyzeWithGPT4o(transcript)

    // 4. Store in Redis
    storeTranscript(roomName, transcript, analysis)

    log.Printf("Processed recording for room %s", roomName)
}
```

### Step 2: Whisper Integration

```go
func transcribeWithWhisper(audioData []byte) ([]TranscriptSegment, error) {
    url := "https://api.openai.com/v1/audio/transcriptions"

    // Create multipart form
    body := &bytes.Buffer{}
    writer := multipart.NewWriter(body)

    part, _ := writer.CreateFormFile("file", "recording.mp3")
    part.Write(audioData)

    writer.WriteField("model", "whisper-1")
    writer.WriteField("response_format", "verbose_json")
    writer.WriteField("timestamp_granularities[]", "segment")

    writer.Close()

    req, _ := http.NewRequest("POST", url, body)
    req.Header.Set("Authorization", "Bearer "+openAIAPIKey)
    req.Header.Set("Content-Type", writer.FormDataContentType())

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result struct {
        Segments []struct {
            Text  string  `json:"text"`
            Start float64 `json:"start"`
            End   float64 `json:"end"`
        } `json:"segments"`
    }

    json.NewDecoder(resp.Body).Decode(&result)

    // Convert to our format
    segments := make([]TranscriptSegment, len(result.Segments))
    for i, seg := range result.Segments {
        segments[i] = TranscriptSegment{
            Speaker: inferSpeaker(seg.Text), // Use GPT-4o for speaker ID
            Text:    seg.Text,
            Start:   seg.Start,
            End:     seg.End,
        }
    }

    return segments, nil
}
```

---

## 🚀 Quick Start Commands

```bash
# 1. Setup environment
cp .env.example .env
# Edit .env and add Daily.co credentials

# 2. Create Daily.co structure
mkdir -p internal/daily
mkdir -p static/js/daily

# 3. Install frontend dependencies
cd static/js
npm init -y
npm install @daily-co/daily-js

# 4. Build and run
go build -o messenger .
./messenger

# 5. Test
open http://localhost:8080
```

---

## 📚 Resources

### Daily.co Documentation
- [API Reference](https://docs.daily.co/reference/rest-api)
- [JavaScript SDK](https://docs.daily.co/reference/daily-js)
- [Webhooks](https://docs.daily.co/reference/webhooks)
- [Recording](https://docs.daily.co/guides/products/recording)

### OpenAI APIs
- [Whisper API](https://platform.openai.com/docs/api-reference/audio)
- [GPT-4o](https://platform.openai.com/docs/models/gpt-4o)

### Railway
- [Environment Variables](https://docs.railway.app/develop/variables)
- [Deployments](https://docs.railway.app/deploy/deployments)

---

## ✅ Success Checklist

### Phase 2: Daily.co
- [ ] Account created
- [ ] API key obtained
- [ ] Go client implemented
- [ ] Frontend integration working
- [ ] Test group call (3+ participants)

### Phase 3: Audio
- [ ] Audio-only WebRTC extracted
- [ ] Simple UI created
- [ ] 1-on-1 audio call working

### Phase 4: Transcription
- [ ] Webhook handler implemented
- [ ] Whisper API integrated
- [ ] GPT-4o analysis working
- [ ] Transcript viewer created

### Phase 5: Deployment
- [ ] Railway env vars configured
- [ ] Daily.co webhook URL set
- [ ] Full system deployed
- [ ] End-to-end test passed

---

## 🆘 Need Help?

### Common Issues

**Issue:** Daily.co API returns 401
**Fix:** Check `DAILY_API_KEY` is set correctly

**Issue:** Webhook not receiving events
**Fix:** Verify webhook URL in Daily.co dashboard is `https://yourdomain.com/api/daily/webhook`

**Issue:** Whisper API fails
**Fix:** Check audio format (must be mp3, mp4, mpeg, mpga, m4a, wav, or webm)

**Issue:** Frontend can't load Daily SDK
**Fix:** Check CORS settings, ensure `https://unpkg.com/@daily-co/daily-js` is accessible

---

## 🎯 Estimated Timeline

- **Phase 2 (Daily.co):** 2-3 days
- **Phase 3 (Audio):** 1 day
- **Phase 4 (Transcription):** 2 days
- **Phase 5 (Deploy):** 1 day
- **Phase 6 (Polish):** 1 day

**Total:** 7-8 days for complete migration

---

**Ready?** Let's build! 🚀

**Next file to create:** `internal/daily/client.go`
**Next command:** `mkdir -p internal/daily && cd internal/daily`

Good luck! 💪
