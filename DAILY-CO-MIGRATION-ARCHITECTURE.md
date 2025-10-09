# Daily.co Migration Architecture Plan
**Created:** 2025-10-09
**Status:** Implementation Ready

---

## 🎯 Migration Overview

### Current State
- **Infrastructure:** Self-hosted on DigitalOcean droplets
- **Video:** Custom WebRTC SFU for group calls, P2P for 1-on-1
- **TURN Server:** Self-hosted Coturn
- **Deployment:** Terraform + DigitalOcean + Hibernation proxy
- **Hosting:** Railway + custom droplets

### Target State
- **Infrastructure:** Railway only (serverless)
- **Video Platform:** Daily.co for group calls
- **Audio Calls:** Own WebRTC implementation for 1-on-1 audio only
- **Transcription:** Daily.co recordings → Our server → GPT-4o processing
- **Design:** Daily.co prebuilt UI (customizable later)

---

## 📦 Archive Strategy

### What to Archive
All files will be moved to `/archive/` directory (excluded from git):

#### 1. **SFU Components** → `/archive/sfu/`
- `sfu/sfu.go`
- `sfu/signaling.go`
- `sfu/bitrate.go`
- All group call WebRTC infrastructure

#### 2. **Infrastructure** → `/archive/infrastructure/`
- `infrastructure/digitalocean/` (Terraform configs)
- `infrastructure/deploy.sh`
- `infrastructure/check-servers.sh`
- `infrastructure/secrets/`
- `infrastructure/generate-passwords.sh`

#### 3. **Hibernation System** → `/archive/hibernation/`
- `hibernation-proxy/` (entire directory)
- `sleep-controller.sh`
- `cloudflare-worker.js`
- All hibernation-related docs:
  - `DROPLET_HIBERNATION_STRATEGY.md`
  - `HIBERNATION_DEPLOYMENT.md`
  - `HIBERNATION_IMPLEMENTATION_COMPLETE.md`
  - `HIBERNATION_RAILWAY_COMPLETE.md`
  - `HIBERNATION-EXPLAINED.md`

#### 4. **TURN Server** → `/archive/turn/`
- `infrastructure/digitalocean/turn-setup.sh`
- TURN credential configuration
- P2P WebRTC code for 1-on-1 **video** calls (keep audio!)

#### 5. **Deployment Scripts** → `/archive/deployment/`
- `deploy.tar.gz`
- `DEPLOY-MECHANICS.md`
- `DEPLOYMENT_INSTRUCTIONS.md`
- `DEPLOYMENT_REPORT.md`
- `RAILWAY_*.md` (old Railway docs)
- `DNS-CLEANUP.txt`
- `NAMECHEAP-DNS-FIX.md`

#### 6. **Legacy Documentation** → `/archive/docs/`
- All `.md` files related to old architecture
- Old roadmaps and implementation plans
- Ukrainian deployment guides

### Archive Documentation
Each archive subdirectory will have `README.md` explaining:
- What these files were used for
- Why they were archived
- When they might be useful again
- How to restore if needed

---

## 🏗️ New Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   1-on-1     │  │    Group     │  │  Notetaker   │  │
│  │ Audio Calls  │  │  Video Call  │  │   Panel      │  │
│  │  (Own WebRTC)│  │  (Daily.co)  │  │  (GPT-4o)    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          │                  │                  │
┌─────────┴──────────────────┴──────────────────┴─────────┐
│              Railway Go Server (main.go)                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │  WebSocket Handlers                                 │ │
│  │  • /ws-audio (1-on-1 audio signaling)              │ │
│  │  • Daily.co room creation API                      │ │
│  │  • Webhook receiver for recordings                 │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Transcript Processing Pipeline                     │ │
│  │  1. Receive Daily.co recording URL                 │ │
│  │  2. Download and process                           │ │
│  │  3. Send to Whisper API / GPT-4o                   │ │
│  │  4. Color-code by speaker                          │ │
│  │  5. Generate insights + timestamps                 │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Redis Cache                                        │ │
│  │  • Session management                              │ │
│  │  • Meeting metadata                                │ │
│  │  • Transcript storage (7 days)                     │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
          │                  │                  │
          │                  │                  │
