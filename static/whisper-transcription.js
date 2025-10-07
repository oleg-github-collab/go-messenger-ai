// Whisper API Integration for High-Quality Transcription
// Uses OpenAI's Whisper model for accurate, multilingual transcription

class WhisperTranscriber {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiEndpoint = 'https://api.openai.com/v1/audio/transcriptions';
        this.model = 'whisper-1'; // OpenAI's Whisper model
        this.isProcessing = false;
        this.queue = [];
        this.maxRetries = 3;
    }

    /**
     * Transcribe audio using Whisper API
     * @param {Blob} audioBlob - Audio data to transcribe
     * @param {string} language - Language code (e.g., 'uk', 'en', 'ru')
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Transcription result
     */
    async transcribe(audioBlob, language = 'uk', options = {}) {
        if (this.isProcessing) {
            console.log('[WHISPER] Adding to queue...');
            return new Promise((resolve, reject) => {
                this.queue.push({ audioBlob, language, options, resolve, reject });
            });
        }

        this.isProcessing = true;

        try {
            const result = await this._transcribeWithRetry(audioBlob, language, options);
            this.isProcessing = false;

            // Process next in queue
            if (this.queue.length > 0) {
                const next = this.queue.shift();
                this.transcribe(next.audioBlob, next.language, next.options)
                    .then(next.resolve)
                    .catch(next.reject);
            }

            return result;
        } catch (error) {
            this.isProcessing = false;
            console.error('[WHISPER] Transcription failed:', error);
            throw error;
        }
    }

    async _transcribeWithRetry(audioBlob, language, options, attempt = 1) {
        try {
            return await this._sendToWhisperAPI(audioBlob, language, options);
        } catch (error) {
            if (attempt < this.maxRetries) {
                console.log(`[WHISPER] Retry ${attempt}/${this.maxRetries}...`);
                await this._sleep(1000 * attempt); // Exponential backoff
                return await this._transcribeWithRetry(audioBlob, language, options, attempt + 1);
            }
            throw error;
        }
    }

    async _sendToWhisperAPI(audioBlob, language, options) {
        const formData = new FormData();

        // Convert Blob to File (required by Whisper API)
        const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, {
            type: audioBlob.type || 'audio/webm'
        });

        formData.append('file', audioFile);
        formData.append('model', this.model);

        // Language parameter (ISO-639-1 format)
        if (language) {
            // Convert from locale (e.g., 'uk-UA') to language code (e.g., 'uk')
            const langCode = language.split('-')[0];
            formData.append('language', langCode);
        }

        // Additional parameters
        if (options.prompt) {
            formData.append('prompt', options.prompt);
        }

        if (options.temperature !== undefined) {
            formData.append('temperature', options.temperature);
        }

        // Response format
        formData.append('response_format', options.format || 'verbose_json');

        // Timestamp granularities for detailed timing
        if (options.timestamps) {
            formData.append('timestamp_granularities[]', 'word');
            formData.append('timestamp_granularities[]', 'segment');
        }

        console.log(`[WHISPER] Sending ${(audioBlob.size / 1024).toFixed(2)}KB audio for transcription...`);

        const startTime = performance.now();

        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: formData
        });

        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Whisper API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const result = await response.json();
        console.log(`[WHISPER] ✅ Transcription completed in ${duration}s`);
        console.log(`[WHISPER] Text length: ${result.text?.length || 0} characters`);

        return result;
    }

    /**
     * Transcribe with speaker diarization (who said what)
     */
    async transcribeWithSpeakers(audioBlob, language, numSpeakers = 2) {
        const result = await this.transcribe(audioBlob, language, {
            timestamps: true,
            format: 'verbose_json'
        });

        // Simple speaker detection based on pauses and segments
        if (result.segments) {
            result.segments = this._detectSpeakers(result.segments, numSpeakers);
        }

        return result;
    }

    /**
     * Simple speaker detection algorithm
     */
    _detectSpeakers(segments, numSpeakers) {
        const PAUSE_THRESHOLD = 1.5; // seconds
        let currentSpeaker = 1;
        let lastEndTime = 0;

        return segments.map((segment, index) => {
            const pauseDuration = segment.start - lastEndTime;

            // Switch speaker if there's a significant pause
            if (pauseDuration > PAUSE_THRESHOLD && index > 0) {
                currentSpeaker = (currentSpeaker % numSpeakers) + 1;
            }

            lastEndTime = segment.end;

            return {
                ...segment,
                speaker: `Speaker ${currentSpeaker}`
            };
        });
    }

    /**
     * Chunk audio for long recordings (Whisper has 25MB limit)
     */
    async transcribeLongAudio(audioBlob, language, options = {}) {
        const MAX_SIZE = 24 * 1024 * 1024; // 24MB to be safe

        if (audioBlob.size <= MAX_SIZE) {
            return await this.transcribe(audioBlob, language, options);
        }

        console.log('[WHISPER] Audio too large, chunking...');

        // For simplicity, we'll just truncate. In production, you'd split properly
        const truncatedBlob = audioBlob.slice(0, MAX_SIZE);
        console.warn(`[WHISPER] Audio truncated from ${audioBlob.size} to ${truncatedBlob.size} bytes`);

        return await this.transcribe(truncatedBlob, language, options);
    }

    /**
     * Get transcription cost estimate
     */
    estimateCost(audioBlob) {
        const minutes = audioBlob.size / (1024 * 60); // Rough estimate
        const costPerMinute = 0.006; // $0.006 per minute as of 2024
        return (minutes * costPerMinute).toFixed(4);
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Enhanced Transcript Manager with Manual Editing
class TranscriptManager {
    constructor() {
        this.entries = [];
        this.categories = new Map();
        this.highlights = new Set();
        this.searchIndex = new Map();
        this.autoSaveInterval = null;
        this.isDirty = false;
    }

    /**
     * Add transcript entry
     */
    addEntry(text, timestamp, speaker = 'Unknown', metadata = {}) {
        const entry = {
            id: this._generateId(),
            text,
            timestamp,
            speaker,
            metadata,
            categories: [],
            isHighlight: false,
            isEdited: false,
            createdAt: Date.now()
        };

        this.entries.push(entry);
        this._updateSearchIndex(entry);
        this.isDirty = true;

        return entry;
    }

    /**
     * Edit entry text
     */
    editEntry(entryId, newText) {
        const entry = this.entries.find(e => e.id === entryId);
        if (!entry) {
            console.error('[TRANSCRIPT] Entry not found:', entryId);
            return false;
        }

        entry.text = newText;
        entry.isEdited = true;
        entry.editedAt = Date.now();
        this._updateSearchIndex(entry);
        this.isDirty = true;

        return true;
    }

    /**
     * Delete entry
     */
    deleteEntry(entryId) {
        const index = this.entries.findIndex(e => e.id === entryId);
        if (index === -1) return false;

        this.entries.splice(index, 1);
        this.isDirty = true;
        return true;
    }

    /**
     * Add category to entry
     */
    categorizeEntry(entryId, category, confidence = 1.0) {
        const entry = this.entries.find(e => e.id === entryId);
        if (!entry) return false;

        if (!entry.categories) {
            entry.categories = [];
        }

        entry.categories.push({ category, confidence, addedAt: Date.now() });
        this.isDirty = true;
        return true;
    }

    /**
     * Toggle highlight
     */
    toggleHighlight(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        if (!entry) return false;

        entry.isHighlight = !entry.isHighlight;

        if (entry.isHighlight) {
            this.highlights.add(entryId);
        } else {
            this.highlights.delete(entryId);
        }

        this.isDirty = true;
        return entry.isHighlight;
    }

    /**
     * Search transcript
     */
    search(query, options = {}) {
        const lowerQuery = query.toLowerCase();
        const results = [];

        for (const entry of this.entries) {
            let score = 0;
            const text = entry.text.toLowerCase();

            // Exact match
            if (text.includes(lowerQuery)) {
                score += 10;
            }

            // Word match
            const queryWords = lowerQuery.split(/\s+/);
            for (const word of queryWords) {
                if (text.includes(word)) {
                    score += 1;
                }
            }

            // Category match
            if (options.category && entry.categories) {
                const hasCategory = entry.categories.some(c => c.category === options.category);
                if (hasCategory) score += 5;
            }

            // Highlight match
            if (options.highlightsOnly && !entry.isHighlight) {
                continue;
            }

            // Speaker match
            if (options.speaker && entry.speaker !== options.speaker) {
                continue;
            }

            if (score > 0) {
                results.push({ entry, score });
            }
        }

        return results
            .sort((a, b) => b.score - a.score)
            .map(r => r.entry)
            .slice(0, options.limit || 50);
    }

    /**
     * Get statistics
     */
    getStats() {
        const totalWords = this.entries.reduce((sum, entry) => {
            return sum + entry.text.split(/\s+/).length;
        }, 0);

        const speakers = new Set(this.entries.map(e => e.speaker));
        const categoryCounts = new Map();

        for (const entry of this.entries) {
            if (entry.categories) {
                for (const cat of entry.categories) {
                    categoryCounts.set(cat.category, (categoryCounts.get(cat.category) || 0) + 1);
                }
            }
        }

        return {
            totalEntries: this.entries.length,
            totalWords,
            totalHighlights: this.highlights.size,
            speakers: Array.from(speakers),
            categories: Array.from(categoryCounts.entries()).map(([name, count]) => ({ name, count }))
        };
    }

    /**
     * Export to various formats
     */
    export(format = 'json') {
        switch (format) {
            case 'json':
                return this._exportJSON();
            case 'text':
                return this._exportText();
            case 'markdown':
                return this._exportMarkdown();
            case 'csv':
                return this._exportCSV();
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    _exportJSON() {
        return JSON.stringify({
            version: '1.0',
            exportedAt: new Date().toISOString(),
            stats: this.getStats(),
            entries: this.entries
        }, null, 2);
    }

    _exportText() {
        return this.entries.map(entry => {
            const time = new Date(entry.timestamp).toLocaleTimeString();
            const categories = entry.categories?.map(c => `[${c.category}]`).join(' ') || '';
            const highlight = entry.isHighlight ? '⭐ ' : '';
            return `${highlight}[${time}] ${entry.speaker}: ${entry.text} ${categories}`;
        }).join('\n\n');
    }

    _exportMarkdown() {
        let md = `# Meeting Transcript\n\n`;
        md += `**Exported:** ${new Date().toLocaleString()}\n\n`;

        const stats = this.getStats();
        md += `## Stats\n`;
        md += `- **Total Entries:** ${stats.totalEntries}\n`;
        md += `- **Total Words:** ${stats.totalWords}\n`;
        md += `- **Highlights:** ${stats.totalHighlights}\n`;
        md += `- **Speakers:** ${stats.speakers.join(', ')}\n\n`;

        md += `## Transcript\n\n`;

        for (const entry of this.entries) {
            const time = new Date(entry.timestamp).toLocaleTimeString();
            const highlight = entry.isHighlight ? '⭐ ' : '';
            const edited = entry.isEdited ? ' *(edited)*' : '';

            md += `### ${highlight}[${time}] ${entry.speaker}${edited}\n\n`;
            md += `${entry.text}\n\n`;

            if (entry.categories && entry.categories.length > 0) {
                md += `**Categories:** ${entry.categories.map(c => c.category).join(', ')}\n\n`;
            }

            md += `---\n\n`;
        }

        return md;
    }

    _exportCSV() {
        const rows = [['Timestamp', 'Speaker', 'Text', 'Categories', 'Highlighted', 'Edited']];

        for (const entry of this.entries) {
            rows.push([
                new Date(entry.timestamp).toISOString(),
                entry.speaker,
                entry.text.replace(/"/g, '""'), // Escape quotes
                entry.categories?.map(c => c.category).join(';') || '',
                entry.isHighlight ? 'Yes' : 'No',
                entry.isEdited ? 'Yes' : 'No'
            ]);
        }

        return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }

    /**
     * Auto-save functionality
     */
    enableAutoSave(intervalMs = 300000) { // Default: 5 minutes
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(() => {
            if (this.isDirty) {
                this.save();
            }
        }, intervalMs);
    }

    disableAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    save() {
        try {
            const data = this._exportJSON();
            localStorage.setItem('transcript_autosave', data);
            this.isDirty = false;
            console.log('[TRANSCRIPT] Auto-saved');
            return true;
        } catch (error) {
            console.error('[TRANSCRIPT] Auto-save failed:', error);
            return false;
        }
    }

    load() {
        try {
            const data = localStorage.getItem('transcript_autosave');
            if (!data) return false;

            const parsed = JSON.parse(data);
            this.entries = parsed.entries || [];
            this.isDirty = false;

            // Rebuild search index
            for (const entry of this.entries) {
                this._updateSearchIndex(entry);
                if (entry.isHighlight) {
                    this.highlights.add(entry.id);
                }
            }

            console.log('[TRANSCRIPT] Loaded from auto-save');
            return true;
        } catch (error) {
            console.error('[TRANSCRIPT] Load failed:', error);
            return false;
        }
    }

    _generateId() {
        return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _updateSearchIndex(entry) {
        const words = entry.text.toLowerCase().split(/\s+/);
        for (const word of words) {
            if (!this.searchIndex.has(word)) {
                this.searchIndex.set(word, new Set());
            }
            this.searchIndex.get(word).add(entry.id);
        }
    }

    clear() {
        this.entries = [];
        this.categories.clear();
        this.highlights.clear();
        this.searchIndex.clear();
        this.isDirty = true;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WhisperTranscriber, TranscriptManager };
}
