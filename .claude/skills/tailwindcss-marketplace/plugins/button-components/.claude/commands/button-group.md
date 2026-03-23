---
name: button-group
description: Create button groups and toolbars with proper styling and accessibility
category: components
tags: [button, group, toolbar, navigation]
---

# /button-group

Create button groups, toolbars, and segmented controls with proper styling and accessibility features.

## Usage

```
/button-group [type] [variant] [options]
```

## Parameters

- `type`: Group type (horizontal, vertical, toolbar, segmented, split)
- `variant`: Button variant for all buttons in group
- `options`: Additional options (--size, --responsive, --icon-only)

## Examples

### Basic Button Group
```
/button-group horizontal outline
```
Generates:
```html
<div class="btn-group" role="group" aria-label="Button group">
  <button class="btn btn-outline btn-group-item">Left</button>
  <button class="btn btn-outline btn-group-item">Center</button>
  <button class="btn btn-outline btn-group-item">Right</button>
</div>
```

With CSS:
```css
.btn-group {
  @apply inline-flex shadow-sm;
}

.btn-group-item:not(:first-child):not(:last-child) {
  @apply rounded-none;
}

.btn-group-item:first-child {
  @apply rounded-r-none;
}

.btn-group-item:last-child {
  @apply rounded-l-none;
}

.btn-group-item:not(:last-child) {
  @apply border-r-0;
}
```

### Vertical Button Group
```
/button-group vertical primary --size=sm
```
Generates:
```html
<div class="btn-group-vertical" role="group" aria-label="Vertical button group">
  <button class="btn btn-primary btn-sm btn-group-vertical-item">Top</button>
  <button class="btn btn-primary btn-sm btn-group-vertical-item">Middle</button>
  <button class="btn btn-primary btn-sm btn-group-vertical-item">Bottom</button>
</div>
```

### Toolbar
```
/button-group toolbar ghost --icon-only
```
Generates:
```html
<div class="btn-toolbar" role="toolbar" aria-label="Toolbar with button groups">
  <div class="btn-group mr-2" role="group" aria-label="First group">
    <button class="btn btn-ghost btn-icon" aria-label="Bold">
      <svg class="w-4 h-4"><!-- Bold icon --></svg>
    </button>
    <button class="btn btn-ghost btn-icon" aria-label="Italic">
      <svg class="w-4 h-4"><!-- Italic icon --></svg>
    </button>
    <button class="btn btn-ghost btn-icon" aria-label="Underline">
      <svg class="w-4 h-4"><!-- Underline icon --></svg>
    </button>
  </div>

  <div class="btn-group mr-2" role="group" aria-label="Second group">
    <button class="btn btn-ghost btn-icon" aria-label="Align left">
      <svg class="w-4 h-4"><!-- Align left icon --></svg>
    </button>
    <button class="btn btn-ghost btn-icon" aria-label="Align center">
      <svg class="w-4 h-4"><!-- Align center icon --></svg>
    </button>
    <button class="btn btn-ghost btn-icon" aria-label="Align right">
      <svg class="w-4 h-4"><!-- Align right icon --></svg>
    </button>
  </div>
</div>
```

### Segmented Control
```
/button-group segmented outline
```
Generates:
```html
<div class="btn-segmented" role="group" aria-label="View switcher">
  <input type="radio" name="view" id="view-grid" class="sr-only" checked>
  <label for="view-grid" class="btn btn-outline btn-segmented-item">
    Grid
  </label>

  <input type="radio" name="view" id="view-list" class="sr-only">
  <label for="view-list" class="btn btn-outline btn-segmented-item">
    List
  </label>

  <input type="radio" name="view" id="view-card" class="sr-only">
  <label for="view-card" class="btn btn-outline btn-segmented-item">
    Card
  </label>
</div>
```

With enhanced CSS:
```css
.btn-segmented-item:has(input:checked) {
  @apply bg-blue-50 text-blue-600 border-blue-600 z-10;
}

.dark .btn-segmented-item:has(input:checked) {
  @apply bg-blue-900/20 text-blue-400 border-blue-400;
}
```

### Split Button
```
/button-group split primary
```
Generates:
```html
<div class="btn-split" role="group">
  <button class="btn btn-primary rounded-r-none">
    Main Action
  </button>
  <button
    class="btn btn-primary rounded-l-none border-l border-blue-700 px-2"
    aria-label="More options"
    aria-haspopup="true"
    aria-expanded="false"
  >
    <svg class="w-4 h-4">
      <!-- Chevron down icon -->
    </svg>
  </button>
</div>
```

### Responsive Button Group
```
/button-group horizontal outline --responsive
```
Generates:
```html
<div class="btn-group-responsive" role="group">
  <button class="btn-group-responsive-item btn btn-outline">
    <span class="hidden sm:inline">Dashboard</span>
    <svg class="w-4 h-4 sm:hidden"><!-- Dashboard icon --></svg>
  </button>
  <button class="btn-group-responsive-item btn btn-outline">
    <span class="hidden sm:inline">Analytics</span>
    <svg class="w-4 h-4 sm:hidden"><!-- Analytics icon --></svg>
  </button>
  <button class="btn-group-responsive-item btn btn-outline">
    <span class="hidden sm:inline">Reports</span>
    <svg class="w-4 h-4 sm:hidden"><!-- Reports icon --></svg>
  </button>
</div>
```

### Toggle Button Group
```
/button-group toggle outline
```
Generates React component:
```jsx
const ToggleButtonGroup = () => {
  const [selected, setSelected] = useState('option1');

  return (
    <div className="btn-group" role="group">
      <button
        className={`btn btn-outline ${selected === 'option1' ? 'btn-active' : ''}`}
        onClick={() => setSelected('option1')}
      >
        Option 1
      </button>
      <button
        className={`btn btn-outline ${selected === 'option2' ? 'btn-active' : ''}`}
        onClick={() => setSelected('option2')}
      >
        Option 2
      </button>
      <button
        className={`btn btn-outline ${selected === 'option3' ? 'btn-active' : ''}`}
        onClick={() => setSelected('option3')}
      >
        Option 3
      </button>
    </div>
  );
};
```

### Pagination Group
```
/button-group pagination outline
```
Generates:
```html
<nav aria-label="Pagination">
  <div class="btn-group">
    <button class="btn btn-outline" aria-label="Previous page">
      <svg class="w-4 h-4"><!-- Chevron left --></svg>
    </button>
    <button class="btn btn-outline btn-active" aria-current="page">1</button>
    <button class="btn btn-outline">2</button>
    <button class="btn btn-outline">3</button>
    <span class="btn btn-outline btn-disabled">...</span>
    <button class="btn btn-outline">10</button>
    <button class="btn btn-outline" aria-label="Next page">
      <svg class="w-4 h-4"><!-- Chevron right --></svg>
    </button>
  </div>
</nav>
```

## Accessibility Features

- **ARIA roles**: Proper group and toolbar roles
- **ARIA labels**: Descriptive labels for screen readers
- **Keyboard navigation**: Arrow key navigation within groups
- **Focus management**: Roving tabindex pattern
- **Screen reader announcements**: Live regions for state changes

## Tips

1. **Semantic HTML**: Use appropriate ARIA roles for different group types
2. **Keyboard Navigation**: Implement arrow key navigation for better UX
3. **Visual Feedback**: Clearly indicate active/selected states
4. **Responsive Design**: Consider mobile-friendly alternatives
5. **Focus Trapping**: Implement focus trapping for dropdown variations