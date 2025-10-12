/**
 * Professional AI Mode - Internationalization
 * Languages: Ukrainian, English, German
 */

const translations = {
    uk: {
        // Top Bar
        recordingIndicator: 'ЗАПИС',
        waitingForGuest: 'Очікування гостя...',
        settings: 'Налаштування',

        // Transcript Panel
        liveTranscript: 'Живий транскрипт',
        searchTranscript: 'Пошук',
        bookmark: 'Закладка',
        export: 'Експорт',
        hidePanel: 'Сховати панель',
        both: 'Обидва',
        guest: 'Гість',
        me: 'Я',
        startSpeaking: 'Почніть говорити, щоб побачити транскрипт...',
        aiWillAnalyze: 'ШІ аналізуватиме в реальному часі',

        // Controls
        mic: 'Мікрофон',
        camera: 'Камера',
        share: 'Поділитися',
        react: 'Реакція',
        chat: 'Чат',
        poll: 'Опитування',
        board: 'Дошка',
        record: 'Запис',
        endCall: 'Завершити',

        // AI Modal
        aiRecommendation: '🤖 Рекомендація ШІ',
        objection: 'ЗАПЕРЕЧЕННЯ',
        pricing: 'ЦІНОУТВОРЕННЯ',
        agreement: 'ЗГОДА',
        question: 'ПИТАННЯ',
        general: 'ЗАГАЛЬНЕ',
        quickResponses: 'Швидкі відповіді:',

        // Chat
        typeMessage: 'Введіть повідомлення...',
        you: 'Ви',

        // Poll
        createPoll: 'Створити опитування',
        yourQuestion: 'Ваше питання...',
        option: 'Варіант',
        addOption: '+ Додати варіант',
        cancel: 'Скасувати',
        create: 'Створити',

        // Whiteboard
        whiteboard: 'Дошка',

        // Settings
        language: 'Мова',
        videoQuality: 'Якість відео',
        auto: 'Авто',
        audioSettings: 'Налаштування аудіо',
        echoCancellation: 'Подавлення відлуння',
        noiseSuppression: 'Шумоподавлення',
        aiAssistant: 'ШІ-асистент',
        autoAnalysis: 'Автоаналіз транскрипту',
        showRecommendations: 'Показувати рекомендації',

        // Loading
        aiMeetingAssistant: 'ШІ-асистент зустрічей',
        connecting: 'Підключення до професійного дзвінка...',
        authenticating: 'Автентифікація',
        settingUpVideo: 'Налаштування відео',
        activatingAI: 'Активація ШІ',

        // Placeholders
        waitingForParticipant: 'Очікування учасника...',
        shareLink: 'Поділіться посиланням, щоб почати професійну зустріч'
    },

    en: {
        // Top Bar
        recordingIndicator: 'REC',
        waitingForGuest: 'Waiting for guest...',
        settings: 'Settings',

        // Transcript Panel
        liveTranscript: 'Live Transcript',
        searchTranscript: 'Search',
        bookmark: 'Bookmark',
        export: 'Export',
        hidePanel: 'Hide panel',
        both: 'Both',
        guest: 'Guest',
        me: 'Me',
        startSpeaking: 'Start speaking to see transcript...',
        aiWillAnalyze: 'AI will analyze in real-time',

        // Controls
        mic: 'Mic',
        camera: 'Camera',
        share: 'Share',
        react: 'React',
        chat: 'Chat',
        poll: 'Poll',
        board: 'Board',
        record: 'Record',
        endCall: 'End Call',

        // AI Modal
        aiRecommendation: '🤖 AI Recommendation',
        objection: 'OBJECTION',
        pricing: 'PRICING',
        agreement: 'AGREEMENT',
        question: 'QUESTION',
        general: 'GENERAL',
        quickResponses: 'Quick Responses:',

        // Chat
        typeMessage: 'Type a message...',
        you: 'You',

        // Poll
        createPoll: 'Create Poll',
        yourQuestion: 'Your question...',
        option: 'Option',
        addOption: '+ Add Option',
        cancel: 'Cancel',
        create: 'Create',

        // Whiteboard
        whiteboard: 'Whiteboard',

        // Settings
        language: 'Language',
        videoQuality: 'Video Quality',
        auto: 'Auto',
        audioSettings: 'Audio Settings',
        echoCancellation: 'Echo Cancellation',
        noiseSuppression: 'Noise Suppression',
        aiAssistant: 'AI Assistant',
        autoAnalysis: 'Auto-analyze transcript',
        showRecommendations: 'Show recommendations',

        // Loading
        aiMeetingAssistant: 'AI Meeting Assistant',
        connecting: 'Connecting to professional call...',
        authenticating: 'Authenticating',
        settingUpVideo: 'Setting up video',
        activatingAI: 'Activating AI',

        // Placeholders
        waitingForParticipant: 'Waiting for participant...',
        shareLink: 'Share the link to start your professional meeting'
    },

    de: {
        // Top Bar
        recordingIndicator: 'AUFNAHME',
        waitingForGuest: 'Auf Gast warten...',
        settings: 'Einstellungen',

        // Transcript Panel
        liveTranscript: 'Live-Transkript',
        searchTranscript: 'Suchen',
        bookmark: 'Lesezeichen',
        export: 'Exportieren',
        hidePanel: 'Panel ausblenden',
        both: 'Beide',
        guest: 'Gast',
        me: 'Ich',
        startSpeaking: 'Sprechen Sie, um das Transkript zu sehen...',
        aiWillAnalyze: 'KI analysiert in Echtzeit',

        // Controls
        mic: 'Mikrofon',
        camera: 'Kamera',
        share: 'Teilen',
        react: 'Reagieren',
        chat: 'Chat',
        poll: 'Umfrage',
        board: 'Tafel',
        record: 'Aufnehmen',
        endCall: 'Anruf beenden',

        // AI Modal
        aiRecommendation: '🤖 KI-Empfehlung',
        objection: 'EINWAND',
        pricing: 'PREISGESTALTUNG',
        agreement: 'ZUSTIMMUNG',
        question: 'FRAGE',
        general: 'ALLGEMEIN',
        quickResponses: 'Schnellantworten:',

        // Chat
        typeMessage: 'Nachricht eingeben...',
        you: 'Sie',

        // Poll
        createPoll: 'Umfrage erstellen',
        yourQuestion: 'Ihre Frage...',
        option: 'Option',
        addOption: '+ Option hinzufügen',
        cancel: 'Abbrechen',
        create: 'Erstellen',

        // Whiteboard
        whiteboard: 'Whiteboard',

        // Settings
        language: 'Sprache',
        videoQuality: 'Videoqualität',
        auto: 'Auto',
        audioSettings: 'Audioeinstellungen',
        echoCancellation: 'Echounterdrückung',
        noiseSuppression: 'Rauschunterdrückung',
        aiAssistant: 'KI-Assistent',
        autoAnalysis: 'Transkript automatisch analysieren',
        showRecommendations: 'Empfehlungen anzeigen',

        // Loading
        aiMeetingAssistant: 'KI-Meeting-Assistent',
        connecting: 'Verbindung zu professionellem Anruf...',
        authenticating: 'Authentifizierung',
        settingUpVideo: 'Video einrichten',
        activatingAI: 'KI aktivieren',

        // Placeholders
        waitingForParticipant: 'Auf Teilnehmer warten...',
        shareLink: 'Teilen Sie den Link, um Ihr professionelles Meeting zu starten'
    }
};

// Current language
let currentLang = localStorage.getItem('professionalAI_lang') || 'uk';

// Apply translations
function applyTranslations(lang) {
    currentLang = lang;
    localStorage.setItem('professionalAI_lang', lang);

    const t = translations[lang];
    if (!t) return;

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (t[key]) {
            element.textContent = t[key];
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (t[key]) {
            element.placeholder = t[key];
        }
    });

    console.log(`[i18n] Language changed to: ${lang}`);
}

// Get translation
function t(key) {
    return translations[currentLang][key] || key;
}

// Initialize translations on page load
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations(currentLang);

    // Update active language button
    const langBtns = document.querySelectorAll('.lang-option');
    langBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
});
