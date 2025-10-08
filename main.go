// main.go - Kaminskyi AI Messenger (Production Ready v1.0)
package main

import (
	"context"
	"crypto/rand"
	"embed"
	"encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
	"messenger/sfu"
)

const (
	validUsername = "Oleh"
	validPassword = "QwertY24$"
	sessionTTL    = 24 * time.Hour
	meetingTTL    = 8 * time.Hour
	buildVersion  = "v1.1.0-role-presets-ui" // UPDATED: Interactive role preset buttons
	buildDate     = "2025-10-08"
)

var (
	openAIAPIKey = getEnv("OPENAI_API_KEY", "")
)

var (
	addr = flag.String("addr", ":8080", "HTTP service address")
	ctx  = context.Background()

	// Redis client
	rdb *redis.Client

	// TURN server config
	turnHost     string
	turnUsername string
	turnPassword string

	// SFU server for group calls
	sfuServer *sfu.SFUServer

	// Server start time for uptime tracking
	startTime time.Time
)

//go:embed static/*
var staticFiles embed.FS

// getEnv gets environment variable or returns default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// Room represents a 1-on-1 video room
type Room struct {
	ID           string
	HostID       string
	HostName     string
	Participants map[*websocket.Conn]*Participant
	WaitingRoom  map[string]*Participant
	CreatedAt    time.Time
	mu           sync.RWMutex
}

// Participant in a room
type Participant struct {
	ID         string
	Name       string
	IsHost     bool
	JoinedAt   time.Time
	Approved   bool
	Connection *websocket.Conn
}

// Message is the WebSocket message format
type Message struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
	Room string          `json:"room"`
	User string          `json:"user"`
	UserName string      `json:"userName,omitempty"`
}

// NotetakerSession stores active recording session
type NotetakerSession struct {
	RoomID       string    `json:"room_id"`
	AudioChunks  [][]byte  `json:"-"`
	StartTime    time.Time `json:"start_time"`
	Participants []string  `json:"participants"`
	mu           sync.Mutex
}

// TranscriptSegment represents a piece of transcript
type TranscriptSegment struct {
	Speaker string  `json:"speaker"`
	Text    string  `json:"text"`
	Start   float64 `json:"start"`
	End     float64 `json:"end"`
}

// MeetingAnalysis contains AI-generated summary
type MeetingAnalysis struct {
	Summary      string   `json:"summary"`
	KeyPoints    []string `json:"key_points"`
	ActionItems  []string `json:"action_items"`
	Participants []string `json:"participants"`
	Duration     string   `json:"duration"`
	Transcript   string   `json:"transcript"`
}

var (
	rooms             = make(map[string]*Room)
	notetakerSessions = make(map[string]*NotetakerSession)
	mu                sync.RWMutex
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func initRedis() {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
		log.Printf("[REDIS] ⚠️  Using default Redis URL (development)")
	}

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatalf("[REDIS] ❌ Failed to parse REDIS_URL: %v", err)
	}

	rdb = redis.NewClient(opt)

	// Test connection
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Fatalf("[REDIS] ❌ Failed to connect: %v", err)
	}

	log.Printf("[REDIS] ✅ Connected successfully")
}

func initTURN() {
	turnHost = os.Getenv("TURN_HOST")
	turnUsername = os.Getenv("TURN_USERNAME")
	turnPassword = os.Getenv("TURN_PASSWORD")

	// Remove port if present (JS will add it)
	if strings.Contains(turnHost, ":") {
		parts := strings.Split(turnHost, ":")
		turnHost = parts[0]
		log.Printf("[TURN] 🔧 Cleaned host from '%s' to '%s'", os.Getenv("TURN_HOST"), turnHost)
	}

	if turnHost == "" {
		log.Printf("[TURN] ⚠️  No TURN server configured (P2P only)")
	} else {
		log.Printf("[TURN] ✅ TURN server: %s", turnHost)
	}
}

func generateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// Store session in Redis
func storeSession(token, userID string) error {
	key := fmt.Sprintf("session:%s", token)
	return rdb.Set(ctx, key, userID, sessionTTL).Err()
}

// Validate session from Redis
func validateSession(token string) (string, bool) {
	key := fmt.Sprintf("session:%s", token)
	userID, err := rdb.Get(ctx, key).Result()
	if err != nil {
		return "", false
	}
	return userID, true
}

// Store meeting in Redis
func storeMeeting(roomID, hostID, hostName, mode string) error {
	key := fmt.Sprintf("meeting:%s", roomID)
	data := map[string]interface{}{
		"host_id":    hostID,
		"host_name":  hostName,
		"mode":       mode,
		"created_at": time.Now().Unix(),
		"active":     true,
	}
	dataJSON, _ := json.Marshal(data)
	return rdb.Set(ctx, key, dataJSON, meetingTTL).Err()
}

// Get meeting data from Redis
func getMeeting(roomID string) (map[string]interface{}, error) {
	key := fmt.Sprintf("meeting:%s", roomID)
	data, err := rdb.Get(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	err = json.Unmarshal([]byte(data), &result)
	return result, err
}

// Check if meeting exists
func meetingExists(roomID string) bool {
	key := fmt.Sprintf("meeting:%s", roomID)
	exists, _ := rdb.Exists(ctx, key).Result()
	return exists > 0
}

// Delete meeting from Redis
func deleteMeeting(roomID string) error {
	key := fmt.Sprintf("meeting:%s", roomID)
	return rdb.Del(ctx, key).Err()
}

// Deactivate meeting (mark as ended)
func deactivateMeeting(roomID string) error {
	key := fmt.Sprintf("meeting:%s", roomID)
	data, err := rdb.Get(ctx, key).Result()
	if err != nil {
		return err
	}

	var meeting map[string]interface{}
	err = json.Unmarshal([]byte(data), &meeting)
	if err != nil {
		return err
	}

	meeting["active"] = false
	meeting["ended_at"] = time.Now().Unix()

	dataJSON, _ := json.Marshal(meeting)
	// Keep the meeting data for 1 hour after deactivation
	return rdb.Set(ctx, key, dataJSON, 1*time.Hour).Err()
}

// Validate emoji - checks if string contains valid emoji characters
func isValidEmoji(s string) bool {
	if s == "" {
		return false
	}

	// List of allowed emoji patterns (Unicode ranges)
	// This covers most common emojis including skin tones and variations
	allowedEmojis := []string{
		"👍", "👎", "❤️", "🔥", "😂", "😮", "😢", "🎉", "👏", "🙏",
		"💪", "✨", "🎊", "🎈", "🎁", "💯", "✅", "❌", "⭐", "🌟",
		"😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😊", "😇", "🙂",
		"🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋",
		"😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩",
		"🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
		"😖", "😫", "😩", "🥺", "😤", "😠", "😡", "🤬", "🤯", "😳",
		"🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭",
		"🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧",
		"😲", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧",
		"😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡",
		"💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸",
		"😹", "😻", "😼", "😽", "🙀", "😿", "😾",
	}

	// Check if the input matches any allowed emoji
	for _, emoji := range allowedEmojis {
		if s == emoji {
			return true
		}
	}

	return false
}

// Validate message ID format
func isValidMessageID(messageID string) bool {
	if messageID == "" {
		return false
	}

	// Message ID should follow pattern: msg_{counter}_{timestamp}
	// Example: msg_1_1704067200000
	if !strings.HasPrefix(messageID, "msg_") {
		return false
	}

	parts := strings.Split(messageID, "_")
	if len(parts) != 3 {
		return false
	}

	// Validate that second and third parts are numbers
	for i := 1; i < 3; i++ {
		for _, char := range parts[i] {
			if char < '0' || char > '9' {
				return false
			}
		}
	}

	return true
}

func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Printf("[AUTH] %s %s", r.Method, r.URL.Path)

		// Skip auth for public routes
		if strings.HasPrefix(r.URL.Path, "/login") ||
			strings.HasPrefix(r.URL.Path, "/join/") ||
			strings.HasPrefix(r.URL.Path, "/static/") {
			next(w, r)
			return
		}

		// Check cookie
		cookie, err := r.Cookie("auth_token")
		if err == nil && cookie.Value != "" {
			if userID, valid := validateSession(cookie.Value); valid {
				log.Printf("[AUTH] ✅ Valid session for user: %s", userID)
				r.Header.Set("X-User-ID", userID)
				next(w, r)
				return
			}
		}

		// Check Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader != "" {
			token := strings.TrimPrefix(authHeader, "Bearer ")
			if userID, valid := validateSession(token); valid {
				log.Printf("[AUTH] ✅ Valid Bearer token")
				r.Header.Set("X-User-ID", userID)
				next(w, r)
				return
			}
		}

		log.Printf("[AUTH] ❌ Unauthorized access")

		// Redirect to login
		if strings.Contains(r.Header.Get("Accept"), "text/html") {
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}

		http.Error(w, "Unauthorized", http.StatusUnauthorized)
	}
}

