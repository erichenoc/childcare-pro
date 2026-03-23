---
name: bundle-analyzer
description: Automatically analyzes and optimizes CSS bundle size
autoLoads: true
triggers:
  - "optimize.*css"
  - "reduce.*bundle"
  - "performance.*audit"
  - "purge.*css"
---

# Bundle Analyzer Skill

Automatically analyzes CSS bundles and provides optimization recommendations to reduce file size and improve performance.

## Auto-Loading Triggers

This skill activates when:
- Optimizing CSS bundle size
- Running performance audits
- Setting up PurgeCSS
- Analyzing build output

## Capabilities

### Bundle Analysis
```javascript
class BundleAnalyzer {
  async analyze(cssFile) {
    const stats = {
      originalSize: getFileSize(cssFile),
      unusedSelectors: await findUnusedCSS(cssFile),
      duplicateRules: findDuplicates(cssFile),
      optimizationPotential: calculatePotential(cssFile)
    };

    return {
      report: generateReport(stats),
      recommendations: getRecommendations(stats),
      estimatedSavings: stats.optimizationPotential
    };
  }

  async findUnusedCSS(cssFile) {
    // Analyze HTML files to find unused selectors
    const used = await scanHTMLFiles();
    const defined = parseCSSSelectors(cssFile);
    return defined.filter(sel => !used.has(sel));
  }

  getRecommendations(stats) {
    const recommendations = [];

    if (stats.unusedSelectors.length > 100) {
      recommendations.push({
        priority: 'high',
        action: 'Enable PurgeCSS',
        impact: `Remove ${stats.unusedSelectors.length} unused selectors`
      });
    }

    if (stats.duplicateRules > 10) {
      recommendations.push({
        priority: 'medium',
        action: 'Consolidate duplicate rules',
        impact: `Reduce CSS by ${stats.duplicateRules * 0.1}kb`
      });
    }

    return recommendations;
  }
}
```

### PurgeCSS Configuration
Automatically configures PurgeCSS with safelist patterns:

```javascript
// Generated PurgeCSS config
module.exports = {
  content: ['./src/**/*.{html,js,jsx,ts,tsx}'],
  safelist: [
    'btn',
    /^btn-/,
    /^(bg|text|border)-(red|green|blue)-(100|200|300)/,
    'dark',
    /^dark:/
  ],
  blocklist: [
    'unused-class',
    /^legacy-/
  ]
};
```

### Critical CSS Extraction
Identifies and extracts critical above-the-fold CSS:

```javascript
async function extractCritical(url) {
  const critical = await penthouse({
    url,
    css: './dist/styles.css',
    viewport: {
      width: 1300,
      height: 900
    }
  });

  return {
    inline: critical,
    defer: nonCritical
  };
}
```

## Optimization Strategies

### Tree Shaking
- Remove unused utilities
- Eliminate dead code
- Prune unreferenced components

### Code Splitting
- Split by route
- Lazy load non-critical CSS
- Component-level splitting

### Compression
- Enable gzip/brotli
- Minify CSS output
- Remove comments and whitespace

## Performance Metrics

Tracks key performance indicators:
- Bundle size (raw and compressed)
- Load time impact
- Parse/compile time
- Runtime performance
- Memory usage

## Best Practices

1. **Regular Audits**: Run bundle analysis on every build
2. **Safelist Management**: Maintain accurate PurgeCSS safelist
3. **Critical CSS**: Extract and inline above-the-fold styles
4. **Monitoring**: Track bundle size over time
5. **Budget Enforcement**: Set and enforce performance budgets