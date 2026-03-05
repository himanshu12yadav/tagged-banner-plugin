# Sprinix Tagged Banner — General Documentation

> **Audience**: Non-technical readers, project managers, QA testers, and new team members.
> This document provides an easy-to-understand overview of the app, how it works, and what each file/folder does.

---

## 1. What Does This App Do?

**Sprinix Tagged Banner** is a Shopify app that lets store owners (merchants):

1. **Create interactive image sliders** (banners) for their online store.
2. **Place clickable tags** (pointers) on those images.
3. **Show product info** (like SKU and description) when a customer hovers on a tag.
4. **Display the slider** on the storefront using the Shopify theme editor — no coding needed.

### How It Works (Simple Flow)

```
Merchant installs the app
      ↓
Creates a "Slider" (group name for the banner)
      ↓
Uploads images (each image = one slide)
      ↓
Drags & drops "Pointers" (tags) onto each image
      ↓
Fills in product SKU + tooltip text for each pointer
      ↓
Adds the "Slider" block to their online store theme
      ↓
Customers see an image slider with hoverable product tags
```

> 📸 **SCREENSHOT**: *Add a screenshot of the complete user flow — from creating a slider to the final storefront display.*

---

## 2. App Screens Overview

### 2.1 Dashboard (Home Page)

**What it does**: Shows a list of all sliders the merchant has created. The merchant can add new sliders or delete existing ones.

**Key features**:
- Text field to enter a new slider name
- "Add Slider" button to create it
- Table listing all sliders (click to open)
- Bulk delete with checkbox selection

> 📸 **SCREENSHOT**: *Capture the Dashboard page showing the slider list. If no sliders exist, also capture the empty state with "No sliders found" message.*

---

### 2.2 Slider Detail Page (Slide Manager)

**What it does**: Shows all the slides (images) inside a specific slider. The merchant can upload new images and manage existing slides.

**Key features**:
- Text field for "Tag Name" (slide name)
- Drag-and-drop zone for image upload (max 520KB, PNG/JPEG only)
- "Create" button to save the new slide
- Table listing all slides with thumbnails and pointer count
- Click any slide to open the pointer editor

> 📸 **SCREENSHOT**: *Capture the Slide Manager page showing:*
> 1. *The image upload form (empty state)*
> 2. *The slide list with thumbnails*
> 3. *The image file selected in the upload zone*

---

### 2.3 Pointer Editor (Tag Placement)

**What it does**: This is the main editing screen. The uploaded image is displayed, and the merchant drags tags onto it to mark product locations.

**Key features**:
- Large image preview on the left (full width)
- "Add" button to create a new pointer tag
- Drag the circular markers anywhere on the image
- Right panel shows form cards for each pointer:
  - **Product SKU** field
  - **Data** field (tooltip text shown on hover)
  - Create / Update / Delete buttons per pointer
- Collapsible form cards (expand/collapse with +/- icon)

> 📸 **SCREENSHOT**: *Capture the Pointer Editor with:*
> 1. *An image with 2-3 pointer tags placed on it*
> 2. *The right panel with form cards expanded*
> 3. *A tooltip visible on one of the pointer tags*

---

### 2.4 How to Add Widget Page (Instructions)

**What it does**: A step-by-step guide inside the app showing merchants how to add the slider widget to their online store.

**Steps shown**:
1. Go to Online Store → Themes → Customize
2. Add the "Slider" app block
3. Enter the slider name and save

> 📸 **SCREENSHOT**: *This page already has built-in screenshots. Capture the full instruction page as-is.*

---

### 2.5 Storefront Display (Customer View)

**What it does**: The slider as it appears to customers on the live store.

**Features visible**:
- Image slider with fade transitions between slides
- Previous / Next navigation arrows (only if multiple slides)
- Circular pointer markers on each image
- Tooltip popup when hovering on a pointer

> 📸 **SCREENSHOT**: *Capture the storefront slider showing:*
> 1. *A single slide with pointer tags visible*
> 2. *A tooltip popup on hover*
> 3. *The navigation arrows (if multiple slides)*

---

## 3. Navigation Menu

The app has two navigation items in the left sidebar:

| Menu Item           | Goes To                     | Purpose                              |
|---------------------|-----------------------------|--------------------------------------|
| **Home**            | `/app`                      | Dashboard — slider list              |
| **How to add Widget** | `/app/instruction`        | Step-by-step setup instructions      |

> 📸 **SCREENSHOT**: *Capture the sidebar navigation showing both menu items.*

---

## 4. Complete Folder Structure & File Purposes

Below is every file and folder in the project with a plain-English description of what it does.