func serveFile(filename string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		b, err := staticFiles.ReadFile("static/" + filename)
		if err != nil {
			http.Error(w, "Page not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write(b)
	}
}

func createRoom(hostID, hostName, mode string) string {
	id := uuid.NewString()

	// Store in memory (only for 1-on-1 mode)
	if mode == "1on1" {
		mu.Lock()
		rooms[id] = &Room{
			ID:           id,
			HostID:       hostID,
			HostName:     hostName,
			Participants: make(map[*websocket.Conn]*Participant),
			WaitingRoom:  make(map[string]*Participant),
			CreatedAt:    time.Now(),
		}
		mu.Unlock()
	}

	// Store in Redis
	if err := storeMeeting(id, hostID, hostName, mode); err != nil {
		log.Printf("[ROOM] ⚠️  Failed to store in Redis: %v", err)
	}

	log.Printf("[ROOM] ✅ Created %s room %s by host %s", mode, id, hostName)
	return id
}

// Clean up room completely
func cleanupRoom(roomID string) {
	mu.Lock()
	room, exists := rooms[roomID]
	if exists {
		// Close all connections
		room.mu.Lock()
		for conn := range room.Participants {
			conn.Close()
		}
		for _, p := range room.WaitingRoom {
			if p.Connection != nil {
				p.Connection.Close()
			}
		}
		room.mu.Unlock()

		delete(rooms, roomID)
	}
	mu.Unlock()

	// CRITICAL FIX: Do NOT delete meeting from Redis on cleanup
	// This allows multiple sessions with the same link
	// Meeting should only be deleted when it expires (TTL) or host explicitly ends it
	log.Printf("[ROOM] 🗑️  Cleaned up room memory %s (meeting still active in Redis)", roomID)
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[WS] ❌ Upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	roomID := r.URL.Query().Get("room")
	guestName := r.URL.Query().Get("name")

	if roomID == "" {
		conn.WriteMessage(websocket.TextMessage, []byte(`{"error":"room ID missing"}`))
		return
	}

	// Check if meeting exists in Redis
	meetingData, err := getMeeting(roomID)
	if err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte(`{"error":"meeting not found or expired"}`))
		return
	}

	// Check if meeting is still active
	isActive := true
	if active, ok := meetingData["active"].(bool); ok {
		isActive = active
	}
	if !isActive {
		log.Printf("[WS] ❌ Meeting is no longer active")
		conn.WriteMessage(websocket.TextMessage, []byte(`{"error":"meeting has ended"}`))
		return
	}

	hostName := "Host"
	if name, ok := meetingData["host_name"].(string); ok {
		hostName = name
	}

	// Get or create room in memory
	mu.Lock()
	room, exists := rooms[roomID]
	if !exists {
		room = &Room{
			ID:           roomID,
			HostID:       meetingData["host_id"].(string),
			HostName:     hostName,
			Participants: make(map[*websocket.Conn]*Participant),
			WaitingRoom:  make(map[string]*Participant),
			CreatedAt:    time.Now(),
		}
		rooms[roomID] = room
	}
	mu.Unlock()

	// Generate participant ID
	participantID := "user_" + uuid.NewString()[:8]
	participant := &Participant{
		ID:         participantID,
		Name:       guestName,
		IsHost:     false,
		JoinedAt:   time.Now(),
		Approved:   false,
		Connection: conn,
	}

	// Check if host - multiple ways to verify:
	// 1. isHost=true in query parameter (from sessionStorage)
	// 2. X-User-ID header matches (for authenticated users)
	// 3. First participant in the room (room creator)
	isHostParam := r.URL.Query().Get("isHost") == "true"
	userID := r.Header.Get("X-User-ID")
	room.mu.Lock()
	isFirstParticipant := len(room.Participants) == 0 && len(room.WaitingRoom) == 0
	room.mu.Unlock()

	isHost := isHostParam || (userID != "" && userID == room.HostID) || isFirstParticipant
	if isHost {
		participant.IsHost = true
		participant.Name = hostName
		participant.Approved = true
		log.Printf("[WS] 🔑 Identified as HOST - Query param: %v, UserID match: %v, First participant: %v", isHostParam, userID == room.HostID, isFirstParticipant)
	}

	// Add to room - SIMPLIFIED: Everyone joins directly, no waiting room
	room.mu.Lock()

	if len(room.Participants) >= 2 {
		room.mu.Unlock()
		conn.WriteMessage(websocket.TextMessage, []byte(`{"error":"room full (max 2 participants)"}`))
		return
	}

	// Add participant to room
	participant.Approved = true // Everyone is auto-approved
	room.Participants[conn] = participant
	participantCount := len(room.Participants)
	room.mu.Unlock()

	log.Printf("[WS] ✅ %s joined room %s (%d participants)", participant.Name, roomID, participantCount)

	// Send join confirmation
	conn.WriteJSON(Message{
		Type: "joined",
		Data: json.RawMessage(fmt.Sprintf(`{"name":"%s","id":"%s","isHost":%v}`, participant.Name, participantID, isHost)),
	})

	// Notify other participants
	if participantCount > 1 {
		joinMsg := Message{
			Type: "join",
			Data: json.RawMessage(fmt.Sprintf(`{"name":"%s","id":"%s"}`, participant.Name, participantID)),
		}
		room.mu.RLock()
		for c, p := range room.Participants {
			if c != conn {
				c.WriteJSON(joinMsg)
				log.Printf("[WS] 📢 Notified %s about %s joining", p.Name, participant.Name)
			}
		}
		room.mu.RUnlock()
	}

	// Cleanup on disconnect
	defer func() {
		room.mu.Lock()
		delete(room.Participants, conn)
		delete(room.WaitingRoom, participantID)
		remaining := len(room.Participants)
		waitingCount := len(room.WaitingRoom)
		room.mu.Unlock()

		// Notify others
		if participant.Approved {
			leaveMsg := Message{
				Type: "leave",
				Data: json.RawMessage(fmt.Sprintf(`{"name":"%s","id":"%s"}`, participant.Name, participantID)),
				Room: roomID,
				User: participantID,
			}
			broadcastToRoom(room, leaveMsg, conn)
		}

		log.Printf("[WS] 👋 %s left room %s (%d active, %d waiting)", participant.Name, roomID, remaining, waitingCount)

		// NOTE: We do NOT delete/deactivate meeting when host leaves
		// Meeting stays active until TTL expires or explicitly ended
		// This allows multiple sessions with same meeting link

		// If room empty and no one waiting, clean up memory
		if remaining == 0 && waitingCount == 0 {
			cleanupRoom(roomID)
			log.Printf("[WS] 🧹 Room %s cleaned up from memory (meeting still active in Redis)", roomID)
		}
	}()

	// Message loop
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[WS] ⚠️  Unexpected close: %v", err)
			}
			break
		}

		var message Message
		if err := json.Unmarshal(msg, &message); err != nil {
			log.Printf("[WS] ⚠️  Invalid JSON: %v", err)
			continue
		}

		// Validate message type
		validTypes := map[string]bool{
			"chat": true, "offer": true, "answer": true,
			"ice-candidate": true, "ping": true, "join": true,
		}

		if !validTypes[message.Type] {
			log.Printf("[WS] ⚠️  Unsupported type: %s", message.Type)
			continue
		}

		// Handle ping
		if message.Type == "ping" {
			conn.WriteJSON(map[string]string{"type": "pong"})
			continue
		}

		message.User = participantID
		message.UserName = participant.Name
		message.Room = roomID

		log.Printf("[WS] 📨 %s: %s → broadcast", participantID, message.Type)

		// Broadcast to other participant
		broadcastToRoom(room, message, conn)
	}
}

