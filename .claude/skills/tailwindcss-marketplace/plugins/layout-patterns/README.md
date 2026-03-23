# Layout Patterns Plugin for Tailwind CSS

Modern layout patterns including grids, flexbox, containers, and responsive design utilities.

## Features

- **7 Layout Patterns**: Holy grail, sidebar, masonry, dashboard, magazine, kanban, split-screen
- **Grid Systems**: 12-column, 16-column, auto-fit, auto-fill grids
- **Container Queries**: Component-based responsive design
- **Aspect Ratios**: Maintain consistent proportions
- **Sticky Positioning**: Smart sticky elements
- **Responsive Utilities**: Mobile-first responsive layouts

## Installation

```bash
npm install @skillstash/tailwind-layout-patterns
```

## Basic Usage

### Holy Grail Layout
```html
<div class="layout-holy-grail">
  <header class="layout-header">Header</header>
  <nav class="layout-sidebar-left">Left Sidebar</nav>
  <main class="layout-main">Main Content</main>
  <aside class="layout-sidebar-right">Right Sidebar</aside>
  <footer class="layout-footer">Footer</footer>
</div>
```

### Dashboard Layout
```html
<div class="layout-dashboard">
  <div class="dashboard-sidebar">Navigation</div>
  <div class="dashboard-content">
    <div class="dashboard-header">Header</div>
    <div class="dashboard-main">Content</div>
  </div>
</div>
```

### Responsive Grid
```html
<div class="grid-responsive">
  <div class="col-span-full md:col-span-6 lg:col-span-4">Item</div>
  <div class="col-span-full md:col-span-6 lg:col-span-4">Item</div>
  <div class="col-span-full md:col-span-12 lg:col-span-4">Item</div>
</div>
```

### Masonry Layout
```html
<div class="layout-masonry">
  <div class="masonry-item">Content</div>
  <div class="masonry-item masonry-item-large">Large content</div>
  <div class="masonry-item">Content</div>
</div>
```

## Advanced Features

- Container queries for component-level responsiveness
- Fluid grid systems with gap utilities
- Sticky positioning with smart boundaries
- Aspect ratio containers
- Print-optimized layouts

## License

MIT License