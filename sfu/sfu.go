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
func (r *SFURoom) AddParticipant(participantID, name string, conn *websocket.Conn, turnHost, turnUser, turnPass string) (*SFUParticipant, int, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.closed {
		return nil, 0, fmt.Errorf("room is closed")
	}

	if len(r.participants) >= maxParticipants {
		return nil, 0, fmt.Errorf("room is full (max %d participants)", maxParticipants)
	}

	// Create WebRTC config with optimized settings
	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302"},
			},
		},
		// Optimize for faster connection and better reliability
		BundlePolicy:  webrtc.BundlePolicyMaxBundle,
		RTCPMuxPolicy: webrtc.RTCPMuxPolicyRequire,
	}

	// Set aggressive ICE settings
	settingEngine := webrtc.SettingEngine{}
	settingEngine.SetICETimeouts(
		time.Second*5,  // Disconnect timeout (faster detection)
		time.Second*15, // Failed timeout
		time.Second*2,  // Keepalive interval
	)
	settingEngine.SetNetworkTypes([]webrtc.NetworkType{
		webrtc.NetworkTypeUDP4,
		webrtc.NetworkTypeUDP6,
		webrtc.NetworkTypeTCP4,
		webrtc.NetworkTypeTCP6,
	})

	// Add TURN server if credentials provided
	if turnHost != "" && turnUser != "" && turnPass != "" {
		// Use turnHost as-is (already cleaned in main.go)
		config.ICEServers = append(config.ICEServers, webrtc.ICEServer{
			URLs:       []string{fmt.Sprintf("turn:%s:3478", turnHost), fmt.Sprintf("turn:%s:3478?transport=tcp", turnHost)},
			Username:   turnUser,
			Credential: turnPass,
		})
		log.Printf("[SFU] ✅ Added TURN server %s:3478 for participant %s", turnHost, participantID)
	}

	// Create MediaEngine with codec preferences for better quality
	mediaEngine := &webrtc.MediaEngine{}
	if err := mediaEngine.RegisterDefaultCodecs(); err != nil {
		return nil, 0, fmt.Errorf("failed to register codecs: %v", err)
	}

	// Create API with optimized settings
	api := webrtc.NewAPI(
		webrtc.WithMediaEngine(mediaEngine),
		webrtc.WithSettingEngine(settingEngine),
	)

	// Create peer connection with optimized API
	peerConnection, err := api.NewPeerConnection(config)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to create peer connection: %v", err)
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

	participantCount := len(r.participants)
	log.Printf("[SFU] Participant %s (%s) joined room %s (%d total)", participantID, name, r.ID, participantCount)

	// Collect existing tracks BEFORE releasing lock
	type existingTrack struct {
		participantID string
		trackID       string
		trackLocal    *webrtc.TrackLocalStaticRTP
		kind          string
	}
	var existingTracks []existingTrack

	for _, other := range r.participants {
		if other.ID != participantID {
			other.mu.RLock()
			for _, trackInfo := range other.Tracks {
				existingTracks = append(existingTracks, existingTrack{
					participantID: other.ID,
					trackID:       trackInfo.Track.ID(),
					trackLocal:    trackInfo.TrackLocal,
					kind:          trackInfo.Kind,
				})
			}
			other.mu.RUnlock()
		}
	}

	// Notify other participants
	r.notifyParticipantJoined(participant)

	r.mu.Unlock() // Release room lock BEFORE subscribing

	// Now subscribe to existing tracks WITHOUT holding room lock
	for _, track := range existingTracks {
		log.Printf("[SFU] 📺 Subscribing new participant %s to existing track from %s (%s)", participantID, track.participantID, track.kind)
		participant.SubscribeToTrack(track.participantID, track.trackID, track.trackLocal)
	}

	r.mu.Lock() // Re-acquire for defer unlock

	return participant, participantCount, nil
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
	r.broadcastLocked(message, excludeID)
}

