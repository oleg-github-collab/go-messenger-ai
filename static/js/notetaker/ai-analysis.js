/**
 * Notetaker AI Analysis - Sentiment detection, keyword extraction, and AI commenting
 * @module notetaker/ai-analysis
 */

import { Logger } from '../core/logger.js';
import { globalEvents } from '../core/events.js';

const logger = new Logger('NOTETAKER:AI');

export class AIAnalyzer {
    constructor(config = {}) {
        this.rolePreset = config.rolePreset || '';
        this.language = config.language || 'en-US';

        // Keyword patterns for different sentiments and categories
        this.patterns = this.initializePatterns();

        // Role-specific configurations
        this.roleConfigs = this.initializeRoleConfigs();

        logger.log('AI Analyzer initialized', { role: this.rolePreset, language: this.language });
    }

    /**
     * Initialize keyword patterns for sentiment and category detection
     */
    initializePatterns() {
        return {
            // Sentiment patterns
            positive: [
                /\b(agree|yes|exactly|correct|great|excellent|perfect|love|amazing|wonderful|fantastic)\b/i,
                /\b(thank you|thanks|appreciate|helpful|good idea|sounds good)\b/i,
                /\b(успішно|чудово|відмінно|дякую|так|згоден|правильно)\b/i
            ],
            negative: [
                /\b(no|disagree|wrong|incorrect|bad|terrible|problem|issue|concern|worry)\b/i,
                /\b(don't|can't|won't|shouldn't|impossible|difficult|hard)\b/i,
                /\b(ні|неправильно|погано|проблема|не згоден|важко)\b/i
            ],
            question: [
                /\?$/,
                /\b(what|when|where|why|how|who|which|can you|could you|would you)\b/i,
                /\b(що|коли|де|чому|як|хто|який|можна|чи)\b/i
            ],
            action: [
                /\b(will|should|need to|have to|must|going to|let's|we'll)\b/i,
                /\b(action item|to-do|task|assignment|deadline|due date)\b/i,
                /\b(треба|потрібно|зробимо|маємо|будемо|давайте)\b/i
            ],

            // Category-specific keywords
            technical: [
                /\b(code|function|API|database|server|deploy|bug|error|debug)\b/i,
                /\b(frontend|backend|infrastructure|architecture|performance)\b/i
            ],
            business: [
                /\b(revenue|profit|cost|budget|ROI|strategy|market|customer)\b/i,
                /\b(sales|marketing|product|growth|metrics|KPI)\b/i
            ],
            learning: [
                /\b(learn|study|understand|explain|teach|example|practice)\b/i,
                /\b(quiz|test|homework|assignment|grade|progress)\b/i
            ],
            emotional: [
                /\b(feel|feeling|emotion|stress|anxiety|happy|sad|frustrated)\b/i,
                /\b(почуваюся|відчуваю|емоція|переживаю|радий|сумний)\b/i
            ],
            medical: [
                /\b(symptom|pain|medication|treatment|diagnosis|health|wellness)\b/i,
                /\b(симптом|біль|ліки|лікування|діагноз|здоров'я)\b/i
            ]
        };
    }

    /**
     * Initialize role-specific configurations
     */
    initializeRoleConfigs() {
        return {
            '': {
                name: 'General Meeting',
                focus: ['action', 'question'],
                aiComments: true,
                sentimentWeights: { positive: 1, negative: 1, question: 1, action: 2 }
            },
            'language-teacher': {
                name: 'Language Teacher',
                focus: ['learning', 'question'],
                aiComments: true,
                sentimentWeights: { positive: 1, negative: 2, question: 2, action: 1 },
                customPatterns: {
                    grammar_error: /\b(incorrect grammar|wrong tense|article missing)\b/i,
                    vocabulary: /\b(new word|vocabulary|meaning|definition)\b/i
                }
            },
            'therapist': {
                name: 'Therapist',
                focus: ['emotional', 'negative', 'positive'],
                aiComments: true,
                sentimentWeights: { positive: 2, negative: 2, question: 1, action: 1 },
                customPatterns: {
                    breakthrough: /\b(realize|understand now|makes sense|clarity)\b/i,
                    resistance: /\b(but|however|though|still|not sure)\b/i
                }
            },
            'business-coach': {
                name: 'Business Coach',
                focus: ['business', 'action'],
                aiComments: true,
                sentimentWeights: { positive: 1, negative: 1, question: 1, action: 3 },
                customPatterns: {
                    goal: /\b(goal|target|objective|aim|achieve)\b/i,
                    obstacle: /\b(challenge|obstacle|barrier|difficulty)\b/i
                }
            },
            'medical-consultant': {
                name: 'Medical Consultant',
                focus: ['medical', 'question'],
                aiComments: true,
                sentimentWeights: { positive: 1, negative: 2, question: 2, action: 2 },
                customPatterns: {
                    symptom_report: /\b(hurt|pain|ache|discomfort|symptom)\b/i,
                    improvement: /\b(better|improving|healing|recovered)\b/i
                }
            },
            'tutor': {
                name: 'Academic Tutor',
                focus: ['learning', 'question'],
                aiComments: true,
                sentimentWeights: { positive: 1, negative: 1, question: 2, action: 1 },
                customPatterns: {
                    understanding: /\b(i understand|i get it|makes sense|clear now)\b/i,
                    confusion: /\b(confused|don't understand|unclear|lost)\b/i
                }
            }
        };
    }

    /**
     * Analyze text and return sentiment, keywords, and AI comment
     */
    analyze(text) {
        if (!text || text.trim().length === 0) {
            return null;
        }

        const sentiment = this.detectSentiment(text);
        const keywords = this.extractKeywords(text);
        const aiComment = this.generateAIComment(text, sentiment, keywords);
        const categories = this.detectCategories(text);

        const analysis = {
            sentiment,
            keywords,
            aiComment,
            categories,
            confidence: this.calculateConfidence(text, sentiment, keywords)
        };

        logger.debug('Analysis complete:', {
            sentiment,
            keywordCount: keywords.length,
            hasComment: !!aiComment
        });

        return analysis;
    }

    /**
     * Detect sentiment from text
     */
    detectSentiment(text) {
        const scores = {
            positive: 0,
            negative: 0,
            question: 0,
            action: 0,
            neutral: 0
        };

        // Check each sentiment pattern
        for (const [sentiment, patterns] of Object.entries(this.patterns)) {
            if (['positive', 'negative', 'question', 'action'].includes(sentiment)) {
                for (const pattern of patterns) {
                    if (pattern.test(text)) {
                        const roleConfig = this.roleConfigs[this.rolePreset];
                        const weight = roleConfig?.sentimentWeights?.[sentiment] || 1;
                        scores[sentiment] += weight;
                    }
                }
            }
        }

        // Check custom role patterns
        const roleConfig = this.roleConfigs[this.rolePreset];
        if (roleConfig?.customPatterns) {
            for (const [category, pattern] of Object.entries(roleConfig.customPatterns)) {
                if (pattern.test(text)) {
                    // Custom patterns boost relevant sentiments
                    if (category.includes('error') || category.includes('obstacle')) {
                        scores.negative += 2;
                    } else if (category.includes('understanding') || category.includes('improvement')) {
                        scores.positive += 2;
                    }
                }
            }
        }

        // Return highest scoring sentiment, or neutral if no matches
        const maxScore = Math.max(...Object.values(scores));
        if (maxScore === 0) {
            return 'neutral';
        }

        return Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0];
    }

    /**
     * Extract keywords from text
     */
    extractKeywords(text) {
        const keywords = new Set();

        // Extract from all category patterns
        for (const [category, patterns] of Object.entries(this.patterns)) {
            for (const pattern of patterns) {
                const matches = text.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        if (match.length > 3) { // Only meaningful words
                            keywords.add(match.toLowerCase());
                        }
                    });
                }
            }
        }

        // Extract role-specific keywords
        const roleConfig = this.roleConfigs[this.rolePreset];
        if (roleConfig?.customPatterns) {
            for (const pattern of Object.values(roleConfig.customPatterns)) {
                const matches = text.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        if (match.length > 3) {
                            keywords.add(match.toLowerCase());
                        }
                    });
                }
            }
        }

        return Array.from(keywords);
    }

    /**
     * Detect categories from text
     */
    detectCategories(text) {
        const categories = [];

        const categoryPatterns = {
            technical: this.patterns.technical,
            business: this.patterns.business,
            learning: this.patterns.learning,
            emotional: this.patterns.emotional,
            medical: this.patterns.medical
        };

        for (const [category, patterns] of Object.entries(categoryPatterns)) {
            for (const pattern of patterns) {
                if (pattern.test(text)) {
                    categories.push(category);
                    break;
                }
            }
        }

        return categories;
    }

    /**
     * Generate AI comment based on analysis
     */
    generateAIComment(text, sentiment, keywords) {
        const roleConfig = this.roleConfigs[this.rolePreset];

        if (!roleConfig?.aiComments) {
            return null;
        }

        // Role-specific comment generation
        switch (this.rolePreset) {
            case 'language-teacher':
                return this.generateLanguageTeacherComment(text, sentiment, keywords);

            case 'therapist':
                return this.generateTherapistComment(text, sentiment, keywords);

            case 'business-coach':
                return this.generateBusinessCoachComment(text, sentiment, keywords);

            case 'medical-consultant':
                return this.generateMedicalComment(text, sentiment, keywords);

            case 'tutor':
                return this.generateTutorComment(text, sentiment, keywords);

            default:
                return this.generateGeneralComment(text, sentiment, keywords);
        }
    }

    /**
     * Generate language teacher comment
     */
    generateLanguageTeacherComment(text, sentiment, keywords) {
        if (sentiment === 'question') {
            return 'Student asking for clarification - opportunity to explain';
        }
        if (keywords.some(k => k.includes('understand') || k.includes('get it'))) {
            return 'Student shows understanding - reinforce with example';
        }
        if (keywords.some(k => k.includes('confused') || k.includes('difficult'))) {
            return 'Student struggling - simplify explanation';
        }
        return null;
    }

    /**
     * Generate therapist comment
     */
    generateTherapistComment(text, sentiment, keywords) {
        if (keywords.some(k => k.includes('feel') || k.includes('emotion'))) {
            return 'Emotional expression - validate and explore deeper';
        }
        if (sentiment === 'negative' && keywords.some(k => k.includes('stress') || k.includes('anxiety'))) {
            return 'Client expressing distress - offer coping strategies';
        }
        if (keywords.some(k => k.includes('realize') || k.includes('understand now'))) {
            return 'Breakthrough moment - reinforce insight';
        }
        return null;
    }

    /**
     * Generate business coach comment
     */
    generateBusinessCoachComment(text, sentiment, keywords) {
        if (sentiment === 'action' || keywords.some(k => k.includes('goal') || k.includes('target'))) {
            return 'Action item identified - assign accountability';
        }
        if (keywords.some(k => k.includes('challenge') || k.includes('obstacle'))) {
            return 'Obstacle identified - brainstorm solutions';
        }
        if (keywords.some(k => k.includes('revenue') || k.includes('growth'))) {
            return 'Key business metric mentioned - track progress';
        }
        return null;
    }

    /**
     * Generate medical comment
     */
    generateMedicalComment(text, sentiment, keywords) {
        if (keywords.some(k => k.includes('pain') || k.includes('symptom'))) {
            return 'Symptom reported - document and assess severity';
        }
        if (keywords.some(k => k.includes('better') || k.includes('improving'))) {
            return 'Improvement noted - treatment appears effective';
        }
        if (sentiment === 'question') {
            return 'Patient has questions - ensure understanding';
        }
        return null;
    }

    /**
     * Generate tutor comment
     */
    generateTutorComment(text, sentiment, keywords) {
        if (keywords.some(k => k.includes('understand') || k.includes('makes sense'))) {
            return 'Concept understood - test with practice problem';
        }
        if (keywords.some(k => k.includes('confused') || k.includes('unclear'))) {
            return 'Student confused - use different approach';
        }
        if (sentiment === 'question') {
            return 'Good question - critical thinking engaged';
        }
        return null;
    }

    /**
     * Generate general meeting comment
     */
    generateGeneralComment(text, sentiment, keywords) {
        if (sentiment === 'action') {
            return 'Action item - track for follow-up';
        }
        if (sentiment === 'question') {
            return 'Question raised - ensure it gets answered';
        }
        if (keywords.some(k => k.includes('deadline') || k.includes('due date'))) {
            return 'Deadline mentioned - add to calendar';
        }
        return null;
    }

    /**
     * Calculate confidence score (0-1)
     */
    calculateConfidence(text, sentiment, keywords) {
        let confidence = 0.5; // Base confidence

        // Increase confidence based on text length
        if (text.length > 50) confidence += 0.1;
        if (text.length > 100) confidence += 0.1;

        // Increase confidence based on keywords found
        if (keywords.length > 0) confidence += 0.1;
        if (keywords.length > 2) confidence += 0.1;

        // Increase confidence if not neutral
        if (sentiment !== 'neutral') confidence += 0.1;

        return Math.min(confidence, 1.0);
    }

    /**
     * Set role preset
     */
    setRolePreset(rolePreset) {
        this.rolePreset = rolePreset;
        logger.log(`Role preset changed to: ${rolePreset}`);
        globalEvents.emit('ai-analyzer:role-changed', rolePreset);
    }

    /**
     * Set language
     */
    setLanguage(language) {
        this.language = language;
        logger.log(`Language changed to: ${language}`);
    }

    /**
     * Get available role presets
     */
    getRolePresets() {
        return Object.entries(this.roleConfigs).map(([id, config]) => ({
            id,
            name: config.name,
            focus: config.focus
        }));
    }

    /**
     * Batch analyze multiple entries
     */
    batchAnalyze(entries) {
        return entries.map(entry => ({
            ...entry,
            ...this.analyze(entry.text)
        }));
    }
}

export default AIAnalyzer;
