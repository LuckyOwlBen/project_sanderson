#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Sanderson RPG - Update ==="

# Rebuild image
echo "Rebuilding container image..."
"${SCRIPT_DIR}/build.sh"

# Restart the service
echo "Restarting service..."
systemctl --user restart sanderson-rpg

echo ""
echo "Update complete. Check status:"
echo "  systemctl --user status sanderson-rpg"
echo "  journalctl --user -u sanderson-rpg -f"
