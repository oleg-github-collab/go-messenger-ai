package transcript

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"messenger/internal/models"
)

// generateInsights uses GPT-4o to analyze transcript and generate insights
func (p *Processor) generateInsights(segments []models.TranscriptSegment) (*models.TranscriptInsights, error) {
	if p.openAIKey == "" {
		return nil, fmt.Errorf("OPENAI_API_KEY not set")
	}

	// Build full transcript text
	transcriptText := buildTranscriptText(segments)

	// Create prompt for GPT-4o
	systemPrompt := `You are an expert meeting analyst. Analyze the transcript and provide comprehensive insights in JSON format.

Focus on:
1. Executive summary (2-3 sentences)
2. Key discussion points (5-8 items)
3. Action items with timestamps (if mentioned)
4. Important decisions made
5. Key moments (timestamps of important discussions)
6. Main topics discussed
7. Overall sentiment
8. Open questions

Be specific and reference timestamps when relevant.`

	userPrompt := fmt.Sprintf(`Analyze this meeting transcript and provide insights:

%s

Provide your analysis in this exact JSON format:
{
  "summary": "string",
  "key_points": ["string"],
  "action_items": [{"text": "string", "timestamp": number, "assignee": "string or null", "priority": "high|medium|low"}],
  "decisions": ["string"],
  "key_moments": [{"timestamp": number, "description": "string", "type": "decision|question|insight|action"}],
  "topics": ["string"],
  "sentiment": "positive|neutral|negative",
  "questions": ["string"]
}`, transcriptText)

	// Call GPT-4o
	url := "https://api.openai.com/v1/chat/completions"

	reqBody := map[string]interface{}{
		"model": "gpt-4o",
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": systemPrompt,
			},
			{
				"role":    "user",
				"content": userPrompt,
			},
		},
		"temperature":     0.7,
		"response_format": map[string]string{"type": "json_object"},
	}

	bodyJSON, _ := json.Marshal(reqBody)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(bodyJSON))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.openAIKey)

	log.Printf("[TRANSCRIPT] 🤖 Analyzing with GPT-4o...")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GPT-4o API error %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	if len(result.Choices) == 0 {
		return nil, fmt.Errorf("no response from GPT-4o")
	}

	// Parse the JSON response
	var insightsData struct {
		Summary   string   `json:"summary"`
		KeyPoints []string `json:"key_points"`
		ActionItems []struct {
			Text      string  `json:"text"`
			Timestamp float64 `json:"timestamp"`
			Assignee  string  `json:"assignee"`
			Priority  string  `json:"priority"`
		} `json:"action_items"`
		Decisions  []string `json:"decisions"`
		KeyMoments []struct {
			Timestamp   float64 `json:"timestamp"`
			Description string  `json:"description"`
			Type        string  `json:"type"`
		} `json:"key_moments"`
		Topics    []string `json:"topics"`
		Sentiment string   `json:"sentiment"`
		Questions []string `json:"questions"`
	}

	if err := json.Unmarshal([]byte(result.Choices[0].Message.Content), &insightsData); err != nil {
		return nil, fmt.Errorf("failed to parse GPT response: %w", err)
	}

	// Convert to our format
	actionItems := make([]models.ActionItem, len(insightsData.ActionItems))
	for i, item := range insightsData.ActionItems {
		actionItems[i] = models.ActionItem{
			Text:      item.Text,
			Timestamp: item.Timestamp,
			Assignee:  item.Assignee,
			Priority:  item.Priority,
		}
	}

	keyMoments := make([]models.KeyMoment, len(insightsData.KeyMoments))
	for i, moment := range insightsData.KeyMoments {
		keyMoments[i] = models.KeyMoment{
			Timestamp:   moment.Timestamp,
			Description: moment.Description,
			Type:        moment.Type,
		}
	}

	insights := &models.TranscriptInsights{
		Summary:     insightsData.Summary,
		KeyPoints:   insightsData.KeyPoints,
		ActionItems: actionItems,
		KeyMoments:  keyMoments,
		Topics:      insightsData.Topics,
		Sentiment:   insightsData.Sentiment,
		Decisions:   insightsData.Decisions,
		Questions:   insightsData.Questions,
	}

	log.Printf("[TRANSCRIPT] ✅ Generated insights: %d key points, %d action items",
		len(insights.KeyPoints), len(insights.ActionItems))

	return insights, nil
}

