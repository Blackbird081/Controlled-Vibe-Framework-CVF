# AGT-029: Frontend Component Forge

> **Version:** 1.0.0  
> **Status:** Active  
> **Risk Level:** R1 – Low  
> **Autonomy:** Auto + Audit  
> **Category:** App Development — Frontend  
> **Provenance:** claudekit-skills/frontend-development + ui-styling + aesthetic (mrgoonie/claudekit-skills)

---

## 📋 Overview

Frontend architecture methodology that guides agents through **component design, feature organization, Suspense-based data fetching, and performance optimization**. Not a React tutorial — a decision framework for building scalable, maintainable frontend applications with modern patterns (React 19+, Server Components, lazy loading).

**Key Principle:** Components are the unit of UI architecture. Design the component tree before writing code.

---

## 🎯 Capabilities

### Component Architecture Decision Tree

```
CREATING NEW UI?
│
├─ Reusable across features?
│   └─ → src/components/  (shared library)
│       └─ SuspenseLoader, AppBar, DataGrid wrapper
│
├─ Belongs to one feature?
│   └─ → src/features/{name}/components/  (scoped)
│       └─ UserProfile, OrderList, ProductCard
│
├─ Full page/route?
│   └─ → src/routes/{path}/index.tsx  (route entry)
│       └─ Lazy loaded, Suspense wrapped
│
├─ Layout/shell?
│   └─ → src/layouts/  (structural)
│       └─ DashboardLayout, AuthLayout
│
└─ Server Component (Next.js)?
    └─ Default: Server Component (no 'use client')
    └─ Only 'use client' when: useState, useEffect, onClick, browser APIs
```

### Feature Directory Pattern

```
src/
  features/
    auth/
      api/
        authApi.ts           # API service layer
      components/
        LoginForm.tsx        # Feature-specific components
        SignupForm.tsx
        ProtectedRoute.tsx
      hooks/
        useAuth.ts           # Custom hooks
        useSession.ts
      helpers/
        tokenStorage.ts      # Utility functions
        formatUser.ts
      types/
        index.ts             # TypeScript types
      index.ts               # Public exports (barrel file)

    products/
      api/
        productApi.ts
      components/
        ProductCard.tsx
        ProductGrid.tsx
        ProductDetail.tsx
      hooks/
        useProducts.ts
        useProductSearch.ts
      types/
        index.ts
      index.ts

  components/                # Shared/reusable only
    SuspenseLoader/
    ErrorBoundary/
    DataGrid/

  layouts/
    DashboardLayout.tsx
    AuthLayout.tsx

  routes/                    # Route entry points
    dashboard/
      index.tsx              # Lazy loads DashboardPage
    products/
      index.tsx
      [id]/
        index.tsx
```

### Component Design Patterns

```typescript
// Pattern 1: Standard Component with TypeScript
interface ProductCardProps {
  product: Product;
  onAddToCart?: (id: string) => void;
  variant?: 'compact' | 'detailed';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  variant = 'compact',
}) => {
  const handleAdd = useCallback(() => {
    onAddToCart?.(product.id);
  }, [onAddToCart, product.id]);

  return (
    <Card variant={variant}>
      <CardMedia image={product.image} alt={product.name} />
      <CardContent>
        <Typography variant="h6">{product.name}</Typography>
        <Price amount={product.price} />
      </CardContent>
      <CardActions>
        <Button onClick={handleAdd}>Add to Cart</Button>
      </CardActions>
    </Card>
  );
};
```

```typescript
// Pattern 2: Data-Fetching with Suspense (NO loading spinners in component)
export const ProductList: React.FC = () => {
  const { data: products } = useSuspenseQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getAll(),
  });

  return (
    <Grid container spacing={2}>
      {products.map(p => (
        <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <ProductCard product={p} />
        </Grid>
      ))}
    </Grid>
  );
};

// Usage: always wrap in SuspenseLoader
<SuspenseLoader>
  <ProductList />
</SuspenseLoader>
```

```typescript
// Pattern 3: Lazy Route with Suspense
// routes/products/index.tsx
import { lazy, Suspense } from 'react';

const ProductsPage = lazy(() => import('@/features/products/components/ProductsPage'));

export default function ProductsRoute() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProductsPage />
    </Suspense>
  );
}
```

### Anti-Patterns (NEVER Do)

