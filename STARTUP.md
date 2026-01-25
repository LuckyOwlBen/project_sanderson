# Project Sanderson - Startup Guide

## Quick Start

### Production Mode (Recommended for Mini PC)

**Linux/Mac:**
```bash
# Build and start (single command)
./start.sh prod

# Or just (prod is default)
./start.sh

# Stop server
./stop.sh
```

**What it does:**
- Builds Angular app to optimized static files
- Starts single Node.js server on port 80
- Serves both app and API from one process (unified server)
- Accessible network-wide at `http://<mini-pc-ip>`

**Windows:**
```powershell
# Build Angular
npm run build

# Copy build to server
Remove-Item -Recurse -Force server\dist -ErrorAction SilentlyContinue
Copy-Item -Recurse dist\project-sanderson\browser server\dist

# Start in production mode
cd server
$env:NODE_ENV="production"; node server.js
```

### Development Mode

**Linux/Mac:**
```bash
# Start dev servers (hot reload, unified startup)
./start.sh dev

# Or using npm directly
npm start

# Or the quick dev script
./start-dev.sh

# Stop both
./stop.sh
```

**Ports (Dev):**
- Backend API: http://localhost:3000/api
- Frontend App: http://localhost:4200

**Windows:**
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend (hot reload)
npm start
```

**What it does:**
- Backend on port 3000
- Frontend on port 4200 with hot reload
- Use for active development only

### Automatic Startup (Linux/Mac)

#### Using systemd (Linux)

1. Edit the service file with your paths:
```bash
nano sanderson-rpg.service
```

2. Update these lines:
```ini
User=YOUR_USERNAME
WorkingDirectory=/path/to/project_sanderson
ExecStart=/path/to/project_sanderson/start.sh
ExecStop=/path/to/project_sanderson/stop.sh
```

3. Install the service:
```bash
sudo cp sanderson-rpg.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable sanderson-rpg
sudo systemctl start sanderson-rpg
```

4. Manage the service:
```bash
# Check status
sudo systemctl status sanderson-rpg

# View logs
journalctl -u sanderson-rpg -f

# Restart
sudo systemctl restart sanderson-rpg

# Stop
sudo systemctl stop sanderson-rpg
```

#### Using cron (Linux/Mac)

Add to crontab for startup on reboot:
```bash
crontab -e
```

Add this line:
```
@reboot /path/to/project_sanderson/start.sh
```

#### Using LaunchAgent (Mac)

Create `~/Library/LaunchAgents/com.sanderson-rpg.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.sanderson-rpg</string>
    <key>ProgramArguments</key>
    <array>
        <string>/path/to/project_sanderson/start.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/tmp/sanderson-rpg.err</string>
    <key>StandardOutPath</key>
    <string>/tmp/sanderson-rpg.out</string>
</dict>
</plist>
```

Load the service:
```bash
launchctl load ~/Library/LaunchAgents/com.sanderson-rpg.plist
```

### Docker Deployment (Optional)

**Build and run with Docker Compose:**
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

**Direct Docker commands:**
```bash
# Build image
docker build -t sanderson-rpg .

# Run container
docker run -d \
  --name sanderson-rpg \
  -p 3000:3000 \
  -v $(pwd)/server/characters:/app/characters \
  sanderson-rpg

# View logs
docker logs -f sanderson-rpg

# Stop and remove
docker stop sanderson-rpg
docker rm sanderson-rpg
```

## Network Discovery (mDNS/Avahi)

To access the app by name instead of IP (`http://sanderson-rpg.local:3000`):

**Install Avahi (Linux):**
```bash
# Debian/Ubuntu
sudo apt-get install avahi-daemon avahi-utils

# Fedora/RHEL
sudo dnf install avahi avahi-tools

# Arch
sudo pacman -S avahi
```

**Set hostname:**
```bash
sudo hostnamectl set-hostname sanderson-rpg
```

**Enable and start:**
```bash
sudo systemctl enable avahi-daemon
sudo systemctl start avahi-daemon
```

**Test discovery:**
```bash
# From mini PC
avahi-browse -a -t

# From other devices, access:
# http://sanderson-rpg.local:3000
```

**Compatibility:**
- ✅ Linux - Works out of box
- ✅ macOS - Works natively
- ✅ Windows 10/11 - Works (Bonjour included)
- ⚠️ Android - May need Bonjour browser app
- ✅ iOS - Works natively

## Architecture

