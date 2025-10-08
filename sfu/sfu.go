// sfu/sfu.go - Selective Forwarding Unit for multi-party video calls
package sfu

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/pion/interceptor"
	"github.com/pion/rtcp"
	"github.com/pion/webrtc/v3"
)

const (
	rtcpPLIInterval = time.Millisecond * 800 // CRITICAL: Reduced from 2s for lower latency
	maxParticipants = 20
	maxBitrate      = 2500000 // 2.5 Mbps max per participant for smooth HD
	minBitrate      = 150000  // 150 Kbps minimum
)

func qualityFromRID(rid string) QualityLevel {
	switch rid {
	case "l":
		return QualityLow
	case "m":
		return QualityMedium
	default:
		return QualityHigh
	}
}

func qualityLevelFromString(level string) (QualityLevel, error) {
	switch strings.ToLower(strings.TrimSpace(level)) {
	case "low":
		return QualityLow, nil
	case "medium":
		return QualityMedium, nil
	case "high", "default":
		return QualityHigh, nil
	default:
		return QualityHigh, fmt.Errorf("unknown quality level: %s", level)
	}
}

func shouldSubscribeToTrack(trackInfo *TrackInfo, preferred QualityLevel) bool {
	if trackInfo.Kind != webrtc.RTPCodecTypeVideo.String() {
		return true
	}

	if trackInfo.RID == "" {
		return true
	}

	switch preferred {
	case QualityLow:
		return trackInfo.Quality == QualityLow
	case QualityMedium:
		if trackInfo.Quality == QualityMedium {
			return true
		}
		return trackInfo.Quality == QualityLow
	default:
		return trackInfo.Quality == QualityHigh
	}
}

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

	// CRITICAL: Ultra-optimized WebRTC config for Germany-Ukraine connectivity
	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			// Multiple STUN servers for redundancy
			{URLs: []string{"stun:stun.l.google.com:19302"}},
			{URLs: []string{"stun:stun1.l.google.com:19302"}},
			{URLs: []string{"stun:stun2.l.google.com:19302"}},
			{URLs: []string{"stun:stun.cloudflare.com:3478"}},
		},
		// CRITICAL: Aggressive bundle and ICE policies for speed
		BundlePolicy:      webrtc.BundlePolicyMaxBundle,
		RTCPMuxPolicy:     webrtc.RTCPMuxPolicyRequire,
		ICETransportPolicy: webrtc.ICETransportPolicyAll, // Try all routes
	}

	// CRITICAL: Ultra-aggressive ICE settings for fast long-distance connectivity
	settingEngine := webrtc.SettingEngine{}
	settingEngine.SetICETimeouts(
		time.Second*1,    // disconnectedTimeout (reduced from 3s)
		time.Second*5,    // failedTimeout (reduced from 10s)
		time.Millisecond*500, // keepAliveInterval (reduced from 1s)
	)
	settingEngine.SetNetworkTypes([]webrtc.NetworkType{
		webrtc.NetworkTypeUDP4,
		webrtc.NetworkTypeUDP6,
		webrtc.NetworkTypeTCP4, // Also try TCP for firewall bypass
	})
	// CRITICAL: Wide port range for better connectivity
	settingEngine.SetEphemeralUDPPortRange(40000, 50000)

	// CRITICAL: TURN server with multiple transports for reliability
	if turnHost != "" && turnUser != "" && turnPass != "" {
		config.ICEServers = append(config.ICEServers, webrtc.ICEServer{
			URLs: []string{
				fmt.Sprintf("turn:%s:3478", turnHost),
				fmt.Sprintf("turn:%s:3478?transport=udp", turnHost),
				fmt.Sprintf("turn:%s:3478?transport=tcp", turnHost),
				fmt.Sprintf("turns:%s:5349", turnHost), // Secure TURN over TLS
				fmt.Sprintf("turns:%s:5349?transport=tcp", turnHost),
			},
			Username:       turnUser,
			Credential:     turnPass,
			CredentialType: webrtc.ICECredentialTypePassword,
		})
		log.Printf("[SFU] ✅ TURN server configured: %s (UDP/TCP/TLS) for %s", turnHost, participantID)
	} else {
		log.Printf("[SFU] ⚠️ No TURN server - using STUN only (may fail with strict firewalls)")
	}

	// Create MediaEngine with codec preferences for better quality
	mediaEngine := &webrtc.MediaEngine{}
	if err := mediaEngine.RegisterDefaultCodecs(); err != nil {
		return nil, 0, fmt.Errorf("failed to register codecs: %v", err)
	}

	interceptorRegistry := &interceptor.Registry{}
	if err := webrtc.RegisterDefaultInterceptors(mediaEngine, interceptorRegistry); err != nil {
		return nil, 0, fmt.Errorf("failed to register interceptors: %v", err)
	}

	// Create API with optimized settings
	api := webrtc.NewAPI(
		webrtc.WithMediaEngine(mediaEngine),
		webrtc.WithInterceptorRegistry(interceptorRegistry),
		webrtc.WithSettingEngine(settingEngine),
	)

	// Create peer connection with optimized API
	peerConnection, err := api.NewPeerConnection(config)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to create peer connection: %v", err)
	}

	participant := &SFUParticipant{
		ID:               participantID,
		Name:             name,
		Room:             r,
		Connection:       conn,
		PeerConnection:   peerConnection,
		Tracks:           make(map[string]*TrackInfo),
		subscribers:      make(map[string]*Subscription),
		preferredQuality: QualityHigh,
	}

	// CRITICAL: Set up peer connection handlers BEFORE any signaling
	participant.setupPeerConnection()

	// Log transceivers to debug track reception
	log.Printf("[SFU] 📊 Initial transceivers count for %s: %d", participantID, len(peerConnection.GetTransceivers()))

	r.participants[participantID] = participant

	participantCount := len(r.participants)
	log.Printf("[SFU] Participant %s (%s) joined room %s (%d total)", participantID, name, r.ID, participantCount)

	// Collect existing tracks BEFORE releasing lock
	var existingTracks []*TrackInfo

	for _, other := range r.participants {
		if other.ID != participantID {
			other.mu.RLock()
			for _, trackInfo := range other.Tracks {
				existingTracks = append(existingTracks, trackInfo)
			}
			other.mu.RUnlock()
		}
	}

	// Notify other participants
	r.notifyParticipantJoined(participant)

	r.mu.Unlock() // Release room lock BEFORE subscribing

	// Now subscribe to existing tracks WITHOUT holding room lock
	for _, track := range existingTracks {
		log.Printf("[SFU] 📺 Evaluating existing track %s (%s) for new participant %s", track.TrackID, track.Kind, participantID)
		participant.HandlePublishedTrack(track)
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

func (r *SFURoom) UpdateParticipantQuality(participant *SFUParticipant, level QualityLevel) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	log.Printf("[SFU] 🎯 Updating subscriptions for %s to quality %d", participant.ID, level)
	for _, publisher := range r.participants {
		if publisher.ID == participant.ID {
			continue
		}
		tracks := publisher.getPublishedTracksSnapshot()
		for _, info := range tracks {
			participant.HandlePublishedTrack(info)
		}
	}
	participant.unsubscribeHigherThan(level)
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
	preferredQuality     QualityLevel
}

