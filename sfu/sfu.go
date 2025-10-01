// sfu/sfu.go - Selective Forwarding Unit for multi-party video calls
package sfu

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/pion/rtcp"
	"github.com/pion/webrtc/v3"
)

const (
	rtcpPLIInterval = time.Second * 3
	maxParticipants = 20
)

// SFUServer manages multiple rooms
type SFUServer struct {
	rooms map[string]*SFURoom
	mu    sync.RWMutex
}

// NewSFUServer creates a new SFU server
func NewSFUServer() *SFUServer {
	return &SFUServer{
		rooms: make(map[string]*SFURoom),
	}
}

// GetOrCreateRoom gets existing room or creates new one
func (s *SFUServer) GetOrCreateRoom(roomID string) *SFURoom {
	s.mu.Lock()
	defer s.mu.Unlock()

	room, exists := s.rooms[roomID]
	if !exists {
		room = newSFURoom(roomID)
		s.rooms[roomID] = room
		log.Printf("[SFU] Created room %s", roomID)
	}

	return room
}

// RemoveRoom removes a room
func (s *SFUServer) RemoveRoom(roomID string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if room, exists := s.rooms[roomID]; exists {
		room.Close()
		delete(s.rooms, roomID)
		log.Printf("[SFU] Removed room %s", roomID)
	}
}

// SFURoom represents a multi-party video room
type SFURoom struct {
	ID           string
	participants map[string]*SFUParticipant
	mu           sync.RWMutex
	closed       bool
}

func newSFURoom(id string) *SFURoom {
	return &SFURoom{
		ID:           id,
		participants: make(map[string]*SFUParticipant),
	}
}

// AddParticipant adds a new participant to the room
func (r *SFURoom) AddParticipant(participantID, name string, conn *websocket.Conn) (*SFUParticipant, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.closed {
		return nil, fmt.Errorf("room is closed")
	}

	if len(r.participants) >= maxParticipants {
		return nil, fmt.Errorf("room is full (max %d participants)", maxParticipants)
	}

	// Create WebRTC config
	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302"},
			},
		},
	}

	// Create peer connection
	peerConnection, err := webrtc.NewPeerConnection(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create peer connection: %v", err)
	}

	participant := &SFUParticipant{
		ID:             participantID,
		Name:           name,
		Room:           r,
		Connection:     conn,
		PeerConnection: peerConnection,
		Tracks:         make(map[string]*TrackInfo),
		subscribers:    make(map[string]*Subscription),
	}

	// Set up peer connection handlers
	participant.setupPeerConnection()

	r.participants[participantID] = participant

	log.Printf("[SFU] Participant %s (%s) joined room %s (%d total)", participantID, name, r.ID, len(r.participants))

	// Notify other participants
	r.notifyParticipantJoined(participant)

	return participant, nil
}

// RemoveParticipant removes a participant
func (r *SFURoom) RemoveParticipant(participantID string) {
	r.mu.Lock()
	participant, exists := r.participants[participantID]
	if !exists {
		r.mu.Unlock()
		return
	}

	delete(r.participants, participantID)
	participantCount := len(r.participants)
	r.mu.Unlock()

	// Close participant
	if participant != nil {
		participant.Close()
	}

	log.Printf("[SFU] Participant %s left room %s (%d remaining)", participantID, r.ID, participantCount)

	// Notify others
	r.notifyParticipantLeft(participantID)
}

// GetParticipant returns a participant by ID
func (r *SFURoom) GetParticipant(participantID string) (*SFUParticipant, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	p, exists := r.participants[participantID]
	return p, exists
}

// GetAllParticipants returns all participants
func (r *SFURoom) GetAllParticipants() []*SFUParticipant {
	r.mu.RLock()
	defer r.mu.RUnlock()

	participants := make([]*SFUParticipant, 0, len(r.participants))
	for _, p := range r.participants {
		participants = append(participants, p)
	}
	return participants
}

