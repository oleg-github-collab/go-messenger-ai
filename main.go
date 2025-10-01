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
)

//go:embed static/*
var staticFiles embed.FS

// Room represents a 1-on-1 video room
type Room struct {
	ID               string
	HostID           string
	HostName         string
	Participants     map[*websocket.Conn]*Participant
	WaitingRoom      map[string]*Participant
	CreatedAt        time.Time
	mu               sync.RWMutex
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
}

var (
	rooms = make(map[string]*Room)
	mu    sync.RWMutex
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

	// Delete from Redis
	deleteMeeting(roomID)

	log.Printf("[ROOM] 🗑️  Cleaned up room %s", roomID)
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

	// Add to room or waiting room
	room.mu.Lock()

	if isHost {
		// Host joins directly
		if len(room.Participants) >= 2 {
			room.mu.Unlock()
			conn.WriteMessage(websocket.TextMessage, []byte(`{"error":"room full (max 2 participants)"}`))
			return
		}
		room.Participants[conn] = participant
		participantCount := len(room.Participants)
		room.mu.Unlock()

		log.Printf("[WS] ✅ Host %s joined room %s (%d participants)", participant.Name, roomID, participantCount)

		// Send join confirmation
		conn.WriteJSON(Message{
			Type: "joined",
			Data: json.RawMessage(fmt.Sprintf(`{"name":"%s","id":"%s","isHost":true}`, participant.Name, participantID)),
		})
	} else {
		// Guest goes to waiting room
		room.WaitingRoom[participantID] = participant
		waitingCount := len(room.WaitingRoom)
		room.mu.Unlock()

		log.Printf("[WS] 🚪 Guest %s in waiting room %s (%d waiting)", participant.Name, roomID, waitingCount)

		// Notify guest they're waiting
		conn.WriteJSON(Message{
			Type: "waiting",
			Data: json.RawMessage(fmt.Sprintf(`{"message":"Waiting for host approval","name":"%s"}`, participant.Name)),
		})

		// Notify host of join request
		room.mu.RLock()
		for c, p := range room.Participants {
			if p.IsHost {
				c.WriteJSON(Message{
					Type: "join-request",
					Data: json.RawMessage(fmt.Sprintf(`{"id":"%s","name":"%s"}`, participantID, participant.Name)),
				})
				log.Printf("[WS] 🔔 Notified host about guest %s", participant.Name)
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

		// If room empty and no one waiting, clean up
		if remaining == 0 && waitingCount == 0 {
			cleanupRoom(roomID)
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
			"approve-join": true, "reject-join": true,
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

		// Handle join approval (host only)
		if message.Type == "approve-join" && participant.IsHost {
			var data struct {
				ID string `json:"id"`
			}
			json.Unmarshal(message.Data, &data)

			room.mu.Lock()
			guest, exists := room.WaitingRoom[data.ID]
			if exists && len(room.Participants) < 2 {
				delete(room.WaitingRoom, data.ID)
				guest.Approved = true
				room.Participants[guest.Connection] = guest

				// Notify guest they're approved
				guest.Connection.WriteJSON(Message{
					Type: "approved",
					Data: json.RawMessage(fmt.Sprintf(`{"name":"%s","id":"%s"}`, guest.Name, data.ID)),
				})

				// Notify others
				joinMsg := Message{
					Type: "join",
					Data: json.RawMessage(fmt.Sprintf(`{"name":"%s","id":"%s"}`, guest.Name, data.ID)),
				}
				for c := range room.Participants {
					if c != guest.Connection {
						c.WriteJSON(joinMsg)
					}
				}

				log.Printf("[WS] ✅ Approved %s to join room %s", guest.Name, roomID)
			}
			room.mu.Unlock()
			continue
		}

		// Handle join rejection (host only)
		if message.Type == "reject-join" && participant.IsHost {
			var data struct {
				ID string `json:"id"`
			}
			json.Unmarshal(message.Data, &data)

			room.mu.Lock()
			guest, exists := room.WaitingRoom[data.ID]
			if exists {
				delete(room.WaitingRoom, data.ID)
				if guest.Connection != nil {
					guest.Connection.WriteJSON(Message{
						Type: "rejected",
						Data: json.RawMessage(`{"message":"Host rejected your join request"}`),
					})
					guest.Connection.Close()
				}
				log.Printf("[WS] ❌ Rejected %s from room %s", guest.Name, roomID)
			}
			room.mu.Unlock()
			continue
		}

		// Only broadcast if participant is approved
		if !participant.Approved {
			log.Printf("[WS] ⚠️  Unapproved participant tried to send: %s", message.Type)
			continue
		}

		message.User = participantID
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
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[SFU-WS] ❌ Upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	roomID := r.URL.Query().Get("room")
	userName := r.URL.Query().Get("name")

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
		conn.WriteJSON(map[string]string{"error": "meeting not found or expired"})
		return
	}

	// Verify this is a group meeting
	mode := "1on1"
	if m, ok := meetingData["mode"].(string); ok {
		mode = m
	}

	if mode != "group" {
		conn.WriteJSON(map[string]string{"error": "this is not a group meeting"})
		return
	}

	// Get or create SFU room
	room := sfuServer.GetOrCreateRoom(roomID)

	// Check participant limit
	participantCount := len(room.GetAllParticipants())
	if participantCount >= 20 {
		conn.WriteJSON(map[string]string{"error": "room full (max 20 participants)"})
		return
	}

	// Generate participant ID
	participantID := uuid.NewString()

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
	isFirstParticipant := participantCount == 0
	isHost := isHostParam || (userID != "" && userID == hostID) || isFirstParticipant

	// Get host name
	hostName := "Host"
	if name, ok := meetingData["host_name"].(string); ok {
		hostName = name
	}

	if isHost {
		userName = hostName
		log.Printf("[SFU-WS] 🔑 Identified as HOST - Query param: %v, UserID match: %v, First participant: %v", isHostParam, userID == hostID, isFirstParticipant)
	}

	// Add participant to SFU room
	participant, err := room.AddParticipant(participantID, userName, conn)
	if err != nil {
		log.Printf("[SFU-WS] ❌ Failed to add participant: %v", err)
		conn.WriteJSON(map[string]string{"error": "failed to join room"})
		return
	}

	log.Printf("[SFU-WS] ✅ %s joined group room %s (%d/%d participants)",
		userName, roomID, participantCount+1, 20)

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
			log.Printf("[SFU-WS] ⚠️  Invalid message format")
			continue
		}

		dataStr := ""
		if data, ok := msg["data"].(string); ok {
			dataStr = data
		}

		switch msgType {
		case "offer":
			if err := participant.HandleOffer(dataStr); err != nil {
				log.Printf("[SFU-WS] ⚠️  Handle offer error: %v", err)
			}

		case "answer":
			if err := participant.HandleAnswer(dataStr); err != nil {
				log.Printf("[SFU-WS] ⚠️  Handle answer error: %v", err)
			}

		case "ice-candidate":
			if err := participant.HandleICECandidate(dataStr); err != nil {
				log.Printf("[SFU-WS] ⚠️  Handle ICE candidate error: %v", err)
			}

		case "chat":
			// Broadcast chat to all other participants
			for _, p := range room.GetAllParticipants() {
				if p.ID != participantID {
					p.SendMessage(map[string]interface{}{
						"type": "chat",
						"data": msg["data"],
						"from": userName,
					})
				}
			}

		default:
			log.Printf("[SFU-WS] ⚠️  Unknown message type: %s", msgType)
		}
	}

	// Cleanup on disconnect
	room.RemoveParticipant(participantID)
	log.Printf("[SFU-WS] 👋 %s left group room %s", userName, roomID)

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

	// Home (host only)
	http.HandleFunc("/", authMiddleware(serveFile("home.html")))

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
			}
		}

		// Default to 1-on-1 call UI
		log.Printf("[ROOM] 👥 Serving call.html (1-on-1)")
		serveFile("call.html")(w, r)
	})

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

		scheme := "http"
		if r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" {
			scheme = "https"
		}

		url := fmt.Sprintf("%s://%s/join/%s", scheme, r.Host, roomID)

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

	log.Printf("🚀 Kaminskyi AI Messenger v1.0")
	log.Printf("📝 Host: %s / %s", validUsername, validPassword)
	log.Printf("🔒 Auth: Cookie + Bearer Token")
	log.Printf("🗄️  Redis: Connected")
	log.Printf("⏱️  Meeting TTL: %v", meetingTTL)
	log.Printf("🌐 Server: %s", *addr)

	log.Fatal(http.ListenAndServe(*addr, nil))
}
