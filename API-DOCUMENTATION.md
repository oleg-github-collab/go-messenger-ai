# API Documentation

**Version:** 2.0.0 (Daily.co Integration)
**Last Updated:** 2025-10-09

---

## Base URL

```
Development: http://localhost:8080
Production:  https://your-domain.com
```

---

## Authentication

Most endpoints require authentication via session cookie or Bearer token.

### Session Cookie
```
Cookie: auth_token=<token>
```

### Bearer Token
```
Authorization: Bearer <token>
```

---

## Public Endpoints

### `GET /`
**Landing Page**

Returns the landing page with features, pricing, and SEO optimization.

**Response:** HTML page

---

### `GET /login`
**Login Page**

Returns login page for hosts.

**Response:** HTML page

---

### `POST /login`
**Authenticate Host**

Authenticate and get session token.

**Request Body:**
```json
{
  "username": "Oleh",
  "password": "QwertY24$"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "base64_token_here"
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Sets Cookie:** `auth_token` with 24h expiration

---

### `GET /join/:meetingId`
**Guest Join Page**

Public page for guests to join meetings.

**Parameters:**
- `meetingId` (path) - Meeting ID

**Response:** HTML page with join interface

**Error Cases:**
- Meeting not found → Shows "Meeting not found" page
- Meeting expired → Shows "Meeting expired" page
- Meeting ended → Shows "Meeting ended" page

---

## Authenticated Endpoints

### `GET /home`
**Host Dashboard**

Main dashboard for authenticated hosts.

**Auth Required:** Yes

**Response:** HTML dashboard with options to create meetings

---

### `POST /create`
**Create Meeting**

Create a new meeting (group video, 1-on-1 audio, or 1-on-1 video).

**Auth Required:** Yes

**Query Parameters:**
- `mode` (required) - Meeting mode: `group`, `audio`, `1on1`
- `name` (optional) - Host name (default: "Host")

**Response (200 OK) - Group Video:**
```json
{
  "meeting_id": "uuid-here",
  "daily_url": "https://your-domain.daily.co/meeting-xyz",
  "join_url": "https://your-domain.com/join/uuid-here",
  "mode": "group"
}
```

**Response (200 OK) - Audio/1on1:**
```
https://your-domain.com/join/uuid-here
```

**Error Cases:**
- `503` - Daily.co not configured (for group calls)
- `500` - Failed to create room
- `401` - Not authenticated

---

### `POST /end`
**End Meeting**

End a meeting and notify all participants.

**Auth Required:** Yes (host only)

**Query Parameters:**
- `room` (required) - Room ID to end

**Response (200 OK):**
```json
{
  "success": true
}
```

**Side Effects:**
- Disconnects all participants
- Sends `meeting-ended` event via WebSocket
- Marks meeting as inactive in Redis

---

### `POST /logout`
**Logout**

Invalidate session and logout.

**Auth Required:** Yes

**Response:** Redirect to `/login`

**Side Effects:**
- Deletes session from Redis
- Clears `auth_token` cookie

---

## WebSocket Endpoints

### `WS /ws`
**1-on-1 Video Call Signaling**

WebSocket connection for peer-to-peer video calls.

**Query Parameters:**
- `room` (required) - Room ID
- `name` (required) - Participant name
- `isHost` (optional) - "true" if host

**Message Types:**

**Client → Server:**
```json
{
  "type": "offer",
  "data": "<SDP offer string>"
}

{
  "type": "answer",
  "data": "<SDP answer string>"
}

{
  "type": "ice-candidate",
  "data": "<ICE candidate string>"
}

{
  "type": "chat",
  "data": {
    "text": "Message content",
    "to": "participant_id or everyone"
  }
}

{
  "type": "ping"
}
```

**Server → Client:**
```json
{
  "type": "joined",
  "data": {
    "name": "Participant Name",
    "id": "participant_id",
    "isHost": true
  }
}

{
  "type": "join",
  "data": {
    "name": "New Participant",
    "id": "participant_id"
  }
}

{
  "type": "leave",
  "data": {
    "name": "Participant Name",
    "id": "participant_id"
  }
}

{
  "type": "offer",
  "data": "<SDP offer string>",
  "user": "sender_id",
  "userName": "Sender Name"
}

{
  "type": "answer",
  "data": "<SDP answer string>",
  "user": "sender_id",
  "userName": "Sender Name"
}

{
  "type": "ice-candidate",
  "data": "<ICE candidate string>",
  "user": "sender_id"
}

{
  "type": "meeting-ended",
  "data": {
    "message": "Host ended the meeting"
  }
}