// TrackInfo contains information about a media track
type TrackInfo struct {
	Track       *webrtc.TrackRemote
	TrackLocal  *webrtc.TrackLocalStaticRTP
	Kind        string
	SSRC        webrtc.SSRC
	PublisherID string
	RID         string
	Quality     QualityLevel
	TrackID     string
}

// Subscription represents a subscription to another participant's track
type Subscription struct {
	ParticipantID string
	TrackID       string
	Sender        *webrtc.RTPSender
	Quality       QualityLevel
	Kind          string
}

// setupPeerConnection sets up handlers for peer connection
func (p *SFUParticipant) setupPeerConnection() {
	// Handle incoming tracks
	p.PeerConnection.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
		trackKind := track.Kind().String()
		log.Printf("[SFU] 🎥 TRACK RECEIVED: Participant %s (%s) published %s track (SSRC: %d, ID: %s)",
			p.ID, p.Name, trackKind, track.SSRC(), track.ID())

		// Log simulcast info - check codec parameters
		codec := track.Codec()
		log.Printf("[SFU] 📹 Track codec: %s, PayloadType: %d, ClockRate: %d",
			codec.MimeType, codec.PayloadType, codec.ClockRate)
		if track.RID() != "" {
			log.Printf("[SIMULCAST] 📹 Participant %s published simulcast layer: RID=%s", p.ID, track.RID())
		}

		// Create local track for forwarding with stream ID that identifies the publisher
		localTrackID := fmt.Sprintf("%s-%s", track.Kind(), uuid.NewString()[:8])
		streamID := fmt.Sprintf("stream-%s", p.ID)

		trackLocal, err := webrtc.NewTrackLocalStaticRTP(
			track.Codec().RTPCodecCapability,
			localTrackID,
			streamID,
		)
		if err != nil {
			log.Printf("[SFU] ❌ Failed to create local track for %s: %v", p.ID, err)
			return
		}

		log.Printf("[SFU] ✅ Created local track: ID=%s, StreamID=%s", localTrackID, streamID)

		// Store track info
		quality := QualityHigh
		rid := track.RID()
		if track.Kind() == webrtc.RTPCodecTypeVideo {
			quality = qualityFromRID(rid)
		}

		trackInfo := &TrackInfo{
			Track:       track,
			TrackLocal:  trackLocal,
			Kind:        trackKind,
			SSRC:        track.SSRC(),
			PublisherID: p.ID,
			RID:         rid,
			Quality:     quality,
			TrackID:     track.ID(),
		}

		p.mu.Lock()
		p.Tracks[track.ID()] = trackInfo
		trackCount := len(p.Tracks)
		p.mu.Unlock()

		log.Printf("[SFU] 📊 Participant %s now has %d track(s) published", p.ID, trackCount)

		// Forward track to all other participants - THIS IS CRITICAL
		log.Printf("[SFU] 🚀 Starting track forwarding goroutine for %s's %s track", p.ID, trackKind)
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

	log.Printf("[SFU] 🔄 forwardTrack: Starting forwarding for %s track from %s (id: %s)",
		track.Kind(), p.ID, track.ID())

	// Get snapshot of participants to subscribe
	participants := p.Room.GetAllParticipants()
	log.Printf("[SFU] 🔄 forwardTrack: Found %d total participants in room", len(participants))

	subscribedCount := 0
	for _, other := range participants {
		if other.ID == p.ID {
			continue
		}
		if other.HandlePublishedTrack(trackInfo) {
			subscribedCount++
		}
	}

	log.Printf("[SFU] ✅ forwardTrack: Subscribed %d participants to %s's %s track",
		subscribedCount, p.ID, track.Kind())

	// Read and forward RTP packets
	rtpBuf := make([]byte, 1500)
	const batchSize = 15
	packetBatch := make([][]byte, 0, batchSize)
	lastFlush := time.Now()

	flushBatch := func() bool {
		if len(packetBatch) == 0 {
			return true
		}
		for _, pkt := range packetBatch {
			if _, err := trackLocal.Write(pkt); err != nil && err != io.ErrClosedPipe {
				log.Printf("[SFU] ❌ forwardTrack: Error writing to local track %s: %v", track.ID(), err)
				return false
			}
		}
		packetBatch = packetBatch[:0]
		lastFlush = time.Now()
		return true
	}

	packetsForwarded := 0
	for {
		i, _, err := track.Read(rtpBuf)
		if err != nil {
			if err == io.EOF {
				if !flushBatch() {
					return
				}
				log.Printf("[SFU] 🔚 forwardTrack: EOF for %s's %s track (forwarded %d packets)",
					p.ID, track.Kind(), packetsForwarded)
				return
			}
			log.Printf("[SFU] ❌ forwardTrack: Error reading track %s from %s: %v",
				track.ID(), p.ID, err)
			return
		}

		packet := make([]byte, i)
		copy(packet, rtpBuf[:i])
		packetBatch = append(packetBatch, packet)

		if len(packetBatch) >= batchSize || time.Since(lastFlush) >= 5*time.Millisecond {
			if !flushBatch() {
				return
			}
		}

		packetsForwarded++
		// Log every 1000 packets to show activity
		if packetsForwarded%1000 == 0 {
			log.Printf("[SFU] 📊 forwardTrack: %s's %s track forwarded %d packets",
				p.ID, track.Kind(), packetsForwarded)
		}
	}
}

