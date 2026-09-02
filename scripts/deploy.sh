#!/bin/bash
set -e

cat > .env.production << EOF
DATABASE_URL=${DATABASE_URL}
SESSION_SECRET=${SESSION_SECRET}
NODE_ENV=production
EOF

npm run build

mkdir -p ${DEPLOY_DIR}
cp -r .next/standalone/* ${DEPLOY_DIR}/
mkdir -p ${DEPLOY_DIR}/.next
cp -r .next/static ${DEPLOY_DIR}/.next/static
cp -r public ${DEPLOY_DIR}/public
cp .env.production ${DEPLOY_DIR}/.env.production
cp ecosystem.config.js ${DEPLOY_DIR}/ecosystem.config.js

cd ${DEPLOY_DIR}
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js
pm2 save