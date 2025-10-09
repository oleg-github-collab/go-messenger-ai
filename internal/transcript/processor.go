package transcript

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"time"

	"messenger/internal/models"
)

// Processor handles transcript generation and analysis
type Processor struct {
	openAIKey  string
	httpClient *http.Client
	redis      RedisClient
}

// RedisClient interface for storing transcripts
type RedisClient interface {
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error
	Get(ctx context.Context, key string) (string, error)
}

// NewProcessor creates a new transcript processor
func NewProcessor(redis RedisClient) *Processor {
	return &Processor{
		openAIKey:  os.Getenv("OPENAI_API_KEY"),
		httpClient: &http.Client{Timeout: 5 * time.Minute}, // Long timeout for Whisper
		redis:      redis,
	}
}

// ProcessRecording downloads, transcribes, and analyzes a recording
func (p *Processor) ProcessRecording(ctx context.Context, recording *models.RecordingWebhook) (*models.Transcript, error) {
	log.Printf("[TRANSCRIPT] 🎬 Processing recording: %s", recording.RecordingID)

	// Step 1: Download recording
	audioData, err := p.downloadRecording(recording.RecordingURL)
	if err != nil {
		return nil, fmt.Errorf("failed to download recording: %w", err)
	}
	log.Printf("[TRANSCRIPT] ✅ Downloaded recording: %d bytes", len(audioData))

	// Step 2: Process the audio data
	return p.ProcessAudioData(ctx, recording.RecordingID, recording.RoomName, audioData)
}

// ProcessAudioData transcribes and analyzes audio data (used by both webhook and polling)
func (p *Processor) ProcessAudioData(ctx context.Context, recordingID, roomName string, audioData []byte) (*models.Transcript, error) {
	log.Printf("[TRANSCRIPT] 🎬 Processing audio data for: %s", recordingID)

	// Step 1: Transcribe with Whisper
	segments, err := p.transcribeWithWhisper(audioData)
	if err != nil {
		return nil, fmt.Errorf("failed to transcribe: %w", err)
	}
	log.Printf("[TRANSCRIPT] ✅ Transcribed: %d segments", len(segments))

	// Step 2: Identify speakers and add colors
	segments = p.assignSpeakerColors(segments)

	// Step 3: Generate insights with GPT-4o
	insights, err := p.generateInsights(segments)
	if err != nil {
		log.Printf("[TRANSCRIPT] ⚠️  Failed to generate insights: %v", err)
		// Continue without insights
	}

	// Step 4: Calculate duration from segments
	duration := 0.0
	if len(segments) > 0 {
		duration = segments[len(segments)-1].End
	}

	// Step 5: Create transcript object
	transcript := &models.Transcript{
		ID:        recordingID,
		MeetingID: roomName,
		RoomName:  roomName,
		Segments:  segments,
		Insights:  insights,
		Metadata: models.TranscriptMetadata{
			Duration:     duration,
			Participants: extractParticipants(segments),
			RecordingURL: "",
			Language:     "en",
			WordCount:    countWords(segments),
		},
		CreatedAt:   time.Now(),
		ProcessedAt: time.Now(),
	}

	// Step 6: Store in Redis
	if err := p.storeTranscript(ctx, transcript); err != nil {
		log.Printf("[TRANSCRIPT] ⚠️  Failed to store in Redis: %v", err)
	}

	log.Printf("[TRANSCRIPT] ✅ Processing complete: %s", transcript.ID)

	return transcript, nil
}

