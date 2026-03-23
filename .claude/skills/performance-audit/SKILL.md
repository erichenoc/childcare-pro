# Performance Audit Skill

## Description
Analyzes the application for performance bottlenecks and optimization opportunities. Covers Core Web Vitals, bundle size, database queries, and rendering patterns.

## Triggers
- "performance audit", "optimize performance", "slow page"
- "core web vitals", "lighthouse score", "bundle size"
- "optimize", "speed up", "performance issues"

## Instructions

### When triggered, perform the following performance analysis:

#### 1. Bundle & Loading Analysis
- Check for unnecessary dependencies in package.json
- Identify large imports that should be dynamically imported
- Verify route-based code splitting is in place
- Check for barrel exports causing import bloat
- Verify images use next/image with proper sizes

#### 2. Rendering Performance
- Identify components that re-render unnecessarily
- Check for missing React.memo on expensive components
- Verify useMemo/useCallback usage on expensive computations
- Check for layout shifts (CLS issues)
- Verify Server Components are used where possible (no unnecessary "use client")

#### 3. Data Fetching Patterns
- Check for waterfall requests (sequential when could be parallel)
- Verify Supabase queries use proper indexes
- Check for N+1 query patterns
- Verify pagination is used for large datasets
- Check for proper caching strategies (revalidate, stale-while-revalidate)

#### 4. Zustand Store Optimization
- Check for stores that contain too much state
- Verify selectors are used to prevent unnecessary re-renders
- Check for proper store splitting (feature stores vs global)

#### 5. Tailwind & CSS Performance
- Check for unused Tailwind classes
- Verify purge/content config is correct
- Check for excessive inline styles

### Output Format
```markdown
## Performance Audit Report - [Date]

### Quick Wins (Easy, High Impact)
1. [Optimization]: [Expected improvement]

### Medium Effort Optimizations
1. [Optimization]: [Expected improvement]

### Long-term Improvements
1. [Optimization]: [Expected improvement]

### Metrics Baseline
- Estimated LCP: [value]
- Estimated FID: [value]
- Estimated CLS: [value]
- Bundle size concerns: [list]
```
