package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// Recording Storage - Uses Railway Volume or local filesystem
// Railway automatically mounts volumes to /data

var (
	RECORDINGS_PATH = getEnv("RECORDINGS_PATH", "/data/recordings")
	RAILWAY_API_KEY = getEnv("RAILWAY_API_KEY", "1c4b591c-3828-480c-ac94-b556c38228da")
)

// Initialize recordings directory
func initRecordingsStorage() {
	// Ensure recordings directory exists
	if err := os.MkdirAll(RECORDINGS_PATH, 0755); err != nil {
		log.Printf("[STORAGE] ❌ Failed to create recordings dir: %v", err)
		// Fallback to temp
		RECORDINGS_PATH = filepath.Join(os.TempDir(), "recordings")
		os.MkdirAll(RECORDINGS_PATH, 0755)
	}

	log.Printf("[STORAGE] ✅ Recordings path: %s", RECORDINGS_PATH)

	// Check available space
	checkStorageSpace()
}

func checkStorageSpace() {
	// Get disk usage info
	info, err := os.Stat(RECORDINGS_PATH)
	if err != nil {
		log.Printf("[STORAGE] Warning: Can't check storage: %v", err)
		return
	}

	log.Printf("[STORAGE] Directory: %s, Writable: %v", RECORDINGS_PATH, info.IsDir())
}

// Save Recording Metadata
type RecordingMetadata struct {
	ID           string    `json:"id"`
	MeetingID    string    `json:"meeting_id"`
	StartTime    time.Time `json:"start_time"`
	EndTime      time.Time `json:"end_time"`
	Duration     int64     `json:"duration"` // seconds
	FileURL      string    `json:"file_url"`
	LocalPath    string    `json:"local_path"`
	Size         int64     `json:"size"`   // bytes
	Status       string    `json:"status"` // uploading, completed, failed
	Participants []string  `json:"participants"`
	MimeType     string    `json:"mime_type,omitempty"`
}