func broadcastToRoom(room *Room, msg Message, exclude *websocket.Conn) {
	room.mu.RLock()
	defer room.mu.RUnlock()

	for conn := range room.Participants {
		if conn != exclude {
			if err := conn.WriteJSON(msg); err != nil {
				log.Printf("[WS] ⚠️  Broadcast failed: %v", err)
			}
		}
	}
}

// SFU WebSocket handler for group calls
func sfuWSHandler(w http.ResponseWriter, r *http.Request) {
	roomID := r.URL.Query().Get("room")
	userName := r.URL.Query().Get("name")
	isHostQuery := r.URL.Query().Get("isHost")

	log.Printf("[SFU-WS] 🌐 WebSocket connection attempt - Room: %s, Name: %s, isHost: %s, RemoteAddr: %s",
		roomID, userName, isHostQuery, r.RemoteAddr)

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[SFU-WS] ❌ Upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	if roomID == "" {
		conn.WriteJSON(map[string]string{"error": "room ID missing"})
		return
	}

	if userName == "" {
		userName = "Guest"
	}

	// Check if meeting exists in Redis
	meetingData, err := getMeeting(roomID)
	if err != nil {
		log.Printf("[SFU-WS] ❌ Meeting not found in Redis: %v", err)
		conn.WriteJSON(map[string]string{"error": "meeting not found or expired"})
		return
	}
	log.Printf("[SFU-WS] ✅ Meeting found in Redis")

	// Check if meeting is still active
	isActive := true
	if active, ok := meetingData["active"].(bool); ok {
		isActive = active
	}
	if !isActive {
		log.Printf("[SFU-WS] ❌ Meeting is no longer active")
		conn.WriteJSON(map[string]string{"error": "meeting has ended"})
		return
	}

	// Verify this is a group meeting
	mode := "1on1"
	if m, ok := meetingData["mode"].(string); ok {
		mode = m
	}
	log.Printf("[SFU-WS] 🎯 Meeting mode: %s", mode)

	if mode != "group" {
		log.Printf("[SFU-WS] ❌ Not a group meeting, rejecting connection")
		conn.WriteJSON(map[string]string{"error": "this is not a group meeting"})
		return
	}

	// Get or create SFU room
	room := sfuServer.GetOrCreateRoom(roomID)
	log.Printf("[SFU-WS] ✅ Got SFU room")

	// Generate participant ID
	participantID := uuid.NewString()
	log.Printf("[SFU-WS] 🆔 Generated participant ID: %s", participantID)

	// Check if this is the host - multiple ways:
	// 1. isHost=true in query parameter (from sessionStorage)
	// 2. X-User-ID header matches (authenticated users)
	// 3. First participant in the room (room creator)
	isHostParam := r.URL.Query().Get("isHost") == "true"
	userID := r.Header.Get("X-User-ID")
	hostID := ""
	if id, ok := meetingData["host_id"].(string); ok {
		hostID = id
	}

	// Get host name
	hostName := "Host"
	if name, ok := meetingData["host_name"].(string); ok {
		hostName = name
	}

	// Determine if host based on query param or user ID match
	isHost := isHostParam || (userID != "" && userID == hostID)

	if isHost {
		userName = hostName
		log.Printf("[SFU-WS] 🔑 Identified as HOST - Query param: %v, UserID match: %v", isHostParam, userID == hostID)
	} else {
		log.Printf("[SFU-WS] 👤 Identified as GUEST: %s", userName)
	}

	// Add participant to SFU room with TURN credentials
	log.Printf("[SFU-WS] 🔄 Adding participant to SFU room...")
	participant, participantCount, err := room.AddParticipant(participantID, userName, conn, turnHost, turnUsername, turnPassword)
	if err != nil {
		log.Printf("[SFU-WS] ❌ Failed to add participant: %v", err)
		conn.WriteJSON(map[string]string{"error": err.Error()})
		return
	}
	log.Printf("[SFU-WS] ✅ Participant added successfully")

	log.Printf("[SFU-WS] ✅ %s joined group room %s (%d/%d participants)",
		userName, roomID, participantCount, 20)

	// Send join confirmation
	conn.WriteJSON(map[string]interface{}{
		"type": "joined",
		"data": map[string]interface{}{
			"id":               participantID,
			"name":             userName,
			"isHost":           isHost,
			"participantCount": participantCount + 1,
		},
	})

	// Notify others about new participant
	participants := room.GetAllParticipants()
	for _, p := range participants {
		if p.ID != participantID {
			p.SendMessage(map[string]interface{}{
				"type": "participant-joined",
				"data": map[string]interface{}{
					"id":   participantID,
					"name": userName,
				},
			})
		}
	}

	// Send existing participants list to new participant
	existingParticipants := []map[string]string{}
	for _, p := range participants {
		if p.ID != participantID {
			existingParticipants = append(existingParticipants, map[string]string{
				"id":   p.ID,
				"name": p.Name,
			})
		}
	}
	conn.WriteJSON(map[string]interface{}{
		"type": "participants-list",
		"data": existingParticipants,
	})

	// CLIENT will send offer to SFU, SFU will respond with answer
	log.Printf("[SFU-WS] ⏳ Waiting for offer from participant %s", participantID)

	// Handle signaling messages
	for {
		var msg map[string]interface{}
		err := conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[SFU-WS] ⚠️  Unexpected close: %v", err)
			}
			break
		}

		msgType, ok := msg["type"].(string)
		if !ok {
			log.Printf("[SFU-WS] ⚠️  Invalid message format: %+v", msg)
			continue
		}

		log.Printf("[SFU-WS] 📨 Received message type: %s from participant %s", msgType, participantID)

		dataStr := ""
		if data, ok := msg["data"].(string); ok {
			dataStr = data
			log.Printf("[SFU-WS] 📦 Data length: %d bytes", len(dataStr))
		} else {
			log.Printf("[SFU-WS] ⚠️  Data is not string, type: %T", msg["data"])
		}

		switch msgType {
		case "offer":
			log.Printf("[SFU-WS] 🔵 Processing offer from %s", participantID)
			if err := participant.HandleOffer(dataStr); err != nil {
				log.Printf("[SFU-WS] ❌ Handle offer error: %v", err)
			} else {
				log.Printf("[SFU-WS] ✅ Offer handled successfully, answer sent")
			}

		case "answer":
			log.Printf("[SFU-WS] 🔵 Processing answer from %s", participantID)
			if err := participant.HandleAnswer(dataStr); err != nil {
				log.Printf("[SFU-WS] ❌ Handle answer error: %v", err)
			} else {
				log.Printf("[SFU-WS] ✅ Answer handled successfully")
			}

		case "ice-candidate":
			log.Printf("[SFU-WS] 🧊 Processing ICE candidate from %s", participantID)
			if err := participant.HandleICECandidate(dataStr); err != nil {
				log.Printf("[SFU-WS] ❌ Handle ICE candidate error: %v", err)
			} else {
				log.Printf("[SFU-WS] ✅ ICE candidate added successfully")
			}

		case "quality-update":
			log.Printf("[SFU-WS] 🎚️ Quality update from %s", participantID)
			var payload struct {
				Level string `json:"level"`
			}
			if err := json.Unmarshal([]byte(dataStr), &payload); err != nil {
				log.Printf("[SFU-WS] ⚠️  Invalid quality payload: %v", err)
				break
			}
			if err := participant.SetPreferredQualityString(payload.Level); err != nil {
				log.Printf("[SFU-WS] ⚠️  Failed to set quality for %s: %v", participantID, err)
			}

		case "ping":
			participant.SendMessage(map[string]interface{}{
				"type": "pong",
				"data": fmt.Sprintf("%d", time.Now().UnixMilli()),
			})
			log.Printf("[SFU-WS] ❤️ Heartbeat ping from %s", participantID)

		case "chat":
			// Parse chat data
			var chatData map[string]interface{}
			if dataMap, ok := msg["data"].(map[string]interface{}); ok {
				chatData = dataMap
			} else if dataStr, ok := msg["data"].(string); ok {
				// If data is string, parse it
				if err := json.Unmarshal([]byte(dataStr), &chatData); err != nil {
					// If parsing fails, treat as plain text
					chatData = map[string]interface{}{
						"text": dataStr,
						"to":   "everyone",
					}
				}
			} else {
				log.Printf("[SFU-WS] ❌ Invalid chat data format")
				participant.SendMessage(map[string]interface{}{
					"type":  "error",
					"error": "Invalid chat message format",
				})
				continue
			}

			// Validate chat message text
			text, ok := chatData["text"].(string)
			if !ok || text == "" {
				log.Printf("[SFU-WS] ❌ Invalid chat: missing or empty text")
				participant.SendMessage(map[string]interface{}{
					"type":  "error",
					"error": "Chat message text is required",
				})
				continue
			}

			// Validate text length (max 5000 characters for regular messages, 2000 for GIFs)
			isGif := strings.HasPrefix(text, "[GIF]")
			maxLength := 5000
			if isGif {
				maxLength = 2000 // GIF URLs should be shorter
			}

			if len(text) > maxLength {
				log.Printf("[SFU-WS] ❌ Chat message too long: %d characters", len(text))
				participant.SendMessage(map[string]interface{}{
					"type":  "error",
					"error": fmt.Sprintf("Message too long (max %d characters)", maxLength),
				})
				continue
			}

			// Validate GIF URL format
			if isGif {
				gifURL := text[5:] // Remove [GIF] prefix
				if !strings.HasPrefix(gifURL, "https://") {
					log.Printf("[SFU-WS] ❌ Invalid GIF URL: must use HTTPS")
					participant.SendMessage(map[string]interface{}{
						"type":  "error",
						"error": "Invalid GIF URL: must use HTTPS",
					})
					continue
				}
			}

			// Check rate limiting for chat (max 30 messages per 30 seconds)
			rateLimitKey := fmt.Sprintf("chat_limit:%s:%s", roomID, participantID)
			count, err := rdb.Incr(ctx, rateLimitKey).Result()
			if err != nil {
				log.Printf("[SFU-WS] ❌ Rate limit check failed: %v", err)
			} else {
				if count == 1 {
					rdb.Expire(ctx, rateLimitKey, 30*time.Second)
				}
				if count > 30 {
					log.Printf("[SFU-WS] ⚠️ Rate limit exceeded for chat from %s", userName)
					participant.SendMessage(map[string]interface{}{
						"type":  "error",
						"error": "Too many messages. Please slow down.",
					})
					continue
				}
			}

			// Add sender info
			chatData["from"] = participantID
			chatData["fromName"] = userName

			// Get recipient
			recipient := "everyone"
			if to, ok := chatData["to"].(string); ok {
				recipient = to
			}

			// Validate recipient format
			if recipient != "everyone" && len(recipient) > 100 {
				log.Printf("[SFU-WS] ❌ Invalid recipient ID: too long")
				participant.SendMessage(map[string]interface{}{
					"type":  "error",
					"error": "Invalid recipient ID",
				})
				continue
			}

			// Send to recipient(s)
			if recipient == "everyone" {
				// Broadcast to all
				for _, p := range room.GetAllParticipants() {
					if p.ID != participantID {
						p.SendMessage(map[string]interface{}{
							"type": "chat",
							"data": chatData,
						})
					}
				}
			} else {
				// Validate that recipient exists in room
				if targetParticipant, exists := room.GetParticipant(recipient); exists {
					targetParticipant.SendMessage(map[string]interface{}{
						"type": "chat",
						"data": chatData,
					})
				} else {
					log.Printf("[SFU-WS] ❌ Recipient not found: %s", recipient)
					participant.SendMessage(map[string]interface{}{
						"type":  "error",
						"error": "Recipient not found in this room",
					})
				}
			}

		case "reaction":
			// Validate reaction data
			emoji, ok := msg["emoji"].(string)
			if !ok || emoji == "" {
				log.Printf("[SFU-WS] ❌ Invalid reaction: missing or invalid emoji field")
				participant.SendMessage(map[string]interface{}{
					"type":  "error",
					"error": "Invalid reaction: emoji is required",
				})
				continue
			}

			// Validate emoji format (must be valid emoji characters)
			if !isValidEmoji(emoji) {
				log.Printf("[SFU-WS] ❌ Invalid emoji format: %s", emoji)
				participant.SendMessage(map[string]interface{}{
					"type":  "error",
					"error": "Invalid emoji format",
				})
				continue
			}

			// Validate emoji length (prevent spam with very long strings)
			if len(emoji) > 20 {
				log.Printf("[SFU-WS] ❌ Emoji too long: %d bytes", len(emoji))
				participant.SendMessage(map[string]interface{}{
					"type":  "error",
					"error": "Emoji string too long",
				})
				continue
			}

			// Check rate limiting for reactions (max 10 reactions per 10 seconds)
			rateLimitKey := fmt.Sprintf("reaction_limit:%s:%s", roomID, participantID)
			count, err := rdb.Incr(ctx, rateLimitKey).Result()
			if err != nil {
				log.Printf("[SFU-WS] ❌ Rate limit check failed: %v", err)
			} else {
				if count == 1 {
					rdb.Expire(ctx, rateLimitKey, 10*time.Second)
				}
				if count > 10 {
					log.Printf("[SFU-WS] ⚠️ Rate limit exceeded for reactions from %s", userName)
					participant.SendMessage(map[string]interface{}{
						"type":  "error",
						"error": "Too many reactions. Please slow down.",
					})
					continue
				}
			}

			// Broadcast reaction to all participants
			reactionData := map[string]interface{}{
				"emoji":     emoji,
				"user_name": userName,
			}

			log.Printf("[SFU-WS] 🎉 Reaction from %s: %s", userName, emoji)

			// Broadcast to all other participants
			for _, p := range room.GetAllParticipants() {
				if p.ID != participantID {
					p.SendMessage(map[string]interface{}{
						"type": "reaction",
						"data": reactionData,
					})
				}
			}

		case "raise_hand":
			// Validate raise_hand data
			raised, ok := msg["raised"].(bool)
			if !ok {
				log.Printf("[SFU-WS] ❌ Invalid raise_hand: missing or invalid 'raised' field")
				participant.SendMessage(map[string]interface{}{
					"type":  "error",
					"error": "Invalid raise_hand: 'raised' must be a boolean",
				})
				continue
			}

			// Check rate limiting for raise_hand (max 5 toggles per 30 seconds to prevent spam)
			rateLimitKey := fmt.Sprintf("raise_hand_limit:%s:%s", roomID, participantID)
			count, err := rdb.Incr(ctx, rateLimitKey).Result()
			if err != nil {
				log.Printf("[SFU-WS] ❌ Rate limit check failed: %v", err)
			} else {
				if count == 1 {
					rdb.Expire(ctx, rateLimitKey, 30*time.Second)
				}
				if count > 5 {
					log.Printf("[SFU-WS] ⚠️ Rate limit exceeded for raise_hand from %s", userName)
					participant.SendMessage(map[string]interface{}{
						"type":  "error",
						"error": "Too many hand raises. Please slow down.",
					})
					continue
				}
			}

			// Broadcast raise hand status to all participants
			handData := map[string]interface{}{
				"user_name": userName,
				"raised":    raised,
			}

			log.Printf("[SFU-WS] ✋ Raise hand from %s: %v", userName, raised)

			// Broadcast to all other participants
			for _, p := range room.GetAllParticipants() {
				if p.ID != participantID {
					p.SendMessage(map[string]interface{}{
						"type": "raise_hand",
						"data": handData,
					})
				}
			}

		case "message_reaction":
			// Validate message_reaction data
			messageID, ok := msg["message_id"].(string)
			if !ok || messageID == "" {
				log.Printf("[SFU-WS] ❌ Invalid message_reaction: missing or invalid message_id")
				participant.SendMessage(map[string]interface{}{
					"type":  "error",
					"error": "Invalid message_reaction: message_id is required",
				})
				continue
			}

			emoji, ok := msg["emoji"].(string)
			if !ok || emoji == "" {
				log.Printf("[SFU-WS] ❌ Invalid message_reaction: missing or invalid emoji")
				participant.SendMessage(map[string]interface{}{
					"type":  "error",
					"error": "Invalid message_reaction: emoji is required",
				})
				continue
			}

			// Validate emoji format
			if !isValidEmoji(emoji) {
				log.Printf("[SFU-WS] ❌ Invalid emoji format in message_reaction: %s", emoji)
				participant.SendMessage(map[string]interface{}{
					"type":  "error",
					"error": "Invalid emoji format",
				})
				continue
			}

			// Validate emoji length
			if len(emoji) > 20 {
				log.Printf("[SFU-WS] ❌ Emoji too long in message_reaction: %d bytes", len(emoji))
				participant.SendMessage(map[string]interface{}{
					"type":  "error",
					"error": "Emoji string too long",
				})
				continue
			}

			// Validate message_id format (must match pattern msg_*_*)
			if len(messageID) > 100 || !isValidMessageID(messageID) {
				log.Printf("[SFU-WS] ❌ Invalid message_id format: %s", messageID)
				participant.SendMessage(map[string]interface{}{
					"type":  "error",
					"error": "Invalid message_id format",
				})
				continue
			}

			// Check rate limiting for message reactions (max 20 reactions per 30 seconds)
			rateLimitKey := fmt.Sprintf("msg_reaction_limit:%s:%s", roomID, participantID)
			count, err := rdb.Incr(ctx, rateLimitKey).Result()
			if err != nil {
				log.Printf("[SFU-WS] ❌ Rate limit check failed: %v", err)
			} else {
				if count == 1 {
					rdb.Expire(ctx, rateLimitKey, 30*time.Second)
				}
				if count > 20 {
					log.Printf("[SFU-WS] ⚠️ Rate limit exceeded for message_reaction from %s", userName)
					participant.SendMessage(map[string]interface{}{
						"type":  "error",
						"error": "Too many message reactions. Please slow down.",
					})
					continue
				}
			}

			// Broadcast message reaction to all participants
			msgReactionData := map[string]interface{}{
				"message_id": messageID,
				"emoji":      emoji,
				"user_name":  userName,
			}

			log.Printf("[SFU-WS] 💬 Message reaction from %s: %s on message %s", userName, emoji, messageID)

			// Broadcast to all other participants
			for _, p := range room.GetAllParticipants() {
				if p.ID != participantID {
					p.SendMessage(map[string]interface{}{
						"type": "message_reaction",
						"data": msgReactionData,
					})
				}
			}

		case "host-mute-request":
			// Host requesting to mute a participant
			// For now, we trust the client's isHost claim
			// TODO: Add server-side host validation by storing host ID in Redis

			// Parse mute request data
			var muteData map[string]interface{}
			if dataMap, ok := msg["data"].(map[string]interface{}); ok {
				muteData = dataMap
			} else if dataStr, ok := msg["data"].(string); ok {
				if err := json.Unmarshal([]byte(dataStr), &muteData); err != nil {
					log.Printf("[SFU-WS] Failed to parse mute request data: %v", err)
					continue
				}
			}

			targetID, _ := muteData["targetParticipantId"].(string)
			mediaType, _ := muteData["mediaType"].(string)

			if targetID == "" || mediaType == "" {
				log.Printf("[SFU-WS] Invalid mute request data")
				continue
			}

			log.Printf("[SFU-WS] 🔇 Host %s requesting to mute %s for participant %s", userName, mediaType, targetID)

			// Send mute request to target participant
			if targetParticipant, exists := room.GetParticipant(targetID); exists {
				targetParticipant.SendMessage(map[string]interface{}{
					"type": "host-mute-request",
					"data": map[string]string{
						"mediaType": mediaType,
					},
				})
				log.Printf("[SFU-WS] ✅ Mute request sent to participant %s", targetID)
			} else {
				log.Printf("[SFU-WS] ⚠️  Target participant %s not found", targetID)
			}

		default:
			log.Printf("[SFU-WS] ⚠️  Unknown message type: %s", msgType)
		}
	}

	// Cleanup on disconnect
	room.RemoveParticipant(participantID)
	log.Printf("[SFU-WS] 👋 %s left group room %s", userName, roomID)

	// CRITICAL FIX: Do NOT deactivate meeting when host leaves
	// Meeting should stay active until TTL expires or explicitly ended
	// This allows multiple sessions and rejoining
	log.Printf("[SFU-WS] 👋 %s left (meeting remains active for rejoining)", userName)

	// Notify others
	for _, p := range room.GetAllParticipants() {
		p.SendMessage(map[string]interface{}{
			"type": "participant-left",
			"data": map[string]interface{}{
				"id":   participantID,
				"name": userName,
			},
		})
	}

	// If room is empty, it will be cleaned up by SFU's internal logic
}

