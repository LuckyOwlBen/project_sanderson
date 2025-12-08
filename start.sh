#!/bin/bash

# Sanderson RPG Server Startup Script
# This script starts both the backend API and frontend development server

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
PID_DIR="$SCRIPT_DIR/.pids"

# Create directories if they don't exist
mkdir -p "$LOG_DIR"
mkdir -p "$PID_DIR"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Sanderson RPG Server Startup${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start backend server
start_backend() {
    echo -e "${YELLOW}Starting backend server...${NC}"
    
    if check_port 3000; then
        echo -e "${RED}Port 3000 already in use. Backend may already be running.${NC}"
        return 1
    fi
    
    cd "$SCRIPT_DIR/server"
    nohup node server.js > "$LOG_DIR/backend.log" 2>&1 &
    echo $! > "$PID_DIR/backend.pid"
    
    sleep 2
    
    if check_port 3000; then
        echo -e "${GREEN}✓ Backend server started on port 3000${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to start backend server${NC}"
        return 1
    fi
}

# Function to start frontend server
start_frontend() {
    echo -e "${YELLOW}Starting frontend server...${NC}"
    
    if check_port 4200; then
        echo -e "${RED}Port 4200 already in use. Frontend may already be running.${NC}"
        return 1
    fi
    
    cd "$SCRIPT_DIR"
    nohup npm start > "$LOG_DIR/frontend.log" 2>&1 &
    echo $! > "$PID_DIR/frontend.pid"
    
    echo -e "${GREEN}✓ Frontend server starting (this may take 30-60 seconds)${NC}"
    return 0
}

# Start servers
start_backend
BACKEND_STATUS=$?

start_frontend
FRONTEND_STATUS=$?

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Startup complete!${NC}"
echo ""
echo -e "Backend API:  ${GREEN}http://localhost:3000${NC}"
echo -e "Frontend App: ${GREEN}http://localhost:4200${NC}"
echo ""
echo -e "Logs: ${YELLOW}$LOG_DIR${NC}"
echo -e "PIDs: ${YELLOW}$PID_DIR${NC}"
echo ""
echo -e "To stop servers, run: ${YELLOW}./stop.sh${NC}"
echo -e "${BLUE}========================================${NC}"

exit 0