- **Frontend**: Angular 18 standalone components (client-side rendering)
- **Backend**: Express.js minimal API (~200 lines)
- **Storage**: JSON files in `server/characters/` directory
- **Communication**: REST API with CORS enabled
- **Deployment**: Single process serves both static files and API

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/characters/save` | Save character |
| GET | `/api/characters/list` | List all characters |
| GET | `/api/characters/load/:id` | Load character by ID |
| DELETE | `/api/characters/delete/:id` | Delete character |
| GET | `/api/health` | Health check |

## Configuration

### Toggle Server/LocalStorage Mode

Edit `src/app/services/character-storage.service.ts`:

```typescript
private useServer = true; // false = use localStorage
```

### Change Server Port

Edit `server/server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

Or set environment variable:
```bash
PORT=3001 node server.js
```

### Change API URL

Edit `src/app/services/character-storage.service.ts`:
```typescript
private apiUrl = 'http://localhost:3000/api/characters';
```

For network access, use your mini PC's IP:
```typescript
private apiUrl = 'http://192.168.1.100:3000/api/characters';
```

## Development

Both servers support hot reload:
- Frontend: Watch mode enabled, updates on file save
- Backend: Restart server after changes

## Logs

When using startup scripts, logs are stored in:
- `logs/backend.log` - Backend server output
- `logs/frontend.log` - Frontend server output

View logs:
```bash
tail -f logs/backend.log
tail -f logs/frontend.log
```

## Resource Usage

- **Backend Memory**: ~30-50 MB
- **Frontend Memory**: ~100-150 MB (during build)
- **Storage**: ~5-10 KB per character
- **CPU**: Minimal (event-driven I/O)

## Network Access

To allow other devices to connect:

1. Find your mini PC's IP address:
```bash
# Linux/Mac
ip addr show

# Windows
ipconfig
```

2. Update Angular service with IP address
3. Ensure firewall allows ports 3000 and 4200
4. Connect from other devices using: `http://MINI_PC_IP:4200`

## Deployment

### Mini PC Setup

1. Install Node.js 18+ on mini PC
2. Clone repository
3. Install dependencies:
   ```bash
   npm install
   cd server && npm install
   ```
4. Make scripts executable (Linux/Mac):
   ```bash
   chmod +x start.sh stop.sh
   ```
5. Start servers:
   ```bash
   ./start.sh
### Production Build

```bash
npm run build
```

Serves static files from `dist/` directory. Configure backend to serve Angular build:

```javascript
app.use(express.static(path.join(__dirname, '../dist/project-sanderson')));
```

## Troubleshooting

### CORS Errors
Backend has CORS enabled. If issues persist, check browser console and verify `apiUrl` in character-storage.service.ts.

### Server Not Found
- Verify backend is running on port 3000
- Check `useServer` flag in character-storage.service.ts
- System falls back to localStorage if server unavailable

### Port Already in Use
Change port in server.js or kill existing process:
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9
lsof -ti:4200 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Scripts Won't Execute (Linux/Mac)
Make scripts executable:
```bash
chmod +x start.sh stop.sh
```

### Startup Script Fails
Check logs:
```bash
cat logs/backend.log
cat logs/frontend.log
```

Common issues:
- Node.js not installed
- Dependencies not installed (`npm install`)
- Ports already in use
- Wrong working directory in systemd service

---

## Unified Full Stack Start (NEW - January 2026)

Starting January 2026, you can now start both backend and frontend with a single command.

### Option 1: npm start (Concurrently) - Recommended
```bash
npm start
```
- Starts both in same terminal window with `[0]` and `[1]` prefixes
- Both share one terminal session
- Ctrl+C stops both together
- Great for single monitor setups

### Option 2: PowerShell Script (Separate Windows)
```powershell
.\start-full-stack.ps1
```
- Opens two independent terminal windows
- Can manage each separately
- Close one window to stop that service
- Great for dual monitor setups

### Option 3: Batch Script (Separate Windows)
```cmd
start-full-stack.bat
```
- Same as PowerShell option
- For users who prefer cmd.exe

### Option 4: Manual (Terminal by Terminal)
```bash
# Terminal 1
cd server
npm start
# Backend ready at http://localhost:3000/api

# Terminal 2
ng serve
# Frontend ready at http://localhost:4200
```

### npm Scripts Summary
```bash
npm start              # Both backend + frontend (concurrently)
npm run start:server   # Backend only
npm run start:ui       # Frontend only
npm run start:ui:only  # Alias for start:ui
```

---

## Accessing the Application

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000/api
- **Test Component**: http://localhost:4200/test/attack-roller

The frontend automatically connects to the backend at `localhost:3000` via the `BackendCalculationsService`.
