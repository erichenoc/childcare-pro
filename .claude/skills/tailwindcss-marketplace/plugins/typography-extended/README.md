# Typography Extended Plugin for Tailwind CSS

Advanced typography utilities with fluid scaling, custom fonts, and text effects.

## Features

- **Type Scales**: Minor third, major third, perfect fourth, golden ratio
- **Fluid Typography**: Responsive text sizing with clamp()
- **Text Effects**: Gradient, outline, shadow, glitch, neon effects
- **Font Loading**: Optimized web font loading strategies
- **Variable Fonts**: Full variable font support
- **Text Balancing**: Improved text wrapping and orphan control

## Installation

```bash
npm install @skillstash/tailwind-typography-extended
```

## Basic Usage

### Fluid Typography
```html
<h1 class="text-fluid-xl">Responsive heading</h1>
<p class="text-fluid-base">Body text that scales smoothly</p>
```

### Type Scale
```html
<h1 class="text-scale-6">Largest heading</h1>
<h2 class="text-scale-5">Large heading</h2>
<h3 class="text-scale-4">Medium heading</h3>
<p class="text-scale-base">Body text</p>
<small class="text-scale-sm">Small text</small>
```

### Text Effects
```html
<h1 class="text-gradient">Gradient Text</h1>
<h2 class="text-outline">Outlined Text</h2>
<h3 class="text-shadow-lg">Text with Shadow</h3>
<p class="text-glitch">Glitch Effect</p>
<span class="text-neon">Neon Glow</span>
```

### Variable Fonts
```html
<p class="font-variable" style="--font-weight: 650; --font-width: 110;">
  Variable font with custom weight and width
</p>
```

## Advanced Features

- Mathematical type scales
- Fluid typography with CSS clamp()
- Custom font loading strategies
- Text balancing for better line breaks
- Optical sizing for variable fonts
- Performance-optimized web fonts

## License

MIT License