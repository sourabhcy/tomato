FROM node:25-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:25-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID
ARG NEXT_PUBLIC_NEW_RELIC_AGENT_ID
ARG NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID
ARG NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY
ARG NEXT_PUBLIC_NEW_RELIC_TRUST_KEY
ENV NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID=$NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID
ENV NEXT_PUBLIC_NEW_RELIC_AGENT_ID=$NEXT_PUBLIC_NEW_RELIC_AGENT_ID
ENV NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID=$NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID
ENV NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY=$NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY
ENV NEXT_PUBLIC_NEW_RELIC_TRUST_KEY=$NEXT_PUBLIC_NEW_RELIC_TRUST_KEY
RUN npm run build

FROM node:25-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]