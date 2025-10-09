/**
 * Enhanced AI Analyzer with OpenAI Integration and Extended Presets
 * @module notetaker/ai-analyzer-enhanced
 */

import { Logger } from '../core/logger.js';
import { globalEvents } from '../core/events.js';
import { api } from '../core/api.js';

const logger = new Logger('NOTETAKER:AI-ENHANCED');

export class EnhancedAIAnalyzer {
    constructor(config = {}) {
        this.rolePreset = config.rolePreset || '';
        this.language = config.language || 'en-US';
        this.useOpenAI = config.useOpenAI || false;
        this.openAIKey = config.openAIKey || null;

        // Keyword patterns
        this.patterns = this.initializePatterns();

        // Extended role presets with color schemes
        this.roleConfigs = this.initializeRoleConfigs();

        // Custom color overrides (user can customize)
        this.customColors = config.customColors || null;

        logger.log('Enhanced AI Analyzer initialized', {
            role: this.rolePreset,
            language: this.language,
            useOpenAI: this.useOpenAI
        });
    }

    initializePatterns() {
        return {
            positive: [
                /\b(agree|yes|exactly|correct|great|excellent|perfect|love|amazing|wonderful|fantastic|awesome)\b/i,
                /\b(thank you|thanks|appreciate|helpful|good idea|sounds good|brilliant)\b/i,
                /\b(успішно|чудово|відмінно|дякую|так|згоден|правильно|класно)\b/i
            ],
            negative: [
                /\b(no|disagree|wrong|incorrect|bad|terrible|problem|issue|concern|worry|disappointed)\b/i,
                /\b(don't|can't|won't|shouldn't|impossible|difficult|hard|fail|failed)\b/i,
                /\b(ні|неправильно|погано|проблема|не згоден|важко|невдача)\b/i
            ],
            question: [
                /\?$/,
                /\b(what|when|where|why|how|who|which|can you|could you|would you|should we)\b/i,
                /\b(що|коли|де|чому|як|хто|який|можна|чи|можемо)\b/i
            ],
            action: [
                /\b(will|should|need to|have to|must|going to|let's|we'll|shall we)\b/i,
                /\b(action item|to-do|task|assignment|deadline|due date|deliverable)\b/i,
                /\b(треба|потрібно|зробимо|маємо|будемо|давайте|дедлайн)\b/i
            ],
            technical: [
                /\b(code|function|API|database|server|deploy|bug|error|debug|commit|pull request)\b/i,
                /\b(frontend|backend|infrastructure|architecture|performance|optimization)\b/i
            ],
            business: [
                /\b(revenue|profit|cost|budget|ROI|strategy|market|customer|client)\b/i,
                /\b(sales|marketing|product|growth|metrics|KPI|conversion|retention)\b/i
            ],
            learning: [
                /\b(learn|study|understand|explain|teach|example|practice|exercise)\b/i,
                /\b(quiz|test|homework|assignment|grade|progress|knowledge)\b/i
            ],
            emotional: [
                /\b(feel|feeling|emotion|stress|anxiety|happy|sad|frustrated|angry|excited)\b/i,
                /\b(почуваюся|відчуваю|емоція|переживаю|радий|сумний|злий)\b/i
            ],
            medical: [
                /\b(symptom|pain|medication|treatment|diagnosis|health|wellness|therapy)\b/i,
                /\b(симптом|біль|ліки|лікування|діагноз|здоров'я|терапія)\b/i
            ]
        };
    }

    initializeRoleConfigs() {
        return {
            '': {
                name: '🎯 General Meeting',
                description: 'General purpose meeting notes',
                focus: ['action', 'question'],
                aiComments: true,
                colors: {
                    positive: '#10b981',
                    negative: '#ef4444',
                    question: '#3b82f6',
                    action: '#f59e0b',
                    neutral: '#6b7280'
                },
                sentimentWeights: { positive: 1, negative: 1, question: 1, action: 2 }
            },
            'language-teacher': {
                name: '📚 Language Teacher',
                description: 'Language learning and teaching sessions',
                focus: ['learning', 'question'],
                aiComments: true,
                colors: {
                    positive: '#10b981',
                    negative: '#ef4444',
                    question: '#8b5cf6',
                    action: '#f59e0b',
                    neutral: '#6b7280'
                },
                sentimentWeights: { positive: 1, negative: 2, question: 2, action: 1 },
                customPatterns: {
                    grammar: /\b(grammar|tense|article|verb|noun|помилка|неправильно)\b/i,
                    vocabulary: /\b(word|vocabulary|meaning|definition|слово|значення)\b/i,
                    pronunciation: /\b(pronounce|pronunciation|accent|sound|вимова)\b/i
                }
            },
            'therapist': {
                name: '🧠 Therapist / Psychologist',
                description: 'Therapy and counseling sessions',
                focus: ['emotional', 'negative', 'positive'],
                aiComments: true,
                colors: {
                    positive: '#06b6d4',
                    negative: '#f43f5e',
                    question: '#8b5cf6',
                    action: '#10b981',
                    neutral: '#64748b'
                },
                sentimentWeights: { positive: 2, negative: 2, question: 1, action: 1 },
                customPatterns: {
                    breakthrough: /\b(realize|understand now|makes sense|clarity|epiphany|усвідомлюю|розумію)\b/i,
                    resistance: /\b(but|however|though|still|not sure|але|проте|не впевнений)\b/i,
                    emotion: /\b(feel|feeling|emotion|anxiety|stress|depression|почуваюся|емоція|тривога|депресія)\b/i
                }
            },
            'business-coach': {
                name: '💼 Business Coach',
                description: 'Business coaching and strategy',
                focus: ['business', 'action'],
                aiComments: true,
                colors: {
                    positive: '#10b981',
                    negative: '#ef4444',
                    question: '#3b82f6',
                    action: '#f59e0b',
                    neutral: '#6b7280'
                },
                sentimentWeights: { positive: 1, negative: 1, question: 1, action: 3 },
                customPatterns: {
                    goal: /\b(goal|target|objective|aim|achieve|KPI|ціль|мета|досягти)\b/i,
                    obstacle: /\b(challenge|obstacle|barrier|difficulty|risk|перешкода|проблема|ризик)\b/i,
                    metrics: /\b(revenue|profit|ROI|growth|conversion|дохід|прибуток|зростання)\b/i
                }
            },
            'medical-consultant': {
                name: '⚕️ Medical Consultant',
                description: 'Medical consultations and health discussions',
                focus: ['medical', 'question'],
                aiComments: true,
                colors: {
                    positive: '#10b981',
                    negative: '#dc2626',
                    question: '#3b82f6',
                    action: '#f59e0b',
                    neutral: '#6b7280'
                },
                sentimentWeights: { positive: 1, negative: 2, question: 2, action: 2 },
                customPatterns: {
                    symptom: /\b(hurt|pain|ache|discomfort|symptom|fever|болить|біль|симптом|температура)\b/i,
                    improvement: /\b(better|improving|healing|recovered|worse|краще|покращення|гірше)\b/i,
                    medication: /\b(medication|treatment|prescription|dose|ліки|лікування|доза)\b/i
                }
            },
            'tutor': {
                name: '🎓 Academic Tutor',
                description: 'Tutoring and academic help',
                focus: ['learning', 'question'],
                aiComments: true,
                colors: {
                    positive: '#10b981',
                    negative: '#ef4444',
                    question: '#8b5cf6',
                    action: '#f59e0b',
                    neutral: '#6b7280'
                },
                sentimentWeights: { positive: 1, negative: 1, question: 2, action: 1 },
                customPatterns: {
                    understanding: /\b(understand|get it|makes sense|clear|розумію|зрозуміло)\b/i,
                    confusion: /\b(confused|don't understand|unclear|lost|незрозуміло|заплутався)\b/i,
                    concept: /\b(concept|theory|principle|formula|концепція|теорія|формула)\b/i
                }
            },
            'sales-training': {
                name: '📈 Sales Training',
                description: 'Sales calls and training',
                focus: ['business', 'action', 'question'],
                aiComments: true,
                colors: {
                    positive: '#10b981',
                    negative: '#ef4444',
                    question: '#3b82f6',
                    action: '#f59e0b',
                    neutral: '#6b7280'
                },
                sentimentWeights: { positive: 2, negative: 1, question: 2, action: 3 },
                customPatterns: {
                    objection: /\b(but|however|concern|worried|expensive|too much|але|дорого|занадто)\b/i,
                    buying_signal: /\b(interested|love it|perfect|when can|how soon|коли можна|цікаво)\b/i,
                    closing: /\b(deal|contract|sign|purchase|buy|угода|підписати|купити)\b/i
                }
            },
            'interview': {
                name: '🎤 Job Interview',
                description: 'Job interviews and candidate assessment',
                focus: ['question', 'technical', 'business'],
                aiComments: true,
                colors: {
                    positive: '#10b981',
                    negative: '#ef4444',
                    question: '#3b82f6',
                    action: '#f59e0b',
                    neutral: '#6b7280'
                },
                sentimentWeights: { positive: 1, negative: 1, question: 2, action: 1 },
                customPatterns: {
                    experience: /\b(experience|worked on|responsible for|led|managed|досвід|працював|відповідав)\b/i,
                    skills: /\b(skill|proficient|expert|familiar with|знання|навички|вмію)\b/i,
                    achievement: /\b(achieved|accomplished|delivered|improved|досягнув|покращив)\b/i
                }
            },
            'legal-consultation': {
                name: '⚖️ Legal Consultation',
                description: 'Legal advice and consultations',
                focus: ['question', 'action'],
                aiComments: true,
                colors: {
                    positive: '#10b981',
                    negative: '#dc2626',
                    question: '#3b82f6',
                    action: '#f59e0b',
                    neutral: '#6b7280'
                },
                sentimentWeights: { positive: 1, negative: 2, question: 2, action: 2 },
                customPatterns: {
                    legal_term: /\b(contract|agreement|clause|liability|lawsuit|права|договір|позов)\b/i,
                    concern: /\b(worried|risk|illegal|violation|liable|ризик|незаконно|порушення)\b/i,
                    deadline: /\b(file|submit|deadline|court date|подати|термін|суд)\b/i
                }
            },
            'brainstorming': {
                name: '💡 Creative Brainstorming',
                description: 'Creative ideation and brainstorming',
                focus: ['positive', 'action'],
                aiComments: true,
                colors: {
                    positive: '#8b5cf6',
                    negative: '#6b7280',
                    question: '#3b82f6',
                    action: '#f59e0b',
                    neutral: '#64748b'
                },
                sentimentWeights: { positive: 2, negative: 0, question: 1, action: 2 },
                customPatterns: {
                    idea: /\b(idea|concept|what if|imagine|think about|ідея|концепція|уявіть)\b/i,
                    innovation: /\b(innovative|creative|unique|new approach|fresh|інноваційно|креативно|свіже)\b/i,
                    build_on: /\b(and also|building on|expanding|plus|і також|розвиваючи)\b/i
                }
            },
            'project-planning': {
                name: '📋 Project Planning',
                description: 'Project planning and management',
                focus: ['action', 'technical'],
                aiComments: true,
                colors: {
                    positive: '#10b981',
                    negative: '#ef4444',
                    question: '#3b82f6',
                    action: '#f59e0b',
                    neutral: '#6b7280'
                },
                sentimentWeights: { positive: 1, negative: 1, question: 1, action: 3 },
                customPatterns: {
                    milestone: /\b(milestone|deadline|deliverable|sprint|release|віха|термін|спринт|реліз)\b/i,
                    resource: /\b(resource|team|budget|allocation|hiring|ресурс|команда|бюджет)\b/i,
                    risk: /\b(risk|blocker|dependency|bottleneck|ризик|блокер|залежність)\b/i
                }
            },
            'customer-support': {
                name: '🛟 Customer Support',
                description: 'Customer support and issue resolution',
                focus: ['question', 'negative', 'action'],
                aiComments: true,
                colors: {
                    positive: '#10b981',
                    negative: '#ef4444',
                    question: '#3b82f6',
                    action: '#f59e0b',
                    neutral: '#6b7280'
                },
                sentimentWeights: { positive: 1, negative: 2, question: 2, action: 2 },
                customPatterns: {
                    issue: /\b(problem|issue|error|bug|not working|broken|проблема|помилка|не працює)\b/i,
                    solution: /\b(fix|solve|resolve|workaround|patch|виправити|вирішити)\b/i,
                    escalation: /\b(urgent|critical|asap|immediately|priority|терміново|критично)\b/i
                }
            },
            'performance-review': {
                name: '📊 Performance Review',
                description: 'Employee performance reviews',
                focus: ['positive', 'negative', 'action'],
                aiComments: true,
                colors: {
                    positive: '#10b981',
                    negative: '#f59e0b',
                    question: '#3b82f6',
                    action: '#8b5cf6',
                    neutral: '#6b7280'
                },
                sentimentWeights: { positive: 2, negative: 1, question: 1, action: 2 },
                customPatterns: {
                    achievement: /\b(achieved|accomplished|exceeded|delivered|improved|досягнув|перевиконав)\b/i,
                    improvement: /\b(improve|develop|grow|area for growth|enhance|покращити|розвинути)\b/i,
                    goal: /\b(goal|objective|target|next quarter|plan|ціль|наступний квартал)\b/i
                }
            },
            'investor-pitch': {
                name: '💰 Investor Pitch',
                description: 'Investor pitches and funding discussions',
                focus: ['business', 'action'],
                aiComments: true,
                colors: {
                    positive: '#10b981',
                    negative: '#ef4444',
                    question: '#3b82f6',
                    action: '#f59e0b',
                    neutral: '#6b7280'
                },
                sentimentWeights: { positive: 2, negative: 1, question: 2, action: 2 },
                customPatterns: {
                    traction: /\b(revenue|users|growth|traction|MRR|ARR|дохід|користувачі|зростання)\b/i,
                    market: /\b(market size|TAM|SAM|competition|ринок|конкуренція)\b/i,
                    funding: /\b(raise|funding|investment|valuation|round|інвестиція|раунд)\b/i
                }
            }
        };
    }

    /**
     * Analyze text - uses local patterns + optional OpenAI
     */
    async analyze(text, speaker = 'Unknown') {
        if (!text || text.trim().length === 0) {
            return null;
        }

        // Local analysis (always runs)
        const localAnalysis = this.analyzeLocal(text);

        // If OpenAI is enabled, enhance with GPT analysis
        if (this.useOpenAI && this.openAIKey) {
            try {
                const openAIAnalysis = await this.analyzeWithOpenAI(text, speaker, localAnalysis);
                return { ...localAnalysis, ...openAIAnalysis, source: 'openai' };
            } catch (error) {
                logger.warn('OpenAI analysis failed, using local:', error.message);
                return { ...localAnalysis, source: 'local' };
            }
        }

        return { ...localAnalysis, source: 'local' };
    }

    /**
     * Local pattern-based analysis
     */
    analyzeLocal(text) {
        const sentiment = this.detectSentiment(text);
        const keywords = this.extractKeywords(text);
        const aiComment = this.generateAIComment(text, sentiment, keywords);
        const categories = this.detectCategories(text);
        const color = this.getColorForSentiment(sentiment);

        return {
            sentiment,
            keywords,
            aiComment,
            categories,
            color,
            confidence: this.calculateConfidence(text, sentiment, keywords)
        };
    }

    /**
     * Analyze with OpenAI GPT
     */
    async analyzeWithOpenAI(text, speaker, localAnalysis) {
        const roleConfig = this.roleConfigs[this.rolePreset];

        const prompt = `You are analyzing a conversation transcript for a ${roleConfig.name} session.

Role context: ${roleConfig.description}
Speaker: ${speaker}
Text: "${text}"

Based on this text, provide:
1. Sentiment (positive/negative/question/action/neutral)
2. Key insights or observations
3. Suggested action items or follow-ups
4. Important keywords (max 5)

Respond in JSON format:
{
    "sentiment": "...",
    "aiInsight": "...",
    "actionItems": ["..."],
    "keywords": ["..."]
}`;

        try {
            const response = await api.post('/api/openai/analyze', {
                prompt,
                text,
                rolePreset: this.rolePreset
            });

            if (response.success && response.analysis) {
                return {
                    sentiment: response.analysis.sentiment || localAnalysis.sentiment,
                    aiInsight: response.analysis.aiInsight,
                    actionItems: response.analysis.actionItems || [],
                    keywords: [...new Set([...localAnalysis.keywords, ...(response.analysis.keywords || [])])],
                    openAIComment: response.analysis.aiInsight
                };
            }

            return {};

        } catch (error) {
            logger.error('OpenAI API error:', error);
            throw error;
        }
    }

    /**
     * Get color for sentiment based on current preset
     */
    getColorForSentiment(sentiment) {
        // Custom colors override preset colors
        if (this.customColors && this.customColors[sentiment]) {
            return this.customColors[sentiment];
        }

        const roleConfig = this.roleConfigs[this.rolePreset];
        return roleConfig?.colors?.[sentiment] || '#6b7280';
    }

    /**
     * Set custom colors
     */
    setCustomColors(colors) {
        this.customColors = colors;
        globalEvents.emit('ai-analyzer:colors-updated', colors);
    }

    /**
     * Get current color scheme
     */
    getColorScheme() {
        const roleConfig = this.roleConfigs[this.rolePreset];
        return this.customColors || roleConfig?.colors || {};
    }

    /**
     * Detect sentiment (same as before)
     */
    detectSentiment(text) {
        const scores = { positive: 0, negative: 0, question: 0, action: 0, neutral: 0 };

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

        const roleConfig = this.roleConfigs[this.rolePreset];
        if (roleConfig?.customPatterns) {
            for (const [category, pattern] of Object.entries(roleConfig.customPatterns)) {
                if (pattern.test(text)) {
                    if (category.includes('error') || category.includes('obstacle') || category.includes('issue')) {
                        scores.negative += 2;
                    } else if (category.includes('understanding') || category.includes('improvement') || category.includes('achievement')) {
                        scores.positive += 2;
                    }
                }
            }
        }

        const maxScore = Math.max(...Object.values(scores));
        if (maxScore === 0) return 'neutral';

        return Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0];
    }

    extractKeywords(text) {
        const keywords = new Set();

        for (const [category, patterns] of Object.entries(this.patterns)) {
            for (const pattern of patterns) {
                const matches = text.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        if (match.length > 3) keywords.add(match.toLowerCase());
                    });
                }
            }
        }

        const roleConfig = this.roleConfigs[this.rolePreset];
        if (roleConfig?.customPatterns) {
            for (const pattern of Object.values(roleConfig.customPatterns)) {
                const matches = text.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        if (match.length > 3) keywords.add(match.toLowerCase());
                    });
                }
            }
        }

        return Array.from(keywords).slice(0, 10);
    }

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

    generateAIComment(text, sentiment, keywords) {
        const roleConfig = this.roleConfigs[this.rolePreset];
        if (!roleConfig?.aiComments) return null;

        // Simple rule-based comments
        if (sentiment === 'action') return '⚡ Action item identified';
        if (sentiment === 'question') return '❓ Question to address';
        if (keywords.some(k => k.includes('deadline') || k.includes('urgent'))) return '⏰ Time-sensitive';

        return null;
    }

    calculateConfidence(text, sentiment, keywords) {
        let confidence = 0.5;
        if (text.length > 50) confidence += 0.1;
        if (text.length > 100) confidence += 0.1;
        if (keywords.length > 0) confidence += 0.1;
        if (keywords.length > 2) confidence += 0.1;
        if (sentiment !== 'neutral') confidence += 0.1;
        return Math.min(confidence, 1.0);
    }

    setRolePreset(rolePreset) {
        this.rolePreset = rolePreset;
        logger.log(`Role preset changed to: ${rolePreset}`);
        globalEvents.emit('ai-analyzer:role-changed', rolePreset);
    }

    setLanguage(language) {
        this.language = language;
    }

    enableOpenAI(apiKey) {
        this.useOpenAI = true;
        this.openAIKey = apiKey;
        logger.log('OpenAI integration enabled');
    }

    disableOpenAI() {
        this.useOpenAI = false;
        this.openAIKey = null;
        logger.log('OpenAI integration disabled');
    }

    getRolePresets() {
        return Object.entries(this.roleConfigs).map(([id, config]) => ({
            id,
            name: config.name,
            description: config.description,
            focus: config.focus,
            colors: config.colors
        }));
    }
}

export default EnhancedAIAnalyzer;
