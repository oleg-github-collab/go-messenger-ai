// sfu/signaling.go - WebRTC signaling for SFU
package sfu

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/pion/webrtc/v3"
)

// SignalingMessage represents a WebRTC signaling message
type SignalingMessage struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

// HandleOffer processes an offer from participant
func (p *SFUParticipant) HandleOffer(offerJSON string) error {
	log.Printf("[SFU] 📥 HandleOffer: Received offer from %s (size: %d bytes)", p.ID, len(offerJSON))

	var offer webrtc.SessionDescription
	if err := json.Unmarshal([]byte(offerJSON), &offer); err != nil {
		log.Printf("[SFU] ❌ HandleOffer: Failed to unmarshal offer from %s: %v", p.ID, err)
		return err
	}

	log.Printf("[SFU] 🔵 Participant %s sent offer (type: %s)", p.ID, offer.Type)

	// CRITICAL: Log what's in the offer SDP
	hasVideo := false
	hasAudio := false
	if offer.SDP != "" {
		hasVideo = len(offer.SDP) > 0 && (offer.SDP[0:10] == "v=0\r\nm=vi" || offer.SDP[len(offer.SDP)-20:] != "")
		hasAudio = len(offer.SDP) > 0 && (offer.SDP[0:10] == "v=0\r\nm=au" || offer.SDP[len(offer.SDP)-20:] != "")
	}
	log.Printf("[SFU] 📊 Offer SDP analysis: hasVideo=%v, hasAudio=%v, SDP length=%d", hasVideo, hasAudio, len(offer.SDP))

	// Log current connection state
	log.Printf("[SFU] 📊 Current peer connection state before setRemoteDescription: signaling=%s, connection=%s, ICE=%s",
		p.PeerConnection.SignalingState(), p.PeerConnection.ConnectionState(), p.PeerConnection.ICEConnectionState())

	// Set remote description
	if err := p.PeerConnection.SetRemoteDescription(offer); err != nil {
		log.Printf("[SFU] ❌ HandleOffer: Failed to set remote description for %s: %v", p.ID, err)
		return err
	}
	log.Printf("[SFU] ✅ Set remote description for %s", p.ID)

	// Log state after setRemoteDescription
	log.Printf("[SFU] 📊 State after setRemoteDescription: signaling=%s, connection=%s, ICE=%s",
		p.PeerConnection.SignalingState(), p.PeerConnection.ConnectionState(), p.PeerConnection.ICEConnectionState())

	// CRITICAL: Log transceivers after setting remote description
	transceivers := p.PeerConnection.GetTransceivers()
	log.Printf("[SFU] 📊 Transceivers after setRemoteDescription: %d", len(transceivers))
	for i, t := range transceivers {
		mid := "nil"
		if t.Mid() != "" {
			mid = t.Mid()
		}
		direction := t.Direction().String()
		kind := "unknown"
		if t.Receiver() != nil && t.Receiver().Track() != nil {
			kind = t.Receiver().Track().Kind().String()
		}
		log.Printf("[SFU] 📊 Transceiver %d: mid=%s, direction=%s, kind=%s", i, mid, direction, kind)
	}

	// Create answer
	answer, err := p.PeerConnection.CreateAnswer(nil)
	if err != nil {
		log.Printf("[SFU] ❌ HandleOffer: Failed to create answer for %s: %v", p.ID, err)
		return err
	}
	log.Printf("[SFU] ✅ Created answer for %s", p.ID)

	// Set local description
	if err := p.PeerConnection.SetLocalDescription(answer); err != nil {
		log.Printf("[SFU] ❌ HandleOffer: Failed to set local description for %s: %v", p.ID, err)
		return err
	}
	log.Printf("[SFU] ✅ Set local description (answer) for %s", p.ID)

	// Send answer back
	answerJSON, err := json.Marshal(answer)
	if err != nil {
		log.Printf("[SFU] ❌ HandleOffer: Failed to marshal answer for %s: %v", p.ID, err)
		return err
	}

	message := map[string]interface{}{
		"type": "answer",
		"data": string(answerJSON),
	}

	log.Printf("[SFU] 📤 Sending answer to %s (size: %d bytes)", p.ID, len(answerJSON))
	log.Printf("[SFU] 📊 Final state: signaling=%s, connection=%s, ICE=%s",
		p.PeerConnection.SignalingState(), p.PeerConnection.ConnectionState(), p.PeerConnection.ICEConnectionState())

	return p.SendMessage(message)
}

