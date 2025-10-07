// Professional Role Presets System
class RolePresetsManager {
    constructor() {
        this.currentRole = null;
        this.presets = this.getRolePresets();
    }

    getRolePresets() {
        return [
            {
                id: 'language_teacher',
                icon: '👨‍🏫',
                name: 'Language Teacher',
                description: 'English/Foreign Language Instructor',
                fullDescription: 'Analyzes grammar, vocabulary usage, pronunciation patterns, and tracks student progress',
                categories: [
                    {
                        id: 'grammar',
                        name: 'Grammar Forms',
                        description: 'Identify grammar structures: present perfect, conditionals, passive voice, modal verbs, tenses, etc.',
                        color: '#10b981',
                        enabled: true
                    },
                    {
                        id: 'vocabulary',
                        name: 'New Vocabulary',
                        description: 'Track new words, idioms, phrases, collocations introduced or used by student',
                        color: '#3b82f6',
                        enabled: true
                    },
                    {
                        id: 'errors',
                        name: 'Common Errors',
                        description: 'Identify mistakes in grammar, pronunciation, word order, prepositions, articles',
                        color: '#ef4444',
                        enabled: true
                    },
                    {
                        id: 'progress',
                        name: 'Progress Markers',
                        description: 'Note improvements, correct usage, successful communication, confident expressions',
                        color: '#8b5cf6',
                        enabled: true
                    },
                    {
                        id: 'homework',
                        name: 'Homework & Tasks',
                        description: 'Track assignments given, exercises to practice, topics to review',
                        color: '#f59e0b',
                        enabled: true
                    }
                ],
                aiPromptSuffix: 'Focus on language learning aspects. Evaluate grammar accuracy, vocabulary richness, and communication effectiveness.'
            },
            {
                id: 'therapist',
                icon: '🧠',
                name: 'Therapist / Psychologist',
                description: 'Mental Health Professional',
                fullDescription: 'Tracks emotional patterns, therapeutic insights, client concerns, and progress indicators',
                categories: [
                    {
                        id: 'emotions',
                        name: 'Emotional States',
                        description: 'Identify expressions of emotions: anxiety, sadness, anger, joy, fear, confusion',
                        color: '#ec4899',
                        enabled: true
                    },
                    {
                        id: 'patterns',
                        name: 'Behavioral Patterns',
                        description: 'Recurring thoughts, beliefs, behaviors, cognitive distortions, coping mechanisms',
                        color: '#8b5cf6',
                        enabled: true
                    },
                    {
                        id: 'triggers',
                        name: 'Triggers & Stressors',
                        description: 'Situations, people, events that cause distress or emotional reactions',
                        color: '#ef4444',
                        enabled: true
                    },
                    {
                        id: 'insights',
                        name: 'Client Insights',
                        description: 'Moments of self-awareness, realizations, breakthroughs, connections made',
                        color: '#10b981',
                        enabled: true
                    },
                    {
                        id: 'goals',
                        name: 'Goals & Progress',
                        description: 'Therapeutic goals, progress indicators, action items, homework assignments',
                        color: '#3b82f6',
                        enabled: true
                    },
                    {
                        id: 'relationships',
                        name: 'Relationships',
                        description: 'Discussion of relationships with family, friends, partners, colleagues',
                        color: '#06b6d4',
                        enabled: true
                    }
                ],
                aiPromptSuffix: 'Focus on psychological and emotional content. Identify patterns, emotional states, and therapeutic insights. Be sensitive and professional.'
            },
            {
                id: 'business_founder',
                icon: '🚀',
                name: 'Business Founder / CEO',
                description: 'Startup & Business Leadership',
                fullDescription: 'Captures strategic decisions, investor discussions, metrics, team feedback, and action items',
                categories: [
                    {
                        id: 'metrics',
                        name: 'Metrics & KPIs',
                        description: 'Revenue, growth rate, CAC, LTV, churn, MRR, ARR, conversion rates, user numbers',
                        color: '#10b981',
                        enabled: true
                    },
                    {
                        id: 'strategy',
                        name: 'Strategic Decisions',
                        description: 'Product direction, market positioning, competitive strategy, pivots, long-term plans',
                        color: '#8b5cf6',
                        enabled: true
                    },
                    {
                        id: 'funding',
                        name: 'Funding & Finance',
                        description: 'Investment discussions, runway, burn rate, fundraising, valuation, terms',
                        color: '#f59e0b',
                        enabled: true
                    },
                    {
                        id: 'team',
                        name: 'Team & Hiring',
                        description: 'Team feedback, hiring needs, org structure, performance, culture issues',
                        color: '#3b82f6',
                        enabled: true
                    },
                    {
                        id: 'product',
                        name: 'Product Insights',
                        description: 'Feature requests, user feedback, technical challenges, roadmap priorities',
                        color: '#06b6d4',
                        enabled: true
                    },
                    {
                        id: 'action_items',
                        name: 'Action Items',
                        description: 'Tasks, follow-ups, deadlines, decisions to be made, things to delegate',
                        color: '#ef4444',
                        enabled: true
                    }
                ],
                aiPromptSuffix: 'Focus on business and strategic content. Identify key metrics, decisions, and action items.'
            },
            {
                id: 'sales_rep',
                icon: '💼',
                name: 'Sales Representative',
                description: 'B2B/B2C Sales Professional',
                fullDescription: 'Monitors objections, buying signals, pricing discussions, next steps, and closing opportunities',
                categories: [
                    {
                        id: 'pain_points',
                        name: 'Pain Points',
                        description: 'Customer problems, challenges, frustrations, needs, current solutions',
                        color: '#ef4444',
                        enabled: true
                    },
                    {
                        id: 'buying_signals',
                        name: 'Buying Signals',
                        description: 'Interest indicators, positive reactions, readiness to buy, urgency',
                        color: '#10b981',
                        enabled: true
                    },
                    {
                        id: 'objections',
                        name: 'Objections',
                        description: 'Concerns about price, features, implementation, support, competitors',
                        color: '#f59e0b',
                        enabled: true
                    },
                    {
                        id: 'pricing',
                        name: 'Pricing Discussion',
                        description: 'Budget, pricing tiers, discounts, ROI, cost-benefit analysis',
                        color: '#8b5cf6',
                        enabled: true
                    },
                    {
                        id: 'decision_makers',
                        name: 'Decision Makers',
                        description: 'Who needs to approve, stakeholders involved, decision process',
                        color: '#06b6d4',
                        enabled: true
                    },
                    {
                        id: 'next_steps',
                        name: 'Next Steps',
                        description: 'Follow-up actions, demos, trials, contracts, timelines',
                        color: '#3b82f6',
                        enabled: true
                    }
                ],
                aiPromptSuffix: 'Focus on sales process. Identify buying signals, objections, and opportunities to move the deal forward.'
            },
            {
                id: 'recruiter',
                icon: '👔',
                name: 'Recruiter / HR',
                description: 'Talent Acquisition & HR',
                fullDescription: 'Evaluates candidate responses, technical skills, culture fit, red flags, and compensation',
                categories: [
                    {
                        id: 'technical_skills',
                        name: 'Technical Skills',
                        description: 'Technologies, tools, frameworks, programming languages, certifications',
                        color: '#3b82f6',
                        enabled: true
                    },
                    {
                        id: 'experience',
                        name: 'Relevant Experience',
                        description: 'Past roles, achievements, projects, responsibilities matching job requirements',
                        color: '#10b981',
                        enabled: true
                    },
                    {
                        id: 'soft_skills',
                        name: 'Soft Skills',
                        description: 'Communication, leadership, teamwork, problem-solving, adaptability',
                        color: '#8b5cf6',
                        enabled: true
                    },
                    {
                        id: 'culture_fit',
                        name: 'Culture Fit',
                        description: 'Values alignment, work style, motivation, long-term goals',
                        color: '#06b6d4',
                        enabled: true
                    },
                    {
                        id: 'red_flags',
                        name: 'Red Flags',
                        description: 'Concerns, inconsistencies, gaps in resume, attitude issues',
                        color: '#ef4444',
                        enabled: true
                    },
                    {
                        id: 'compensation',
                        name: 'Compensation & Logistics',
                        description: 'Salary expectations, benefits, start date, relocation, visa status',
                        color: '#f59e0b',
                        enabled: true
                    }
                ],
                aiPromptSuffix: 'Focus on candidate evaluation. Assess skills, experience, and fit for the role.'
            },
            {
                id: 'consultant',
                icon: '📊',
                name: 'Business Consultant',
                description: 'Strategy & Management Consulting',
                fullDescription: 'Documents client problems, insights, recommendations, data points, and deliverables',
                categories: [
                    {
                        id: 'problems',
                        name: 'Client Problems',
                        description: 'Issues, challenges, inefficiencies, root causes identified',
                        color: '#ef4444',
                        enabled: true
                    },
                    {
                        id: 'data_insights',
                        name: 'Data & Insights',
                        description: 'Metrics, benchmarks, market data, competitive intelligence, trends',
                        color: '#3b82f6',
                        enabled: true
                    },
                    {
                        id: 'recommendations',
                        name: 'Recommendations',
                        description: 'Solutions proposed, strategic advice, action plans, best practices',
                        color: '#10b981',
                        enabled: true
                    },
                    {
                        id: 'stakeholders',
                        name: 'Stakeholder Concerns',
                        description: 'Different perspectives, resistance, buy-in needed, politics',
                        color: '#f59e0b',
                        enabled: true
                    },
                    {
                        id: 'deliverables',
                        name: 'Deliverables',
                        description: 'Reports, presentations, models, timelines, milestones',
                        color: '#8b5cf6',
                        enabled: true
                    }
                ],
                aiPromptSuffix: 'Focus on consulting engagement. Identify problems, insights, and actionable recommendations.'
            },
            {
                id: 'coach',
                icon: '🎯',
                name: 'Life / Business Coach',
                description: 'Personal Development & Coaching',
                fullDescription: 'Tracks client goals, obstacles, breakthroughs, accountability items, and progress',
                categories: [
                    {
                        id: 'goals_vision',
                        name: 'Goals & Vision',
                        description: 'Short-term goals, long-term vision, aspirations, desired outcomes',
                        color: '#8b5cf6',
                        enabled: true
                    },
                    {
                        id: 'obstacles',
                        name: 'Obstacles & Blocks',
                        description: 'Limiting beliefs, fears, external barriers, resource constraints',
                        color: '#ef4444',
                        enabled: true
                    },
                    {
                        id: 'strengths',
                        name: 'Strengths & Resources',
                        description: 'Skills, talents, support systems, past successes, resources available',
                        color: '#10b981',
                        enabled: true
                    },
                    {
                        id: 'breakthroughs',
                        name: 'Breakthroughs',
                        description: 'Insights, aha moments, perspective shifts, new awareness',
                        color: '#06b6d4',
                        enabled: true
                    },
                    {
                        id: 'accountability',
                        name: 'Accountability Items',
                        description: 'Commitments made, actions to take, habits to build, check-ins',
                        color: '#3b82f6',
                        enabled: true
                    }
                ],
                aiPromptSuffix: 'Focus on coaching conversation. Identify goals, obstacles, insights, and commitments.'
            },
            {
                id: 'doctor',
                icon: '⚕️',
                name: 'Medical Professional',
                description: 'Doctor / Healthcare Provider',
                fullDescription: 'Documents symptoms, medical history, diagnoses, treatment plans, and follow-up',
                categories: [
                    {
                        id: 'symptoms',
                        name: 'Symptoms',
                        description: 'Current symptoms, duration, severity, onset, progression',
                        color: '#ef4444',
                        enabled: true
                    },
                    {
                        id: 'history',
                        name: 'Medical History',
                        description: 'Past conditions, surgeries, medications, allergies, family history',
                        color: '#3b82f6',
                        enabled: true
                    },
                    {
                        id: 'diagnosis',
                        name: 'Diagnosis & Assessment',
                        description: 'Potential diagnoses, differential diagnoses, test results, assessment',
                        color: '#8b5cf6',
                        enabled: true
                    },
                    {
                        id: 'treatment',
                        name: 'Treatment Plan',
                        description: 'Medications prescribed, procedures, therapies, lifestyle changes',
                        color: '#10b981',
                        enabled: true
                    },
                    {
                        id: 'follow_up',
                        name: 'Follow-up',
                        description: 'Next appointment, tests to order, monitoring needed, red flags to watch',
                        color: '#f59e0b',
                        enabled: true
                    }
                ],
                aiPromptSuffix: 'Focus on medical consultation. Document symptoms, assessment, and treatment professionally.'
            },
            {
                id: 'lawyer',
                icon: '⚖️',
                name: 'Lawyer / Legal Advisor',
                description: 'Legal Consultation & Advice',
                fullDescription: 'Captures legal issues, case facts, precedents, risks, and action items',
                categories: [
                    {
                        id: 'facts',
                        name: 'Key Facts',
                        description: 'Relevant facts, dates, parties involved, documents, evidence',
                        color: '#3b82f6',
                        enabled: true
                    },
                    {
                        id: 'legal_issues',
                        name: 'Legal Issues',
                        description: 'Laws applicable, violations, claims, defenses, jurisdictional issues',
                        color: '#8b5cf6',
                        enabled: true
                    },
                    {
                        id: 'risks',
                        name: 'Risks & Liabilities',
                        description: 'Potential consequences, exposure, worst case scenarios, liabilities',
                        color: '#ef4444',
                        enabled: true
                    },
                    {
                        id: 'strategy',
                        name: 'Legal Strategy',
                        description: 'Approach, arguments, precedents, settlement options, litigation path',
                        color: '#10b981',
                        enabled: true
                    },
                    {
                        id: 'deadlines',
                        name: 'Deadlines & Actions',
                        description: 'Filing deadlines, statute of limitations, documents to prepare, next steps',
                        color: '#f59e0b',
                        enabled: true
                    }
                ],
                aiPromptSuffix: 'Focus on legal consultation. Identify facts, issues, risks, and legal strategy.'
            },
            {
                id: 'project_manager',
                icon: '📋',
                name: 'Project Manager',
                description: 'Project & Program Management',
                fullDescription: 'Tracks milestones, risks, blockers, resource needs, and stakeholder updates',
                categories: [
                    {
                        id: 'milestones',
                        name: 'Milestones & Deadlines',
                        description: 'Key dates, deliverable deadlines, phase completions, launch dates',
                        color: '#3b82f6',
                        enabled: true
                    },
                    {
                        id: 'risks_issues',
                        name: 'Risks & Issues',
                        description: 'Potential problems, current blockers, dependencies, concerns',
                        color: '#ef4444',
                        enabled: true
                    },
                    {
                        id: 'resources',
                        name: 'Resources',
                        description: 'Team allocation, budget, tools needed, capacity constraints',
                        color: '#f59e0b',
                        enabled: true
                    },
                    {
                        id: 'progress',
                        name: 'Progress Updates',
                        description: 'Completed tasks, status updates, percentage complete, achievements',
                        color: '#10b981',
                        enabled: true
                    },
                    {
                        id: 'decisions',
                        name: 'Decisions & Changes',
                        description: 'Scope changes, priority shifts, decisions made, approvals needed',
                        color: '#8b5cf6',
                        enabled: true
                    }
                ],
                aiPromptSuffix: 'Focus on project management. Track progress, identify risks, and capture action items.'
            },
            {
                id: 'yoga_teacher',
                icon: '🧘',
                name: 'Yoga Teacher / Instructor',
                description: 'Yoga & Mindfulness Instructor',
                fullDescription: 'Comprehensive tracking of posture alignment, breathing techniques, mindfulness practices, student progress, modifications needed, and holistic wellness guidance',
                categories: [
                    {
                        id: 'asanas',
                        name: 'Asanas & Alignment',
                        description: 'Track poses discussed: alignment cues, proper form, common misalignments, modifications for injuries/limitations, progression sequences, peak poses',
                        color: '#8b5cf6',
                        enabled: true
                    },
                    {
                        id: 'pranayama',
                        name: 'Pranayama & Breath',
                        description: 'Breathing techniques: ujjayi, alternate nostril, kapalabhati, breath awareness, breath-movement coordination, pranayama practices recommended',
                        color: '#06b6d4',
                        enabled: true
                    },
                    {
                        id: 'body_awareness',
                        name: 'Body Awareness & Feedback',
                        description: 'Student feedback on sensations, areas of tension, flexibility limitations, strength challenges, energy levels, physical responses to practice',
                        color: '#f59e0b',
                        enabled: true
                    },
                    {
                        id: 'mindfulness',
                        name: 'Mindfulness & Mental State',
                        description: 'Mental focus, stress levels, emotional state, meditation experiences, mind-body connection, presence and awareness during practice',
                        color: '#10b981',
                        enabled: true
                    },
                    {
                        id: 'modifications',
                        name: 'Modifications & Adjustments',
                        description: 'Specific modifications needed for injuries, props recommended (blocks/straps/bolsters), alternative poses, contraindications noted',
                        color: '#ef4444',
                        enabled: true
                    },
                    {
                        id: 'progress_goals',
                        name: 'Progress & Goals',
                        description: 'Improvements noticed, goals set (flexibility/strength/balance), sequences to practice, poses to work towards, home practice recommendations',
                        color: '#3b82f6',
                        enabled: true
                    },
                    {
                        id: 'philosophy',
                        name: 'Yoga Philosophy & Lifestyle',
                        description: 'Discussion of yamas/niyamas, meditation practices, lifestyle integration, mindful living, pranayama routines, spiritual aspects',
                        color: '#ec4899',
                        enabled: true
                    }
                ],
                aiPromptSuffix: 'As a yoga instructor, focus on holistic wellness including physical alignment, breath work, mindfulness, and safe practice. Provide personalized guidance considering individual limitations and goals.'
            }
        ];
    }

