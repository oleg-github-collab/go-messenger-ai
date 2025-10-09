/**
 * Participant Selector - Select which participants to transcribe in group calls
 * @module notetaker/participant-selector
 */

import { Logger } from '../core/logger.js';
import { globalEvents } from '../core/events.js';

const logger = new Logger('NOTETAKER:PARTICIPANTS');

export class ParticipantSelector {
    constructor() {
        // Participant tracking
        this.participants = new Map(); // Map<participantId, {name, stream, selected, isSelf}>
        this.selectedParticipants = new Set();

        // UI elements
        this.container = null;
        this.listElement = null;

        logger.log('Participant Selector initialized');
    }

    /**
     * Initialize UI
     */
    init(containerId = 'notetakerParticipantList') {
        this.container = document.getElementById(containerId);

        if (!this.container) {
            logger.warn('Participant list container not found');
            return;
        }

        this.listElement = this.container.querySelector('.participant-list') || this.container;
        this.render();

        logger.log('Participant Selector UI initialized');
    }

    /**
     * Add participant
     */
    addParticipant(participantId, name, stream = null, isSelf = false) {
        if (this.participants.has(participantId)) {
            logger.debug(`Participant ${participantId} already exists`);
            return;
        }

        this.participants.set(participantId, {
            id: participantId,
            name: name || `Participant ${this.participants.size + 1}`,
            stream,
            selected: isSelf, // Self is selected by default
            isSelf,
            joinedAt: Date.now()
        });

        if (isSelf) {
            this.selectedParticipants.add(participantId);
        }

        logger.log(`Added participant: ${name} (${participantId})`);

        this.render();

        globalEvents.emit('participant-selector:participant-added', {
            id: participantId,
            name,
            isSelf
        });
    }

    /**
     * Remove participant
     */
    removeParticipant(participantId) {
        const participant = this.participants.get(participantId);

        if (!participant) {
            logger.warn(`Participant ${participantId} not found`);
            return;
        }

        this.participants.delete(participantId);
        this.selectedParticipants.delete(participantId);

        logger.log(`Removed participant: ${participant.name} (${participantId})`);

        this.render();

        globalEvents.emit('participant-selector:participant-removed', {
            id: participantId,
            name: participant.name
        });
    }

    /**
     * Update participant stream
     */
    updateParticipantStream(participantId, stream) {
        const participant = this.participants.get(participantId);

        if (!participant) {
            logger.warn(`Participant ${participantId} not found`);
            return;
        }

        participant.stream = stream;

        logger.log(`Updated stream for: ${participant.name}`);

        globalEvents.emit('participant-selector:stream-updated', {
            id: participantId,
            hasStream: !!stream
        });
    }

    /**
     * Update participant name
     */
    updateParticipantName(participantId, name) {
        const participant = this.participants.get(participantId);

        if (!participant) {
            logger.warn(`Participant ${participantId} not found`);
            return;
        }

        participant.name = name;

        logger.log(`Updated name for ${participantId}: ${name}`);

        this.render();
    }

    /**
     * Toggle participant selection
     */
    toggleParticipant(participantId) {
        const participant = this.participants.get(participantId);

        if (!participant) {
            logger.warn(`Participant ${participantId} not found`);
            return;
        }

        participant.selected = !participant.selected;

        if (participant.selected) {
            this.selectedParticipants.add(participantId);
        } else {
            this.selectedParticipants.delete(participantId);
        }

        logger.log(`Toggled ${participant.name}: ${participant.selected ? 'selected' : 'deselected'}`);

        this.render();

        globalEvents.emit('participant-selector:selection-changed', {
            id: participantId,
            selected: participant.selected,
            selectedCount: this.selectedParticipants.size
        });
    }

    /**
     * Select all participants
     */
    selectAll() {
        this.participants.forEach(participant => {
            participant.selected = true;
            this.selectedParticipants.add(participant.id);
        });

        logger.log('Selected all participants');

        this.render();

        globalEvents.emit('participant-selector:all-selected', {
            count: this.participants.size
        });
    }

