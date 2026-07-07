#!/bin/sh
set -e

echo "Applying database schema..."
npx prisma db push

echo "Ensuring seed data..."
npx prisma db seed

if [ ! -f /data/.initialized ]; then
  touch /data/.initialized
fi

echo "Starting Youngeun Office..."
exec npm start
