package logger

import (
	"fmt"
	"log"
	"os"
	"runtime"
	"strings"
	"time"
)

// LogLevel represents the severity of a log message
type LogLevel int

const (
	DEBUG LogLevel = iota
	INFO
	WARN
	ERROR
	FATAL
)

var (
	levelStrings = map[LogLevel]string{
		DEBUG: "DEBUG",
		INFO:  "INFO",
		WARN:  "WARN",
		ERROR: "ERROR",
		FATAL: "FATAL",
	}

	levelEmojis = map[LogLevel]string{
		DEBUG: "🔍",
		INFO:  "ℹ️",
		WARN:  "⚠️",
		ERROR: "❌",
		FATAL: "💀",
	}

	currentLevel = INFO
	enableColors = true
)

// Logger provides structured logging
type Logger struct {
	component string
}

// New creates a new logger for a component
func New(component string) *Logger {
	return &Logger{component: component}
}

// SetLevel sets the global log level
func SetLevel(level LogLevel) {
	currentLevel = level
}

// SetDebug enables debug logging
func SetDebug(enabled bool) {
	if enabled {
		currentLevel = DEBUG
	} else {
		currentLevel = INFO
	}
}

func (l *Logger) log(level LogLevel, format string, args ...interface{}) {
	if level < currentLevel {
		return
	}

	timestamp := time.Now().Format("2006-01-02 15:04:05.000")
	levelStr := levelStrings[level]
	emoji := levelEmojis[level]

	// Get caller info
	_, file, line, ok := runtime.Caller(2)
	caller := ""
	if ok {
		// Get just the filename, not full path
		parts := strings.Split(file, "/")
		filename := parts[len(parts)-1]
		caller = fmt.Sprintf("%s:%d", filename, line)
	}

	message := fmt.Sprintf(format, args...)

	// Format log line
	logLine := fmt.Sprintf("%s [%s] %s [%s] %s - %s",
		timestamp,
		levelStr,
		emoji,
		l.component,
		caller,
		message,
	)

	// Print to stdout (Railway captures this)
	fmt.Println(logLine)

	// Also use standard logger for compatibility
	log.SetFlags(0) // We handle formatting ourselves
	log.Println(logLine)

	// Fatal logs should exit
	if level == FATAL {
		os.Exit(1)
	}
}

// Debug logs a debug message
func (l *Logger) Debug(format string, args ...interface{}) {
	l.log(DEBUG, format, args...)
}

// Info logs an info message
func (l *Logger) Info(format string, args ...interface{}) {
	l.log(INFO, format, args...)
}

// Warn logs a warning message
func (l *Logger) Warn(format string, args ...interface{}) {
	l.log(WARN, format, args...)
}

// Error logs an error message
func (l *Logger) Error(format string, args ...interface{}) {
	l.log(ERROR, format, args...)
}

// Fatal logs a fatal message and exits
func (l *Logger) Fatal(format string, args ...interface{}) {
	l.log(FATAL, format, args...)
}

// WithField adds a field to log context
func (l *Logger) WithField(key string, value interface{}) *Logger {
	newComponent := fmt.Sprintf("%s:%s=%v", l.component, key, value)
	return &Logger{component: newComponent}
}

// WithError logs an error with context
func (l *Logger) WithError(err error) *LogEntry {
	return &LogEntry{
		logger: l,
		err:    err,
		fields: make(map[string]interface{}),
	}
}

// LogEntry represents a log entry with fields
type LogEntry struct {
	logger *Logger
	err    error
	fields map[string]interface{}
}

// WithField adds a field to the log entry
func (e *LogEntry) WithField(key string, value interface{}) *LogEntry {
	e.fields[key] = value
	return e
}

// Error logs the entry as an error
func (e *LogEntry) Error(message string) {
	fieldsStr := ""
	for k, v := range e.fields {
		fieldsStr += fmt.Sprintf(" %s=%v", k, v)
	}

	if e.err != nil {
		e.logger.Error("%s: %v%s", message, e.err, fieldsStr)
	} else {
		e.logger.Error("%s%s", message, fieldsStr)
	}
}

// Warn logs the entry as a warning
func (e *LogEntry) Warn(message string) {
	fieldsStr := ""
	for k, v := range e.fields {
		fieldsStr += fmt.Sprintf(" %s=%v", k, v)
	}

	if e.err != nil {
		e.logger.Warn("%s: %v%s", message, e.err, fieldsStr)
	} else {
		e.logger.Warn("%s%s", message, fieldsStr)
	}
}

// Info logs the entry as info
func (e *LogEntry) Info(message string) {
	fieldsStr := ""
	for k, v := range e.fields {
		fieldsStr += fmt.Sprintf(" %s=%v", k, v)
	}

	if e.err != nil {
		e.logger.Info("%s: %v%s", message, e.err, fieldsStr)
	} else {
		e.logger.Info("%s%s", message, fieldsStr)
	}
}

// Global convenience loggers
var (
	App        = New("APP")
	HTTP       = New("HTTP")
	Daily      = New("DAILY")
	Audio      = New("AUDIO")
	Transcript = New("TRANSCRIPT")
	Redis      = New("REDIS")
	Auth       = New("AUTH")
	Webhook    = New("WEBHOOK")
)

// Request logs an HTTP request
func (l *Logger) Request(method, path, remoteAddr string, duration time.Duration) {
	l.Info("%s %s from %s - %v", method, path, remoteAddr, duration)
}

// StartupInfo logs application startup info
func StartupInfo(version, buildDate, port string) {
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	log.Println("🚀 Kaminskyi AI Messenger")
	log.Printf("📦 Version: %s", version)
	log.Printf("📅 Build Date: %s", buildDate)
	log.Printf("🌐 Port: %s", port)
	log.Printf("🐹 Go Version: %s", runtime.Version())
	log.Printf("💻 OS: %s/%s", runtime.GOOS, runtime.GOARCH)
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
}
