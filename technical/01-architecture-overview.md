# Architecture Overview — Sprinix Tagged Banner

## 1. Introduction

**Sprinix Tagged Banner** is an embedded Shopify application that allows merchants to create interactive image sliders (banners) with drag-and-drop tagged pointers. Each pointer can display product information (SKU, tooltip data) when hovered on the live storefront. The app is distributed on the Shopify App Store.

---

## 2. High-Level Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    Shopify Admin (Embedded)                    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                 Remix App (Frontend)                     │  │
│  │   Shopify Polaris UI  ·  React DnD  ·  App Bridge       │  │
│  └────────────┬────────────────────────────┬───────────────┘  │
│               │  Loader / Action (SSR)     │                  │
│  ┌────────────▼────────────────────────────▼───────────────┐  │
│  │              Remix App (Backend / Server)                │  │
│  │   Shopify Admin GraphQL API  ·  Metaobjects CRUD        │  │
│  │   File Uploads (Staged Uploads)  ·  Subscriptions        │  │
│  └────────────┬────────────────────────────┬───────────────┘  │
│               │                            │                  │
│     ┌─────────▼──────────┐    ┌────────────▼──────────┐      │
│     │  Prisma (SQLite)   │    │  Shopify Metaobjects   │      │
│     │  Session Storage   │    │  Data Storage Layer     │      │
│     └────────────────────┘    └────────────────────────┘      │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                 Shopify Storefront (Theme)                     │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │            Theme App Extension (Liquid Block)            │  │
│  │   star_rating.liquid  ·  Slider + Pointer Rendering      │  │
│  │   Reads Metaobjects via Liquid `shop.metaobjects`        │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

| Layer          | Technology                                                |
|----------------|-----------------------------------------------------------|
| **Framework**  | Remix v2.7 (Vite-based build)                             |
| **Language**   | JavaScript / JSX                                          |
| **UI Library** | Shopify Polaris v12                                       |
| **Drag & Drop**| react-dnd v16 with HTML5 backend                          |
| **Shopify SDK**| @shopify/shopify-app-remix v3, App Bridge v3/v4           |
| **Database**   | SQLite via Prisma ORM (session storage only)              |
| **Data Store** | Shopify Metaobjects (sliders, tag_collection, pointers)   |
| **API**        | Shopify Admin GraphQL API (v2025-01)                      |
| **Deployment** | Docker (multi-stage build, Node 20)                       |
| **Storefront** | Theme App Extension (Liquid)                              |

---

## 4. Data Model (Metaobjects)

The app stores **all business data** in Shopify Metaobjects (not in a local database). There are three metaobject types:

```
Slider (type: "sliders")
  ├── title: single_line_text_field
  │
  ├── Tag Collection (type: "tag_collection")
  │   ├── pointer_name: single_line_text_field
  │   ├── slider_id: single_line_text_field  ── references parent Slider GID
  │   ├── image_id: file_reference           ── uploaded banner image
  │   │
  │   └── Pointer (type: "pointers")
  │       ├── sku: single_line_text_field
  │       ├── pointer_id: single_line_text_field
  │       ├── slider_id: single_line_text_field  ── references Slider GID
  │       ├── tag_id: single_line_text_field      ── references Tag Collection GID
  │       ├── data: single_line_text_field         ── tooltip content
  │       ├── pos_x: single_line_text_field        ── X position (percentage)
  │       └── pos_y: single_line_text_field        ── Y position (percentage)
```

### Relationship Hierarchy

```
Slider (1) ──── (N) Tag Collection ──── (N) Pointer
```

- A **Slider** groups multiple **Tag Collections** (each is a slide).
- Each **Tag Collection** is one image slide with an uploaded image.
- Each **Pointer** is a draggable tag on a specific slide, storing its position as a percentage of image dimensions.

---

## 5. Application Flow

### 5.1 Installation & Auth Flow

