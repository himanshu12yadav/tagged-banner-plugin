# Components Reference

## 1. Component Architecture

```
app/component/
├── DragAndDrop/
│   ├── DragAndDrop.jsx         # Draggable tag marker
│   └── DropAndDrag.module.css  # Styles for tag markers
├── Error/
│   ├── Error.jsx               # Error components & boundary
│   ├── Error.module.css        # Error styles
│   ├── ErrorExamples.jsx       # Usage examples
│   └── index.js                # Barrel export
├── FormControl/
│   ├── FormControl.jsx         # Pointer data form
│   └── FormControl.module.css  # Form styles
├── UploadFile/
│   └── UploadFile.jsx          # File upload component
├── customHook/
│   ├── useDragAndDrop.jsx      # Drag & drop state hook
│   └── useIsomorphicLayoutEffect.jsx  # SSR-safe layout effect
└── ItemTypes.jsx               # DnD type constants
```

---

## 2. DragAndDrop Component

**File**: `app/component/DragAndDrop/DragAndDrop.jsx`

A draggable circular tag marker that can be placed on a banner image.

### Props

| Prop             | Type       | Description                           |
|------------------|------------|---------------------------------------|
| `id`             | `string`   | Unique identifier for the tag         |
| `x`              | `number`   | X position in pixels                  |
| `y`              | `number`   | Y position in pixels                  |
| `data`           | `string`   | Tooltip content (displayed on hover)  |
| `handleDragStart`| `function` | Callback when drag begins             |

### Behavior

- Uses `react-dnd`'s `useDrag` hook with `ItemTypes.TAG` type.
- Renders an absolutely-positioned circle at `(x, y)`.
- Shows a tooltip (via `react-tooltip`) on hover displaying the `data` content.
- Calls `handleDragStart()` when dragging begins.
- Logs drop results to console.

### Visual Structure

```
┌─── Drag marker (30×30px circle, semi-transparent dark) ───┐
│   ┌── Hole (10×10px white circle, centered) ──┐           │
│   └───────────────────────────────────────────┘           │
├─── Tooltip (react-tooltip, appears on hover) ─────────────┤
│   "Product SKU data or tooltip content"                    │
└───────────────────────────────────────────────────────────┘
```

---

## 3. FormControl Component

**File**: `app/component/FormControl/FormControl.jsx`

A collapsible card with form fields for editing a pointer's data.

### Props

| Prop           | Type       | Description                                   |
|----------------|------------|-----------------------------------------------|
| `id`           | `string`   | Pointer identifier                            |
| `tag`          | `object`   | Tag data `{ sku, data }`                      |
| `updateTag`    | `function` | Callback to update tag data in parent state   |
| `deleteForm`   | `function` | Callback to delete the pointer                |
| `handleCreate` | `function` | Callback to create pointer in backend         |
| `handleUpdate` | `function` | Callback to update pointer in backend         |
| `loaderData`   | `object`   | Loader data for checking if pointer exists    |
| `createLoader` | `boolean`  | Loading state for create action               |
| `deleteLoader` | `boolean`  | Loading state for delete action               |
| `updateLoader` | `boolean`  | Loading state for update action               |

### Features

- **Collapsible**: Toggle expand/collapse with Plus/Minus icon.
- **Form Fields**:
  - `Product SKU` — Text input for the product SKU.
  - `Data` — Text input for tooltip/pointer details.
- **Action Button**: Shows "Create" or "Update" depending on whether the pointer exists in the backend (checks `loaderData.nodes`).
- **Delete Button**: Always visible in the header with spinner state.
- **Real-time Updates**: Calls `updateTag()` on every field change to sync state with parent.

---

## 4. Error Component System

**File**: `app/component/Error/Error.jsx`

A comprehensive error handling system with multiple variants.

### Error Types

