---
name: theme-switcher
description: Automatically manages theme switching with persistence and smooth transitions
autoLoads: true
triggers:
  - "dark.*mode"
  - "theme.*switch"
  - "color.*scheme"
---

# Theme Switcher Skill

Automatically implements theme switching with localStorage persistence, smooth transitions, and system preference detection.

## Auto-Loading Triggers

This skill activates when:
- Implementing dark mode
- Setting up theme switching
- Managing color schemes
- Building preference systems

## Capabilities

### Automatic Theme Detection
```javascript
// Detect and apply system preference
const getPreferredTheme = () => {
  const stored = localStorage.getItem('theme');
  if (stored) return stored;

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

// Apply theme on load
document.documentElement.classList.toggle('dark', getPreferredTheme() === 'dark');
```

### Smooth Theme Transitions
```css
/* Prevent flash during theme switch */
html {
  transition: background-color 0.3s ease, color 0.3s ease;
}

html.theme-transitioning * {
  transition: background-color 0.3s ease,
              color 0.3s ease,
              border-color 0.3s ease !important;
}
```

### Multi-Theme Support
Supports multiple color schemes beyond just light/dark:
- Default, Dimmed, Midnight, Sepia
- Custom brand themes
- High contrast modes
- Color-blind friendly themes

## Best Practices

1. **Persistence**: Always save user preference
2. **System Sync**: Respect OS preferences by default
3. **Smooth Transitions**: Prevent jarring color changes
4. **Accessibility**: Ensure contrast requirements are met
5. **Performance**: Use CSS variables for instant updates