// broadcastLocked sends a message without taking lock (internal use only)
func (r *SFURoom) broadcastLocked(message interface{}, excludeID string) {
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

// notifyParticipantJoined notifies all participants about new joiner (assumes lock held)
func (r *SFURoom) notifyParticipantJoined(p *SFUParticipant) {
	message := map[string]interface{}{
		"type": "participant-joined",
		"data": map[string]string{
			"id":   p.ID,
			"name": p.Name,
		},
	}
	r.broadcastLocked(message, p.ID)
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
	ID                 string
	Name               string
	Room               *SFURoom
	Connection         *websocket.Conn
	PeerConnection     *webrtc.PeerConnection
	Tracks             map[string]*TrackInfo
	subscribers        map[string]*Subscription
	mu                 sync.RWMutex
	wsMu               sync.Mutex // Protects WebSocket writes
	closed             bool
	pendingRenegotiate bool
	renegotiateTimer   *time.Timer
	// ICE candidate batching
	pendingICECandidates []webrtc.ICECandidateInit
	iceBatchTimer        *time.Timer
	iceMu                sync.Mutex
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

		// Log simulcast info - check codec parameters
		codec := track.Codec()
		log.Printf("[SFU] Track codec: %s, PayloadType: %d", codec.MimeType, codec.PayloadType)
		if track.RID() != "" {
			log.Printf("[SIMULCAST] 📹 Participant %s published simulcast layer: RID=%s", p.ID, track.RID())
		}

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

	// Handle ICE candidates
	p.PeerConnection.OnICECandidate(func(candidate *webrtc.ICECandidate) {
		if candidate == nil {
			log.Printf("[SFU] 🧊 Participant %s ICE gathering complete", p.ID)
			return
		}

		log.Printf("[SFU] 🧊 Participant %s generated ICE candidate: %s (type: %s, protocol: %s, address: %s:%d)",
			p.ID, candidate.String(), candidate.Typ, candidate.Protocol, candidate.Address, candidate.Port)

		// Send ICE candidate to client
		candidateJSON, err := json.Marshal(candidate.ToJSON())
		if err != nil {
			log.Printf("[SFU] ❌ Failed to marshal ICE candidate for %s: %v", p.ID, err)
			return
		}

		message := map[string]interface{}{
			"type": "ice-candidate",
			"data": string(candidateJSON),
		}

		log.Printf("[SFU] 📤 Sending ICE candidate to participant %s", p.ID)
		if err := p.SendMessage(message); err != nil {
			log.Printf("[SFU] ❌ Failed to send ICE candidate to %s: %v", p.ID, err)
		} else {
			log.Printf("[SFU] ✅ ICE candidate sent to %s", p.ID)
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

	// Check if already subscribed
	subKey := fmt.Sprintf("%s-%s", participantID, trackID)
	if _, exists := p.subscribers[subKey]; exists {
		p.mu.Unlock()
		return
	}

	// Add track to peer connection
	sender, err := p.PeerConnection.AddTrack(trackLocal)
	if err != nil {
		p.mu.Unlock()
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

	// Schedule debounced renegotiation
	if p.renegotiateTimer != nil {
		p.renegotiateTimer.Stop()
	}

	p.pendingRenegotiate = true
	p.renegotiateTimer = time.AfterFunc(100*time.Millisecond, func() {
		p.mu.Lock()
		if p.pendingRenegotiate && !p.closed {
			p.pendingRenegotiate = false
			p.mu.Unlock()

			log.Printf("[SFU] 🔄 Debounced renegotiation for %s", p.ID)
			if err := p.Renegotiate(); err != nil {
				log.Printf("[SFU] Failed to renegotiate for %s: %v", p.ID, err)
			}
		} else {
			p.mu.Unlock()
		}
	})

	p.mu.Unlock()

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

// sendREMB sends Receiver Estimated Maximum Bitrate feedback
func (p *SFUParticipant) sendREMB(ssrc webrtc.SSRC, bitrate uint64) {
	if p.closed {
		return
	}

	// Send REMB packet to inform sender about available bandwidth
	if err := p.PeerConnection.WriteRTCP([]rtcp.Packet{
		&rtcp.ReceiverEstimatedMaximumBitrate{
			Bitrate: float32(bitrate),
			SSRCs:   []uint32{uint32(ssrc)},
		},
	}); err != nil {
		log.Printf("[REMB] Failed to send REMB for %s: %v", p.ID, err)
	} else {
		log.Printf("[REMB] Sent REMB to %s: %d bps", p.ID, bitrate)
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

	// Stop renegotiation timer
	if p.renegotiateTimer != nil {
		p.renegotiateTimer.Stop()
	}

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