```
shopify-tagged-banner/
│
├── 📁 app/                              ← Main application code
│   │
│   ├── 📁 component/                    ← Reusable UI pieces (building blocks)
│   │   │
│   │   ├── 📁 DragAndDrop/
│   │   │   ├── DragAndDrop.jsx          ← The circular tag marker that can be dragged
│   │   │   │                               on an image. Shows a tooltip on hover.
│   │   │   └── DropAndDrag.module.css   ← Visual styles for the tag marker (circle,
│   │   │                                   hover effect, positioning).
│   │   │
│   │   ├── 📁 Error/
│   │   │   ├── Error.jsx                ← Error message display component. Shows
│   │   │   │                               different error types (network, not found,
│   │   │   │                               server error, etc.) with retry buttons.
│   │   │   ├── Error.module.css         ← Styles for error displays.
│   │   │   ├── ErrorExamples.jsx        ← Example usage of the error components
│   │   │   │                               (for developer reference only).
│   │   │   └── index.js                 ← Barrel export file — allows importing
│   │   │                                   Error components with a short path.
│   │   │
│   │   ├── 📁 FormControl/
│   │   │   ├── FormControl.jsx          ← The expandable card showing "Product SKU"
│   │   │   │                               and "Data" fields for each pointer tag.
│   │   │   │                               Has Create/Update/Delete buttons.
│   │   │   └── FormControl.module.css   ← Styles for the pointer form cards.
│   │   │
│   │   ├── 📁 UploadFile/
│   │   │   └── UploadFile.jsx           ← File upload component (used for image
│   │   │                                   uploads when creating slides).
│   │   │
│   │   ├── 📁 customHook/
│   │   │   ├── useDragAndDrop.jsx       ← Custom hook managing all drag-and-drop
│   │   │   │                               state: tag positions, adding/removing
│   │   │   │                               tags, handling drop events.
│   │   │   └── useIsomorphicLayoutEffect.jsx
│   │   │                                ← Helper hook to avoid warnings when the
│   │   │                                   app renders on the server first.
│   │   │
│   │   └── ItemTypes.jsx                ← Defines the "tag" type used by the
│   │                                       drag-and-drop system.
│   │
│   ├── 📁 routes/                       ← App pages (each file = one page or endpoint)
│   │   │
│   │   ├── 📁 _index/                   ← Root index route folder
│   │   │
│   │   ├── 📁 auth.login/               ← Login page for Shopify OAuth
│   │   │
│   │   ├── 📁 graphql/
│   │   │   └── query.jsx                ← ALL database operations in one file.
│   │   │                                   Contains every query and command used
│   │   │                                   to read/create/update/delete sliders,
│   │   │                                   tags, pointers, and subscriptions.
│   │   │
│   │   ├── 📁 images/                   ← Image assets used within pages
│   │   │   ├── default.png              ← Default placeholder image when no
│   │   │   │                               image is uploaded for a slide.
│   │   │   └── 📁 instructions/         ← Screenshots shown on the "How to Add
│   │   │                                   Widget" page.
│   │   │
│   │   ├── $.jsx                        ← Catch-all route — handles any URL that
│   │   │                                   doesn't match other routes.
│   │   ├── app.$.jsx                    ← Catch-all within /app — handles unknown
│   │   │                                   sub-pages under the app.
│   │   ├── app._index.jsx               ← DASHBOARD PAGE — the home page showing
│   │   │                                   the list of all sliders. Handles creating
│   │   │                                   and deleting sliders.
│   │   ├── app.additional.jsx           ← Template/example page (from Shopify
│   │   │                                   starter template, not actively used).
│   │   ├── app.error.jsx                ← Dedicated error page.
│   │   ├── app.instruction.jsx          ← "HOW TO ADD WIDGET" PAGE — step-by-step
│   │   │                                   instructions with screenshots showing
│   │   │                                   how to add the slider to the storefront.
│   │   ├── app.jsx                      ← APP LAYOUT — wraps all /app pages with
│   │   │                                   the Shopify design system (Polaris),
│   │   │                                   navigation menu, and drag-and-drop
│   │   │                                   capability.
│   │   ├── app.slider.$id.$pointer.jsx  ← POINTER EDITOR PAGE — the drag-and-drop
│   │   │                                   screen where merchants place tags on an
│   │   │                                   image. Handles creating, updating, and
│   │   │                                   deleting individual pointer tags.
│   │   ├── app.slider.$sliderId.jsx     ← SLIDER DETAIL PAGE — shows all slides
│   │   │                                   (images) in a slider. Handles image
│   │   │                                   upload and slide management.
│   │   ├── auth.$.jsx                   ← Handles OAuth authentication callbacks
│   │   │                                   from Shopify.
│   │   ├── helper.jsx                   ← Helper functions — image upload to
│   │   │                                   Shopify's cloud, position math
│   │   │                                   (pixel ↔ percentage conversion),
│   │   │                                   data validation utilities.
│   │   └── webhooks.jsx                 ← WEBHOOK HANDLER — receives notifications
│   │                                       from Shopify (app uninstalled, customer
│   │                                       data requests). Cleans up data on
│   │                                       uninstall.
│   │
│   ├── 📁 utils/                        ← Utility/helper modules
│   │   ├── errorHandler.js              ← Error handling class — classifies errors
│   │   │                                   (network, auth, server), provides retry
│   │   │                                   logic, form validation helpers.
│   │   ├── errorHandling.js             ← Network error detection, online status
│   │   │                                   checking, async retry with backoff.
│   │   └── metaobject-test.js           ← Test file for metaobject operations.
│   │
│   ├── db.server.js                     ← Database connection — creates the
│   │                                       connection to the local SQLite database
│   │                                       (used only for storing login sessions).
│   ├── entry.server.jsx                 ← Server entry point — handles how pages
│   │                                       are rendered on the server before being
│   │                                       sent to the browser.
│   ├── root.jsx                         ← Root HTML layout — the <html>, <head>,
│   │                                       and <body> structure for the entire app.
│   └── shopify.server.js                ← SHOPIFY CONFIGURATION — sets up the app's
│                                           connection to Shopify: API keys, scopes,
│                                           authentication, and auto-creates the
│                                           required data structures on first install.
│
├── 📁 extensions/                       ← Shopify theme extensions
│   └── 📁 theme-extension/
│       ├── 📁 assets/
│       │   ├── Next.svg                 ← Right arrow icon for slider navigation.
│       │   └── previous.svg             ← Left arrow icon for slider navigation.
│       ├── 📁 blocks/
│       │   └── star_rating.liquid       ← THE STOREFRONT WIDGET — Liquid template
│       │                                   that renders the slider on the merchant's
│       │                                   online store. Reads slider data and
│       │                                   displays images with interactive pointer
│       │                                   tags and navigation arrows.
│       ├── 📁 locales/
│       │   └── en.default.json          ← English translations for the extension.
│       └── shopify.extension.toml       ← Extension configuration (name, type, ID).
│
├── 📁 prisma/                           ← Database schema & migrations
│   ├── schema.prisma                    ← Database structure definition — defines
│   │                                       the "Session" table used to store
│   │                                       merchant login sessions.
│   ├── dev.sqlite                       ← The actual database file (SQLite).
│   └── 📁 migrations/                   ← Database change history.
│
├── 📁 public/                           ← Static files served directly
│
├── 📁 technical/                        ← Technical documentation (this folder!)
│
├── .env                                 ← Environment variables (API keys, secrets)
│                                           — NEVER commit to version control.
├── .gitignore                           ← Lists files that Git should ignore.
├── Dockerfile                           ← Instructions to build a Docker container
│                                           for production deployment.
├── docker-compose.yml                   ← Docker service configuration — defines
│                                           how to run the app as a container.
├── env.d.ts                             ← TypeScript type definitions for
│                                           environment variables.
├── package.json                         ← Project dependencies and scripts.
│                                           Lists all libraries the app uses.
├── package-lock.json                    ← Exact version lock for all dependencies.
├── README.md                            ← Basic project readme.
├── remix.config.js                      ← Remix framework configuration.
├── shopify.app.toml                     ← SHOPIFY APP CONFIG — app name, URL,
│                                           permissions (scopes), webhook settings,
│                                           and authentication redirect URLs.
├── shopify.web.toml                     ← Web process configuration for Shopify CLI.
├── tsconfig.json                        ← TypeScript compiler configuration.
└── vite.config.js                       ← Build tool configuration — controls how
                                            the app is compiled and served during
                                            development.
```

