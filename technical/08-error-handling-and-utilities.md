# Error Handling & Utilities

## 1. Error Handling Architecture

The app has a two-layer error handling system:

1. **Server-side** (`app/utils/errorHandler.js`, `app/utils/errorHandling.js`) — handles GraphQL, network, and validation errors in loaders/actions.
2. **Client-side** (`app/component/Error/Error.jsx`) — renders error UI using Polaris components with retry and navigation capabilities.

---

## 2. Server-Side Error Handling

### 2.1 ErrorHandler Class

**File**: `app/utils/errorHandler.js`

A static utility class for server-side error processing.

#### Methods

| Method                      | Description                                              |
|-----------------------------|----------------------------------------------------------|
| `logError(error, context)`  | Logs errors; production-ready for external services      |
| `handleGraphQLError(error)` | Classifies GraphQL errors (network, auth, rate limit)    |
| `handleValidationError(fieldErrors)` | Formats field-level validation errors          |
| `handleNetworkError(error)` | Wraps network errors with user-friendly messages         |
| `handleUnexpectedError(error)` | Catches all other errors                              |
| `isRetryableError(type)`    | Returns `true` for NETWORK, SERVER, GENERAL errors       |
| `getErrorMessage(error)`    | Extracts message string from any error type              |
| `shouldShowDetails(error)`  | Returns `true` only in development mode                  |

#### GraphQL Error Classification

```javascript
ErrorHandler.handleGraphQLError(error)
// Returns: { type: ErrorTypes.NETWORK | UNAUTHORIZED | SERVER, message, originalError }

// Classification rules:
// - "fetch failed"    → NETWORK
// - "Unauthorized"    → UNAUTHORIZED
// - "Rate limit"      → SERVER
// - anything else     → SERVER (default)
```

#### Usage in Routes

```javascript
// In app.slider.$id.$pointer.jsx loader:
try {
  // ... GraphQL operations
} catch (err) {
  ErrorHandler.logError(err, { route: 'app.slider.$id.$pointer', params });
  
  if (err instanceof Response) throw err;  // Re-throw HTTP responses
  
  const processedError = ErrorHandler.handleGraphQLError(err);
  if (processedError.type === "NETWORK") {
    throw new Response("Network error occurred", { status: 503 });
  }
  
  throw new Response("Error fetching data", { status: 500 });
}
```

### 2.2 Error Handling Utilities

**File**: `app/utils/errorHandling.js`

Standalone utility functions for error detection and retry logic.

| Function                   | Description                                          |
|----------------------------|------------------------------------------------------|
| `isNetworkError(error)`    | Checks if error is network-related (fetch, timeout)  |
| `checkOnlineStatus()`      | Returns `navigator.onLine` status                    |
| `handleGraphQLError(error)`| Returns user-friendly message with retry guidance     |
| `retryAsync(fn, max, delay)`| Retries async function with exponential backoff      |

#### Network Error Detection

```javascript
isNetworkError(error)
// Checks for:
// - "fetch failed", "network error", "connection failed", "timeout"
// - Error codes: FETCH_ERROR, NETWORK_ERROR, ECONNREFUSED, ETIMEDOUT
```

#### Retry Logic

```javascript
retryAsync(asyncFn, maxRetries = 3, delay = 1000)
// - Only retries on network errors
// - Uses linear backoff: delay * (attempt + 1)
// - Throws last error if all retries fail
```

### 2.3 React Error Handling Hook

**File**: `app/utils/errorHandler.js` → `useErrorHandling()`

```javascript
const { errors, addError, removeError, clearAllErrors } = useErrorHandling();

// addError(error, context) → returns errorId
// removeError(errorId) → removes specific error
// clearAllErrors() → clears all errors
```

### 2.4 Error Utility Functions

**File**: `app/utils/errorHandler.js` → `errorUtils`

```javascript
// Wrap GraphQL queries with error handling
const result = await errorUtils.withGraphQLErrorHandling(
  () => someQuery(),
  fallbackValue
);

// Retry with exponential backoff
const result = await errorUtils.withRetry(
  () => fetchData(),
  3,    // maxRetries
  1000  // initial delay (ms)
);

// Validate form data
const errors = errorUtils.validateForm(formData, {
  name: { required: true, minLength: 3 },
  email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
});
```

---

## 3. Route ErrorBoundary Pattern

Every route defines an `ErrorBoundary` export that renders the appropriate error UI:

```jsx
// Pattern used across all route files:
export const ErrorBoundary = () => {
  return (
    <Error
      type={ErrorTypes.GENERAL}
      title="Dashboard Error"
      message="An error occurred while loading the dashboard."
      showHome={true}
      showRetry={true}
    />
  );
};
```

| Route                        | Error Title               |
|------------------------------|---------------------------|
| `app._index.jsx`             | Dashboard Error           |
| `app.slider.$sliderId.jsx`   | Slider Dashboard Error    |
| `app.slider.$id.$pointer.jsx`| Slider Error              |
| `app.jsx`                    | Authentication Error (401)|

---

## 4. Helper Utilities

**File**: `app/routes/helper.jsx`

### Coordinate Conversion

```javascript
// Convert pixel position to percentage (for saving to Metaobjects)
pixelToPercentage(pixel, dimension) → (pixel / dimension) * 100

// Convert percentage to pixel position (for rendering on screen)
percentageToPixel(percentage, dimension) → (percentage / 100) * dimension
```

### Data Validation

```javascript
// Check if all tags have non-empty sku and data fields
checkFieldIsEmpty(tags) → boolean

// Deep compare two objects by key equality
areObjectEqual(obj1, obj2) → boolean

// Check if any object in 'current' has changed from 'previous'
isThereChange(previous, current) → boolean
```

### Time Formatting

```javascript
// Convert current time to 12-hour format string
convertTo12HoursForm() → "3:45:00 PM"
```

---

## 5. Webhooks Security

**File**: `app/routes/webhooks.jsx`

Webhook requests are validated using HMAC-SHA256:

```javascript
const signature = request.headers.get('x-shopify-hmac-sha256');
const generateSignature = crypto
  .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
  .update(rawPayload)
  .digest('base64');

if (signature !== generateSignature) {
  throw new Response(null, { status: 401 });
}
```

This ensures only legitimate Shopify webhook payloads are processed.

---

## 6. Session Management

**File**: `app/shopify.server.js`

The Shopify app is configured with:

```javascript
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  // ...
});

// Exported utilities:
export const authenticate = shopify.authenticate;
export const login = shopify.login;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
```

### Exported Utilities

| Export                      | Usage                                    |
|-----------------------------|------------------------------------------|
| `authenticate.admin(req)`   | Validates admin session, returns admin   |
| `authenticate.webhook(req)` | Validates webhook HMAC, returns payload  |
| `login`                     | Initiates OAuth login flow               |
| `addDocumentResponseHeaders`| Adds Shopify security headers to SSR     |