// Broadcast sends a message to all participants except one
func (r *SFURoom) Broadcast(message interface{}, excludeID string) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("[SFU] Failed to marshal broadcast message: %v", err)
		return
	}

	for id, p := range r.participants {
		if id != excludeID && p.Connection != nil {
			if err := p.Connection.WriteMessage(websocket.TextMessage, data); err != nil {
				log.Printf("[SFU] Failed to send message to %s: %v", id, err)
			}
		}
	}
}

// notifyParticipantJoined notifies all participants about new joiner
func (r *SFURoom) notifyParticipantJoined(p *SFUParticipant) {
	message := map[string]interface{}{
		"type": "participant-joined",
		"data": map[string]string{
			"id":   p.ID,
			"name": p.Name,
		},
	}
	r.Broadcast(message, p.ID)
}

// notifyParticipantLeft notifies all participants about leaver
func (r *SFURoom) notifyParticipantLeft(participantID string) {
	message := map[string]interface{}{
		"type": "participant-left",
		"data": map[string]string{
			"id": participantID,
		},
	}
	r.Broadcast(message, participantID)
}

// Close closes the room and all participants
func (r *SFURoom) Close() {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.closed {
		return
	}

	r.closed = true

	for _, p := range r.participants {
		p.Close()
	}

	r.participants = make(map[string]*SFUParticipant)
	log.Printf("[SFU] Room %s closed", r.ID)
}

// SFUParticipant represents a participant in SFU room
type SFUParticipant struct {
	ID             string
	Name           string
	Room           *SFURoom
	Connection     *websocket.Conn
	PeerConnection *webrtc.PeerConnection
	Tracks         map[string]*TrackInfo
	subscribers    map[string]*Subscription
	mu             sync.RWMutex
	closed         bool
}

// TrackInfo contains information about a media track
type TrackInfo struct {
	Track      *webrtc.TrackRemote
	TrackLocal *webrtc.TrackLocalStaticRTP
	Kind       string
	SSRC       webrtc.SSRC
}

// Subscription represents a subscription to another participant's track
type Subscription struct {
	ParticipantID string
	TrackID       string
	Sender        *webrtc.RTPSender
}

// setupPeerConnection sets up handlers for peer connection
func (p *SFUParticipant) setupPeerConnection() {
	// Handle incoming tracks
	p.PeerConnection.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
		log.Printf("[SFU] Participant %s published %s track (SSRC: %d)", p.ID, track.Kind(), track.SSRC())

		// Create local track for forwarding
		trackLocal, err := webrtc.NewTrackLocalStaticRTP(
			track.Codec().RTPCodecCapability,
			fmt.Sprintf("%s-%s", track.Kind(), uuid.NewString()[:8]),
			fmt.Sprintf("stream-%s", p.ID),
		)
		if err != nil {
			log.Printf("[SFU] Failed to create local track: %v", err)
			return
		}

		// Store track info
		trackInfo := &TrackInfo{
			Track:      track,
			TrackLocal: trackLocal,
			Kind:       track.Kind().String(),
			SSRC:       track.SSRC(),
		}

		p.mu.Lock()
		p.Tracks[track.ID()] = trackInfo
		p.mu.Unlock()

		// Forward track to all other participants
		go p.forwardTrack(trackInfo)

		// Request PLI periodically for video
		if track.Kind() == webrtc.RTPCodecTypeVideo {
			go p.sendPLI(track.SSRC())
		}
	})

	// Handle ICE connection state
	p.PeerConnection.OnICEConnectionStateChange(func(state webrtc.ICEConnectionState) {
		log.Printf("[SFU] Participant %s ICE state: %s", p.ID, state)

		if state == webrtc.ICEConnectionStateFailed || state == webrtc.ICEConnectionStateDisconnected {
			log.Printf("[SFU] Participant %s connection failed/disconnected", p.ID)
			p.Room.RemoveParticipant(p.ID)
		}
	})

	// Handle connection state
	p.PeerConnection.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
		log.Printf("[SFU] Participant %s connection state: %s", p.ID, state)

		if state == webrtc.PeerConnectionStateFailed || state == webrtc.PeerConnectionStateClosed {
			p.Room.RemoveParticipant(p.ID)
		}
	})
}