    /**
     * Deselect all participants
     */
    deselectAll() {
        this.participants.forEach(participant => {
            participant.selected = false;
        });

        this.selectedParticipants.clear();

        logger.log('Deselected all participants');

        this.render();

        globalEvents.emit('participant-selector:all-deselected');
    }

    /**
     * Get selected participants
     */
    getSelectedParticipants() {
        return Array.from(this.participants.values()).filter(p => p.selected);
    }

    /**
     * Get selected streams for mixing
     */
    getSelectedStreams() {
        const streams = [];

        this.participants.forEach(participant => {
            if (participant.selected && participant.stream) {
                streams.push({
                    id: participant.id,
                    name: participant.name,
                    stream: participant.stream
                });
            }
        });

        return streams;
    }

    /**
     * Get all participants
     */
    getAllParticipants() {
        return Array.from(this.participants.values());
    }

    /**
     * Check if participant is selected
     */
    isSelected(participantId) {
        return this.selectedParticipants.has(participantId);
    }

    /**
     * Get selected count
     */
    getSelectedCount() {
        return this.selectedParticipants.size;
    }

    /**
     * Render participant list
     */
    render() {
        if (!this.listElement) {
            return;
        }

        const participants = Array.from(this.participants.values());

        if (participants.length === 0) {
            this.listElement.innerHTML = `
                <div class="no-participants">
                    <p>No participants yet</p>
                </div>
            `;
            return;
        }

        // Sort: self first, then by join time
        participants.sort((a, b) => {
            if (a.isSelf) return -1;
            if (b.isSelf) return 1;
            return a.joinedAt - b.joinedAt;
        });

        this.listElement.innerHTML = participants.map(p => `
            <div class="participant-item ${p.selected ? 'selected' : ''} ${p.isSelf ? 'self' : ''}"
                 data-id="${p.id}">
                <label class="participant-checkbox">
                    <input type="checkbox"
                           ${p.selected ? 'checked' : ''}
                           ${p.isSelf ? 'disabled' : ''}
                           data-participant-id="${p.id}">
                    <span class="checkmark"></span>
                </label>

                <div class="participant-info">
                    <div class="participant-name">
                        ${this.escapeHtml(p.name)}
                        ${p.isSelf ? '<span class="self-badge">You</span>' : ''}
                    </div>
                    <div class="participant-status">
                        ${p.stream ? '🎤 Active' : '⭕ No audio'}
                    </div>
                </div>

                ${p.selected ? '<div class="selected-indicator">✓</div>' : ''}
            </div>
        `).join('');

        // Attach event listeners
        this.attachEventListeners();

        // Update header if exists
        this.updateHeader();
    }

    /**
     * Attach event listeners to checkboxes
     */
    attachEventListeners() {
        if (!this.listElement) return;

        const checkboxes = this.listElement.querySelectorAll('input[type="checkbox"]');

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const participantId = e.target.dataset.participantId;
                this.toggleParticipant(participantId);
            });
        });
    }

    /**
     * Update header with selection count
     */
    updateHeader() {
        const header = this.container?.querySelector('.participant-header');

        if (!header) return;

        const selectedCount = this.selectedParticipants.size;
        const totalCount = this.participants.size;

        header.querySelector('.selection-count').textContent =
            `${selectedCount} of ${totalCount} selected`;
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Clear all participants
     */
    clear() {
        this.participants.clear();
        this.selectedParticipants.clear();
        this.render();

        logger.log('Cleared all participants');

        globalEvents.emit('participant-selector:cleared');
    }

    /**
     * Get participant by ID
     */
    getParticipant(participantId) {
        return this.participants.get(participantId);
    }

    /**
     * Export current selection state
     */
    exportState() {
        return {
            participants: Array.from(this.participants.values()),
            selected: Array.from(this.selectedParticipants)
        };
    }

    /**
     * Import selection state
     */
    importState(state) {
        this.clear();

        if (state.participants) {
            state.participants.forEach(p => {
                this.participants.set(p.id, { ...p });
            });
        }

        if (state.selected) {
            state.selected.forEach(id => {
                this.selectedParticipants.add(id);
                const participant = this.participants.get(id);
                if (participant) {
                    participant.selected = true;
                }
            });
        }

        this.render();

        logger.log('Imported participant state');
    }
}

export default ParticipantSelector;
