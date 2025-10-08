/**
 * Event Emitter - Simple pub/sub pattern for inter-module communication
 * @module core/events
 */

export class EventEmitter {
    constructor() {
        this.events = new Map();
    }

    on(event, handler) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(handler);
        return () => this.off(event, handler);
    }

    off(event, handler) {
        if (!this.events.has(event)) return;

        const handlers = this.events.get(event);
        const index = handlers.indexOf(handler);

        if (index !== -1) {
            handlers.splice(index, 1);
        }

        if (handlers.length === 0) {
            this.events.delete(event);
        }
    }

    emit(event, ...args) {
        if (!this.events.has(event)) return;

        this.events.get(event).forEach(handler => {
            try {
                handler(...args);
            } catch (error) {
                console.error(`[EventEmitter] Error in handler for "${event}":`, error);
            }
        });
    }

    once(event, handler) {
        const onceHandler = (...args) => {
            handler(...args);
            this.off(event, onceHandler);
        };
        this.on(event, onceHandler);
    }

    clear(event) {
        if (event) {
            this.events.delete(event);
        } else {
            this.events.clear();
        }
    }

    listenerCount(event) {
        return this.events.has(event) ? this.events.get(event).length : 0;
    }
}

// Global event bus for cross-module communication
export const globalEvents = new EventEmitter();

export default EventEmitter;
