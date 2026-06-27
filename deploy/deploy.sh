#!/bin/bash
set -e

echo "==> Pulling latest code..."
git pull origin main

echo "==> Rebuilding frontend (no cache)..."
sudo docker compose -f docker-compose.prod.yml build --no-cache frontend

echo "==> Rebuilding backend..."
sudo docker compose -f docker-compose.prod.yml build backend

echo "==> Starting services..."
sudo docker compose -f docker-compose.prod.yml up -d

echo "==> Done! Services running:"
sudo docker compose -f docker-compose.prod.yml ps
