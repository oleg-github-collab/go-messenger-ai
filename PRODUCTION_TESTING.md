# 🚀 Production Testing Guide - Kaminskyi AI Messenger

## ✅ Виправлення та покращення в цьому релізі:

### 🎯 SFU Group Calls (Критичні виправлення):
1. **TURN Server Integration** - Додано TURN credentials для проходження через NAT/firewall
2. **Automatic Renegotiation** - WebRTC автоматично перепідключається коли додаються нові треки
3. **Stream-to-Participant Binding** - Правильне прив'язування відео потоків до учасників
4. **Signaling State Checks** - Додано перевірки signaling state перед set remote description

### 💬 Chat Improvements:
1. **Private Messages** - Підтримка особистих повідомлень у групових чатах
2. **Message Parsing** - Покращена обробка різних форматів даних
3. **Sender Info** - Додано інформацію про відправника у всіх повідомленнях

### 📱 Mobile UI Optimizations:
1. **Responsive Breakpoints** - 768px та 400px медіа-запити
2. **Safe Area Insets** - Підтримка iPhone X+ з вирізами
3. **Touch-Optimized Buttons** - Збільшені touch targets (48-68px)
4. **Adaptive Grid Layout** - Grid адаптується під кількість учасників

## 🧪 Testing Procedures

### 1️⃣ Pre-Deploy Checklist:
- [x] Go code компілюється без помилок
- [x] JavaScript синтаксис валідний
- [x] Git commit створено
- [ ] Git push на Railway завершено
- [ ] Railway build успішний
- [ ] Railway deploy успішний

### 2️⃣ 1-on-1 Call Testing (10 тестів):

#### Desktop Chrome:
```
✓ Login as host (Oleh/QwertY24$)
✓ Create 1-on-1 meeting
✓ Copy meeting link
✓ Open in incognito as guest
✓ Join with name
✓ Video/audio bidirectional
✓ Toggle camera on/off
✓ Toggle microphone on/off
✓ Send text message in chat
✓ Send GIF from quick categories
```

#### Mobile Safari (iOS):
```
✓ Open meeting link
✓ Grant camera/microphone permissions
✓ See remote video
✓ Flip camera (front/back)
✓ Bottom buttons visible and clickable
✓ Chat accessible
✓ Safe area respected (no button cutoff)
```

### 3️⃣ Group Call Testing (15 тестів):

#### 3-Way Call (Desktop + Mobile + Tablet):
```
✓ Host creates group meeting
✓ Guest 1 joins from mobile
✓ Guest 2 joins from tablet
✓ All 3 participants see each other
✓ All video streams working
✓ All audio streams working
✓ Participant count shows "3 participants"
✓ Grid layout displays correctly
```

#### Chat Testing:
```
✓ Send broadcast message (Everyone)
✓ All participants receive broadcast
✓ Select specific participant
✓ Send private message
✓ Only recipient receives private message
✓ Private badge shows on messages
✓ Recipient selector updates when users join/leave
```

### 4️⃣ Cross-Browser Testing Matrix:

| Browser | OS | 1-on-1 | Group | Chat | Mobile UI |
|---------|-----|--------|-------|------|-----------|
| Chrome 120+ | macOS | ⏳ | ⏳ | ⏳ | N/A |
| Firefox 120+ | macOS | ⏳ | ⏳ | ⏳ | N/A |
| Safari 17+ | macOS | ⏳ | ⏳ | ⏳ | N/A |
| Chrome | Android 13+ | ⏳ | ⏳ | ⏳ | ⏳ |
| Safari | iOS 16+ | ⏳ | ⏳ | ⏳ | ⏳ |

**Legend:** ✅ Pass | ❌ Fail | ⏳ Pending | ⚠️  Partial

### 5️⃣ Network Conditions Testing:

#### TURN Server Fallback:
```bash
# Simulate restrictive firewall
# Should automatically use TURN relay: 157.245.20.158:3478
✓ Direct P2P blocked
✓ Connection falls back to TURN
✓ Audio/video still works
```

#### Mobile Network:
```
✓ Test on 4G/LTE
✓ Test on 5G
✓ Adaptive quality adjusts
✓ Connection stable with network changes
```

### 6️⃣ Stress Testing:

#### Maximum Participants (Group):
```
✓ Join 20 participants (max limit)
✓ 21st participant gets "room full" error
✓ All 20 see each other
✓ Grid layout handles 20 participants
✓ Performance acceptable (no lag)
```

#### Long Duration:
```
✓ Call runs for 1+ hour
✓ No memory leaks
✓ Video quality stable
✓ Before 8h TTL expiration
```

