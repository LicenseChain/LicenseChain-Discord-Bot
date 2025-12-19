#!/bin/sh
set -e

# Fix permissions for mounted volumes (run as root if possible)
if [ "$(id -u)" = "0" ]; then
    # Create directories if they don't exist
    mkdir -p /app/data /app/logs
    
    # Fix permissions
    chown -R 1000:1000 /app/data /app/logs 2>/dev/null || true
    chmod -R 755 /app/data /app/logs 2>/dev/null || true
    
    # Switch to appuser (UID 1000) using su
    # Build command string and execute as appuser
    CMD="$*"
    exec su -s /bin/sh appuser -c "cd /app && $CMD"
else
    # Already running as non-root, just create directories
    mkdir -p /app/data /app/logs 2>/dev/null || true
    exec "$@"
fi

