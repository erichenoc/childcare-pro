---
name: button-a11y
description: Ensures button components meet WCAG accessibility standards
autoLoads: true
triggers:
  - "accessible.*button"
  - "aria.*button"
  - "screen.*reader"
  - "keyboard.*navigation"
---

# Button Accessibility Skill

Automatically enhances button components with comprehensive accessibility features, ensuring WCAG 2.1 AA compliance and optimal user experience for all users.

## Auto-Loading Triggers

This skill automatically activates when:
- Creating buttons for accessibility-focused applications
- Implementing keyboard navigation
- Building screen reader compatible interfaces
- Ensuring WCAG compliance

## Accessibility Features

### ARIA Attributes
Automatically adds appropriate ARIA attributes:

```html
<!-- Icon-only button -->
<button
  class="btn btn-primary btn-icon"
  aria-label="Save document"
  aria-describedby="save-tooltip"
>
  <svg aria-hidden="true" class="w-5 h-5">
    <!-- Save icon -->
  </svg>
</button>
<span id="save-tooltip" class="sr-only">
  Save the current document to your account
</span>

<!-- Toggle button -->
<button
  class="btn btn-outline"
  aria-pressed="false"
  aria-label="Toggle dark mode"
>
  <span aria-hidden="true">🌙</span>
  <span class="sr-only">Toggle dark mode</span>
</button>

<!-- Loading button -->
<button
  class="btn btn-primary btn-loading"
  aria-busy="true"
  aria-live="polite"
  aria-disabled="true"
>
  <span class="btn-spinner" aria-hidden="true"></span>
  <span>Processing your request...</span>
</button>
```

### Keyboard Navigation
Implements proper keyboard interaction patterns:

```javascript
// Button group with arrow key navigation
class ButtonGroup {
  constructor(element) {
    this.buttons = element.querySelectorAll('.btn');
    this.currentIndex = 0;

    element.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.updateTabIndex();
  }

  handleKeyDown(event) {
    switch(event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        this.focusNext();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        this.focusPrevious();
        break;
      case 'Home':
        event.preventDefault();
        this.focusFirst();
        break;
      case 'End':
        event.preventDefault();
        this.focusLast();
        break;
    }
  }

  focusNext() {
    this.currentIndex = (this.currentIndex + 1) % this.buttons.length;
    this.updateFocus();
  }

  focusPrevious() {
    this.currentIndex = (this.currentIndex - 1 + this.buttons.length) % this.buttons.length;
    this.updateFocus();
  }

  updateFocus() {
    this.updateTabIndex();
    this.buttons[this.currentIndex].focus();
  }

  updateTabIndex() {
    this.buttons.forEach((button, index) => {
      button.tabIndex = index === this.currentIndex ? 0 : -1;
    });
  }
}
```

### Focus Management
Enhanced focus indicators and management:

```css
/* Visible focus indicator */
.btn:focus-visible {
  @apply outline-none ring-2 ring-offset-2 ring-blue-500;
}

/* Dark mode focus */
.dark .btn:focus-visible {
  @apply ring-offset-gray-900;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .btn:focus-visible {
    @apply ring-4 ring-offset-4;
    outline: 3px solid currentColor !important;
    outline-offset: 3px !important;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .btn {
    @apply transition-none;
  }

  .btn-spinner {
    animation: none !important;
    opacity: 0.8;
  }
}
```

### Screen Reader Support
Optimized for screen reader announcements:

```html
<!-- Button with changing state -->
<button
  class="btn btn-primary"
  aria-live="polite"
  aria-atomic="true"
>
  <span class="btn-text">Save</span>
  <span class="sr-only" role="status">
    <!-- Updated dynamically -->
  </span>
</button>

<script>
function updateButtonState(button, state) {
  const statusElement = button.querySelector('[role="status"]');

  switch(state) {
    case 'saving':
      button.setAttribute('aria-busy', 'true');
      statusElement.textContent = 'Saving your changes...';
      break;
    case 'saved':
      button.removeAttribute('aria-busy');
      statusElement.textContent = 'Changes saved successfully';
      break;
    case 'error':
      button.removeAttribute('aria-busy');
      statusElement.textContent = 'Failed to save. Please try again.';
      break;
  }
}
</script>
```

