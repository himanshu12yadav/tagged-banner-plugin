# Theme App Extension

## 1. Overview

The theme app extension renders the tagged banner slider on the merchant's storefront. It is a Liquid block that reads data from Shopify Metaobjects and renders an interactive image carousel with hoverable product tag pointers.

---

## 2. Extension Configuration

**File**: `extensions/theme-extension/shopify.extension.toml`

```toml
name = "theme-extension"
uid = "65b30aae-2fc0-9b48-3e28-e6bf3e801b92f9c75ad7"
type = "theme"
```

---

## 3. Block Schema

**File**: `extensions/theme-extension/blocks/star_rating.liquid`

```json
{
  "name": "Slider",
  "target": "section",
  "tag": "section",
  "class": "section",
  "settings": [
    {
      "type": "text",
      "id": "sliderId",
      "label": "Slider name"
    }
  ]
}
```

### Settings

| Setting    | Type   | Description                                                 |
|------------|--------|-------------------------------------------------------------|
| `sliderId` | `text` | The handle/name of the slider metaobject to render          |

The merchant enters the slider name (handle) in this field when adding the block via the Shopify theme editor.

---

## 4. Data Flow (Liquid)

```liquid
{% assign slider = block.settings.sliderId %}

{%- Step 1: Get the slider's system ID -%}
{% assign slider_ID = shop.metaobjects.sliders[slider].system.id %}

{%- Step 2: Construct the full GID -%}
{% assign git = "gid://shopify/Metaobject/" | append: slider_ID | strip %}

{%- Step 3: Get all tag collections for this slider -%}
{% assign tags = shop.metaobjects.tag_collection.values | where: "slider_id", git %}

{%- Step 4: For each tag, get its pointers -%}
{% for tag in tags %}
  {% assign tagId = "gid://shopify/Metaobject/" | append: tag.system.id %}
  {% assign pointers = shop.metaobjects.pointers.values | where: "tag_id", tagId %}
{% endfor %}
```

### Key Points

- Uses `shop.metaobjects.<type>` to access metaobject data directly in Liquid.
- Constructs GIDs manually by prepending `"gid://shopify/Metaobject/"` to the system ID.
- Uses Liquid's `where` filter to filter tag collections by `slider_id` and pointers by `tag_id`.

---

## 5. Rendering Structure

### 5.1 Slider Container

```html
<div class="slider" style="position: relative;">
  <!-- Slides rendered here -->
  <!-- Navigation controls rendered if > 1 slide -->
</div>
```

### 5.2 Individual Slide

Each tag collection becomes a slide:

```html
<div class="slide {% if forloop.first %}active{% endif %}">
  <img src="{{ tag.image_id | image_url }}" alt="Image" width="100%" height="100%">
  <div class="pointer-collection">
    <!-- Pointers rendered here -->
  </div>
</div>
```

- First slide gets the `active` class (visible by default).
- Image URL is generated via `image_url` filter on the `file_reference` field.

### 5.3 Pointer Markers

```html
<div style="position: absolute; left:{{ p.pos_x }}%; top:{{ p.pos_y }}%;" class="circle">
  <div class="hole">
    <div style="padding: 10px 0;"></div>
  </div>
  <span class="tooltip">{{ p.data }}</span>
</div>
```

- Positioned absolutely using percentage values (`pos_x`, `pos_y`).
- Pointer is a 30×30px dark circle with a 10×10px white "hole" center.
- Tooltip appears on hover showing `p.data` content.

### 5.4 Navigation Controls

Only rendered if there are more than 1 slide:

```html
{% if tags.size > 1 %}
  <div class="slider-controls">
    <button class="prev-btn"><img src="{{ 'previous.svg' | asset_url }}"></button>
    <button class="next-btn"><img src="{{ 'Next.svg' | asset_url }}"></button>
  </div>
{% endif %}
```

---

## 6. CSS Styles

All styles are inline within the Liquid file (no external CSS reference).

### Key Styles

| Element             | Style                                                          |
|---------------------|----------------------------------------------------------------|
| `.slider`           | 100% width, 500px height, relative position, overflow hidden   |
| `.slide`            | Absolute position, fading transition (opacity 0.5s)            |
| `.slide.active`     | opacity: 1 (visible)                                           |
| `.circle`           | 30×30px circle, dark background, cursor: grab, scales on hover |
| `.hole`             | 10×10px white circle, centered in the marker                   |
| `.tooltip`          | Hidden by default, shown on `.circle:hover`, white background  |
| `.slider-controls`  | Centered vertically, flex space-between                        |

### Tooltip Behavior

```css
.tooltip {
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.3s;
  position: absolute;
  /* Centered above the circle */
}

.circle:hover .tooltip {
  visibility: visible;
  opacity: 1;
  cursor: pointer;
}
```

---

## 7. JavaScript (Slider Navigation)

```javascript
document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.slide');
  let currentSlide = 0;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.remove('active');
      if (i === index) slide.classList.add('active');
    });
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  }

  function previousSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(currentSlide);
  }

  nextBtn.addEventListener('click', nextSlide);
  prevBtn.addEventListener('click', previousSlide);
});
```

### Features

- **Circular navigation**: Wraps around at both ends.
- **DOMContentLoaded**: Defers execution until DOM is ready.
- **Fade transition**: CSS handles the opacity animation between slides.

---

## 8. Assets

| File            | Path                            | Purpose                |
|-----------------|---------------------------------|------------------------|
| `Next.svg`      | `assets/Next.svg`               | Next arrow icon        |
| `previous.svg`  | `assets/previous.svg`           | Previous arrow icon    |

Referenced via `{{ '<filename>' | asset_url }}` in Liquid.

---

## 9. Locales

**File**: `locales/en.default.json`

```json
{
  "ratings": {
    "stars": { "label": "Ratings" },
    "home": { "recommendationText": "Recommended Product!" }
  }
}
```

---

## 10. How Merchants Add the Widget

1. Go to **Online Store → Themes → Customize**.
2. Click **Add section** or **Add block** in the desired page area.
3. Select the **"Slider"** block from the app's blocks.
4. Enter the **slider name** (the handle you created in the admin panel).
5. Click **Save**.

The slider will now render on the storefront with all tagged pointers.
