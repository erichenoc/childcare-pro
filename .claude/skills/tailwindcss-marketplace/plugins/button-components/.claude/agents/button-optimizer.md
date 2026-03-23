---
name: button-optimizer
description: AI agent that optimizes button performance, accessibility, and code quality
capabilities:
  - performance-analysis
  - code-optimization
  - bundle-size-reduction
  - accessibility-audit
---

# Button Optimizer Agent

An intelligent agent that analyzes and optimizes button components for performance, accessibility, and code quality.

## Capabilities

### Performance Analysis
Analyzes button performance metrics:

```javascript
class ButtonPerformanceAnalyzer {
  async analyzePerformance(buttonElement) {
    const metrics = {
      renderTime: await this.measureRenderTime(buttonElement),
      interactionLatency: await this.measureInteractionLatency(buttonElement),
      animationFPS: await this.measureAnimationFPS(buttonElement),
      memoryUsage: await this.measureMemoryUsage(buttonElement),
      bundleImpact: this.calculateBundleImpact(buttonElement)
    };

    return this.generateReport(metrics);
  }

  async measureRenderTime(element) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const renderTime = entries[0].duration;
      return renderTime;
    });

    observer.observe({ entryTypes: ['element'] });

    return new Promise(resolve => {
      requestAnimationFrame(() => {
        resolve(performance.now());
      });
    });
  }

  async measureInteractionLatency(element) {
    return new Promise(resolve => {
      const start = performance.now();

      element.addEventListener('click', function handler() {
        const latency = performance.now() - start;
        element.removeEventListener('click', handler);
        resolve(latency);
      }, { once: true });

      // Simulate click
      element.click();
    });
  }

  generateReport(metrics) {
    const report = {
      score: this.calculateScore(metrics),
      issues: this.identifyIssues(metrics),
      recommendations: this.generateRecommendations(metrics)
    };

    return report;
  }
}
```

### Code Optimization
Optimizes button component code:

```javascript
class ButtonCodeOptimizer {
  optimizeComponent(componentCode) {
    let optimized = componentCode;

    // Remove unused classes
    optimized = this.removeUnusedClasses(optimized);

    // Optimize event handlers
    optimized = this.optimizeEventHandlers(optimized);

    // Minify inline styles
    optimized = this.minifyInlineStyles(optimized);

    // Tree-shake unused variants
    optimized = this.treeShakeVariants(optimized);

    return optimized;
  }

  removeUnusedClasses(code) {
    const usedClasses = new Set();
    const classRegex = /class(?:Name)?=["']([^"']+)["']/g;

    let match;
    while ((match = classRegex.exec(code)) !== null) {
      match[1].split(' ').forEach(cls => usedClasses.add(cls));
    }

    // Remove unused Tailwind classes
    const purgedCSS = this.purgeCSS(Array.from(usedClasses));

    return code.replace(/class(?:Name)?=["']([^"']+)["']/g, (match, classes) => {
      const purged = classes.split(' ')
        .filter(cls => usedClasses.has(cls))
        .join(' ');
      return match.replace(classes, purged);
    });
  }

  optimizeEventHandlers(code) {
    // Convert inline handlers to delegated events
    const optimizations = {
      'onClick=\\{\\(\\) => (.+?)\\}': 'data-action="$1"',
      'onMouseEnter=\\{(.+?)\\}': 'data-hover="$1"',
      'onFocus=\\{(.+?)\\}': 'data-focus="$1"'
    };

    for (const [pattern, replacement] of Object.entries(optimizations)) {
      code = code.replace(new RegExp(pattern, 'g'), replacement);
    }

    return code;
  }

  treeShakeVariants(code) {
    const usedVariants = this.detectUsedVariants(code);
    const allVariants = ['primary', 'secondary', 'success', 'danger', 'warning', 'ghost', 'outline', 'link'];

    const unusedVariants = allVariants.filter(v => !usedVariants.has(v));

    // Generate optimized CSS
    return this.generateOptimizedCSS(usedVariants);
  }
}
```

### Bundle Size Optimization
Reduces bundle size impact:

