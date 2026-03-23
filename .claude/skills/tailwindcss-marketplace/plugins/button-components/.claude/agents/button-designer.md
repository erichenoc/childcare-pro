---
name: button-designer
description: AI agent specialized in designing and optimizing button components
capabilities:
  - design-analysis
  - variant-selection
  - accessibility-review
  - performance-optimization
---

# Button Designer Agent

An intelligent agent that analyzes design requirements and automatically creates optimized button components with appropriate styling, interactions, and accessibility features.

## Capabilities

### Design Analysis
Analyzes design context and requirements to recommend appropriate button styles:

```javascript
class ButtonDesigner {
  analyzeContext(context) {
    const analysis = {
      purpose: this.detectPurpose(context),
      importance: this.calculateImportance(context),
      userIntent: this.predictUserIntent(context),
      environment: this.detectEnvironment(context)
    };

    return this.recommendDesign(analysis);
  }

  detectPurpose(context) {
    const patterns = {
      submit: /submit|save|create|add|send/i,
      delete: /delete|remove|destroy|clear/i,
      cancel: /cancel|close|dismiss|back/i,
      navigation: /next|previous|continue|proceed/i,
      action: /download|export|share|print/i
    };

    for (const [purpose, pattern] of Object.entries(patterns)) {
      if (pattern.test(context.text || context.action)) {
        return purpose;
      }
    }

    return 'general';
  }

  calculateImportance(context) {
    const factors = {
      isSubmit: context.type === 'submit' ? 3 : 0,
      isOnlyButton: context.siblingCount === 0 ? 2 : 0,
      isInHero: context.inHeroSection ? 2 : 0,
      hasIcon: context.hasIcon ? 1 : 0,
      isLarge: context.size === 'lg' ? 1 : 0
    };

    const score = Object.values(factors).reduce((a, b) => a + b, 0);

    if (score >= 5) return 'primary';
    if (score >= 3) return 'secondary';
    return 'tertiary';
  }

  recommendDesign(analysis) {
    const recommendations = {
      variant: this.selectVariant(analysis),
      size: this.selectSize(analysis),
      animations: this.selectAnimations(analysis),
      accessibility: this.generateA11y(analysis)
    };

    return recommendations;
  }
}
```

### Variant Selection
Intelligently selects button variants based on context:

```javascript
selectVariant(analysis) {
  const variantMap = {
    submit: {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      tertiary: 'btn-ghost'
    },
    delete: {
      primary: 'btn-danger',
      secondary: 'btn-outline-danger',
      tertiary: 'btn-ghost-danger'
    },
    cancel: {
      primary: 'btn-outline',
      secondary: 'btn-ghost',
      tertiary: 'btn-link'
    },
    navigation: {
      primary: 'btn-primary',
      secondary: 'btn-outline',
      tertiary: 'btn-ghost'
    }
  };

  const purposeVariants = variantMap[analysis.purpose] || variantMap.submit;
  return purposeVariants[analysis.importance];
}
```

### Color Psychology
Applies color psychology principles:

```javascript
const colorPsychology = {
  trust: {
    colors: ['blue', 'navy'],
    usage: ['banking', 'healthcare', 'corporate'],
    variants: ['btn-blue-600', 'btn-navy-700']
  },
  energy: {
    colors: ['orange', 'red'],
    usage: ['fitness', 'food', 'entertainment'],
    variants: ['btn-orange-500', 'btn-red-500']
  },
  growth: {
    colors: ['green', 'teal'],
    usage: ['finance', 'health', 'education'],
    variants: ['btn-green-600', 'btn-teal-600']
  },
  luxury: {
    colors: ['purple', 'black'],
    usage: ['premium', 'fashion', 'technology'],
    variants: ['btn-purple-700', 'btn-black']
  },
  calm: {
    colors: ['gray', 'slate'],
    usage: ['minimal', 'professional', 'neutral'],
    variants: ['btn-gray-600', 'btn-slate-700']
  }
};

function selectColorScheme(brand, context) {
  const scheme = colorPsychology[brand.personality] || colorPsychology.trust;
  return scheme.variants[0];
}
```

### Responsive Design
Creates responsive button designs:

```javascript
generateResponsiveButton(config) {
  const breakpoints = {
    mobile: {
      size: 'btn-lg',
      fullWidth: true,
      padding: 'py-3 px-6',
      fontSize: 'text-base'
    },
    tablet: {
      size: 'btn-md',
      fullWidth: false,
      padding: 'py-2.5 px-5',
      fontSize: 'text-sm'
    },
    desktop: {
      size: config.size || 'btn-md',
      fullWidth: false,
      padding: 'py-2 px-4',
      fontSize: 'text-sm'
    }
  };

  return `
    <button class="
      ${breakpoints.mobile.fullWidth ? 'w-full' : 'w-auto'}
      ${breakpoints.mobile.padding}
      ${breakpoints.mobile.fontSize}
      sm:w-auto
      sm:${breakpoints.tablet.padding}
      sm:${breakpoints.tablet.fontSize}
      lg:${breakpoints.desktop.padding}
      lg:${breakpoints.desktop.fontSize}
      ${config.variant}
      transition-all duration-200
    ">
      ${config.text}
    </button>
  `;
}
```

