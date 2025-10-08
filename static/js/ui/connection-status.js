/**
 * Connection Status - UI for connection status display
 * @module ui/connection-status
 */

import { Logger } from '../core/logger.js';
import { $ } from '../core/dom.js';

const logger = new Logger('UI:STATUS');

export class ConnectionStatus {
    constructor(elementId = 'connectionStatus') {
        this.element = $(elementId.startsWith('#') ? elementId : `#${elementId}`);
        this.currentState = 'disconnected';
    }

    /**
     * Update connection status
     */
    update(state, message = null) {
        if (!this.element) {
            logger.warn('Connection status element not found');
            return;
        }

        this.currentState = state;

        // State-specific messages and styles
        const stateConfig = {
            'connecting': {
                text: message || 'Connecting...',
                color: '#3b82f6',
                icon: '🔄'
            },
            'connected': {
                text: message || 'Connected',
                color: '#10b981',
                icon: '✅'
            },
            'disconnected': {
                text: message || 'Disconnected',
                color: '#94a3b8',
                icon: '⚫'
            },
            'failed': {
                text: message || 'Connection Failed',
                color: '#ef4444',
                icon: '❌'
            },
            'reconnecting': {
                text: message || 'Reconnecting...',
                color: '#f59e0b',
                icon: '🔁'
            }
        };

        const config = stateConfig[state] || stateConfig['disconnected'];

        this.element.textContent = `${config.icon} ${config.text}`;
        this.element.style.color = config.color;

        logger.log(`Status: ${state} - ${config.text}`);
    }

    /**
     * Show connecting state
     */
    showConnecting(message = null) {
        this.update('connecting', message);
    }

    /**
     * Show connected state
     */
    showConnected(message = null) {
        this.update('connected', message);
    }

    /**
     * Show disconnected state
     */
    showDisconnected(message = null) {
        this.update('disconnected', message);
    }

    /**
     * Show failed state
     */
    showFailed(message = null) {
        this.update('failed', message);
    }

    /**
     * Show reconnecting state
     */
    showReconnecting(message = null) {
        this.update('reconnecting', message);
    }

    /**
     * Get current state
     */
    getState() {
        return this.currentState;
    }

    /**
     * Hide status element
     */
    hide() {
        if (this.element) {
            this.element.style.display = 'none';
        }
    }

    /**
     * Show status element
     */
    show() {
        if (this.element) {
            this.element.style.display = 'block';
        }
    }
}

export default ConnectionStatus;
