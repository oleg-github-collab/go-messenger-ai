/**
 * Video Controls - UI controls for video elements
 * @module ui/video-controls
 */

import { Logger } from '../core/logger.js';
import { $ } from '../core/dom.js';

const logger = new Logger('UI:VIDEO');

export class VideoControls {
    constructor() {
        this.localVideo = null;
        this.remoteVideo = null;
        this.localPlaceholder = null;
        this.remotePlaceholder = null;
    }

    /**
     * Initialize video elements
     */
    init(config = {}) {
        this.localVideo = $(config.localVideo || '#localVideo');
        this.remoteVideo = $(config.remoteVideo || '#remoteVideo');
        this.localPlaceholder = $(config.localPlaceholder || '#localPlaceholder');
        this.remotePlaceholder = $(config.remotePlaceholder || '#remotePlaceholder');

        if (this.localVideo) {
            logger.log('Local video element found');
        }

        if (this.remoteVideo) {
            logger.log('Remote video element found');
        }
    }

    /**
     * Attach stream to local video element
     */
    attachLocalStream(stream) {
        if (!this.localVideo) {
            logger.error('Local video element not found');
            return false;
        }

        try {
            this.localVideo.srcObject = stream;
            this.localVideo.muted = true; // Always mute local video to prevent feedback

            // Hide placeholder
            if (this.localPlaceholder) {
                this.localPlaceholder.style.display = 'none';
            }

            logger.success('Local stream attached to video element');
            return true;

        } catch (error) {
            logger.error('Failed to attach local stream:', error);
            return false;
        }
    }

    /**
     * Attach stream to remote video element
     */
    attachRemoteStream(stream) {
        if (!this.remoteVideo) {
            logger.error('Remote video element not found');
            return false;
        }

        try {
            this.remoteVideo.srcObject = stream;

            // Hide placeholder
            if (this.remotePlaceholder) {
                this.remotePlaceholder.style.display = 'none';
            }

            logger.success('Remote stream attached to video element');
            return true;

        } catch (error) {
            logger.error('Failed to attach remote stream:', error);
            return false;
        }
    }

    /**
     * Show/hide local video placeholder
     */
    showLocalPlaceholder(show = true) {
        if (this.localPlaceholder) {
            this.localPlaceholder.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * Show/hide remote video placeholder
     */
    showRemotePlaceholder(show = true) {
        if (this.remotePlaceholder) {
            this.remotePlaceholder.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * Toggle Picture-in-Picture mode for local video
     */
    async togglePiP() {
        if (!this.localVideo) return false;

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                logger.log('Exited PiP mode');
            } else {
                await this.localVideo.requestPictureInPicture();
                logger.log('Entered PiP mode');
            }
            return true;

        } catch (error) {
            logger.error('PiP toggle failed:', error);
            return false;
        }
    }

    /**
     * Toggle fullscreen for remote video
     */
    async toggleFullscreen() {
        if (!this.remoteVideo) return false;

        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
                logger.log('Exited fullscreen');
            } else {
                await this.remoteVideo.requestFullscreen();
                logger.log('Entered fullscreen');
            }
            return true;

        } catch (error) {
            logger.error('Fullscreen toggle failed:', error);
            return false;
        }
    }

    /**
     * Clear all video streams
     */
    clearStreams() {
        if (this.localVideo) {
            this.localVideo.srcObject = null;
            this.showLocalPlaceholder(true);
        }

        if (this.remoteVideo) {
            this.remoteVideo.srcObject = null;
            this.showRemotePlaceholder(true);
        }

        logger.log('Video streams cleared');
    }
}

export default VideoControls;