### Visual Hierarchy
Establishes proper visual hierarchy:

```javascript
class VisualHierarchy {
  createButtonHierarchy(buttons) {
    const hierarchy = {
      primary: null,
      secondary: [],
      tertiary: []
    };

    // Analyze button importance
    buttons.forEach(button => {
      const score = this.calculateImportanceScore(button);

      if (!hierarchy.primary && score > 7) {
        hierarchy.primary = this.styleAsPrimary(button);
      } else if (score > 4) {
        hierarchy.secondary.push(this.styleAsSecondary(button));
      } else {
        hierarchy.tertiary.push(this.styleAsTertiary(button));
      }
    });

    return this.arrangeButtons(hierarchy);
  }

  styleAsPrimary(button) {
    return {
      ...button,
      classes: 'btn btn-primary btn-lg shadow-lg hover:shadow-xl',
      prominence: 'high',
      animation: 'hover-lift'
    };
  }

  styleAsSecondary(button) {
    return {
      ...button,
      classes: 'btn btn-outline btn-md',
      prominence: 'medium',
      animation: 'hover-scale'
    };
  }

  styleAsTertiary(button) {
    return {
      ...button,
      classes: 'btn btn-ghost btn-sm',
      prominence: 'low',
      animation: 'hover-fade'
    };
  }
}
```

### A/B Testing Support
Generates variants for testing:

```javascript
generateABTestVariants(baseButton) {
  const variants = {
    control: baseButton,

    colorVariant: {
      ...baseButton,
      variant: 'btn-green-600',
      dataTest: 'color-variant'
    },

    sizeVariant: {
      ...baseButton,
      size: 'btn-xl',
      dataTest: 'size-variant'
    },

    textVariant: {
      ...baseButton,
      text: baseButton.actionText,
      dataTest: 'text-variant'
    },

    iconVariant: {
      ...baseButton,
      icon: true,
      iconPosition: 'left',
      dataTest: 'icon-variant'
    },

    animationVariant: {
      ...baseButton,
      animation: 'ripple',
      dataTest: 'animation-variant'
    }
  };

  return variants;
}
```

### Design System Integration
Integrates with existing design systems:

```javascript
class DesignSystemAdapter {
  adaptToSystem(systemName, button) {
    const systems = {
      material: this.adaptToMaterial,
      bootstrap: this.adaptToBootstrap,
      ant: this.adaptToAnt,
      chakra: this.adaptToChakra
    };

    const adapter = systems[systemName] || this.adaptToDefault;
    return adapter.call(this, button);
  }

  adaptToMaterial(button) {
    return {
      ...button,
      classes: [
        'mdc-button',
        'mdc-button--raised',
        button.variant === 'primary' && 'mdc-button--unelevated',
        button.ripple && 'mdc-ripple-surface'
      ].filter(Boolean).join(' '),
      elevation: button.importance === 'primary' ? 2 : 0
    };
  }

  adaptToBootstrap(button) {
    const sizeMap = {
      'btn-xs': 'btn-sm',
      'btn-sm': 'btn-sm',
      'btn-md': '',
      'btn-lg': 'btn-lg',
      'btn-xl': 'btn-lg'
    };

    return {
      ...button,
      classes: `btn ${button.variant} ${sizeMap[button.size]}`
    };
  }
}
```

### Performance Recommendations
Provides performance optimization suggestions:

```javascript
optimizeButtonPerformance(button) {
  const optimizations = [];

  // Check for heavy animations
  if (button.animations?.includes('particle')) {
    optimizations.push({
      issue: 'Heavy animation detected',
      solution: 'Consider using CSS-only animations or reducing particle count',
      impact: 'high'
    });
  }

  // Check for large icons
  if (button.icon && !button.iconOptimized) {
    optimizations.push({
      issue: 'Unoptimized icon',
      solution: 'Use SVG sprites or icon fonts',
      impact: 'medium'
    });
  }

  // Check for unnecessary re-renders
  if (button.framework === 'react' && !button.memoized) {
    optimizations.push({
      issue: 'Potential unnecessary re-renders',
      solution: 'Wrap component in React.memo()',
      impact: 'medium'
    });
  }

  return optimizations;
}
```

## Usage Examples

### Automatic Design Generation
```javascript
const designer = new ButtonDesigner();

// Analyze context and generate design
const context = {
  text: 'Submit Order',
  type: 'submit',
  inForm: true,
  siblingCount: 1,
  brandColor: 'blue'
};

const design = designer.analyzeContext(context);
// Returns: {
//   variant: 'btn-primary',
//   size: 'btn-lg',
//   animations: ['hover-lift', 'click-press'],
//   accessibility: { ... }
// }
```

### Design System Conversion
```javascript
// Convert design to specific framework
const materialButton = designer.convertToMaterial(design);
const bootstrapButton = designer.convertToBootstrap(design);
const tailwindButton = designer.convertToTailwind(design);
```

## Best Practices

1. **Context Awareness**: Always analyze the surrounding UI context
2. **User Intent**: Design based on predicted user intentions
3. **Accessibility First**: Ensure all designs meet WCAG standards
4. **Performance**: Optimize for smooth 60fps interactions
5. **Testing**: Generate variants for A/B testing important CTAs