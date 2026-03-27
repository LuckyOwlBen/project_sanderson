#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SYSTEMD_DIR="${HOME}/.config/systemd/user"

echo "=== Sanderson RPG - Podman Service Installation ==="

# Create named volumes for persistence
echo "Creating Podman volumes..."
podman volume create sanderson-rpg-db 2>/dev/null || echo "  sanderson-rpg-db already exists"
podman volume create sanderson-rpg-characters 2>/dev/null || echo "  sanderson-rpg-characters already exists"
podman volume create sanderson-rpg-images 2>/dev/null || echo "  sanderson-rpg-images already exists"

# Create user systemd directory
mkdir -p "${SYSTEMD_DIR}"

# Copy systemd service file
echo "Installing systemd service..."
cp "${SCRIPT_DIR}/sanderson-rpg.service" "${SYSTEMD_DIR}/"

# Enable lingering so the service runs without an active login session
echo "Enabling user lingering..."
loginctl enable-linger "$(whoami)"

# Reload systemd to pick up the new service
echo "Reloading systemd..."
systemctl --user daemon-reload

# Enable the service to start on boot
echo "Enabling service..."
systemctl --user enable sanderson-rpg

echo ""
echo "=== Installation Complete ==="
echo ""
echo "Next steps:"
echo "  1. Build the image:   ./deploy/build.sh"
echo "  2. Start the service: systemctl --user start sanderson-rpg"
echo "  3. Check status:      systemctl --user status sanderson-rpg"
echo "  4. View logs:         journalctl --user -u sanderson-rpg -f"
echo ""
echo "The service will auto-start on boot (lingering enabled)."
echo "Data is stored in Podman volumes: sanderson-rpg-db, sanderson-rpg-characters, sanderson-rpg-images"
echo ""
echo "To inspect or back up volume data:"
echo "  podman volume inspect sanderson-rpg-db"
echo "  podman volume export sanderson-rpg-db > db-backup.tar"
