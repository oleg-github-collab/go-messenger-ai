#!/bin/bash

# ========================
# Droplet Sleep Controller
# Version: 1.0
# Purpose: Automatically shut down droplet after period of inactivity
# ========================

# Configuration
IDLE_TIMEOUT=3600          # 1 hour (3600 seconds) of inactivity before sleep
CHECK_INTERVAL=300         # Check every 5 minutes (300 seconds)
LAST_ACTIVITY_FILE="/var/run/sleep-controller/last_activity"
STATE_DIR="/var/run/sleep-controller"
LOG_FILE="/var/log/sleep-controller.log"
REDIS_SAVE_TIMEOUT=30      # Timeout for Redis SAVE command

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ========================
# LOGGING
# ========================

log() {
  local level="$1"
  shift
  local message="$*"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local color=""

  case "$level" in
    INFO)  color="$GREEN" ;;
    WARN)  color="$YELLOW" ;;
    ERROR) color="$RED" ;;
    DEBUG) color="$BLUE" ;;
  esac

  echo -e "${color}[${timestamp}] [${level}]${NC} ${message}" | tee -a "$LOG_FILE"
}

info()  { log "INFO" "$@"; }
warn()  { log "WARN" "$@"; }
error() { log "ERROR" "$@"; }
debug() { log "DEBUG" "$@"; }

# ========================
# INITIALIZATION
# ========================

init() {
  info "🚀 Sleep Controller v1.0 starting..."
  info "Configuration:"
  info "  - Idle timeout: ${IDLE_TIMEOUT}s ($(($IDLE_TIMEOUT / 60)) minutes)"
  info "  - Check interval: ${CHECK_INTERVAL}s ($(($CHECK_INTERVAL / 60)) minutes)"
  info "  - Log file: $LOG_FILE"

  # Create state directory
  mkdir -p "$STATE_DIR"
  if [ $? -ne 0 ]; then
    error "Failed to create state directory: $STATE_DIR"
    exit 1
  fi

  # Check if running as root
  if [ "$EUID" -ne 0 ]; then
    error "This script must be run as root"
    exit 1
  fi

  # Check required commands
  for cmd in netstat redis-cli systemctl shutdown; do
    if ! command -v $cmd &> /dev/null; then
      error "Required command not found: $cmd"
      exit 1
    fi
  done

  # Initialize last activity timestamp
  update_last_activity
  info "✅ Initialization complete"
}

# ========================
# ACTIVITY MONITORING
# ========================

get_network_connections() {
  # Count ESTABLISHED connections on important ports
  local nginx_conn=$(netstat -an 2>/dev/null | grep -E ':(80|443)' | grep ESTABLISHED | wc -l)
  local messenger_conn=$(netstat -an 2>/dev/null | grep ':8080' | grep ESTABLISHED | wc -l)
  local websocket_conn=$(netstat -an 2>/dev/null | grep ESTABLISHED | grep -E ':(8080|443)' | wc -l)

  local total=$((nginx_conn + messenger_conn + websocket_conn))
  echo "$total"
}

get_redis_activity() {
  # Check Redis for active sessions and meetings
  local sessions=$(redis-cli --raw KEYS "session:*" 2>/dev/null | wc -l)
  local meetings=$(redis-cli --raw KEYS "meeting:*" 2>/dev/null | wc -l)

  local total=$((sessions + meetings))
  echo "$total"
}

check_service_status() {
  # Check if critical services are running
  local services="messenger nginx redis"
  local running=0

  for service in $services; do
    if systemctl is-active --quiet "$service"; then
      running=$((running + 1))
    fi
  done

  echo "$running"
}

is_system_active() {
  local connections=$(get_network_connections)
  local redis_activity=$(get_redis_activity)
  local services=$(check_service_status)

  debug "Activity check: connections=$connections, redis=$redis_activity, services=$services"

  # System is active if:
  # - Has network connections OR
  # - Has Redis activity OR
  # - Services recently started (within last 5 minutes)
  if [ "$connections" -gt 0 ] || [ "$redis_activity" -gt 0 ]; then
    return 0  # Active
  fi

  return 1  # Inactive
}

update_last_activity() {
  local timestamp=$(date +%s)
  echo "$timestamp" > "$LAST_ACTIVITY_FILE"
  debug "Updated last activity: $timestamp"
}

get_idle_time() {
  if [ ! -f "$LAST_ACTIVITY_FILE" ]; then
    echo "0"
    return
  fi

  local last_activity=$(cat "$LAST_ACTIVITY_FILE")
  local current_time=$(date +%s)
  local idle_time=$((current_time - last_activity))

  echo "$idle_time"
}

get_uptime_seconds() {
  local uptime_str=$(cat /proc/uptime | awk '{print $1}')
  echo "${uptime_str%.*}"  # Remove decimal part
}

# ========================
# SHUTDOWN PROCEDURES
# ========================

save_redis_data() {
  info "💾 Saving Redis data..."

  # Try SAVE command with timeout
  timeout $REDIS_SAVE_TIMEOUT redis-cli SAVE &> /dev/null

  if [ $? -eq 0 ]; then
    info "✅ Redis data saved successfully"
    return 0
  else
    warn "⚠️  Redis SAVE failed or timed out, trying BGSAVE..."
    redis-cli BGSAVE &> /dev/null
    sleep 2
    return 1
  fi
}

