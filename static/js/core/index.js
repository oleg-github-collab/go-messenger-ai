/**
 * Core Module - Main entry point for all core utilities
 * @module core
 */

export { Logger, loggers } from './logger.js';
export { Storage, localStore, sessionStore } from './storage.js';
export { EventEmitter, globalEvents } from './events.js';
export { Api, api, ApiError } from './api.js';
export * as dom from './dom.js';

// Re-export everything as default object
export default {
    Logger,
    loggers,
    Storage,
    localStore,
    sessionStore,
    EventEmitter,
    globalEvents,
    Api,
    api,
    ApiError,
    dom
};
