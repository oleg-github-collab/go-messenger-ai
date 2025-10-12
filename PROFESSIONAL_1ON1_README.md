# 🤖 Professional 1-on-1 AI Meeting Assistant

## Overview

Complete professional 1-on-1 video call system with real-time GPT-4o analysis, live transcription, polls, whiteboard, and intelligent meeting assistance.

## ✅ What's Implemented

### 🎥 Video Call (100ms)
- 1-on-1 video/audio via 100ms SDK
- Remote video (70% main screen)
- Local PiP video (bottom-left)
- Speaking indicators with pulse animation
- Screen sharing
- Camera/mic controls
- Device switching

### 🤖 AI Analysis (GPT-4o)
- **Real-time statement analysis** every time someone speaks
- **5 Categories**: objection, pricing, agreement, question, general
- **3 Urgency Levels**: high, medium, low
- **Color-coded transcript** entries based on category
- **Contextual recommendations** from GPT-4o
- **3 Suggested Responses** per category
- **Fallback keyword detection** if OpenAI unavailable

### 📜 Live Transcript Panel
- Side panel (30% width)
- Real-time transcription via 100ms
- Speaker detection (You / Guest)
- Timestamp on each entry
- Filter tabs: Both | Guest | Me
- Search transcript (ready)
- Bookmark important moments
- Export to JSON
- AI category badges
- Clickable entries → AI modal

### 💬 AI Recommendation Modal
- Slides up from bottom
- Category badge with emoji
- Detailed recommendation text
- 3 quick response buttons
- Click to send to chat
- Copy to clipboard
- Color-coded by urgency

### 📊 Polls
- Create poll modal
- Dynamic options (add/remove)
- 100ms Polls API integration
- Single/multiple choice
- Real-time voting (ready)

### 🎨 Whiteboard
- Full-screen canvas overlay
- Drawing tools: pen, eraser, shapes
- Color picker
- Clear canvas
- 100ms sync (ready)

### 💾 Recording Storage (Railway)
- Railway Volume mount: `/data/recordings`
- Auto-download from 100ms webhooks
- Metadata storage in Redis (30 days)
- List recordings by meeting
- Download/delete recordings
- Disk space monitoring

### 📱 UI/UX
- Ultra glassmorphic design
- Smooth animations everywhere
- Fully responsive (mobile/tablet/desktop)
- Touch-optimized controls
- Speaking indicators
- Empty states with instructions
- Loading screen with steps
- Call timer
- Recording indicator

## 🚀 Quick Start

### 1. Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...                 # For GPT-4o analysis
HMS_APP_ACCESS_KEY=your_100ms_key     # 100ms credentials
HMS_APP_SECRET=your_100ms_secret
HMS_TEMPLATE_ID=your_template_id

