# Legacy Code Archive

This folder contains deprecated code that is no longer actively used in the application but kept for reference.

## Moved Files

### HTML Files (Deprecated)
- `audio-call.html` - Old audio call page (replaced by call.html with audioOnly param)
- `professional-mode.html` - Old professional mode (replaced by professional-1on1.html)
- `professional-audio.html` - Duplicate professional mode variant
- `landing-improved.html` - Old landing page iteration
- `group-call-daily-BACKUP.html` - Backup of group call page
- `group-call-daily-FIXED.html` - Old fixed version
- `call-modular.html` - Modular architecture experiment
- `group-call-modular.html` - Modular group call variant
- `guest-modular.html` - Modular guest page
- `test-modular.html` - Modular testing page
- `notetaker-ui-component.html` - Standalone notetaker component
- `notetaker-modals.html` - Standalone notetaker modals
- `notetaker-panel.html` - Standalone notetaker panel

### JavaScript Files (Deprecated)
- `emoji-gif-picker.js` - Old combined picker (replaced by enhanced-gif-picker.js)
- `notetaker-ui-manager.js` - Old notetaker UI manager
- `notetaker-panel-close.js` - Old panel close handler
- `notetaker-whisper-integration.js` - Old Whisper integration

### HMS SDK Files (Duplicates)
- `hms-sdk-skypack.js` - Skypack CDN version
- `hms-sdk.js` - Alternative SDK version
- `hms-browser.js` - Browser-specific variant
- `hms.umd.js` - UMD module version
- `hms-sdk-umd.js` - Alternative UMD version

**Active:** `hms-bundle.js` only

### Professional Mode Files (Replaced)
- `professional-1on1/logger.js` - Replaced by console logging
- `professional-1on1/direct-hms.js` - Old direct HMS integration
- `professional-1on1/prebuilt-app.js` - Prebuilt component attempt
- `professional-1on1/app.js` - Old app structure
- `professional-1on1/main.js` - Old main entry point
- `professional-1on1/main-simple.js` - Simplified variant
- `professional-1on1/hms-integration.js` - Old integration approach
- `professional-1on1/i18n.js` - Internationalization (not implemented)
- `professional-mode/` - Entire old professional mode folder

**Active:** `hms-sdk-integration.js`, `ui-controller.js`, `enhanced-chat.js`, `professional-notetaker.js`, `recording-integration.js`, `integration-patch.js`

### CSS Files (Replaced)
- `professional-1on1-mobile-clean.css` - Old mobile styles (replaced by professional-mobile-native.css)

## Current Active Modes

### 1. **1-on-1 Video Mode** (`call.html`)
- Native WebRTC with custom signaling
- Works for both video and audio-only (with audioOnly param)
- Files: `call.js`, `webrtc.js`

### 2. **Guest Mode** (`guest.html`)
- Join existing meetings
- Share link access

### 3. **Group Call Mode** (`group-call-daily.html`)
- Uses Daily.co API for group video
- Mobile enhancements (wake lock, PiP)
- Files: `group-chat-advanced.js`, `js/group-mobile-enhancements.js`

### 4. **Professional AI Mode** (`professional-1on1.html`)
- 100ms HMS SDK integration
- AI Notetaker with recording
- Enhanced chat (GIFs, reactions, reply/quote)
- Files: `js/professional-1on1/hms-sdk-integration.js`, `js/professional-1on1/ui-controller.js`, `js/professional-1on1/enhanced-chat.js`, `js/professional-1on1/professional-notetaker.js`, `js/professional-1on1/recording-integration.js`

## Migration Notes

If you need to restore any legacy functionality:
1. Check this README for the purpose of the file
2. Review the replacement implementation in active code
3. Test thoroughly before moving back to active directory

## Date Archived
October 17, 2025
