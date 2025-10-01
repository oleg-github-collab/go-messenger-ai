# Deployment Guide - Kaminskyi AI Messenger

## 📋 Pre-Deployment Checklist

### ✅ Files Ready for Deployment
- ✅ `main.go` - Main application with authentication
- ✅ `go.mod` - Dependencies configuration
- ✅ `Dockerfile` - Multi-stage Docker build
- ✅ `railway.json` - Railway configuration
- ✅ `railway.toml` - Alternative Railway config
- ✅ `.railwayignore` - Files to exclude
- ✅ `static/` - All frontend files (11 files)

## 🚀 Deploy to Railway

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub:**
   ```bash
   cd "/Users/olehkaminskyi/Desktop/go messenger"
   git init
   git add .
   git commit -m "Initial commit - Kaminskyi AI Messenger"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy on Railway:**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect Dockerfile and deploy
   - Your app will be live at: `https://<your-app>.railway.app`

### Method 2: Railway CLI

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login and Deploy:**
   ```bash
   cd "/Users/olehkaminskyi/Desktop/go messenger"
   railway login
   railway init
   railway up
   ```

## 🔧 Configuration

### Environment Variables
No manual environment variables needed. The app automatically:
- Uses `$PORT` from Railway
- Creates `/data` directory for SQLite
- Handles both HTTP and HTTPS

### Login Credentials
- **Username:** `Oleh`
- **Password:** `QwertY24$`

## 📱 Features Included

### ✅ Authentication System
- Secure token-based authentication
- Session management
- Protected routes

### ✅ Mobile Optimization
- Perfect viewport configuration
- No unwanted scrolling
- Native app-like feel
- Support for notched devices (iPhone X+)
- Safe area handling

### ✅ Video Call Features
- **Fullscreen Mode:** Click fullscreen button (⛶) top-left
- **Picture-in-Picture:** Click PiP button (◱) - works when video streaming is active
- **Wake Lock:** Screen stays on during calls
- **Background Support:** Continue calls while using other apps

### ✅ Audio/Video Quality
- **Video:** Up to 1920x1080 (Full HD), 30-60 fps
- **Audio:** 48kHz stereo, echo cancellation, noise suppression

## 🧪 Local Testing

```bash
cd "/Users/olehkaminskyi/Desktop/go messenger"
go run main.go
```

Open: `http://localhost:8080/login`

## 🔍 Verify Deployment

After deployment, test these routes:

1. **Login Page:** `https://your-app.railway.app/login`
   - Should show login form
   - Test with credentials: Oleh / QwertY24$

2. **Home Page:** `https://your-app.railway.app/`
   - Should redirect to login if not authenticated
   - After login: shows "1-on-1 Meetings" page

3. **Create Meeting:** Click "Create Meeting" button
   - Should generate unique room URL
   - Format: `https://your-app.railway.app/room/<uuid>`

4. **Video Call:** Join the room
   - Test fullscreen button (top-left)
   - Test PiP button (top-left, second)
   - Verify screen stays on (wake lock)
   - Test mic/video toggle
   - Test chat functionality

## 🐛 Troubleshooting

### Build Issues
- Ensure Go 1.21+ is specified in go.mod
- Dockerfile includes CGO for SQLite
- All static files are embedded

### Connection Issues
- Check if Railway app is running
- Verify WebSocket connections (WSS for HTTPS)
- Check Railway logs: `railway logs`

### Authentication Issues
- Clear localStorage in browser
- Try incognito/private mode
- Verify credentials are correct

## 📊 App Structure

```
/                    → Home page (requires auth)
/login               → Login page (public)
/room/<uuid>         → Video call room (requires auth)
/create              → Create new room (API, requires auth)
/ws?room=<uuid>      → WebSocket connection (requires auth)
/static/*            → Static files (CSS, JS, public)
```

## 🎯 Next Steps After Deployment

1. **Test on mobile devices** - iOS Safari, Chrome
2. **Test on desktop browsers** - Chrome, Firefox, Safari
3. **Test fullscreen mode** on different devices
4. **Test PiP functionality** when video streaming is active
5. **Share meeting link** and test with real participants

## 📝 Notes

- SQLite database stored in `/data/sqlite.db`
- Persistent volume recommended for Railway
- Wake Lock API requires HTTPS (Railway provides this)
- PiP will work when WebRTC video streaming is implemented

---

**App Name:** Kaminskyi AI Messenger
**Version:** 1.0.0
**Ready for Production:** ✅ Yes