# Optional
RAILWAY_API_KEY=1c4b591c-3828-480c-ac94-b556c38228da
RECORDINGS_PATH=/data/recordings      # Default on Railway
```

### 2. Run Server

```bash
go run main.go professional_mode_handlers.go ai_analyzer.go recording_storage.go notetaker_handlers.go
```

### 3. Access Professional 1-on-1

```
http://localhost:8080/static/professional-1on1.html
```

## 🎯 Complete Flow

```
┌──────────────────────────────────────────────────────┐
│ 1. User Opens /static/professional-1on1.html         │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│ 2. Loading Screen (3 steps)                          │
│    • Authenticating...                                │
│    • Setting up video...                              │
│    • Activating AI...                                 │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│ 3. Backend Creates Room & Token                       │
│    POST /api/professional/create-room                 │
│    POST /api/professional/create-token                │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│ 4. Join 100ms Room                                    │
│    • Connect to video/audio                           │
│    • Enable live transcription                        │
│    • Subscribe to events                              │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│ 5. Guest Joins (via share link)                       │
│    • Remote video appears                             │
│    • Participant name updates                         │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│ 6. Someone Speaks                                     │
│    • 100ms captures audio                             │
│    • Live transcription API transcribes               │
│    • Speaker detected (local vs remote)               │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│ 7. Transcript Segment Added to UI                     │
│    • Entry appears in side panel                      │
│    • Timestamp added                                  │
│    • Speaker avatar shown                             │
│    • "Analyzing..." indicator appears                 │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│ 8. AI Analysis (GPT-4o)                               │
│    POST /api/analyze-transcript                       │
│    {                                                  │
│      speaker: "Guest",                                │
│      text: "That seems expensive",                    │
│      timestamp: "...",                                │
│      meetingId: "..."                                 │
│    }                                                  │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│ 9. GPT-4o Responds                                    │
│    {                                                  │
│      category: "pricing",                             │
│      color: "#ffa502",                                │
│      urgency: "high",                                 │
│      recommendation: "Client has price concern...",   │
│      suggested_responses: [                           │
│        "Let's discuss the ROI...",                    │
│        "What if we explore payment options?",         │
│        "I can show you our value calculator"          │
│      ]                                                │
│    }                                                  │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│ 10. Transcript Entry Updated                          │
│     • Border turns orange (pricing category)          │
│     • AI badge appears                                │
│     • Entry becomes clickable                         │
│     • "💰 pricing detected - Click for advice"       │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│ 11. Host Clicks Entry                                 │
│     • AI modal slides up from bottom                  │
│     • Shows category badge: "💰 PRICING DETECTED"    │
│     • Displays GPT-4o recommendation                  │
│     • Lists 3 suggested responses                     │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│ 12. Host Takes Action                                 │
│     Option A: Click response → sends to chat          │
│     Option B: Copy recommendation → use later         │
│     Option C: Close modal → remember advice           │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│ 13. Throughout Call                                   │
│     • Continuous transcription                        │
│     • Real-time AI analysis                           │
│     • Bookmarks at key moments                        │
│     • Recording saved to Railway volume               │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│ 14. Call Ends                                         │
│     • Export transcript (JSON)                        │
│     • Recording available for download                │
│     • Bookmarks included in export                    │
│     • AI insights preserved                           │
└──────────────────────────────────────────────────────┘
```

## 📊 AI Categories & Colors

| Category | Emoji | Color | Urgency | Example Triggers |
|----------|-------|-------|---------|------------------|
| **objection** | 🚨 | #f45c43 (red) | high | "no", "can't", "concerned", "problem" |
| **pricing** | 💰 | #ffa502 (orange) | high | "expensive", "cost", "budget", "afford" |
| **agreement** | ✅ | #38ef7d (green) | low | "yes", "agree", "sounds good", "perfect" |
| **question** | ❓ | #4facfe (blue) | medium | "how", "what", "why", "?" |
| **general** | 🤖 | #667eea (purple) | low | Everything else |

## 🎨 UI Breakdown

### Top Bar
- Back button (← exits call)
- Recording indicator (🔴 REC)
- Call timer (00:00)
- Participant name
- Settings button (⚙️)

### Main Area (70%)
- Remote video (full screen)
- Local PiP (bottom-left, 200x150px)
- Speaking border animations
- Placeholder when waiting

### Transcript Panel (30%)
- Header with AI badge
- Search, bookmark, export icons
- Filter tabs (Both | Guest | Me)
- Scrollable transcript list
- Empty state instructions

### Bottom Controls
- Left: Mic, Camera, Screen Share, Reactions
- Center: End Call (large red button)
- Right: Chat, Poll, Whiteboard, Record

## 🔌 API Endpoints

### Professional Mode
```
POST /api/professional/create-room
POST /api/professional/create-token
POST /api/analyze-transcript         # GPT-4o analysis
POST /api/professional/webhook       # 100ms webhooks
```

### Recordings
```
POST /api/recordings/webhook         # 100ms recording complete
GET  /api/recordings/get?id=xxx
GET  /api/recordings/list?meeting_id=xxx
DELETE /api/recordings/delete?id=xxx
```

## 💾 Railway Storage Setup

1. **Create Volume in Railway**
   - Dashboard → Project → Add Volume
   - Name: `recordings`
   - Mount Path: `/data/recordings`
   - Size: 10GB (or more)

2. **Environment Variable**
   ```
   RECORDINGS_PATH=/data/recordings
   ```

3. **Auto-setup**
   - Server creates directory on startup
   - Checks disk space
   - Falls back to /tmp if unavailable

## 🎯 GPT-4o Prompt

```
You are an AI meeting assistant analyzing a 1-on-1 professional conversation in real-time.

