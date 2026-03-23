---
name: button-create
description: Create a new button component with specified variant, size, and features
category: components
tags: [button, create, component, ui]
---

# /button-create

Create a new Tailwind CSS button component with customizable variants, sizes, and interactive features.

## Usage

```
/button-create [variant] [size] [options]
```

## Parameters

- `variant`: Button style variant (primary, secondary, success, danger, warning, ghost, outline, link)
- `size`: Button size (xs, sm, md, lg, xl)
- `options`: Additional options (--icon, --ripple, --gradient, --full-width, --loading)

## Examples

### Basic Button Creation
```
/button-create primary md
```
Generates:
```html
<button class="btn btn-primary btn-md">
  Button Text
</button>
```

### Button with Icon
```
/button-create primary lg --icon=left
```
Generates:
```html
<button class="btn btn-primary btn-lg">
  <svg class="btn-icon-left w-5 h-5">
    <!-- Icon SVG -->
  </svg>
  Button Text
</button>
```

### Gradient Button
```
/button-create primary md --gradient
```
Generates:
```html
<button class="btn btn-primary btn-md bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
  Gradient Button
</button>
```

### Full Width Loading Button
```
/button-create primary lg --full-width --loading
```
Generates:
```html
<button class="btn btn-primary btn-lg btn-block btn-loading">
  <span class="btn-spinner"></span>
  Loading...
</button>
```

## Advanced Options

### Dark Mode Optimized
```
/button-create primary md --dark-mode
```
Generates button with enhanced dark mode styles:
```html
<button class="btn btn-primary btn-md dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white">
  Dark Mode Button
</button>
```

### Accessible Button
```
/button-create primary md --accessible
```
Generates button with full accessibility attributes:
```html
<button
  class="btn btn-primary btn-md focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
  role="button"
  aria-label="Primary Action"
  tabindex="0"
>
  Accessible Button
</button>
```

### React Component
```
/button-create primary md --react
```
Generates:
```jsx
const Button = ({ children, onClick }) => (
  <button
    className="btn btn-primary btn-md"
    onClick={onClick}
  >
    {children}
  </button>
);
```

### Vue Component
```
/button-create primary md --vue
```
Generates:
```vue
<template>
  <button
    class="btn btn-primary btn-md"
    @click="handleClick"
  >
    <slot></slot>
  </button>
</template>

<script>
export default {
  methods: {
    handleClick() {
      this.$emit('click');
    }
  }
}
</script>
```

## Configuration

The command respects your tailwind.config.js settings:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8'
        }
      }
    }
  },
  plugins: [
    require('@skillstash/tailwind-button-components')
  ]
}
```

## Tips

1. **Combine with Tailwind utilities**: Add any Tailwind utility classes to customize further
2. **Use semantic HTML**: Consider using `<a>` tags for navigation buttons
3. **Test accessibility**: Always test with keyboard navigation and screen readers
4. **Performance**: Use PurgeCSS to remove unused button styles in production
5. **Consistency**: Establish a button hierarchy (primary, secondary, tertiary) in your design system