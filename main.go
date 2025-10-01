// main.go
package main

import (
	"crypto/rand"
	"database/sql"
	"embed"
	"encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	_ "github.com/mattn/go-sqlite3"
)

const (
	validUsername = "Oleh"
	validPassword = "QwertY24$"
)

var (
	addr         = flag.String("addr", ":8080", "HTTP service address")
	db           *sql.DB
	activeSessions = make(map[string]bool) // token -> valid
	sessionMutex   sync.RWMutex
)

//go:embed static/*
var staticFiles embed.FS

// Room represents a 1-on-1 chat/video room
type Room struct {
	Peers map[*websocket.Conn]string // conn → user ID
	mu    sync.Mutex
}

var (
	rooms = make(map[string]*Room)
	mu    sync.Mutex // protects the rooms map
)

// Message is the standard message format for WebSocket
type Message struct {
	Type string          `json:"type"` // "chat", "join", "leave"
	Data json.RawMessage `json:"data"`
	Room string          `json:"room"`
	User string          `json:"user"`
}

func initDB() {
	if err := os.MkdirAll("/data", os.ModePerm); err != nil {
		log.Fatalf("Failed to create /data directory: %v", err)
	}

	var err error
	// Use standard SQLite driver
	db, err = sql.Open("sqlite3", "/data/sqlite.db")
	if err != nil {
		log.Fatalf("Failed to open SQLite DB: %v", err)
	}

	// Налаштування підключення
	db.SetMaxOpenConns(1) // SQLite не підтримує справжній паралелізм
	db.SetMaxIdleConns(1)

	// Створення таблиці кімнат
	if _, err = db.Exec(`CREATE TABLE IF NOT EXISTS rooms (
		id TEXT PRIMARY KEY,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)`); err != nil {
		log.Fatalf("Failed to create rooms table: %v", err)
	}
}

func createRoom() string {
	id := uuid.NewString()
	_, err := db.Exec("INSERT INTO rooms (id) VALUES (?)", id)
	if err != nil {
		log.Printf("Failed to insert room %s into DB: %v", id, err)
		return ""
	}

	mu.Lock()
	rooms[id] = &Room{
		Peers: make(map[*websocket.Conn]string),
	}
	mu.Unlock()

	return id
}

func roomExists(id string) bool {
	var dummy string
	err := db.QueryRow("SELECT id FROM rooms WHERE id = ?", id).Scan(&dummy)
	return err == nil
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Дозволяємо всі origin для локальної розробки
		// У продакшені — обмежити до свого домену
		return true
	},
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	roomID := r.URL.Query().Get("room")
	if roomID == "" {
		_ = conn.WriteMessage(websocket.TextMessage, []byte(`{"error":"room ID missing"}`))
		return
	}
	if !roomExists(roomID) {
		_ = conn.WriteMessage(websocket.TextMessage, []byte(`{"error":"room not found"}`))
		return
	}

	// Переконуємося, що кімната є в пам’яті (наприклад, після рестарту сервера)
	mu.Lock()
	room, exists := rooms[roomID]
	if !exists {
		room = &Room{Peers: make(map[*websocket.Conn]string)}
		rooms[roomID] = room
	}
	mu.Unlock()

	// Генеруємо унікальний ID користувача
	userID := "user_" + uuid.NewString()[:8]

	room.mu.Lock()
	if len(room.Peers) >= 2 {
		room.mu.Unlock()
		_ = conn.WriteMessage(websocket.TextMessage, []byte(`{"error":"room full"}`))
		return
	}
	room.Peers[conn] = userID
	room.mu.Unlock()

	// Повідомляємо іншого учасника про приєднання
	joinMsg := Message{
		Type: "join",
		Data: json.RawMessage(`{"message":"joined the call"}`),
		Room: roomID,
		User: userID,
	}
	broadcastToRoom(room, joinMsg, conn)

	log.Printf("User %s joined room %s", userID, roomID)

	// Очищення при відключенні
	defer func() {
		room.mu.Lock()
		delete(room.Peers, conn)
		peerCount := len(room.Peers)
		room.mu.Unlock()

		// Повідомлення про вихід
		leaveMsg := Message{
			Type: "leave",
			Data: json.RawMessage(`{"message":"left the call"}`),
			Room: roomID,
			User: userID,
		}
		broadcastToRoom(room, leaveMsg, conn)

		log.Printf("User %s left room %s (peers remaining: %d)", userID, roomID, peerCount)

		// Не видаляємо кімнату з БД — можна повторно використовувати
	}()

	// Читання повідомлень
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket read error in room %s: %v", roomID, err)
			}
			break
		}

		var message Message
		if err := json.Unmarshal(msg, &message); err != nil {
			log.Printf("Invalid JSON from user %s: %v", userID, err)
			continue
		}

		// Переконуємося, що тип підтримується
		if message.Type != "chat" {
			log.Printf("Unsupported message type: %s", message.Type)
			continue
		}

		// Забезпечуємо наявність User
		message.User = userID
		message.Room = roomID

		// Розсилка іншому учаснику
		room.mu.Lock()
		for peerConn, peerID := range room.Peers {
			if peerConn != conn {
				outgoing := message
				outgoing.User = peerID // Для UI — показуємо відправника
				if err := peerConn.WriteJSON(outgoing); err != nil {
					log.Printf("Failed to send message to peer %s: %v", peerID, err)
				}
				break // лише один інший учасник
			}
		}
		room.mu.Unlock()
	}
}

