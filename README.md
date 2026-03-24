This repo is unfortunately AI slop. I tried so hard to remediate it but the data is still flaky because I built it front end backward out of lazyness. I'm starting over back end forward so this never happens again. 

# Sanderson RPG - Character Management System

Web-based character creator and session manager for tabletop RPG sessions. Built with Angular 21, Express, Socket.io, and SQLite.

## Quick Start (Development)

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Start both frontend and backend with hot reload
npm start
```

Frontend: `http://localhost:4200` | Backend API: `http://localhost:3000/api`

## Production Deployment (Podman + systemd)

The recommended production deployment uses **Podman** with a **systemd user service** for container lifecycle management. No docker-compose, no manual PID tracking — just systemd.

### Prerequisites

- [Podman](https://podman.io/docs/installation) installed on the host
- Git (to clone the repo)

### First-Time Setup

```bash
# Clone and enter the repo
git clone <repo-url> && cd project_sanderson

# Install the systemd service (creates data dirs, copies unit file)
chmod +x deploy/*.sh
./deploy/install.sh

# Build the container image
./deploy/build.sh

# Start the service
systemctl --user start sanderson-rpg
```

The app is now running on port 80. Access it at `http://<host-ip>` or `http://sanderson-rpg.local`.

### Manage the Service

```bash
# Start / stop / restart
systemctl --user start sanderson-rpg
systemctl --user stop sanderson-rpg
systemctl --user restart sanderson-rpg

# Check status
systemctl --user status sanderson-rpg

# Follow logs
journalctl --user -u sanderson-rpg -f

# The service auto-starts on boot (lingering is enabled during install)
```

### Update After Code Changes

```bash
git pull
./deploy/update.sh    # Rebuilds image and restarts service
```

### Persistent Data

All persistent data lives at `/opt/sanderson-rpg/data/`:

| Path | Contents |
|------|----------|
| `data/db/dev.db` | SQLite database (characters, progression, resources) |
| `data/characters/` | Character JSON snapshots |
| `data/images/` | Uploaded character portraits |

Back up this directory to preserve all game data.

### Port Configuration

By default the container serves on **host port 80**. To change this, edit `deploy/sanderson-rpg.service` and change the `-p 80:3000` flag:

```
-p 8080:3000    # Change 80 to your preferred port
```

Then reload: `systemctl --user daemon-reload && systemctl --user restart sanderson-rpg`

### Host Port 80 (Rootless Podman)

If running rootless and port 80 is rejected, either:

```bash
# Option A: Allow unprivileged ports down to 80
sudo sysctl -w net.ipv4.ip_unprivileged_port_start=80
echo "net.ipv4.ip_unprivileged_port_start=80" | sudo tee /etc/sysctl.d/99-unprivileged-ports.conf

# Option B: Use a higher port (e.g., 3000 or 8080) in the .container file — no sysctl needed
```

## Features

- **Character Creation Wizard**: Ancestry → Culture → Attributes → Skills → Paths → Talents
- **Character Sheet**: Live gameplay view with resource tracking
- **Image Upload**: Custom character portraits with automatic WebP compression
- **Session Management**: Notes, resource tracking, auto-save
- **Multi-User**: Multiple devices connect via Socket.io
- **Persistent Storage**: SQLite database + JSON file snapshots

## Architecture

- **Frontend**: Angular 21 (standalone components, Material Design)
- **Backend**: Express.js + Socket.io (TypeScript, runs via tsx)
- **Database**: SQLite via Prisma ORM
- **Deployment**: Podman container managed by systemd

## Development

```bash
# Start both frontend (4200) and backend (3000) with hot reload
npm start

# Run all tests
npm test

# Run UI tests in watch mode
npm run test:watch

# Run server tests
npm run test:server

# Production build (output: dist/project-sanderson/browser/)
npm run build:prod
```

## Tech Stack

- Angular 21 + Angular Material
- Node.js 22+ / TypeScript / tsx
- Express.js + Socket.io
- SQLite + Prisma ORM
- Vitest (testing)
- Podman + Quadlet (deployment)