// AI Notetaker Handlers

func startNotetakerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		RoomID string `json:"room_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	// SECURITY: Verify user is host of this room
	userID := r.Header.Get("X-User-ID")
	mu.Lock()
	room, roomExists := rooms[req.RoomID]
	mu.Unlock()

	if roomExists && room.HostID != userID {
		log.Printf("[NOTETAKER] ❌ Unauthorized: user %s is not host of room %s", userID, req.RoomID)
		http.Error(w, "unauthorized: only host can start notetaker", http.StatusForbidden)
		return
	}

	// If room not in memory, check Redis
	if !roomExists {
		meeting, err := getMeeting(req.RoomID)
		if err != nil || meeting == nil {
			http.Error(w, "room not found", http.StatusNotFound)
			return
		}
		if meeting["host_user_id"].(string) != userID {
			log.Printf("[NOTETAKER] ❌ Unauthorized: user %s is not host of room %s (Redis)", userID, req.RoomID)
			http.Error(w, "unauthorized: only host can start notetaker", http.StatusForbidden)
			return
		}
	}

	mu.Lock()
	if _, exists := notetakerSessions[req.RoomID]; exists {
		mu.Unlock()
		http.Error(w, "notetaker already active", http.StatusConflict)
		return
	}

	session := &NotetakerSession{
		RoomID:       req.RoomID,
		AudioChunks:  make([][]byte, 0),
		StartTime:    time.Now(),
		Participants: make([]string, 0),
	}
	notetakerSessions[req.RoomID] = session
	mu.Unlock()

	log.Printf("[NOTETAKER] 🎙️ Started for room %s by host %s", req.RoomID, userID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"room_id":    req.RoomID,
		"start_time": session.StartTime,
	})
}

func stopNotetakerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		RoomID     string `json:"room_id"`
		AudioData  string `json:"audio_data"` // base64 encoded audio
		Transcript string `json:"transcript"` // client-side transcript if available
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	// SECURITY: Verify user is host of this room
	userID := r.Header.Get("X-User-ID")
	mu.Lock()
	room, roomExists := rooms[req.RoomID]
	mu.Unlock()

	if roomExists && room.HostID != userID {
		log.Printf("[NOTETAKER] ❌ Unauthorized stop: user %s is not host of room %s", userID, req.RoomID)
		http.Error(w, "unauthorized: only host can stop notetaker", http.StatusForbidden)
		return
	}

	// If room not in memory, check Redis
	if !roomExists {
		meeting, err := getMeeting(req.RoomID)
		if err != nil || meeting == nil {
			http.Error(w, "room not found", http.StatusNotFound)
			return
		}
		if meeting["host_user_id"].(string) != userID {
			log.Printf("[NOTETAKER] ❌ Unauthorized stop: user %s is not host of room %s (Redis)", userID, req.RoomID)
			http.Error(w, "unauthorized: only host can stop notetaker", http.StatusForbidden)
			return
		}
	}

	mu.Lock()
	session, exists := notetakerSessions[req.RoomID]
	if !exists {
		mu.Unlock()
		http.Error(w, "notetaker session not found", http.StatusNotFound)
		return
	}
	delete(notetakerSessions, req.RoomID)
	mu.Unlock()

	duration := time.Since(session.StartTime)
	log.Printf("[NOTETAKER] 🛑 Stopped for room %s by host %s (duration: %v)", req.RoomID, userID, duration)

	// Use provided transcript or return empty
	transcript := req.Transcript
	if transcript == "" {
		transcript = "No transcript available"
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"room_id":    req.RoomID,
		"duration":   duration.String(),
		"transcript": transcript,
	})
}

func notetakerStatusHandler(w http.ResponseWriter, r *http.Request) {
	roomID := r.URL.Query().Get("room_id")
	if roomID == "" {
		http.Error(w, "room_id required", http.StatusBadRequest)
		return
	}

	mu.RLock()
	session, active := notetakerSessions[roomID]
	mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	if active {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"active":     true,
			"start_time": session.StartTime,
			"duration":   time.Since(session.StartTime).String(),
		})
	} else {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"active": false,
		})
	}
}

func analyzeTranscriptHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Transcript   string   `json:"transcript"`
		Participants []string `json:"participants"`
		Duration     string   `json:"duration"`
		RolePreset   string   `json:"rolePreset,omitempty"` // Role preset for customized analysis
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	log.Printf("[NOTETAKER] 🤖 Analyzing transcript (%d chars) with role preset: %s", len(req.Transcript), req.RolePreset)

	// Call OpenAI GPT-4o for analysis with role-specific prompts
	analysis, err := generateMeetingAnalysis(req.Transcript, req.Participants, req.Duration, req.RolePreset)
	if err != nil {
		log.Printf("[NOTETAKER] ❌ Analysis failed: %v", err)
		http.Error(w, fmt.Sprintf("analysis failed: %v", err), http.StatusInternalServerError)
		return
	}

	log.Printf("[NOTETAKER] ✅ Analysis complete")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(analysis)
}

func generateMeetingAnalysis(transcript string, participants []string, duration string, rolePreset string) (*MeetingAnalysis, error) {
	// Check if OpenAI API key is configured
	if openAIAPIKey == "" {
		log.Printf("[NOTETAKER] ⚠️  OpenAI API key not configured")
		return &MeetingAnalysis{
			Summary:      "AI analysis unavailable - OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.",
			KeyPoints:    []string{"Manual review required - AI analysis is disabled"},
			ActionItems:  []string{},
			Participants: participants,
			Duration:     duration,
			Transcript:   transcript,
		}, nil
	}

	// Prepare role-specific GPT-4o prompt
	var systemPrompt string
	var analysisInstructions string

	switch rolePreset {
	case "language-teacher":
		systemPrompt = "You are an expert language teacher and linguist. Analyze this conversation focusing on language learning aspects."
		analysisInstructions = `Analyze focusing on:
1. Grammar patterns and structures used
2. Vocabulary breadth and new words introduced
3. Common errors and mistakes to correct
4. Pronunciation and fluency observations
5. Recommended areas for improvement`

	case "therapist":
		systemPrompt = "You are a professional therapist and counselor. Analyze this conversation focusing on emotional and psychological aspects."
		analysisInstructions = `Analyze focusing on:
1. Emotional states and patterns observed
2. Key therapeutic insights and breakthroughs
3. Coping mechanisms discussed
4. Relationship dynamics and patterns
5. Recommended therapeutic homework or follow-up topics`

	case "business-coach":
		systemPrompt = "You are an experienced business coach and strategy consultant. Analyze this conversation focusing on business and professional development."
		analysisInstructions = `Analyze focusing on:
1. Business challenges and opportunities identified
2. Strategic decisions and action items
3. Key performance indicators (KPIs) discussed
4. Risk factors and mitigation strategies
5. Leadership and team dynamics insights`

	case "medical-consultant":
		systemPrompt = "You are a medical professional analyzing a consultation session. Focus on health-related information."
		analysisInstructions = `Analyze focusing on:
1. Symptoms and health concerns discussed
2. Medical history and relevant information
3. Diagnostic observations and questions
4. Treatment recommendations or action items
5. Follow-up care and monitoring needed`

	case "tutor":
		systemPrompt = "You are an educational tutor analyzing a tutoring session. Focus on learning outcomes and student progress."
		analysisInstructions = `Analyze focusing on:
