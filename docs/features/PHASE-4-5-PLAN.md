# Phase 4-5 Plan: Bundle Optimization & Monitoring 📦

**Date**: January 21, 2026  
**Branch**: `feature/bundle-optimization`  
**Status**: In Progress  
**Previous Phases**: Merged to develop ✅

---

## ✅ Completed: Phases 1-3 (Merged to Develop)

**Performance Gains Achieved**:
- 60-80% overall performance improvement
- 50-70% fewer component re-renders
- 76% smaller API payloads
- 70% faster TradesList rendering

---

## 🎯 Phase 4: Bundle Optimization

### Objective
Reduce JavaScript bundle size by 30-40% through code splitting and lazy loading.

### Current Bundle Analysis Needed
Run: `npm run analyze` to identify largest chunks

### Optimization Strategies

#### 1. Dynamic Imports for Chart Components
**Target**: Recharts library (~150KB)

**Components to lazy load**:
- SessionComparisonChart
- HourlyHeatmap
- ComparisonChart
- MonthlyAnalyticsChart
- TrendLineChart

**Implementation**:
```typescript
// Before
import { SessionComparisonChart } from '@/components/charts/SessionComparisonChart';

// After
const SessionComparisonChart = dynamic(
  () => import('@/components/charts/SessionComparisonChart'),
  { loading: () => <LoadingSpinner /> }
);
```

**Expected Impact**: 30-40% smaller initial bundle

---

#### 2. Code Splitting for Admin Routes
**Target**: Admin-only pages (~100KB)

**Routes to split**:
- `/admin/dashboard`
- `/admin/users`
- `/admin/overview`
- `/admin/economic-calendar`

**Implementation**:
```typescript
// next.config.ts
experimental: {
  optimizePackageImports: ['recharts', '@radix-ui'],
}
```

**Expected Impact**: 20% smaller bundle for regular users

---

#### 3. Optimize Large Dependencies

**Candidates**:
1. **react-window** - Already optimized ✅
2. **recharts** - Use tree-shaking
3. **@radix-ui** - Import only used components
4. **drizzle-orm** - Ensure tree-shaking works

**Check**:
```bash
npm run analyze
# Look for large chunks in .next/analyze/client.html
```

---

#### 4. Route-Based Code Splitting

**Next.js automatic splitting**:
- Each page in `app/` is automatically code-split
- Verify with bundle analyzer

**Manual optimization**:
```typescript
// For large client components
'use client';
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  ssr: false,
  loading: () => <Skeleton />
});
```

---

### Implementation Checklist

- [ ] Run bundle analyzer and document current sizes
- [ ] Dynamic import all chart components (5 files)
- [ ] Add loading states for lazy-loaded components
- [ ] Optimize Recharts imports (tree-shaking)
- [ ] Verify admin routes are code-split
- [ ] Test all lazy-loaded components load correctly
- [ ] Measure bundle size reduction
- [ ] Commit changes

---

## 🎯 Phase 5: Monitoring & Performance Budgets

### Objective
Set up automated monitoring to prevent performance regressions.

### 1. Lighthouse CI Setup

**Installation**:
```bash
npm install -D @lhci/cli
```

**Configuration** (`.lighthouserc.json`):
```json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run start",
      "url": ["http://localhost:3000", "http://localhost:3000/dashboard"]
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "first-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "interactive": ["error", {"maxNumericValue": 3500}]
      }
    }
  }
}
```

**GitHub Actions** (`.github/workflows/lighthouse.yml`):
```yaml
name: Lighthouse CI
on: [pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npx @lhci/cli autorun
```

---

### 2. Bundle Size Tracking

**Tool**: `bundlesize` or GitHub Actions

**Configuration** (`package.json`):
```json
{
  "bundlesize": [
    {
      "path": ".next/static/chunks/pages/**/*.js",
      "maxSize": "300 kB"
    },
    {
      "path": ".next/static/chunks/*.js",
      "maxSize": "150 kB"
    }
  ]
}
```

**GitHub Action**:
```yaml
- name: Check bundle size
  run: npm run bundlesize
```

---

### 3. Performance Budgets

**Next.js Config** (`next.config.ts`):
```typescript
experimental: {
  performanceBudget: {
    maxSize: 500 * 1024, // 500KB
  },
}
```

**Monitoring Metrics**:
- First Contentful Paint (FCP): < 2s
- Time to Interactive (TTI): < 3.5s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- First Input Delay (FID): < 100ms

---

### 4. Error Boundary Enhancement

**Add comprehensive error boundaries**:
```typescript
// components/ErrorBoundary.tsx enhancement
import * as Sentry from '@sentry/nextjs'; // Optional

class ErrorBoundary extends Component {
  componentDidCatch(error, errorInfo) {
    // Log to monitoring service
    console.error('Error caught:', error, errorInfo);
    // Optional: Sentry.captureException(error);
  }
}
```

---

## 📊 Success Criteria

### Phase 4 Targets
| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Initial Bundle | ~450KB | < 300KB | npm run analyze |
| Admin Route Size | ~100KB | Lazy-loaded | Lighthouse |
| Chart Components | Eager | Lazy-loaded | Network tab |

### Phase 5 Targets
- ✅ Lighthouse CI passes on all PRs
- ✅ Performance score > 90
- ✅ Bundle size violations fail CI
- ✅ Automated performance reports

---

## 🚀 Implementation Timeline

| Day | Tasks | Duration |
|-----|-------|----------|
| Day 1 | Bundle analysis + dynamic imports | 4-6 hours |
| Day 2 | Code splitting + testing | 4-5 hours |
| Day 3 | Lighthouse CI setup | 3-4 hours |
| Day 3 | Bundle size tracking | 2-3 hours |
| Day 4 | Documentation + final testing | 2-3 hours |

**Total**: 15-21 hours (2-3 days)

---

## 📝 Current Status

**Branch**: `feature/bundle-optimization` (created)  
**Base**: `develop` (with Phases 1-3 merged)

**Next Actions**:
1. ✅ cross-env installed for cross-platform builds
2. 🔄 Run `npm run analyze` successfully
3. ⏳ Document current bundle sizes
4. ⏳ Implement dynamic imports for charts
5. ⏳ Test and commit

---

## 🎯 Final Outcome

**Combined Phases 1-5 Impact**:
- 60-80% runtime performance improvement (Phases 1-3) ✅
- 30-40% bundle size reduction (Phase 4)
- Automated performance monitoring (Phase 5)
- Zero performance regressions going forward

**Total Development Time**: 11-16 days
**ROI**: Massive - better UX, faster load times, automated quality gates

---

**Last Updated**: January 21, 2026  
**Status**: Phase 4 in progress  
**Branch**: feature/bundle-optimization

