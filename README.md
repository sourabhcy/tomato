# Northstar Market

Northstar Market is a Next.js e-commerce storefront backed by PostgreSQL. It includes product browsing, cart management, JWT session authentication, and role-based administration for users and inventory.

## Technology

- **Application:** Next.js 16 App Router with React 19 and TypeScript
- **Data:** PostgreSQL through the `pg` connection pool
- **Authentication:** signed JWT sessions with `jose` and password hashing with `bcrypt`
- **Testing:** Jest for unit tests and Playwright for browser tests
- **Delivery:** Docker multi-stage builds, Docker Compose, Nginx, and Jenkins
- **Monitoring:** optional New Relic browser agent

## Architecture

The application uses a layered, server-first design:

```text
Browser → Next.js pages and client components → Server Actions / Route Handlers
        → authorization and service layer → PostgreSQL
```

- `app/` contains App Router pages, Server Actions for mutations, and the paginated product API route.
- `components/` contains interactive UI only; it does not access the database directly.
- `services/` owns database queries, while `db/pool.ts` provides the shared PostgreSQL pool.
- `lib/session.ts`, `lib/rbac.ts`, and `lib/authorize.ts` centralize session handling and permission checks.
- `proxy.ts` protects `/admin/*` before the page is rendered; Server Actions repeat permission checks as defense in depth.

For diagrams and the detailed request/data flow, see [`docs/architecture.md`](docs/architecture.md).

## Practices used in this project

- **Least-privilege authorization:** permissions are defined once in `lib/rbac.ts`; route access and mutation access are checked separately.
- **Protected sessions:** session cookies are `httpOnly`, `sameSite=lax`, and `secure` in production; JWTs expire after one hour.
- **Server-side data access:** database credentials and queries stay outside client components.
- **Input and upload controls:** product CSV imports validate the exact header and fields, reject unsafe paths and spreadsheet-formula prefixes, and cap uploads at 2 MB and 5,000 rows.
- **Bounded API requests:** the product API validates pagination input and caps requests at 200 products per request.
- **Transactional writes:** inventory imports use a database transaction, rolling back the whole import if a write fails.
- **Repeatable builds and checks:** `npm ci` uses the lockfile; Jenkins runs unit tests and linting before deployment; the container uses a multi-stage production build.

## Requirements

- Node.js 25 (the Docker image and Jenkins pipeline use Node 25)
- npm
- PostgreSQL 16 or Docker with Docker Compose v2

## Local development

1. Install the locked dependencies:

   ```bash
   npm ci
   ```

2. Create `.env.local` with your local database connection and a strong session secret:

   ```dotenv
   DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<database>
   SESSION_SECRET=<long-random-secret>
   R2_PUBLIC_BASE_URL=https://<public-image-host>
   ```

   `R2_PUBLIC_BASE_URL` is required when product image keys are stored in the database. The New Relic variables are optional for local development.

3. Provision the database schema before starting the app. The application requires the `users`, `products`, `cart_items`, and `product_images` tables. This repository currently contains only [`migrations/001_product_images.sql`](migrations/001_product_images.sql), which must be applied after the base `products` table exists; it does not include the initial schema or seed data.

4. Start the development server:

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm test
npm run lint
npm run build
```

For end-to-end tests, install the Playwright browser once, then run the suite:

```bash
npx playwright install chromium
npm run test:e2e
```

The e2e configuration starts the development server automatically unless `CI` is set. Set `PLAYWRIGHT_BASE_URL` to test an already-running deployment.

## Local Docker development

The staging stack runs the Next.js container, PostgreSQL, and Nginx locally. Create `.env.staging` with the following values:

```dotenv
NODE_ENV=production
POSTGRES_USER=<database-user>
POSTGRES_PASSWORD=<database-password>
POSTGRES_DB=<database-name>
DATABASE_URL=postgresql://<database-user>:<database-password>@postgres:5432/<database-name>
SESSION_SECRET=<long-random-secret>
R2_PUBLIC_BASE_URL=https://<public-image-host>
NGINX_PORT=8080
```

The `R2_PUBLIC_BASE_URL` must be the public origin for the image bucket or CDN, without a trailing slash (for example, `https://cdn.example.com`). Product imports store relative object keys, and the app renders each image as `<R2_PUBLIC_BASE_URL>/<object-key>`. Upload those objects to the bucket/CDN before importing the CSV; this application does not upload image files itself.