// Handle 100ms Recording Webhook
func handle100msRecordingWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Verify signature (100ms webhook)
	signature := r.Header.Get("X-100ms-Signature")
	if !verifyWebhookSignature(r, signature) {
		log.Printf("[RECORDING] ❌ Invalid webhook signature")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse webhook payload
	var payload struct {
		Type string `json:"type"`
		Data struct {
			RoomID       string `json:"room_id"`
			SessionID    string `json:"session_id"`
			RecordingURL string `json:"recording_url"`
			StartedAt    string `json:"started_at"`
			EndedAt      string `json:"ended_at"`
			Duration     int64  `json:"duration"`
		} `json:"data"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	log.Printf("[RECORDING] Webhook: type=%s, room=%s", payload.Type, payload.Data.RoomID)

	switch payload.Type {
	case "recording.success":
		// Download and save recording
		go downloadRecording(payload.Data.RecordingURL, payload.Data.RoomID, payload.Data.SessionID)

	case "recording.failed":
		log.Printf("[RECORDING] ❌ Recording failed for room: %s", payload.Data.RoomID)

	default:
		log.Printf("[RECORDING] Unknown webhook type: %s", payload.Type)
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// Download recording from 100ms and save to Railway volume
func downloadRecording(recordingURL, roomID, sessionID string) {
	log.Printf("[RECORDING] Downloading: %s", recordingURL)

	// Create filename
	filename := fmt.Sprintf("%s_%s_%d.mp4", roomID, sessionID, time.Now().Unix())
	localPath := filepath.Join(RECORDINGS_PATH, filename)

	// Download file
	resp, err := http.Get(recordingURL)
	if err != nil {
		log.Printf("[RECORDING] ❌ Failed to download: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("[RECORDING] ❌ Bad status: %d", resp.StatusCode)
		return
	}

	// Create local file
	file, err := os.Create(localPath)
	if err != nil {
		log.Printf("[RECORDING] ❌ Failed to create file: %v", err)
		return
	}
	defer file.Close()

	// Copy data
	size, err := io.Copy(file, resp.Body)
	if err != nil {
		log.Printf("[RECORDING] ❌ Failed to save: %v", err)
		return
	}

	log.Printf("[RECORDING] ✅ Saved: %s (%d MB)", filename, size/1024/1024)

	// Save metadata to Redis
	saveRecordingMetadata(RecordingMetadata{
		ID:        sessionID,
		MeetingID: roomID,
		StartTime: time.Now(),
		EndTime:   time.Now(),
		Duration:  0, // Will be updated from webhook data
		LocalPath: localPath,
		Size:      size,
		Status:    "completed",
		MimeType:  "video/mp4",
	})
}

func handleUploadRecording(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		MeetingID       string   `json:"meetingId"`
		RoomCode        string   `json:"roomCode"`
		HostID          string   `json:"hostId"`
		MimeType        string   `json:"mimeType"`
		Size            int64    `json:"size"`
		DurationSeconds int64    `json:"durationSeconds"`
		StartedAt       string   `json:"startedAt"`
		EndedAt         string   `json:"endedAt"`
		Data            string   `json:"data"`
		Participants    []string `json:"participants"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	if req.Data == "" {
		http.Error(w, "Recording data missing", http.StatusBadRequest)
		return
	}

	userID := r.Header.Get("X-User-ID")
	if req.HostID == "" {
		req.HostID = userID
	}

	meetingID := req.MeetingID
	if meetingID == "" {
		meetingID = req.RoomCode
	}
	if meetingID == "" {
		meetingID = fmt.Sprintf("local-%d", time.Now().Unix())
	}

	startedAt := time.Now()
	if req.StartedAt != "" {
		if ts, err := time.Parse(time.RFC3339, req.StartedAt); err == nil {
			startedAt = ts
		}
	}

	endedAt := time.Now()
	if req.EndedAt != "" {
		if ts, err := time.Parse(time.RFC3339, req.EndedAt); err == nil {
			endedAt = ts
		}
	}

	data := req.Data
	if strings.HasPrefix(data, "data:") {
		if comma := strings.Index(data, ","); comma != -1 {
			data = data[comma+1:]
		}
	}

	bytes, err := base64.StdEncoding.DecodeString(data)
	if err != nil {
		http.Error(w, "Failed to decode recording", http.StatusBadRequest)
		return
	}

	ext := ".webm"
	switch req.MimeType {
	case "video/mp4", "audio/mp4":
		ext = ".mp4"
	case "audio/mpeg":
		ext = ".mp3"
	case "audio/ogg":
		ext = ".ogg"
	case "audio/wav", "audio/x-wav":
		ext = ".wav"
	case "audio/webm", "video/webm":
		ext = ".webm"
	case "audio/aac":
		ext = ".aac"
	}

	if req.MimeType == "" {
		req.MimeType = "video/webm"
	}

	recordingID := fmt.Sprintf("local-%d", time.Now().UnixNano())
	filename := fmt.Sprintf("%s%s", recordingID, ext)
	localPath := filepath.Join(RECORDINGS_PATH, filename)

	if err := os.WriteFile(localPath, bytes, 0644); err != nil {
		log.Printf("[RECORDING] ❌ Failed to write local recording: %v", err)
		http.Error(w, "Failed to store recording", http.StatusInternalServerError)
		return
	}

	if req.DurationSeconds == 0 {
		req.DurationSeconds = int64(endedAt.Sub(startedAt).Seconds())
		if req.DurationSeconds < 0 {
			req.DurationSeconds = 0
		}
	}

	metadata := RecordingMetadata{
		ID:           recordingID,
		MeetingID:    meetingID,
		StartTime:    startedAt,
		EndTime:      endedAt,
		Duration:     req.DurationSeconds,
		FileURL:      fmt.Sprintf("/api/recordings/get?id=%s", recordingID),
		LocalPath:    localPath,
		Size:         int64(len(bytes)),
		Status:       "completed",
		Participants: req.Participants,
		MimeType:     req.MimeType,
	}

	saveRecordingMetadata(metadata)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":     true,
		"recordingId": recordingID,
		"mimeType":    req.MimeType,
		"size":        metadata.Size,
	})
}

