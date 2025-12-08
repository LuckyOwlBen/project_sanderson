# Deployment Guide

This guide covers different deployment options for the Sanderson RPG Character Management System.

## Table of Contents
1. [Production Mode (Recommended)](#production-mode-recommended)
2. [Docker Deployment](#docker-deployment)
3. [Network Access Configuration](#network-access-configuration)
4. [Troubleshooting](#troubleshooting)

---

## Production Mode (Recommended)

Best for dedicated mini PC hardware. Single Node.js process serves everything.

### First-Time Setup

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Make scripts executable (Linux/Mac)
chmod +x start.sh stop.sh
```

### Build and Deploy

```bash
# Linux/Mac
./start.sh prod

# Windows
npm run build:prod
# Then copy dist/project-sanderson/browser to server/dist
# Then: cd server && set NODE_ENV=production && node server.js
```

### What Happens
1. Angular app is built to static files (~600KB)
2. Files copied to `server/dist/`
3. Node.js server starts on port 3000
4. Server serves both app and API endpoints
5. Accessible at `http://<mini-pc-ip>:3000`

### Resource Usage
- **RAM**: ~50MB (just Node.js)
- **CPU**: <1% idle, ~5% under load
- **Disk**: ~15MB (code + dependencies)
- **Startup**: ~3 seconds

### Auto-Start on Boot (systemd)

```bash
# Edit sanderson-rpg.service with your paths
sudo nano sanderson-rpg.service

# Install service
sudo cp sanderson-rpg.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable sanderson-rpg
sudo systemctl start sanderson-rpg

# Check status
sudo systemctl status sanderson-rpg

# View logs
journalctl -u sanderson-rpg -f
```

---

## Docker Deployment

Use if you want containerization or plan to deploy to cloud later.

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Quick Start

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### What Happens
1. Multi-stage build compiles Angular in builder container
2. Production image copies only necessary files
3. Single container serves app + API on port 3000
4. Character data persisted to `server/characters/` via volume

### Resource Usage
- **RAM**: ~150MB (includes Docker overhead)
- **CPU**: <1% idle, ~5-10% under load
- **Disk**: ~200MB (image + layers)
- **Startup**: ~10 seconds (first time), ~3 seconds (subsequent)

### Production Docker Commands

```bash
# Build specific version
docker build -t sanderson-rpg:1.0.0 .

# Run with custom port
docker run -d \
  --name sanderson-rpg \
  -p 80:3000 \
  -v $(pwd)/server/characters:/app/characters \
  --restart unless-stopped \
  sanderson-rpg:1.0.0

# Update to new version
docker stop sanderson-rpg
docker rm sanderson-rpg
docker build -t sanderson-rpg:1.0.1 .
docker run -d ... (same command as above)
```

### Docker Compose with Traefik (Advanced)

For automatic HTTPS and reverse proxy:

```yaml
version: '3.8'
services:
  sanderson-rpg:
    build: .
    networks:
      - traefik
    volumes:
      - ./server/characters:/app/characters
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.sanderson.rule=Host(`sanderson-rpg.local`)"
      - "traefik.http.services.sanderson.loadbalancer.server.port=3000"

networks:
  traefik:
    external: true
```

---

## Network Access Configuration

### Access via IP Address

**Find your mini PC's IP:**
```bash
# Linux/Mac
ip addr show | grep inet

# Windows
ipconfig

# Common result: 192.168.1.100
```

**Access from other devices:**
- Web browser: `http://192.168.1.100:3000`
- Replace `192.168.1.100` with your actual IP

### Access via Hostname (mDNS)

**Install Avahi (Linux):**
```bash
# Ubuntu/Debian
sudo apt-get install avahi-daemon avahi-utils

# Start service
sudo systemctl enable avahi-daemon
sudo systemctl start avahi-daemon

# Set hostname
sudo hostnamectl set-hostname sanderson-rpg
```

**Access from other devices:**
- Web browser: `http://sanderson-rpg.local:3000`
- Works on: macOS, iOS, Windows 10/11, Linux
- May need Bonjour app on Android

### Firewall Configuration

**Allow port 3000:**
```bash
# UFW (Ubuntu)
sudo ufw allow 3000/tcp

# Firewalld (Fedora/RHEL)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

### Using Port 80 (No Port in URL)

**Run on port 80 (requires root):**
```bash
# Option 1: Use sudo
sudo PORT=80 node server/server.js

# Option 2: Use authbind (Linux)
sudo apt-get install authbind
sudo touch /etc/authbind/byport/80
sudo chmod 755 /etc/authbind/byport/80
authbind --deep node server/server.js

# Option 3: Use nginx reverse proxy (recommended)
sudo apt-get install nginx
```

**Nginx config (`/etc/nginx/sites-available/sanderson-rpg`):**
```nginx
server {
    listen 80;
    server_name sanderson-rpg.local 192.168.1.100;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable nginx:
```bash
sudo ln -s /etc/nginx/sites-available/sanderson-rpg /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Now access at: `http://sanderson-rpg.local` (no port needed)

---

## Troubleshooting

### Server Won't Start

**Check port availability:**
```bash
# Linux/Mac
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

**Kill existing process:**
```bash
# Linux/Mac
kill -9 $(lsof -ti:3000)

# Windows
taskkill /PID <PID> /F
```

### Can't Access from Network

1. **Verify server binds to 0.0.0.0:**
   - Check `server/server.js` contains: `app.listen(PORT, '0.0.0.0', ...)`

2. **Check firewall:**
   ```bash
   sudo ufw status
   sudo firewall-cmd --list-all
   ```

3. **Verify network connectivity:**
   ```bash
   # From other device, ping mini PC
   ping 192.168.1.100
   ```

4. **Check server is running:**
   ```bash
   curl http://localhost:3000/api/health
   ```

### Character Data Not Persisting

**Verify characters directory:**
```bash
ls -la server/characters/
```

**Check permissions:**
```bash
# Ensure write access
chmod 755 server/characters/
```

**Docker volume check:**
```bash
docker inspect sanderson-rpg | grep Mounts -A 10
```

### Build Failures

**Clear caches:**
```bash
rm -rf node_modules dist .angular
npm install
npm run build:prod
```

**Check Node.js version:**
```bash
node --version  # Should be 18.x or higher
```

### mDNS Not Working

**Verify Avahi is running:**
```bash
sudo systemctl status avahi-daemon
```

**Test local resolution:**
```bash
avahi-browse -a -t
ping sanderson-rpg.local
```

**Fallback to IP:**
If mDNS doesn't work, use IP address directly.

---

## Performance Optimization

### Production Build Optimization

Already enabled in Angular config:
- Tree shaking (removes unused code)
- Minification
- Bundling
- Ahead-of-Time (AOT) compilation

### Nginx Caching (Optional)

For even better performance, add nginx in front:

```nginx
location / {
    proxy_pass http://localhost:3000;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Compression

Express.js compression (add to server.js):
```javascript
const compression = require('compression');
app.use(compression());
```

---

## Monitoring

### Health Check

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-08T19:45:00.000Z",
  "mode": "production"
}
```

### Log Files

**systemd service:**
```bash
journalctl -u sanderson-rpg -f
```

**Shell scripts:**
```bash
tail -f logs/backend.log
```

**Docker:**
```bash
docker logs -f sanderson-rpg
```

### Resource Monitoring

```bash
# Process stats
top -p $(pgrep -f "node.*server.js")

# Memory usage
ps aux | grep node

# Disk usage
du -sh server/characters/
```

---

## Backup and Restore

### Backup Character Data

```bash
# Local backup
tar -czf characters-backup-$(date +%Y%m%d).tar.gz server/characters/

# Remote backup
rsync -av server/characters/ backup-server:/path/to/backup/
```

### Restore Character Data

```bash
# From tarball
tar -xzf characters-backup-20251208.tar.gz -C server/

# From remote
rsync -av backup-server:/path/to/backup/ server/characters/
```

### Full System Backup

```bash
# Exclude node_modules and build artifacts
tar -czf sanderson-rpg-full-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.angular \
  --exclude=logs \
  project_sanderson/
```

---

## Update Procedure

1. **Backup current data:**
   ```bash
   ./stop.sh
   tar -czf backup-$(date +%Y%m%d).tar.gz server/characters/
   ```

2. **Pull latest code:**
   ```bash
   git pull origin main
   ```

3. **Update dependencies:**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

4. **Rebuild:**
   ```bash
   npm run build:prod
   ```

5. **Restart:**
   ```bash
   ./start.sh prod
   ```

---

## Migration to Cloud (Future)

If you decide to move to cloud hosting later, Docker makes it easy:

**AWS ECS:**
```bash
docker tag sanderson-rpg:latest <account>.dkr.ecr.us-east-1.amazonaws.com/sanderson-rpg:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/sanderson-rpg:latest
```

**DigitalOcean App Platform:**
- Connect GitHub repository
- Auto-detects Dockerfile
- Deploy with one click

**Heroku:**
```bash
heroku create sanderson-rpg
heroku container:push web
heroku container:release web
```

Your Docker setup is already cloud-ready!