1. Merchant installs the app from Shopify App Store.
2. Shopify OAuth flow authenticates via `@shopify/shopify-app-remix`.
3. `afterAuth` hook automatically creates the three Metaobject Definitions (`sliders`, `tag_collection`, `pointers`) if they don't exist.
4. Session is stored in SQLite via Prisma.

### 5.2 Merchant Workflow (Admin Panel)

1. **Dashboard** (`/app`) → Create/delete sliders.
2. **Slider Detail** (`/app/slider/:sliderId`) → Upload images (slides) as tag collections.
3. **Pointer Editor** (`/app/slider/:id/:pointer`) → Drag-and-drop tags on an image, enter SKU/data.
4. **Instructions** (`/app/instruction`) → Step-by-step guide on adding the widget to the storefront.

### 5.3 Storefront Rendering

1. Merchant adds the "Slider" block to their theme via the Online Store editor.
2. They enter the slider name/handle in the block settings.
3. The Liquid template reads metaobjects and renders slides with pointers.
4. Pointers show tooltips on hover.

---

## 6. Project Structure

```
shopify-tagged-banner/
├── app/
│   ├── component/               # Reusable React components
│   │   ├── DragAndDrop/         # Draggable tag marker component
│   │   ├── Error/               # Error UI components & boundary
│   │   ├── FormControl/         # Pointer form (SKU, data fields)
│   │   ├── UploadFile/          # File upload component
│   │   ├── customHook/          # Custom React hooks
│   │   └── ItemTypes.jsx        # DnD item type constants
│   ├── routes/                  # Remix route files
│   │   ├── app._index.jsx       # Dashboard (slider list)
│   │   ├── app.slider.$sliderId.jsx  # Tag collection manager
│   │   ├── app.slider.$id.$pointer.jsx  # Pointer editor
│   │   ├── app.instruction.jsx  # How-to-use page
│   │   ├── app.jsx              # App layout with NavMenu
│   │   ├── webhooks.jsx         # Webhook handler
│   │   ├── helper.jsx           # GraphQL helpers & file upload
│   │   └── graphql/query.jsx    # All GraphQL queries & mutations
│   ├── utils/                   # Utility modules
│   │   ├── errorHandler.js      # ErrorHandler class & hooks
│   │   └── errorHandling.js     # Network error utilities
│   ├── db.server.js             # Prisma client singleton
│   ├── shopify.server.js        # Shopify app configuration
│   ├── entry.server.jsx         # Remix SSR entry point
│   └── root.jsx                 # Root layout component
├── extensions/
│   └── theme-extension/         # Theme App Extension
│       ├── blocks/star_rating.liquid  # Storefront slider block
│       ├── assets/              # SVG icons (prev/next arrows)
│       └── locales/en.default.json
├── prisma/
│   ├── schema.prisma            # Database schema (Session model)
│   └── migrations/              # Prisma migrations
├── Dockerfile                   # Multi-stage Docker build
├── docker-compose.yml           # Docker Compose config
├── shopify.app.toml             # Shopify app configuration
├── shopify.web.toml             # Web process config
├── vite.config.js               # Vite build configuration
├── package.json                 # Dependencies & scripts
└── tsconfig.json                # TypeScript configuration
```

---

## 7. Key Design Decisions

1. **Metaobjects over Database**: All slider/tag/pointer data is stored in Shopify Metaobjects rather than a local database. This allows the Liquid theme extension to access data directly via `shop.metaobjects` without API calls from the storefront.

2. **Percentage-Based Positioning**: Pointer coordinates are stored as percentages (not pixels) to ensure responsiveness across different screen sizes.

3. **Embedded App**: The app runs as an embedded Shopify admin app using App Bridge, providing a native-feeling experience within the Shopify admin.

4. **React DnD for Tag Placement**: The drag-and-drop library `react-dnd` is used for intuitive visual placement of product tags on banner images.

5. **Staged Uploads**: Image uploads use Shopify's Staged Uploads API for secure, direct-to-CDN file transfers.
