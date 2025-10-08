/**
 * ICE Configuration - STUN/TURN servers for WebRTC connectivity
 * @module webrtc/ice-config
 */

import { Logger } from '../core/logger.js';

const logger = new Logger('WEBRTC:ICE');

/**
 * Default ICE configuration optimized for Germany-Ukraine connections
 */
export const DEFAULT_ICE_CONFIG = {
    iceServers: [
        // Multiple STUN servers for redundancy
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },

        // Cloudflare TURN (global anycast - excellent for EU-UA)
        {
            urls: [
                'turn:turn.cloudflare.com:3478',
                'turn:turn.cloudflare.com:3478?transport=tcp',
                'turns:turn.cloudflare.com:5349?transport=tcp'
            ],
            username: 'cloudflare',
            credential: 'cloudflare'
        },

        // Twilio TURN (multi-region with EU presence)
        {
            urls: [
                'turn:global.turn.twilio.com:3478?transport=udp',
                'turn:global.turn.twilio.com:3478?transport=tcp',
                'turn:global.turn.twilio.com:443?transport=tcp'
            ],
            username: 'free',
            credential: 'free'
        },

        // OpenRelay (Canada, but reliable fallback)
        {
            urls: [
                'turn:openrelay.metered.ca:80',
                'turn:openrelay.metered.ca:443',
                'turn:openrelay.metered.ca:443?transport=tcp'
            ],
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },

        // Metered (multiple regions)
        {
            urls: [
                'turn:a.relay.metered.ca:80',
                'turn:a.relay.metered.ca:80?transport=tcp',
                'turn:a.relay.metered.ca:443',
                'turns:a.relay.metered.ca:443?transport=tcp'
            ],
            username: 'e8b7cb41726a21f41ffa0deb',
            credential: 'M0xzGvuqQJFeKvIv'
        },

        // Numb TURN (Europe)
        {
            urls: [
                'turn:numb.viagenie.ca:3478',
                'turn:numb.viagenie.ca:3478?transport=tcp'
            ],
            username: 'webrtc@live.com',
            credential: 'muazkh'
        },

        // Stunprotocol (another reliable option)
        {
            urls: 'turn:turn.stunprotocol.org:3478',
            username: 'free',
            credential: 'free'
        }
    ],
    iceCandidatePoolSize: 20, // Increased for better candidate gathering
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceTransportPolicy: 'all' // Use both STUN and TURN aggressively
};

/**
 * Load TURN credentials from server and merge with default config
 */
export async function loadTURNCredentials() {
    try {
        logger.log('Loading TURN credentials from server...');

        const response = await fetch('/api/turn-credentials');

        if (!response.ok) {
            logger.warn('Failed to load TURN credentials, using defaults');
            return DEFAULT_ICE_CONFIG;
        }

        const data = await response.json();

        if (!data || !data.iceServers) {
            logger.warn('Invalid TURN credentials response');
            return DEFAULT_ICE_CONFIG;
        }

        // Merge server credentials with defaults
        const config = {
            ...DEFAULT_ICE_CONFIG,
            iceServers: [
                ...DEFAULT_ICE_CONFIG.iceServers,
                ...data.iceServers
            ]
        };

        logger.success(`Loaded ${data.iceServers.length} additional TURN servers`);
        return config;

    } catch (error) {
        logger.error('Error loading TURN credentials:', error);
        return DEFAULT_ICE_CONFIG;
    }
}

/**
 * Get ICE configuration with optional custom TURN servers
 */
export async function getICEConfiguration(customTURN = null) {
    let config = DEFAULT_ICE_CONFIG;

    // Load from server if not provided
    if (!customTURN) {
        config = await loadTURNCredentials();
    } else if (customTURN.iceServers) {
        // Use custom TURN config
        config = {
            ...DEFAULT_ICE_CONFIG,
            iceServers: [
                ...DEFAULT_ICE_CONFIG.iceServers,
                ...customTURN.iceServers
            ]
        };
    }

    logger.debug('ICE configuration ready:', {
        servers: config.iceServers.length,
        poolSize: config.iceCandidatePoolSize
    });

    return config;
}

export default {
    DEFAULT_ICE_CONFIG,
    loadTURNCredentials,
    getICEConfiguration
};