---

## 5. Data Storage Explained

The app stores two types of data:

### 5.1 Login Sessions (Local Database)

- **What**: When a merchant logs in, their session info is saved.
- **Where**: Local SQLite file (`prisma/dev.sqlite`).
- **Why**: To keep the merchant logged in without re-authenticating.

### 5.2 Slider Data (Shopify's Cloud)

All business data is stored **inside Shopify** (not locally). This is important because the storefront needs to read this data directly.

| Data Type         | What It Stores                                  |
|-------------------|-------------------------------------------------|
| **Slider**        | Name/title of the banner group                  |
| **Tag Collection**| One slide image + its name + linked slider      |
| **Pointer**       | One tag on an image — SKU, tooltip text, X/Y position |

### Relationship

```
One Slider can have → many Slides (Tag Collections)
One Slide can have  → many Pointers (Tags)
```

> 📸 **SCREENSHOT**: *Create a diagram or screenshot of the Shopify Admin showing Metaobject definitions under Settings → Custom data → Metaobjects.*

---

## 6. Subscription / Billing

The app has a monthly subscription plan:

| Detail        | Value                  |
|---------------|------------------------|
| **Plan Name** | Tag Banner Monthly Plan|
| **Price**     | $2.00 USD / month      |
| **Billing**   | Every 30 days          |
| **Trial**     | 1 day free trial       |

