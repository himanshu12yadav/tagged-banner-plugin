# Database & Data Layer

## 1. Overview

The application uses **two separate data storage mechanisms**:

| Storage            | Technology          | Purpose                                    |
|--------------------|---------------------|--------------------------------------------|
| **SQLite**         | Prisma ORM          | Shopify session management only            |
| **Metaobjects**    | Shopify Admin API   | All business data (sliders, tags, pointers)|

---

## 2. Prisma (SQLite) — Session Storage

### 2.1 Schema Definition

**File**: `prisma/schema.prisma`

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:dev.sqlite"
}

model Session {
  id            String    @id
  shop          String
  state         String
  isOnline      Boolean   @default(false)
  scope         String?
  expires       DateTime?
  accessToken   String
  userId        BigInt?
  firstName     String?
  lastName      String?
  email         String?
  accountOwner  Boolean   @default(false)
  locale        String?
  collaborator  Boolean?  @default(false)
  emailVerified Boolean?  @default(false)
}
```

### 2.2 Session Fields

| Field           | Type       | Required | Description                              |
|-----------------|------------|----------|------------------------------------------|
| `id`            | `String`   | Yes      | Primary key (Shopify session ID)         |
| `shop`          | `String`   | Yes      | Shop domain (e.g., `store.myshopify.com`)|
| `state`         | `String`   | Yes      | OAuth state nonce                        |
| `isOnline`      | `Boolean`  | Yes      | Online vs offline session                |
| `scope`         | `String`   | No       | Granted OAuth scopes                     |
| `expires`       | `DateTime` | No       | Session expiration time                  |
| `accessToken`   | `String`   | Yes      | Shopify Admin API access token           |
| `userId`        | `BigInt`   | No       | Shopify user ID (online sessions)        |
| `firstName`     | `String`   | No       | User first name                          |
| `lastName`      | `String`   | No       | User last name                           |
| `email`         | `String`   | No       | User email                               |
| `accountOwner`  | `Boolean`  | Yes      | Is store owner                           |
| `locale`        | `String`   | No       | User locale                              |
| `collaborator`  | `Boolean`  | No       | Is a collaborator                        |
| `emailVerified` | `Boolean`  | No       | Email verification status                |

### 2.3 Prisma Client Singleton

**File**: `app/db.server.js`

```javascript
import { PrismaClient } from "@prisma/client";

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
}

export default prisma;
```

**Pattern**: In development, the Prisma client is stored on `global` to prevent multiple instances during hot module reload. In production, a single instance is created per process.

### 2.4 Session Storage Integration

The Prisma client is passed to `PrismaSessionStorage` in `shopify.server.js`:

```javascript
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
sessionStorage: new PrismaSessionStorage(prisma),
```

This adapter handles all CRUD operations on the `Session` model automatically.

### 2.5 Database Commands

```bash
# Generate Prisma client (after schema changes)
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Create a new migration
npx prisma migrate dev --name <migration-name>

# View data in Prisma Studio
npx prisma studio
```

---

## 3. Metaobjects — Business Data Storage

All slider, tag collection, and pointer data is stored in **Shopify Metaobjects** via the Admin GraphQL API.

### 3.1 Why Metaobjects?

Metaobjects are the correct storage choice because:
1. **Storefront Access**: Liquid templates can directly access metaobjects via `shop.metaobjects.<type>` without API calls.
2. **No External Database**: No need for a separate database for data that the storefront needs.
3. **Shopify-managed**: Data is managed and backed up by Shopify infrastructure.
4. **Scoped to Shop**: Data is automatically scoped to each store.

### 3.2 Metaobject Definitions

Three metaobject definitions are auto-created during the `afterAuth` hook:

#### Sliders

```json
{
  "type": "sliders",
  "displayNameKey": "title",
  "fields": [
    { "name": "Title", "key": "title", "type": "single_line_text_field" }
  ]
}
```

#### Tag Collection

```json
{
  "type": "tag_collection",
  "displayNameKey": "pointer_name",
  "fields": [
    { "name": "pointer name", "key": "pointer_name", "type": "single_line_text_field" },
    { "name": "Slider id", "key": "slider_id", "type": "single_line_text_field" },
    { "name": "image_id", "key": "image_id", "type": "file_reference" }
  ]
}
```

#### Pointers

```json
{
  "type": "pointers",
  "fields": [
    { "name": "sku", "key": "sku", "type": "single_line_text_field" },
    { "name": "Pointer_id", "key": "pointer_id", "type": "single_line_text_field" },
    { "name": "slider id", "key": "slider_id", "type": "single_line_text_field" },
    { "name": "tag_id", "key": "tag_id", "type": "single_line_text_field" },
    { "name": "data", "key": "data", "type": "single_line_text_field" },
    { "name": "pos_x", "key": "pos_x", "type": "single_line_text_field" },
    { "name": "pos_y", "key": "pos_y", "type": "single_line_text_field" }
  ]
}
```

### 3.3 Data Relationships

Relationships between metaobjects are maintained via GID references stored as string fields:

```
Tag Collection.slider_id  →  stores Slider's GID string
Pointer.slider_id         →  stores Slider's GID string
Pointer.tag_id            →  stores Tag Collection's GID string
```

These are **manual references** (not Shopify metaobject relationships), filtered in application code.

### 3.4 Position Storage

Pointer positions are stored as **percentages** of the image dimensions:

```javascript
// Convert pixel position to percentage for storage
const pixelToPercentage = (pixel, dimension) => (pixel / dimension) * 100;

// Convert stored percentage back to pixels for rendering
const percentageToPixel = (percentage, dimension) => (percentage / 100) * dimension;
```

This ensures pointers remain correctly positioned across different screen sizes and image renderings.
