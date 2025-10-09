package audio

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// Handler manages 1-on-1 audio calls
type Handler struct {
	rooms    map[string]*AudioRoom
	mu       sync.RWMutex
	upgrader websocket.Upgrader
}

// AudioRoom represents a 1-on-1 audio call room
type AudioRoom struct {
	ID           string
	Participants map[*websocket.Conn]*AudioParticipant
	CreatedAt    time.Time
	mu           sync.RWMutex
}

// AudioParticipant in an audio call
type AudioParticipant struct {
	ID       string
	Name     string
	IsHost   bool
	JoinedAt time.Time
}

// Message format for WebSocket signaling
type Message struct {
	Type     string          `json:"type"`
	Data     json.RawMessage `json:"data"`
	Room     string          `json:"room"`
	User     string          `json:"user"`
	UserName string          `json:"userName,omitempty"`
}

// NewHandler creates a new audio call handler
func NewHandler() *Handler {
	return &Handler{
		rooms: make(map[string]*AudioRoom),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	}
}

// CreateRoom creates a new audio call room
func (h *Handler) CreateRoom() string {
	id := uuid.NewString()

	h.mu.Lock()
	h.rooms[id] = &AudioRoom{
		ID:           id,
		Participants: make(map[*websocket.Conn]*AudioParticipant),
		CreatedAt:    time.Now(),
	}
	h.mu.Unlock()

	log.Printf("[AUDIO] ✅ Created audio room: %s", id)

	return id
}

// HandleWebSocket handles WebSocket connections for audio calls
func (h *Handler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[AUDIO] ❌ WebSocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	roomID := r.URL.Query().Get("room")
	userName := r.URL.Query().Get("name")
	isHost := r.URL.Query().Get("isHost") == "true"

	if roomID == "" {
		conn.WriteJSON(map[string]string{"error": "room ID missing"})
		return
	}

	if userName == "" {
		userName = "Guest"
	}

	// Get or create room
	h.mu.Lock()
	room, exists := h.rooms[roomID]
	if !exists {
		room = &AudioRoom{
			ID:           roomID,
			Participants: make(map[*websocket.Conn]*AudioParticipant),
			CreatedAt:    time.Now(),
		}
		h.rooms[roomID] = room
	}
	h.mu.Unlock()

	// Check room capacity (max 2 for 1-on-1)
	room.mu.Lock()
	if len(room.Participants) >= 2 {
		room.mu.Unlock()
		conn.WriteJSON(map[string]string{"error": "room full (max 2 participants)"})
		return
	}

	// Add participant
	participantID := "audio_" + uuid.NewString()[:8]
	participant := &AudioParticipant{
		ID:       participantID,
		Name:     userName,
		IsHost:   isHost,
		JoinedAt: time.Now(),
	}

	room.Participants[conn] = participant
	participantCount := len(room.Participants)
	room.mu.Unlock()

	log.Printf("[AUDIO] 🎤 %s joined room %s (%d/2)", userName, roomID, participantCount)

	// Send join confirmation
	conn.WriteJSON(Message{
		Type: "joined",
		Data: json.RawMessage(fmt.Sprintf(`{"name":"%s","id":"%s","isHost":%v}`, userName, participantID, isHost)),
	})

	// Notify other participant
	if participantCount > 1 {
		h.broadcastToRoom(room, Message{
			Type: "peer-joined",
			Data: json.RawMessage(fmt.Sprintf(`{"name":"%s","id":"%s"}`, userName, participantID)),
		}, conn)
	}

	// Cleanup on disconnect
	defer func() {
		room.mu.Lock()
		delete(room.Participants, conn)
		remaining := len(room.Participants)
		room.mu.Unlock()

		// Notify other participant
		h.broadcastToRoom(room, Message{
			Type: "peer-left",
			Data: json.RawMessage(fmt.Sprintf(`{"name":"%s","id":"%s"}`, userName, participantID)),
		}, conn)

		log.Printf("[AUDIO] 👋 %s left room %s (%d remaining)", userName, roomID, remaining)

		// Clean up empty room
		if remaining == 0 {
			h.mu.Lock()
			delete(h.rooms, roomID)
			h.mu.Unlock()
			log.Printf("[AUDIO] 🗑️  Cleaned up empty room: %s", roomID)
		}
	}()

	// Message loop - handle WebRTC signaling
	for {
		var msg Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[AUDIO] ⚠️  Unexpected close: %v", err)
			}
			break
		}

		// Validate message type
		validTypes := map[string]bool{
			"offer":         true,
			"answer":        true,
			"ice-candidate": true,
			"ping":          true,
		}

		if !validTypes[msg.Type] {
			log.Printf("[AUDIO] ⚠️  Invalid message type: %s", msg.Type)
			continue
		}

		// Handle ping
		if msg.Type == "ping" {
			conn.WriteJSON(map[string]string{"type": "pong"})
			continue
		}

		// Set sender info
		msg.User = participantID
		msg.UserName = userName
		msg.Room = roomID

		log.Printf("[AUDIO] 📨 %s: %s", participantID, msg.Type)

		// Forward to other participant (P2P signaling)
		h.broadcastToRoom(room, msg, conn)
	}
}

// broadcastToRoom sends message to all participants except sender
func (h *Handler) broadcastToRoom(room *AudioRoom, msg Message, exclude *websocket.Conn) {
	room.mu.RLock()
	defer room.mu.RUnlock()

	for conn := range room.Participants {
		if conn != exclude {
			if err := conn.WriteJSON(msg); err != nil {
				log.Printf("[AUDIO] ⚠️  Failed to send message: %v", err)
			}
		}
	}
}

// GetRoomInfo returns information about a room
func (h *Handler) GetRoomInfo(roomID string) (map[string]interface{}, error) {
	h.mu.RLock()
	room, exists := h.rooms[roomID]
	h.mu.RUnlock()

	if !exists {
		return nil, fmt.Errorf("room not found")
	}

	room.mu.RLock()
	defer room.mu.RUnlock()

	participants := make([]map[string]interface{}, 0, len(room.Participants))
	for _, p := range room.Participants {
		participants = append(participants, map[string]interface{}{
			"id":      p.ID,
			"name":    p.Name,
			"is_host": p.IsHost,
		})
	}

	return map[string]interface{}{
		"id":              room.ID,
		"participant_count": len(room.Participants),
		"participants":    participants,
		"created_at":      room.CreatedAt,
	}, nil
}

// CleanupStaleRooms removes rooms older than specified duration
func (h *Handler) CleanupStaleRooms(maxAge time.Duration) int {
	h.mu.Lock()
	defer h.mu.Unlock()

	count := 0
	now := time.Now()

	for id, room := range h.rooms {
		room.mu.RLock()
		isEmpty := len(room.Participants) == 0
		isOld := now.Sub(room.CreatedAt) > maxAge
		room.mu.RUnlock()

		if isEmpty && isOld {
			delete(h.rooms, id)
			count++
			log.Printf("[AUDIO] 🧹 Cleaned up stale room: %s (age: %v)", id, now.Sub(room.CreatedAt))
		}
	}

	return count
}
