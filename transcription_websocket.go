package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// TranscriptMessage represents a live transcript update
type TranscriptMessage struct {
	Type       string    `json:"type"` // "transcript", "analysis", "control"
	RoomID     string    `json:"room_id"`
	Speaker    string    `json:"speaker"`
	Text       string    `json:"text"`
	Timestamp  time.Time `json:"timestamp"`
	IsHost     bool      `json:"is_host"`

	// AI Analysis (host only)
	Category   string   `json:"category,omitempty"`
	Sentiment  string   `json:"sentiment,omitempty"`
	Urgency    string   `json:"urgency,omitempty"`
	KeyPoints  []string `json:"key_points,omitempty"`
	Recommendation string `json:"recommendation,omitempty"`
}

// TranscriptRoom manages WebSocket connections for a room
type TranscriptRoom struct {
	RoomID      string
	Connections map[*websocket.Conn]bool
	Host        *websocket.Conn
	Broadcast   chan TranscriptMessage
	mu          sync.RWMutex
}

var (
	transcriptRooms = make(map[string]*TranscriptRoom)
	transcriptMu    sync.RWMutex

	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true // Allow all origins in production
		},
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
)

// Get or create transcript room
func getOrCreateTranscriptRoom(roomID string) *TranscriptRoom {
	transcriptMu.Lock()
	defer transcriptMu.Unlock()

	room, exists := transcriptRooms[roomID]
	if !exists {
		room = &TranscriptRoom{
			RoomID:      roomID,
			Connections: make(map[*websocket.Conn]bool),
			Broadcast:   make(chan TranscriptMessage, 256),
		}
		transcriptRooms[roomID] = room

		// Start broadcast goroutine
		go room.broadcastMessages()

		log.Printf("[TRANSCRIPT WS] Created room: %s", roomID)
	}

	return room
}

// Broadcast messages to all connections
func (r *TranscriptRoom) broadcastMessages() {
	for {
		msg := <-r.Broadcast

		r.mu.RLock()
		for conn := range r.Connections {
			// Filter AI analysis for non-host connections
			msgToSend := msg
			if conn != r.Host {
				msgToSend.Category = ""
				msgToSend.Sentiment = ""
				msgToSend.Urgency = ""
				msgToSend.KeyPoints = nil
				msgToSend.Recommendation = ""
			}

			err := conn.WriteJSON(msgToSend)
			if err != nil {
				log.Printf("[TRANSCRIPT WS] Write error: %v", err)
				conn.Close()
				delete(r.Connections, conn)
			}
		}
		r.mu.RUnlock()
	}
}

// Add connection to room
func (r *TranscriptRoom) addConnection(conn *websocket.Conn, isHost bool) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.Connections[conn] = true
	if isHost {
		r.Host = conn
		log.Printf("[TRANSCRIPT WS] Host connected to room: %s", r.RoomID)
	} else {
		log.Printf("[TRANSCRIPT WS] Guest connected to room: %s", r.RoomID)
	}
}

// Remove connection from room
func (r *TranscriptRoom) removeConnection(conn *websocket.Conn) {
	r.mu.Lock()
	defer r.mu.Unlock()

	delete(r.Connections, conn)
	if r.Host == conn {
		r.Host = nil
		log.Printf("[TRANSCRIPT WS] Host disconnected from room: %s", r.RoomID)
	}

	// Cleanup room if empty
	if len(r.Connections) == 0 {
		transcriptMu.Lock()
		delete(transcriptRooms, r.RoomID)
		transcriptMu.Unlock()
		log.Printf("[TRANSCRIPT WS] Removed empty room: %s", r.RoomID)
	}
}

// WebSocket handler for live transcription
func handleTranscriptWebSocket(w http.ResponseWriter, r *http.Request) {
	// Get room ID from query
	roomID := r.URL.Query().Get("room_id")
	if roomID == "" {
		http.Error(w, "Missing room_id", http.StatusBadRequest)
		return
	}

	// Check if host
	isHost := r.URL.Query().Get("host") == "true"

	// Upgrade connection
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[TRANSCRIPT WS] Upgrade error: %v", err)
		return
	}
	defer conn.Close()

	// Get or create room
	room := getOrCreateTranscriptRoom(roomID)
	room.addConnection(conn, isHost)
	defer room.removeConnection(conn)

	// Send welcome message
	welcomeMsg := TranscriptMessage{
		Type:      "control",
		RoomID:    roomID,
		Text:      "Connected to live transcription",
		Timestamp: time.Now(),
		IsHost:    isHost,
	}
	conn.WriteJSON(welcomeMsg)

	// Read messages from client
	for {
		var msg TranscriptMessage
		err := conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[TRANSCRIPT WS] Error: %v", err)
			}
			break
		}

		msg.RoomID = roomID
		msg.Timestamp = time.Now()

		// Broadcast to all connections in room
		select {
		case room.Broadcast <- msg:
		default:
			log.Printf("[TRANSCRIPT WS] Broadcast channel full, dropping message")
		}
	}
}

// Register WebSocket routes
func registerTranscriptWebSocket() {
	http.HandleFunc("/ws/transcript", handleTranscriptWebSocket)
	log.Println("[TRANSCRIPT WS] ✅ WebSocket routes registered")
}