> 📸 **SCREENSHOT**: *Capture the subscription approval screen (Shopify payment confirmation dialog).*

---

## 7. Webhooks (Automated Events)

The app listens for these events from Shopify:

| Event                   | What Happens                                           |
|-------------------------|--------------------------------------------------------|
| **App Uninstalled**     | Cleans up the merchant's session data                  |
| **Subscription Updated**| Reacts to billing changes                              |
| **Customer Data Request**| GDPR: responds to data access requests                |
| **Customer Redact**     | GDPR: deletes customer data on request                 |
| **Shop Redact**         | GDPR: deletes all shop data after uninstall            |

---

## 8. Required Permissions (Scopes)

The app requests these permissions when installed:

| Permission               | Why It's Needed                                      |
|--------------------------|------------------------------------------------------|
| Read/Write Content       | Access store pages and articles                      |
| Read/Write Customers     | Required for GDPR compliance webhooks                |
| Read/Write Files         | Upload banner images to Shopify's CDN                |
| Read/Write Metaobjects   | Store and retrieve slider/tag/pointer data           |
| Read/Write Metaobject Definitions | Create the data structures on first install |
| Read/Write Themes        | Enable the theme extension on the storefront         |

---

## 9. Screenshot Checklist Summary

Use this checklist when capturing screenshots for documentation:

| # | Screen / Area                          | What to Capture                                  | Status |
|---|----------------------------------------|--------------------------------------------------|--------|
| 1 | Dashboard (empty)                      | Empty state with "No sliders found"              | ☐      |
| 2 | Dashboard (with sliders)               | List of 2-3 sliders in the table                 | ☐      |
| 3 | Add Slider form                        | Slider name field + "Add Slider" button          | ☐      |
| 4 | Slider Detail (empty)                  | Empty state with "No pointers found"             | ☐      |
| 5 | Slider Detail (with slides)            | Slide list with thumbnails and pointer counts    | ☐      |
| 6 | Image upload zone                      | DropZone with a file selected                    | ☐      |
| 7 | Pointer Editor (full view)             | Image + placed tags + right panel forms          | ☐      |
| 8 | Pointer tag on image                   | Close-up of a circular pointer tag               | ☐      |
| 9 | Tooltip on hover                       | Pointer tag with tooltip popup visible           | ☐      |
| 10 | Form card (expanded)                  | SKU + Data fields + Create/Update button         | ☐      |
| 11 | Form card (collapsed)                 | Collapsed card with +/- and delete icons         | ☐      |
| 12 | Navigation menu                       | Sidebar with "Home" and "How to add Widget"      | ☐      |
| 13 | Instructions page                     | Full "How to Add Widget" page                    | ☐      |
| 14 | Storefront — single slide             | Live slider with one image + pointer tags        | ☐      |
| 15 | Storefront — tooltip                  | Tooltip popup on customer hover                  | ☐      |
| 16 | Storefront — multiple slides          | Slider with navigation arrows visible            | ☐      |
| 17 | Theme editor — adding block           | Online Store editor showing "Slider" block       | ☐      |
| 18 | Theme editor — slider name field      | Block settings with "Slider name" text field     | ☐      |
| 19 | Toast notification                    | Success toast (e.g., "Slider added successfully")| ☐      |
| 20 | Error state                           | Any error boundary display                       | ☐      |
| 21 | Shopify Metaobjects                   | Settings → Custom data → Metaobjects list        | ☐      |
| 22 | Subscription dialog                   | Payment confirmation screen                      | ☐      |

---

## 10. Key Technical Terms (Glossary)

| Term                | Plain English Meaning                                               |
|---------------------|---------------------------------------------------------------------|
| **Slider**          | A group of banner images that cycle through                         |
| **Tag Collection**  | One image (slide) with its name, linked to a slider                 |
| **Pointer**         | An interactive tag placed on an image showing product info          |
| **Metaobject**      | Shopify's storage system — like a database table in the cloud       |
| **Theme Extension** | Code that adds features to the merchant's online store appearance   |
| **Polaris**         | Shopify's official design system (buttons, forms, tables, etc.)     |
| **Remix**           | The web framework used to build this app                            |
| **Prisma**          | A tool that connects the app to its database                        |
| **GraphQL**         | The query language used to talk to Shopify's servers                |
| **OAuth**           | The login/authentication process used by Shopify                    |
| **GDPR**            | European data privacy regulation — the app complies with it         |
| **Webhook**         | An automatic notification sent by Shopify when something happens    |
| **Docker**          | A tool to package the app for easy deployment on any server         |
| **HMR**             | Hot Module Reload — code changes appear instantly during development|
| **SSR**             | Server-Side Rendering — pages are built on the server first         |
