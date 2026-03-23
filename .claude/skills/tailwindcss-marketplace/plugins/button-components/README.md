# Button Components Plugin for Tailwind CSS

A comprehensive button component system that extends Tailwind CSS with production-ready button utilities, variants, and interactive states.

## Features

- **8 Button Variants**: Primary, secondary, success, danger, warning, ghost, outline, and link styles
- **5 Size Options**: From extra small (xs) to extra large (xl)
- **Interactive States**: Hover, focus, active, disabled, and loading states
- **Dark Mode Support**: Automatic dark mode variants for all button styles
- **Accessibility**: WCAG-compliant focus indicators and keyboard navigation
- **Icon Support**: Built-in icon placement and sizing utilities
- **Button Groups**: Utilities for creating button groups and toolbars
- **Ripple Effects**: Optional material design ripple animations

## Installation

```bash
npm install @skillstash/tailwind-button-components
```

Add to your `tailwind.config.js`:

```javascript
module.exports = {
  plugins: [
    require('@skillstash/tailwind-button-components')
  ]
}
```

## Basic Usage

### Simple Button

```html
<button class="btn btn-primary">
  Click me
</button>
```

### Button Variants

```html
<!-- Primary button -->
<button class="btn btn-primary">Primary</button>

<!-- Secondary button -->
<button class="btn btn-secondary">Secondary</button>

<!-- Success button -->
<button class="btn btn-success">Success</button>

<!-- Danger button -->
<button class="btn btn-danger">Danger</button>

<!-- Warning button -->
<button class="btn btn-warning">Warning</button>

<!-- Ghost button -->
<button class="btn btn-ghost">Ghost</button>

<!-- Outline button -->
<button class="btn btn-outline">Outline</button>

<!-- Link button -->
<button class="btn btn-link">Link</button>
```

### Button Sizes

```html
<button class="btn btn-primary btn-xs">Extra Small</button>
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary btn-md">Medium</button>
<button class="btn btn-primary btn-lg">Large</button>
<button class="btn btn-primary btn-xl">Extra Large</button>
```

### Button with Icons

```html
<!-- Icon on left -->
<button class="btn btn-primary">
  <svg class="btn-icon-left">...</svg>
  Save
</button>

<!-- Icon on right -->
<button class="btn btn-primary">
  Delete
  <svg class="btn-icon-right">...</svg>
</button>

<!-- Icon only -->
<button class="btn btn-primary btn-icon">
  <svg>...</svg>
</button>
```

### Button States

```html
<!-- Disabled state -->
<button class="btn btn-primary" disabled>
  Disabled
</button>

<!-- Loading state -->
<button class="btn btn-primary btn-loading">
  <span class="btn-spinner"></span>
  Loading...
</button>

<!-- Active state -->
<button class="btn btn-primary btn-active">
  Active
</button>
```

### Button Groups

```html
<div class="btn-group">
  <button class="btn btn-outline">Left</button>
  <button class="btn btn-outline">Center</button>
  <button class="btn btn-outline">Right</button>
</div>

<!-- Vertical button group -->
<div class="btn-group-vertical">
  <button class="btn btn-outline">Top</button>
  <button class="btn btn-outline">Middle</button>
  <button class="btn btn-outline">Bottom</button>
</div>
```

## Advanced Usage

### Custom Button with Tailwind Utilities

```html
<button class="btn btn-primary bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg">
  Gradient Button
</button>
```

### Ripple Effect

```html
<button class="btn btn-primary btn-ripple">
  Click for Ripple
</button>
```

### Full Width Button

```html
<button class="btn btn-primary btn-block">
  Full Width Button
</button>
```

### Button with Badge

```html
<button class="btn btn-primary relative">
  Notifications
  <span class="btn-badge">5</span>
</button>
```

## Configuration

Customize the plugin in your `tailwind.config.js`:

```javascript
module.exports = {
  plugins: [
    require('@skillstash/tailwind-button-components')({
      // Custom color palette
      colors: {
        primary: 'blue',
        secondary: 'gray',
        success: 'green',
        danger: 'red',
        warning: 'yellow'
      },
      // Custom sizes
      sizes: {
        xs: '0.5rem 1rem',
        sm: '0.625rem 1.25rem',
        md: '0.75rem 1.5rem',
        lg: '0.875rem 1.75rem',
        xl: '1rem 2rem'
      },
      // Enable/disable features
      ripple: true,
      icons: true,
      groups: true
    })
  ]
}
```

## CSS Variables

The plugin uses CSS variables for easy customization:

```css
:root {
  --btn-primary: theme('colors.blue.600');
  --btn-primary-hover: theme('colors.blue.700');
  --btn-primary-focus: theme('colors.blue.800');
  --btn-text-primary: theme('colors.white');

  --btn-radius: 0.375rem;
  --btn-font-weight: 500;
  --btn-transition: all 0.2s ease;
}
```

## Accessibility Features

- **Focus Indicators**: Clear focus rings for keyboard navigation
- **ARIA Support**: Proper ARIA attributes for screen readers
- **Disabled States**: Proper disabled styling and cursor states
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Color Contrast**: WCAG AA compliant color combinations

## Dark Mode

All button variants automatically adapt to dark mode:

```html
<html class="dark">
  <button class="btn btn-primary">
    Automatically styled for dark mode
  </button>
</html>
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## License

MIT License - see LICENSE file for details