// HandleAnswer processes an answer from participant
func (p *SFUParticipant) HandleAnswer(answerJSON string) error {
	log.Printf("[SFU] 📥 HandleAnswer: Received answer from %s (%s) - size: %d bytes", p.ID, p.Name, len(answerJSON))
	log.Printf("[SFU] 📥 Current signaling state before answer: %s", p.PeerConnection.SignalingState())

	var answer webrtc.SessionDescription
	if err := json.Unmarshal([]byte(answerJSON), &answer); err != nil {
		log.Printf("[SFU] ❌ HandleAnswer: Failed to unmarshal answer from %s: %v", p.ID, err)
		return err
	}

	log.Printf("[SFU] 🔵 Participant %s sent answer (type: %s)", p.ID, answer.Type)

	if err := p.PeerConnection.SetRemoteDescription(answer); err != nil {
		log.Printf("[SFU] ❌ HandleAnswer: Failed to set remote description for %s: %v", p.ID, err)
		log.Printf("[SFU] ❌ Signaling state: %s, Connection state: %s",
			p.PeerConnection.SignalingState(), p.PeerConnection.ConnectionState())
		return err
	}

	log.Printf("[SFU] ✅ HandleAnswer: Remote description (answer) set for %s", p.ID)
	log.Printf("[SFU] ✅ New signaling state: %s, Connection state: %s",
		p.PeerConnection.SignalingState(), p.PeerConnection.ConnectionState())

	return nil
}

// HandleICECandidate processes an ICE candidate with batching
func (p *SFUParticipant) HandleICECandidate(candidateJSON string) error {
	var candidate webrtc.ICECandidateInit
	if err := json.Unmarshal([]byte(candidateJSON), &candidate); err != nil {
		log.Printf("[SFU] ❌ HandleICECandidate: Failed to unmarshal candidate from %s: %v", p.ID, err)
		return err
	}

	p.iceMu.Lock()
	defer p.iceMu.Unlock()

	// Add to batch
	p.pendingICECandidates = append(p.pendingICECandidates, candidate)
	log.Printf("[SFU] 🧊 Participant %s queued ICE candidate (batch size: %d)", p.ID, len(p.pendingICECandidates))

	// Cancel existing timer
	if p.iceBatchTimer != nil {
		p.iceBatchTimer.Stop()
	}

	// Set timer to flush batch after 50ms (or when we have 5 candidates)
	if len(p.pendingICECandidates) >= 5 {
		// Flush immediately if we have enough candidates
		return p.flushICECandidates()
	}

	// Otherwise wait for more candidates
	p.iceBatchTimer = time.AfterFunc(50*time.Millisecond, func() {
		p.iceMu.Lock()
		defer p.iceMu.Unlock()
		if len(p.pendingICECandidates) > 0 {
			p.flushICECandidates()
		}
	})

	return nil
}

// flushICECandidates adds all pending ICE candidates (must be called with iceMu locked)
func (p *SFUParticipant) flushICECandidates() error {
	if len(p.pendingICECandidates) == 0 {
		return nil
	}

	log.Printf("[SFU] 🧊 Flushing %d ICE candidates for %s", len(p.pendingICECandidates), p.ID)

	for _, candidate := range p.pendingICECandidates {
		if err := p.PeerConnection.AddICECandidate(candidate); err != nil {
			log.Printf("[SFU] ❌ Failed to add ICE candidate for %s: %v", p.ID, err)
			// Continue adding other candidates even if one fails
		}
	}

	log.Printf("[SFU] ✅ Batch added %d ICE candidates for %s. ICE state: %s",
		len(p.pendingICECandidates), p.ID, p.PeerConnection.ICEConnectionState())

	// Clear batch
	p.pendingICECandidates = nil

	return nil
}

// SendMessage sends a message to participant
func (p *SFUParticipant) SendMessage(message interface{}) error {
	if p.Connection == nil {
		log.Printf("[SFU] ⚠️  SendMessage: Connection is nil for participant %s", p.ID)
		return nil
	}

	// Extract message type for logging
	msgType := "unknown"
	if msgMap, ok := message.(map[string]interface{}); ok {
		if t, exists := msgMap["type"]; exists {
			msgType = fmt.Sprint(t)
		}
	}

	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("[SFU] ❌ SendMessage: Failed to marshal %s for %s: %v", msgType, p.ID, err)
		return err
	}

	log.Printf("[SFU] 📤 Sending %s to participant %s (data size: %d bytes)", msgType, p.ID, len(data))

	// Protect WebSocket writes with mutex to prevent concurrent write panic
	p.wsMu.Lock()
	err = p.Connection.WriteJSON(json.RawMessage(data))
	p.wsMu.Unlock()

	if err != nil {
		log.Printf("[SFU] ❌ SendMessage: Failed to write %s to %s: %v", msgType, p.ID, err)
	}

	return err
}

