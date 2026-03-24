#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Building Sanderson RPG container image..."
cd "$PROJECT_DIR"
podman build -t sanderson-rpg:latest .
echo "Build complete: sanderson-rpg:latest"
