package models

import "time"

// Transcript represents a full meeting transcript
type Transcript struct {
	ID          string              `json:"id"`
	MeetingID   string              `json:"meeting_id"`
	RoomName    string              `json:"room_name"`
	Segments    []TranscriptSegment `json:"segments"`
	Insights    *TranscriptInsights `json:"insights,omitempty"`
	Metadata    TranscriptMetadata  `json:"metadata"`
	CreatedAt   time.Time           `json:"created_at"`
	ProcessedAt time.Time           `json:"processed_at"`
}

// TranscriptSegment represents a single piece of transcript
type TranscriptSegment struct {
	Speaker    string  `json:"speaker"`
	SpeakerID  string  `json:"speaker_id,omitempty"`
	Color      string  `json:"color"` // Hex color for UI
	Text       string  `json:"text"`
	Start      float64 `json:"start"` // Seconds from beginning
	End        float64 `json:"end"`
	Confidence float64 `json:"confidence"`
}

// TranscriptInsights contains AI-generated insights
type TranscriptInsights struct {
	Summary       string           `json:"summary"`
	KeyPoints     []string         `json:"key_points"`
	ActionItems   []ActionItem     `json:"action_items"`
	KeyMoments    []KeyMoment      `json:"key_moments"`
	Topics        []string         `json:"topics"`
	Sentiment     string           `json:"sentiment"` // "positive", "neutral", "negative"
	Decisions     []string         `json:"decisions"`
	Questions     []string         `json:"questions"`
}

// ActionItem represents a task or action point
type ActionItem struct {
	Text      string  `json:"text"`
	Assignee  string  `json:"assignee,omitempty"`
	Timestamp float64 `json:"timestamp"` // When mentioned in seconds
	Priority  string  `json:"priority,omitempty"` // "high", "medium", "low"
}

// KeyMoment represents an important moment in the transcript
type KeyMoment struct {
	Timestamp   float64 `json:"timestamp"`
	Description string  `json:"description"`
	Type        string  `json:"type"` // "decision", "question", "insight", "action"
}

// TranscriptMetadata contains metadata about the transcript
type TranscriptMetadata struct {
	Duration     float64  `json:"duration"` // Total duration in seconds
	Participants []string `json:"participants"`
	RecordingURL string   `json:"recording_url"`
	Language     string   `json:"language"`
	WordCount    int      `json:"word_count"`
}

// RecordingWebhook represents Daily.co recording webhook payload
type RecordingWebhook struct {
	Type         string    `json:"type"`
	RoomName     string    `json:"room_name"`
	RecordingID  string    `json:"recording_id"`
	RecordingURL string    `json:"recording_url"`
	Duration     float64   `json:"duration"`
	StartedAt    time.Time `json:"started_at"`
	Status       string    `json:"status"`
}