// Save recording metadata to Redis
func saveRecordingMetadata(metadata RecordingMetadata) {
	key := fmt.Sprintf("recording:%s", metadata.ID)

	jsonData, err := json.Marshal(metadata)
	if err != nil {
		log.Printf("[RECORDING] Failed to marshal metadata: %v", err)
		return
	}

	// Save to Redis with 30 days expiry
	if err := rdb.Set(ctx, key, jsonData, 30*24*time.Hour).Err(); err != nil {
		log.Printf("[RECORDING] Failed to save metadata: %v", err)
	}
}

// Get Recording by ID
func handleGetRecording(w http.ResponseWriter, r *http.Request) {
	recordingID := r.URL.Query().Get("id")
	if recordingID == "" {
		http.Error(w, "Missing recording ID", http.StatusBadRequest)
		return
	}

	// Get metadata from Redis
	key := fmt.Sprintf("recording:%s", recordingID)
	data, err := rdb.Get(ctx, key).Result()
	if err != nil {
		http.Error(w, "Recording not found", http.StatusNotFound)
		return
	}

	var metadata RecordingMetadata
	if err := json.Unmarshal([]byte(data), &metadata); err != nil {
		http.Error(w, "Invalid metadata", http.StatusInternalServerError)
		return
	}

	// Check if file exists
	if _, err := os.Stat(metadata.LocalPath); os.IsNotExist(err) {
		http.Error(w, "Recording file not found", http.StatusNotFound)
		return
	}

	// Serve file
	contentType := metadata.MimeType
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	filename := filepath.Base(metadata.LocalPath)
	if filename == "" {
		ext := filepath.Ext(metadata.LocalPath)
		if ext == "" {
			ext = ".bin"
		}
		filename = recordingID + ext
	}

	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", filename))
	http.ServeFile(w, r, metadata.LocalPath)
}

// List Recordings for Meeting
func handleListRecordings(w http.ResponseWriter, r *http.Request) {
	meetingID := r.URL.Query().Get("meeting_id")
	if meetingID == "" {
		http.Error(w, "Missing meeting ID", http.StatusBadRequest)
		return
	}

	// Scan Redis for recordings matching meeting ID
	pattern := "recording:*"
	var recordings []RecordingMetadata

	iter := rdb.Scan(ctx, 0, pattern, 100).Iterator()
	for iter.Next(ctx) {
		data, err := rdb.Get(ctx, iter.Val()).Result()
		if err != nil {
			continue
		}

		var metadata RecordingMetadata
		if err := json.Unmarshal([]byte(data), &metadata); err != nil {
			continue
		}

		if metadata.MeetingID == meetingID {
			recordings = append(recordings, metadata)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(recordings)
}

// Delete Recording
func handleDeleteRecording(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	recordingID := r.URL.Query().Get("id")
	if recordingID == "" {
		http.Error(w, "Missing recording ID", http.StatusBadRequest)
		return
	}

	// Get metadata
	key := fmt.Sprintf("recording:%s", recordingID)
	data, err := rdb.Get(ctx, key).Result()
	if err != nil {
		http.Error(w, "Recording not found", http.StatusNotFound)
		return
	}

	var metadata RecordingMetadata
	if err := json.Unmarshal([]byte(data), &metadata); err != nil {
		http.Error(w, "Invalid metadata", http.StatusInternalServerError)
		return
	}

	// Delete file
	if err := os.Remove(metadata.LocalPath); err != nil {
		log.Printf("[RECORDING] Failed to delete file: %v", err)
	}

	// Delete metadata from Redis
	rdb.Del(ctx, key)

	log.Printf("[RECORDING] ✅ Deleted: %s", recordingID)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// Register recording routes
func registerRecordingRoutes() {
	http.HandleFunc("/api/recordings/webhook", handle100msRecordingWebhook)
	http.HandleFunc("/api/recordings/get", handleGetRecording)
	http.HandleFunc("/api/recordings/list", handleListRecordings)
	http.HandleFunc("/api/recordings/delete", authMiddleware(handleDeleteRecording))
	http.HandleFunc("/api/recordings/upload", authMiddleware(handleUploadRecording))

	// Initialize storage
	initRecordingsStorage()

	log.Println("[RECORDINGS] ✅ Routes registered")
}
