package models

import "time"

// Meeting represents a meeting session
type Meeting struct {
	ID           string                 `json:"id"`
	HostID       string                 `json:"host_id"`
	HostName     string                 `json:"host_name"`
	Mode         string                 `json:"mode"` // "1on1", "group", "audio"
	CreatedAt    time.Time              `json:"created_at"`
	ExpiresAt    time.Time              `json:"expires_at"`
	Active       bool                   `json:"active"`
	EndedAt      *time.Time             `json:"ended_at,omitempty"`
	DailyRoomURL string                 `json:"daily_room_url,omitempty"`
	DailyRoomName string                `json:"daily_room_name,omitempty"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
}

// DailyRoom represents a Daily.co room
type DailyRoom struct {
	Name       string                 `json:"name"`
	URL        string                 `json:"url"`
	Privacy    string                 `json:"privacy"`
	Properties map[string]interface{} `json:"properties"`
	CreatedAt  time.Time              `json:"created_at"`
}

// AudioCall represents a 1-on-1 audio call
type AudioCall struct {
	ID           string                   `json:"id"`
	RoomID       string                   `json:"room_id"`
	Participants map[string]*Participant  `json:"participants"`
	CreatedAt    time.Time                `json:"created_at"`
}

// Participant in a call
type Participant struct {
	ID       string    `json:"id"`
	Name     string    `json:"name"`
	IsHost   bool      `json:"is_host"`
	JoinedAt time.Time `json:"joined_at"`
	Active   bool      `json:"active"`
}
