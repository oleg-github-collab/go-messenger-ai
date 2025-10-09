# 📝 TODO: Next Steps

**Updated:** 2025-10-09
**Phase:** 2 - Daily.co Integration

---

## ✅ Completed

- [x] Archive old infrastructure (48 files, 29 MB)
- [x] Write comprehensive documentation (80 KB)
- [x] Create migration architecture plan
- [x] Create implementation guide
- [x] Update .gitignore

---

## 🚀 Today (Phase 2 Start)

### 1. Commit Archive Changes
```bash
cd /Users/olehkaminskyi/Desktop/go\ messenger

git add .
git status  # Verify archive/ is untracked (gitignored)

git commit -m "🗄️ Archive old infrastructure

- Moved 48 files to /archive/ (locally preserved)
- Created 80 KB comprehensive documentation
- Planned Daily.co + Railway migration
- Ready for Phase 2"

git push origin main
```

### 2. Create Daily.co Account
- [ ] Go to https://dashboard.daily.co/signup
- [ ] Sign up with email
- [ ] Choose **Free tier** (10,000 minutes/month)
- [ ] Navigate to: Dashboard → Developers → API Keys
- [ ] Create new API key
- [ ] Copy API key (save securely)
- [ ] Get domain name (e.g., `kaminskyi-messenger.daily.co`)

### 3. Setup Environment Variables
```bash
# Local development
echo "DAILY_API_KEY=your_api_key_here" >> .env
echo "DAILY_DOMAIN=your-subdomain.daily.co" >> .env
echo "DAILY_WEBHOOK_SECRET=your_webhook_secret" >> .env

# Railway deployment
railway variables set DAILY_API_KEY=your_api_key
railway variables set DAILY_DOMAIN=your-subdomain.daily.co
railway variables set DAILY_WEBHOOK_SECRET=your_webhook_secret
```

### 4. Create New Directory Structure
```bash
# Create internal packages
mkdir -p internal/{daily,audio,transcript,models}

# Create web directories
mkdir -p web/{static,templates}

# Create command directory
mkdir -p cmd/server
```

---

## 📅 This Week

### Monday: Daily.co Backend (3-4 hours)
- [ ] Create `internal/daily/client.go`
  - [ ] NewClient() constructor
  - [ ] CreateRoom() method
  - [ ] DeleteRoom() method
  - [ ] GetRoom() method
- [ ] Create `internal/models/meeting.go`
  - [ ] Meeting struct
  - [ ] DailyRoom struct
- [ ] Update `main.go`
  - [ ] Import daily package
  - [ ] Initialize client
  - [ ] Update `/create` endpoint for group calls
  - [ ] Add Daily.co room mapping in Redis

### Tuesday: Daily.co Frontend (4-5 hours)
- [ ] Install Daily.co SDK
  ```bash
  cd static/js
  npm init -y
  npm install @daily-co/daily-js
  ```
- [ ] Create `static/js/daily/video-call.js`
  - [ ] DailyVideoCall class
  - [ ] join() method
  - [ ] leave() method
  - [ ] Event handlers
- [ ] Create `static/video-call.html`
  - [ ] Video container
  - [ ] Loading state
  - [ ] Daily.co embed
- [ ] Update `static/home.html`
  - [ ] Add "Video Meeting" button
  - [ ] Handle group call creation

### Wednesday: 1-on-1 Audio Calls (3-4 hours)
- [ ] Create `internal/audio/handler.go`
  - [ ] Audio call signaling
  - [ ] WebSocket handler
  - [ ] Room management
- [ ] Create `static/js/audio/audio-call.js`
  - [ ] AudioCall class
  - [ ] P2P connection (STUN only)
  - [ ] Audio-only constraints
- [ ] Create `static/audio-call.html`
  - [ ] Simple audio UI
  - [ ] Mute controls
- [ ] Update `static/home.html`
  - [ ] Add "Audio Call" button
  - [ ] Separate from video calls

### Thursday: Webhook Handler (3-4 hours)
- [ ] Create `internal/daily/webhook.go`
  - [ ] Webhook verification
  - [ ] recording.ready handler
  - [ ] Error handling
- [ ] Add endpoint in `main.go`
  - [ ] `/api/daily/webhook`
  - [ ] Signature verification
  - [ ] Async processing
- [ ] Create recording download function
  - [ ] HTTP download
  - [ ] Save to temporary storage
  - [ ] Extract audio

### Friday: Transcription Pipeline (4-5 hours)
- [ ] Create `internal/transcript/whisper.go`
  - [ ] Whisper API client
  - [ ] Audio upload
  - [ ] Parse transcript response
- [ ] Create `internal/transcript/gpt.go`
  - [ ] GPT-4o analysis
  - [ ] Speaker identification
  - [ ] Insights generation
- [ ] Create `internal/transcript/storage.go`
  - [ ] Redis storage
  - [ ] Transcript retrieval
  - [ ] Export functions
- [ ] Test end-to-end
  - [ ] Create meeting
  - [ ] Record video
  - [ ] Webhook received
  - [ ] Transcript generated

---

## 🎯 Next Week

### Monday: Transcript Viewer UI (4-5 hours)
- [ ] Create `static/transcript-viewer.html`
  - [ ] Color-coded segments
  - [ ] Timestamp navigation
  - [ ] Search functionality
- [ ] Create `static/js/transcript/viewer.js`
  - [ ] Load transcript
  - [ ] Color coding
  - [ ] Export options (PDF, DOCX, JSON)
