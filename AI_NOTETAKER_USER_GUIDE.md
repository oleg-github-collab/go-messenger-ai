# 🤖 AI Notetaker - User Guide

## Overview
AI Notetaker is an integrated feature that automatically transcribes your meetings and generates intelligent summaries using OpenAI GPT-4.

---

## How to Use (Host Only)

### 1. Start Recording
1. **During a 1-on-1 call**, click the **three dots menu (⋮)** in the bottom control bar
2. In the settings panel, you'll see **🤖 AI Notetaker**
3. Click **"Start Recording"** button
4. The button will turn red with a pulsing animation 🔴
5. Status will show **"Recording in progress..."**

### 2. During Recording
- The system automatically captures audio and transcribes speech in real-time
- Uses **Web Speech Recognition API** (browser-based, no audio leaves your device until analysis)
- Continue your meeting normally - the notetaker works silently in the background
- You can open/close the settings menu - recording continues

### 3. Stop Recording
1. Open the **three dots menu** again
2. Click **"Stop Recording"** button
3. The system will:
   - Stop audio capture
   - Finalize the transcript
   - Show "Processing transcript..." status

### 4. AI Analysis
After stopping:
1. A modal window automatically opens showing:
   - **Loading spinner** - "Analyzing meeting with AI..."
   - **OpenAI GPT-4o-mini** processes the transcript (typically 10-30 seconds)

2. Once complete, you'll see:
   - **📋 Executive Summary** - 2-3 sentence overview
   - **💡 Key Discussion Points** - Important topics discussed
   - **✅ Action Items & Decisions** - What needs to be done
   - **📄 Full Transcript** - Complete text of the conversation

### 5. Export Options

#### Download DOCX
- Click **"Download DOCX"** button
- Generates a formatted Word document with:
  - Meeting date/time
  - Executive summary
  - Key points
  - Action items
  - Full transcript
- Filename: `meeting-analysis-YYYY-MM-DD.doc`

#### Copy to Clipboard
- Click **"Copy to Clipboard"** button
- Copies the entire analysis as formatted text
- Paste into email, Slack, notes, etc.

---

## Technical Details

### What Gets Recorded?
- **Audio transcription** via Web Speech Recognition API
- **Text-based transcript** (no audio files stored on server)
- **Meeting metadata**: duration, participants

### AI Analysis
- **Model**: OpenAI GPT-4o-mini
- **Cost**: ~$0.01-0.05 per meeting (depending on length)
- **Privacy**: Transcript sent to OpenAI API for analysis
- **Processing time**: 10-60 seconds depending on transcript length

### Data Storage
- **Temporary**: Session data stored in memory during recording
- **No long-term storage**: Transcripts deleted after export
- **No audio files**: Only text transcripts are processed

---

## Browser Compatibility

### ✅ Fully Supported
- **Chrome** (recommended)
- **Edge** (Chromium-based)
- **Safari** (macOS/iOS)

### ⚠️ Limited Support
- **Firefox** - Speech Recognition may not work
- **Opera** - May require enabling experimental features

### 💡 Recommendation
Use **Chrome** or **Safari** for the best experience with AI Notetaker.

---

## Use Cases

### 1. **Client Calls**
- Capture commitments and requirements
- Generate follow-up email with action items
- Keep accurate record of discussions

### 2. **Team Meetings**
- Distribute meeting notes automatically
- Track decisions and responsibilities
- Searchable archive of all meetings

### 3. **Interviews**
- Transcribe candidate responses
- Review key points later
- Share with hiring team

### 4. **Sales Calls**
- Document prospect needs
- Track objections and responses
- Generate CRM notes

---

## Privacy & Security

### Host-Only Feature
- Only the **meeting host** can activate AI Notetaker
- Guests **cannot** start recording
- Transparent indicator shows when recording is active

### Data Flow
1. **Browser** → Speech-to-text (local)
2. **Text transcript** → Your server (temporary)
3. **Transcript** → OpenAI API (for analysis)
4. **Analysis results** → Back to browser
5. **Cleanup** → Data deleted after modal closes

### Best Practices
- ✅ Inform participants you're recording
- ✅ Export and save important meetings
- ✅ Delete sensitive transcripts after download
- ❌ Don't record confidential meetings without consent

---

## Troubleshooting

### "Speech Recognition not supported"
- **Solution**: Use Chrome or Safari
- Check browser permissions for microphone access

### "Analysis failed"
- **Causes**:
  - Network connection issue
  - OpenAI API rate limit
  - Very long transcript (>100K chars)
- **Solution**: Try again, or reduce meeting length

### No transcript captured
- **Causes**:
  - Microphone permission denied
  - Very quiet audio
  - Background noise
- **Solution**:
  - Check browser microphone permissions
  - Speak clearly
  - Use headset for better quality

### Recording doesn't start
- **Check**:
  - You are the **host** (not guest)
  - Browser supports Speech Recognition
  - No other recording app using microphone
  - Refresh page and try again

---

## Future Enhancements

### Coming Soon
- 🔊 **Server-side transcription** - Using Whisper API for higher accuracy
- 🌍 **Multi-language support** - Auto-detect language
- 🔍 **Searchable archive** - Find old meetings by keyword
- 📊 **Analytics dashboard** - Talk time, sentiment analysis
- 📧 **Email integration** - Auto-send summaries
- 💼 **CRM integration** - Push action items to Salesforce/HubSpot

---

## Support

For issues or questions:
- Check this guide first
- Test in Chrome/Safari before reporting issues
- Ensure microphone permissions are granted

---

**🎉 Enjoy effortless meeting notes with AI Notetaker!**
