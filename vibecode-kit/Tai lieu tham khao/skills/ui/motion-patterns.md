# Motion & Animation Skill

> Patterns for meaningful motion that enhances UX without overwhelming users.

## Token Budget: ~300 tokens

---

## 1. MOTION PRINCIPLES

### The 3 Purposes of Motion
1. **Feedback** - Confirm user actions (button press, form submit)
2. **Orientation** - Show spatial relationships (page transitions)
3. **Delight** - Add personality (micro-interactions, loading states)

### Timing Guidelines
| Type | Duration | Use Case |
|------|----------|----------|
| Micro | 100-150ms | Hover, focus, toggle |
| Small | 150-250ms | Buttons, dropdowns |
| Medium | 250-400ms | Modals, drawers |
| Large | 400-600ms | Page transitions, hero animations |

### Easing Functions
```css
:root {
  /* Standard easings */
  --ease-out: cubic-bezier(0, 0, 0.2, 1);      /* Decelerate - entrances */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);       /* Accelerate - exits */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1); /* Balanced - transitions */

  /* Expressive easings */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);  /* Playful */
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Snappy */
}
```

---

## 2. ENTRANCE ANIMATIONS

### Fade In Up (Most Versatile)
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s var(--ease-out) forwards;
}
```

### Fade In Scale
```css
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in-scale {
  animation: fadeInScale 0.3s var(--ease-out) forwards;
}
```

### Slide In From Side
```css
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-24px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(24px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

### Blur In
```css
@keyframes blurIn {
  from {
    opacity: 0;
    filter: blur(8px);
  }
  to {
    opacity: 1;
    filter: blur(0);
  }
}

.animate-blur-in {
  animation: blurIn 0.4s var(--ease-out) forwards;
}
```

---

## 3. STAGGERED ANIMATIONS

### CSS Stagger Pattern
```css
/* Parent container */
.stagger-container {
  --stagger-delay: 100ms;
}

/* Children with stagger */
.stagger-container > * {
  opacity: 0;
  animation: fadeInUp 0.5s var(--ease-out) forwards;
}

.stagger-container > *:nth-child(1) { animation-delay: calc(var(--stagger-delay) * 0); }
.stagger-container > *:nth-child(2) { animation-delay: calc(var(--stagger-delay) * 1); }
.stagger-container > *:nth-child(3) { animation-delay: calc(var(--stagger-delay) * 2); }
.stagger-container > *:nth-child(4) { animation-delay: calc(var(--stagger-delay) * 3); }
.stagger-container > *:nth-child(5) { animation-delay: calc(var(--stagger-delay) * 4); }
.stagger-container > *:nth-child(6) { animation-delay: calc(var(--stagger-delay) * 5); }
.stagger-container > *:nth-child(7) { animation-delay: calc(var(--stagger-delay) * 6); }
.stagger-container > *:nth-child(8) { animation-delay: calc(var(--stagger-delay) * 7); }
```

### React/Framer Motion Stagger
```tsx
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0, 0, 0.2, 1] },
  },
};

// Usage
<motion.ul
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  {items.map((item) => (
    <motion.li key={item.id} variants={itemVariants}>
      {item.content}
    </motion.li>
  ))}
</motion.ul>
```

---

## 4. HOVER & INTERACTION STATES

### Card Hover (Lift Effect)
```css
.card {
  transition: transform 0.2s var(--ease-out),
              box-shadow 0.2s var(--ease-out);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 10px 20px -5px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.card:active {
  transform: translateY(-2px);
}
```

### Button Press
```css
.button {
  transition: transform 0.15s var(--ease-out),
              background-color 0.15s var(--ease-out);
}

.button:hover {
  transform: scale(1.02);
}

.button:active {
  transform: scale(0.98);
}
```

### Link Underline Animation
```css
.link {
  position: relative;
  text-decoration: none;
}

.link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: currentColor;
  transition: width 0.3s var(--ease-out);
}

.link:hover::after {
  width: 100%;
}
```

### Icon Rotation
```css
.icon-rotate {
  transition: transform 0.3s var(--ease-out);
}

.trigger:hover .icon-rotate {
  transform: rotate(90deg);
}
```

---

## 5. SCROLL ANIMATIONS

### Intersection Observer Pattern
```tsx
// hooks/useInView.ts
import { useEffect, useRef, useState } from 'react';

export function useInView(threshold = 0.1) {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // Only animate once
        }
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// Usage
function Section() {
  const { ref, isInView } = useInView(0.2);

  return (
    <section
      ref={ref}
      className={`transition-all duration-700 ${
        isInView
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      }`}
    >
      Content here
    </section>
  );
}
```

### CSS Scroll-Triggered (Native)
```css
/* Using animation-timeline (Chrome 115+) */
@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.scroll-reveal {
  animation: reveal linear;
  animation-timeline: view();
  animation-range: entry 0% entry 50%;
}
```

---

## 6. LOADING STATES

### Skeleton Pulse
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-gray-200) 0%,
    var(--color-gray-100) 50%,
    var(--color-gray-200) 100%
  );
  background-size: 200% 100%;
  animation: pulse 1.5s ease-in-out infinite;
  border-radius: 4px;
}
```

### Spinner
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-gray-200);
  border-top-color: var(--color-primary-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
```

### Progress Bar
```css
@keyframes progress {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}

.progress-bar {
  position: relative;
  overflow: hidden;
  background: var(--color-gray-200);
  border-radius: 9999px;
}

.progress-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    var(--color-primary-500),
    transparent
  );
  animation: progress 1.5s ease-in-out infinite;
}
```

---

## 7. ACCESSIBILITY

### Reduced Motion Support (CRITICAL)
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### React Hook for Motion Preference
```tsx
function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(query.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

// Usage with Framer Motion
function AnimatedComponent() {
  const prefersReduced = usePrefersReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReduced ? { duration: 0 } : { duration: 0.5 }}
    >
      Content
    </motion.div>
  );
}
```

---

## 8. PRODUCT-SPECIFIC MOTION

### Landing Pages
- Hero: Staggered text reveal (0.1s delays)
- Features: Scroll-triggered fade-in-up
- Testimonials: Carousel auto-play (5s interval)
- CTA: Subtle pulse on button

### Dashboards
- MINIMAL motion - data focus
- Loading: Skeleton shimmer only
- Transitions: Instant (< 100ms)
- Charts: Simple opacity fade

### SaaS Products
- Onboarding: Step transitions (slide)
- Notifications: Slide-in from edge
- Modals: Scale + fade (0.2s)
- Success states: Checkmark draw animation

---

## MOTION CHECKLIST

- [ ] Entrance animations on hero section
- [ ] Staggered reveal for lists/grids
- [ ] Hover states on all interactive elements
- [ ] Button press feedback (scale)
- [ ] Loading states (skeleton/spinner)
- [ ] Scroll animations on sections
- [ ] `prefers-reduced-motion` respected
- [ ] Durations appropriate (100-600ms)
- [ ] Easings used (not linear)
- [ ] No jarring/distracting motion
