#!/bin/sh
set -e

echo "[Entrypoint] Running Prisma migrations..."
cd /app
if npx prisma migrate deploy; then
  echo "[Entrypoint] Migrations complete"
else
  echo "[Entrypoint] WARNING: Prisma migration failed - check logs above"
fi

echo "[Entrypoint] Starting server..."
cd /app/server
exec npx tsx server.ts
