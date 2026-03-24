#!/bin/sh
set -e

echo "[Entrypoint] Running Prisma migrations..."
cd /app
npx prisma migrate deploy 2>/dev/null || echo "[Entrypoint] No pending migrations (or first run)"

echo "[Entrypoint] Starting server..."
cd /app/server
exec npx tsx server.ts