```typescript
// ❌ NEVER: Early returns with loading spinners (causes layout shift)
if (isLoading) return <Spinner />;
if (error) return <ErrorMessage />;

// ✅ ALWAYS: Suspense boundary handles loading
<SuspenseLoader>
  <MyComponent />
</SuspenseLoader>

// ❌ NEVER: Giant monolithic components (>300 lines)
// ✅ ALWAYS: Split into sub-components at 150 lines

// ❌ NEVER: Business logic in components
// ✅ ALWAYS: Extract to hooks (useAuth, useProducts)

// ❌ NEVER: Prop drilling >3 levels
// ✅ ALWAYS: Context or composition pattern

// ❌ NEVER: useEffect for data fetching
// ✅ ALWAYS: useSuspenseQuery or server fetch

// ❌ NEVER: Index-based keys for dynamic lists
// ✅ ALWAYS: Stable unique IDs as keys
```

### Performance Optimization Checklist

```
Code Splitting:
  □ Lazy load all routes (React.lazy)
  □ Lazy load heavy components (DataGrid, charts, editors)
  □ Dynamic import for large libraries

Rendering:
  □ useMemo for expensive computations (filter, sort, map)
  □ useCallback for handlers passed to children
  □ React.memo for expensive child components
  □ Virtualize long lists (react-window / TanStack Virtual)

Data:
  □ Suspense + useSuspenseQuery (cache-first)
  □ Optimistic updates for mutations
  □ Debounce search inputs (300-500ms)
  □ Prefetch on hover for navigation

Assets:
  □ Image optimization (next/image or lazy loading)
  □ Font subsetting + preload
  □ SVG inline for icons (<2KB)

Metrics:
  □ LCP (Largest Contentful Paint) < 2.5s
  □ FID (First Input Delay) < 100ms
  □ CLS (Cumulative Layout Shift) < 0.1
  □ INP (Interaction to Next Paint) < 200ms
```

### Design System Integration

```
Component Hierarchy:
  1. Primitives     → Button, Input, Typography (from UI library)
  2. Composites     → FormField, SearchBar, UserAvatar
  3. Patterns       → DataTable, FileUploader, CommentThread
  4. Features       → ProductCard, OrderSummary, ChatMessage
  5. Pages          → DashboardPage, CheckoutPage, ProfilePage

Styling Decision:
  □ <100 lines inline → const styles: Record<string, SxProps<Theme>>
  □ >100 lines → separate .styles.ts file
  □ Tokens from theme → theme.palette, theme.spacing, theme.typography
  □ Responsive → sx={{ width: { xs: '100%', md: '50%' } }}
  □ Dark mode → palette.mode aware (never hardcode colors)

Accessibility:
  □ Semantic HTML (button, nav, main, article)
  □ ARIA labels for interactive elements
  □ Keyboard navigation (Tab, Enter, Escape)
  □ Color contrast ratio ≥ 4.5:1 (WCAG AA)
  □ Focus indicators visible
  □ Screen reader testing
```

---

## 🔐 CVF Governance

### Authority Mapping

| Role | Permission |
|------|-----------|
| Orchestrator | Full: define component architecture, approve patterns |
| Architect | Full: design feature structure, review performance |
| Builder | Execute: implement components following patterns |
| Reviewer | Audit: review component quality, accessibility |

### Phase Applicability

| Phase | Usage |
|-------|-------|
| A – Discovery | Identify UI requirements, component needs |
| B – Design | Component tree design, feature organization (PRIMARY) |
| C – Build | Implement components and features |
| D – Review | Review code quality, accessibility, performance |

### Constraints

- MUST use feature directory pattern for domain code
- MUST use Suspense boundaries (no early return loading)
- MUST lazy load all routes and heavy components
- MUST extract business logic to hooks (not in components)
- MUST meet Core Web Vitals thresholds
- MUST NOT use useEffect for data fetching
- R1 classification: design guidance, generates UI code

---

## 🔗 Dependencies

- **AGT-025** (API Architecture) — API layer that frontend consumes
- **AGT-026** (Testing Engine) — Component and E2E testing
- **AGT-023** (Systematic Debugging) — Debug rendering issues

---

## 📊 Validation

### Success Criteria

| Criterion | Target |
|-----------|--------|
| Feature directory compliance | 100% domain code in features/ |
| Suspense adoption | 100% data-fetching uses Suspense |
| Route lazy loading | 100% routes lazy loaded |
| Core Web Vitals | All metrics green |
| Component size | No component >300 lines |
| Accessibility | WCAG AA compliance |

### UAT Link

`governance/skill-library/uat/results/UAT-AGT-029.md`

---

## 📚 Attribution

- **Source:** [mrgoonie/claudekit-skills](https://github.com/mrgoonie/claudekit-skills) — frontend-development (React patterns), ui-styling (shadcn/Tailwind), aesthetic (design principles)
- **Source:** [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates) — frontend agents and component patterns
- **Pattern Type:** Framework-level frontend architecture methodology
- **CVF Adaptation:** Added governance constraints, anti-patterns, performance checklist, decision trees
- **License:** MIT (sources) → CC BY-NC-ND 4.0 (CVF adaptation)

---

*Last Updated: February 17, 2026*