1. Learning objectives covered
2. Concepts mastered and areas needing review
3. Teaching methods and their effectiveness
4. Student engagement and comprehension level
5. Homework assignments and practice recommendations`

	default:
		// General meeting analysis
		systemPrompt = "You are a professional meeting analyst. Provide concise, actionable insights."
		analysisInstructions = `Analyze this meeting and provide:
1. Executive Summary (2-3 sentences)
2. Key Discussion Points (bullet list)
3. Action Items with assignees (if mentioned)
4. Important Decisions Made`
	}

	prompt := fmt.Sprintf(`%s

Meeting Duration: %s
Participants: %s

Transcript:
%s

Provide your analysis in JSON format with these fields:
- summary: string (2-3 sentences)
- key_points: array of strings (5-8 key insights)
- action_items: array of strings (actionable next steps)
- decisions: array of strings (important conclusions or decisions)`, analysisInstructions, duration, strings.Join(participants, ", "), transcript)

	// Call OpenAI API with GPT-4o for superior analysis quality
	reqBody := map[string]interface{}{
		"model": "gpt-4o",
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": systemPrompt,
			},
			{
				"role":    "user",
				"content": prompt,
			},
		},
		"temperature":     0.7,
		"response_format": map[string]string{"type": "json_object"},
	}

	reqJSON, _ := json.Marshal(reqBody)
	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", strings.NewReader(string(reqJSON)))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+openAIAPIKey)

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OpenAI API error: %s - %s", resp.Status, string(body))
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	if len(result.Choices) == 0 {
		return nil, fmt.Errorf("no response from OpenAI")
	}

	// Parse the JSON response
	var analysisData struct {
		Summary     string   `json:"summary"`
		KeyPoints   []string `json:"key_points"`
		ActionItems []string `json:"action_items"`
		Decisions   []string `json:"decisions"`
	}

	if err := json.Unmarshal([]byte(result.Choices[0].Message.Content), &analysisData); err != nil {
		return nil, err
	}

	// Combine action items and decisions
	allActionItems := append(analysisData.ActionItems, analysisData.Decisions...)

	return &MeetingAnalysis{
		Summary:      analysisData.Summary,
		KeyPoints:    analysisData.KeyPoints,
		ActionItems:  allActionItems,
		Participants: participants,
		Duration:     duration,
		Transcript:   transcript,
	}, nil
}

func saveTranscriptHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		RoomID     string                   `json:"room_id"`
		SessionID  string                   `json:"session_id"`
		Transcript []map[string]interface{} `json:"transcript"`
		Metadata   map[string]interface{}   `json:"metadata"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	// Generate unique transcript ID
	transcriptID := uuid.NewString()

	// Store in Redis with 7 days TTL
	transcriptKey := fmt.Sprintf("transcript:%s", transcriptID)
	transcriptData := map[string]interface{}{
		"room_id":    req.RoomID,
		"session_id": req.SessionID,
		"transcript": req.Transcript,
		"metadata":   req.Metadata,
		"created_at": time.Now().Format(time.RFC3339),
	}

	transcriptJSON, err := json.Marshal(transcriptData)
	if err != nil {
		http.Error(w, "failed to marshal transcript", http.StatusInternalServerError)
		return
	}

	ctx := context.Background()
	if err := rdb.Set(ctx, transcriptKey, transcriptJSON, 7*24*time.Hour).Err(); err != nil {
		log.Printf("[TRANSCRIPT] ❌ Failed to save: %v", err)
		http.Error(w, "failed to save transcript", http.StatusInternalServerError)
		return
	}

	log.Printf("[TRANSCRIPT] ✅ Saved transcript %s for room %s", transcriptID, req.RoomID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":       true,
		"transcript_id": transcriptID,
		"expires_at":    time.Now().Add(7 * 24 * time.Hour).Format(time.RFC3339),
	})
}

