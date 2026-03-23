# Design System Builder Plugin for Tailwind CSS

Complete design system foundation with design tokens, patterns, and conventions.

## Features

- **Design Tokens**: Colors, spacing, typography, shadows, borders, effects
- **Component Library**: Atoms, molecules, organisms, templates
- **Documentation**: Auto-generated style guide
- **Version Control**: Token versioning and migration
- **Brand Guidelines**: Consistent brand application
- **Token Sync**: Figma, Sketch, Adobe XD integration

## Installation

```bash
npm install @skillstash/tailwind-design-system-builder
```

## Basic Usage

### Initialize Design System
```bash
npx design-system init
```

### Design Tokens
```javascript
// tokens.config.js
module.exports = {
  colors: {
    brand: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B'
    }
  },
  spacing: {
    unit: '8px',
    scale: [0.5, 1, 2, 3, 5, 8, 13, 21]
  },
  typography: {
    scale: 'major-third',
    base: '16px'
  }
};
```

### Component Patterns
```html
<!-- Atom -->
<button class="ds-button">Button</button>

<!-- Molecule -->
<div class="ds-card">
  <h3 class="ds-card-title">Card Title</h3>
  <p class="ds-card-body">Content</p>
</div>

<!-- Organism -->
<nav class="ds-navbar">
  <a class="ds-nav-brand">Brand</a>
  <ul class="ds-nav-menu">
    <li class="ds-nav-item">Item</li>
  </ul>
</nav>
```

### Token Usage
```css
.custom-component {
  color: var(--color-brand-primary);
  padding: var(--spacing-3);
  font-size: var(--text-lg);
  box-shadow: var(--shadow-md);
}
```

## Advanced Features

- Automatic token documentation
- Design-dev handoff tools
- Token migration utilities
- Multi-brand support
- Component versioning
- Visual regression testing

## License

MIT License