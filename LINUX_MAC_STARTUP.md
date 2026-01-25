# Linux/Mac Startup Guide

## Quick Start (Development)

```bash
# Make scripts executable (first time only)
chmod +x start.sh start-dev.sh stop.sh

# Start both backend + frontend
./start.sh dev
```

Or simply:
```bash
npm start
```

**Result:**
- Backend: http://localhost:3000/api
- Frontend: http://localhost:4200
- Both run in the same terminal with `[0]` (backend) and `[1]` (frontend) prefixes

## Available Commands

### Development Mode

```bash
./start.sh dev          # Using start.sh (recommended)
./start-dev.sh          # Quick dev startup
npm start               # Using npm directly (same as start.sh dev)
```

Ports:
- Backend: `http://localhost:3000/api`
- Frontend: `http://localhost:4200`

### Production Mode

```bash
./start.sh prod         # Build + start (default)
./start.sh              # Defaults to prod if no argument
```

Ports:
- Single unified server: `http://localhost`
- Network accessible: `http://<your-ip>`

### Stop Servers

```bash
./stop.sh               # Stops all running servers
```

Or from terminal where `npm start` is running:
```bash
Ctrl+C                  # Stops both processes
```

## Port Details

### Development (./start.sh dev)
- **Backend**: Port 3000 (API and WebSocket)
- **Frontend**: Port 4200 (Angular dev server with hot reload)
- **Communication**: Frontend connects to backend at `http://localhost:3000/api`

### Production (./start.sh prod)
- **Unified**: Port 80 (serves both Angular app and API)
- **Communication**: In-process (both served from same Node.js server)
- **Access**: `http://localhost` or `http://<your-ip>`

## First Time Setup

```bash
# 1. Clone repo
git clone <repo-url>
cd project_sanderson

# 2. Make scripts executable
chmod +x start.sh start-dev.sh stop.sh

# 3. Install dependencies
npm install

# 4. Start development
./start.sh dev
```

Then open browser to http://localhost:4200

## Troubleshooting

### Port Already in Use

```bash
# Find what's using port 3000
lsof -i :3000

# Find what's using port 4200
lsof -i :4200

# Kill process (replace PID with actual number)
kill -9 <PID>

# Or use different ports
PORT=3001 ./start.sh dev
```

### Permission Denied Running Scripts

```bash
# Make all shell scripts executable
chmod +x *.sh

# Then run
./start.sh dev
```

### Slow Build/Startup

First build takes 30-60 seconds (normal). Subsequent changes are faster (5-10 seconds).

### ngcc Warnings

These are safe to ignore:
```
[ngcc] Trying to import @angular/... from ... which resolved to @angular/...
```

## Advanced: Using stop.sh

```bash
./stop.sh               # Gracefully stops all servers

# Check if servers are still running
ps aux | grep node
ps aux | grep ng
```

## Environment Variables

For development, you can override ports:

```bash
# Run backend on different port
PORT=3001 npm run start:server

# Run frontend on different port
ng serve --port 4201
```

## Systemd Service (Optional)

For running as a service on Linux, see the full STARTUP.md for systemd configuration.

---

**TL;DR:**
```bash
chmod +x start.sh stop.sh
./start.sh dev
# Open http://localhost:4200
```
