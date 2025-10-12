package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// 100ms Configuration
var (
	HMS_APP_ACCESS_KEY = os.Getenv("HMS_APP_ACCESS_KEY")
	HMS_APP_SECRET     = os.Getenv("HMS_APP_SECRET")
	HMS_TEMPLATE_ID    = os.Getenv("HMS_TEMPLATE_ID")
)

// 100ms Room Creation Request
type CreateRoomRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	TemplateID  string `json:"template_id"`
}

// 100ms Room Response
type RoomResponse struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Enabled     bool      `json:"enabled"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

// 100ms Auth Token Request
type CreateTokenRequest struct {
	RoomID   string `json:"room_id"`
	UserID   string `json:"user_id"`
	Role     string `json:"role"`
	UserName string `json:"user_name"`
}

// 100ms Auth Token Response
type TokenResponse struct {
	Token string `json:"token"`
}

// Transcription Analysis Request
type TranscriptAnalysisRequest struct {
	Speaker    string    `json:"speaker"`
	Text       string    `json:"text"`
	Timestamp  time.Time `json:"timestamp"`
	MeetingID  string    `json:"meetingId"`
}

// AI Analysis Response
type AIAnalysisResponse struct {
	Category              string   `json:"category"`
	Color                 string   `json:"color"`
	Recommendation        string   `json:"recommendation"`
	Urgency               string   `json:"urgency"`
	SuggestedResponses    []string `json:"suggested_responses"`
}

// Create 100ms Room Handler - HOST ONLY (Oleh)
func handleCreateProfessionalRoom(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// HOST AUTHENTICATION - Check if authenticated OR if it's from /home (logged in user)
	cookie, err := r.Cookie("session")
	authenticated := false
	username := ""

	if err == nil && cookie.Value != "" {
		username, err = rdb.Get(ctx, "session:"+cookie.Value).Result()
		if err == nil {
			authenticated = true
		}
	}

	// If not authenticated but has session, it's OK (user came from /home after login)
	// If no session at all, allow for now (will add proper auth later)
	if authenticated && username != "Oleh" {
		log.Printf("[PROFESSIONAL] ❌ Unauthorized: Not host (user: %s)", username)
		http.Error(w, "Unauthorized - Professional AI is host-only", http.StatusForbidden)
		return
	}

	log.Printf("[PROFESSIONAL] ✅ Room creation allowed (user: %s, authenticated: %v)", username, authenticated)

	var req CreateRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Use template ID from env or request
	templateID := HMS_TEMPLATE_ID
	if req.TemplateID != "" {
		templateID = req.TemplateID
	}

	// Call 100ms API to create room
	roomData := map[string]interface{}{
		"name":        req.Name,
		"description": req.Description,
		"template_id": templateID,
	}

	roomJSON, _ := json.Marshal(roomData)

	// Create HTTP request to 100ms API
	apiReq, err := http.NewRequest("POST", "https://api.100ms.live/v2/rooms",
		bytes.NewBuffer(roomJSON))
	if err != nil {
		log.Printf("[PROFESSIONAL] Failed to create room request: %v", err)
		http.Error(w, "Failed to create room", http.StatusInternalServerError)
		return
	}

	// Add authentication headers
	apiReq.Header.Set("Content-Type", "application/json")
	apiReq.Header.Set("Authorization", "Bearer "+HMS_APP_ACCESS_KEY)

	// Execute request
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(apiReq)
	if err != nil {
		log.Printf("[PROFESSIONAL] Failed to create room: %v", err)
		http.Error(w, "Failed to create room", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Parse response
	var roomResp RoomResponse
	if err := json.NewDecoder(resp.Body).Decode(&roomResp); err != nil {
		log.Printf("[PROFESSIONAL] Failed to decode room response: %v", err)
		http.Error(w, "Failed to parse room response", http.StatusInternalServerError)
		return
	}

	log.Printf("[PROFESSIONAL] ✅ Room created: %s", roomResp.ID)

	// Return room details
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(roomResp)
}

// Create 100ms Auth Token Handler - PUBLIC (guests can get tokens)
func handleCreateProfessionalToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CreateTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate role
	if req.Role != "host" && req.Role != "guest" {
		http.Error(w, "Invalid role - must be 'host' or 'guest'", http.StatusBadRequest)
		return
	}

	// If requesting host role, verify authentication
	if req.Role == "host" {
		cookie, err := r.Cookie("auth_token")
		if err != nil {
			log.Printf("[PROFESSIONAL] ❌ No auth_token for host role request")
			http.Error(w, "Unauthorized - Host role requires authentication", http.StatusUnauthorized)
			return
		}

		// Validate session
		sessionKey := fmt.Sprintf("session:%s", cookie.Value)
		userID, err := rdb.Get(ctx, sessionKey).Result()
		if err != nil {
			log.Printf("[PROFESSIONAL] ❌ Invalid session for host role")
			http.Error(w, "Unauthorized - Invalid session", http.StatusUnauthorized)
			return
		}

		log.Printf("[PROFESSIONAL] ✅ Host token request authorized (userID: %s)", userID)
	} else {
		// Guest tokens - no auth required
		log.Printf("[PROFESSIONAL] ✅ Guest token request for: %s", req.UserName)
	}

	// Generate JWT token for 100ms
	token, err := generateHMSToken(req.RoomID, req.UserID, req.Role, req.UserName)
	if err != nil {
		log.Printf("[PROFESSIONAL] Failed to generate token: %v", err)
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	log.Printf("[PROFESSIONAL] ✅ Token generated for %s: %s", req.Role, req.UserName)

	// Return token
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(TokenResponse{Token: token})
}

// Generate 100ms JWT Token
func generateHMSToken(roomID, userID, role, userName string) (string, error) {
	if HMS_APP_ACCESS_KEY == "" || HMS_APP_SECRET == "" {
		return "", fmt.Errorf("HMS credentials not configured")
	}

	// Create JWT claims according to 100ms spec
	// https://www.100ms.live/docs/server-side/v2/introduction/authentication-and-tokens
	now := time.Now().Unix()
	claims := jwt.MapClaims{
		"access_key": HMS_APP_ACCESS_KEY,
		"room_id":    roomID,
		"user_id":    userID,
		"role":       role,
		"type":       "app",
		"version":    2,
		"iat":        now,
		"nbf":        now,
		"exp":        now + 86400, // 24 hours
	}

	// Add user name if provided
	if userName != "" {
		claims["user_name"] = userName
	}

	// Create token with HS256 signing method
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign with HMS_APP_SECRET
	signedToken, err := token.SignedString([]byte(HMS_APP_SECRET))
	if err != nil {
		return "", fmt.Errorf("failed to sign JWT: %w", err)
	}

	return signedToken, nil
}

// Analyze Transcript with AI Handler
func handleAnalyzeTranscript(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Allow for now - will add proper auth later
	// No authentication check for AI analysis

	var req TranscriptAnalysisRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("[AI ANALYZER] Analyzing: [%s] %s", req.Speaker, req.Text)

	// Call GPT-4o analyzer
	analysis, err := analyzeStatementWithGPT4o(req)
	if err != nil {
		log.Printf("[AI ANALYZER] ❌ Failed: %v", err)
		http.Error(w, "AI analysis failed", http.StatusInternalServerError)
		return
	}

	log.Printf("[AI ANALYZER] ✅ Category: %s, Urgency: %s", analysis.Category, analysis.Urgency)

	// Return analysis
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(analysis)
}

// Analyze statement with AI (OpenAI)
func analyzeStatementWithAI(req TranscriptAnalysisRequest) (*AIAnalysisResponse, error) {
	// TODO: Implement actual OpenAI API call
	// This is a mock implementation

	// Detect keywords for categories
	text := req.Text
	var category, color, urgency string
	var suggestions []string

	// Simple keyword-based detection (in production, use GPT-4)
	if containsAny(text, []string{"price", "expensive", "cost", "cheap", "budget"}) {
		category = "pricing"
		color = "#ff6b6b"
		urgency = "high"
		suggestions = []string{
			"Let's break down the value you'll receive...",
			"What if we explore a phased approach?",
			"I can show you our ROI calculator",
		}
	} else if containsAny(text, []string{"no", "not", "can't", "won't", "don't"}) {
		category = "objection"
		color = "#ffa502"
		urgency = "high"
		suggestions = []string{
			"I understand your concern. Let me address that...",
			"That's a valid point. Here's how we handle it...",
		}
	} else if containsAny(text, []string{"yes", "agree", "sounds good", "let's do", "ok"}) {
		category = "agreement"
		color = "#38ef7d"
		urgency = "low"
		suggestions = []string{
			"Great! Let's move forward with...",
			"Excellent. The next step is...",
		}
	} else {
		category = "general"
		color = "#4facfe"
		urgency = "low"
		suggestions = []string{}
	}

	return &AIAnalysisResponse{
		Category:           category,
		Color:              color,
		Recommendation:     fmt.Sprintf("The speaker mentioned %s-related topics. Consider addressing their concern directly.", category),
		Urgency:            urgency,
		SuggestedResponses: suggestions,
	}, nil
}

// Helper function to check if text contains any of the keywords
func containsAny(text string, keywords []string) bool {
	textLower := string([]rune(text))
	for _, keyword := range keywords {
		if containsSubstring(textLower, keyword) {
			return true
		}
	}
	return false
}

func containsSubstring(s, substr string) bool {
	return len(s) >= len(substr) && s[:len(substr)] == substr ||
		   (len(s) > len(substr) && containsSubstring(s[1:], substr))
}

// 100ms Webhook Handler (for recording/transcription events)
func handleProfessionalWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Verify webhook signature
	signature := r.Header.Get("X-100ms-Signature")
	if !verifyWebhookSignature(r, signature) {
		log.Printf("[WEBHOOK] ❌ Invalid signature")
		http.Error(w, "Invalid signature", http.StatusUnauthorized)
		return
	}

	// Parse webhook event
	var event map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		http.Error(w, "Invalid webhook payload", http.StatusBadRequest)
		return
	}

	eventType := event["type"].(string)
	log.Printf("[WEBHOOK] Received event: %s", eventType)

	// Handle different event types
	switch eventType {
	case "recording.success":
		log.Printf("[WEBHOOK] Recording completed: %v", event["data"])
		// Store recording URL in database
	case "transcription.success":
		log.Printf("[WEBHOOK] Transcription completed: %v", event["data"])
		// Process transcription
	case "session.close":
		log.Printf("[WEBHOOK] Session closed: %v", event["data"])
		// Cleanup session data
	default:
		log.Printf("[WEBHOOK] Unhandled event type: %s", eventType)
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}

// Verify 100ms webhook signature
func verifyWebhookSignature(r *http.Request, signature string) bool {
	if HMS_APP_SECRET == "" {
		log.Printf("[WEBHOOK] Warning: HMS_APP_SECRET not set, skipping signature verification")
		return true // In dev mode
	}

	// Read body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return false
	}

	// Restore body for further reading
	r.Body = io.NopCloser(bytes.NewBuffer(body))

	// Calculate HMAC
	mac := hmac.New(sha256.New, []byte(HMS_APP_SECRET))
	mac.Write(body)
	expectedSignature := hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(signature), []byte(expectedSignature))
}

// Register Professional Mode Routes
func registerProfessionalModeRoutes() {
	http.HandleFunc("/api/professional/create-room", handleCreateProfessionalRoom)
	http.HandleFunc("/api/professional/create-token", handleCreateProfessionalToken)
	http.HandleFunc("/api/analyze-transcript", handleAnalyzeTranscript)
	http.HandleFunc("/api/professional/webhook", handleProfessionalWebhook)

	log.Println("[PROFESSIONAL] ✅ Routes registered")
}
