# Quick Reference

## Production Deployment (Most Common)

```bash
# First time setup
npm install
cd server && npm install && cd ..
chmod +x start.sh stop.sh

# Start server (builds Angular + starts backend)
./start.sh

# Stop server
./stop.sh

# Access app
http://sanderson-rpg.local:3000
# or
http://<mini-pc-ip>:3000
```

## Auto-Start on Boot

```bash
# Edit paths in sanderson-rpg.service first
sudo cp sanderson-rpg.service /etc/systemd/system/
sudo systemctl enable sanderson-rpg
sudo systemctl start sanderson-rpg
```

## Docker (Optional)

```bash
# Build and run
docker-compose up -d

# Stop
docker-compose down
```

## Development Mode

```bash
# Hot reload for development
./start.sh dev

# Manual (two terminals)
# Terminal 1:
cd server && node server.js

# Terminal 2:
npm start
```

## Network Discovery (mDNS)

```bash
# Setup once
sudo apt-get install avahi-daemon
sudo hostnamectl set-hostname sanderson-rpg
sudo systemctl enable avahi-daemon
sudo systemctl start avahi-daemon

# Access from any device on network
http://sanderson-rpg.local:3000
```

## Troubleshooting

```bash
# Check if running
curl http://localhost:3000/api/health

# View logs
tail -f logs/backend.log

# Kill stuck processes
lsof -ti:3000 | xargs kill -9

# Rebuild everything
rm -rf node_modules dist .angular
npm install
npm run build:prod
```

## Backup Characters

```bash
tar -czf backup-$(date +%Y%m%d).tar.gz server/characters/
```

## Common Issues

| Problem | Solution |
|---------|----------|
| Port in use | `lsof -ti:3000 \| xargs kill -9` |
| Can't access from network | Check firewall: `sudo ufw allow 3000` |
| mDNS not working | Use IP address instead |
| Build fails | Clear caches: `rm -rf node_modules && npm install` |

## URLs

| Environment | URL |
|-------------|-----|
| Production | `http://<mini-pc-ip>:3000` |
| Production (mDNS) | `http://sanderson-rpg.local:3000` |
| Development (frontend) | `http://localhost:4200` |
| Development (backend) | `http://localhost:3000` |
| Docker | `http://localhost:3000` |
