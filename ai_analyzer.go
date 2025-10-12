package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

// OpenAI GPT-4o Integration for Real-time Meeting Analysis

type OpenAIRequest struct {
	Model            string                   `json:"model"`
	Messages         []OpenAIMessage          `json:"messages"`
	Temperature      float64                  `json:"temperature"`
	ResponseFormat   map[string]string        `json:"response_format,omitempty"`
}

type OpenAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenAIResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

// Analyze statement with GPT-4o
func analyzeStatementWithGPT4o(req TranscriptAnalysisRequest) (*AIAnalysisResponse, error) {
	openAIKey := os.Getenv("OPENAI_API_KEY")
	if openAIKey == "" {
		log.Printf("[AI] Warning: OPENAI_API_KEY not set, using fallback")
		return analyzeWithKeywords(req.Text)
	}

	// Build prompt for GPT-4o
	prompt := fmt.Sprintf(`You are an AI meeting assistant analyzing a 1-on-1 professional conversation in real-time.

Speaker: %s
Statement: "%s"

Analyze this statement and respond in JSON format ONLY:
{
  "category": "objection|pricing|agreement|question|general",
  "color": "#hexcolor",
  "urgency": "high|medium|low",
  "recommendation": "Brief tactical advice for the host",
  "suggested_responses": ["response 1", "response 2", "response 3"]
}

Categories:
- objection: Negative response, concern, pushback, doubt
- pricing: Cost, budget, money, expensive, cheap
- agreement: Positive affirmation, yes, commitment
- question: Asking for clarification or information
- general: Neutral conversation

Colors:
- objection: #f45c43 (red)
- pricing: #ffa502 (orange)
- agreement: #38ef7d (green)
- question: #4facfe (blue)
- general: #667eea (purple)

Urgency rules:
- high: Objections, pricing concerns, urgent questions
- medium: Regular questions, important points
- low: Agreements, general conversation

Keep advice concise (1-2 sentences) and actionable.
Suggested responses should be natural, professional, and ready to use.`, req.Speaker, req.Text)

	// Create OpenAI request
	openAIReq := OpenAIRequest{
		Model: "gpt-4o",
		Messages: []OpenAIMessage{
			{
				Role:    "system",
				Content: "You are an expert sales and communication coach providing real-time tactical guidance during professional meetings. Always respond with valid JSON.",
			},
			{
				Role:    "user",
				Content: prompt,
			},
		},
		Temperature: 0.7,
		ResponseFormat: map[string]string{
			"type": "json_object",
		},
	}

	jsonBody, err := json.Marshal(openAIReq)
	if err != nil {
		return analyzeWithKeywords(req.Text)
	}

	// Call OpenAI API
	apiReq, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions",
		bytes.NewBuffer(jsonBody))
	if err != nil {
		return analyzeWithKeywords(req.Text)
	}

	apiReq.Header.Set("Content-Type", "application/json")
	apiReq.Header.Set("Authorization", "Bearer "+openAIKey)

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(apiReq)
	if err != nil {
		log.Printf("[AI] OpenAI API error: %v", err)
		return analyzeWithKeywords(req.Text)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("[AI] OpenAI API error %d: %s", resp.StatusCode, string(body))
		return analyzeWithKeywords(req.Text)
	}

	// Parse response
	var openAIResp OpenAIResponse
	if err := json.NewDecoder(resp.Body).Decode(&openAIResp); err != nil {
		log.Printf("[AI] Failed to decode OpenAI response: %v", err)
		return analyzeWithKeywords(req.Text)
	}

	if len(openAIResp.Choices) == 0 {
		return analyzeWithKeywords(req.Text)
	}

	// Parse AI analysis
	var analysis AIAnalysisResponse
	content := openAIResp.Choices[0].Message.Content
	if err := json.Unmarshal([]byte(content), &analysis); err != nil {
		log.Printf("[AI] Failed to parse GPT-4o response: %v\nContent: %s", err, content)
		return analyzeWithKeywords(req.Text)
	}

	log.Printf("[AI] ✅ GPT-4o: category=%s, urgency=%s", analysis.Category, analysis.Urgency)
	return &analysis, nil
}

// Fallback keyword-based analysis (when GPT-4o unavailable)
func analyzeWithKeywords(text string) (*AIAnalysisResponse, error) {
	textLower := strings.ToLower(text)
	var category, color, urgency string
	var suggestions []string

	// Detect category by keywords
	if containsAnyKeyword(textLower, []string{"price", "expensive", "cost", "cheap", "budget", "afford", "money", "pay"}) {
		category = "pricing"
		color = "#ffa502"
		urgency = "high"
		suggestions = []string{
			"Let's break down the value and ROI you'll receive",
			"What if we explore a phased payment approach?",
			"I can show you how other clients justified the investment",
		}
	} else if containsAnyKeyword(textLower, []string{"no", "not", "can't", "won't", "don't", "concern", "worried", "problem", "issue"}) {
		category = "objection"
		color = "#f45c43"
		urgency = "high"
		suggestions = []string{
			"I understand your concern. Many clients felt the same way initially...",
			"That's a valid point. Let me address that specifically",
			"What if we could solve that concern? Would you be interested?",
		}
	} else if containsAnyKeyword(textLower, []string{"yes", "agree", "sounds good", "let's do", "ok", "perfect", "great"}) {
		category = "agreement"
		color = "#38ef7d"
		urgency = "low"
		suggestions = []string{
			"Excellent! Let's move forward with the next steps",
			"Great! I'll prepare the agreement for you",
			"Perfect! When would you like to get started?",
		}
	} else if strings.Contains(textLower, "?") || containsAnyKeyword(textLower, []string{"how", "what", "why", "when", "where", "which"}) {
		category = "question"
		color = "#4facfe"
		urgency = "medium"
		suggestions = []string{
			"Let me clarify that for you...",
			"Great question! Here's what I mean",
			"I'm glad you asked. The answer is...",
		}
	} else {
		category = "general"
		color = "#667eea"
		urgency = "low"
		suggestions = []string{}
	}

	recommendation := generateRecommendation(category, textLower)

	return &AIAnalysisResponse{
		Category:           category,
		Color:              color,
		Recommendation:     recommendation,
		Urgency:            urgency,
		SuggestedResponses: suggestions,
	}, nil
}

func generateRecommendation(category, text string) string {
	recommendations := map[string]string{
		"objection": "The client has expressed a concern. Acknowledge their feelings, provide a specific solution, and reframe the conversation toward benefits.",
		"pricing":   "Price sensitivity detected. Focus on value and ROI rather than cost. Offer flexible payment options if possible.",
		"agreement": "Positive signal! Reinforce their decision and move quickly to next steps before they reconsider.",
		"question":  "Clarification needed. Answer directly and thoroughly, then check if they need more information.",
		"general":   "Continue building rapport and guiding the conversation toward your objective.",
	}

	if rec, ok := recommendations[category]; ok {
		return rec
	}
	return "Listen actively and respond thoughtfully to build trust."
}

func containsAnyKeyword(text string, keywords []string) bool {
	for _, keyword := range keywords {
		if strings.Contains(text, keyword) {
			return true
		}
	}
	return false
}
