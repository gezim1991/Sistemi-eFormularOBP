#!/bin/bash
set -e

echo "==> Adding safe directory..."
git config --global --add safe.directory /opt/e-formular-obp 2>/dev/null || true

echo "==> Pulling latest code..."
git pull origin main

echo "==> Current commit: $(git rev-parse --short HEAD)"

echo "==> Rebuilding frontend (no cache)..."
sudo docker compose -f docker-compose.prod.yml build --no-cache frontend

echo "==> Rebuilding backend (no cache)..."
sudo docker compose -f docker-compose.prod.yml build --no-cache backend

echo "==> Restarting all services (force recreate)..."
sudo docker compose -f docker-compose.prod.yml up -d --force-recreate

echo "==> Done! Services running:"
sudo docker compose -f docker-compose.prod.yml ps
