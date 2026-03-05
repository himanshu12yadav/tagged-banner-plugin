# GraphQL Operations Reference

All GraphQL operations are defined in two files:
- `app/routes/graphql/query.jsx` — Core CRUD operations, subscriptions
- `app/routes/helper.jsx` — File upload mutations, additional helpers

All operations use the **Shopify Admin GraphQL API** version `2025-01`.

---

## 1. Metaobject Operations

### 1.1 Create Metaobject Definition

**File**: `query.jsx` → `createMetaobjectDefinition(admin, name, fields, displayNameKey)`

Creates a new metaobject type definition during the `afterAuth` hook.

```graphql
mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
  metaobjectDefinitionCreate(definition: $definition) {
    metaobjectDefinition {
      name
      type
      displayNameKey
      fieldDefinitions { name, key }
    }
    userErrors { field, message, code }
  }
}
```

**Called From**: `shopify.server.js` → `afterAuth` hook  
**Purpose**: Auto-creates `sliders`, `tag_collection`, `pointers` definitions on first install.

---

### 1.2 Delete Metaobject Definition

**File**: `query.jsx` → `deleteMetaobjectDefinition(admin, id)`

```graphql
mutation DeleteMetaobjectDefinition($id: ID!) {
  metaobjectDefinitionDelete(id: $id) {
    deletedId
    userErrors { field, message, code }
  }
}
```

**Called From**: `webhooks.jsx` → `handleAppUninstall()`

---

### 1.3 Create Metaobject (Pointer)

**File**: `query.jsx` → `createMetaobject(admin, data)`

Creates a pointer metaobject with fields: `sku`, `pointer_id`, `slider_id`, `tag_id`, `data`, `pos_x`, `pos_y`.

```graphql
mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
  metaobjectCreate(metaobject: $metaobject) {
    metaobject { handle, id }
    userErrors { field, message, code }
  }
}
```

**Called From**: `app.slider.$id.$pointer.jsx` → `action()` (CREATE type)

---

### 1.4 Create Metaobject (Common)

**File**: `query.jsx` → `createMetaobjectCommon(admin, fields)`

Generic metaobject creation accepting a full `MetaobjectCreateInput` object.

```graphql
mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
  metaobjectCreate(metaobject: $metaobject) {
    metaobject { handle, id }
    userErrors { field, message, code }
  }
}
```

**Called From**: `app._index.jsx` → `action()` (slider creation)

---

### 1.5 Update Metaobject

**File**: `query.jsx` → `updateMetaobjectById(admin, data, id)`

Updates pointer fields: `sku`, `slider_id`, `tag_id`, `data`, `pos_x`, `pos_y`.

```graphql
mutation UpdateMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
  metaobjectUpdate(id: $id, metaobject: $metaobject) {
    metaobject { handle, id }
    userErrors { field, message, code }
  }
}
```

**Called From**: `app.slider.$id.$pointer.jsx` → `action()` (UPDATE type)

---

### 1.6 Delete Metaobject

**File**: `query.jsx` → `deleteMetaobjectById(admin, id)`

```graphql
mutation DeleteMetaobject($id: ID!) {
  metaobjectDelete(id: $id) {
    deletedId
    userErrors { field, message, code }
  }
}
```

**Called From**: Multiple routes for deleting sliders, tag collections, and pointers.

---

## 2. Query Operations

### 2.1 Metaobject Definition By Type

**File**: `query.jsx` → `metaobjectByDefinitionType(admin, type)`

```graphql
query {
  metaobjectDefinitionByType(type: "<type>") {
    name
    type
    id
    fieldDefinitions { key, name }
    metaobjectsCount
  }
}
```

**Returns**: Definition metadata including total count of metaobjects.  
**Fallback**: Returns a safe fallback with `metaobjectsCount: 0` on error instead of throwing.

---

### 2.2 Metaobject By Handle

**File**: `query.jsx` → `metaobjectByHandle(admin, handle, type)`

```graphql
query {
  metaobjectByHandle(handle: { type: "<type>", handle: "<handle>" }) {
    displayName
    handle
    id
  }
}
```

**Called From**: Slider detail and pointer editor loaders.

---

### 2.3 Metaobject By Handle With Image

