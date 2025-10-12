/**
 * Simple entry point to bundle 100ms SDK for browser
 */

import { HMSReactiveStore } from '@100mslive/hms-video-store';

// Expose to window
window.HMSReactiveStore = HMSReactiveStore;

console.log('[HMS] SDK loaded via webpack bundle');