┌─────────┴──────┐  ┌────────┴─────────┐  ┌────┴─────────┐
│   Daily.co API │  │  OpenAI API      │  │  Redis Cloud │
│   • Create room│  │  • GPT-4o        │  │  (Railway)   │
│   • Webhooks   │  │  • Whisper       │  │              │
│   • Recordings │  │  • Analysis      │  │              │
└────────────────┘  └──────────────────┘  └──────────────┘
```

---

## 🎨 Feature Breakdown

### 1. Group Video Calls (Daily.co)

**User Flow:**
1. Host clicks "Create Group Video Meeting"
2. Server calls Daily.co API to create room
3. Server stores meeting metadata in Redis:
   ```json
   {
     "meeting_id": "uuid",
     "daily_room_name": "kaminskyi-meeting-abc123",
     "daily_room_url": "https://kaminskyi.daily.co/meeting-abc123",
     "host_id": "host_xyz",
     "created_at": 1696809600,
     "expires_at": 1696896000,
     "recording_enabled": true
   }
   ```
4. Host and guests join via Daily.co embed
5. Daily.co handles all video/audio routing
6. When meeting ends, Daily.co webhook sends recording URL

**Daily.co Configuration:**
```javascript
// Frontend integration
const callFrame = window.DailyIframe.createFrame({
  iframeStyle: {
    width: '100%',
    height: '100%',
    border: '0',
    borderRadius: '8px'
  },
  showLeaveButton: true,
  showFullscreenButton: true
});

callFrame.join({
  url: dailyRoomUrl,
  userName: userName,
  token: dailyToken // For private rooms
});
```

### 2. 1-on-1 Audio Calls (Own Implementation)

**Why Separate?**
- Daily.co has limits on free tier
- Audio-only is lightweight
- We already have WebRTC expertise
- Privacy for sensitive audio conversations

**Implementation:**
```go
// WebRTC audio-only peer connection
type AudioCall struct {
    ID           string
    Participants map[string]*AudioParticipant
    CreatedAt    time.Time
}

type AudioParticipant struct {
    ID         string
    Name       string
    Connection *websocket.Conn
}

// Signaling only - no media routing
func audioWSHandler(w http.ResponseWriter, r *http.Request) {
    // Similar to current wsHandler but:
    // 1. Only audio tracks
    // 2. P2P direct connection
    // 3. No SFU needed
    // 4. STUN servers only (no TURN needed for audio)
}
```

**UI Difference:**
- Group calls: "Video Meeting" button → Daily.co embed
- Audio calls: "Audio Call" button → Our simple audio UI

### 3. Recording & Transcription Pipeline

**Daily.co Webhook Flow:**
```
1. Meeting ends → Daily.co processes recording
2. Webhook POST to /api/daily/webhook
   {
     "type": "recording.ready",
     "room_name": "meeting-abc123",
     "recording_url": "https://...",
     "duration": 3600,
     "participants": ["Host", "Guest1", "Guest2"]
   }
3. Server downloads recording (MP4/MP3)
4. Extract audio → Send to Whisper API
5. Get transcript with timestamps
6. Send to GPT-4o for:
   - Speaker identification
   - Key moments detection
   - Action items extraction
   - Sentiment analysis
```

**Transcript Storage:**
```json
{
  "transcript_id": "uuid",
  "meeting_id": "meeting-abc123",
  "segments": [
    {
      "speaker": "Host",
      "color": "#FF6B6B",
      "text": "Let's discuss the quarterly results",
      "start": 0.0,
      "end": 3.5,
      "confidence": 0.95
    },
    {
      "speaker": "Guest1",
      "color": "#4ECDC4",
      "text": "Revenue increased by 25%",
      "start": 3.8,
      "end": 6.2,
      "confidence": 0.98
    }
  ],
  "insights": {
    "summary": "Team discussed Q3 results...",
    "action_items": ["Follow up on revenue targets"],
    "key_moments": [
      {"timestamp": 120, "description": "Decision made on budget"}
    ],
    "sentiment": "positive"
  },
  "metadata": {
    "duration": 3600,
    "participants": 3,
    "recording_url": "https://...",
    "created_at": "2025-10-09T10:00:00Z"
  }
}
```

### 4. Notetaker UI Enhancements

**Features:**
- ✅ Live transcript viewer during call
- ✅ Color-coded speakers (auto-assigned)
- ✅ Timestamp navigation (click to jump in video)
- ✅ Search within transcript
- ✅ Export formats: PDF, DOCX, JSON, TXT
- ✅ Share transcript with unique link
- ✅ GPT-4o insights panel:
  - Executive summary
  - Key decisions
  - Action items with timestamps
  - Topic segmentation
  - Sentiment timeline

**UI Mockup:**
```
┌─────────────────────────────────────────────────────┐
│  [◀] Back to Call        🎥 Recording: 45:23        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📊 AI Insights                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ Summary: Team reviewed Q3 performance and ... │ │
│  │                                               │ │
│  │ Key Decisions:                                │ │
│  │ • [15:30] Approved new marketing budget       │ │
│  │ • [32:45] Decided to expand to EMEA region    │ │
│  │                                               │ │
│  │ Action Items:                                 │ │
│  │ • [25:10] John to prepare budget proposal     │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  💬 Transcript                        [Export ▼]   │
│  ┌───────────────────────────────────────────────┐ │
│  │ [00:15] Host (red):                           │ │
│  │ "Let's start with the financial review"       │ │
│  │                                               │ │
│  │ [00:23] Guest1 (blue):                        │ │
│  │ "Revenue increased by 25% compared to Q2"     │ │
│  │                                               │ │
│  │ [00:45] Guest2 (green):                       │ │
│  │ "That's excellent progress on our goals"      │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 🗂️ New Repository Structure

