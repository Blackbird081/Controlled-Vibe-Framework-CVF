# Web Performance Skill

> Optimize for Core Web Vitals and fast user experience.

## Token Budget: ~250 tokens

---

## 1. CORE WEB VITALS

### Target Metrics
| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | ≤2.5s | 2.5-4s | >4s |
| **INP** (Interaction to Next Paint) | ≤200ms | 200-500ms | >500ms |
| **CLS** (Cumulative Layout Shift) | ≤0.1 | 0.1-0.25 | >0.25 |

### LCP Optimization
```tsx
// 1. Preload critical images
<link rel="preload" as="image" href="/hero-image.webp" />

// 2. Use priority prop in Next.js Image
<Image
  src="/hero.jpg"
  alt="Hero"
  priority  // Preloads the image
  width={1200}
  height={600}
/>

// 3. Inline critical CSS
// Next.js does this automatically with App Router

// 4. Avoid render-blocking resources
<script defer src="analytics.js"></script>
```

### INP Optimization
```tsx
// 1. Break up long tasks
// BAD
function handleClick() {
  heavyComputation(); // Blocks main thread
}

// GOOD - use requestIdleCallback or setTimeout
function handleClick() {
  // Immediate visual feedback
  setIsLoading(true);

  // Defer heavy work
  requestIdleCallback(() => {
    heavyComputation();
    setIsLoading(false);
  });
}

// 2. Use React transitions for non-urgent updates
import { useTransition } from 'react';

function SearchResults() {
  const [isPending, startTransition] = useTransition();

  function handleSearch(query) {
    startTransition(() => {
      setSearchResults(filterResults(query));
    });
  }
}
```

### CLS Optimization
```tsx
// 1. Always set dimensions on images/videos
<Image
  src="/photo.jpg"
  width={800}
  height={600}  // Explicit dimensions prevent shift
  alt="Photo"
/>

// 2. Reserve space for dynamic content
<div className="min-h-[200px]">
  {isLoading ? <Skeleton /> : <Content />}
</div>

// 3. Avoid inserting content above existing content
// BAD - banner pushes content down
<Banner />  {/* Inserted after load */}
<MainContent />

// GOOD - reserve space
<div className="h-[60px]">
  {showBanner && <Banner />}
</div>
<MainContent />

// 4. Use transform for animations (not top/left/width/height)
// BAD
.animate { top: 0 → top: 100px }

// GOOD
.animate { transform: translateY(0) → translateY(100px) }
```

---

## 2. IMAGE OPTIMIZATION

### Modern Formats
```tsx
// Next.js Image automatically serves WebP/AVIF
<Image
  src="/photo.jpg"  // Serves WebP if supported
  alt="Photo"
  width={800}
  height={600}
/>

// Manual picture element for max control
<picture>
  <source srcSet="/photo.avif" type="image/avif" />
  <source srcSet="/photo.webp" type="image/webp" />
  <img src="/photo.jpg" alt="Photo" />
</picture>
```

### Responsive Images
```tsx
// Next.js handles this, but for manual:
<img
  src="/photo-800.jpg"
  srcSet="
    /photo-400.jpg 400w,
    /photo-800.jpg 800w,
    /photo-1200.jpg 1200w
  "
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="Photo"
/>
```

### Lazy Loading
```tsx
// Native lazy loading
<img loading="lazy" src="/photo.jpg" alt="Photo" />

// Next.js Image (lazy by default)
<Image src="/photo.jpg" alt="Photo" />

// Priority for above-fold images
<Image src="/hero.jpg" alt="Hero" priority />
```

---

## 3. CODE SPLITTING

### Route-Based Splitting (Automatic in Next.js)
```tsx
// Each page is automatically code-split
// app/about/page.tsx → separate chunk
// app/products/page.tsx → separate chunk
```

### Component-Level Splitting
```tsx
// Lazy load heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/Chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,  // Skip server rendering if not needed
});

// Only load when visible
const LazyComponent = dynamic(() => import('@/components/Heavy'), {
  loading: () => <Skeleton />,
});

function Page() {
  return (
    <div>
      <HeroSection />
      {/* Chart loads on demand */}
      <Suspense fallback={<ChartSkeleton />}>
        <HeavyChart />
      </Suspense>
    </div>
  );
}
```

