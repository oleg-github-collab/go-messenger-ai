// Force links to open in external browser
(function() {
    'use strict';

    console.log('[BROWSER] Force browser script loaded');

    // Detect if running in in-app browser
    function isInAppBrowser() {
        const ua = navigator.userAgent || navigator.vendor || window.opera;

        // Telegram
        if (ua.includes('Telegram')) {
            console.log('[BROWSER] Detected: Telegram');
            return {inApp: true, app: 'Telegram'};
        }

        // Facebook
        if (ua.includes('FBAN') || ua.includes('FBAV')) {
            console.log('[BROWSER] Detected: Facebook');
            return {inApp: true, app: 'Facebook'};
        }

        // Instagram
        if (ua.includes('Instagram')) {
            console.log('[BROWSER] Detected: Instagram');
            return {inApp: true, app: 'Instagram'};
        }

        // Twitter
        if (ua.includes('Twitter')) {
            console.log('[BROWSER] Detected: Twitter');
            return {inApp: true, app: 'Twitter'};
        }

        // LinkedIn
        if (ua.includes('LinkedInApp')) {
            console.log('[BROWSER] Detected: LinkedIn');
            return {inApp: true, app: 'LinkedIn'};
        }

        // WhatsApp
        if (ua.includes('WhatsApp')) {
            console.log('[BROWSER] Detected: WhatsApp');
            return {inApp: true, app: 'WhatsApp'};
        }

        // Line
        if (ua.includes('Line')) {
            console.log('[BROWSER] Detected: Line');
            return {inApp: true, app: 'Line'};
        }

        // Viber
        if (ua.includes('Viber')) {
            console.log('[BROWSER] Detected: Viber');
            return {inApp: true, app: 'Viber'};
        }

        console.log('[BROWSER] No in-app browser detected');
        return {inApp: false, app: null};
    }

    const browserInfo = isInAppBrowser();

    // Only show banner on login/home pages, NOT during active calls
    const isInCall = window.location.pathname.includes('/call') ||
                     window.location.pathname.includes('/room') ||
                     window.location.pathname.includes('/group-call');

    // Show banner if in in-app browser AND not in an active call
    if (browserInfo.inApp && !isInCall) {
        const currentUrl = window.location.href;
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

        // Create external browser URL
        let externalUrl;
        if (isIOS) {
            externalUrl = currentUrl;
        } else {
            externalUrl = currentUrl;
        }

        const banner = document.createElement('div');
        banner.id = 'open-in-browser-banner';
        banner.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px;
                text-align: center;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                animation: slideDown 0.3s ease;
            ">
                <div style="font-weight: 600; margin-bottom: 8px; font-size: 16px;">
                    ⚠️ Open in ${isIOS ? 'Safari' : 'Browser'} for Best Experience
                </div>
                <div style="font-size: 14px; opacity: 0.95; margin-bottom: 12px;">
                    Video calls may not work properly in ${browserInfo.app}. Please use your default browser.
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="window.open('${externalUrl}', '_blank'); this.parentElement.parentElement.parentElement.remove();" style="
                        background: white;
                        border: none;
                        color: #667eea;
                        padding: 10px 24px;
                        border-radius: 24px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 14px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    ">
                        Open in Browser
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                        background: rgba(255,255,255,0.2);
                        border: 1px solid rgba(255,255,255,0.3);
                        color: white;
                        padding: 8px 20px;
                        border-radius: 20px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 14px;
                    ">
                        Continue Anyway
                    </button>
                </div>
            </div>
            <style>
                @keyframes slideDown {
                    from { transform: translateY(-100%); }
                    to { transform: translateY(0); }
                }
            </style>
        `;
        document.body.insertBefore(banner, document.body.firstChild);

        console.log('[BROWSER] Showing in-app browser warning. User can manually open in external browser.');
    }

    // Force all external links to open in browser
    document.addEventListener('DOMContentLoaded', () => {
        document.addEventListener('click', (e) => {
            let target = e.target;

            // Find closest anchor tag
            while (target && target.tagName !== 'A') {
                target = target.parentElement;
            }

            if (target && target.tagName === 'A' && target.href) {
                const href = target.href;

                // External links (not same origin)
                if (!href.startsWith(window.location.origin) &&
                    (href.startsWith('http://') || href.startsWith('https://'))) {
                    e.preventDefault();

                    if (browserInfo.inApp) {
                        // Try to open in external browser
                        window.open(href, '_blank', 'noopener,noreferrer');
                    } else {
                        window.open(href, '_blank', 'noopener,noreferrer');
                    }

                    console.log('[BROWSER] Forcing external link to browser:', href);
                }
            }
        }, true);
    });
})();
