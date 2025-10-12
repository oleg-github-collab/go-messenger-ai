/**
 * 100ms SDK Browser Wrapper
 * Wraps CommonJS module for browser use
 */

(function(window) {
    'use strict';

    console.log('[HMS-WRAPPER] Loading SDK...');

    // Create module/exports stubs for CJS
    var module = { exports: {} };
    var exports = module.exports;

    // Load the CJS bundle
    var script = document.createElement('script');
    script.src = '/static/js/hms.umd.js';
    script.onload = function() {
        console.log('[HMS-WRAPPER] ✅ CJS file loaded');

        // The CJS bundle should have populated module.exports
        if (module.exports && module.exports.HMSReactiveStore) {
            window.HMSReactiveStore = module.exports.HMSReactiveStore;
            console.log('[HMS-WRAPPER] ✅ HMSReactiveStore available');
        } else {
            console.error('[HMS-WRAPPER] ❌ HMSReactiveStore not found in exports');
            console.log('[HMS-WRAPPER] Available exports:', Object.keys(module.exports || {}));
        }
    };
    script.onerror = function(error) {
        console.error('[HMS-WRAPPER] ❌ Failed to load CJS file:', error);
    };

    document.head.appendChild(script);

})(window);
