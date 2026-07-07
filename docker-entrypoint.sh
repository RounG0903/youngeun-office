#!/bin/sh
set -e

echo "[entrypoint] Applying database schema..."
npx prisma db push

echo "[entrypoint] Ensuring seed data..."
npx prisma db seed

echo "[entrypoint] Starting Youngeun Office..."
exec npm start