{
  "type": "pong"
}
```

**Error Messages:**
```json
{
  "error": "room ID missing"
}

{
  "error": "meeting not found or expired"
}

{
  "error": "meeting has ended"
}

{
  "error": "room full (max 2 participants)"
}
```

---

### `WS /ws-audio`
**1-on-1 Audio Call Signaling**

WebSocket connection for peer-to-peer audio calls (audio only).

**Query Parameters:**
- `room` (required) - Room ID
- `name` (required) - Participant name
- `isHost` (optional) - "true" if host

**Message Format:** Same as `/ws` but audio-only

**Max Participants:** 2 (1-on-1 only)

---

## Daily.co Integration Endpoints

### `POST /api/daily/webhook`
**Daily.co Webhook Handler**

Receives webhooks from Daily.co for recording events.

**Auth Required:** No (verified via signature)

**Headers:**
- `X-Daily-Signature` or `X-Daily-Signature-256` - HMAC signature

**Request Body:**
```json
{
  "type": "recording.ready",
  "room_name": "meeting-xyz",
  "recording_id": "rec_123",
  "download_link": "https://...",
  "duration": 300.0,
  "status": "finished"
}
```

**Supported Event Types:**
- `recording.ready` - Recording is ready for download
- `recording.started` - Recording has started
- `recording.stopped` - Recording has stopped
- `recording.error` - Recording encountered an error

**Response (200 OK):**
```json
{
  "status": "received"
}
```

**Side Effects (recording.ready):**
- Downloads recording
- Sends to Whisper API for transcription
- Analyzes with GPT-4o
- Stores transcript in Redis

---

## Meeting Endpoints

### `GET /api/meeting/:meetingId`
**Get Meeting Info**

Retrieve meeting information.

**Auth Required:** No

**Parameters:**
- `meetingId` (path) - Meeting ID

**Response (200 OK):**
```json
{
  "host_id": "host_123",
  "host_name": "Oleh",
  "mode": "group",
  "created_at": 1696809600,
  "active": true,
  "daily_url": "https://..."
}
```

**Response (404 Not Found):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Meeting not found"
  }
}
```

---

## Transcript Endpoints

### `GET /api/transcript/:transcriptId`
**Get Transcript**

Retrieve processed transcript with insights.

**Auth Required:** Yes

**Parameters:**
- `transcriptId` (path) - Transcript ID (usually same as recording ID)

**Response (200 OK):**
```json
{
  "id": "rec_123",
  "meeting_id": "meeting-xyz",
  "room_name": "meeting-xyz",
  "segments": [
    {
      "speaker": "Speaker 1",
      "speaker_id": "spk_1",
      "color": "#FF6B6B",
      "text": "Let's discuss the quarterly results",
      "start": 0.0,
      "end": 3.5,
      "confidence": 0.95
    }
  ],
  "insights": {
    "summary": "Team discussed Q3 results...",
    "key_points": ["Revenue increased by 25%"],
    "action_items": [
      {
        "text": "Follow up on budget",
        "timestamp": 120.5,
        "assignee": "John",
        "priority": "high"
      }
    ],
    "key_moments": [
      {
        "timestamp": 120.0,
        "description": "Decision made on budget",
        "type": "decision"
      }
    ],
    "topics": ["Finance", "Strategy"],
    "sentiment": "positive",
    "decisions": ["Approved new marketing budget"],
    "questions": ["What about Q4 targets?"]
  },
  "metadata": {
    "duration": 300.0,
    "participants": ["Speaker 1", "Speaker 2"],
    "recording_url": "https://...",
    "language": "en",
    "word_count": 1250
  },
  "created_at": "2025-10-09T10:00:00Z",
  "processed_at": "2025-10-09T10:05:00Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": {
    "code": "TRANSCRIPT_NOT_FOUND",
    "message": "Transcript not found"
  }
}
```

---

### `POST /api/transcript/analyze`
**Analyze Transcript with Role Preset**

Re-analyze transcript with specific role focus.

**Auth Required:** Yes

**Request Body:**
```json
{
  "transcript_id": "rec_123",
  "role_preset": "language-teacher"
}
```

**Role Presets:**
- `language-teacher` - Focus on grammar, vocabulary, errors
- `therapist` - Focus on emotional states, patterns
- `business-coach` - Focus on strategy, KPIs, leadership
- `medical-consultant` - Focus on health concerns
- `tutor` - Focus on learning outcomes

**Response (200 OK):**
```json
{
  "insights": {
    "summary": "...",
    "key_points": [...],
    "action_items": [...]
  }
}
```