func main() {
	flag.Parse()

	// Support Railway PORT
	if port := os.Getenv("PORT"); port != "" && *addr == ":8080" {
		*addr = ":" + port
	}

	// Initialize Redis
	initRedis()

	// Initialize TURN config
	initTURN()

	// Initialize SFU server
	sfuServer = sfu.NewSFUServer()
	log.Printf("[SFU] ✅ SFU server initialized")

	// Setup static files
	staticFS, err := fs.Sub(staticFiles, "static")
	if err != nil {
		log.Fatalf("❌ Failed to create static FS: %v", err)
	}

	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.FS(staticFS))))

	// Login (host only)
	http.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			serveFile("login.html")(w, r)
			return
		}

		if r.Method == http.MethodPost {
			var creds struct {
				Username string `json:"username"`
				Password string `json:"password"`
			}

			body, _ := io.ReadAll(r.Body)
			if err := json.Unmarshal(body, &creds); err != nil {
				http.Error(w, "Invalid JSON", http.StatusBadRequest)
				return
			}

			log.Printf("[LOGIN] Attempt: %s", creds.Username)

			if creds.Username == validUsername && creds.Password == validPassword {
				token, _ := generateToken()
				userID := "host_" + uuid.NewString()[:8]

				// Store session in Redis
				storeSession(token, userID)

				// Set cookie
				http.SetCookie(w, &http.Cookie{
					Name:     "auth_token",
					Value:    token,
					Path:     "/",
					MaxAge:   86400,
					HttpOnly: true,
					Secure:   r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https",
					SameSite: http.SameSiteLaxMode,
				})

				log.Printf("[LOGIN] ✅ Success: %s (token: %s...)", creds.Username, token[:10])

				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(map[string]any{
					"success": true,
					"token":   token,
				})
			} else {
				log.Printf("[LOGIN] ❌ Invalid credentials: %s", creds.Username)
				w.WriteHeader(http.StatusUnauthorized)
				json.NewEncoder(w).Encode(map[string]any{
					"success": false,
					"message": "Invalid credentials",
				})
			}
			return
		}

		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	})

	// Logout
	http.HandleFunc("/logout", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		cookie, _ := r.Cookie("auth_token")
		if cookie != nil {
			// Delete from Redis
			rdb.Del(ctx, fmt.Sprintf("session:%s", cookie.Value))
		}

		http.SetCookie(w, &http.Cookie{
			Name:   "auth_token",
			Value:  "",
			Path:   "/",
			MaxAge: -1,
		})

		http.Redirect(w, r, "/login", http.StatusSeeOther)
	}))

	// Health check endpoint for hibernation system (must be before "/" catch-all)
	http.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		// Check if all services are ready
		redisOK := true
		if err := rdb.Ping(ctx).Err(); err != nil {
			redisOK = false
		}

		sfuOK := sfuServer != nil

		status := "ready"
		if !redisOK || !sfuOK {
			status = "starting"
		}

		response := map[string]interface{}{
			"status":    status,
			"redis":     redisOK,
			"sfu":       sfuOK,
			"uptime":    time.Since(startTime).Seconds(),
			"timestamp": time.Now().Unix(),
			"version":   buildVersion,
			"build_date": buildDate,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	})

	// Landing page (public)
	http.HandleFunc("/", serveFile("landing.html"))

	// Home (host only)
	http.HandleFunc("/home", authMiddleware(serveFile("home.html")))

	// Guest join page
	http.HandleFunc("/join/", func(w http.ResponseWriter, r *http.Request) {
		serveFile("guest.html")(w, r)
	})

	// Meeting room - route based on meeting mode
	http.HandleFunc("/room/", func(w http.ResponseWriter, r *http.Request) {
		// Extract room ID from URL
		pathParts := strings.Split(r.URL.Path, "/")
		roomID := ""
		if len(pathParts) >= 3 {
			roomID = pathParts[2]
		}

		log.Printf("[ROOM] 📱 Request for room: %s", roomID)

		// Check meeting mode
		if roomID != "" {
			meetingData, err := getMeeting(roomID)
			if err == nil {
				// Check if meeting is active
				isActive := true
				if active, ok := meetingData["active"].(bool); ok {
					isActive = active
				}

				if !isActive {
					log.Printf("[ROOM] 🔒 Meeting has ended, redirecting to meeting-ended page")
					http.Redirect(w, r, "/meeting-ended?reason=ended", http.StatusFound)
					return
				}

				mode := "1on1"
				if m, ok := meetingData["mode"].(string); ok {
					mode = m
				}

				log.Printf("[ROOM] 🎯 Mode detected: %s", mode)

				if mode == "group" {
					log.Printf("[ROOM] 👨‍👩‍👧‍👦 Serving group-call.html")
					serveFile("group-call.html")(w, r)
					return
				}
			} else {
				log.Printf("[ROOM] ⚠️  Meeting not found in Redis: %v", err)
				http.Redirect(w, r, "/meeting-ended?reason=expired", http.StatusFound)
				return
			}
		}

		// Default to 1-on-1 call UI
		log.Printf("[ROOM] 👥 Serving call.html (1-on-1)")
		serveFile("call.html")(w, r)
	})

	// Meeting ended page
	http.HandleFunc("/meeting-ended", serveFile("meeting-ended.html"))

	// Modular call page (for testing new structure)
	http.HandleFunc("/room-modular/", serveFile("call-modular.html"))

	// Create meeting (host only)
	http.HandleFunc("/create", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		userID := r.Header.Get("X-User-ID")

		// Get host name from query or use default
		hostName := r.URL.Query().Get("name")
		if hostName == "" {
			hostName = "Host"
		}

		// Get meeting mode (1on1 or group)
		mode := r.URL.Query().Get("mode")
		if mode == "" {
			mode = "1on1"
		}

		log.Printf("[CREATE] 📋 Request - UserID: %s, Host: %s, Mode: %s", userID, hostName, mode)

		roomID := createRoom(userID, hostName, mode)

		// Use PUBLIC_DOMAIN env var if set (for proxy/cloud deployments)
		// Otherwise use r.Host (for local/direct access)
		host := os.Getenv("PUBLIC_DOMAIN")
		if host == "" {
			host = r.Host
		}

		scheme := "https" // Always HTTPS for public domain
		if os.Getenv("PUBLIC_DOMAIN") == "" {
			// Only use HTTP for local development
			scheme = "http"
			if r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" {
				scheme = "https"
			}
		}

		url := fmt.Sprintf("%s://%s/join/%s", scheme, host, roomID)

		log.Printf("[CREATE] ✅ %s meeting URL: %s (Host: %s)", mode, url, hostName)

		w.Header().Set("Content-Type", "text/plain")
		w.Write([]byte(url))
	}))

	// End meeting (host only)
	http.HandleFunc("/end", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		roomID := r.URL.Query().Get("room")
		if roomID == "" {
			http.Error(w, "room ID required", http.StatusBadRequest)
			return
		}

		// Notify all participants meeting ended
		mu.RLock()
		room, exists := rooms[roomID]
		mu.RUnlock()

		if exists {
			endMsg := Message{
				Type: "meeting-ended",
				Data: json.RawMessage(`{"message":"Host ended the meeting"}`),
			}

			room.mu.RLock()
			for conn := range room.Participants {
				conn.WriteJSON(endMsg)
			}
			for _, p := range room.WaitingRoom {
				if p.Connection != nil {
					p.Connection.WriteJSON(endMsg)
				}
			}
			room.mu.RUnlock()
		}

		// Clean up completely
		cleanupRoom(roomID)

		log.Printf("[END] ✅ Meeting %s ended by host", roomID)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]bool{"success": true})
	}))

	// Get meeting info API
	http.HandleFunc("/api/meeting/", func(w http.ResponseWriter, r *http.Request) {
		pathParts := strings.Split(r.URL.Path, "/")
		roomID := ""
		if len(pathParts) >= 4 {
			roomID = pathParts[3]
		}

		if roomID == "" {
			http.Error(w, "room ID missing", http.StatusBadRequest)
			return
		}

		meetingData, err := getMeeting(roomID)
		if err != nil {
			http.Error(w, "meeting not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(meetingData)
	})

	// TURN credentials API
	http.HandleFunc("/api/turn-credentials", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"host":     turnHost,
			"username": turnUsername,
			"password": turnPassword,
		})
	})

	// WebSocket for 1-on-1 calls
	http.HandleFunc("/ws", wsHandler)

	// WebSocket for group calls (SFU)
	http.HandleFunc("/ws-sfu", sfuWSHandler)

	// AI Notetaker endpoints
	http.HandleFunc("/api/notetaker/start", authMiddleware(startNotetakerHandler))
	http.HandleFunc("/api/notetaker/stop", authMiddleware(stopNotetakerHandler))
	http.HandleFunc("/api/notetaker/status", authMiddleware(notetakerStatusHandler))
	http.HandleFunc("/api/notetaker/analyze", authMiddleware(analyzeTranscriptHandler))

	// Transcript save endpoint
	http.HandleFunc("/api/transcript/save", authMiddleware(saveTranscriptHandler))

	// Initialize start time for health check
	startTime = time.Now()

	log.Printf("🚀 Kaminskyi AI Messenger v1.0")
	log.Printf("📝 Host: %s / %s", validUsername, validPassword)
	log.Printf("🔒 Auth: Cookie + Bearer Token")
	log.Printf("🗄️  Redis: Connected")
	log.Printf("⏱️  Meeting TTL: %v", meetingTTL)
	log.Printf("🌐 Server: %s", *addr)

	log.Fatal(http.ListenAndServe(*addr, nil))
}
