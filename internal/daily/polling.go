package daily

import (
	"context"
	"log"
	"sync"
	"time"

	"messenger/internal/transcript"
)

// PollingService polls Daily.co for new recordings and processes them
type PollingService struct {
	client           *Client
	processor        *transcript.Processor
	pollInterval     time.Duration
	processedIDs     map[string]bool
	processedIDsLock sync.RWMutex
	ctx              context.Context
	cancel           context.CancelFunc
	wg               sync.WaitGroup
}

// NewPollingService creates a new polling service
func NewPollingService(client *Client, processor *transcript.Processor, pollInterval time.Duration) *PollingService {
	if pollInterval == 0 {
		pollInterval = 5 * time.Minute
	}

	ctx, cancel := context.WithCancel(context.Background())

	return &PollingService{
		client:       client,
		processor:    processor,
		pollInterval: pollInterval,
		processedIDs: make(map[string]bool),
		ctx:          ctx,
		cancel:       cancel,
	}
}

// Start begins polling for new recordings
func (p *PollingService) Start() {
	if !p.client.IsConfigured() {
		log.Printf("[POLLING] ⚠️  Daily.co not configured, polling disabled")
		return
	}

	log.Printf("[POLLING] 🚀 Starting recording poller (interval: %v)", p.pollInterval)

	p.wg.Add(1)
	go p.pollLoop()
}

// Stop gracefully stops the polling service
func (p *PollingService) Stop() {
	log.Printf("[POLLING] 🛑 Stopping recording poller...")
	p.cancel()
	p.wg.Wait()
	log.Printf("[POLLING] ✅ Polling service stopped")
}

// pollLoop is the main polling loop
func (p *PollingService) pollLoop() {
	defer p.wg.Done()

	ticker := time.NewTicker(p.pollInterval)
	defer ticker.Stop()

	// Run immediately on start
	p.checkForNewRecordings()

	for {
		select {
		case <-p.ctx.Done():
			return
		case <-ticker.C:
			p.checkForNewRecordings()
		}
	}
}

// checkForNewRecordings checks Daily.co for new recordings
func (p *PollingService) checkForNewRecordings() {
	log.Printf("[POLLING] 🔍 Checking for new recordings...")

	recordings, err := p.client.ListRecordings("", 50)
	if err != nil {
		log.Printf("[POLLING] ❌ Failed to list recordings: %v", err)
		return
	}

	log.Printf("[POLLING] 📊 Found %d recordings", len(recordings))

	newCount := 0
	for _, rec := range recordings {
		// Only process finished recordings
		if rec.Status != "finished" {
			continue
		}

		// Skip if already processed
		if p.isProcessed(rec.ID) {
			continue
		}

		// Check if download URL is available
		if rec.DownloadURL == "" {
			log.Printf("[POLLING] ⚠️  Recording %s has no download URL", rec.ID)
			continue
		}

		log.Printf("[POLLING] 🆕 New recording found: %s (room: %s, duration: %ds)",
			rec.ID, rec.RoomName, rec.Duration)

		// Process in background
		go p.processRecording(rec)

		// Mark as processed
		p.markProcessed(rec.ID)
		newCount++
	}

	if newCount > 0 {
		log.Printf("[POLLING] ✅ Started processing %d new recordings", newCount)
	} else {
		log.Printf("[POLLING] ✨ No new recordings to process")
	}
}

// processRecording downloads and processes a single recording
func (p *PollingService) processRecording(rec Recording) {
	log.Printf("[POLLING] 📥 Processing recording %s...", rec.ID)

	// Download recording
	log.Printf("[POLLING] ⬇️  Downloading recording %s...", rec.ID)
	audioData, err := p.client.DownloadRecording(rec.DownloadURL)
	if err != nil {
		log.Printf("[POLLING] ❌ Failed to download recording %s: %v", rec.ID, err)
		return
	}

	log.Printf("[POLLING] ✅ Downloaded %d bytes for recording %s", len(audioData), rec.ID)

	// Process with transcript processor
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
	defer cancel()

	transcriptID := rec.RoomName + "_" + rec.ID

	log.Printf("[POLLING] 🎙️  Transcribing recording %s with Whisper...", rec.ID)

	transcript, err := p.processor.ProcessAudioData(ctx, transcriptID, rec.RoomName, audioData)
	if err != nil {
		log.Printf("[POLLING] ❌ Failed to process recording %s: %v", rec.ID, err)
		return
	}

	log.Printf("[POLLING] 🎉 Successfully processed recording %s → %d segments, %d insights",
		rec.ID, len(transcript.Segments), len(transcript.Insights.KeyPoints))
}

// isProcessed checks if a recording has been processed
func (p *PollingService) isProcessed(recordingID string) bool {
	p.processedIDsLock.RLock()
	defer p.processedIDsLock.RUnlock()
	return p.processedIDs[recordingID]
}

// markProcessed marks a recording as processed
func (p *PollingService) markProcessed(recordingID string) {
	p.processedIDsLock.Lock()
	defer p.processedIDsLock.Unlock()
	p.processedIDs[recordingID] = true

	// Limit map size to prevent memory leak (keep last 1000)
	if len(p.processedIDs) > 1000 {
		// Remove oldest entries (simple cleanup)
		count := 0
		for id := range p.processedIDs {
			delete(p.processedIDs, id)
			count++
			if count >= 200 {
				break
			}
		}
	}
}