func subscriptionKey(participantID, trackID string) string {
	return fmt.Sprintf("%s-%s", participantID, trackID)
}

func (p *SFUParticipant) getPreferredQuality() QualityLevel {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.preferredQuality
}

func (p *SFUParticipant) scheduleRenegotiationLocked() {
	if p.renegotiateTimer != nil {
		p.renegotiateTimer.Stop()
	}
	p.pendingRenegotiate = true
	p.renegotiateTimer = time.AfterFunc(20*time.Millisecond, func() {
		p.mu.Lock()
		if p.pendingRenegotiate && !p.closed {
			p.pendingRenegotiate = false
			p.mu.Unlock()

			log.Printf("[SFU] 🔄 RENEGOTIATION: Triggering for %s", p.ID)
			if err := p.Renegotiate(); err != nil {
				log.Printf("[SFU] ❌ RENEGOTIATION FAILED for %s: %v", p.ID, err)
			} else {
				log.Printf("[SFU] ✅ RENEGOTIATION SUCCESS for %s", p.ID)
			}
		} else {
			p.mu.Unlock()
		}
	})
}

func (p *SFUParticipant) subscribeToTrack(trackInfo *TrackInfo) bool {
	key := subscriptionKey(trackInfo.PublisherID, trackInfo.TrackID)
	trackKind := trackInfo.TrackLocal.Kind().String()

	p.mu.Lock()
	if _, exists := p.subscribers[key]; exists {
		p.mu.Unlock()
		return false
	}

	sender, err := p.PeerConnection.AddTrack(trackInfo.TrackLocal)
	if err != nil {
		p.mu.Unlock()
		log.Printf("[SFU] ❌ Failed to add track for %s: %v", p.ID, err)
		return false
	}

	p.subscribers[key] = &Subscription{
		ParticipantID: trackInfo.PublisherID,
		TrackID:       trackInfo.TrackID,
		Sender:        sender,
		Quality:       trackInfo.Quality,
		Kind:          trackKind,
	}

	log.Printf("[SFU] ✅ Participant %s subscribed to %s's %s track (quality=%d)", p.ID, trackInfo.PublisherID, trackKind, trackInfo.Quality)

	removedOthers := false
	if trackKind == webrtc.RTPCodecTypeVideo.String() {
		removedOthers = p.unsubscribeOtherVideoLayersLocked(trackInfo.PublisherID, trackInfo.Quality)
	}

	p.scheduleRenegotiationLocked()
	p.mu.Unlock()

	if removedOthers {
		log.Printf("[SFU] ♻️ Participant %s cleaned up other layers from %s", p.ID, trackInfo.PublisherID)
	}

	go func() {
		rtcpBuf := make([]byte, 1500)
		for {
			if _, _, err := sender.Read(rtcpBuf); err != nil {
				return
			}
		}
	}()

	return true
}

