# Setup & Development Guide

## 1. Prerequisites

| Requirement     | Version                        |
|-----------------|--------------------------------|
| Node.js         | ^18.20 or ^20.10 or >=21.0.0   |
| npm             | v8+ (bundled with Node)        |
| Shopify CLI     | Latest (`@shopify/cli`)        |
| Docker          | v20+ (optional, for production)|
| Shopify Partner | Partner account required       |

---

## 2. Environment Variables

Create a `.env` file at the project root. Required variables:

```env
# Shopify App Credentials (provided by Shopify Partners dashboard)
SHOPIFY_API_KEY=<your-api-key>
SHOPIFY_API_SECRET=<your-api-secret>

# App URL (auto-set during `shopify app dev`, or your production URL)
SHOPIFY_APP_URL=https://your-app-domain.com

# Scopes (comma-separated, must match shopify.app.toml)
SCOPES=read_content,read_customers,read_files,read_metaobject_definitions,read_metaobjects,read_themes,write_content,write_customers,write_files,write_metaobject_definitions,write_metaobjects,write_themes

# Optional: Custom shop domain
SHOP_CUSTOM_DOMAIN=

# Port (default: 3000)
PORT=3000
```

---

## 3. Local Development Setup

### 3.1 Clone & Install

```bash
# Clone the repository
git clone <repository-url>
cd shopify-tagged-banner

# Install dependencies
npm install
```

### 3.2 Database Setup (Prisma)

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

### 3.3 Start Development Server

```bash
# Start the Shopify dev server (handles tunneling, auth, etc.)
npm run dev
# This runs: shopify app dev
```

The Shopify CLI will:
- Create a Cloudflare tunnel for HTTPS access.
- Start the Vite dev server with HMR.
- Open the app in your dev store's Shopify Admin.

### 3.4 Development Store

Configure your dev store in `shopify.app.toml`:

```toml
[build]
dev_store_url = "your-store.myshopify.com"
```

---

## 4. Available Scripts

| Script            | Command                                      | Description                                |
|-------------------|----------------------------------------------|--------------------------------------------|
| `npm run dev`     | `shopify app dev`                            | Start local dev server with tunnel         |
| `npm run build`   | `remix vite:build`                           | Build for production                       |
| `npm run start`   | `remix-serve ./build/server/index.js`        | Serve production build                     |
| `npm run deploy`  | `shopify app deploy`                         | Deploy app & extensions to Shopify         |
| `npm run setup`   | `prisma generate && prisma migrate deploy`   | Initialize database                        |
| `npm run docker-start` | `npm run setup && npm run start`        | Docker entrypoint (setup + serve)          |
| `npm run lint`    | `eslint --cache .`                           | Run ESLint                                 |

---

## 5. Docker Deployment

### 5.1 Build & Run

```bash
# Build the Docker image
docker build -t shopify-tagged-banner .

# Run with Docker Compose
docker-compose up -d
```

### 5.2 Docker Configuration

**Dockerfile** uses a multi-stage build:
1. **Builder stage** (`node:20.10-slim`):
   - Installs dependencies via `npm ci`.
   - Generates Prisma client.
   - Builds the Remix app (`npm run build`).
   - Prunes dev dependencies.
2. **Production stage** (`node:20.10-alpine3.18`):
   - Copies built app from builder.
   - Exposes port 3000.
   - Runs `npm run docker-start`.

**docker-compose.yml** defines:
- Service: `app-tagged-banner`
- Container name: `shopify-tagged-banner`
- Port mapping: `127.0.0.1:${APP_PORT}:3000`
- Restart policy: `unless-stopped`

### 5.3 Docker Environment Variables

Set these in `docker-compose.yml` or via `.env`:

```yaml
environment:
  SHOPIFY_APP_URL: https://your-production-url.com
  DATABASE_URL: file:dev.sqlite
  SHOPIFY_APP_HANDLE: tagged-banner
  SHOPIFY_API_KEY: <your-api-key>
  SHOPIFY_API_SECRET: <your-api-secret>
```

---

## 6. Shopify CLI Commands

```bash
# Link to an existing app config
npm run config:link

# Switch between app configs
npm run config:use

# Show environment variables
npm run env

# Generate extensions or other app components
npm run generate

# Deploy the app to Shopify
npm run deploy
```

---

## 7. Vite Configuration

The `vite.config.js` handles:

- **HMR Configuration**: Automatically detects localhost vs. tunnel and configures WebSocket accordingly.
  - Localhost: `ws://localhost:64999`
  - Tunneled: `wss://<host>:443`
- **Server Port**: Defaults to `3000`, configurable via `PORT` env var.
- **File System Access**: Allows Vite to serve from `app/` and `node_modules/`.
- **Plugins**: Remix Vite plugin + `vite-tsconfig-paths` for path aliases.
- **Build**: `assetsInlineLimit: 0` (no asset inlining).

---

## 8. App Configuration (`shopify.app.toml`)

```toml
client_id = "e038bc95545d4b62076907e87479f65d"
name = "Sprinix-tagged-banner"
handle = "tagged-banner"
application_url = "https://taggedbanner-app.sprinix.com"
embedded = true

[access_scopes]
scopes = "read_content,read_customers,read_files,..."

[webhooks]
api_version = "2025-01"

  [[webhooks.subscriptions]]
  topics = ["app_subscriptions/update", "app/uninstalled"]
  uri = "/webhooks"
  compliance_topics = ["customers/data_request", "customers/redact", "shop/redact"]

[pos]
embedded = false
```

### Key Settings

- **Embedded**: `true` — app runs inside the Shopify Admin iframe.
- **API Version**: `2025-01` — Shopify API version used.
- **POS**: Not embedded in Point of Sale.
- **Webhooks**: Handles app uninstall + subscription updates + GDPR compliance topics.