// forwardTrack forwards RTP packets from incoming track to all subscribers
func (p *SFUParticipant) forwardTrack(trackInfo *TrackInfo) {
	track := trackInfo.Track
	trackLocal := trackInfo.TrackLocal

	// Subscribe all other participants to this track
	for _, other := range p.Room.GetAllParticipants() {
		if other.ID != p.ID {
			other.SubscribeToTrack(p.ID, track.ID(), trackLocal)
		}
	}

	// Read and forward RTP packets
	rtpBuf := make([]byte, 1500)
	for {
		i, _, err := track.Read(rtpBuf)
		if err != nil {
			if err == io.EOF {
				return
			}
			log.Printf("[SFU] Error reading track %s: %v", track.ID(), err)
			return
		}

		// Write to local track (which forwards to all subscribers)
		if _, err = trackLocal.Write(rtpBuf[:i]); err != nil && err != io.ErrClosedPipe {
			log.Printf("[SFU] Error writing to local track: %v", err)
			return
		}
	}
}

// SubscribeToTrack subscribes this participant to another participant's track
func (p *SFUParticipant) SubscribeToTrack(participantID, trackID string, trackLocal *webrtc.TrackLocalStaticRTP) {
	p.mu.Lock()
	defer p.mu.Unlock()

	// Check if already subscribed
	subKey := fmt.Sprintf("%s-%s", participantID, trackID)
	if _, exists := p.subscribers[subKey]; exists {
		return
	}

	// Add track to peer connection
	sender, err := p.PeerConnection.AddTrack(trackLocal)
	if err != nil {
		log.Printf("[SFU] Failed to add track for %s: %v", p.ID, err)
		return
	}

	// Store subscription
	p.subscribers[subKey] = &Subscription{
		ParticipantID: participantID,
		TrackID:       trackID,
		Sender:        sender,
	}

	log.Printf("[SFU] Participant %s subscribed to %s's track", p.ID, participantID)

	// Handle RTCP packets
	go func() {
		rtcpBuf := make([]byte, 1500)
		for {
			if _, _, err := sender.Read(rtcpBuf); err != nil {
				return
			}
		}
	}()
}

// sendPLI sends Picture Loss Indication periodically
func (p *SFUParticipant) sendPLI(ssrc webrtc.SSRC) {
	ticker := time.NewTicker(rtcpPLIInterval)
	defer ticker.Stop()

	for range ticker.C {
		if p.closed {
			return
		}

		if err := p.PeerConnection.WriteRTCP([]rtcp.Packet{
			&rtcp.PictureLossIndication{
				MediaSSRC: uint32(ssrc),
			},
		}); err != nil {
			return
		}
	}
}

// Close closes the participant connection
func (p *SFUParticipant) Close() {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.closed {
		return
	}

	p.closed = true

	// Close peer connection
	if p.PeerConnection != nil {
		p.PeerConnection.Close()
	}

	// Clear tracks
	p.Tracks = make(map[string]*TrackInfo)
	p.subscribers = make(map[string]*Subscription)

	log.Printf("[SFU] Participant %s closed", p.ID)
}

// GetStats returns statistics for this participant
func (p *SFUParticipant) GetStats() map[string]interface{} {
	p.mu.RLock()
	defer p.mu.RUnlock()

	return map[string]interface{}{
		"id":              p.ID,
		"name":            p.Name,
		"tracks":          len(p.Tracks),
		"subscriptions":   len(p.subscribers),
		"connectionState": p.PeerConnection.ConnectionState().String(),
	}
}
