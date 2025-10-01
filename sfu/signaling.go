// sfu/signaling.go - WebRTC signaling for SFU
package sfu

import (
	"encoding/json"
	"log"

	"github.com/pion/webrtc/v3"
)

// SignalingMessage represents a WebRTC signaling message
type SignalingMessage struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

// HandleOffer processes an offer from participant
func (p *SFUParticipant) HandleOffer(offerJSON string) error {
	var offer webrtc.SessionDescription
	if err := json.Unmarshal([]byte(offerJSON), &offer); err != nil {
		return err
	}

	log.Printf("[SFU] Participant %s sent offer", p.ID)

	// Set remote description
	if err := p.PeerConnection.SetRemoteDescription(offer); err != nil {
		return err
	}

	// Create answer
	answer, err := p.PeerConnection.CreateAnswer(nil)
	if err != nil {
		return err
	}

	// Set local description
	if err := p.PeerConnection.SetLocalDescription(answer); err != nil {
		return err
	}

	// Send answer back
	answerJSON, err := json.Marshal(answer)
	if err != nil {
		return err
	}

	message := map[string]interface{}{
		"type": "answer",
		"data": string(answerJSON),
	}

	return p.SendMessage(message)
}

// HandleAnswer processes an answer from participant
func (p *SFUParticipant) HandleAnswer(answerJSON string) error {
	var answer webrtc.SessionDescription
	if err := json.Unmarshal([]byte(answerJSON), &answer); err != nil {
		return err
	}

	log.Printf("[SFU] Participant %s sent answer", p.ID)

	return p.PeerConnection.SetRemoteDescription(answer)
}

// HandleICECandidate processes an ICE candidate
func (p *SFUParticipant) HandleICECandidate(candidateJSON string) error {
	var candidate webrtc.ICECandidateInit
	if err := json.Unmarshal([]byte(candidateJSON), &candidate); err != nil {
		return err
	}

	log.Printf("[SFU] Participant %s sent ICE candidate", p.ID)

	return p.PeerConnection.AddICECandidate(candidate)
}

// SendMessage sends a message to participant
func (p *SFUParticipant) SendMessage(message interface{}) error {
	if p.Connection == nil {
		return nil
	}

	data, err := json.Marshal(message)
	if err != nil {
		return err
	}

	return p.Connection.WriteJSON(json.RawMessage(data))
}

// CreateOffer creates an offer for renegotiation
func (p *SFUParticipant) CreateOffer() error {
	offer, err := p.PeerConnection.CreateOffer(nil)
	if err != nil {
		return err
	}

	if err := p.PeerConnection.SetLocalDescription(offer); err != nil {
		return err
	}

	offerJSON, err := json.Marshal(offer)
	if err != nil {
		return err
	}

	message := map[string]interface{}{
		"type": "offer",
		"data": string(offerJSON),
	}

	return p.SendMessage(message)
}

// Renegotiate triggers renegotiation (when new tracks added)
func (p *SFUParticipant) Renegotiate() error {
	log.Printf("[SFU] Renegotiating with participant %s", p.ID)

	// Get current negotiation state
	if p.PeerConnection.SignalingState() != webrtc.SignalingStateStable {
		log.Printf("[SFU] Cannot renegotiate, signaling state: %s", p.PeerConnection.SignalingState())
		return nil
	}

	return p.CreateOffer()
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
