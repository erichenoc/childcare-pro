# Performance Optimizer Plugin for Tailwind CSS

Performance optimization utilities including PurgeCSS configuration, JIT optimization, and critical CSS generation.

## Features

- **Tree Shaking**: Remove unused CSS automatically
- **Code Splitting**: Split CSS by route or component
- **Lazy Loading**: Load CSS on demand
- **Critical CSS**: Extract and inline critical styles
- **Minification**: Optimize CSS output size
- **Performance Monitoring**: Track metrics and improvements

## Installation

```bash
npm install @skillstash/tailwind-performance-optimizer
```

## Basic Usage

### PurgeCSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx,html}',
    './public/index.html'
  ],
  plugins: [
    require('@skillstash/tailwind-performance-optimizer')({
      purge: {
        enabled: true,
        safelist: ['btn', /^btn-/]
      }
    })
  ]
};
```

### Critical CSS Extraction
```javascript
// Extract critical CSS
const critical = await extractCritical({
  html: htmlContent,
  css: cssContent,
  viewport: { width: 1920, height: 1080 }
});

// Inline in HTML
const optimizedHTML = inlineCritical(html, critical.css);
```

### Code Splitting
```javascript
// Split CSS by route
const routes = {
  home: ['home.css'],
  dashboard: ['dashboard.css'],
  profile: ['profile.css']
};

// Load CSS dynamically
loadCSS('/css/dashboard.css');
```

### Bundle Analysis
```bash
# Analyze bundle size
npx tailwind-analyze

# Output:
# Total CSS: 42.3kb
# After PurgeCSS: 8.7kb
# Compression: gzip 2.1kb
# Unused: 79.4% removed
```

## Performance Metrics

### Monitoring
```javascript
// Track performance metrics
const metrics = {
  bundleSize: measureBundleSize(),
  loadTime: measureLoadTime(),
  fps: measureFPS(),
  cls: measureCLS(),
  lcp: measureLCP()
};
```

### Optimization Suggestions
- Remove unused utilities
- Enable JIT mode
- Use dynamic imports
- Implement critical CSS
- Optimize font loading

## Advanced Features

- Automatic unused CSS detection
- Smart code splitting strategies
- Critical CSS generation
- Performance budget enforcement
- CDN optimization
- Compression strategies

## License

MIT License