| Type             | Constant                    | Default Title        | Tone       |
|------------------|-----------------------------|----------------------|------------|
| Network          | `ErrorTypes.NETWORK`        | Connection Error     | `critical` |
| Validation       | `ErrorTypes.VALIDATION`     | Validation Error     | `warning`  |
| General          | `ErrorTypes.GENERAL`        | Something went wrong | `critical` |
| Not Found        | `ErrorTypes.NOT_FOUND`      | Page Not Found       | `info`     |
| Unauthorized     | `ErrorTypes.UNAUTHORIZED`   | Access Denied        | `critical` |
| Server           | `ErrorTypes.SERVER`         | Server Error         | `critical` |

### Error Component Props

| Prop        | Type       | Default              | Description                       |
|-------------|------------|----------------------|-----------------------------------|
| `type`      | `string`   | `ErrorTypes.GENERAL` | Error type from `ErrorTypes`      |
| `title`     | `string`   | Auto from type       | Error title                       |
| `message`   | `string`   | Auto from type       | Error message                     |
| `details`   | `string`   | `undefined`          | Additional details                |
| `onRetry`   | `function` | `window.reload()`    | Custom retry handler              |
| `onHome`    | `function` | `navigate("/app")`   | Custom home navigation            |
| `showRetry` | `boolean`  | `true`               | Show retry button                 |
| `showHome`  | `boolean`  | `false`              | Show home button                  |
| `inline`    | `boolean`  | `false`              | Inline banner vs full-page state  |

### Rendering Modes

- **Inline** (`inline={true}`): Renders as a Polaris `Banner` component.
- **Full Page** (`inline={false}`): Renders as a Polaris `EmptyState` inside a `Card`.

### Pre-built Error Components

```jsx
<NetworkError />        // ErrorTypes.NETWORK
<ValidationError />     // ErrorTypes.VALIDATION + inline=true
<NotFoundError />       // ErrorTypes.NOT_FOUND + showHome=true
<ServerError />         // ErrorTypes.SERVER
```

### ErrorBoundary Class

A React class component that catches render errors.

```jsx
<ErrorBoundary showDetails={true}>
  <YourComponent />
</ErrorBoundary>
```

### useErrorHandler Hook

```jsx
const { error, handleError, clearError, retryHandler } = useErrorHandler();
```

---

## 5. Custom Hooks

### 5.1 `useDragAndDrop`

**File**: `app/component/customHook/useDragAndDrop.jsx`

Central state management hook for the drag-and-drop pointer editor.

#### Returned State & Methods

| Name              | Type       | Description                                         |
|-------------------|------------|-----------------------------------------------------|
| `tags`            | `array`    | Array of `{ id, sku, data }` objects                |
| `setTag`          | `function` | State setter for tags                               |
| `pointers`        | `array`    | Array of `{ id, x, y }` objects                     |
| `setPointer`      | `function` | State setter for pointers                           |
| `handleAdd`       | `function` | Adds a new tag+pointer pair with UUID id            |
| `handleDelete`    | `function` | Removes a tag+pointer pair by id                    |
| `handleDragStart` | `function` | Drag start handler (logs event)                     |
| `handleDrop`      | `function` | Processes drop — calculates position within target  |
| `handleUpdateTag` | `function` | Updates tag data (sku/data) by id                   |
| `drop`            | `ref`      | React ref for the drop target element               |
| `isOver`          | `boolean`  | Whether a dragged item is over the drop target      |
| `width`           | `number`   | Current width of drop target                        |
| `height`          | `number`   | Current height of drop target                       |

#### Drop Calculation

When an item is dropped:
1. Gets the drop target element by ID (`#dropTarget`).
2. Calculates the target's bounding rectangle.
3. Computes new position: `x = delta.x - rect.left`, `y = delta.y - rect.top`.
4. Updates the pointer's position via `handlePosition()`.

---

### 5.2 `useIsomorphicLayoutEffect`

**File**: `app/component/customHook/useIsomorphicLayoutEffect.jsx`

Uses `useLayoutEffect` on client, `useEffect` on server to avoid SSR warnings.

```jsx
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
```

**Used in**: `ClientOnly` component pattern to detect client-side mounting.

---

## 6. ItemTypes

**File**: `app/component/ItemTypes.jsx`

```jsx
export const ItemTypes = {
  TAG: "tag",
};
```

Defines the DnD item type used across `DragAndDrop` and `useDragAndDrop`.
