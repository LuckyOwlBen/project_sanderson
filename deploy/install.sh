#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="/opt/sanderson-rpg/data"
QUADLET_DIR="${HOME}/.config/containers/systemd"

echo "=== Sanderson RPG - Podman Quadlet Installation ==="

# Create persistent data directories
echo "Creating data directories at ${DATA_DIR}..."
sudo mkdir -p "${DATA_DIR}/db" "${DATA_DIR}/characters" "${DATA_DIR}/images"
sudo chown -R "$(id -u):$(id -g)" "${DATA_DIR}"

# Create Quadlet directory
mkdir -p "${QUADLET_DIR}"

# Copy Quadlet unit files
echo "Installing Quadlet container file..."
cp "${SCRIPT_DIR}/sanderson-rpg.container" "${QUADLET_DIR}/"

# Enable lingering so the service runs without an active login session
echo "Enabling user lingering..."
loginctl enable-linger "$(whoami)"

# Reload systemd to pick up the new Quadlet file
echo "Reloading systemd..."
systemctl --user daemon-reload

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
echo "Data is stored at: ${DATA_DIR}"
