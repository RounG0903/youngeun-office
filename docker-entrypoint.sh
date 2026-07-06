#!/bin/sh
set -e

echo "Applying database schema..."
npx prisma db push

if [ ! -f /data/.initialized ]; then
  echo "Seeding database..."
  npx prisma db seed
  touch /data/.initialized
fi

echo "Starting Youngeun Office..."
exec npm start
