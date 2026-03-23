---
name: button-variants
description: Generate all button variants with consistent styling and states
category: components
tags: [button, variants, styles, theme]
---

# /button-variants

Generate a complete set of button variants with consistent styling, states, and dark mode support.

## Usage

```
/button-variants [theme] [options]
```

## Parameters

- `theme`: Color theme name (default, custom, minimal, material, bootstrap)
- `options`: Variant options (--all, --preview, --css, --config)

## Examples

### Generate All Variants
```
/button-variants default --all
```
Generates complete button variant system:
```css
/* Primary Variant */
.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

/* Secondary Variant */
.btn-secondary {
  @apply bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500;
}

/* Success Variant */
.btn-success {
  @apply bg-green-600 text-white hover:bg-green-700 focus:ring-green-500;
}

/* Danger Variant */
.btn-danger {
  @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
}

/* Warning Variant */
.btn-warning {
  @apply bg-yellow-500 text-gray-900 hover:bg-yellow-600 focus:ring-yellow-500;
}

/* Ghost Variant */
.btn-ghost {
  @apply bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500;
}

/* Outline Variant */
.btn-outline {
  @apply border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500;
}

/* Link Variant */
.btn-link {
  @apply text-blue-600 underline hover:text-blue-800 focus:ring-blue-500;
}
```

### Material Design Variants
```
/button-variants material
```
Generates Material Design 3 styled buttons:
```css
.btn-primary {
  @apply bg-blue-600 text-white rounded-full px-6 py-3;
  @apply hover:bg-blue-700 hover:shadow-lg;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
  @apply transition-all duration-200 ease-in-out;
  @apply active:scale-95;
}

.btn-elevated {
  @apply bg-white text-blue-600 rounded-full px-6 py-3;
  @apply shadow-md hover:shadow-lg;
  @apply dark:bg-gray-800 dark:text-blue-400;
}

.btn-filled-tonal {
  @apply bg-blue-100 text-blue-700 rounded-full px-6 py-3;
  @apply hover:bg-blue-200;
  @apply dark:bg-blue-900 dark:text-blue-100;
}
```

### Bootstrap-style Variants
```
/button-variants bootstrap
```
Generates Bootstrap 5 compatible buttons:
```css
.btn-primary {
  @apply bg-blue-600 text-white border border-blue-600;
  @apply hover:bg-blue-700 hover:border-blue-700;
  @apply focus:bg-blue-700 focus:border-blue-700 focus:shadow-[0_0_0_0.25rem_rgba(49,132,253,0.5)];
  @apply disabled:bg-blue-600 disabled:border-blue-600 disabled:opacity-65;
}

.btn-outline-primary {
  @apply bg-transparent text-blue-600 border border-blue-600;
  @apply hover:bg-blue-600 hover:text-white;
  @apply focus:shadow-[0_0_0_0.25rem_rgba(49,132,253,0.5)];
}
```

### Custom Theme Variants
```
/button-variants custom --config=brand-colors
```
Generates variants using custom brand colors:
```css
.btn-brand {
  @apply bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-400;
}

.btn-accent {
  @apply bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-400;
}

.btn-neutral {
  @apply bg-neutral-500 text-white hover:bg-neutral-600 focus:ring-neutral-400;
}
```

### Preview HTML
```
/button-variants default --preview
```
Generates preview HTML with all variants:
```html
<div class="p-8 space-y-4">
  <div class="space-x-2">
    <button class="btn btn-primary">Primary</button>
    <button class="btn btn-secondary">Secondary</button>
    <button class="btn btn-success">Success</button>
    <button class="btn btn-danger">Danger</button>
    <button class="btn btn-warning">Warning</button>
    <button class="btn btn-ghost">Ghost</button>
    <button class="btn btn-outline">Outline</button>
    <button class="btn btn-link">Link</button>
  </div>

  <!-- Disabled states -->
  <div class="space-x-2">
    <button class="btn btn-primary" disabled>Disabled Primary</button>
    <button class="btn btn-outline" disabled>Disabled Outline</button>
  </div>

  <!-- Size variations -->
  <div class="space-x-2">
    <button class="btn btn-primary btn-xs">XS</button>
    <button class="btn btn-primary btn-sm">SM</button>
    <button class="btn btn-primary btn-md">MD</button>
    <button class="btn btn-primary btn-lg">LG</button>
    <button class="btn btn-primary btn-xl">XL</button>
  </div>
</div>
```

## Dark Mode Variants

Generate dark mode optimized variants:
```
/button-variants default --dark-mode
```

```css
/* Dark mode variants */
.dark .btn-primary {
  @apply bg-blue-500 hover:bg-blue-600 text-white;
}

.dark .btn-secondary {
  @apply bg-gray-600 hover:bg-gray-700 text-white;
}

.dark .btn-ghost {
  @apply text-gray-300 hover:bg-gray-800;
}

.dark .btn-outline {
  @apply border-gray-600 text-gray-300 hover:bg-gray-800;
}
```

## CSS Variables Configuration

Generate with CSS variables for runtime theming:
```
/button-variants default --css-vars
```

```css
:root {
  --btn-primary-bg: theme('colors.blue.600');
  --btn-primary-hover: theme('colors.blue.700');
  --btn-primary-text: theme('colors.white');
  --btn-primary-focus: theme('colors.blue.500');
}

.btn-primary {
  background-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}

.btn-primary:hover {
  background-color: var(--btn-primary-hover);
}
```

## Tips

1. **Consistency**: Maintain consistent hover and focus states across all variants
2. **Accessibility**: Ensure sufficient color contrast (WCAG AA minimum)
3. **Dark Mode**: Test all variants in both light and dark modes
4. **Performance**: Use CSS variables for dynamic theming
5. **Documentation**: Document your variant hierarchy and usage guidelines