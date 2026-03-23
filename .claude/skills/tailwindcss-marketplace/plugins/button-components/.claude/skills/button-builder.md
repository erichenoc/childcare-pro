---
name: button-builder
description: Automatically builds optimized button components based on context
autoLoads: true
triggers:
  - "need.*button"
  - "create.*button"
  - "button.*component"
  - "interactive.*element"
---

# Button Builder Skill

Automatically generates optimized button components with appropriate variants, sizes, and accessibility features based on the context of your application.

## Auto-Loading Triggers

This skill automatically activates when:
- Creating new button components
- Implementing interactive elements
- Building forms or CTAs
- Designing navigation elements

## Capabilities

### Contextual Button Generation
Analyzes your design context and generates appropriate button styles:

```javascript
// Detected: E-commerce checkout context
const CheckoutButton = () => (
  <button class="btn btn-success btn-lg btn-block">
    <svg class="btn-icon-left w-5 h-5">
      <!-- Lock icon -->
    </svg>
    Secure Checkout
  </button>
);

// Detected: Dashboard navigation context
const DashboardNav = () => (
  <div class="btn-group">
    <button class="btn btn-ghost btn-sm">Overview</button>
    <button class="btn btn-ghost btn-sm btn-active">Analytics</button>
    <button class="btn btn-ghost btn-sm">Reports</button>
  </div>
);
```

### Smart Variant Selection
Automatically selects appropriate button variants based on:
- **Primary Actions**: Uses `btn-primary` for main CTAs
- **Destructive Actions**: Uses `btn-danger` for delete/remove operations
- **Secondary Actions**: Uses `btn-secondary` or `btn-outline`
- **Navigation**: Uses `btn-ghost` or `btn-link` for navigation

### Accessibility Enhancement
Automatically adds accessibility attributes:

```html
<!-- Generated for icon-only button -->
<button class="btn btn-primary btn-icon" aria-label="Save document">
  <svg class="w-5 h-5"><!-- Save icon --></svg>
</button>

<!-- Generated for loading state -->
<button class="btn btn-primary btn-loading" aria-busy="true" aria-disabled="true">
  <span class="btn-spinner" aria-hidden="true"></span>
  <span>Processing...</span>
</button>
```

### Responsive Optimization
Generates responsive button layouts:

```html
<!-- Mobile-optimized full-width button -->
<button class="btn btn-primary w-full sm:w-auto">
  Sign Up
</button>

<!-- Responsive button group -->
<div class="flex flex-col sm:flex-row gap-2">
  <button class="btn btn-primary flex-1 sm:flex-initial">
    Accept
  </button>
  <button class="btn btn-outline flex-1 sm:flex-initial">
    Cancel
  </button>
</div>
```

## Integration Patterns

### Form Integration
```html
<form>
  <!-- Form fields -->

  <!-- Auto-generated form buttons -->
  <div class="flex justify-end gap-3 mt-6">
    <button type="button" class="btn btn-ghost">
      Cancel
    </button>
    <button type="reset" class="btn btn-outline">
      Reset
    </button>
    <button type="submit" class="btn btn-primary">
      Submit
    </button>
  </div>
</form>
```

### Modal Actions
```html
<div class="modal-footer">
  <button class="btn btn-ghost" data-dismiss="modal">
    Close
  </button>
  <button class="btn btn-danger">
    Delete
  </button>
</div>
```

### Loading States
```javascript
const [loading, setLoading] = useState(false);

return (
  <button
    class={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
    disabled={loading}
    onClick={handleSubmit}
  >
    {loading ? (
      <>
        <span class="btn-spinner"></span>
        Processing...
      </>
    ) : (
      'Submit'
    )}
  </button>
);
```

## Performance Optimizations

### PurgeCSS Configuration
Automatically configures PurgeCSS to preserve button classes:

```javascript
// Generated purge configuration
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  safelist: [
    'btn',
    /^btn-/,
    'btn-group',
    'btn-group-item'
  ]
}
```

### Dynamic Imports
For large button libraries, generates dynamic imports:

```javascript
// Lazy load button variants
const ButtonVariants = {
  primary: () => import('./buttons/Primary'),
  secondary: () => import('./buttons/Secondary'),
  success: () => import('./buttons/Success'),
  // ...
};
```

## Dark Mode Handling

Automatically adapts buttons for dark mode:

```css
/* Auto-generated dark mode styles */
.dark .btn-primary {
  @apply bg-blue-600 hover:bg-blue-700;
}

.dark .btn-outline {
  @apply border-gray-600 text-gray-300 hover:bg-gray-800;
}

.dark .btn-ghost {
  @apply text-gray-300 hover:bg-gray-800;
}
```

## Component Templates

### React Template
```jsx
const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  children,
  ...props
}) => {
  const classes = cn(
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    loading && 'btn-loading',
    disabled && 'opacity-50 cursor-not-allowed'
  );

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <span className="btn-spinner" />}
      {icon && iconPosition === 'left' && icon}
      {children}
      {icon && iconPosition === 'right' && icon}
    </button>
  );
};
```

### Vue Template
```vue
<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="$emit('click')"
  >
    <span v-if="loading" class="btn-spinner"></span>
    <slot name="icon-left"></slot>
    <slot></slot>
    <slot name="icon-right"></slot>
  </button>
</template>

<script>
export default {
  props: {
    variant: { type: String, default: 'primary' },
    size: { type: String, default: 'md' },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false }
  },
  computed: {
    buttonClasses() {
      return [
        'btn',
        `btn-${this.variant}`,
        `btn-${this.size}`,
        this.loading && 'btn-loading'
      ];
    }
  }
}
</script>
```

## Best Practices

1. **Semantic HTML**: Use `<button>` for actions, `<a>` for navigation
2. **Loading States**: Always provide visual feedback during async operations
3. **Disabled States**: Clearly communicate when actions are unavailable
4. **Focus Management**: Ensure keyboard navigation works properly
5. **Touch Targets**: Maintain minimum 44x44px touch targets on mobile