- [ ] Create `static/js/transcript/insights.js`
  - [ ] Display GPT-4o insights
  - [ ] Action items
  - [ ] Key moments

### Tuesday: Railway Deployment (3-4 hours)
- [ ] Update `railway.json`
  - [ ] Add Daily.co env vars
  - [ ] Configure build command
- [ ] Deploy to Railway
  ```bash
  railway up
  ```
- [ ] Configure Daily.co webhook
  - [ ] URL: `https://your-app.railway.app/api/daily/webhook`
  - [ ] Test webhook delivery
- [ ] Verify all features
  - [ ] Group video calls
  - [ ] 1-on-1 audio calls
  - [ ] Recording → transcription

### Wednesday: Testing & Bug Fixes (4-5 hours)
- [ ] Test all features end-to-end
  - [ ] Create meetings
  - [ ] Join calls
  - [ ] Recording
  - [ ] Transcription
  - [ ] Transcript viewer
- [ ] Fix any bugs found
- [ ] Performance testing
  - [ ] Load testing (multiple users)
  - [ ] Latency measurements
  - [ ] Resource usage

### Thursday: Polish & Documentation (3-4 hours)
- [ ] Create user guide
  - [ ] How to create meetings
  - [ ] How to join calls
  - [ ] How to view transcripts
  - [ ] How to export
- [ ] Add AI agent integration docs
  - [ ] How to add new AI features
  - [ ] Webhook event system
  - [ ] Example agents
- [ ] Update README.md
  - [ ] New architecture overview
  - [ ] Setup instructions
  - [ ] Deployment guide

### Friday: Final Review & Launch (2-3 hours)
- [ ] Security audit
  - [ ] Review webhook verification
  - [ ] Check API key security
  - [ ] Verify CORS settings
- [ ] Performance optimization
  - [ ] Reduce bundle size
  - [ ] Optimize API calls
  - [ ] Cache static assets
- [ ] Launch! 🚀

---

## 📋 Quick Reference

### Key Files to Create

#### Backend
1. `internal/daily/client.go` - Daily.co API client
2. `internal/daily/webhook.go` - Webhook handler
3. `internal/audio/handler.go` - Audio call signaling
4. `internal/transcript/whisper.go` - Whisper API
5. `internal/transcript/gpt.go` - GPT-4o analysis
6. `internal/transcript/storage.go` - Redis storage
7. `internal/models/meeting.go` - Data models

#### Frontend
1. `static/js/daily/video-call.js` - Daily.co integration
2. `static/js/audio/audio-call.js` - Audio calls
3. `static/js/transcript/viewer.js` - Transcript viewer
4. `static/js/transcript/insights.js` - AI insights
5. `static/video-call.html` - Video call page
6. `static/audio-call.html` - Audio call page
7. `static/transcript-viewer.html` - Transcript viewer page

### Environment Variables Needed

```bash
# Daily.co
DAILY_API_KEY=
DAILY_DOMAIN=
DAILY_WEBHOOK_SECRET=

# OpenAI
OPENAI_API_KEY=
WHISPER_MODEL=whisper-1
GPT_MODEL=gpt-4o

# Railway
PORT=8080
REDIS_URL=

# App
SESSION_SECRET=
HOST_USERNAME=Oleh
HOST_PASSWORD=QwertY24$
PUBLIC_DOMAIN=
```

### Useful Commands

```bash
# Build
go build -o messenger .

# Run locally
./messenger

# Deploy to Railway
railway up

# Check logs
railway logs

# Set env var
railway variables set KEY=value

# SSH into Railway (if needed)
railway run bash
```

---

## 🎯 Success Metrics

### Phase 2 Complete When:
- [ ] Can create Daily.co rooms via API
- [ ] Frontend can embed Daily.co calls
- [ ] 3+ participants can join group video call
- [ ] Webhook receives recording events
- [ ] Basic transcription working

### Full Migration Complete When:
- [ ] Group video calls working (Daily.co)
- [ ] 1-on-1 audio calls working (own WebRTC)
- [ ] Recordings automatically transcribed
- [ ] Transcripts viewable with color coding
- [ ] GPT-4o insights generated
- [ ] Export functionality working
- [ ] Deployed on Railway
- [ ] Documentation complete

---

## 🆘 Quick Help

**Stuck on Daily.co API?**
→ Check: https://docs.daily.co/reference/rest-api

**Webhook not working?**
→ Verify: Signature verification and Railway URL

**Whisper API fails?**
→ Check: Audio format (must be mp3, wav, etc.)

**Frontend won't load?**
→ Check: CORS settings and Daily SDK URL

**Need code examples?**
→ See: `START-HERE-DAILY-MIGRATION.md`

---

## 🎉 Motivation

**Progress So Far:**
- ✅ 48 files archived safely
- ✅ 80 KB documentation written
- ✅ Clear roadmap created
- ✅ Ready to build!

**What We're Building:**
- 🎥 Professional video calls (Daily.co)
- 🎤 Simple audio calls (own WebRTC)
- 📝 AI-powered transcription (Whisper + GPT-4o)
- 🎨 Beautiful transcript viewer
- 🚀 Deployed on Railway

**Timeline:**
- Week 1: Core features ✅ Achievable
- Week 2: Polish + Launch 🚀

**Let's do this! 💪**

---

**Last Updated:** 2025-10-09
**Next Action:** Commit archive changes, then create Daily.co account
**Estimated Time to MVP:** 7-8 days