**File**: `query.jsx` → `metaobjectByHandleWithImage(admin, handle, type)`

Same as above but includes `fields` with `reference` for `MediaImage`.

```graphql
query {
  metaobjectByHandle(handle: { type: "<type>", handle: "<handle>" }) {
    displayName
    fields {
      key
      reference {
        ... on MediaImage {
          image { url }
        }
      }
      value
    }
    handle
    id
  }
}
```

**Called From**: Pointer editor loader — to get the tag collection's image URL.

---

### 2.4 List Metaobjects (with images)

**File**: `query.jsx` → `getListData(admin, type, count)`

```graphql
query {
  metaobjects(first: <count>, type: "<type>") {
    nodes {
      fields {
        key
        reference {
          ... on MediaImage { image { url } }
        }
        value
      }
      handle
      id
      updatedAt
    }
    pageInfo { endCursor, hasNextPage, hasPreviousPage, startCursor }
  }
}
```

**Called From**: Slider detail loader — fetches tag collections and pointers.

---

### 2.5 Get Pointer Data

**File**: `query.jsx` → `getPointerData(admin, type, count)`

Similar to `getListData` but without image references (pointers don't have images).

---

### 2.6 Slider Result

**File**: `query.jsx` → `sliderResult(admin, sliderCount)`

Fetches all slider metaobjects with field values, handles, and pagination info.

---

## 3. Subscription Operations

### 3.1 Get Subscription Status

**File**: `query.jsx` → `getSubscriptionStatus(graphql)`

```graphql
query {
  currentAppInstallation {
    activeSubscriptions {
      createdAt
      currentPeriodEnd
      id
      lineItems {
        id
        plan {
          pricingDetails {
            ... on AppRecurringPricing {
              interval
              price { amount, currencyCode }
            }
          }
        }
      }
      returnUrl
      name
      status
      test
      trialDays
    }
  }
}
```

---

### 3.2 Create App Subscription

**File**: `query.jsx` → `appSubscriptionCreate(admin, returnUrl)`

Creates a monthly subscription plan:
- **Name**: "Tag Banner Monthly Plan"
- **Price**: $2.00 USD / 30 days
- **Trial**: 1 day

```graphql
mutation AppSubscriptionCreate($name: String!, $lineItems: [...], $returnUrl: URL!, $test: Boolean, $trialDays: Int) {
  appSubscriptionCreate(...) {
    userErrors { field, message }
    appSubscription { id, status }
    confirmationUrl
  }
}
```

---

### 3.3 Cancel App Subscription

**File**: `query.jsx` → `appSubscriptionCancel(admin, subscriptionId)`

Cancels a subscription with proration enabled.

---

### 3.4 Subscription Metafield

**File**: `query.jsx` → `subscriptionMetafield(graphql, value)`

Sets a boolean metafield (`sprinix.hasPlan`) on the current app installation to track subscription status.

---

## 4. File Upload Operations

### 4.1 Staged Upload Create

**File**: `helper.jsx` → `stagedUploadsCreate(admin, file)`

```graphql
mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
  stagedUploadsCreate(input: $input) {
    stagedTargets {
      url
      resourceUrl
      parameters { name, value }
    }
  }
}
```

**Purpose**: Gets a pre-signed URL for uploading images to Shopify's CDN.

---

### 4.2 File Create

**File**: `helper.jsx` → `createFile(admin, file, resourceUrl)`

```graphql
mutation fileCreate($files: [FileCreateInput!]!) {
  fileCreate(files: $files) {
    files { alt, createdAt, id }
  }
}
```

**Purpose**: Registers the uploaded file in Shopify's file storage.

---

### 4.3 File Delete

**File**: `helper.jsx` → `fileDelete(admin, id)`

```graphql
mutation fileDelete($input: [ID!]!) {
  fileDelete(fileIds: $input) {
    deletedFileIds
  }
}
```

---

### 4.4 Upload Flow (Complete)

The `uploadNewFile()` function orchestrates the full upload:

```
1. stagedUploadsCreate(admin, file)     → get pre-signed URL + parameters
2. uploadToCloud(parameters, file, url) → POST file to Shopify CDN
3. createFile(admin, file, resourceUrl) → register file in Shopify
4. Return file ID (e.g., "gid://shopify/MediaImage/123")
```
