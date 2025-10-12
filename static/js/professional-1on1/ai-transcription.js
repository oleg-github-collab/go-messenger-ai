/**
 * AI Transcription System with Whisper + GPT-4o
 * Real-time speech-to-text with intelligent highlighting and analysis
 */

class AITranscription {
    constructor(app) {
        this.app = app;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.transcriptionInterval = null;
        this.currentAudioContext = null;
    }

    async startTranscription() {
        console.log('[AI TRANSCRIPTION] Starting Whisper + GPT-4o...');

        try {
            // Get audio stream
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000
                }
            });

            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = async () => {
                await this.processAudioChunk();
                this.audioChunks = [];
            };

            // Record in 10-second chunks for real-time transcription
            this.mediaRecorder.start();
            this.isRecording = true;

            // Process chunks every 10 seconds
            this.transcriptionInterval = setInterval(() => {
                if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                    this.mediaRecorder.stop();
                    setTimeout(() => {
                        if (this.isRecording) {
                            this.mediaRecorder.start();
                        }
                    }, 100);
                }
            }, 10000);

            this.app.showCustomAlert('AI Transcription started (Whisper + GPT-4o)', 'success');
            console.log('[AI TRANSCRIPTION] ✅ Started');

        } catch (error) {
            console.error('[AI TRANSCRIPTION] ❌ Failed:', error);
            this.app.showCustomAlert('Failed to start transcription: ' + error.message, 'error');
        }
    }

    async processAudioChunk() {
        if (this.audioChunks.length === 0) return;

        try {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

            // Send to backend for Whisper transcription
            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.webm');

            const response = await fetch('/api/professional/transcribe', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Transcription API failed');
            }

            const data = await response.json();

            if (data.text && data.text.trim()) {
                // Add transcription entry
                this.addTranscriptionEntry(data);

                // Analyze with GPT-4o
                await this.analyzeWithGPT4o(data);
            }

        } catch (error) {
            console.error('[AI TRANSCRIPTION] Processing failed:', error);
        }
    }

    addTranscriptionEntry(data) {
        const entry = {
            id: Date.now(),
            text: data.text,
            speaker: data.speaker || 'Unknown',
            speakerName: data.speaker || 'Participant',
            timestamp: new Date(),
            language: data.language || 'en',
            confidence: data.confidence || 0.9
        };

        // Add to transcript list
        this.app.transcriptEntries.push(entry);

        // Display in UI
        const entryEl = document.createElement('div');
        entryEl.className = 'transcript-entry';
        entryEl.dataset.entryId = entry.id;
        entryEl.dataset.speaker = entry.speaker === 'me' ? 'me' : 'guest';

        const time = entry.timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const initial = entry.speakerName.charAt(0).toUpperCase();
        const avatarClass = entry.speaker === 'me' ? 'speaker-avatar-me' : 'speaker-avatar-guest';

        entryEl.innerHTML = `
            <div class="transcript-header">
                <div class="speaker-avatar ${avatarClass}">${initial}</div>
                <div class="speaker-name">${entry.speakerName}</div>
                <div class="timestamp">${time}</div>
                <div class="confidence-badge">${Math.round(entry.confidence * 100)}%</div>
            </div>
            <div class="transcript-text">${this.highlightText(entry.text)}</div>
            <div class="ai-indicator" style="display: none;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Analyzing with GPT-4o...
            </div>
        `;

        const listEl = document.getElementById('transcriptList');
        listEl.appendChild(entryEl);
        listEl.scrollTop = listEl.scrollHeight;

        // Remove empty state if exists
        const emptyState = listEl.querySelector('.empty-state');
        if (emptyState) emptyState.remove();
    }

    highlightText(text) {
        // Highlight keywords, questions, important phrases
        const keywords = {
            questions: /\b(why|how|what|when|where|who|which)\b/gi,
            important: /\b(important|critical|urgent|must|should|need to)\b/gi,
            agreement: /\b(yes|agree|correct|exactly|sure|definitely)\b/gi,
            disagreement: /\b(no|disagree|wrong|incorrect|but|however)\b/gi,
            numbers: /\b\d+(\.\d+)?\b/g,
            currency: /\$\d+(\.\d+)?[KMB]?/gi,
            dates: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g
        };

        let highlighted = text;

        // Questions - yellow
        highlighted = highlighted.replace(keywords.questions, (match) =>
            `<span class="highlight-question">${match}</span>`
        );

        // Important words - red
        highlighted = highlighted.replace(keywords.important, (match) =>
            `<span class="highlight-important">${match}</span>`
        );

        // Agreement - green
        highlighted = highlighted.replace(keywords.agreement, (match) =>
            `<span class="highlight-agreement">${match}</span>`
        );

        // Disagreement - orange
        highlighted = highlighted.replace(keywords.disagreement, (match) =>
            `<span class="highlight-disagreement">${match}</span>`
        );

        // Numbers - blue
        highlighted = highlighted.replace(keywords.numbers, (match) =>
            `<span class="highlight-number">${match}</span>`
        );

        // Currency - cyan
        highlighted = highlighted.replace(keywords.currency, (match) =>
            `<span class="highlight-currency">${match}</span>`
        );

        // Dates - purple
        highlighted = highlighted.replace(keywords.dates, (match) =>
            `<span class="highlight-date">${match}</span>`
        );

        return highlighted;
    }

    async analyzeWithGPT4o(entry) {
        try {
            const entryEl = document.querySelector(`[data-entry-id="${entry.id}"]`);
            const aiIndicator = entryEl?.querySelector('.ai-indicator');
            if (aiIndicator) aiIndicator.style.display = 'flex';

            // Call GPT-4o for analysis
            const response = await fetch('/api/professional/analyze-gpt4o', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({
                    text: entry.text,
                    speaker: entry.speakerName,
                    timestamp: entry.timestamp,
                    context: this.app.transcriptEntries.slice(-5).map(e => e.text).join(' ')
                })
            });

            if (!response.ok) {
                throw new Error('GPT-4o analysis failed');
            }

            const analysis = await response.json();

            // Update entry with analysis
            const transcriptEntry = this.app.transcriptEntries.find(e => e.id === entry.id);
            if (transcriptEntry) {
                transcriptEntry.category = analysis.category;
                transcriptEntry.sentiment = analysis.sentiment;
                transcriptEntry.urgency = analysis.urgency;
                transcriptEntry.keyPoints = analysis.key_points;
                transcriptEntry.actionItems = analysis.action_items;
                transcriptEntry.recommendation = analysis.recommendation;
            }

            // Update UI with analysis
            if (entryEl) {
                if (analysis.category && analysis.category !== 'general') {
                    entryEl.classList.add('ai-detected');
                    entryEl.classList.add(`category-${analysis.category}`);

                    if (analysis.urgency === 'high') {
                        entryEl.classList.add('ai-urgent');
                    }

                    // Make clickable for details
                    entryEl.style.cursor = 'pointer';
                    entryEl.addEventListener('click', () => this.showAIAnalysis(transcriptEntry));

                    // Update indicator
                    if (aiIndicator) {
                        const categoryEmoji = {
                            'question': '❓',
                            'action_item': '✅',
                            'decision': '🎯',
                            'objection': '🚨',
                            'agreement': '✓',
                            'important': '⚠️'
                        };

                        const emoji = categoryEmoji[analysis.category] || '🤖';

                        aiIndicator.innerHTML = `
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            ${emoji} ${analysis.category} - Click for AI insights
                        `;
                        aiIndicator.style.color = analysis.urgency === 'high' ? '#ef4444' : 'var(--accent-green)';
                    }
                } else {
                    if (aiIndicator) aiIndicator.style.display = 'none';
                }
            }

            console.log('[GPT-4o] ✅ Analysis:', analysis);

        } catch (error) {
            console.error('[GPT-4o] ❌ Failed:', error);
            const entryEl = document.querySelector(`[data-entry-id="${entry.id}"]`);
            const aiIndicator = entryEl?.querySelector('.ai-indicator');
            if (aiIndicator) aiIndicator.style.display = 'none';
        }
    }

    showAIAnalysis(entry) {
        const modalEl = document.getElementById('aiRecommendationModal');
        const bodyEl = document.getElementById('aiModalBody');
        const titleEl = document.getElementById('aiModalTitle');

        const categoryEmoji = {
            'question': '❓',
            'action_item': '✅',
            'decision': '🎯',
            'objection': '🚨',
            'agreement': '✓',
            'important': '⚠️'
        };

        const emoji = categoryEmoji[entry.category] || '🤖';

        titleEl.textContent = `${emoji} AI Analysis - ${entry.category}`;

        bodyEl.innerHTML = `
            <div class="ai-analysis-content">
                <div class="analysis-section">
                    <h4>📝 Transcript</h4>
                    <p class="transcript-quote">"${entry.text}"</p>
                </div>

                ${entry.sentiment ? `
                    <div class="analysis-section">
                        <h4>😊 Sentiment</h4>
                        <div class="sentiment-indicator ${entry.sentiment}">
                            ${entry.sentiment.charAt(0).toUpperCase() + entry.sentiment.slice(1)}
                        </div>
                    </div>
                ` : ''}

                ${entry.keyPoints && entry.keyPoints.length > 0 ? `
                    <div class="analysis-section">
                        <h4>💡 Key Points</h4>
                        <ul class="key-points-list">
                            ${entry.keyPoints.map(point => `<li>${point}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${entry.actionItems && entry.actionItems.length > 0 ? `
                    <div class="analysis-section">
                        <h4>✅ Action Items</h4>
                        <ul class="action-items-list">
                            ${entry.actionItems.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${entry.recommendation ? `
                    <div class="analysis-section">
                        <h4>🎯 AI Recommendation</h4>
                        <p class="recommendation-text">${entry.recommendation}</p>
                    </div>
                ` : ''}

                <div class="analysis-meta">
                    <span>Confidence: ${Math.round(entry.confidence * 100)}%</span>
                    <span>Urgency: ${entry.urgency || 'normal'}</span>
                    <span>Language: ${entry.language || 'en'}</span>
                </div>
            </div>
        `;

        document.getElementById('aiModalBackdrop').style.display = 'block';
        modalEl.style.display = 'block';
    }

    stopTranscription() {
        console.log('[AI TRANSCRIPTION] Stopping...');

        this.isRecording = false;

        if (this.transcriptionInterval) {
            clearInterval(this.transcriptionInterval);
            this.transcriptionInterval = null;
        }

        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }

        this.app.showCustomAlert('AI Transcription stopped', 'info');
        console.log('[AI TRANSCRIPTION] ✅ Stopped');
    }
}

// Export for use in main.js
window.AITranscription = AITranscription;