// CreateOffer creates an offer for renegotiation
func (p *SFUParticipant) CreateOffer() error {
	log.Printf("[SFU] 🎯 CreateOffer: Starting offer creation for %s (%s)", p.ID, p.Name)
	log.Printf("[SFU] 🎯 Current signaling state: %s", p.PeerConnection.SignalingState())

	// Log current tracks
	senders := p.PeerConnection.GetSenders()
	log.Printf("[SFU] 🎯 Current senders count: %d", len(senders))
	for i, sender := range senders {
		if sender.Track() != nil {
			log.Printf("[SFU] 🎯 Sender %d: %s track (id: %s)", i, sender.Track().Kind(), sender.Track().ID())
		}
	}

	offer, err := p.PeerConnection.CreateOffer(nil)
	if err != nil {
		log.Printf("[SFU] ❌ CreateOffer: Failed to create offer for %s: %v", p.ID, err)
		return err
	}
	log.Printf("[SFU] ✅ CreateOffer: Offer created for %s", p.ID)

	if err := p.PeerConnection.SetLocalDescription(offer); err != nil {
		log.Printf("[SFU] ❌ CreateOffer: Failed to set local description for %s: %v", p.ID, err)
		return err
	}
	log.Printf("[SFU] ✅ CreateOffer: Local description set for %s", p.ID)

	offerJSON, err := json.Marshal(offer)
	if err != nil {
		log.Printf("[SFU] ❌ CreateOffer: Failed to marshal offer for %s: %v", p.ID, err)
		return err
	}

	message := map[string]interface{}{
		"type": "offer",
		"data": string(offerJSON),
	}

	log.Printf("[SFU] 📤 CreateOffer: Sending offer to %s (size: %d bytes)", p.ID, len(offerJSON))
	return p.SendMessage(message)
}

// Renegotiate triggers renegotiation (when new tracks added)
func (p *SFUParticipant) Renegotiate() error {
	currentState := p.PeerConnection.SignalingState()
	log.Printf("[SFU] 🔄 Renegotiate called for %s (%s), signaling state: %s",
		p.ID, p.Name, currentState)

	// Check if closed
	if p.closed {
		log.Printf("[SFU] ⚠️ Cannot renegotiate - participant %s is closed", p.ID)
		return fmt.Errorf("participant closed")
	}

	// Wait for stable state with retry - increased attempts and reduced delay
	maxRetries := 30
	retryDelay := 50 * time.Millisecond

	for i := 0; i < maxRetries; i++ {
		state := p.PeerConnection.SignalingState()
		connState := p.PeerConnection.ConnectionState()

		if state == webrtc.SignalingStateStable {
			log.Printf("[SFU] ✅ Signaling state STABLE for %s, creating renegotiation offer", p.ID)
			log.Printf("[SFU] 📊 Connection state: %s, ICE state: %s",
				connState, p.PeerConnection.ICEConnectionState())
			return p.CreateOffer()
		}

		log.Printf("[SFU] ⏳ Waiting for stable state for %s (attempt %d/%d), current: %s, conn: %s",
			p.ID, i+1, maxRetries, state, connState)

		// If we're in "have-remote-offer" state, we should answer first
		if state == webrtc.SignalingStateHaveRemoteOffer {
			log.Printf("[SFU] ⚠️  Participant %s is in have-remote-offer state - cannot create offer", p.ID)
			return fmt.Errorf("cannot create offer while in have-remote-offer state")
		}

		time.Sleep(retryDelay)
	}

	log.Printf("[SFU] ❌ Cannot renegotiate for %s after %d attempts, signaling state: %s",
		p.ID, maxRetries, p.PeerConnection.SignalingState())
	return fmt.Errorf("renegotiation timeout - unstable signaling state")
}

// NotifyTrackPublished notifies participant about new track from another participant
func (p *SFUParticipant) NotifyTrackPublished(publisherID, publisherName, trackKind string) {
	message := map[string]interface{}{
		"type": "track-published",
		"data": map[string]string{
			"publisherId":   publisherID,
			"publisherName": publisherName,
			"kind":          trackKind,
		},
	}

	p.SendMessage(message)
}

// NotifyTrackUnpublished notifies participant about removed track
func (p *SFUParticipant) NotifyTrackUnpublished(publisherID, trackID string) {
	message := map[string]interface{}{
		"type": "track-unpublished",
		"data": map[string]string{
			"publisherId": publisherID,
			"trackId":     trackID,
		},
	}

	p.SendMessage(message)
}
