#!/bin/sh
set -e

echo "[entrypoint] Applying database schema..."
npx prisma db push

echo "[entrypoint] Ensuring seed data..."
if ! npx prisma db seed; then
  echo "[entrypoint] Seed failed" >&2
  exit 1
fi

echo "[entrypoint] Starting Youngeun Office..."
exec npm start
