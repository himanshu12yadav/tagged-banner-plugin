# Deployment & Environment Guide

## 1. Deployment Options

| Method            | Description                              | Best For          |
|-------------------|------------------------------------------|-------------------|
| **Shopify CLI**   | `npm run deploy` via Shopify CLI         | Development       |
| **Docker**        | Multi-stage Docker build                 | Production        |
| **Docker Compose**| Full service orchestration               | Self-hosted prod  |

---

## 2. Production Deployment (Docker)

### 2.1 Build Process

The `Dockerfile` uses a multi-stage build:

**Stage 1: Builder** (`node:20.10-slim`)
```dockerfile
# Memory allocation for Vite build
ENV NODE_OPTIONS="--max-old-space-size=4096"

npm ci                    # Install dependencies
npx prisma generate       # Generate Prisma client
npm run build             # Build Remix app (remix vite:build)
npm prune --production    # Remove dev dependencies
```

**Stage 2: Production** (`node:20.10-alpine3.18`)
```dockerfile
COPY --from=builder /app /app
EXPOSE 3000
CMD ["npm", "run", "docker-start"]
```

`docker-start` runs: `prisma generate && prisma migrate deploy && remix-serve ./build/server/index.js`

### 2.2 Docker Commands

```bash
# Build the image
docker build -t shopify-tagged-banner .

# Run container
docker run -d \
  --name shopify-tagged-banner \
  -p 3000:3000 \
  -e SHOPIFY_APP_URL=https://your-domain.com \
  -e SHOPIFY_API_KEY=your-key \
  -e SHOPIFY_API_SECRET=your-secret \
  shopify-tagged-banner

# Using Docker Compose
docker-compose up -d
docker-compose down
docker-compose logs -f app-tagged-banner
```

### 2.3 Docker Compose Configuration

```yaml
version: '3.8'
services:
  app-tagged-banner:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: shopify-tagged-banner
    environment:
      SHOPIFY_APP_URL: https://taggedbanner-app.sprinix.com
      DATABASE_URL: file:dev.sqlite
      SHOPIFY_APP_HANDLE: tagged-banner
      SHOPIFY_API_KEY: <api-key>
      SHOPIFY_API_SECRET: <api-secret>
    ports:
      - "127.0.0.1:${APP_PORT}:3000"
    restart: unless-stopped
```

> **Security Note**: Port is bound to `127.0.0.1` only — not accessible externally. Use a reverse proxy (Nginx, Caddy) to expose the app.

---

## 3. Environment Variables

### 3.1 Required Variables

| Variable              | Description                              | Example                              |
|-----------------------|------------------------------------------|--------------------------------------|
| `SHOPIFY_API_KEY`     | App API key from Partners dashboard      | `e038bc95545d4b62076907e87479f65d`   |
| `SHOPIFY_API_SECRET`  | App API secret key                       | `39af44f45b120bcf33599c2a4319a2c8`   |
| `SHOPIFY_APP_URL`     | Public URL of the app                    | `https://taggedbanner-app.sprinix.com`|
| `SCOPES`              | OAuth scopes (comma-separated)           | `read_content,write_content,...`     |

### 3.2 Optional Variables

| Variable              | Description                              | Default                            |
|-----------------------|------------------------------------------|------------------------------------|
| `PORT`                | Server port                              | `3000`                             |
| `DATABASE_URL`        | Prisma database URL                      | `file:dev.sqlite`                  |
| `SHOPIFY_APP_HANDLE`  | App handle                               | `tagged-banner`                    |
| `SHOP_CUSTOM_DOMAIN`  | Custom shop domain                       | (none)                             |
| `FRONTEND_PORT`       | HMR port for remote development          | `8002`                             |
| `NODE_OPTIONS`        | Node.js options (memory, etc.)           | `--max-old-space-size=4096`        |

### 3.3 OAuth Scopes

The app requires these scopes (defined in `shopify.app.toml`):

| Scope                          | Purpose                               |
|--------------------------------|---------------------------------------|
| `read_content` / `write_content`| Read/write pages and blog posts      |
| `read_customers` / `write_customers`| Customer data access (GDPR)      |
| `read_files` / `write_files`  | File (image) upload and management     |
| `read_metaobject_definitions` / `write_metaobject_definitions` | Metaobject schema management |
| `read_metaobjects` / `write_metaobjects` | Metaobject data CRUD        |
| `read_themes` / `write_themes`| Theme access for the extension         |

---

## 4. Shopify App Deploy

```bash
# Deploy app and all extensions to Shopify
npm run deploy
# This runs: shopify app deploy
```

This command:
1. Builds the app for production.
2. Uploads the theme extension to Shopify.
3. Updates the app configuration.
4. Pushes extension versions.

---

## 5. Webhook Configuration

Configured in `shopify.app.toml`:

```toml
[webhooks]
api_version = "2025-01"

  [[webhooks.subscriptions]]
  topics = ["app_subscriptions/update", "app/uninstalled"]
  uri = "/webhooks"
  compliance_topics = ["customers/data_request", "customers/redact", "shop/redact"]
```

### Registered Webhooks

| Topic                       | Method        | Description                         |
|-----------------------------|---------------|-------------------------------------|
| `app/uninstalled`           | HTTP POST     | App uninstall — cleans up sessions  |
| `app_subscriptions/update`  | HTTP POST     | Subscription status changes         |
| `customers/data_request`    | HTTP POST     | GDPR data request compliance        |
| `customers/redact`          | HTTP POST     | GDPR customer data deletion         |
| `shop/redact`               | HTTP POST     | GDPR shop data deletion             |

---

## 6. Auth Redirect URLs

```toml
[auth]
redirect_urls = [
  "https://taggedbanner-app.sprinix.com/auth/callback",
  "https://taggedbanner-app.sprinix.com/auth/shopify/callback",
  "https://taggedbanner-app.sprinix.com/api/auth/callback"
]
```

---

## 7. Reverse Proxy Setup (Recommended)

For production, place the Docker container behind a reverse proxy:

### Nginx Example

```nginx
server {
    listen 443 ssl;
    server_name taggedbanner-app.sprinix.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 8. Troubleshooting

| Issue                        | Solution                                                |
|------------------------------|--------------------------------------------------------|
| Build fails (OOM)           | Increase `NODE_OPTIONS=--max-old-space-size=4096`       |
| Session errors               | Run `npx prisma migrate deploy` to sync schema         |
| Metaobjects not created      | Reinstall the app to trigger `afterAuth` hook           |
| Webhook 401 errors           | Verify `SHOPIFY_API_SECRET` matches Partners dashboard  |
| HMR not working              | Check `FRONTEND_PORT` and firewall settings             |
| Extension not showing        | Run `npm run deploy` to push extension to Shopify       |
| File upload fails            | Check file size (≤520KB) and `write_files` scope        |
| Docker container won't start | Check logs: `docker logs shopify-tagged-banner`         |
