package errors

import (
	"encoding/json"
	"fmt"
	"net/http"
)

// AppError represents an application error with context
type AppError struct {
	Code       string                 `json:"code"`
	Message    string                 `json:"message"`
	StatusCode int                    `json:"-"`
	Internal   error                  `json:"-"`
	Fields     map[string]interface{} `json:"fields,omitempty"`
}

// Error implements the error interface
func (e *AppError) Error() string {
	if e.Internal != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Internal)
	}
	return e.Message
}

// WithField adds a field to the error
func (e *AppError) WithField(key string, value interface{}) *AppError {
	if e.Fields == nil {
		e.Fields = make(map[string]interface{})
	}
	e.Fields[key] = value
	return e
}

// Common error codes
const (
	ErrCodeBadRequest          = "BAD_REQUEST"
	ErrCodeUnauthorized        = "UNAUTHORIZED"
	ErrCodeForbidden           = "FORBIDDEN"
	ErrCodeNotFound            = "NOT_FOUND"
	ErrCodeConflict            = "CONFLICT"
	ErrCodeInternalServer      = "INTERNAL_SERVER_ERROR"
	ErrCodeServiceUnavailable  = "SERVICE_UNAVAILABLE"
	ErrCodeValidationFailed    = "VALIDATION_FAILED"
	ErrCodeRateLimitExceeded   = "RATE_LIMIT_EXCEEDED"
	ErrCodeRoomFull            = "ROOM_FULL"
	ErrCodeMeetingExpired      = "MEETING_EXPIRED"
	ErrCodeMeetingEnded        = "MEETING_ENDED"
	ErrCodeInvalidCredentials  = "INVALID_CREDENTIALS"
	ErrCodeSessionExpired      = "SESSION_EXPIRED"
	ErrCodeDailyNotConfigured  = "DAILY_NOT_CONFIGURED"
	ErrCodeTranscriptNotFound  = "TRANSCRIPT_NOT_FOUND"
	ErrCodeRecordingNotReady   = "RECORDING_NOT_READY"
)

// Predefined errors
var (
	ErrBadRequest = &AppError{
		Code:       ErrCodeBadRequest,
		Message:    "Invalid request",
		StatusCode: http.StatusBadRequest,
	}

	ErrUnauthorized = &AppError{
		Code:       ErrCodeUnauthorized,
		Message:    "Authentication required",
		StatusCode: http.StatusUnauthorized,
	}

	ErrForbidden = &AppError{
		Code:       ErrCodeForbidden,
		Message:    "Access forbidden",
		StatusCode: http.StatusForbidden,
	}

	ErrNotFound = &AppError{
		Code:       ErrCodeNotFound,
		Message:    "Resource not found",
		StatusCode: http.StatusNotFound,
	}

	ErrConflict = &AppError{
		Code:       ErrCodeConflict,
		Message:    "Resource conflict",
		StatusCode: http.StatusConflict,
	}

	ErrInternalServer = &AppError{
		Code:       ErrCodeInternalServer,
		Message:    "Internal server error",
		StatusCode: http.StatusInternalServerError,
	}

	ErrServiceUnavailable = &AppError{
		Code:       ErrCodeServiceUnavailable,
		Message:    "Service temporarily unavailable",
		StatusCode: http.StatusServiceUnavailable,
	}

	ErrValidationFailed = &AppError{
		Code:       ErrCodeValidationFailed,
		Message:    "Validation failed",
		StatusCode: http.StatusBadRequest,
	}

	ErrRateLimitExceeded = &AppError{
		Code:       ErrCodeRateLimitExceeded,
		Message:    "Rate limit exceeded, please slow down",
		StatusCode: http.StatusTooManyRequests,
	}

	ErrRoomFull = &AppError{
		Code:       ErrCodeRoomFull,
		Message:    "Room is full",
		StatusCode: http.StatusConflict,
	}

	ErrMeetingExpired = &AppError{
		Code:       ErrCodeMeetingExpired,
		Message:    "Meeting has expired",
		StatusCode: http.StatusGone,
	}

	ErrMeetingEnded = &AppError{
		Code:       ErrCodeMeetingEnded,
		Message:    "Meeting has ended",
		StatusCode: http.StatusGone,
	}

	ErrInvalidCredentials = &AppError{
		Code:       ErrCodeInvalidCredentials,
		Message:    "Invalid username or password",
		StatusCode: http.StatusUnauthorized,
	}

	ErrSessionExpired = &AppError{
		Code:       ErrCodeSessionExpired,
		Message:    "Session has expired",
		StatusCode: http.StatusUnauthorized,
	}

	ErrDailyNotConfigured = &AppError{
		Code:       ErrCodeDailyNotConfigured,
		Message:    "Daily.co is not configured",
		StatusCode: http.StatusServiceUnavailable,
	}

	ErrTranscriptNotFound = &AppError{
		Code:       ErrCodeTranscriptNotFound,
		Message:    "Transcript not found",
		StatusCode: http.StatusNotFound,
	}

	ErrRecordingNotReady = &AppError{
		Code:       ErrCodeRecordingNotReady,
		Message:    "Recording is not ready yet",
		StatusCode: http.StatusAccepted,
	}
)

// New creates a new AppError
func New(code, message string, statusCode int) *AppError {
	return &AppError{
		Code:       code,
		Message:    message,
		StatusCode: statusCode,
	}
}

// Wrap wraps an error with context
func Wrap(err error, message string) *AppError {
	if appErr, ok := err.(*AppError); ok {
		return appErr
	}

	return &AppError{
		Code:       ErrCodeInternalServer,
		Message:    message,
		StatusCode: http.StatusInternalServerError,
		Internal:   err,
	}
}

// WriteJSON writes the error as JSON response
func (e *AppError) WriteJSON(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(e.StatusCode)

	response := map[string]interface{}{
		"error": map[string]interface{}{
			"code":    e.Code,
			"message": e.Message,
		},
	}

	if e.Fields != nil && len(e.Fields) > 0 {
		response["error"].(map[string]interface{})["fields"] = e.Fields
	}

	json.NewEncoder(w).Encode(response)
}

// ValidationError represents a field validation error
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// NewValidationError creates a validation error
func NewValidationError(field, message string) *AppError {
	return &AppError{
		Code:       ErrCodeValidationFailed,
		Message:    "Validation failed",
		StatusCode: http.StatusBadRequest,
		Fields: map[string]interface{}{
			field: message,
		},
	}
}

// AddValidationError adds a validation error for a field
func (e *AppError) AddValidationError(field, message string) *AppError {
	if e.Fields == nil {
		e.Fields = make(map[string]interface{})
	}
	e.Fields[field] = message
	return e
}

// IsNotFound checks if error is not found
func IsNotFound(err error) bool {
	if appErr, ok := err.(*AppError); ok {
		return appErr.Code == ErrCodeNotFound
	}
	return false
}

// IsUnauthorized checks if error is unauthorized
func IsUnauthorized(err error) bool {
	if appErr, ok := err.(*AppError); ok {
		return appErr.Code == ErrCodeUnauthorized
	}
	return false
}

// IsForbidden checks if error is forbidden
func IsForbidden(err error) bool {
	if appErr, ok := err.(*AppError); ok {
		return appErr.Code == ErrCodeForbidden
	}
	return false
}

// RecoverPanic recovers from panic and returns error
func RecoverPanic() error {
	if r := recover(); r != nil {
		return fmt.Errorf("panic recovered: %v", r)
	}
	return nil
}
