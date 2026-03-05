# Technical Documentation Index

## Sprinix Tagged Banner — Developer Documentation

**App Name**: Sprinix Tagged Banner  
**Handle**: `tagged-banner`  
**Framework**: Remix v2.7 + Vite + Shopify Polaris v12  
**Shopify API Version**: 2025-01  
**Author**: Sprinix Team (Sprinix Technolabs)

---

## Documentation Files

| #  | Document                                                                | Description                                                      |
|----|-------------------------------------------------------------------------|------------------------------------------------------------------|
| 01 | [Architecture Overview](./01-architecture-overview.md)                  | System architecture, tech stack, data model, project structure   |
| 02 | [Setup & Development](./02-setup-and-development.md)                    | Prerequisites, environment setup, local dev, scripts, configs    |
| 03 | [Routes & API Reference](./03-routes-and-api.md)                        | All Remix routes, loaders, actions, request/response formats     |
| 04 | [GraphQL Operations](./04-graphql-operations.md)                        | Every GraphQL query and mutation with full schema details        |
| 05 | [Components Reference](./05-components-reference.md)                    | React components, custom hooks, props API documentation          |
| 06 | [Database & Data Layer](./06-database-and-data-layer.md)                | Prisma schema, Metaobject definitions, data relationships        |
| 07 | [Theme Extension](./07-theme-extension.md)                              | Liquid block, storefront rendering, CSS, JavaScript navigation   |
| 08 | [Error Handling & Utilities](./08-error-handling-and-utilities.md)       | ErrorHandler class, utilities, webhook security, session mgmt    |
| 09 | [Deployment & Environment](./09-deployment-and-environment.md)          | Docker deployment, env vars, webhooks, reverse proxy, debugging  |
| 10 | [General Documentation](./10-general-documentation.md)                  | Non-technical overview, screenshot guide, folder structure, glossary |

---

## Quick Start for Developers

```bash
# 1. Install dependencies
npm install

# 2. Setup database
npx prisma generate && npx prisma migrate deploy

# 3. Start development server
npm run dev

# 4. Deploy to Shopify
npm run deploy
```

---

## Data Flow Summary

```
Merchant (Shopify Admin)
  │
  ├── Creates "Slider" (metaobject: sliders)
  │     ├── Uploads image + creates "Tag Collection" (metaobject: tag_collection)
  │     │     └── Drag-drops "Pointers" on image (metaobject: pointers)
  │     │           stores: SKU, tooltip data, x%, y%
  │     └── ... more tag collections (slides)
  │
  └── Adds "Slider" block to theme editor → enters slider name
        │
        └── Storefront renders via Liquid template
              reads metaobjects → renders slider + pointers + tooltips
```

---

## Key Contacts

- **Support**: support@taggedbanner.com
- **Website**: [sprinix.com](https://www.sprinix.com)
