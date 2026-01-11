#!/bin/bash

# Sanderson RPG Server Startup Script
# Usage: ./start.sh [dev|prod]
# dev  - Development mode (separate frontend/backend)
# prod - Production mode (single server with built files)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
PID_DIR="$SCRIPT_DIR/.pids"
MODE="${1:-prod}"

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

# Check if we have permission to bind to port 80
if [ "$MODE" == "prod" ] && [ -z "$PORT" ]; then
    # Check if Node.js has the capability to bind to privileged ports
    if ! getcap $(which node) 2>/dev/null | grep -q cap_net_bind_service; then
        echo -e "${RED}========================================${NC}"
        echo -e "${RED}  ERROR: Port 80 Requires Privileges${NC}"
        echo -e "${RED}========================================${NC}"
        echo -e "${YELLOW}Port 80 is a privileged port. Grant Node.js permission:${NC}"
        echo ""
        echo -e "  ${GREEN}sudo setcap 'cap_net_bind_service=+ep' \$(which node)${NC}"
        echo ""
        echo -e "${YELLOW}Or set a different port:${NC}"
        echo -e "  ${GREEN}export PORT=3000${NC}"
        echo -e "  ${GREEN}./start.sh prod${NC}"
        echo -e "${RED}========================================${NC}"
        exit 1
    fi
fi

# Stop any running servers first
if [ -f "$SCRIPT_DIR/stop.sh" ]; then
    echo -e "${YELLOW}Stopping any running servers...${NC}"
    bash "$SCRIPT_DIR/stop.sh"
    sleep 1
fi

# Clean up old builds
echo -e "${YELLOW}Cleaning old build files...${NC}"
rm -rf "$SCRIPT_DIR/dist"
rm -rf "$SCRIPT_DIR/server/dist"
echo -e "${GREEN}✓ Cleanup complete${NC}"

# Function to check if a port is in use
check_port() {
    local port=$1
    # Try multiple methods to check if port is in use
    
    # Method 1: Try lsof (Linux/Mac)
    if command -v lsof >/dev/null 2>&1; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            return 0
        fi
    fi
    
    # Method 2: Try netstat (most systems)
    if command -v netstat >/dev/null 2>&1; then
        if netstat -tln 2>/dev/null | grep -q ":$port "; then
            return 0
        fi
    fi
    
    # Method 3: Try ss (modern Linux)
    if command -v ss >/dev/null 2>&1; then
        if ss -tln 2>/dev/null | grep -q ":$port "; then
            return 0
        fi
    fi
    
    # Method 4: Try nc (netcat) - attempt to connect
    if command -v nc >/dev/null 2>&1; then
        if nc -z localhost $port 2>/dev/null; then
            return 0
        fi
    fi
    
    return 1
}

# Function to build Angular app
build_angular() {
    echo -e "${YELLOW}Building Angular application...${NC}"
    cd "$SCRIPT_DIR"
    
    npm run build
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Angular build complete${NC}"
        # Copy built files to server directory
        rm -rf server/dist
        cp -r dist/project-sanderson/browser server/dist
        return 0
    else
        echo -e "${RED}✗ Angular build failed${NC}"
        return 1
    fi
}

# Function to start backend server
start_backend() {
    local mode=$1
    echo -e "${YELLOW}Starting backend server (${mode} mode)...${NC}"
    
    if check_port 80; then
        echo -e "${RED}Port 80 already in use. Backend may already be running.${NC}"
        return 1
    fi
    
    cd "$SCRIPT_DIR/server"
    
    if [ "$mode" == "prod" ]; then
        # Check if running under systemd
        if [ -n "$INVOCATION_ID" ] || [ "${SYSTEMD_EXEC_PID:-}" ]; then
            # Running under systemd - run in foreground
            echo -e "${GREEN}Running under systemd - foreground mode${NC}"
            NODE_ENV=production exec node server.js
        else
            # Manual invocation - run in background
            NODE_ENV=production nohup node server.js > "$LOG_DIR/backend.log" 2>&1 &
            echo $! > "$PID_DIR/backend.pid"
        fi
    else
        nohup node server.js > "$LOG_DIR/backend.log" 2>&1 &
        echo $! > "$PID_DIR/backend.pid"
    fi
    
    # Only check port if running in background
    if [ "$mode" != "prod" ] || [ -z "$INVOCATION_ID" ]; then
        sleep 2
        
        if check_port 80; then
            echo -e "${GREEN}✓ Backend server started on port 80${NC}"
            return 0
        else
            echo -e "${RED}✗ Failed to start backend server${NC}"
            return 1
        fi
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

# Start servers based on mode
if [ "$MODE" == "dev" ]; then
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Starting in DEVELOPMENT mode${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    start_backend "dev"
    BACKEND_STATUS=$?
    
    start_frontend
    FRONTEND_STATUS=$?
    
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}Startup complete!${NC}"
    echo ""
    echo -e "Backend API:  ${GREEN}http://localhost:80${NC}"
    echo -e "Frontend App: ${GREEN}http://localhost:4200${NC}"
    echo ""
    echo -e "Logs: ${YELLOW}$LOG_DIR${NC}"
    echo -e "PIDs: ${YELLOW}$PID_DIR${NC}"
    echo ""
    echo -e "To stop servers, run: ${YELLOW}./stop.sh${NC}"
    echo -e "${BLUE}========================================${NC}"
else
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Starting in PRODUCTION mode${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    # Build Angular app first
    build_angular
    BUILD_STATUS=$?
    
    if [ $BUILD_STATUS -ne 0 ]; then
        echo -e "${RED}Build failed. Exiting.${NC}"
        exit 1
    fi
    
    # Start backend in production mode (serves Angular + API)
    start_backend "prod"
    BACKEND_STATUS=$?
    
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}Startup complete!${NC}"
    echo ""
    echo -e "Application:  ${GREEN}http://localhost${NC}"
    echo -e "Network:      ${GREEN}http://$(hostname -I | awk '{print $1}')${NC}"
    echo -e "              ${GREEN}http://sanderson-rpg.local${NC} (if mDNS configured)"
    echo ""
    echo -e "Logs: ${YELLOW}$LOG_DIR${NC}"
    echo -e "PIDs: ${YELLOW}$PID_DIR${NC}"
    echo ""
    echo -e "To stop server, run: ${YELLOW}./stop.sh${NC}"
    echo -e "${BLUE}========================================${NC}"
fi

exit 0
