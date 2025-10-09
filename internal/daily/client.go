package daily

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"messenger/internal/models"
)

// Client is the Daily.co API client
type Client struct {
	apiKey     string
	domain     string
	httpClient *http.Client
}

// NewClient creates a new Daily.co API client
func NewClient() *Client {
	apiKey := os.Getenv("DAILY_API_KEY")
	domain := os.Getenv("DAILY_DOMAIN")

	if apiKey == "" {
		log.Printf("[DAILY] ⚠️  DAILY_API_KEY not set")
	}
	if domain == "" {
		log.Printf("[DAILY] ⚠️  DAILY_DOMAIN not set, using default")
		domain = "daily.co"
	}

	return &Client{
		apiKey:     apiKey,
		domain:     domain,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// CreateRoomRequest contains options for creating a room
type CreateRoomRequest struct {
	Name            string                 `json:"name,omitempty"`
	Privacy         string                 `json:"privacy"` // "public" or "private"
	EnableRecording bool                   `json:"enable_recording"`
	StartVideoOff   bool                   `json:"start_video_off"`
	StartAudioOff   bool                   `json:"start_audio_off"`
	EnableChat      bool                   `json:"enable_chat"`
	EnableScreenShare bool                 `json:"enable_screenshare"`
	MaxParticipants int                    `json:"max_participants"`
	AutoArchive     bool                   `json:"auto_archive"`
	Properties      map[string]interface{} `json:"properties,omitempty"`
}

// CreateRoom creates a new Daily.co room
func (c *Client) CreateRoom(req CreateRoomRequest) (*models.DailyRoom, error) {
	url := "https://api.daily.co/v1/rooms"

	// Set defaults if not provided
	if req.Privacy == "" {
		req.Privacy = "public"
	}
	if req.MaxParticipants == 0 {
		req.MaxParticipants = 20
	}

	// Build properties object (only free plan features)
	properties := map[string]interface{}{
		"max_participants": req.MaxParticipants,
		"enable_chat":      req.EnableChat,
	}

	// Only add recording if explicitly enabled (requires paid plan)
	if req.EnableRecording {
		properties["enable_recording"] = true
	}

	// Add optional settings if specified
	if req.StartVideoOff {
		properties["start_video_off"] = true
	}
	if req.StartAudioOff {
		properties["start_audio_off"] = true
	}

	// Merge custom properties
	for k, v := range req.Properties {
		properties[k] = v
	}

	payload := map[string]interface{}{
		"privacy":    req.Privacy,
		"properties": properties,
	}

	// Add name if provided
	if req.Name != "" {
		payload["name"] = req.Name
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)

	log.Printf("[DAILY] 🌐 Creating room with config: privacy=%s, recording=%v, max_participants=%d",
		req.Privacy, req.EnableRecording, req.MaxParticipants)

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	responseBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != 200 && resp.StatusCode != 201 {
		return nil, fmt.Errorf("daily API error %d: %s", resp.StatusCode, string(responseBody))
	}

	var result struct {
		Name       string                 `json:"name"`
		URL        string                 `json:"url"`
		Privacy    string                 `json:"privacy"`
		Properties map[string]interface{} `json:"config"`
	}

	if err := json.Unmarshal(responseBody, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	room := &models.DailyRoom{
		Name:       result.Name,
		URL:        result.URL,
		Privacy:    result.Privacy,
		Properties: result.Properties,
		CreatedAt:  time.Now(),
	}

	log.Printf("[DAILY] ✅ Room created: %s → %s", room.Name, room.URL)

	return room, nil
}

// GetRoom retrieves room information
func (c *Client) GetRoom(roomName string) (*models.DailyRoom, error) {
	url := fmt.Sprintf("https://api.daily.co/v1/rooms/%s", roomName)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return nil, fmt.Errorf("room not found: %s", roomName)
	}

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("daily API error %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Name       string                 `json:"name"`
		URL        string                 `json:"url"`
		Privacy    string                 `json:"privacy"`
		Properties map[string]interface{} `json:"config"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &models.DailyRoom{
		Name:       result.Name,
		URL:        result.URL,
		Privacy:    result.Privacy,
		Properties: result.Properties,
	}, nil
}

// DeleteRoom deletes a Daily.co room
func (c *Client) DeleteRoom(roomName string) error {
	url := fmt.Sprintf("https://api.daily.co/v1/rooms/%s", roomName)

	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 && resp.StatusCode != 204 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to delete room %s: %s", roomName, string(body))
	}

	log.Printf("[DAILY] 🗑️  Room deleted: %s", roomName)

	return nil
}

// CreateMeetingToken creates a meeting token for private rooms
func (c *Client) CreateMeetingToken(roomName, userName string, isOwner bool) (string, error) {
	url := "https://api.daily.co/v1/meeting-tokens"

	payload := map[string]interface{}{
		"properties": map[string]interface{}{
			"room_name": roomName,
			"user_name": userName,
			"is_owner":  isOwner,
		},
	}

	body, _ := json.Marshal(payload)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("daily API error %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Token string `json:"token"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	log.Printf("[DAILY] 🔑 Token created for %s in room %s", userName, roomName)

	return result.Token, nil
}

// IsConfigured checks if Daily.co is properly configured
func (c *Client) IsConfigured() bool {
	return c.apiKey != ""
}

// Recording represents a Daily.co recording
type Recording struct {
	ID           string    `json:"id"`
	RoomName     string    `json:"room_name"`
	StartedAt    time.Time `json:"start_ts"`
	Duration     int       `json:"duration"`
	Status       string    `json:"status"` // "finished", "in-progress"
	DownloadURL  string    `json:"download_link"`
	ShareURL     string    `json:"share_url"`
	MaxParticipants int    `json:"max_participants"`
}

// ListRecordings returns all recordings, optionally filtered by room
func (c *Client) ListRecordings(roomName string, limit int) ([]Recording, error) {
	url := "https://api.daily.co/v1/recordings"

	if limit == 0 {
		limit = 100
	}

	url = fmt.Sprintf("%s?limit=%d", url, limit)

	if roomName != "" {
		url = fmt.Sprintf("%s&room_name=%s", url, roomName)
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("daily API error %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Data []Recording `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return result.Data, nil
}

// GetRecording retrieves a specific recording by ID
func (c *Client) GetRecording(recordingID string) (*Recording, error) {
	url := fmt.Sprintf("https://api.daily.co/v1/recordings/%s", recordingID)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return nil, fmt.Errorf("recording not found: %s", recordingID)
	}

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("daily API error %d: %s", resp.StatusCode, string(body))
	}

	var recording Recording
	if err := json.NewDecoder(resp.Body).Decode(&recording); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &recording, nil
}

// DownloadRecording downloads a recording file
func (c *Client) DownloadRecording(downloadURL string) ([]byte, error) {
	req, err := http.NewRequest("GET", downloadURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Authorization may be required depending on recording settings
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("download failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("download failed with status %d", resp.StatusCode)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	return data, nil
}
