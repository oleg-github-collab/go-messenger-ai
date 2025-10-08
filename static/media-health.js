(function() {
    'use strict';

    const SEVERITY_WEIGHT = {
        error: 3,
        warning: 2,
        info: 1
    };

    function buildIssue(type, severity, message) {
        return { type, severity, message };
    }

    function resolveStatus(issues) {
        if (!issues || issues.length === 0) {
            return { status: 'ok', message: 'Devices ready' };
        }

        const sorted = [...issues].sort((a, b) => {
            return (SEVERITY_WEIGHT[b.severity] || 0) - (SEVERITY_WEIGHT[a.severity] || 0);
        });

        const top = sorted[0];
        const status = top.severity === 'error' ? 'error' : 'warning';
        return {
            status,
            message: top.message || (status === 'error' ? 'Device error detected' : 'Check device settings')
        };
    }

    async function enumerateDevicesSafe() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            return { devices: [], error: new Error('enumerateDevices not supported') };
        }

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return { devices };
        } catch (error) {
            return { devices: [], error };
        }
    }

    function analyseTrack(track, expects, kind) {
        const issues = [];

        if (!track) {
            if (expects) {
                issues.push(buildIssue(`${kind}_track_missing`, 'error', kind === 'audio' ? 'Microphone track not available' : 'Camera track not available'));
            }
            return issues;
        }

        if (track.readyState !== 'live') {
            issues.push(buildIssue(`${kind}_track_inactive`, 'error', kind === 'audio' ? 'Microphone disconnected' : 'Camera disconnected'));
        }

        if (track.muted) {
            issues.push(buildIssue(`${kind}_track_muted`, 'warning', kind === 'audio' ? 'Microphone muted by system' : 'Camera muted by system'));
        }

        if (!track.enabled && expects) {
            issues.push(buildIssue(`${kind}_track_disabled`, 'warning', kind === 'audio' ? 'Microphone disabled' : 'Camera disabled'));
        }

        return issues;
    }

    async function analyseStream(stream, context = 'direct', options = {}) {
        const detail = {
            context,
            timestamp: Date.now(),
            expectsAudio: options.expectsAudio !== false,
            expectsVideo: options.expectsVideo !== false,
            issues: [],
            audioInputs: 0,
            videoInputs: 0,
            audioOutputs: 0,
            status: 'ok',
            message: 'Devices ready'
        };

        const { devices, error: devicesError } = await enumerateDevicesSafe();
        if (devices && devices.length) {
            detail.audioInputs = devices.filter(d => d.kind === 'audioinput').length;
            detail.videoInputs = devices.filter(d => d.kind === 'videoinput').length;
            detail.audioOutputs = devices.filter(d => d.kind === 'audiooutput').length;
        } else if (devicesError) {
            detail.issues.push(buildIssue('device_enumeration_failed', 'warning', 'Unable to enumerate devices'));
        }

        if (detail.expectsAudio && detail.audioInputs === 0) {
            detail.issues.push(buildIssue('microphone_missing', 'error', 'No microphone detected'));
        }

        if (detail.expectsVideo && detail.videoInputs === 0) {
            detail.issues.push(buildIssue('camera_missing', 'error', 'No camera detected'));
        }

        const audioTrack = stream ? stream.getAudioTracks()[0] : null;
        const videoTrack = stream ? stream.getVideoTracks()[0] : null;

        detail.issues.push(...analyseTrack(audioTrack, detail.expectsAudio, 'audio'));
        detail.issues.push(...analyseTrack(videoTrack, detail.expectsVideo, 'video'));

        const summary = resolveStatus(detail.issues);
        detail.status = summary.status;
        detail.message = summary.message;

        dispatch(detail);
        return detail;
    }

    function dispatch(detail) {
        try {
            window.dispatchEvent(new CustomEvent('media-health', { detail }));
        } catch (error) {
            console.warn('[MEDIA-HEALTH] Failed to dispatch event:', error);
        }
    }

    window.MediaHealth = {
        analyseStream,
        analyzeStream: analyseStream,
        dispatch
    };
})();