func broadcastToRoom(room *Room, msg Message, exclude *websocket.Conn) {
	room.mu.Lock()
	defer room.mu.Unlock()
	for peerConn := range room.Peers {
		if peerConn != exclude {
			if err := peerConn.WriteJSON(msg); err != nil {
				log.Printf("Broadcast error: %v", err)
			}
		}
	}
}

func generateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Skip auth for login page and static files
		if strings.HasPrefix(r.URL.Path, "/login") || strings.HasPrefix(r.URL.Path, "/static/") {
			next(w, r)
			return
		}

		// Check Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader != "" {
			token := strings.TrimPrefix(authHeader, "Bearer ")
			sessionMutex.RLock()
			valid := activeSessions[token]
			sessionMutex.RUnlock()

			if valid {
				next(w, r)
				return
			}
		}

		// Check if this is an HTML request
		acceptHeader := r.Header.Get("Accept")
		if strings.Contains(acceptHeader, "text/html") {
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}

		http.Error(w, "Unauthorized", http.StatusUnauthorized)
	}
}

func serveFile(filename string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		b, err := staticFiles.ReadFile("static/" + filename)
		if err != nil {
			http.Error(w, "Page not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write(b)
	}
}

func main() {
	flag.Parse()

	// Підтримка хостингів (Render, Railway)
	if port := os.Getenv("PORT"); port != "" && *addr == ":8080" {
		*addr = ":" + port
	}

	initDB()
	defer db.Close()

	// Налаштування статичних файлів
	staticFS, err := fs.Sub(staticFiles, "static")
	if err != nil {
		log.Fatalf("Failed to create static FS: %v", err)
	}

	// Роутинг
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.FS(staticFS))))

	// Login endpoint
	http.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			serveFile("login.html")(w, r)
			return
		}

		if r.Method == http.MethodPost {
			var creds struct {
				Username string `json:"username"`
				Password string `json:"password"`
			}

			body, err := io.ReadAll(r.Body)
			if err != nil {
				http.Error(w, "Invalid request", http.StatusBadRequest)
				return
			}

			if err := json.Unmarshal(body, &creds); err != nil {
				http.Error(w, "Invalid JSON", http.StatusBadRequest)
				return
			}

			if creds.Username == validUsername && creds.Password == validPassword {
				token, err := generateToken()
				if err != nil {
					http.Error(w, "Server error", http.StatusInternalServerError)
					return
				}

				sessionMutex.Lock()
				activeSessions[token] = true
				sessionMutex.Unlock()

				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(map[string]any{
					"success": true,
					"token":   token,
				})
			} else {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				json.NewEncoder(w).Encode(map[string]any{
					"success": false,
					"message": "Invalid credentials",
				})
			}
			return
		}

		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	})

	// Protected routes
	http.HandleFunc("/", authMiddleware(serveFile("home.html")))
	http.HandleFunc("/room/", authMiddleware(serveFile("index.html")))

	// Створення кімнати (protected)
	http.HandleFunc("/create", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		id := createRoom()
		if id == "" {
			http.Error(w, "Failed to create room", http.StatusInternalServerError)
			return
		}

		// Визначення схеми (http/https)
		scheme := "http"
		if r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" {
			scheme = "https"
		}

		url := fmt.Sprintf("%s://%s/room/%s", scheme, r.Host, id)
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.Write([]byte(url))
	}))

	// WebSocket (protected)
	http.HandleFunc("/ws", authMiddleware(wsHandler))

	log.Printf("🚀 Server starting on %s", *addr)
	log.Fatal(http.ListenAndServe(*addr, nil))
}
