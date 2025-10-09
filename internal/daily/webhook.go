package daily

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"messenger/internal/models"
)

// WebhookHandler handles Daily.co webhooks
type WebhookHandler struct {
	secret              string
	recordingCallback   func(*models.RecordingWebhook) error
}

// NewWebhookHandler creates a new webhook handler
func NewWebhookHandler() *WebhookHandler {
	return &WebhookHandler{
		secret: os.Getenv("DAILY_WEBHOOK_SECRET"),
	}
}

// SetRecordingCallback sets the callback for recording.ready events
func (h *WebhookHandler) SetRecordingCallback(callback func(*models.RecordingWebhook) error) {
	h.recordingCallback = callback
}

// HandleWebhook processes incoming Daily.co webhooks
func (h *WebhookHandler) HandleWebhook(w http.ResponseWriter, r *http.Request) {
	// Read body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("[DAILY-WEBHOOK] ❌ Failed to read body: %v", err)
		http.Error(w, "Failed to read request", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Verify signature if secret is set
	if h.secret != "" {
		signature := r.Header.Get("X-Daily-Signature")
		if signature == "" {
			signature = r.Header.Get("X-Daily-Signature-256")
		}

		if !h.verifySignature(body, signature) {
			log.Printf("[DAILY-WEBHOOK] ❌ Invalid signature")
			http.Error(w, "Invalid signature", http.StatusUnauthorized)
			return
		}
		log.Printf("[DAILY-WEBHOOK] ✅ Signature verified")
	} else {
		log.Printf("[DAILY-WEBHOOK] ⚠️  No webhook secret configured, skipping verification")
	}

	// Parse webhook payload
	var webhook map[string]interface{}
	if err := json.Unmarshal(body, &webhook); err != nil {
		log.Printf("[DAILY-WEBHOOK] ❌ Failed to parse JSON: %v", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	eventType, ok := webhook["type"].(string)
	if !ok {
		log.Printf("[DAILY-WEBHOOK] ❌ Missing event type")
		http.Error(w, "Missing event type", http.StatusBadRequest)
		return
	}

	log.Printf("[DAILY-WEBHOOK] 📨 Received event: %s", eventType)
	log.Printf("[DAILY-WEBHOOK] 📦 Payload: %s", string(body))

	// Handle different event types
	switch eventType {
	case "recording.ready":
		h.handleRecordingReady(webhook)
	case "recording.started":
		h.handleRecordingStarted(webhook)
	case "recording.stopped":
		h.handleRecordingStopped(webhook)
	case "recording.error":
		h.handleRecordingError(webhook)
	default:
		log.Printf("[DAILY-WEBHOOK] ℹ️  Unhandled event type: %s", eventType)
	}

	// Always return 200 to acknowledge receipt
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "received",
	})
}

// handleRecordingReady processes recording.ready events
func (h *WebhookHandler) handleRecordingReady(payload map[string]interface{}) {
	log.Printf("[DAILY-WEBHOOK] 🎥 Recording ready!")

	// Extract recording info
	recording := &models.RecordingWebhook{
		Type: "recording.ready",
	}

	if roomName, ok := payload["room_name"].(string); ok {
		recording.RoomName = roomName
	}

	if recordingID, ok := payload["recording_id"].(string); ok {
		recording.RecordingID = recordingID
	}

	// Get download link from payload
	// Daily.co provides download link in different formats
	if download, ok := payload["download"].(map[string]interface{}); ok {
		if link, ok := download["download_link"].(string); ok {
			recording.RecordingURL = link
		}
	}

	// Alternative: direct URL
	if recording.RecordingURL == "" {
		if url, ok := payload["download_link"].(string); ok {
			recording.RecordingURL = url
		}
	}

	// Duration
	if duration, ok := payload["duration"].(float64); ok {
		recording.Duration = duration
	}

	// Status
	if status, ok := payload["status"].(string); ok {
		recording.Status = status
	}

	log.Printf("[DAILY-WEBHOOK] 📋 Recording: room=%s, id=%s, url=%s, duration=%.0fs",
		recording.RoomName, recording.RecordingID, recording.RecordingURL, recording.Duration)

	// Call callback if set
	if h.recordingCallback != nil {
		if err := h.recordingCallback(recording); err != nil {
			log.Printf("[DAILY-WEBHOOK] ❌ Recording callback error: %v", err)
		} else {
			log.Printf("[DAILY-WEBHOOK] ✅ Recording processed successfully")
		}
	} else {
		log.Printf("[DAILY-WEBHOOK] ⚠️  No recording callback set")
	}
}

// handleRecordingStarted processes recording.started events
func (h *WebhookHandler) handleRecordingStarted(payload map[string]interface{}) {
	roomName := payload["room_name"].(string)
	log.Printf("[DAILY-WEBHOOK] ▶️  Recording started in room: %s", roomName)
}

// handleRecordingStopped processes recording.stopped events
func (h *WebhookHandler) handleRecordingStopped(payload map[string]interface{}) {
	roomName := payload["room_name"].(string)
	log.Printf("[DAILY-WEBHOOK] ⏹️  Recording stopped in room: %s", roomName)
}

// handleRecordingError processes recording.error events
func (h *WebhookHandler) handleRecordingError(payload map[string]interface{}) {
	roomName := payload["room_name"].(string)
	errorMsg := payload["error"].(string)
	log.Printf("[DAILY-WEBHOOK] ❌ Recording error in room %s: %s", roomName, errorMsg)
}

// verifySignature verifies the webhook signature
func (h *WebhookHandler) verifySignature(body []byte, signature string) bool {
	if h.secret == "" {
		return true // No secret configured, skip verification
	}

	// Create HMAC
	mac := hmac.New(sha256.New, []byte(h.secret))
	mac.Write(body)
	expectedMAC := mac.Sum(nil)
	expectedSignature := hex.EncodeToString(expectedMAC)

	// Compare signatures
	return hmac.Equal([]byte(signature), []byte(expectedSignature))
}

// TestWebhook sends a test webhook (for debugging)
func (h *WebhookHandler) TestWebhook() error {
	log.Printf("[DAILY-WEBHOOK] 🧪 Testing webhook handler with mock data")

	recording := &models.RecordingWebhook{
		Type:         "recording.ready",
		RoomName:     "test-room-123",
		RecordingID:  "rec_test_123",
		RecordingURL: "https://example.com/recording.mp4",
		Duration:     300.0,
		Status:       "finished",
	}

	if h.recordingCallback != nil {
		return h.recordingCallback(recording)
	}

	return fmt.Errorf("no callback set")
}