func (p *SFUParticipant) unsubscribeTrack(participantID, trackID string) {
	key := subscriptionKey(participantID, trackID)

	p.mu.Lock()
	sub, exists := p.subscribers[key]
	if !exists {
		p.mu.Unlock()
		return
	}

	if err := p.PeerConnection.RemoveTrack(sub.Sender); err != nil {
		log.Printf("[SFU] ⚠️  Failed to remove track for %s: %v", p.ID, err)
	} else {
		_ = sub.Sender.Stop()
	}
	delete(p.subscribers, key)
	p.scheduleRenegotiationLocked()
	p.mu.Unlock()

	log.Printf("[SFU] 🧹 Participant %s unsubscribed from %s track %s", p.ID, participantID, trackID)
}

func (p *SFUParticipant) unsubscribeOtherVideoLayersLocked(publisherID string, keep QualityLevel) bool {
	removed := false
	for key, sub := range p.subscribers {
		if sub.ParticipantID == publisherID && sub.Kind == webrtc.RTPCodecTypeVideo.String() && sub.Quality != keep {
			if err := p.PeerConnection.RemoveTrack(sub.Sender); err != nil {
				log.Printf("[SFU] ⚠️  Failed to remove competing layer for %s: %v", p.ID, err)
			} else {
				_ = sub.Sender.Stop()
			}
			delete(p.subscribers, key)
			removed = true
			log.Printf("[SFU] 🔻 Participant %s removed layer %s for publisher %s", p.ID, key, publisherID)
		}
	}
	return removed
}