```
go-messenger/
├── cmd/
│   └── server/
│       └── main.go              # Entry point
├── internal/
│   ├── audio/                   # 1-on-1 audio calls
│   │   ├── handler.go
│   │   ├── signaling.go
│   │   └── room.go
│   ├── daily/                   # Daily.co integration
│   │   ├── client.go            # API client
│   │   ├── webhook.go           # Webhook handler
│   │   └── rooms.go
│   ├── transcript/              # Transcript processing
│   │   ├── processor.go         # Download + process
│   │   ├── whisper.go           # Whisper API
│   │   ├── gpt.go               # GPT-4o analysis
│   │   └── storage.go           # Redis storage
│   ├── auth/
│   │   ├── middleware.go
│   │   └── session.go
│   ├── redis/
│   │   └── client.go
│   └── models/
│       ├── meeting.go
│       ├── transcript.go
│       └── user.go
├── web/
│   ├── static/
│   │   ├── css/
│   │   ├── js/
│   │   │   ├── audio/           # Audio call modules
│   │   │   ├── daily/           # Daily.co integration
│   │   │   ├── notetaker/       # Transcript viewer
│   │   │   └── shared/          # Shared utilities
│   │   └── assets/
│   └── templates/
│       ├── home.html
│       ├── audio-call.html
│       ├── video-call.html      # Daily.co embed
│       └── transcript.html
├── config/
│   └── config.go                # Configuration management
├── archive/                     # OLD INFRASTRUCTURE (gitignored)
│   ├── README.md
│   ├── sfu/
│   ├── infrastructure/
│   ├── hibernation/
│   ├── turn/
│   ├── deployment/
│   └── docs/
├── go.mod
├── go.sum
├── .env.example
├── .gitignore
├── railway.json
└── README.md
```

---

## 🔐 Environment Variables

### Daily.co
```bash
DAILY_API_KEY=your_daily_api_key
DAILY_DOMAIN=your-subdomain.daily.co
DAILY_WEBHOOK_SECRET=webhook_secret_for_verification
```

### OpenAI
```bash
OPENAI_API_KEY=sk-...
WHISPER_MODEL=whisper-1
GPT_MODEL=gpt-4o
```

### Railway
```bash
PORT=8080
REDIS_URL=redis://...
DATABASE_URL=postgres://... (optional for persistent storage)
```

### App Config
```bash
SESSION_SECRET=random_secret_key
HOST_USERNAME=Oleh
HOST_PASSWORD=QwertY24$
PUBLIC_DOMAIN=your-domain.com
```

---

## 🚀 Migration Steps

### Phase 1: Archive & Cleanup (Day 1)
1. ✅ Create `/archive/` directory structure
2. ✅ Move all old infrastructure files
3. ✅ Write comprehensive README for each archive section
4. ✅ Update `.gitignore` to exclude `/archive/`
5. ✅ Commit: "Archive old infrastructure"

### Phase 2: Daily.co Integration (Day 2-3)
1. Set up Daily.co account + API key
2. Create `internal/daily/` package
3. Implement room creation API
4. Build video call UI with Daily.co embed
5. Test group calls with 3+ participants
6. Implement webhook receiver

### Phase 3: Audio Calls (Day 4)
1. Extract audio-only WebRTC code
2. Create `internal/audio/` package
3. Build simple audio call UI
4. Add "Audio Call" button to home page
5. Test 1-on-1 audio calls

