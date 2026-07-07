#!/bin/sh
set -e

echo "Applying database schema..."
npx prisma db push

echo "Ensuring seed data..."
npx prisma db seed

echo "Starting Youngeun Office..."
exec npm start