Speaker: Guest
Statement: "I think that seems expensive"

Analyze this statement and respond in JSON format ONLY:
{
  "category": "pricing",
  "color": "#ffa502",
  "urgency": "high",
  "recommendation": "The client has expressed a price concern. This is a critical moment. Acknowledge their concern, then pivot from cost to value and ROI. Offer flexible payment options if available.",
  "suggested_responses": [
    "I understand. Let's break down the value and ROI you'll receive",
    "What if we explore a phased payment approach?",
    "Many clients felt the same way, but found the investment paid for itself in 3 months"
  ]
}
```

## 🔧 Customization

### Change AI Personality
Edit `ai_analyzer.go`:
```go
Messages: []OpenAIMessage{
    {
        Role:    "system",
        Content: "You are a [YOUR PERSONALITY] providing guidance during meetings.",
    },
    ...
}
```

### Add New Categories
1. Update `ai_analyzer.go` fallback keywords
2. Update CSS colors in `professional-1on1.css`
3. Add emoji to modal in `main.js`

### Adjust Urgency Thresholds
Edit GPT-4o prompt in `ai_analyzer.go`:
```
Urgency rules:
- high: [YOUR CRITERIA]
- medium: [YOUR CRITERIA]
- low: [YOUR CRITERIA]
```

## 🐛 Troubleshooting

### Transcript Not Appearing
- Check 100ms transcription is enabled in template
- Verify HMS_TEMPLATE_ID includes transcription
- Check browser console for errors

### AI Analysis Not Working
- Verify OPENAI_API_KEY is set
- Check OpenAI API quota/billing
- Fallback keyword detection should still work

### Recording Not Saving
- Check Railway volume is mounted
- Verify RECORDINGS_PATH exists
- Check webhook signature verification
- Look for download errors in logs

### Video Not Connecting
- Verify HMS credentials are correct
- Check 100ms dashboard for room status
- Try different browser (Chrome recommended)

## 📈 Performance

- **Transcript delay**: ~1-2 seconds (100ms API)
- **AI analysis**: ~2-4 seconds (GPT-4o API)
- **Total latency**: ~3-6 seconds per statement
- **Concurrent calls**: Limited by 100ms free tier (10k min/month)

## 💰 Cost Estimate (Free Tier)

### 100ms
- 10,000 minutes/month = ~166 hours
- 300 transcription minutes/month = ~10 hours
- 300 recording minutes/month = ~10 hours

### OpenAI GPT-4o
- ~$0.005 per analysis (assuming 500 tokens)
- 30-minute call = ~60 statements = $0.30
- 100 calls/month = $30

### Railway
- Volume: ~$5-10/month for 10GB
- Compute: Included in plan

### Total
- Free tier: $0/month (first 10 hours)
- With OpenAI: ~$30-40/month

## 🚀 Production Checklist

- [ ] Set all environment variables
- [ ] Create Railway volume
- [ ] Configure 100ms template with transcription
- [ ] Set up OpenAI billing
- [ ] Test recording download
- [ ] Test AI analysis
- [ ] Configure CORS if needed
- [ ] Set up monitoring/alerts
- [ ] Test on mobile devices
- [ ] Set up backup storage

## 🎉 You're Ready!

Everything is implemented and ready for testing. Just set your environment variables and start a call at:

```
http://localhost:8080/static/professional-1on1.html
```

The AI will analyze every statement in real-time and provide tactical recommendations to help you succeed in your professional conversations!
