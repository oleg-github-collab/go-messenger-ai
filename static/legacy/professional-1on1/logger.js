/**
 * Professional Logging System
 * Structured logging with levels, timestamps, and categorization
 */

class ProfessionalLogger {
    constructor(context = 'App') {
        this.context = context;
        this.logs = [];
        this.maxLogs = 1000;
        this.levels = {
            DEBUG: { color: '#888', emoji: '🔍', priority: 0 },
            INFO: { color: '#4facfe', emoji: 'ℹ️', priority: 1 },
            WARN: { color: '#f5a623', emoji: '⚠️', priority: 2 },
            ERROR: { color: '#f45c43', emoji: '❌', priority: 3 },
            CRITICAL: { color: '#d0021b', emoji: '🔥', priority: 4 }
        };
        this.enabledLevels = ['INFO', 'WARN', 'ERROR', 'CRITICAL'];
        this.remoteLogging = false;
    }

    log(level, category, message, data = null) {
        if (!this.enabledLevels.includes(level)) return;

        const entry = {
            timestamp: new Date().toISOString(),
            level,
            category,
            context: this.context,
            message,
            data,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        this._consoleLog(entry);

        if (this.remoteLogging && level === 'ERROR' || level === 'CRITICAL') {
            this._sendToServer(entry);
        }

        return entry;
    }

    _consoleLog(entry) {
        const { level, category, message, data } = entry;
        const config = this.levels[level];
        const style = `color: ${config.color}; font-weight: bold;`;
        const timestamp = new Date(entry.timestamp).toLocaleTimeString();

        console.log(
            `%c[${config.emoji} ${level}]%c [${timestamp}] [${category}] ${message}`,
            style,
            'color: inherit;',
            data || ''
        );
    }

    async _sendToServer(entry) {
        try {
            await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(entry)
            });
        } catch (error) {
            console.warn('Failed to send log to server:', error);
        }
    }

    debug(category, message, data) {
        return this.log('DEBUG', category, message, data);
    }

    info(category, message, data) {
        return this.log('INFO', category, message, data);
    }

    warn(category, message, data) {
        return this.log('WARN', category, message, data);
    }

    error(category, message, data) {
        return this.log('ERROR', category, message, data);
    }

    critical(category, message, data) {
        return this.log('CRITICAL', category, message, data);
    }

    enableDebug() {
        if (!this.enabledLevels.includes('DEBUG')) {
            this.enabledLevels.unshift('DEBUG');
        }
    }

    disableDebug() {
        this.enabledLevels = this.enabledLevels.filter(l => l !== 'DEBUG');
    }

    getLogs(level = null, category = null) {
        let filtered = this.logs;
        if (level) filtered = filtered.filter(l => l.level === level);
        if (category) filtered = filtered.filter(l => l.category === category);
        return filtered;
    }

    exportLogs() {
        const blob = new Blob([JSON.stringify(this.logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `professional-logs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    clearLogs() {
        this.logs = [];
        this.info('Logger', 'Logs cleared');
    }
}

// Global logger instance
window.ProfessionalLogger = window.ProfessionalLogger || new ProfessionalLogger('Professional');
