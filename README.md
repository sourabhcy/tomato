# Northstar Market (ecom-next)

A Next.js (App Router) e-commerce storefront with PostgreSQL, session-based auth, and role-based access control (RBAC) for admin-managed users and inventory.

See [docs/architecture.md](docs/architecture.md) for the full architecture, data flow diagrams, and responsibility boundaries.

## Features

- Product catalog with virtualized, paginated browsing (`/products`)
- Cart (`/cart`) backed by a `cart_items` relation table
- Session-based auth (JWT via `jose`, `bcrypt` password hashing)
- Role-based access control: `admin` users can manage sub-users (`/admin/users`) and upload a CSV to update the product inventory (`/admin/settings`); non-admins are blocked at the proxy (middleware) layer and redirected to `/unauthorized`

## Tech stack

- Next.js 16 (App Router, Server Actions, Route Handlers)
- PostgreSQL (`pg` driver, connection pool in `db/pool.ts`)
- Jest (unit tests) + Playwright (e2e tests)
- Docker / Docker Compose for local staging and production deployment
- Jenkins pipeline for CI/CD (staging and production, same `Jenkinsfile`)

## Getting started (local development)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start PostgreSQL and create the schema/seed data — see `db/init.sql` (auto-runs on first container start if using Docker; run manually against your own Postgres instance otherwise).
3. Copy `.env.local` (or create one) with at least:
   ```
   DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<db>
   SESSION_SECRET=<any-random-string>
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build (also type-checks) |
| `npm start` | Run the production build |
| `npm test` | Run Jest unit tests |
| `npm run test:e2e` | Run Playwright e2e tests |
| `npm run lint` | Run ESLint |

## Deployment

- **Staging** (local Docker stack, mirrors production): `./scripts/deploy-staging.sh`, or trigger the Jenkins pipeline with `DEPLOY_ENV=staging`. Uses `docker-compose.staging.yml` / `nginx.staging.conf` / `.env.staging`.
- **Production** (DigitalOcean droplet): trigger the Jenkins pipeline with `DEPLOY_ENV=production`. Builds and pushes to the DO container registry, then deploys over SSH using `docker-compose.yml` / `nginx.conf`.
- See [utility.md](utility.md) for debugging commands (container/DB access, log tailing) against the staging stack.
