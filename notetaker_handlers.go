package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

// OpenAI API structures are now defined in ai_analyzer.go
// OpenAIRequest includes Temperature and ResponseFormat
// MaxTokens is removed - use Temperature instead

// Notetaker API request/response structures
type AnalyzeRequest struct {
	Prompt     string `json:"prompt"`
	Text       string `json:"text"`
	RolePreset string `json:"rolePreset"`
}

type InsightsRequest struct {
	Transcript []TranscriptEntry `json:"transcript"`
	RolePreset string            `json:"rolePreset"`
}

type TranscriptEntry struct {
	ID        string   `json:"id"`
	Timestamp int64    `json:"timestamp"`
	Speaker   string   `json:"speaker"`
	Text      string   `json:"text"`
	Sentiment string   `json:"sentiment"`
	Keywords  []string `json:"keywords"`
	AIComment string   `json:"aiComment,omitempty"`
}

type ShareRequest struct {
	Transcript []TranscriptEntry          `json:"transcript"`
	Insights   map[string]interface{}     `json:"insights"`
	RolePreset string                     `json:"rolePreset"`
}

// OpenAI analyze endpoint
func handleOpenAIAnalyze(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse request
	var req AnalyzeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[OPENAI] ❌ Invalid request: %v", err)
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Check if OpenAI API key is configured
	if openAIAPIKey == "" {
		log.Printf("[OPENAI] ❌ No API key configured")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "OpenAI API key not configured",
		})
		return
	}

	log.Printf("[OPENAI] 🤖 Analyzing text (role: %s, length: %d)", req.RolePreset, len(req.Text))

	// Call OpenAI API
	analysis, err := callOpenAIForAnalysis(req.Prompt, req.Text)
	if err != nil {
		log.Printf("[OPENAI] ❌ API error: %v", err)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	log.Printf("[OPENAI] ✅ Analysis complete")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"analysis": analysis,
	})
}

// OpenAI insights endpoint
func handleOpenAIInsights(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse request
	var req InsightsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[OPENAI] ❌ Invalid request: %v", err)
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Check if OpenAI API key is configured
	if openAIAPIKey == "" {
		log.Printf("[OPENAI] ❌ No API key configured")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "OpenAI API key not configured",
		})
		return
	}

	log.Printf("[OPENAI] 🤖 Generating insights for transcript (entries: %d, role: %s)",
		len(req.Transcript), req.RolePreset)

	// Build transcript text
	var transcriptText string
	for _, entry := range req.Transcript {
		transcriptText += fmt.Sprintf("%s: %s\n", entry.Speaker, entry.Text)
	}

	// Build prompt for insights
	prompt := buildInsightsPrompt(transcriptText, req.RolePreset)

	// Call OpenAI API
	insights, err := callOpenAIForInsights(prompt, transcriptText)
	if err != nil {
		log.Printf("[OPENAI] ❌ API error: %v", err)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	log.Printf("[OPENAI] ✅ Insights generated")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"insights": insights,
	})
}

