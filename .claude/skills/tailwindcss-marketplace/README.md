# Tailwind CSS Plugin Marketplace

A comprehensive collection of production-ready Tailwind CSS plugins for modern web development.

## 📦 Available Plugins

### 🎨 Component Plugins

#### [Button Components](./plugins/button-components/)
Comprehensive button system with variants, sizes, states, and accessibility features.
- 8 button variants
- 5 size options
- Dark mode support
- Accessibility compliant

#### [Form Controls](./plugins/form-controls/)
Advanced form controls with validation states and custom styling.
- 9 control types
- Validation states
- Floating labels
- Input groups

#### [Card Systems](./plugins/card-systems/)
Flexible card components with layouts, shadows, and interactions.
- 8 card types
- 4 layout styles
- Flip and expandable cards
- Responsive grids

### 🎭 Theme & Styling

#### [Dark Mode Pro](./plugins/dark-mode-pro/)
Enhanced dark mode implementation with theme switching and persistence.
- Multiple themes (light, dark, dimmed, sepia)
- Auto-detection
- Smooth transitions
- LocalStorage persistence

#### [Typography Extended](./plugins/typography-extended/)
Advanced typography utilities with fluid scaling and text effects.
- Fluid typography
- Type scales
- Text effects
- Variable fonts

### 🎬 Animation & Effects

#### [Animation Suite](./plugins/animation-suite/)
Rich animation utilities with keyframes, transitions, and effects.
- 8 core animations
- Scroll animations
- Stagger effects
- Particle effects

### 📐 Layout & Structure

#### [Layout Patterns](./plugins/layout-patterns/)
Modern layout patterns including grids, flexbox, and containers.
- 7 layout patterns
- Grid systems
- Container queries
- Responsive utilities

### 🏗️ System & Architecture

#### [Design System Builder](./plugins/design-system-builder/)
Complete design system foundation with tokens and patterns.
- Design tokens
- Component library
- Brand guidelines
- Token sync with design tools

### ♿ Accessibility

#### [Accessibility Utilities](./plugins/accessibility-utilities/)
WCAG-compliant utilities for screen readers and keyboard navigation.
- Screen reader utilities
- Focus management
- ARIA patterns
- Testing tools

### ⚡ Performance

#### [Performance Optimizer](./plugins/performance-optimizer/)
Performance optimization utilities including PurgeCSS and critical CSS.
- Tree shaking
- Code splitting
- Critical CSS
- Bundle analysis

## 🚀 Quick Start

### Installation

Install individual plugins:

```bash
npm install @skillstash/tailwind-button-components
npm install @skillstash/tailwind-form-controls
npm install @skillstash/tailwind-dark-mode-pro
```

Or install the entire collection:

```bash
npm install @skillstash/tailwindcss-plugins
```

### Configuration

Add plugins to your `tailwind.config.js`:

```javascript
module.exports = {
  plugins: [
    require('@skillstash/tailwind-button-components'),
    require('@skillstash/tailwind-form-controls'),
    require('@skillstash/tailwind-dark-mode-pro'),
    // Add more plugins as needed
  ]
}
```

## 📚 Documentation

Each plugin includes:

- **README.md** - Comprehensive documentation
- **CHANGELOG.md** - Version history
- **Commands** - CLI commands for code generation
- **Skills** - Auto-loading development aids
- **Agents** - AI-powered design assistance
- **Examples** - Working HTML/CSS examples

## 🎯 Features

### For Every Plugin

- ✅ **Production Ready** - Battle-tested in real projects
- ✅ **Dark Mode Support** - Full dark mode compatibility
- ✅ **Responsive Design** - Mobile-first approach
- ✅ **Accessibility** - WCAG 2.1 AA compliant
- ✅ **Performance** - Optimized for production
- ✅ **Documentation** - Comprehensive guides and examples
- ✅ **TypeScript** - Full TypeScript support
- ✅ **Framework Support** - React, Vue, Angular compatible

### Claude Code Integration

Each plugin includes special integrations for Claude Code:

- **Slash Commands** - Quick code generation commands
- **Auto-loading Skills** - Context-aware development assistance
- **AI Agents** - Specialized design and optimization agents

## 🛠️ Development

### Plugin Structure

```
plugin-name/
├── plugin.json           # Plugin metadata
├── README.md            # Documentation
├── CHANGELOG.md         # Version history
├── .claude/
│   ├── commands/        # Slash commands
│   ├── skills/          # Auto-loading skills
│   └── agents/          # AI agents
└── examples/            # Usage examples
```

### Creating Custom Plugins

Use our plugin template:

```bash
npx create-tailwind-plugin my-plugin
```

## 📈 Performance

All plugins are optimized for:

- **Small Bundle Size** - Tree-shakeable and PurgeCSS compatible
- **Fast Build Times** - JIT mode support
- **Runtime Performance** - GPU-accelerated animations
- **Lazy Loading** - Dynamic imports for large components

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see individual plugin LICENSE files for details.

## 🔗 Links

- [Documentation](https://skillstash.dev/docs/tailwind)
- [Examples](https://skillstash.dev/examples/tailwind)
- [GitHub](https://github.com/skillstash/tailwindcss-plugins)
- [npm](https://www.npmjs.com/org/skillstash)

## 💬 Support

- [Discord Community](https://discord.gg/skillstash)
- [GitHub Issues](https://github.com/skillstash/tailwindcss-plugins/issues)
- [Email Support](mailto:support@skillstash.dev)

---

Made with ❤️ by the SkillStash Team