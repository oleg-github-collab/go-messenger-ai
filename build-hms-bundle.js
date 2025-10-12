#!/usr/bin/env node

/**
 * Build browser bundle for 100ms SDK
 * This creates a UMD bundle that works in browsers
 */

const fs = require('fs');
const path = require('path');

console.log('Building 100ms SDK browser bundle...');

// Import the SDK
const HMS = require('@100mslive/hms-video-store');

// Create UMD wrapper
const umdWrapper = `
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // CommonJS
        module.exports = factory();
    } else {
        // Browser globals
        var exports = factory();
        for (var key in exports) {
            root[key] = exports[key];
        }
    }
}(typeof self !== 'undefined' ? self : this, function() {
    // The SDK exports
    return ${JSON.stringify(Object.keys(HMS))};
}));
`;

// For browser, we need to expose HMSReactiveStore
const browserBundle = `
(function(window) {
    'use strict';

    console.log('[HMS-BUNDLE] Loading 100ms SDK...');

    // We can't directly bundle CJS in browser, so we'll load via script tag approach
    // This file serves as a loader

    var module = { exports: {} };
    var exports = module.exports;
    var require = function(name) {
        console.error('[HMS-BUNDLE] require() called for:', name);
        throw new Error('require() not available in browser');
    };

    // Load the actual SDK
    var script = document.createElement('script');
    script.src = '/static/js/hms-sdk-bundle.js';
    script.async = false;

    script.onload = function() {
        console.log('[HMS-BUNDLE] ✅ SDK file loaded');

        // Export to window
        if (typeof module.exports === 'object') {
            Object.keys(module.exports).forEach(function(key) {
                window[key] = module.exports[key];
            });
            console.log('[HMS-BUNDLE] ✅ Exported:', Object.keys(module.exports).join(', '));
        }
    };

    script.onerror = function() {
        console.error('[HMS-BUNDLE] ❌ Failed to load SDK');
    };

    document.head.appendChild(script);

})(window);
`;

// Write browser loader
const outputPath = path.join(__dirname, 'static', 'js', 'hms-loader.js');
fs.writeFileSync(outputPath, browserBundle);

console.log('✅ Browser loader created at:', outputPath);
console.log('\nAvailable exports from SDK:');
console.log(Object.keys(HMS).slice(0, 10).join(', '), '...');
