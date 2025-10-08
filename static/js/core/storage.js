/**
 * Storage Utility - Unified localStorage/sessionStorage access
 * @module core/storage
 */

export class Storage {
    constructor(storageType = 'localStorage') {
        this.storage = storageType === 'session' ? sessionStorage : localStorage;
    }

    get(key, defaultValue = null) {
        try {
            const value = this.storage.getItem(key);
            return value !== null ? JSON.parse(value) : defaultValue;
        } catch (e) {
            console.error('[Storage] Failed to get', key, e);
            return defaultValue;
        }
    }

    set(key, value) {
        try {
            this.storage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('[Storage] Failed to set', key, e);
            return false;
        }
    }

    remove(key) {
        try {
            this.storage.removeItem(key);
            return true;
        } catch (e) {
            console.error('[Storage] Failed to remove', key, e);
            return false;
        }
    }

    clear() {
        try {
            this.storage.clear();
            return true;
        } catch (e) {
            console.error('[Storage] Failed to clear', e);
            return false;
        }
    }

    has(key) {
        return this.storage.getItem(key) !== null;
    }

    keys() {
        return Object.keys(this.storage);
    }
}

// Create default instances
export const localStore = new Storage('local');
export const sessionStore = new Storage('session');

export default Storage;