func (p *SFUParticipant) unsubscribeHigherThan(level QualityLevel) {
	p.mu.Lock()
	removed := false
	for key, sub := range p.subscribers {
		if sub.Kind == webrtc.RTPCodecTypeVideo.String() && sub.Quality > level {
			if err := p.PeerConnection.RemoveTrack(sub.Sender); err != nil {
				log.Printf("[SFU] ⚠️  Failed to remove high-quality track for %s: %v", p.ID, err)
			} else {
				_ = sub.Sender.Stop()
			}
			delete(p.subscribers, key)
			removed = true
			log.Printf("[SFU] 🔻 Participant %s removed subscription %s due to quality downgrade", p.ID, key)
		}
	}
	if removed {
		p.scheduleRenegotiationLocked()
	}
	p.mu.Unlock()
}

func (p *SFUParticipant) HandlePublishedTrack(trackInfo *TrackInfo) bool {
	if trackInfo.PublisherID == p.ID {
		return false
	}

	if trackInfo.Kind != webrtc.RTPCodecTypeVideo.String() {
		return p.subscribeToTrack(trackInfo)
	}

	preferred := p.getPreferredQuality()
	if shouldSubscribeToTrack(trackInfo, preferred) {
		return p.subscribeToTrack(trackInfo)
	}

	p.unsubscribeTrack(trackInfo.PublisherID, trackInfo.TrackID)
	return false
}

func (p *SFUParticipant) getPublishedTracksSnapshot() []*TrackInfo {
	p.mu.RLock()
	defer p.mu.RUnlock()
	tracks := make([]*TrackInfo, 0, len(p.Tracks))
	for _, info := range p.Tracks {
		tracks = append(tracks, info)
	}
	return tracks
}

func (p *SFUParticipant) SetPreferredQuality(level QualityLevel) {
	p.mu.Lock()
	if p.preferredQuality == level {
		p.mu.Unlock()
		return
	}
	p.preferredQuality = level
	p.mu.Unlock()
	log.Printf("[SFU] 🎚️ Participant %s set preferred quality to %d", p.ID, level)
	p.Room.UpdateParticipantQuality(p, level)
}

func (p *SFUParticipant) SetPreferredQualityString(level string) error {
	quality, err := qualityLevelFromString(level)
	if err != nil {
		return err
	}
	p.SetPreferredQuality(quality)
	return nil
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
