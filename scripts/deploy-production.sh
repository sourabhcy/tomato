#!/usr/bin/env sh
set -eu

DEPLOY_DIR="${DEPLOY_DIR:-/opt/apps/ecommerce-app}"
cd "$DEPLOY_DIR"

docker compose --env-file .env up -d --remove-orphans
docker compose exec -T nginx nginx -s reload