/**
 * Logger Utility - Centralized logging with prefixes and levels
 * @module core/logger
 */

export class Logger {
    constructor(prefix = '') {
        this.prefix = prefix;
        this.enabled = true;
    }

    log(...args) {
        if (!this.enabled) return;
        console.log(`[${this.prefix}]`, ...args);
    }

    info(...args) {
        if (!this.enabled) return;
        console.info(`[${this.prefix}] ℹ️`, ...args);
    }

    warn(...args) {
        if (!this.enabled) return;
        console.warn(`[${this.prefix}] ⚠️`, ...args);
    }

    error(...args) {
        if (!this.enabled) return;
        console.error(`[${this.prefix}] ❌`, ...args);
    }

    success(...args) {
        if (!this.enabled) return;
        console.log(`[${this.prefix}] ✅`, ...args);
    }

    debug(...args) {
        if (!this.enabled) return;
        console.debug(`[${this.prefix}] 🔍`, ...args);
    }

    disable() {
        this.enabled = false;
    }

    enable() {
        this.enabled = true;
    }
}

// Create default loggers for common modules
export const loggers = {
    webrtc: new Logger('WEBRTC'),
    call: new Logger('CALL'),
    notetaker: new Logger('NOTETAKER'),
    guest: new Logger('GUEST'),
    ui: new Logger('UI'),
    groupCall: new Logger('GROUP-CALL')
};

export default Logger;
