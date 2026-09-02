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
   R2_PUBLIC_BASE_URL=https://<public-r2-host>
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

- **Staging** (local Docker stack, mirrors production): trigger Jenkins with `DEPLOY_ENV=staging`, or export the required runtime values and run `./scripts/deploy-staging.sh`. The script generates `.env.staging`; it does not read credentials from a checked-in env file. Compose waits for PostgreSQL, applies every file in `migrations/`, and then starts the app.
- **Production** (DigitalOcean droplet): trigger Jenkins with `DEPLOY_ENV=production`. Jenkins builds and pushes the image, generates `.env` from credentials, and deploys `docker-compose.yml`, `nginx.conf`, and `migrations/` over SSH. Compose runs the same migration job before starting the app.
- **Jenkins credentials**: configure `postgres-user-staging`, `postgres-password-staging`, `postgres-db-staging`, `r2-public-base-url-staging` and the corresponding production credentials without the `-staging` suffix. Also configure `SESSION_SECRET`, the New Relic values, `production-droplet-host`, `production-server-name`, and `production-tls-cert-name`. Credential values and public R2 hosts are never committed to the repository.
- See [utility.md](utility.md) for debugging commands (container/DB access, log tailing) against the staging stack.
