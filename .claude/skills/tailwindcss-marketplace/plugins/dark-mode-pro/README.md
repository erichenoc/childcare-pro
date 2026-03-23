# Dark Mode Pro Plugin for Tailwind CSS

Enhanced dark mode implementation with theme switching, persistence, and advanced color management.

## Features

- **Multiple Themes**: Light, dark, dimmed, sepia, and custom themes
- **Auto Detection**: Syncs with system preferences
- **Smooth Transitions**: Seamless theme switching animations
- **Persistence**: Saves user preferences across sessions
- **Contrast Modes**: High contrast and color-blind friendly options
- **CSS Variables**: Runtime theme customization

## Installation

```bash
npm install @skillstash/tailwind-dark-mode-pro
```

## Basic Usage

### Setup Theme Switcher
```javascript
// Auto-detect and apply theme
const theme = localStorage.getItem('theme') ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

document.documentElement.className = theme;
```

### Theme Toggle Button
```html
<button onclick="toggleTheme()" class="theme-toggle">
  <span class="dark:hidden">🌙</span>
  <span class="hidden dark:block">☀️</span>
</button>
```

### Custom Color Schemes
```css
:root {
  --color-primary: theme('colors.blue.600');
  --color-background: theme('colors.white');
}

.dark {
  --color-primary: theme('colors.blue.400');
  --color-background: theme('colors.gray.900');
}
```

## Advanced Features

- Multiple theme support (light, dark, dimmed, sepia)
- Smooth transitions between themes
- System preference synchronization
- Custom theme creation
- Contrast accessibility modes

## License

MIT License