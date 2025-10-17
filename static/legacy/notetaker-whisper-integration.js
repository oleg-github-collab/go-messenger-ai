// Whisper API Integration Layer for AINotetaker
// This module enhances the existing notetaker with Whisper transcription

(function() {
    'use strict';

    // OpenAI API Key (from environment or embedded)
    const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';

    // Configuration
    const CONFIG = {
        useWhisper: true, // Use Whisper for transcription
        chunkDuration: 30000, // Send audio chunks every 30 seconds
        minChunkSize: 100000, // Minimum 100KB before sending
        maxRetries: 2,
        fallbackToWebSpeech: true // Fallback to Web Speech API if Whisper fails
    };

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        // Wait for notetaker to be initialized
        setTimeout(initWhisperIntegration, 1000);
    });

    function initWhisperIntegration() {
        if (!window.notetaker) {
            console.log('[WHISPER-INTEGRATION] Notetaker not found, retrying...');
            setTimeout(initWhisperIntegration, 1000);
            return;
        }

        console.log('[WHISPER-INTEGRATION] 🚀 Initializing Whisper integration...');

        // Initialize Whisper transcriber
        if (typeof WhisperTranscriber === 'undefined') {
            console.error('[WHISPER-INTEGRATION] WhisperTranscriber class not loaded');
            return;
        }

        window.whisperTranscriber = new WhisperTranscriber(OPENAI_API_KEY);
        console.log('[WHISPER-INTEGRATION] ✅ Whisper transcriber initialized');

        // Initialize transcript manager
        if (typeof TranscriptManager === 'undefined') {
            console.error('[WHISPER-INTEGRATION] TranscriptManager class not loaded');
            return;
        }

        window.transcriptManager = new TranscriptManager();
        window.transcriptManager.enableAutoSave(300000); // Auto-save every 5 minutes
        window.transcriptManager.load(); // Load previous session if exists
        console.log('[WHISPER-INTEGRATION] ✅ Transcript manager initialized');

        // Enhance notetaker with Whisper capabilities
        enhanceNotetaker();
    }

    function enhanceNotetaker() {
        const notetaker = window.notetaker;

        // Store original toggle method
        const originalToggleRecording = notetaker.toggleRecording.bind(notetaker);

        // Audio recording state
        let audioRecorder = null;
        let audioChunks = [];
        let chunkTimer = null;
        let recordingStartTime = null;
        let localCaptureStream = null;
        let recordingStream = null;
        let shouldSelfStopTracks = false;

        // Override toggleRecording to add Whisper support
        notetaker.toggleRecording = async function() {
            if (!this.isRecording) {
                // Start recording
                console.log('[WHISPER-INTEGRATION] 🎙️ Starting Whisper-enhanced recording...');

                try {
                    // Get local audio stream
                    const baseStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    localCaptureStream = baseStream;

                    // Ask notetaker to prepare a mixed stream if available
                    shouldSelfStopTracks = false;
                    try {
                        if (typeof notetaker.prepareRecordingStream === 'function') {
                            recordingStream = await notetaker.prepareRecordingStream(baseStream);
                            shouldSelfStopTracks = false;
                        } else {
                            recordingStream = baseStream;
                            shouldSelfStopTracks = true;
                        }
                    } catch (mixErr) {
                        console.warn('[WHISPER-INTEGRATION] ⚠️ Failed to prepare mixed recording stream:', mixErr);
                        recordingStream = baseStream;
                        shouldSelfStopTracks = true;
                    }

                    if (!recordingStream) {
                        recordingStream = baseStream;
                    }

                    // Create audio recorder
                    audioRecorder = new MediaRecorder(recordingStream, {
                        mimeType: 'audio/webm;codecs=opus',
                        audioBitsPerSecond: 128000
                    });

                    audioChunks = [];
                    recordingStartTime = Date.now();

                    audioRecorder.ondataavailable = (event) => {
                        if (event.data.size > 0) {
                            audioChunks.push(event.data);
                        }
                    };

                    audioRecorder.onstop = async () => {
                        console.log('[WHISPER-INTEGRATION] 🛑 Recording stopped, processing audio...');

                        if (audioChunks.length === 0) {
                            console.warn('[WHISPER-INTEGRATION] No audio data recorded');
                            return;
                        }

                        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                        console.log(`[WHISPER-INTEGRATION] Audio blob size: ${(audioBlob.size / 1024).toFixed(2)}KB`);

                        // Transcribe with Whisper
                        await transcribeWithWhisper(audioBlob);

                        // Clear chunks
                        audioChunks = [];

                        if (shouldSelfStopTracks && localCaptureStream) {
                            try {
                                localCaptureStream.getTracks().forEach(track => track.stop());
                            } catch (stopErr) {
                                console.warn('[WHISPER-INTEGRATION] ⚠️ Failed to stop local capture stream:', stopErr);
                            }
                        }

                        recordingStream = null;
                        localCaptureStream = null;
                        shouldSelfStopTracks = false;
                    };

                    // Start recording
                    audioRecorder.start(1000); // Capture data every second

                    // Set up periodic chunk processing
                    if (CONFIG.chunkDuration > 0) {
                        chunkTimer = setInterval(() => {
                            processAudioChunk();
                        }, CONFIG.chunkDuration);
                    }

                    // Update UI
                    updateStatus('recording', 'Recording with Whisper AI...');

                } catch (error) {
                    console.error('[WHISPER-INTEGRATION] Failed to start recording:', error);
                    if (CONFIG.fallbackToWebSpeech) {
                        console.log('[WHISPER-INTEGRATION] Falling back to Web Speech API');
                        return originalToggleRecording.call(this);
                    }
                }

            } else {
                // Stop recording
                console.log('[WHISPER-INTEGRATION] Stopping recording...');

                if (chunkTimer) {
                    clearInterval(chunkTimer);
                    chunkTimer = null;
                }

                if (audioRecorder && audioRecorder.state !== 'inactive') {
                    audioRecorder.stop();
                }

                updateStatus('ready', 'Processing complete');
            }

            // Call original method for UI updates
            this.isRecording = !this.isRecording;
            updateToggleButton(this.isRecording);
        };

        async function processAudioChunk() {
            if (audioChunks.length === 0) return;

            const chunkBlob = new Blob(audioChunks, { type: 'audio/webm' });

            // Only process if chunk is large enough
            if (chunkBlob.size < CONFIG.minChunkSize) {
                console.log('[WHISPER-INTEGRATION] Chunk too small, waiting...');
                return;
            }

            console.log(`[WHISPER-INTEGRATION] Processing chunk: ${(chunkBlob.size / 1024).toFixed(2)}KB`);

            // Create copy of chunks for processing
            const chunksToProcess = [...audioChunks];
            audioChunks = []; // Clear for next chunk

            const processingBlob = new Blob(chunksToProcess, { type: 'audio/webm' });

            // Transcribe in background
            transcribeWithWhisper(processingBlob).catch(error => {
                console.error('[WHISPER-INTEGRATION] Chunk transcription failed:', error);
            });
        }

        async function transcribeWithWhisper(audioBlob) {
            try {
                updateStatus('processing', 'Transcribing with Whisper AI...');

                // Get selected language
                const langSelect = document.getElementById('notetakerLangSelect');
                const language = langSelect ? langSelect.value : 'uk-UA';

                // Get meeting context for prompt engineering
                const meetingContext = notetaker.meetingContext || {};
                const prompt = buildTranscriptionPrompt(meetingContext);

                const result = await window.whisperTranscriber.transcribe(audioBlob, language, {
                    prompt: prompt,
                    timestamps: true,
                    temperature: 0.2 // Lower temperature for more accurate transcription
                });

                console.log('[WHISPER-INTEGRATION] ✅ Transcription result:', result);

                // Process result
                if (result.text && result.text.trim().length > 0) {
                    if (window.notetaker && typeof window.notetaker.ingestTranscriptionResult === 'function') {
                        window.notetaker.ingestTranscriptionResult(result, {
                            language,
                            capturedAt: Date.now(),
                            duration: result.duration
                        });
                    } else {
                        const timestamp = Date.now();

                        const entry = window.transcriptManager.addEntry(
                            result.text.trim(),
                            timestamp,
                            'Host',
                            {
                                duration: result.duration,
                                language: result.language,
                                segments: result.segments
                            }
                        );

                        addTranscriptToUI(result.text.trim(), timestamp);

                        if (result.segments) {
                            autoCategorizeSegments(result.segments, entry.id);
                        }
                    }

                    updateStatus('ready', 'Transcription complete');
                    updateStats();
                }

            } catch (error) {
                console.error('[WHISPER-INTEGRATION] Transcription error:', error);
                updateStatus('error', 'Transcription failed');

                // Retry with fallback if enabled
                if (CONFIG.fallbackToWebSpeech) {
                    console.log('[WHISPER-INTEGRATION] Attempting fallback to Web Speech API...');
                    // The original Web Speech API will continue in parallel
                }
            }
        }

        function buildTranscriptionPrompt(context) {
            let prompt = '';

            if (context.type) {
                prompt += `This is a ${context.type} meeting. `;
            }

            if (context.goal) {
                prompt += `Meeting goal: ${context.goal}. `;
            }

            if (context.partnerInfo) {
                prompt += `Participants: ${context.partnerInfo}. `;
            }

            // Add common terms to improve accuracy
            prompt += 'Common terms: video call, presentation, discussion, action items, follow-up.';

            return prompt.substring(0, 224); // Whisper prompt limit
        }

        function addTranscriptToUI(text, timestamp) {
            const transcriptContainer = document.getElementById('realtimeTranscript');
            if (!transcriptContainer) return;

            // Remove placeholder if exists
            const placeholder = transcriptContainer.querySelector('.transcript-placeholder');
            if (placeholder) {
                placeholder.remove();
            }

            // Create entry element
            const entry = document.createElement('div');
            entry.className = 'transcript-entry';

            const time = new Date(timestamp).toLocaleTimeString();
            entry.innerHTML = `
                <div class="transcript-entry-time">${time}</div>
                <div class="transcript-entry-text">${text}</div>
            `;

            transcriptContainer.appendChild(entry);

            // Scroll to bottom
            transcriptContainer.scrollTop = transcriptContainer.scrollHeight;
        }

        function autoCategorizeSegments(segments, entryId) {
            // Simple keyword-based categorization
            const keywords = {
                'action': ['action', 'todo', 'need to', 'должны', 'треба', 'необхідно'],
                'decision': ['decided', 'agree', 'вирішили', 'согласились', 'decision'],
                'question': ['?', 'how', 'what', 'why', 'чому', 'що', 'як'],
                'important': ['important', 'critical', 'urgent', 'важливо', 'терміново']
            };

            for (const segment of segments) {
                const text = segment.text.toLowerCase();

                for (const [category, words] of Object.entries(keywords)) {
                    for (const word of words) {
                        if (text.includes(word)) {
                            window.transcriptManager.categorizeEntry(entryId, category, 0.8);
                            break;
                        }
                    }
                }
            }
        }

        function updateStatus(state, message) {
            const statusBadge = document.getElementById('notetakerStatusBadge');
            const statusText = statusBadge ? statusBadge.querySelector('.status-text') : null;

            if (statusText) {
                statusText.textContent = message;
            }

            if (statusBadge) {
                statusBadge.className = 'notetaker-status-badge';
                if (state === 'recording') {
                    statusBadge.classList.add('recording');
                }
            }
        }

        function updateToggleButton(isRecording) {
            const toggleBtn = document.getElementById('notetakerToggleBtn');
            if (!toggleBtn) return;

            const icon = toggleBtn.querySelector('.notetaker-icon');
            const text = toggleBtn.querySelector('.notetaker-text');

            if (isRecording) {
                toggleBtn.classList.add('recording');
                if (icon) icon.textContent = '⏹️';
                if (text) text.textContent = 'Stop AI Assistant';
            } else {
                toggleBtn.classList.remove('recording');
                if (icon) icon.textContent = '🎙️';
                if (text) text.textContent = 'Start AI Assistant';
            }
        }

        function updateStats() {
            const stats = window.transcriptManager.getStats();

            // Update word count
            const wordCountEl = document.getElementById('transcriptWordCount');
            if (wordCountEl) {
                wordCountEl.textContent = stats.totalWords;
            }

            // Update entries count
            const entriesEl = document.getElementById('transcriptEntries');
            if (entriesEl) {
                entriesEl.textContent = stats.totalEntries;
            }

            // Update highlights count
            const highlightsEl = document.getElementById('transcriptHighlights');
            if (highlightsEl) {
                highlightsEl.textContent = stats.totalHighlights;
            }

            // Update duration
            const durationEl = document.getElementById('transcriptDuration');
            if (durationEl && recordingStartTime) {
                const elapsed = Date.now() - recordingStartTime;
                const minutes = Math.floor(elapsed / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                durationEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }

        // Update stats every second
        setInterval(updateStats, 1000);

        console.log('[WHISPER-INTEGRATION] ✅ Notetaker enhanced with Whisper capabilities');
    }

    // Expose configuration for external modification
    window.WhisperIntegrationConfig = CONFIG;

})();