### Phase 4: Transcript Pipeline (Day 5-6)
1. Implement recording download from Daily.co
2. Integrate Whisper API for transcription
3. Build GPT-4o analysis pipeline
4. Create color-coded transcript viewer
5. Add timestamp navigation
6. Implement export functionality

### Phase 5: Railway Deployment (Day 7)
1. Update `railway.json` with new env vars
2. Set up Daily.co webhook URL
3. Configure Redis on Railway
4. Deploy and test all features
5. Update DNS if needed

### Phase 6: Polish & Documentation (Day 8)
1. Add AI agent integration docs
2. Create user guide
3. Test all features end-to-end
4. Performance optimization
5. Security audit

---

## 🤖 AI Agent Integration

### Architecture for Future AI Agents

**Design Principles:**
1. **Modular Handlers:** Each AI feature is a separate package
2. **Webhook-Driven:** AI agents subscribe to events
3. **Async Processing:** Long-running AI tasks use job queues
4. **Plugin System:** Easy to add new AI capabilities

**Example AI Agents:**

#### 1. Meeting Assistant
```go
// internal/ai/assistant/handler.go
type MeetingAssistant struct {
    gptClient *openai.Client
}

func (a *MeetingAssistant) OnTranscriptReady(transcript *models.Transcript) {
    // Generate:
    // - Meeting summary
    // - Action items
    // - Follow-up suggestions
    // - Calendar event drafts
}
```

#### 2. Language Coach
```go
// internal/ai/language/coach.go
type LanguageCoach struct {
    gptClient *openai.Client
}

func (c *LanguageCoach) AnalyzeConversation(transcript *models.Transcript) {
    // Analyze for:
    // - Grammar corrections
    // - Vocabulary suggestions
    // - Pronunciation notes (if audio analysis enabled)
    // - Fluency score
}
```

#### 3. Sentiment Analyzer
```go
// internal/ai/sentiment/analyzer.go
func AnalyzeSentiment(segments []models.TranscriptSegment) []SentimentDataPoint {
    // Track emotional tone over time
    // Detect tension points
    // Identify engagement levels
}
```

**Webhook Events:**
```go
type Event struct {
    Type      string    // "transcript.ready", "meeting.ended", etc.
    Timestamp time.Time
    Data      interface{}
}

// AI agents subscribe to events
eventBus.Subscribe("transcript.ready", meetingAssistant.OnTranscriptReady)
eventBus.Subscribe("transcript.ready", languageCoach.AnalyzeConversation)
```

---

## 📊 Cost Analysis

### Current (Self-Hosted)
- DigitalOcean Droplets: $24/month
- Redis Cloud: $0 (Railway free tier)
- Domain: $12/year
- **Total:** ~$25/month

### New (Daily.co + Railway)
- Railway: $5-20/month (depends on usage)
- Redis: $0 (free tier sufficient)
- Daily.co:
  - Free: 10,000 minutes/month
  - Pro: $99/month for 50,000 minutes
- OpenAI: ~$10-50/month (depends on usage)
- Domain: $12/year
- **Total:** $15-170/month (depends on scale)

**Break-even:** Daily.co free tier good for ~330 hours of calls/month

---

## 🔒 Security Considerations

### Daily.co
- ✅ Use private rooms with tokens for sensitive meetings
- ✅ Enable waiting rooms for guest approval
- ✅ Webhook signature verification
- ✅ Recording encryption at rest

### Audio Calls
- ✅ DTLS-SRTP for media encryption
- ✅ Token-based room access
- ✅ Rate limiting on signaling

### Transcripts
- ✅ Store in Redis with 7-day TTL
- ✅ Access control (only meeting host)
- ✅ Share links with UUID tokens
- ✅ Optional: Encrypt sensitive transcripts

---

## ✅ Success Criteria

1. ✅ All old infrastructure archived with documentation
2. ✅ Group video calls working via Daily.co
3. ✅ 1-on-1 audio calls working via own WebRTC
4. ✅ Recording → Transcript pipeline functional
5. ✅ Color-coded transcript viewer
6. ✅ GPT-4o insights generation
7. ✅ Export in multiple formats
8. ✅ Share functionality
9. ✅ Deployed on Railway
10. ✅ Documentation for AI agent integration

---

## 📝 Next Steps

1. Review this plan with stakeholders
2. Set up Daily.co account
3. Begin Phase 1: Archive migration
4. Create detailed task breakdown for each phase
5. Set up project board for tracking

---

**Questions? Contact:** Oleh Kaminskyi
**Last Updated:** 2025-10-09
