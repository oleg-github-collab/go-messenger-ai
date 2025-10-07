// sfu/bitrate.go - Adaptive bitrate control for SFU
package sfu

import (
	"log"
	"sync"
	"time"

	"github.com/pion/rtcp"
)

// BitrateController manages adaptive bitrate for a participant
type BitrateController struct {
	participant    *SFUParticipant
	targetBitrate  uint64
	currentBitrate uint64
	packetLoss     float64
	mu             sync.RWMutex
	stopChan       chan struct{}
}

// NewBitrateController creates a new bitrate controller
func NewBitrateController(p *SFUParticipant) *BitrateController {
	bc := &BitrateController{
		participant:    p,
		targetBitrate:  1200000,
		currentBitrate: 1200000,
		stopChan:       make(chan struct{}),
	}

	go bc.monitor()

	return bc
}

// monitor monitors connection quality and adjusts bitrate
func (bc *BitrateController) monitor() {
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-bc.stopChan:
			return
		case <-ticker.C:
			bc.updateBitrate()
		}
	}
}

// updateBitrate adjusts bitrate based on connection quality
func (bc *BitrateController) updateBitrate() {
	bc.mu.Lock()
	defer bc.mu.Unlock()

	// For now, use simple periodic REMB sending
	// In production, this would analyze RTCP reports for packet loss
	// The participant will monitor connection quality via RTCP feedback

	// Periodically send REMB to maintain target bitrate
	bc.applyBitrate()
}

// applyBitrate applies the target bitrate using REMB
func (bc *BitrateController) applyBitrate() {
	bc.participant.mu.RLock()
	defer bc.participant.mu.RUnlock()

	// Send REMB (Receiver Estimated Maximum Bitrate) for each video track
	for _, trackInfo := range bc.participant.Tracks {
		if trackInfo.Kind == "video" {
			remb := &rtcp.ReceiverEstimatedMaximumBitrate{
				Bitrate: float32(bc.targetBitrate),
				SSRCs:   []uint32{uint32(trackInfo.SSRC)},
			}

			if err := bc.participant.PeerConnection.WriteRTCP([]rtcp.Packet{remb}); err != nil {
				log.Printf("[SFU] Failed to send REMB: %v", err)
			}
		}
	}
}

// GetStats returns current stats
func (bc *BitrateController) GetStats() map[string]interface{} {
	bc.mu.RLock()
	defer bc.mu.RUnlock()

	return map[string]interface{}{
		"targetBitrate":  bc.targetBitrate,
		"currentBitrate": bc.currentBitrate,
		"packetLoss":     bc.packetLoss,
	}
}

// Stop stops the controller
func (bc *BitrateController) Stop() {
	close(bc.stopChan)
}

// QualityLevel represents video quality levels
type QualityLevel int

const (
	QualityLow QualityLevel = iota
	QualityMedium
	QualityHigh
)

// SimulcastController manages simulcast layers
type SimulcastController struct {
	participant     *SFUParticipant
	currentQuality  QualityLevel
	availableLayers []QualityLevel
	mu              sync.RWMutex
}

// NewSimulcastController creates a simulcast controller
func NewSimulcastController(p *SFUParticipant) *SimulcastController {
	return &SimulcastController{
		participant:     p,
		currentQuality:  QualityHigh,
		availableLayers: []QualityLevel{QualityLow, QualityMedium, QualityHigh},
	}
}

// SetQuality sets the desired quality level
func (sc *SimulcastController) SetQuality(quality QualityLevel) {
	sc.mu.Lock()
	defer sc.mu.Unlock()

	if sc.currentQuality == quality {
		return
	}

	sc.currentQuality = quality
	log.Printf("[SFU] Participant %s: Switched to quality %d", sc.participant.ID, quality)

	// In production, this would switch simulcast layers
	// For now, we adjust bitrate instead
	switch quality {
	case QualityLow:
		sc.requestBitrate(150000)
	case QualityMedium:
		sc.requestBitrate(500000)
	case QualityHigh:
		sc.requestBitrate(1200000)
	}
}

// requestBitrate requests a specific bitrate
func (sc *SimulcastController) requestBitrate(bitrate uint64) {
	for _, trackInfo := range sc.participant.Tracks {
		if trackInfo.Kind == "video" {
			remb := &rtcp.ReceiverEstimatedMaximumBitrate{
				Bitrate: float32(bitrate),
				SSRCs:   []uint32{uint32(trackInfo.SSRC)},
			}

			sc.participant.PeerConnection.WriteRTCP([]rtcp.Packet{remb})
		}
	}
}

// GetCurrentQuality returns current quality level
func (sc *SimulcastController) GetCurrentQuality() QualityLevel {
	sc.mu.RLock()
	defer sc.mu.RUnlock()
	return sc.currentQuality
}
