#!/bin/bash

# Sanderson RPG Server Stop Script
# This script stops both the backend API and frontend development server

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/.pids"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping Sanderson RPG servers...${NC}"

# Function to stop a service
stop_service() {
    local service_name=$1
    local pid_file="$PID_DIR/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid 2>/dev/null
            sleep 1
            
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 $pid 2>/dev/null
            fi
            
            echo -e "${GREEN}✓ Stopped $service_name (PID: $pid)${NC}"
        else
            echo -e "${YELLOW}○ $service_name was not running${NC}"
        fi
        rm "$pid_file"
    else
        echo -e "${YELLOW}○ No PID file found for $service_name${NC}"
    fi
}

# Stop services
stop_service "backend"
stop_service "frontend"

# Also kill any node processes running server.js or ng serve
pkill -f "node.*server.js" 2>/dev/null
pkill -f "ng serve" 2>/dev/null

echo -e "${GREEN}Servers stopped.${NC}"

exit 0
