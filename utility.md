# Staging Utility Commands

Quick reference for debugging the local staging stack (`docker-compose.staging.yml`,
deployed from [scripts/deploy-staging.sh](scripts/deploy-staging.sh) into `DEPLOY_DIR`,
default `/home/sourabh/experimental/deployment`).

Run these from anywhere once containers are up; `docker` resolves containers by name
regardless of cwd. Container names: `ecommerce-app-staging`, `postgres-staging`,
`nginx-proxy-staging`.

## Container access

```bash
# List running staging containers
docker ps --filter "name=staging"

# Shell into the app container
docker exec -it ecommerce-app-staging sh

# Shell into the nginx container
docker exec -it nginx-proxy-staging sh

# Shell into the postgres container
docker exec -it postgres-staging sh
```

## Database access

```bash
# Open a psql shell (uses POSTGRES_USER/POSTGRES_DB from .env.staging)
docker exec -it postgres-staging psql -U ecommerce_user -d ecommerce

# One-off query without an interactive shell
docker exec -it postgres-staging psql -U ecommerce_user -d ecommerce -c "SELECT * FROM users;"
```

Useful queries once inside `psql`:

```sql
\dt                                     -- list tables
SELECT * FROM users;
SELECT * FROM products;
SELECT * FROM cart_items ORDER BY user_id;
SELECT u.email, p.name FROM cart_items ci
  JOIN users u ON u.id = ci.user_id
  JOIN products p ON p.id = ci.product_id;
```

## Tailing logs for user actions (login, add to cart)

The app itself doesn't currently log business actions (no `console.log` in
[app/actions/auth.ts](app/actions/auth.ts) or [app/actions/cart.ts](app/actions/cart.ts)),
so the two places to observe activity are the nginx access log (every request) and the
app container's stdout (server errors/output).

```bash
# Tail nginx access/error log (shows every request path, status, method)
docker logs -f nginx-proxy-staging

# Filter to just login and cart requests
docker logs -f nginx-proxy-staging 2>&1 | grep -E "GET /login|POST /login|/cart"

# Tail the app container's own stdout/stderr
docker logs -f ecommerce-app-staging

# Tail both app and nginx together
docker compose -f docker-compose.staging.yml logs -f ecommerce-app nginx
```

(Run the `docker compose` variant from `DEPLOY_DIR` where `docker-compose.staging.yml`
was copied, e.g. `cd /home/sourabh/experimental/deployment`.)

### If you need finer-grained action logs

Since login/add-to-cart aren't logged explicitly, add a `console.log`/`console.error`
in the relevant server actions, e.g.:

```ts
// app/actions/auth.ts - inside the login handler
console.log(`[auth] login attempt email=${email}`);
```

```ts
// app/actions/cart.ts - inside the add-to-cart handler
console.log(`[cart] add product=${productId} user=${userId}`);
```

Rebuild/redeploy (`./scripts/deploy-staging.sh`), then `docker logs -f ecommerce-app-staging`
will show those lines as users interact with the app.