Optionally add the five `NEXT_PUBLIC_NEW_RELIC_*` values used by `components/NewRelicAgent.tsx` if browser monitoring is configured.

For a local Docker-based development environment, run:

```bash
./scripts/deploy-staging.sh
```

This helper is for local development only. It builds `ecommerce-app:staging`, starts PostgreSQL, applies `migrations/001_product_images.sql`, and starts Nginx. It copies the local stack to `DEPLOY_DIR` (default: `/home/sourabh/experimental/deployment`). The site is available at `http://localhost:<NGINX_PORT>`.

Because the script only runs the product-images migration, initialize the base schema before using a new staging database.

## Deployment

The [`Jenkinsfile`](Jenkinsfile) is the source of truth for staging and production deployments:

1. Configure the Jenkins NodeJS installation named `NodeJS-25`, Docker access for the Jenkins agent, and the following credentials. The credential IDs must match exactly because the pipeline references them by name:

   | Credential ID | Type | Used for |
   | --- | --- | --- |
   | `SESSION_SECRET` | Secret text | Signing user sessions; use a long random value. |
   | `postgres-user`, `postgres-password`, `postgres-db` | Secret text | Production PostgreSQL user, password, and database name. |
   | `postgres-user-staging`, `postgres-password-staging`, `postgres-db-staging` | Secret text | Staging PostgreSQL user, password, and database name. |
   | `r2-public-base-url-production`, `r2-public-base-url-staging` | Secret text | Public image-bucket/CDN origin, such as `https://cdn.example.com`, with no trailing slash. |
   | `new-relic-account-id`, `new-relic-agent-id`, `new-relic-application-id`, `new-relic-license-key`, `new-relic-trust-key` | Secret text | New Relic browser monitoring values. Create empty secret-text values only if monitoring is intentionally disabled. |
   | `digitalocean_secreat_api_key` | Secret text | DigitalOcean registry token. The spelling is intentional and must match the Jenkinsfile. |
   | `digitalocean-droplet` | SSH username with private key | SSH access to the production host. |

   Store these values in Jenkins credentials, not in the repository or an environment file committed to Git.
2. Run the pipeline with `DEPLOY_ENV=staging` or `DEPLOY_ENV=production`, and select the branch to release. For staging, also supply `STAGING_NGINX_PORT` if the default is unsuitable.
3. Jenkins runs unit tests and linting, builds the Docker image, prepares the environment file, and deploys the selected target. Production images are pushed to the configured DigitalOcean registry before the remote Docker Compose update.

The production Compose stack uses the image `registry.digitalocean.com/ecom-next-registry/ecommerce-app:latest`, PostgreSQL 16, and Nginx with TLS configured in [`nginx.conf`](nginx.conf). Docker Compose creates the application, PostgreSQL, and Nginx containers during the first production deployment; do not create them manually.

Before the first production deployment, prepare the remote host:

- Install Docker Engine and the Docker Compose v2 plugin, and ensure the Jenkins SSH user can run Docker commands.
- Allow inbound ports 80 and 443; Jenkins creates `/opt/apps/ecommerce-app` automatically.
- Configure the production hostname and certificate paths in `nginx.conf`, then obtain the corresponding TLS certificate in the named `certbot-etc` volume. The shipped configuration uses a fixed hostname, so update it before deploying another domain.
- Initialize the database schema before the application starts. The Compose file creates the PostgreSQL container and persistent volume, but it does not load a base schema.

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run build` | Create a production build. |
| `npm start` | Serve the production build. |
| `npm test` | Run Jest unit tests. |
| `npm run test:e2e` | Run Playwright end-to-end tests. |
| `npm run lint` | Run ESLint. |

For application architecture and troubleshooting commands, see [`docs/architecture.md`](docs/architecture.md) and [`utility.md`](utility.md).