### Third-Party Script Loading
```tsx
// Next.js Script component
import Script from 'next/script';

// Load after page is interactive
<Script
  src="https://analytics.example.com/script.js"
  strategy="afterInteractive"
/>

// Load when browser is idle
<Script
  src="https://chat.example.com/widget.js"
  strategy="lazyOnload"
/>
```

---

## 4. CACHING STRATEGIES

### Static Assets (Long Cache)
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

### API Responses
```tsx
// Route handler caching
export async function GET() {
  const data = await fetchData();

  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
```

### React Query / SWR Caching
```tsx
// SWR example
const { data } = useSWR('/api/user', fetcher, {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60000, // 1 minute
});

// React Query
const { data } = useQuery({
  queryKey: ['user'],
  queryFn: fetchUser,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
});
```

---

## 5. FONT OPTIMIZATION

### Next.js Font Optimization
```tsx
// Automatic font optimization
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export default function Layout({ children }) {
  return (
    <html className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

### Self-Hosted Fonts
```tsx
import localFont from 'next/font/local';

const myFont = localFont({
  src: [
    { path: './fonts/MyFont-Regular.woff2', weight: '400' },
    { path: './fonts/MyFont-Bold.woff2', weight: '700' },
  ],
  display: 'swap',
});
```

### Font Display Strategies
```css
/* swap - show fallback immediately, swap when loaded */
font-display: swap;  /* Best for body text */

/* optional - only use if cached, else fallback */
font-display: optional;  /* Best for non-critical fonts */
```

---

## 6. BUNDLE SIZE

### Analyze Bundle
```bash
# Next.js built-in analyzer
ANALYZE=true npm run build

# Or use @next/bundle-analyzer
npm install @next/bundle-analyzer
```

### Reduce Bundle Size
```tsx
// 1. Import only what you need
// BAD
import _ from 'lodash';
_.debounce(...);

// GOOD
import debounce from 'lodash/debounce';

// 2. Use dynamic imports for large dependencies
const PDFViewer = dynamic(() => import('react-pdf'), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});

// 3. Tree-shake with named imports
// BAD
import * as Icons from 'lucide-react';

// GOOD
import { Search, Menu, X } from 'lucide-react';
```

### Bundle Size Targets
| Target | Size |
|--------|------|
| Total JS (initial) | <200KB gzipped |
| Per-route JS | <50KB gzipped |
| Total CSS | <50KB gzipped |

---

## 7. SERVER COMPONENTS (Next.js 13+)

### Use Server Components Default
```tsx
// Server Component (default) - no "use client"
async function ProductList() {
  const products = await db.products.findMany();
  return (
    <ul>
      {products.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
}

// Client Component - only when needed
'use client';
function AddToCart({ productId }) {
  const [added, setAdded] = useState(false);
  return <button onClick={() => setAdded(true)}>Add to Cart</button>;
}
```

### When to Use Client Components
- Event handlers (onClick, onChange)
- useState, useEffect, useRef
- Browser APIs (localStorage, window)
- Third-party libs that use hooks

---

## 8. PERFORMANCE CHECKLIST

### Initial Load
- [ ] LCP ≤ 2.5s
- [ ] Hero image preloaded
- [ ] Critical CSS inlined
- [ ] No render-blocking scripts
- [ ] Fonts use display: swap

### Interactivity
- [ ] INP ≤ 200ms
- [ ] No long tasks (>50ms)
- [ ] Event handlers debounced
- [ ] React transitions for non-urgent updates

### Visual Stability
- [ ] CLS ≤ 0.1
- [ ] Images have explicit dimensions
- [ ] Space reserved for dynamic content
- [ ] Animations use transform/opacity

### Assets
- [ ] Images in modern formats (WebP/AVIF)
- [ ] Images lazy loaded below fold
- [ ] Responsive images with srcset
- [ ] Total JS < 200KB gzipped

### Monitoring
- [ ] Core Web Vitals tracked (Analytics)
- [ ] Real User Monitoring (RUM) setup
- [ ] Performance budgets defined