stop_services() {
  info "🛑 Stopping services gracefully..."

  # Stop messenger first (closes WebSocket connections)
  if systemctl is-active --quiet messenger; then
    info "Stopping messenger service..."
    systemctl stop messenger
    if [ $? -eq 0 ]; then
      info "✅ Messenger stopped"
    else
      warn "⚠️  Failed to stop messenger"
    fi
  fi

  # Stop nginx
  if systemctl is-active --quiet nginx; then
    info "Stopping nginx service..."
    systemctl stop nginx
    if [ $? -eq 0 ]; then
      info "✅ Nginx stopped"
    else
      warn "⚠️  Failed to stop nginx"
    fi
  fi

  # Give services time to clean up
  sleep 2
}

create_wake_marker() {
  # Create a marker file to track sleep/wake cycles
  local marker_file="$STATE_DIR/sleep_marker"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local uptime=$(get_uptime_seconds)

  cat > "$marker_file" << EOF
last_sleep_time=$timestamp
last_uptime=$uptime
reason=inactivity_timeout
EOF

  info "📝 Created wake marker"
}

shutdown_droplet() {
  info "🌙 =========================================="
  info "🌙 INITIATING GRACEFUL SHUTDOWN"
  info "🌙 =========================================="

  local idle_time=$(get_idle_time)
  local uptime=$(get_uptime_seconds)

  info "Shutdown reason: Inactivity timeout"
  info "Idle time: ${idle_time}s (threshold: ${IDLE_TIMEOUT}s)"
  info "Uptime: ${uptime}s"

  # Step 1: Save Redis data
  save_redis_data

  # Step 2: Stop services
  stop_services

  # Step 3: Create wake marker
  create_wake_marker

  # Step 4: Final log entry
  info "💤 Going to sleep. Goodbye!"
  info "💡 Will wake up on next request via CloudFlare Worker"

  # Sync filesystem
  sync

  # Schedule shutdown in 30 seconds (time to flush logs)
  info "⏰ Shutdown scheduled in 30 seconds..."
  shutdown -h +0.5 "Auto-sleep: inactivity timeout reached"

  # Exit cleanly
  exit 0
}

# ========================
# MAIN MONITORING LOOP
# ========================

monitor_loop() {
  info "👀 Starting monitoring loop..."

  # Wait a bit after boot before starting monitoring
  local boot_grace_period=300  # 5 minutes
  local uptime=$(get_uptime_seconds)

  if [ "$uptime" -lt "$boot_grace_period" ]; then
    local wait_time=$((boot_grace_period - uptime))
    info "⏳ Boot grace period: waiting ${wait_time}s before monitoring..."
    sleep "$wait_time"
  fi

  # Initialize activity timestamp
  update_last_activity

  # Main monitoring loop
  while true; do
    # Wait for check interval
    sleep "$CHECK_INTERVAL"

    # Check if system is active
    if is_system_active; then
      info "✅ System is active"
      update_last_activity
    else
      local idle_time=$(get_idle_time)
      local remaining=$((IDLE_TIMEOUT - idle_time))

      if [ "$remaining" -gt 0 ]; then
        info "⏰ System idle for ${idle_time}s (threshold: ${IDLE_TIMEOUT}s, remaining: ${remaining}s)"
      else
        warn "🚨 Inactivity threshold reached!"
        shutdown_droplet
        break  # This line won't be reached, but good practice
      fi
    fi

    # Periodic status report (every hour)
    local uptime=$(get_uptime_seconds)
    if [ $((uptime % 3600)) -lt "$CHECK_INTERVAL" ]; then
      local connections=$(get_network_connections)
      local redis_activity=$(get_redis_activity)
      info "📊 Hourly status: uptime=${uptime}s, connections=$connections, redis=$redis_activity"
    fi
  done
}

# ========================
# SIGNAL HANDLERS
# ========================

cleanup() {
  info "🛑 Received termination signal, cleaning up..."
  exit 0
}

trap cleanup SIGTERM SIGINT

# ========================
# STARTUP LOGGING
# ========================

check_wake_marker() {
  local marker_file="$STATE_DIR/sleep_marker"

  if [ -f "$marker_file" ]; then
    info "📋 Wake marker found:"
    cat "$marker_file" | while read line; do
      info "  $line"
    done

    # Calculate sleep duration
    local last_sleep=$(grep last_sleep_time "$marker_file" | cut -d= -f2)
    if [ ! -z "$last_sleep" ]; then
      local sleep_epoch=$(date -d "$last_sleep" +%s 2>/dev/null || echo "0")
      local wake_epoch=$(date +%s)
      local sleep_duration=$((wake_epoch - sleep_epoch))

      if [ "$sleep_duration" -gt 0 ]; then
        info "😴 Slept for: ${sleep_duration}s (~$(($sleep_duration / 60)) minutes)"
      fi
    fi

    # Remove marker
    rm -f "$marker_file"
  else
    info "🆕 No wake marker found (first boot or manual restart)"
  fi
}

# ========================
# MAIN ENTRY POINT
# ========================

main() {
  # Initialize
  init

  # Check if we just woke up
  check_wake_marker

  # Start monitoring
  monitor_loop
}

# Run main function
main