// Notetaker save endpoint (enhanced)
func handleNotetakerSave(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse request
	var req struct {
		Transcript []TranscriptEntry      `json:"transcript"`
		Insights   map[string]interface{} `json:"insights"`
		RolePreset string                 `json:"rolePreset"`
		Metadata   map[string]interface{} `json:"metadata"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[NOTETAKER] ❌ Invalid request: %v", err)
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Generate transcript ID
	transcriptID := uuid.NewString()

	// Store in Redis (7 days TTL)
	transcriptKey := fmt.Sprintf("transcript:%s", transcriptID)

	data := map[string]interface{}{
		"transcript": req.Transcript,
		"insights":   req.Insights,
		"rolePreset": req.RolePreset,
		"metadata":   req.Metadata,
		"createdAt":  time.Now().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(data)

	err := rdb.Set(ctx, transcriptKey, jsonData, 7*24*time.Hour).Err()
	if err != nil {
		log.Printf("[NOTETAKER] ❌ Failed to save: %v", err)
		http.Error(w, "Failed to save transcript", http.StatusInternalServerError)
		return
	}

	log.Printf("[NOTETAKER] ✅ Saved transcript: %s (entries: %d)", transcriptID, len(req.Transcript))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":      true,
		"transcriptId": transcriptID,
		"url":          fmt.Sprintf("/transcript/%s", transcriptID),
	})
}

// Create share link for transcript
func handleNotetakerShare(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse request
	var req ShareRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[NOTETAKER] ❌ Invalid share request: %v", err)
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Generate share ID
	shareID := uuid.NewString()

	// Store in Redis with 30 days TTL
	shareKey := fmt.Sprintf("share:transcript:%s", shareID)

	data := map[string]interface{}{
		"transcript": req.Transcript,
		"insights":   req.Insights,
		"rolePreset": req.RolePreset,
		"createdAt":  time.Now().Format(time.RFC3339),
		"sharedAt":   time.Now().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(data)

	err := rdb.Set(ctx, shareKey, jsonData, 30*24*time.Hour).Err()
	if err != nil {
		log.Printf("[NOTETAKER] ❌ Failed to create share link: %v", err)
		http.Error(w, "Failed to create share link", http.StatusInternalServerError)
		return
	}

	// Build share URL
	protocol := "http"
	if r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" {
		protocol = "https"
	}

	host := r.Host
	shareURL := fmt.Sprintf("%s://%s/shared-transcript/%s", protocol, host, shareID)

	log.Printf("[NOTETAKER] ✅ Created share link: %s", shareID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"shareId":  shareID,
		"shareUrl": shareURL,
	})
}

// View shared transcript
func handleSharedTranscript(w http.ResponseWriter, r *http.Request) {
	// Extract share ID from path
	shareID := strings.TrimPrefix(r.URL.Path, "/shared-transcript/")

	if shareID == "" {
		http.Error(w, "Invalid share link", http.StatusBadRequest)
		return
	}

	// Get from Redis
	shareKey := fmt.Sprintf("share:transcript:%s", shareID)

	jsonData, err := rdb.Get(ctx, shareKey).Result()
	if err != nil {
		log.Printf("[NOTETAKER] ❌ Share link not found: %s", shareID)
		http.Error(w, "Transcript not found or expired", http.StatusNotFound)
		return
	}

	var data map[string]interface{}
	json.Unmarshal([]byte(jsonData), &data)

	log.Printf("[NOTETAKER] 📖 Viewing shared transcript: %s", shareID)

	// Serve HTML page with embedded transcript data
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprintf(w, `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shared Transcript - Kaminskyi Messenger</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
        }
        h1 {
            color: #1f2937;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .meta {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f3f4f6;
        }
        .entry {
            margin-bottom: 20px;
            padding: 15px;
            border-left: 4px solid #6366f1;
            background: #f9fafb;
            border-radius: 8px;
        }
        .speaker {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 5px;
        }
        .text {
            color: #4b5563;
            line-height: 1.6;
        }
        .ai-comment {
            margin-top: 10px;
            padding: 10px;
            background: #eff6ff;
            border-radius: 6px;
            color: #1e40af;
            font-size: 14px;
        }
        .insights {
            margin-top: 40px;
            padding: 30px;
            background: #f0fdf4;
            border-radius: 12px;
            border: 2px solid #86efac;
        }
        .insights h2 {
            color: #166534;
            margin-bottom: 20px;
        }
        .insights-section {
            margin-bottom: 20px;
        }
        .insights-section h3 {
            color: #15803d;
            font-size: 16px;
            margin-bottom: 10px;
        }
        .insights-section ul {
            list-style-position: inside;
            color: #166534;
        }
        .insights-section li {
            margin-bottom: 8px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #f3f4f6;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📝 Shared Transcript</h1>
        <div class="meta">
            <div>Role: <strong>%s</strong></div>
            <div>Shared: <strong>%s</strong></div>
            <div>Entries: <strong>%d</strong></div>
        </div>

        <div id="transcript"></div>
        <div id="insights"></div>

        <div class="footer">
            Generated by Kaminskyi AI Messenger • This link will expire in 30 days
        </div>
    </div>

    <script>
        const data = %s;

        // Render transcript
        const transcriptDiv = document.getElementById('transcript');
        data.transcript.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'entry';
            entryDiv.innerHTML = '' +
                '<div class="speaker">' + escapeHtml(entry.speaker) + '</div>' +
                '<div class="text">' + escapeHtml(entry.text) + '</div>' +
                (entry.aiComment ? '<div class="ai-comment">💡 ' + escapeHtml(entry.aiComment) + '</div>' : '');
            transcriptDiv.appendChild(entryDiv);
        });

        // Render insights if available
        if (data.insights) {
            const insightsDiv = document.getElementById('insights');
            insightsDiv.className = 'insights';
            let html = '<h2>🤖 AI Insights</h2>';

            if (data.insights.summary) {
                html += '<div class="insights-section"><h3>Summary</h3><p>' + escapeHtml(data.insights.summary) + '</p></div>';
            }

            if (data.insights.keyPoints && data.insights.keyPoints.length > 0) {
                html += '<div class="insights-section"><h3>Key Points</h3><ul>';
                data.insights.keyPoints.forEach(point => {
                    html += '<li>' + escapeHtml(point) + '</li>';
                });
                html += '</ul></div>';
            }

            if (data.insights.actionItems && data.insights.actionItems.length > 0) {
                html += '<div class="insights-section"><h3>Action Items</h3><ul>';
                data.insights.actionItems.forEach(item => {
                    html += '<li>' + escapeHtml(item) + '</li>';
                });
                html += '</ul></div>';
            }

            insightsDiv.innerHTML = html;
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>`,
		data["rolePreset"],
		data["sharedAt"],
		len(data["transcript"].([]interface{})),
		jsonData)
}

// Helper: Call OpenAI API for analysis
func callOpenAIForAnalysis(prompt, text string) (map[string]interface{}, error) {
	reqBody := OpenAIRequest{
		Model: "gpt-4o",
		Messages: []OpenAIMessage{
			{Role: "system", Content: "You are an AI assistant analyzing conversation transcripts. Respond only with valid JSON."},
			{Role: "user", Content: prompt},
		},
		Temperature: 0.7,
		ResponseFormat: map[string]string{"type": "json_object"},
	}

	jsonBody, _ := json.Marshal(reqBody)

	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+openAIAPIKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OpenAI API error (%d): %s", resp.StatusCode, string(body))
	}

	var openAIResp OpenAIResponse
	if err := json.NewDecoder(resp.Body).Decode(&openAIResp); err != nil {
		return nil, err
	}

	if len(openAIResp.Choices) == 0 {
		return nil, fmt.Errorf("no response from OpenAI")
	}

	// Parse JSON response
	var analysis map[string]interface{}
	if err := json.Unmarshal([]byte(openAIResp.Choices[0].Message.Content), &analysis); err != nil {
		return nil, fmt.Errorf("failed to parse OpenAI response: %v", err)
	}

	return analysis, nil
}

// Helper: Call OpenAI API for insights
func callOpenAIForInsights(prompt, transcriptText string) (map[string]interface{}, error) {
	reqBody := OpenAIRequest{
		Model: "gpt-4o",
		Messages: []OpenAIMessage{
			{Role: "system", Content: "You are an AI assistant providing insights on conversation transcripts. Respond only with valid JSON."},
			{Role: "user", Content: prompt},
		},
		Temperature: 0.7,
		ResponseFormat: map[string]string{"type": "json_object"},
	}

	jsonBody, _ := json.Marshal(reqBody)

	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+openAIAPIKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OpenAI API error (%d): %s", resp.StatusCode, string(body))
	}

	var openAIResp OpenAIResponse
	if err := json.NewDecoder(resp.Body).Decode(&openAIResp); err != nil {
		return nil, err
	}

	if len(openAIResp.Choices) == 0 {
		return nil, fmt.Errorf("no response from OpenAI")
	}

	// Parse JSON response
	var insights map[string]interface{}
	if err := json.Unmarshal([]byte(openAIResp.Choices[0].Message.Content), &insights); err != nil {
		return nil, fmt.Errorf("failed to parse OpenAI response: %v", err)
	}

	return insights, nil
}

// Helper: Build insights prompt
func buildInsightsPrompt(transcriptText, rolePreset string) string {
	basePrompt := `Analyze the following conversation transcript and provide comprehensive insights.

Transcript:
%s

Provide a JSON response with the following structure:
{
    "summary": "Brief summary of the conversation (2-3 sentences)",
    "keyPoints": ["Key point 1", "Key point 2", ...],
    "actionItems": ["Action item 1", "Action item 2", ...],
    "questions": ["Question 1", "Question 2", ...],
    "overallSentiment": "Description of overall sentiment",
    "sentimentDistribution": {
        "positive": 30,
        "negative": 10,
        "question": 20,
        "action": 25,
        "neutral": 15
    },
    "recommendations": ["Recommendation 1", "Recommendation 2", ...]
}`

	return fmt.Sprintf(basePrompt, transcriptText)
}