// buildTranscriptText creates a formatted text version of the transcript
func buildTranscriptText(segments []models.TranscriptSegment) string {
	var builder strings.Builder

	for _, seg := range segments {
		timestamp := formatTimestamp(seg.Start)
		builder.WriteString(fmt.Sprintf("[%s] %s: %s\n\n", timestamp, seg.Speaker, seg.Text))
	}

	return builder.String()
}

// formatTimestamp converts seconds to MM:SS format
func formatTimestamp(seconds float64) string {
	minutes := int(seconds) / 60
	secs := int(seconds) % 60
	return fmt.Sprintf("%02d:%02d", minutes, secs)
}

// AnalyzeWithRolePreset generates insights with role-specific focus
func (p *Processor) AnalyzeWithRolePreset(segments []models.TranscriptSegment, rolePreset string) (*models.TranscriptInsights, error) {
	if p.openAIKey == "" {
		return nil, fmt.Errorf("OPENAI_API_KEY not set")
	}

	transcriptText := buildTranscriptText(segments)

	// Role-specific prompts
	var systemPrompt, analysisInstructions string

	switch rolePreset {
	case "language-teacher":
		systemPrompt = "You are an expert language teacher and linguist. Analyze this conversation focusing on language learning aspects."
		analysisInstructions = `Focus on:
1. Grammar patterns and structures used
2. Vocabulary breadth and new words introduced
3. Common errors and mistakes to correct
4. Pronunciation notes (if audio cues mentioned)
5. Recommended areas for improvement`

	case "therapist":
		systemPrompt = "You are a professional therapist and counselor. Analyze this conversation focusing on emotional and psychological aspects."
		analysisInstructions = `Focus on:
1. Emotional states and patterns observed
2. Key therapeutic insights and breakthroughs
3. Coping mechanisms discussed
4. Relationship dynamics
5. Recommended follow-up topics`

	case "business-coach":
		systemPrompt = "You are an experienced business coach. Analyze this conversation focusing on business and professional development."
		analysisInstructions = `Focus on:
1. Business challenges and opportunities
2. Strategic decisions and action items
3. KPIs discussed
4. Risk factors and mitigation
5. Leadership insights`

	default:
		// Use default general analysis
		return p.generateInsights(segments)
	}

	userPrompt := fmt.Sprintf(`%s

Transcript:
%s

Provide analysis in JSON format with: summary, key_points, action_items, decisions, key_moments, topics, sentiment, questions`, analysisInstructions, transcriptText)

	// Call GPT-4o with role-specific prompt
	url := "https://api.openai.com/v1/chat/completions"

	reqBody := map[string]interface{}{
		"model": "gpt-4o",
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": userPrompt},
		},
		"temperature":     0.7,
		"response_format": map[string]string{"type": "json_object"},
	}

	bodyJSON, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(bodyJSON))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.openAIKey)

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GPT-4o error %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	json.NewDecoder(resp.Body).Decode(&result)

	// Parse and return insights (same format as generateInsights)
	var insightsData struct {
		Summary     string                   `json:"summary"`
		KeyPoints   []string                 `json:"key_points"`
		ActionItems []models.ActionItem      `json:"action_items"`
		KeyMoments  []models.KeyMoment       `json:"key_moments"`
		Topics      []string                 `json:"topics"`
		Sentiment   string                   `json:"sentiment"`
		Decisions   []string                 `json:"decisions"`
		Questions   []string                 `json:"questions"`
	}

	json.Unmarshal([]byte(result.Choices[0].Message.Content), &insightsData)

	return &models.TranscriptInsights{
		Summary:     insightsData.Summary,
		KeyPoints:   insightsData.KeyPoints,
		ActionItems: insightsData.ActionItems,
		KeyMoments:  insightsData.KeyMoments,
		Topics:      insightsData.Topics,
		Sentiment:   insightsData.Sentiment,
		Decisions:   insightsData.Decisions,
		Questions:   insightsData.Questions,
	}, nil
}
