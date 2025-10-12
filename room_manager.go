package main

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

// ProfessionalRoom represents a professional meeting room
type ProfessionalRoom struct {
	ID          string    `json:"id"`           // Short code: abc-xyz-123
	HMS_RoomID  string    `json:"hms_room_id"`  // 100ms room ID
	HostID      string    `json:"host_id"`      // Host user ID (Oleh)
	HostName    string    `json:"host_name"`    // Host display name
	CreatedAt   time.Time `json:"created_at"`
	ExpiresAt   time.Time `json:"expires_at"`   // TTL 8 hours
	Status      string    `json:"status"`       // active, ended
	Participants int      `json:"participants"` // Current participant count
}

// RoomInvite represents an invite link
type RoomInvite struct {
	RoomID    string    `json:"room_id"`
	InviteURL string    `json:"invite_url"`
	CreatedAt time.Time `json:"created_at"`
}

// Generate short room code (abc-xyz-123 format)
func generateRoomCode() string {
	b := make([]byte, 9)
	rand.Read(b)
	code := base64.URLEncoding.EncodeToString(b)
	code = strings.ReplaceAll(code, "-", "")
	code = strings.ReplaceAll(code, "_", "")
	code = strings.ToLower(code)

	// Format: abc-xyz-123
	if len(code) >= 9 {
		return fmt.Sprintf("%s-%s-%s", code[0:3], code[3:6], code[6:9])
	}
	return code
}

