# Daily.co UI/UX Customization Guide

## Available Customization Options

Daily.co provides several ways to customize the UI to match your brand:

### 1. **Theme Colors** (Already Implemented ✅)

Currently in `group-call-daily.html`:

```javascript
theme: {
    colors: {
        accent: '#4ECDC4',           // Primary action color
        accentText: '#FFFFFF',       // Text on accent backgrounds
        background: '#1a1a1a',       // Main background
        backgroundAccent: '#2a2a2a', // Secondary backgrounds
        baseText: '#FFFFFF',         // Primary text
        border: '#3a3a3a',           // Border colors
        mainAreaBg: '#1a1a1a',       // Video area background
        mainAreaBgAccent: '#2a2a2a', // Video area accents
        mainAreaText: '#FFFFFF',     // Video area text
        supportiveText: '#999999'    // Secondary text
    }
}
```

### 2. **Hide/Show UI Elements**

```javascript
DailyIframe.createFrame(container, {
    // Control which UI elements are visible
    showLeaveButton: true,           // Show/hide leave button
    showFullscreenButton: true,      // Show/hide fullscreen
    showLocalVideo: true,            // Show/hide self-view
    showParticipantsBar: true,       // Show/hide participants list

    // Additional controls
    showRecordingButton: false,      // Recording button (requires paid plan)
    showScreenShareButton: true,     // Screen share button
    showChatButton: true,            // Built-in chat
    showBackgroundBlurButton: true,  // Background blur (requires paid plan)

    // Header/footer
    showUserNameChangeButton: false, // Prevent name changes
    activeSpeakerMode: false         // Pin active speaker
});
```

### 3. **Custom Buttons in Tray**

Add your own buttons to the control bar:

```javascript
customTrayButtons: {
    'myCustomButton': {
        iconPath: 'https://your-domain.com/icon.svg',
        iconPathDarkMode: 'https://your-domain.com/icon-dark.svg',
        label: 'Custom Action',
        tooltip: 'Click to do something'
    }
}
```

Listen for clicks:

```javascript
callFrame.on('custom-button-click', (event) => {
    if (event.button_id === 'myCustomButton') {
        // Your custom action
        console.log('Custom button clicked!');
    }
});
```

### 4. **Custom Layout Modes**

```javascript
callFrame.setLayout({
    layout: 'grid',  // 'grid', 'speaker', 'single-speaker'
    maxTiles: 25     // Max participants visible
});
```

### 5. **CSS Injection (Limited)**

You **CANNOT** directly style inside Daily.co iframe due to security restrictions.

However, you CAN:

**A) Style the container:**
```css
#dailyFrame {
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
```

**B) Add overlays on top:**
```html
<div style="position: relative;">
    <div id="dailyFrame"></div>
    <div style="position: absolute; top: 20px; left: 20px; z-index: 1000;">
        <!-- Your custom overlay UI -->
        <button>Custom Button</button>
    </div>
</div>
```

### 6. **Video Quality Settings**

```javascript
callFrame.updateInputSettings({
    video: {
        width: 1280,
        height: 720,
        frameRate: 30,
        facingMode: 'user' // or 'environment'
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    }
});
```

### 7. **Prejoin UI Customization**

Control the prejoin screen experience:

```javascript
DailyIframe.createFrame(container, {
    showPrejoinUI: true,           // Show device test screen
    startVideoOff: false,          // Start with camera on
    startAudioOff: false,          // Start with mic on
    customPrejoinUI: true          // Use your own prejoin (advanced)
});
```

### 8. **Event-Based UI Updates**

React to call events to update your own UI:

```javascript
// Participant joined
callFrame.on('participant-joined', (event) => {
    console.log('Participant joined:', event.participant.user_name);
    updateParticipantCount();
});

// Active speaker changed
callFrame.on('active-speaker-change', (event) => {
    console.log('Active speaker:', event.activeSpeaker.user_name);
    highlightSpeaker(event.activeSpeaker);
});

// Recording state
callFrame.on('recording-started', () => {
    showRecordingIndicator();
});

// Network quality
callFrame.on('network-quality-change', (event) => {
    updateNetworkIndicator(event.quality);
});
```

---

## What You CANNOT Customize

Due to iframe security restrictions:

❌ **Cannot change Daily.co branding** (on free plan)
❌ **Cannot inject CSS into iframe directly**
❌ **Cannot modify internal Daily.co components**
❌ **Cannot access iframe DOM**

