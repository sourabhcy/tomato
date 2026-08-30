#!/bin/bash
# Deploy the staging stack locally via docker compose. No cloud registry/SSH involved.
# Usage: ./scripts/deploy-staging.sh
set -e

cd "$(dirname "$0")/.."

# Build the app image from the full repo context (needs source, not just compose files).
docker build \
  --build-arg NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID="$(grep ^NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID= .env.staging | cut -d= -f2-)" \
  --build-arg NEXT_PUBLIC_NEW_RELIC_AGENT_ID="$(grep ^NEXT_PUBLIC_NEW_RELIC_AGENT_ID= .env.staging | cut -d= -f2-)" \
  --build-arg NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID="$(grep ^NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID= .env.staging | cut -d= -f2-)" \
  --build-arg NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY="$(grep ^NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY= .env.staging | cut -d= -f2-)" \
  --build-arg NEXT_PUBLIC_NEW_RELIC_TRUST_KEY="$(grep ^NEXT_PUBLIC_NEW_RELIC_TRUST_KEY= .env.staging | cut -d= -f2-)" \
  -t ecommerce-app:staging .

DEPLOY_DIR="${DEPLOY_DIR:-/home/sourabh/experimental/deployment}"
mkdir -p "${DEPLOY_DIR}"

cp docker-compose.staging.yml nginx.staging.conf .env.staging "${DEPLOY_DIR}/"

cd "${DEPLOY_DIR}"
# Force-remove any containers from a prior deploy dir/project to avoid fixed-name conflicts (matches Jenkinsfile).
docker rm -f postgres-staging ecommerce-app-staging nginx-proxy-staging 2>/dev/null || true
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d
docker exec nginx-proxy-staging nginx -s reload || true

PORT="$(grep ^NGINX_PORT= .env.staging | cut -d= -f2-)"
echo "Staging stack deployed. App available at http://localhost:${PORT:-8080}"
