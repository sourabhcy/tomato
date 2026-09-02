#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

: "${R2_PUBLIC_BASE_URL:?Set R2_PUBLIC_BASE_URL before deploying}"

DEPLOY_DIR="${DEPLOY_DIR:-/home/sourabh/experimental/deployment}"
ENV_FILE="${ENV_FILE:-.env.staging}"
export APP_PORT="${APP_PORT:-3000}"
export NGINX_PORT="${NGINX_PORT:-8081}"

./scripts/write-runtime-env.sh "$ENV_FILE"

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  docker build \
    --build-arg NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID="${NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID:-}" \
    --build-arg NEXT_PUBLIC_NEW_RELIC_AGENT_ID="${NEXT_PUBLIC_NEW_RELIC_AGENT_ID:-}" \
    --build-arg NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID="${NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID:-}" \
    --build-arg NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY="${NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY:-}" \
    --build-arg NEXT_PUBLIC_NEW_RELIC_TRUST_KEY="${NEXT_PUBLIC_NEW_RELIC_TRUST_KEY:-}" \
    -t ecommerce-app:staging .
fi

mkdir -p "${DEPLOY_DIR}"

cp docker-compose.staging.yml nginx.staging.conf "$ENV_FILE" "${DEPLOY_DIR}/"
cp -R migrations "${DEPLOY_DIR}/"

cd "${DEPLOY_DIR}"
docker compose -f docker-compose.staging.yml --env-file "$(basename "$ENV_FILE")" up -d --remove-orphans

echo "Staging stack deployed. App available at http://localhost:${NGINX_PORT}"