### Color Contrast Compliance
Ensures WCAG AA/AAA color contrast ratios:

```css
/* AA compliant color combinations */
.btn-primary {
  @apply bg-blue-600 text-white; /* 4.5:1 contrast ratio */
}

.btn-warning {
  @apply bg-yellow-500 text-gray-900; /* 7:1 contrast ratio */
}

.btn-outline {
  @apply border-gray-700 text-gray-700; /* 4.5:1 contrast ratio */
}

/* AAA compliant high contrast theme */
.high-contrast .btn-primary {
  @apply bg-black text-white; /* 21:1 contrast ratio */
}

.high-contrast .btn-outline {
  @apply border-black text-black bg-white; /* 21:1 contrast ratio */
}
```

### Touch Target Sizing
Ensures adequate touch target sizes:

```css
/* Minimum 44x44px touch targets */
.btn {
  @apply min-h-[44px] min-w-[44px];
  @apply px-4 py-2;
}

/* Icon buttons with adequate touch targets */
.btn-icon {
  @apply w-11 h-11;
  @apply flex items-center justify-center;
}

/* Mobile-optimized spacing */
@media (max-width: 640px) {
  .btn {
    @apply min-h-[48px];
  }

  .btn-group > .btn {
    @apply min-w-[48px];
  }
}
```

### Disabled State Handling
Proper disabled state implementation:

```html
<!-- Disabled button with explanation -->
<div class="relative">
  <button
    class="btn btn-primary"
    disabled
    aria-disabled="true"
    aria-describedby="disabled-reason"
  >
    Submit Form
  </button>
  <span id="disabled-reason" class="sr-only">
    Please complete all required fields before submitting
  </span>
</div>

<!-- Alternative: Using aria-disabled for better UX -->
<button
  class="btn btn-primary opacity-50"
  aria-disabled="true"
  onclick="event.preventDefault(); showTooltip('Complete required fields');"
>
  Submit Form
</button>
```

## Testing Tools Integration

### Automated Testing
```javascript
// Jest/Testing Library test
describe('Button Accessibility', () => {
  test('has proper ARIA attributes', () => {
    const { getByRole } = render(
      <Button icon={<SaveIcon />} aria-label="Save document">
        Save
      </Button>
    );

    const button = getByRole('button', { name: /save document/i });
    expect(button).toHaveAttribute('aria-label', 'Save document');
  });

  test('keyboard navigation works', () => {
    const { getAllByRole } = render(<ButtonGroup />);
    const buttons = getAllByRole('button');

    buttons[0].focus();
    fireEvent.keyDown(buttons[0], { key: 'ArrowRight' });

    expect(document.activeElement).toBe(buttons[1]);
  });
});
```

### Manual Testing Checklist
```markdown
## Button Accessibility Checklist

### Keyboard Navigation
- [ ] All buttons reachable via Tab key
- [ ] Arrow keys work in button groups
- [ ] Enter/Space activate buttons
- [ ] Escape key closes dropdowns

### Screen Reader
- [ ] Button purpose announced clearly
- [ ] State changes announced
- [ ] Icon-only buttons have labels
- [ ] Loading states communicated

### Visual
- [ ] Focus indicator visible
- [ ] Color contrast ≥ 4.5:1
- [ ] Touch targets ≥ 44x44px
- [ ] States distinguishable without color

### Motion
- [ ] Animations respect prefers-reduced-motion
- [ ] No seizure-inducing effects
- [ ] Smooth transitions available
```

## Browser Support

Ensures compatibility with assistive technologies:

```javascript
// Feature detection and polyfills
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector;
}

// Focus-visible polyfill for older browsers
if (!('focusVisible' in document)) {
  import('focus-visible');
}

// ARIA live region support check
function supportsAriaLive() {
  const testElement = document.createElement('div');
  testElement.setAttribute('aria-live', 'polite');
  return testElement.getAttribute('aria-live') === 'polite';
}
```

## Best Practices

1. **Progressive Enhancement**: Ensure buttons work without JavaScript
2. **Semantic HTML**: Use native button elements when possible
3. **Clear Labels**: Provide descriptive, action-oriented labels
4. **State Communication**: Announce all state changes to screen readers
5. **Error Prevention**: Provide clear feedback and confirmation for destructive actions