## 📊 Success Criteria:

### Critical (Must Pass):
- [x] Code compiles and deploys
- [ ] Host can create both 1-on-1 and group meetings
- [ ] Guests can join via shared link
- [ ] Bidirectional video/audio in 1-on-1 calls
- [ ] Multi-party video/audio in group calls (3+ participants)
- [ ] Chat works in both modes
- [ ] Mobile UI fully functional

### Important (Should Pass):
- [ ] TURN server used when P2P fails
- [ ] Private messages work in group chat
- [ ] Camera flip works on mobile
- [ ] All buttons accessible on iPhone
- [ ] Cross-browser compatibility

### Nice to Have:
- [ ] Smooth renegotiation without interruptions
- [ ] Adaptive quality based on bandwidth
- [ ] Picture-in-Picture works
- [ ] Screen sharing works

## 🐛 Known Issues & Workarounds:

### Issue #1: First connection may take 5-10 seconds
**Cause:** TURN credentials loading + ICE gathering
**Workaround:** User just waits, shows "Connecting..."
**Status:** Expected behavior

### Issue #2: Safari requires user gesture for camera
**Cause:** Safari security policy
**Workaround:** Guest page with "Join" button
**Status:** Working as designed

### Issue #3: Max 20 participants in group calls
**Cause:** SFU architecture limitation
**Workaround:** None, by design
**Status:** Feature limit

## 📈 Performance Benchmarks:

### Expected Metrics:
- **Connection Time:** < 5 seconds (with TURN)
- **Video Latency:** < 500ms (P2P), < 1s (TURN)
- **CPU Usage:** < 50% per participant (Chrome)
- **Memory Usage:** ~200MB per peer connection
- **Bandwidth:** ~2-4 Mbps per video stream

### Monitor on Railway:
```
Deployment time: 2-3 minutes
Build time: 1-2 minutes
Memory usage: < 512MB at rest
CPU usage: < 0.5 CPU at rest
```

## 🔍 Debug Commands:

### Check Railway Logs:
```bash
# In Railway dashboard:
1. Go to your service
2. Click "Deployments"
3. Click latest deployment
4. View "Deploy Logs" and "Runtime Logs"
```

### Test WebSocket Connection:
```javascript
// In browser console:
const ws = new WebSocket('wss://your-domain.up.railway.app/ws-sfu?room=test&name=TestUser');
ws.onopen = () => console.log('✅ Connected');
ws.onerror = (e) => console.error('❌ Error:', e);
```

### Test TURN Server:
```javascript
// In browser console:
const pc = new RTCPeerConnection({
  iceServers: [{
    urls: ['turn:157.245.20.158:3478'],
    username: 'kaminskyi-25a04450ce8b905b',
    credential: 'Q2dzXnKfA8WYhO6HRV3TUhldD0DRQZMu'
  }]
});
pc.onicecandidate = (e) => {
  if (e.candidate && e.candidate.candidate.includes('relay')) {
    console.log('✅ TURN working:', e.candidate);
  }
};
```

## 📝 Post-Deploy Actions:

1. **Monitor Railway Dashboard** - Check build/deploy status
2. **Test Production URL** - Open in multiple browsers
3. **Check Logs** - Look for errors in Railway logs
4. **Run Test Checklist** - Go through all testing procedures
5. **Document Issues** - Note any failures or bugs
6. **Iterate** - Fix issues and redeploy if needed

## 🎉 Deployment Success Indicators:

✅ Railway build completed without errors
✅ Service is "Active" (green dot)
✅ Health check endpoint returns 200 OK
✅ Can login with Oleh/QwertY24$
✅ Can create meeting (both modes)
✅ WebSocket connections establish
✅ TURN credentials API works
✅ Video/audio connections successful

## 📞 Support Information:

**Production URL:** https://go-messenger-ai-production.up.railway.app (check Railway dashboard)
**GitHub Repo:** https://github.com/oleg-github-collab/go-messenger-ai
**Redis:** Railway-provided instance
**TURN Server:** 157.245.20.158:3478 (DigitalOcean)

**Authentication:**
- Username: `Oleh`
- Password: `QwertY24$`

**Environment Variables (Railway):**
```
REDIS_URL=<auto-set by Railway>
TURN_HOST=157.245.20.158
TURN_USERNAME=kaminskyi-25a04450ce8b905b
TURN_PASSWORD=Q2dzXnKfA8WYhO6HRV3TUhldD0DRQZMu
PORT=8080
```

---

**Last Updated:** 2025-10-02
**Version:** v1.0.1 (SFU Group Calls Fix)
**Author:** Kaminskyi + Claude Code
