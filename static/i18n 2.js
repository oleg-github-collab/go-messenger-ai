// Internationalization system for Ukrainian/English
(function() {
    'use strict';

    const translations = {
        uk: {
            'hero.title': 'Kaminskyi Messenger',
            'hero.subtitle': 'Захищені відеодзвінки та розумна комунікація нового покоління',
            'hero.getStarted': 'Розпочати',
            'hero.learnMore': 'Дізнатись більше',

            'features.title': 'Можливості',
            'features.video.title': 'Відеодзвінки 1-на-1',
            'features.video.desc': 'Кристально чисті P2P відеодзвінки з підтримкою Picture-in-Picture',
            'features.group.title': 'Групові конференції',
            'features.group.desc': 'До 20 учасників одночасно з технологією SFU для оптимальної продуктивності',
            'features.chat.title': 'Живий чат',
            'features.chat.desc': 'Обмін повідомленнями, емодзі та GIF під час дзвінків',
            'features.security.title': 'Безпека',
            'features.security.desc': 'Шифрування WebRTC, автентифікація та 8-годинні сесії',
            'features.mobile.title': 'Мобільна оптимізація',
            'features.mobile.desc': 'Повна підтримка iOS/Android з адаптивним дизайном',
            'features.sharing.title': 'Швидкий доступ',
            'features.sharing.desc': 'Діліться посиланнями через Email, SMS, WhatsApp, Telegram',

            'roadmap.title': 'Майбутнє платформи',
            'roadmap.subtitle': 'Інтеграція штучного інтелекту для професійної та особистої комунікації',
            'roadmap.ai.title': 'ШІ-Агенти',
            'roadmap.ai.desc': 'Розумні асистенти в чаті для автоматизації завдань, перекладу в реальному часі та контекстної допомоги',
            'roadmap.notes.title': 'ШІ Нотатник',
            'roadmap.notes.desc': 'Автоматичне створення нотаток, транскрипція розмов та виділення ключових моментів',
            'roadmap.learning.title': 'Аналіз навчальних сесій',
            'roadmap.learning.desc': 'Оцінка ефективності онлайн-уроків, відстеження прогресу студентів та рекомендації',
            'roadmap.therapy.title': 'Психотерапевтичні сесії',
            'roadmap.therapy.desc': 'Безпечна платформа для терапії з аналізом емоційного стану та приватністю',
            'roadmap.negotiations.title': 'Протоколювання переговорів',
            'roadmap.negotiations.desc': 'Автоматичне документування ділових зустрічей, виділення домовленостей та завдань',
            'roadmap.analytics.title': 'Аналітика комунікації',
            'roadmap.analytics.desc': 'Інсайти про якість комунікації, тривалість уваги та ефективність взаємодії',
            'roadmap.status.planned': 'Заплановано',
            'roadmap.status.development': 'У розробці',
            'roadmap.status.research': 'Дослідження',

            'cta.title': 'Готові почати?',
            'cta.subtitle': 'Приєднуйтесь до майбутнього розумної комунікації',
            'cta.button': 'Створити акаунт',

            'footer.copyright': '© 2025 Kaminskyi Messenger. Всі права захищено.',
            'footer.tagline': 'Створено з ❤️ для безпечної та розумної комунікації'
        },
        en: {
            'hero.title': 'Kaminskyi Messenger',
            'hero.subtitle': 'Secure video calls and next-generation smart communication',
            'hero.getStarted': 'Get Started',
            'hero.learnMore': 'Learn More',

            'features.title': 'Features',
            'features.video.title': '1-on-1 Video Calls',
            'features.video.desc': 'Crystal clear P2P video calls with Picture-in-Picture support',
            'features.group.title': 'Group Conferences',
            'features.group.desc': 'Up to 20 participants simultaneously with SFU technology for optimal performance',
            'features.chat.title': 'Live Chat',
            'features.chat.desc': 'Exchange messages, emojis and GIFs during calls',
            'features.security.title': 'Security',
            'features.security.desc': 'WebRTC encryption, authentication and 8-hour sessions',
            'features.mobile.title': 'Mobile Optimization',
            'features.mobile.desc': 'Full iOS/Android support with responsive design',
            'features.sharing.title': 'Quick Access',
            'features.sharing.desc': 'Share links via Email, SMS, WhatsApp, Telegram',

            'roadmap.title': 'Platform Future',
            'roadmap.subtitle': 'Artificial intelligence integration for professional and personal communication',
            'roadmap.ai.title': 'AI Agents',
            'roadmap.ai.desc': 'Smart assistants in chat for task automation, real-time translation and contextual help',
            'roadmap.notes.title': 'AI Note Taker',
            'roadmap.notes.desc': 'Automatic note-taking, conversation transcription and key moments highlighting',
            'roadmap.learning.title': 'Learning Session Analysis',
            'roadmap.learning.desc': 'Assess online lesson effectiveness, track student progress and recommendations',
            'roadmap.therapy.title': 'Psychotherapy Sessions',
            'roadmap.therapy.desc': 'Secure therapy platform with emotional state analysis and privacy',
            'roadmap.negotiations.title': 'Negotiation Recording',
            'roadmap.negotiations.desc': 'Automatic business meeting documentation, highlighting agreements and tasks',
            'roadmap.analytics.title': 'Communication Analytics',
            'roadmap.analytics.desc': 'Insights on communication quality, attention span and interaction effectiveness',
            'roadmap.status.planned': 'Planned',
            'roadmap.status.development': 'In Development',
            'roadmap.status.research': 'Research',

            'cta.title': 'Ready to Start?',
            'cta.subtitle': 'Join the future of smart communication',
            'cta.button': 'Create Account',

            'footer.copyright': '© 2025 Kaminskyi Messenger. All rights reserved.',
            'footer.tagline': 'Made with ❤️ for secure and smart communication'
        }
    };

    // Get browser language or default to Ukrainian
    function getBrowserLanguage() {
        const saved = localStorage.getItem('messenger-language');
        if (saved && (saved === 'uk' || saved === 'en')) {
            return saved;
        }
        const browserLang = navigator.language || navigator.userLanguage;
        return browserLang.startsWith('uk') ? 'uk' : 'en';
    }

    let currentLanguage = getBrowserLanguage();

    // Apply translations to page
    function applyTranslations(lang) {
        currentLanguage = lang;
        localStorage.setItem('messenger-language', lang);

        // Update HTML lang attribute
        document.documentElement.lang = lang;

        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = translations[lang][key];
            if (translation) {
                element.textContent = translation;
            }
        });

        // Update active language button
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        console.log(`[i18n] Language changed to: ${lang}`);
    }

    // Initialize when DOM is ready
    function init() {
        // Set up language switcher buttons
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                if (lang === 'uk' || lang === 'en') {
                    applyTranslations(lang);
                }
            });
        });

        // Apply initial language
        applyTranslations(currentLanguage);
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for use in other scripts
    window.i18n = {
        get currentLanguage() {
            return currentLanguage;
        },
        setLanguage: applyTranslations,
        translate: (key, lang = currentLanguage) => translations[lang][key] || key
    };

    console.log('[i18n] Internationalization system loaded');
})();