// downloadRecording downloads the recording from Daily.co
func (p *Processor) downloadRecording(url string) ([]byte, error) {
	resp, err := p.httpClient.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("failed to download: HTTP %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

// transcribeWithWhisper sends audio to OpenAI Whisper API
func (p *Processor) transcribeWithWhisper(audioData []byte) ([]models.TranscriptSegment, error) {
	if p.openAIKey == "" {
		return nil, fmt.Errorf("OPENAI_API_KEY not set")
	}

	url := "https://api.openai.com/v1/audio/transcriptions"

	// Create multipart form
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Add file
	part, err := writer.CreateFormFile("file", "recording.mp3")
	if err != nil {
		return nil, err
	}
	if _, err := part.Write(audioData); err != nil {
		return nil, err
	}

	// Add model
	writer.WriteField("model", "whisper-1")

	// Request verbose JSON with timestamps
	writer.WriteField("response_format", "verbose_json")
	writer.WriteField("timestamp_granularities[]", "segment")

	writer.Close()

	// Create request
	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+p.openAIKey)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	log.Printf("[TRANSCRIPT] 🎤 Sending to Whisper API...")

	// Send request
	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("whisper API error %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var result struct {
		Text     string `json:"text"`
		Language string `json:"language"`
		Duration float64 `json:"duration"`
		Segments []struct {
			ID               int     `json:"id"`
			Text             string  `json:"text"`
			Start            float64 `json:"start"`
			End              float64 `json:"end"`
			AvgLogProb       float64 `json:"avg_logprob"`
			CompressionRatio float64 `json:"compression_ratio"`
			NoSpeechProb     float64 `json:"no_speech_prob"`
		} `json:"segments"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	// Convert to our format
	segments := make([]models.TranscriptSegment, len(result.Segments))
	for i, seg := range result.Segments {
		// Calculate confidence from log probability
		confidence := 1.0 + seg.AvgLogProb // Normalize from log scale
		if confidence < 0 {
			confidence = 0
		}
		if confidence > 1 {
			confidence = 1
		}

		segments[i] = models.TranscriptSegment{
			Speaker:    fmt.Sprintf("Speaker %d", (i%3)+1), // Temporary, will be refined by GPT
			Text:       seg.Text,
			Start:      seg.Start,
			End:        seg.End,
			Confidence: confidence,
		}
	}

	return segments, nil
}

// assignSpeakerColors assigns colors to speakers
func (p *Processor) assignSpeakerColors(segments []models.TranscriptSegment) []models.TranscriptSegment {
	// Color palette for speakers
	colors := []string{
		"#FF6B6B", // Red
		"#4ECDC4", // Teal
		"#45B7D1", // Blue
		"#FFA07A", // Orange
		"#98D8C8", // Mint
		"#F7DC6F", // Yellow
		"#BB8FCE", // Purple
		"#85C1E2", // Sky Blue
	}

	speakerColors := make(map[string]string)
	colorIndex := 0

	for i := range segments {
		speaker := segments[i].Speaker
		if _, exists := speakerColors[speaker]; !exists {
			speakerColors[speaker] = colors[colorIndex%len(colors)]
			colorIndex++
		}
		segments[i].Color = speakerColors[speaker]
	}

	return segments
}

// storeTranscript saves transcript to Redis
func (p *Processor) storeTranscript(ctx context.Context, transcript *models.Transcript) error {
	key := fmt.Sprintf("transcript:%s", transcript.ID)

	data, err := json.Marshal(transcript)
	if err != nil {
		return err
	}

	// Store for 7 days
	return p.redis.Set(ctx, key, string(data), 7*24*time.Hour)
}

// GetTranscript retrieves a transcript from Redis
func (p *Processor) GetTranscript(ctx context.Context, transcriptID string) (*models.Transcript, error) {
	key := fmt.Sprintf("transcript:%s", transcriptID)

	data, err := p.redis.Get(ctx, key)
	if err != nil {
		return nil, err
	}

	var transcript models.Transcript
	if err := json.Unmarshal([]byte(data), &transcript); err != nil {
		return nil, err
	}

	return &transcript, nil
}

// Helper functions

func extractParticipants(segments []models.TranscriptSegment) []string {
	participantMap := make(map[string]bool)
	for _, seg := range segments {
		participantMap[seg.Speaker] = true
	}

	participants := make([]string, 0, len(participantMap))
	for p := range participantMap {
		participants = append(participants, p)
	}

	return participants
}

func countWords(segments []models.TranscriptSegment) int {
	count := 0
	for _, seg := range segments {
		// Simple word count (split by spaces)
		words := 0
		inWord := false
		for _, r := range seg.Text {
			if r == ' ' || r == '\t' || r == '\n' {
				inWord = false
			} else if !inWord {
				words++
				inWord = true
			}
		}
		count += words
	}
	return count
}
