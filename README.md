# Kaminskyi AI Messenger

A secure 1-on-1 video messenger application with high-quality video and audio capabilities.

## Features

- 🔐 Secure authentication (Login: Oleh, Password: QwertY24$)
- 📹 HD video calling with optimized quality settings
- 🎤 High-fidelity audio (48kHz stereo)
- 💬 Real-time chat messaging
- 📱 Mobile-optimized interface (native app-like experience)
- 🌐 Works perfectly on desktop and mobile browsers
- ⚡ WebSocket-based real-time communication

## Tech Stack

- **Backend:** Go (Golang)
- **WebSocket:** Gorilla WebSocket
- **Database:** SQLite
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Deployment:** Railway (Docker-based)

## Local Development

### Prerequisites

- Go 1.21 or higher
- GCC (for SQLite support)

### Running Locally

```bash
# Clone the repository
git clone <your-repo-url>
cd "go messenger"

# Install dependencies
go mod download

# Run the server
go run main.go
```

The app will be available at `http://localhost:8080`

### Login Credentials

- **Username:** Oleh
- **Password:** QwertY24$

## Deployment on Railway

### Quick Deploy

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Railway will automatically detect the `Dockerfile` and deploy
4. The app will be available at your Railway-provided URL

### Environment Variables

No additional environment variables are required. The app uses:
- Port: Automatically set by Railway via `$PORT` environment variable
- Database: SQLite stored in `/data/sqlite.db`

### Railway Configuration Files

- `Dockerfile` - Multi-stage Docker build for optimal size
- `railway.json` - Railway-specific configuration
- `railway.toml` - Alternative Railway configuration
- `.railwayignore` - Files to exclude from deployment

## Usage

1. **Login:** Navigate to `/login` and sign in with credentials
2. **Home Page:** After login, you'll see the home page with "Create Meeting" button
3. **Create Meeting:** Click "Create Meeting" to generate a unique meeting room
4. **Share Link:** Share the meeting URL with another participant
5. **Join Call:** Both participants can see and hear each other, and use the chat feature

## Video/Audio Settings

The app uses optimized media constraints:

### Video
- Resolution: Up to 1920x1080 (Full HD)
- Frame rate: 30-60 fps
- Adaptive quality based on device capabilities

### Audio
- Sample rate: 48kHz
- Stereo (2 channels)
- Echo cancellation enabled
- Noise suppression enabled
- Auto gain control enabled

## Mobile Optimization

- ✅ Viewport optimized for mobile browsers
- ✅ No unwanted scrolling or zooming
- ✅ Native app-like experience
- ✅ Support for notched devices (iPhone X+)
- ✅ Proper safe area handling
- ✅ Links open directly in browser (not in embedded views)

## License

Private project - All rights reserved
