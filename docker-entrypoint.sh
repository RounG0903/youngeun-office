#!/bin/sh
set -e

echo "[entrypoint] Applying database schema..."
npx prisma db push

echo "[entrypoint] Ensuring seed data..."
if ! npx prisma db seed; then
  echo "[entrypoint] WARN: seed failed; starting app with existing data" >&2
fi

echo "[entrypoint] Starting Youngeun Office..."
exec npm start