---

## Health & Status Endpoints

### `GET /api/health`
**Health Check**

Check if server is ready and all services are operational.

**Auth Required:** No

**Response (200 OK):**
```json
{
  "status": "ready",
  "redis": true,
  "daily": true,
  "openai": true,
  "uptime": 3600.5,
  "timestamp": 1696809600,
  "version": "2.0.0",
  "build_date": "2025-10-09"
}
```

**Response (503 Service Unavailable):**
```json
{
  "status": "starting",
  "redis": false,
  "daily": true,
  "openai": true,
  "uptime": 5.2,
  "timestamp": 1696809600
}
```

---

### `GET /api/turn-credentials`
**Get TURN Server Credentials**

Get TURN server credentials for WebRTC connections.

**Auth Required:** No

**Response (200 OK):**
```json
{
  "host": "turn.example.com",
  "username": "user123",
  "password": "pass123"
}
```

**Note:** For Daily.co group calls, TURN is provided by Daily.co. This endpoint is for legacy 1-on-1 calls.

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "fields": {
      "field_name": "Field-specific error"
    }
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `BAD_REQUEST` | 400 | Invalid request format |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Access forbidden |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `VALIDATION_FAILED` | 400 | Validation errors |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `ROOM_FULL` | 409 | Room at capacity |
| `MEETING_EXPIRED` | 410 | Meeting has expired |
| `MEETING_ENDED` | 410 | Meeting was ended by host |
| `INVALID_CREDENTIALS` | 401 | Wrong username/password |
| `SESSION_EXPIRED` | 401 | Session has expired |
| `DAILY_NOT_CONFIGURED` | 503 | Daily.co API not configured |
| `TRANSCRIPT_NOT_FOUND` | 404 | Transcript not ready or not found |
| `RECORDING_NOT_READY` | 202 | Recording still processing |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily down |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/login` | 5 requests | 5 minutes |
| `/create` | 10 requests | 1 minute |
| WebSocket messages | 30 messages | 30 seconds |
| `/api/transcript/*` | 20 requests | 1 minute |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1696809660
```

---

## Redis Schema

### Session Keys
```
session:<token> → userID (string)
TTL: 24 hours
```

### Meeting Keys
```
meeting:<meetingId> → {
  host_id: string,
  host_name: string,
  mode: string,
  created_at: timestamp,
  active: boolean,
  ended_at: timestamp?
}
TTL: 8 hours
```

### Daily.co Room Mapping
```
daily_room:<meetingId> → roomName (string)
TTL: 8 hours
```

### Transcript Keys
```
transcript:<transcriptId> → {
  id: string,
  meeting_id: string,
  segments: array,
  insights: object,
  metadata: object,
  created_at: timestamp,
  processed_at: timestamp
}
TTL: 7 days
```

### Rate Limit Keys
```
chat_limit:<roomId>:<participantId> → count (integer)
TTL: 30 seconds

reaction_limit:<roomId>:<participantId> → count (integer)
TTL: 10 seconds

login_limit:<ip> → count (integer)
TTL: 5 minutes
```

---

## WebRTC Connection Flow

### 1-on-1 Calls (P2P)

```
Client A                Server                Client B
   |                      |                      |
   |----WS Connect------->|                      |
   |<---"joined"----------|                      |
   |                      |<----WS Connect-------|
   |                      |----"joined"--------->|
   |                      |----"peer-joined"---->|
   |<---"peer-joined"----|                      |
   |                      |                      |
   |---"offer"----------->|---"offer"----------->|
   |<--"answer"-----------|<--"answer"-----------|
   |---"ice"------------->|---"ice"------------->|
   |<--"ice"--------------|<--"ice"--------------|
   |                      |                      |
   [P2P Connection Established]
   |<===================>|                      |
```

### Group Calls (Daily.co)

```
Client                Server              Daily.co
   |                      |                   |
   |---Create Meeting---->|                   |
   |                      |---CreateRoom----->|
   |                      |<--Room URL--------|
   |<--Daily URL----------|                   |
   |                      |                   |
   |--------Join Room-------------------->|
   |<------Video/Audio Streams------------|
   |                      |                   |
   |---Start Recording------------------->|
   |                      |<--Webhook---------|
   |                      |                   |
   |<--Transcript---------|                   |
```

---

## Deployment on Custom Domain

See `CUSTOM-DOMAIN-DEPLOYMENT.md` for detailed instructions.

---

**Documentation Version:** 2.0.0
**API Version:** 2.0.0
**Last Updated:** 2025-10-09