---

## Recommended Approach for Your App

### Option A: Enhanced Iframe (Current Approach)

Keep Daily.co iframe but add custom UI around it:

```javascript
<div class="call-wrapper">
    <!-- Your custom header -->
    <div class="custom-header">
        <h2>Group Call - kaminskyi.chat</h2>
        <button onclick="copyLink()">Share</button>
    </div>

    <!-- Daily.co iframe -->
    <div id="dailyFrame"></div>

    <!-- Your custom controls -->
    <div class="custom-controls">
        <button onclick="toggleRecording()">Record</button>
        <button onclick="showParticipants()">Participants</button>
    </div>
</div>
```

**Pros:**
- Reliable video/audio
- Automatic updates
- Cross-browser compatibility
- Quick to implement

**Cons:**
- Less UI control
- Daily.co branding visible (free plan)
- Iframe limitations

### Option B: Custom UI with Daily.co Core SDK (Advanced)

Use `@daily-co/daily-js` to build completely custom UI:

```javascript
import DailyIframe from '@daily-co/daily-js';

// Create "invisible" call object
const callObject = DailyIframe.createCallObject({
    audioSource: true,
    videoSource: true
});

// Join call
await callObject.join({ url: roomUrl });

// Get video tracks manually
const participants = callObject.participants();
Object.values(participants).forEach(participant => {
    const videoTrack = participant.tracks.video.persistentTrack;
    const audioTrack = participant.tracks.audio.persistentTrack;

    // Attach to YOUR custom video element
    const videoElement = document.createElement('video');
    videoElement.srcObject = new MediaStream([videoTrack]);
    videoElement.play();
});
```

**Pros:**
- Complete UI control
- Custom layouts
- Your branding only
- No iframe restrictions

**Cons:**
- More complex implementation
- Need to handle all UI logic
- More maintenance
- Still uses Daily.co infrastructure

---

## Immediate Improvements You Can Make

### 1. Better Theme Matching

Update colors to match your app exactly:

```javascript
theme: {
    colors: {
        accent: '#667eea',        // Your purple gradient start
        accentText: '#FFFFFF',
        background: '#0a0a0a',    // Darker background
        backgroundAccent: '#1a1a1a',
        baseText: '#FFFFFF',
        border: '#667eea',        // Purple borders
        mainAreaBg: '#000000',    // Pure black for video area
        mainAreaBgAccent: '#1a1a1a',
        mainAreaText: '#FFFFFF',
        supportiveText: '#888888'
    }
}
```

### 2. Hide Unnecessary Buttons

```javascript
DailyIframe.createFrame(container, {
    showLeaveButton: true,
    showFullscreenButton: true,
    showLocalVideo: true,
    showParticipantsBar: true,

    // Hide these:
    showRecordingButton: false,     // We don't have recording on free plan
    showChatButton: false,          // We have our own chat
    showUserNameChangeButton: false // Prevent name changes mid-call
});
```

### 3. Add Custom Overlays

```html
<div style="position: relative;">
    <div id="dailyFrame"></div>

    <!-- Custom branding overlay -->
    <div style="position: absolute; top: 10px; left: 10px; z-index: 1000;">
        <img src="/logo.png" style="height: 40px; opacity: 0.8;">
    </div>

    <!-- Custom participant counter -->
    <div style="position: absolute; top: 10px; right: 10px; z-index: 1000; background: rgba(0,0,0,0.7); padding: 8px 16px; border-radius: 20px;">
        <span id="participantCount">👥 2 participants</span>
    </div>
</div>
```

### 4. Custom Recording Indicator

```javascript
callFrame.on('recording-started', () => {
    // Show custom recording indicator
    const indicator = document.createElement('div');
    indicator.innerHTML = '🔴 Recording';
    indicator.style = 'position: absolute; top: 60px; left: 10px; background: red; color: white; padding: 6px 12px; border-radius: 20px;';
    document.body.appendChild(indicator);
});
```

---

## Summary

**What you can customize easily:**
✅ Theme colors (already done)
✅ Show/hide built-in buttons
✅ Add custom buttons to tray
✅ Add overlays on top of iframe
✅ Video/audio quality settings
✅ Event-based custom UI

**For maximum control:**
- Use Daily.co Core SDK with custom UI (advanced)
- Build your own video grid
- Full branding control
- Requires significantly more code

**Recommendation:**
Start with enhanced iframe approach (Option A) - it's 80% customizable with 20% effort.