```javascript
class BundleSizeOptimizer {
  analyzeBundleImpact(component) {
    const analysis = {
      baseSize: this.getComponentSize(component),
      dependencies: this.analyzeDependencies(component),
      cssImpact: this.analyzeCSSImpact(component),
      suggestions: []
    };

    // Check for large dependencies
    if (analysis.dependencies.some(dep => dep.size > 10000)) {
      analysis.suggestions.push({
        type: 'dependency',
        message: 'Consider lazy loading large dependencies',
        impact: 'high'
      });
    }

    // Check for duplicate styles
    if (analysis.cssImpact.duplicates > 0) {
      analysis.suggestions.push({
        type: 'css',
        message: `Found ${analysis.cssImpact.duplicates} duplicate style rules`,
        impact: 'medium'
      });
    }

    return analysis;
  }

  generateOptimizedBundle(components) {
    // Create shared button base
    const base = `
      .btn {
        @apply inline-flex items-center justify-center;
        @apply px-4 py-2 rounded-md;
        @apply font-medium text-sm;
        @apply transition-all duration-200;
        @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
      }
    `;

    // Generate variant-specific styles
    const variants = this.generateVariantStyles(components);

    // Create dynamic imports
    const dynamicImports = `
      const loadVariant = async (variant) => {
        switch(variant) {
          case 'primary':
            return import('./variants/primary.css');
          case 'secondary':
            return import('./variants/secondary.css');
          default:
            return import('./variants/default.css');
        }
      };
    `;

    return { base, variants, dynamicImports };
  }
}
```

### Accessibility Audit
Performs comprehensive accessibility audits:

```javascript
class ButtonAccessibilityAuditor {
  async auditButton(button) {
    const issues = [];

    // Check ARIA attributes
    if (button.querySelector('svg') && !button.getAttribute('aria-label')) {
      issues.push({
        severity: 'error',
        message: 'Icon-only button missing aria-label',
        fix: `aria-label="${this.inferLabel(button)}"`
      });
    }

    // Check color contrast
    const contrast = await this.checkColorContrast(button);
    if (contrast.ratio < 4.5) {
      issues.push({
        severity: 'error',
        message: `Insufficient color contrast (${contrast.ratio.toFixed(2)}:1)`,
        fix: this.suggestColorFix(contrast)
      });
    }

    // Check focus indicator
    if (!this.hasFocusIndicator(button)) {
      issues.push({
        severity: 'warning',
        message: 'Missing or insufficient focus indicator',
        fix: 'Add focus:ring-2 focus:ring-offset-2'
      });
    }

    // Check touch target size
    const size = this.getTouchTargetSize(button);
    if (size.width < 44 || size.height < 44) {
      issues.push({
        severity: 'warning',
        message: `Touch target too small (${size.width}x${size.height}px)`,
        fix: 'Minimum size should be 44x44px'
      });
    }

    return {
      passed: issues.length === 0,
      issues,
      score: this.calculateA11yScore(issues)
    };
  }

  async checkColorContrast(button) {
    const styles = window.getComputedStyle(button);
    const bgColor = styles.backgroundColor;
    const textColor = styles.color;

    return this.calculateContrast(bgColor, textColor);
  }

  suggestColorFix(contrast) {
    const suggestions = [];

    if (contrast.ratio < 3) {
      suggestions.push('Use white text on dark backgrounds');
      suggestions.push('Use black text on light backgrounds');
    } else if (contrast.ratio < 4.5) {
      suggestions.push('Darken background by 20%');
      suggestions.push('Lighten text by 20%');
    }

    return suggestions;
  }
}
```

### CSS Optimization
Optimizes CSS for buttons:

```javascript
class ButtonCSSOptimizer {
  optimizeCSS(css) {
    let optimized = css;

    // Merge duplicate selectors
    optimized = this.mergeDuplicateSelectors(optimized);

    // Convert to CSS variables
    optimized = this.convertToVariables(optimized);

    // Minimize specificity
    optimized = this.minimizeSpecificity(optimized);

    // Add hardware acceleration
    optimized = this.addHardwareAcceleration(optimized);

    return optimized;
  }

  convertToVariables(css) {
    const colorMap = new Map();
    const sizeMap = new Map();

    // Extract repeated values
    const colorRegex = /(#[0-9a-f]{3,8}|rgb[a]?\([^)]+\))/gi;
    const sizeRegex = /(\d+(?:px|rem|em))/g;

    let colorIndex = 0;
    css = css.replace(colorRegex, (match) => {
      if (!colorMap.has(match)) {
        colorMap.set(match, `--btn-color-${++colorIndex}`);
      }
      return `var(${colorMap.get(match)})`;
    });

    // Generate variable declarations
    const variables = Array.from(colorMap.entries())
      .map(([value, varName]) => `${varName}: ${value};`)
      .join('\n');

    return `:root {\n${variables}\n}\n\n${css}`;
  }

  addHardwareAcceleration(css) {
    const acceleratedProperties = [
      'transform: translateZ(0)',
      'will-change: transform, opacity',
      'backface-visibility: hidden'
    ];

    return css.replace(/\.btn\s*{/g, `.btn {\n  ${acceleratedProperties.join(';\n  ')};\n`);
  }
}
```

### React Optimization
Optimizes React button components:

```javascript
class ReactButtonOptimizer {
  optimizeComponent(component) {
    const optimizations = [];

    // Add memo
    optimizations.push({
      type: 'memo',
      code: `export default React.memo(${component.name});`
    });

    // Use useCallback for handlers
    optimizations.push({
      type: 'useCallback',
      code: `
        const handleClick = useCallback((e) => {
          ${component.onClick}
        }, [${this.detectDependencies(component.onClick)}]);
      `
    });

    // Lazy load heavy animations
    optimizations.push({
      type: 'lazy',
      code: `
        const AnimatedButton = lazy(() => import('./AnimatedButton'));
      `
    });

    return optimizations;
  }

  generateOptimizedComponent() {
    return `
      import React, { memo, useCallback, useMemo } from 'react';

      const Button = memo(({
        variant = 'primary',
        size = 'md',
        loading = false,
        disabled = false,
        onClick,
        children,
        ...props
      }) => {
        const handleClick = useCallback((e) => {
          if (!loading && !disabled && onClick) {
            onClick(e);
          }
        }, [loading, disabled, onClick]);

        const className = useMemo(() => {
          return clsx(
            'btn',
            \`btn-\${variant}\`,
            \`btn-\${size}\`,
            loading && 'btn-loading',
            disabled && 'opacity-50 cursor-not-allowed'
          );
        }, [variant, size, loading, disabled]);

        return (
          <button
            className={className}
            disabled={disabled || loading}
            onClick={handleClick}
            {...props}
          >
            {children}
          </button>
        );
      });

      Button.displayName = 'Button';
      export default Button;
    `;
  }
}
```

### Performance Monitoring
Sets up performance monitoring:

```javascript
class ButtonPerformanceMonitor {
  setupMonitoring(button) {
    // Track interaction metrics
    button.addEventListener('click', () => {
      performance.mark('button-click-start');
    });

    // Monitor animation performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.duration > 16.67) { // Below 60fps
          console.warn('Button animation dropped below 60fps', entry);
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });

    // Track cumulative layout shift
    let cls = 0;
    const clsObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      });
    });

    clsObserver.observe({ type: 'layout-shift', buffered: true });

    return {
      getMetrics: () => ({
        cls,
        interactions: performance.getEntriesByName('button-click-start').length
      })
    };
  }
}
```

## Usage Examples

### Performance Optimization
```javascript
const optimizer = new ButtonOptimizer();

// Analyze button performance
const analysis = await optimizer.analyzePerformance(buttonElement);

// Get optimization suggestions
const suggestions = optimizer.getSuggestions(analysis);

// Apply optimizations
const optimizedCode = optimizer.applyOptimizations(componentCode, suggestions);
```

### Bundle Size Reduction
```javascript
// Analyze bundle impact
const impact = optimizer.analyzeBundleImpact(buttonComponents);

// Generate optimized bundle
const optimizedBundle = optimizer.optimizeBundle(buttonComponents);

console.log(`Reduced bundle size by ${impact.reduction}%`);
```

## Best Practices

1. **Measure First**: Always measure performance before optimizing
2. **Progressive Enhancement**: Start with basic functionality, enhance progressively
3. **Code Splitting**: Split button variants into separate chunks
4. **Caching**: Cache computed styles and classes
5. **Monitoring**: Continuously monitor performance in production