// Create a new professional room
func handleCreateRoom(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// HOST AUTHENTICATION - Must be logged in
	cookie, err := r.Cookie("auth_token")
	if err != nil {
		log.Printf("[ROOM] ❌ No auth_token cookie")
		http.Error(w, "Unauthorized - Please login", http.StatusUnauthorized)
		return
	}

	// Validate session from Redis
	sessionKey := fmt.Sprintf("session:%s", cookie.Value)
	userID, err := rdb.Get(ctx, sessionKey).Result()
	if err != nil {
		log.Printf("[ROOM] ❌ Invalid session token")
		http.Error(w, "Unauthorized - Invalid session", http.StatusUnauthorized)
		return
	}

	// For room host, we'll use "Oleh" as the username (the only valid login)
	username := "Oleh"
	log.Printf("[ROOM] ✅ Authenticated user: %s (userID: %s)", username, userID)

	// Generate short room code
	roomCode := generateRoomCode()

	// Create room in 100ms (if available)
	hmsRoomID := ""
	log.Printf("[ROOM] 🔍 HMS_APP_ACCESS_KEY exists: %v", HMS_APP_ACCESS_KEY != "")
	log.Printf("[ROOM] 🔍 HMS_TEMPLATE_ID: %s", HMS_TEMPLATE_ID)

	if HMS_APP_ACCESS_KEY != "" {
		// Call 100ms API to create room
		roomName := fmt.Sprintf("Professional Meeting - %s", roomCode)
		log.Printf("[ROOM] 🔍 Creating 100ms room: %s", roomName)

		hmsRoom, err := create100msRoom(roomName, "AI-powered professional meeting")
		if err != nil {
			log.Printf("[ROOM] ❌ 100ms room creation failed: %v", err)
			// Continue anyway with fallback
		} else {
			hmsRoomID = hmsRoom.ID
			log.Printf("[ROOM] ✅ 100ms room created: %s (full response: %+v)", hmsRoomID, hmsRoom)
		}
	} else {
		log.Printf("[ROOM] ⚠️  Skipping 100ms room creation - no credentials")
	}

	// Create room object
	room := ProfessionalRoom{
		ID:          roomCode,
		HMS_RoomID:  hmsRoomID,
		HostID:      username,
		HostName:    username,
		CreatedAt:   time.Now(),
		ExpiresAt:   time.Now().Add(8 * time.Hour),
		Status:      "active",
		Participants: 0,
	}

	// Store in Redis with 8 hour TTL
	roomKey := fmt.Sprintf("room:%s", roomCode)
	roomJSON, _ := json.Marshal(room)

	err = rdb.Set(ctx, roomKey, string(roomJSON), 8*time.Hour).Err()
	if err != nil {
		log.Printf("[ROOM] ❌ Failed to store room: %v", err)
		http.Error(w, "Failed to create room", http.StatusInternalServerError)
		return
	}

	log.Printf("[ROOM] ✅ Room created: %s (HMS: %s)", roomCode, hmsRoomID)

	// Generate 100ms auth tokens if room was created
	var hostToken, guestToken string
	if hmsRoomID != "" {
		// Host token with full permissions
		hostToken, err = generateHMSToken(hmsRoomID, "host-"+username, "host", username)
		if err != nil {
			log.Printf("[ROOM] ⚠️  Failed to generate host token: %v", err)
		}

		// Guest token with limited permissions
		guestToken, err = generateHMSToken(hmsRoomID, "guest-placeholder", "guest", "Guest")
		if err != nil {
			log.Printf("[ROOM] ⚠️  Failed to generate guest token: %v", err)
		}
	}

	// Create invite URL
	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "https://messenger.kaminskyi.chat"
	}

	inviteURL := fmt.Sprintf("%s/room/%s", baseURL, roomCode)

	// Return room details with auth tokens
	response := map[string]interface{}{
		"room_id":     roomCode,
		"hms_room_id": hmsRoomID,
		"invite_url":  inviteURL,
		"host_url":    fmt.Sprintf("%s/room/%s?host=true", baseURL, roomCode),
		"host_token":  hostToken,
		"guest_token": guestToken,
		"expires_at":  room.ExpiresAt,
		"status":      "created",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Join an existing room
func handleJoinRoom(w http.ResponseWriter, r *http.Request) {
	// Extract room code from URL path: /room/abc-xyz-123
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 3 {
		http.Error(w, "Invalid room URL", http.StatusBadRequest)
		return
	}

	roomCode := pathParts[2]

	// Get room from Redis
	roomKey := fmt.Sprintf("room:%s", roomCode)
	roomJSON, err := rdb.Get(ctx, roomKey).Result()
	if err != nil {
		log.Printf("[ROOM] ❌ Room not found: %s", roomCode)
		// Serve error page
		w.Header().Set("Content-Type", "text/html")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprintf(w, `
<!DOCTYPE html>
<html>
<head>
	<title>Room Not Found</title>
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
			display: flex;
			align-items: center;
			justify-content: center;
			height: 100vh;
			margin: 0;
			background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
		}
		.error {
			text-align: center;
			background: white;
			padding: 60px;
			border-radius: 20px;
			box-shadow: 0 20px 60px rgba(0,0,0,0.3);
		}
		.error h1 {
			color: #ef4444;
			font-size: 48px;
			margin: 0 0 20px 0;
		}
		.error p {
			color: #666;
			font-size: 18px;
			margin: 0 0 30px 0;
		}
		.error a {
			display: inline-block;
			padding: 14px 32px;
			background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
			color: white;
			text-decoration: none;
			border-radius: 10px;
			font-weight: 600;
			transition: transform 0.2s;
		}
		.error a:hover {
			transform: translateY(-2px);
		}
	</style>
</head>
<body>
	<div class="error">
		<h1>🔒 Room Not Found</h1>
		<p>This room doesn't exist or has expired.</p>
		<p><small>Room code: <code>%s</code></small></p>
		<a href="/">Go to Home</a>
	</div>
</body>
</html>
		`, roomCode)
		return
	}

	var room ProfessionalRoom
	json.Unmarshal([]byte(roomJSON), &room)

	// Check if room expired
	if time.Now().After(room.ExpiresAt) {
		room.Status = "expired"
		log.Printf("[ROOM] ⚠️  Room expired: %s", roomCode)
	}

	// Check if host or guest
	isHost := r.URL.Query().Get("host") == "true"

	// Verify host authentication
	if isHost {
		cookie, err := r.Cookie("session")
		if err != nil {
			http.Redirect(w, r, "/login?redirect=/room/"+roomCode+"?host=true", http.StatusTemporaryRedirect)
			return
		}

		username, err := rdb.Get(ctx, "session:"+cookie.Value).Result()
		if err != nil || username != room.HostID {
			http.Error(w, "Unauthorized - Not the room host", http.StatusForbidden)
			return
		}
	}

	// Increment participant count
	room.Participants++
	updatedRoomJSON, _ := json.Marshal(room)
	rdb.Set(ctx, roomKey, string(updatedRoomJSON), 8*time.Hour)

	// Serve professional mode page
	log.Printf("[ROOM] ✅ User joined room %s (host: %v)", roomCode, isHost)

	// Read and serve the professional-1on1.html with room data injected
	http.ServeFile(w, r, "./static/professional-1on1.html")
}

// Get room info API
func handleGetRoomInfo(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	roomCode := r.URL.Query().Get("room_id")
	if roomCode == "" {
		http.Error(w, "Missing room_id parameter", http.StatusBadRequest)
		return
	}

	// Get room from Redis
	roomKey := fmt.Sprintf("room:%s", roomCode)
	roomJSON, err := rdb.Get(ctx, roomKey).Result()
	if err != nil {
		http.Error(w, "Room not found", http.StatusNotFound)
		return
	}

	var room ProfessionalRoom
	json.Unmarshal([]byte(roomJSON), &room)

	// Check if room expired
	if time.Now().After(room.ExpiresAt) {
		room.Status = "expired"
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(room)
}

// End room (host only)
func handleEndRoom(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		RoomID string `json:"room_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// HOST AUTHENTICATION
	cookie, err := r.Cookie("auth_token")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	sessionKey := fmt.Sprintf("session:%s", cookie.Value)
	userID, err := rdb.Get(ctx, sessionKey).Result()
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	username := "Oleh" // The authenticated host
	_ = userID         // Validate session exists

	// Get room
	roomKey := fmt.Sprintf("room:%s", req.RoomID)
	roomJSON, err := rdb.Get(ctx, roomKey).Result()
	if err != nil {
		http.Error(w, "Room not found", http.StatusNotFound)
		return
	}

	var room ProfessionalRoom
	json.Unmarshal([]byte(roomJSON), &room)

	// Verify host
	if room.HostID != username {
		http.Error(w, "Unauthorized - Not the room host", http.StatusForbidden)
		return
	}

	// Mark as ended
	room.Status = "ended"
	endedRoomJSON, _ := json.Marshal(room)
	rdb.Set(ctx, roomKey, string(endedRoomJSON), 1*time.Hour) // Keep for 1 hour for records

	log.Printf("[ROOM] ✅ Room ended: %s by %s", req.RoomID, username)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ended"})
}

// Helper: Create 100ms room
func create100msRoom(name, description string) (*RoomResponse, error) {
	roomData := map[string]interface{}{
		"name":        name,
		"description": description,
		"template_id": HMS_TEMPLATE_ID,
	}

	roomJSON, _ := json.Marshal(roomData)

	req, err := http.NewRequest("POST", "https://api.100ms.live/v2/rooms",
		bytes.NewBuffer(roomJSON))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+HMS_APP_ACCESS_KEY)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("100ms API returned status %d", resp.StatusCode)
	}

	var roomResp RoomResponse
	if err := json.NewDecoder(resp.Body).Decode(&roomResp); err != nil {
		return nil, err
	}

	return &roomResp, nil
}

// Register room management routes
func registerRoomRoutes() {
	http.HandleFunc("/api/rooms/create", handleCreateRoom)
	http.HandleFunc("/api/rooms/info", handleGetRoomInfo)
	http.HandleFunc("/api/rooms/end", handleEndRoom)
	// NOTE: /room/ route is handled in main.go to avoid conflicts

	log.Println("[ROOM] ✅ Room management routes registered")
}
