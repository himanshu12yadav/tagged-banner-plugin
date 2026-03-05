# Routes & API Reference

## 1. Routing Overview

This app uses **Remix file-based routing**. All authenticated routes are nested under `app.jsx`, which provides the Polaris `AppProvider`, `DndProvider`, and `NavMenu`.

---

## 2. Route Map

| Route File                        | URL Path                          | Purpose                              |
|-----------------------------------|-----------------------------------|--------------------------------------|
| `app.jsx`                         | `/app`                            | Layout wrapper (NavMenu, Polaris)    |
| `app._index.jsx`                  | `/app`                            | Dashboard — slider list              |
| `app.slider.$sliderId.jsx`        | `/app/slider/:sliderId`           | Slider detail — tag collection list  |
| `app.slider.$id.$pointer.jsx`     | `/app/slider/:id/:pointer`        | Pointer editor — drag & drop         |
| `app.instruction.jsx`             | `/app/instruction`                | How-to-use guide                     |
| `app.additional.jsx`              | `/app/additional`                 | Additional info page (template)      |
| `app.error.jsx`                   | `/app/error`                      | Error page                           |
| `webhooks.jsx`                    | `/webhooks` (POST only)           | Webhook handler                      |
| `auth.$.jsx`                      | `/auth/*`                         | OAuth callback routes                |
| `auth.login/`                     | `/auth/login`                     | Login page                           |
| `$.jsx`                           | `/*` (catch-all)                  | Fallback route                       |

---

## 3. Route Details

### 3.1 `app._index.jsx` — Dashboard

**URL**: `/app`

#### Loader (`GET`)

Fetches all sliders from Shopify Metaobjects.

```
1. authenticate.admin(request)
2. metaobjectByDefinitionType(admin, "sliders")  → get slider count
3. sliderResult(admin, sliderCount)              → fetch all slider nodes
4. Returns: { response: { metaobjects: { nodes: [...] } } }
```

**Returned Data per Slider**:
- `title` — Slider name
- `handleId` — Metaobject handle (used in URL routing)
- `id` — Shopify GID (e.g., `gid://shopify/Metaobject/123`)
- `updatedAt` — Last modification timestamp

#### Action (`POST`)

Handles two operations based on form data:

**Create Slider**:
```
Form Data: { title: "slider-name" }
→ createMetaobjectCommon(admin, { type: "sliders", fields: [{ key: "title", value }] })
→ Returns: { status: 200, message: "Slider added successfully" }
```

**Delete Slider(s)**:
```
Form Data: { id: JSON.stringify(["gid://...", "gid://..."]) }
→ deleteMetaobjectById(admin, id)  for each ID
→ Returns: Promise.all(results)
```

---

### 3.2 `app.slider.$sliderId.jsx` — Tag Collection Manager

**URL**: `/app/slider/:sliderId`

#### Loader (`GET`)

Fetches all tag collections (slides) associated with a specific slider.

```
1. authenticate.admin(request)
2. Parallel fetch:
   a. metaobjectByHandle(admin, sliderId, "sliders")     → slider data
   b. metaobjectByDefinitionType(admin, "tag_collection") → tag collection count
   c. metaobjectByDefinitionType(admin, "pointers")       → pointer count
3. Parallel fetch:
   a. getListData(admin, "tag_collection", count)
   b. getListData(admin, "pointers", count)
4. processTagCollectionsAndPointers()  → filter by slider ID, attach pointer counts
5. Returns: { nodes: [...], sliderId, sliderHandle }
```

**Returned Data per Tag Collection**:
- `title` — Tag collection name
- `handleId` — Metaobject handle
- `image` — Image reference with URL
- `pointers` — Array of associated pointers (or `null`)

**Response Headers**: `Cache-Control: public, max-age=300` (5-minute cache)

#### Action (`POST`)

**Create Tag Collection** (`type: "save"`):
```
Form Data: { file: File, pointerName: string, sliderId: string, type: "save" }
1. Validate file size (≤520KB)
2. uploadNewFile(admin, file, accessToken)  → Staged Uploads → Shopify CDN
3. createMetaobject(admin, { type: "tag_collection", fields: [...] })
→ Returns: { status: 200, message: "Successfully created" }
```