    applyRolePreset(roleId, configManager) {
        const role = this.presets.find(r => r.id === roleId);
        if (!role) return;

        this.currentRole = role;

        // Apply categories from role preset
        configManager.config.categories = role.categories.map(cat => ({...cat}));

        // Update meeting type based on role
        configManager.config.context.meetingType = this.getRoleMeetingType(roleId);

        // Save configuration
        configManager.config.currentRole = roleId;
        configManager.saveConfig();

        console.log('[ROLE PRESETS] Applied role:', role.name);
        return role;
    }

    getRoleMeetingType(roleId) {
        const typeMap = {
            'language_teacher': 'general',
            'therapist': 'general',
            'business_founder': 'general',
            'sales_rep': 'sales',
            'recruiter': 'general',
            'consultant': 'general',
            'coach': 'general',
            'doctor': 'general',
            'lawyer': 'general',
            'project_manager': 'general',
            'yoga_teacher': 'general'
        };
        return typeMap[roleId] || 'general';
    }

    getCurrentRole() {
        return this.currentRole;
    }

    clearRole(configManager) {
        this.currentRole = null;
        configManager.config.currentRole = null;
        configManager.config.categories = [];
        configManager.saveConfig();
        console.log('[ROLE PRESETS] Role cleared');
    }
}

// Global instance
let rolePresetsManager = null;
