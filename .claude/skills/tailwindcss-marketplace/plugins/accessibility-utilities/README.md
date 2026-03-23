# Accessibility Utilities Plugin for Tailwind CSS

WCAG-compliant utilities for screen readers, keyboard navigation, and accessible design patterns.

## Features

- **Screen Reader Utilities**: sr-only, not-sr-only, aria utilities
- **Focus Management**: Focus-visible, focus-within, focus trapping
- **Keyboard Navigation**: Skip links, roving tabindex, keyboard shortcuts
- **ARIA Patterns**: Live regions, announcements, landmarks
- **Testing Tools**: Contrast checker, ARIA validator, keyboard tester
- **WCAG Compliance**: A, AA, AAA level support

## Installation

```bash
npm install @skillstash/tailwind-accessibility-utilities
```

## Basic Usage

### Screen Reader Only
```html
<span class="sr-only">This text is only for screen readers</span>
<button class="not-sr-only">Visible to all users</button>
```

### Skip Links
```html
<a href="#main" class="skip-link">Skip to main content</a>
<main id="main" tabindex="-1">Main content</main>
```

### Focus Indicators
```html
<button class="focus-visible:ring-2 focus-visible:ring-blue-500">
  Keyboard focus only
</button>
```

### ARIA Live Regions
```html
<div aria-live="polite" aria-atomic="true" class="aria-live">
  <p class="aria-announcement">Status updates appear here</p>
</div>
```

### Keyboard Navigation
```html
<nav class="keyboard-nav" data-arrow-navigation="true">
  <a href="#" class="nav-item">Item 1</a>
  <a href="#" class="nav-item">Item 2</a>
  <a href="#" class="nav-item">Item 3</a>
</nav>
```

## Accessibility Patterns

### Focus Trap
```javascript
// Trap focus within modal
const modal = document.querySelector('.modal');
trapFocus(modal);
```

### Announcements
```javascript
// Announce to screen readers
announce('Form submitted successfully', 'polite');
```

### Contrast Checking
```javascript
// Check color contrast
const ratio = getContrastRatio('#ffffff', '#000000');
const passes = meetsWCAG(ratio, 'AA'); // true
```

## Testing Utilities

- Automated accessibility audits
- Keyboard navigation testing
- Screen reader compatibility checks
- Color contrast validation
- ARIA attribute validation

## License

MIT License