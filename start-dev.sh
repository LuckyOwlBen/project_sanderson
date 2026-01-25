#!/bin/bash

# Sanderson RPG - Development Mode Startup
# Fast startup using concurrently (both backend + frontend in one terminal)
# Usage: ./start.sh dev
# or:    npm start
#
# Ports:
#   Backend:  http://localhost:3000
#   Frontend: http://localhost:4200

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  Sanderson RPG - Development Startup${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}ERROR: npm is not installed${NC}"
    exit 1
fi

# Go to project root
cd "$SCRIPT_DIR"

# Check if concurrently is installed
if ! npm ls concurrently &>/dev/null; then
    echo -e "${YELLOW}Installing concurrently...${NC}"
    npm install --save-dev concurrently
fi

echo -e "${YELLOW}Starting backend + frontend with concurrently...${NC}"
echo ""

# Run the unified start script
npm start

exit 0