**Delete Tag Collection(s)** (`type: "delete"`):
```
Form Data: { id: JSON.stringify([...]), type: "delete" }
→ deleteMetaobjectById() for each
```

---

### 3.3 `app.slider.$id.$pointer.jsx` — Pointer Editor

**URL**: `/app/slider/:id/:pointer`

#### Loader (`GET`)

Fetches pointer data for a specific tag collection within a slider.

```
1. authenticate.admin(request)
2. metaobjectByHandle(admin, sliderId, "sliders")              → slider data
3. metaobjectByHandleWithImage(admin, tagId, "tag_collection") → tag with image URL
4. metaobjectByDefinitionType(admin, "pointers")               → pointer count
5. getPointerData(admin, "pointers", count)                    → all pointers
6. Filter pointers by slider_id AND tag_id
7. Returns: { nodes: [...], sliderGid, tagGid, imageUrl }
```

**Returned Data per Pointer**:
- `sku` — Product SKU
- `data` — Tooltip content (HTML)
- `pos_x` — X position (percentage)
- `pos_y` — Y position (percentage)
- `pointerId` — Unique pointer identifier
- `id` — Shopify GID
- `handle` — Metaobject handle

#### Action (`POST`)

Three operations differentiated by `type` field:

**Create Pointer** (`type: "CREATE"`):
```
Form Data: { createData: JSON.stringify({...}), type: "CREATE" }
→ createMetaobject(admin, data)
→ Returns: { create: true, message: "Tag Created successfully.", createdId }
```

**Update Pointer** (`type: "UPDATE"`):
```
Form Data: { updatedId: string, updatedData: JSON.stringify({...}), type: "UPDATE" }
→ updateMetaobjectById(admin, data, id)
→ Returns: { update: true, message: "Tag updated successfully.", updatedId }
```

**Delete Pointer** (`type: "DELETE"`):
```
Form Data: { deletedId: string, type: "DELETE" }
→ deleteMetaobjectById(admin, id)
→ Returns: { delete: true, message: "Tag deleted successfully.", deletedId }
```

---

### 3.4 `webhooks.jsx` — Webhook Handler

**URL**: `/webhooks` (POST only)

#### Security

1. Clones the request and reads raw payload.
2. Generates HMAC-SHA256 signature using `SHOPIFY_API_SECRET`.
3. Compares with `x-shopify-hmac-sha256` header.
4. Rejects with `401` if signatures don't match.

#### Webhook Topics

| Topic                  | Action                                                        |
|------------------------|---------------------------------------------------------------|
| `APP_UNINSTALLED`      | Deletes all sessions for the shop from SQLite                 |
| `CUSTOMERS_DATA_REQUEST`| Returns 200 (compliance)                                     |
| `CUSTOMERS_REDACT`     | Returns 200 (compliance)                                      |
| `SHOP_REDACT`          | Returns 200 (compliance)                                      |

**App Uninstall Cleanup** (`handleAppUninstall`):
- Iterates over all three metaobject types (`sliders`, `tag_collection`, `pointers`).
- Fetches each definition and deletes it via `deleteMetaobjectDefinition()`.

> **Note**: The `handleAppUninstall` function is defined but the cleanup of metaobject definitions is not invoked from the `APP_UNINSTALLED` case in the action. Only session cleanup happens.

---

### 3.5 `app.instruction.jsx` — How-to-Use Page

**URL**: `/app/instruction`

A static page with step-by-step instructions and screenshots showing how to add the Tagged Banner widget to the storefront via the Shopify theme editor.

---

## 4. Authentication

All `app.*` routes use `authenticate.admin(request)` from `shopify.server.js`. This:
1. Validates the Shopify session.
2. Returns the `admin` GraphQL client and `session` object.
3. Redirects to OAuth if not authenticated.

The webhook route uses `authenticate.webhook(request)` for HMAC-based webhook validation.
