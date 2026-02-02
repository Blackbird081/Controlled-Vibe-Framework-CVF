# Frontend Aesthetics Skill

> Core UI/UX skill for creating distinctive, polished interfaces.
> Prevents "AI slop" - generic designs with Inter fonts and purple gradients.

## Token Budget: ~400 tokens

---

## 1. TYPOGRAPHY

### Avoid Generic Fonts
```
NEVER USE:
- Arial, Helvetica (system defaults)
- Inter (overused in AI outputs)
- Roboto (too common)
- Open Sans (bland)
```

### Recommended Font Pairings

**Display/Headings:**
- Cal Sans (bold, modern)
- Instrument Serif (editorial)
- Fraunces (expressive)
- Playfair Display (elegant)
- Space Grotesk (tech)

**Body Text:**
- Plus Jakarta Sans (friendly)
- Outfit (clean, modern)
- Satoshi (geometric)
- DM Sans (balanced)
- Manrope (versatile)

### Typography Scale
```css
/* Recommended scale - 1.25 ratio */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
--text-6xl: 3.75rem;   /* 60px */
```

### Font Loading
```tsx
// Next.js font optimization
import { Plus_Jakarta_Sans, Instrument_Serif } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans'
});

const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display'
});
```

---

## 2. COLOR SYSTEM

### Use CSS Variables with hsl() Function (CRITICAL)

**IMPORTANT:** When using CSS variables with Tailwind, you MUST use the complete `hsl()` function syntax.

```css
/* CORRECT - Always use hsl() wrapper */
:root {
  --color-primary: hsl(220, 100%, 60%);
  --color-secondary: hsl(260, 80%, 55%);
  --color-accent: hsl(220, 90%, 65%);
  --color-surface: hsl(230, 30%, 15%);
  --color-background: hsl(230, 30%, 10%);
  --color-text: hsl(230, 20%, 90%);
}

/* WRONG - Missing hsl() wrapper - Tailwind will output invalid CSS! */
:root {
  --color-primary: 220 100% 60%;  /* ❌ BAD - outputs "background-color: 220 100% 60%" (invalid) */
}
```

### Light Mode Palette (with hsl())
```css
:root {
  /* Primary palette */
  --color-primary-50: hsl(204, 100%, 97%);
  --color-primary-100: hsl(204, 94%, 94%);
  --color-primary-500: hsl(199, 89%, 48%);
  --color-primary-600: hsl(200, 98%, 39%);
  --color-primary-900: hsl(202, 80%, 24%);

  /* Neutral/Gray */
  --color-gray-50: hsl(0, 0%, 98%);
  --color-gray-100: hsl(240, 5%, 96%);
  --color-gray-200: hsl(240, 6%, 90%);
  --color-gray-800: hsl(240, 4%, 16%);
  --color-gray-900: hsl(240, 6%, 10%);

  /* Semantic colors */
  --color-surface: var(--color-gray-50);
  --color-surface-elevated: hsl(0, 0%, 100%);
  --color-text-primary: var(--color-gray-900);
  --color-text-secondary: hsl(240, 4%, 46%);
  --color-text-muted: hsl(240, 5%, 65%);

  /* Accent colors */
  --color-accent: hsl(258, 90%, 66%);
  --color-success: hsl(160, 84%, 39%);
  --color-warning: hsl(38, 92%, 50%);
  --color-error: hsl(0, 84%, 60%);
}

/* Dark mode */
.dark {
  --color-surface: var(--color-gray-900);
  --color-surface-elevated: var(--color-gray-800);
  --color-text-primary: var(--color-gray-50);
  --color-text-secondary: var(--color-gray-300);
}
```

### Color Palette Strategies

**Monochromatic:** Single hue with varied lightness
**Analogous:** Adjacent colors on wheel (e.g., blue-cyan-teal)
**Complementary:** Opposite colors for high contrast
**Split-complementary:** Main + two adjacent to complement

### Avoid
- Purple-to-pink gradients (AI cliche)
- Neon colors without purpose
- More than 3 primary colors
- Low contrast text

---

## 3. MOTION & ANIMATION

### Entrance Animations
```css
/* Fade in up - most versatile */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}

/* Staggered children */
.stagger-children > * {
  opacity: 0;
  animation: fadeInUp 0.5s ease-out forwards;
}
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 100ms; }
.stagger-children > *:nth-child(3) { animation-delay: 200ms; }
.stagger-children > *:nth-child(4) { animation-delay: 300ms; }
.stagger-children > *:nth-child(5) { animation-delay: 400ms; }
```

### Hover Interactions
```css
/* Card hover - subtle lift */
.card-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
}

/* Button hover - scale */
.btn-hover {
  transition: transform 0.15s ease, background-color 0.15s ease;
}
.btn-hover:hover {
  transform: scale(1.02);
}
.btn-hover:active {
  transform: scale(0.98);
}
```

### Motion Principles
- Duration: 150-300ms for micro, 300-500ms for macro
- Easing: ease-out for entrances, ease-in-out for transitions
- Reduce motion: Always respect `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 4. BACKGROUNDS & DEPTH

### Layered Gradients
```css
/* Hero background - layered effect */
.hero-bg {
  background:
    /* Noise overlay */
    url('/noise.svg'),
    /* Radial glow */
    radial-gradient(
      ellipse 80% 50% at 50% -20%,
      rgba(120, 119, 198, 0.3),
      transparent
    ),
    /* Base gradient */
    linear-gradient(
      to bottom,
      var(--color-gray-900),
      var(--color-gray-950)
    );
}

/* Subtle mesh gradient */
.mesh-gradient {
  background-color: #0f172a;
  background-image:
    radial-gradient(at 40% 20%, #1e40af 0px, transparent 50%),
    radial-gradient(at 80% 0%, #7c3aed 0px, transparent 50%),
    radial-gradient(at 0% 50%, #0ea5e9 0px, transparent 50%);
}
```

### Glass/Blur Effects
```css
/* Glassmorphism card */
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

/* Frosted header */
.frosted-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px) saturate(180%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
```

### Pattern Overlays
```css
/* Dot pattern */
.dot-pattern {
  background-image: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.1) 1px,
    transparent 1px
  );
  background-size: 24px 24px;
}

/* Grid pattern */
.grid-pattern {
  background-image:
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 64px 64px;
}
```

---

## 5. SPACING & LAYOUT

### Consistent Spacing Scale
```css
/* 4px base unit */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
--space-24: 6rem;    /* 96px */
```

### Section Spacing
- Hero: `py-24` to `py-32` (96-128px)
- Content sections: `py-16` to `py-24` (64-96px)
- Between elements: `space-y-8` to `space-y-12`

### Container Widths
```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

---

## 6. COMPONENT PATTERNS

### Buttons
```tsx
// Primary button
<button className="
  px-6 py-3
  bg-primary-600 hover:bg-primary-700
  text-white font-medium
  rounded-lg
  transition-all duration-150
  hover:scale-[1.02] active:scale-[0.98]
  shadow-lg shadow-primary-600/25
">
  Get Started
</button>

// Ghost button
<button className="
  px-6 py-3
  border border-gray-200 dark:border-gray-700
  hover:bg-gray-50 dark:hover:bg-gray-800
  rounded-lg
  transition-colors duration-150
">
  Learn More
</button>
```

### Cards
```tsx
<div className="
  p-6
  bg-white dark:bg-gray-800
  rounded-2xl
  border border-gray-100 dark:border-gray-700
  shadow-sm hover:shadow-md
  transition-shadow duration-200
">
  {/* Content */}
</div>
```

### Input Fields
```tsx
<input className="
  w-full px-4 py-3
  bg-gray-50 dark:bg-gray-900
  border border-gray-200 dark:border-gray-700
  rounded-lg
  text-gray-900 dark:text-gray-100
  placeholder:text-gray-400
  focus:outline-none focus:ring-2 focus:ring-primary-500/50
  transition-all duration-150
"/>
```

---

## 7. PRODUCT-SPECIFIC OVERRIDES

### Landing Pages
- Full-bleed hero with gradient background
- Large typography (text-5xl to text-7xl headlines)
- Generous whitespace (py-24+)
- Motion on scroll (intersection observer)
- Social proof sections

### Dashboards
- Dense information layout
- Minimal motion (data focus)
- High contrast for readability
- Card-based widgets
- Consistent icon system

### Documentation
- Maximum readability (18px+ body)
- High contrast (7:1 ratio)
- Clear navigation hierarchy
- Code block styling
- Table of contents

### SaaS Products
- Clear pricing tables
- Feature comparison grids
- Trust indicators (logos, testimonials)
- Strong CTAs above fold
- Onboarding flows

---

## 8. IMAGE PLACEHOLDERS

When local image assets are not available, use placeholder services:

### Placeholder Service Pattern
```tsx
// Use placehold.co for placeholder images
<img
  src="https://placehold.co/600x400/1a1a2e/667eea?text=Dashboard+Preview"
  alt="Dashboard preview"
  width={600}
  height={400}
/>

// Pattern: https://placehold.co/{WIDTH}x{HEIGHT}/{BG_COLOR}/{TEXT_COLOR}?text={LABEL}
// - BG_COLOR: Background color (hex without #)
// - TEXT_COLOR: Text color (hex without #)
// - LABEL: URL-encoded text (spaces become +)

// Examples:
// Dark theme: https://placehold.co/800x600/1e1e2e/a78bfa?text=Feature+Image
// Light theme: https://placehold.co/400x300/f5f5f5/6366f1?text=Product+Shot
```

### When to Use Placeholders
- Hero images when no asset provided
- Feature illustrations
- Product screenshots
- Avatar images
- Logo clouds (use text placeholders)

### NEVER Use
- External image URLs from random sources
- Broken local paths like `/images/hero.png` without creating the file
- Inline base64 for large images

---

## CHECKLIST FOR CODER

Before submitting code, verify:

**Typography:**
- [ ] No generic fonts (Arial, Inter, Roboto)
- [ ] Typography scale followed

**Colors (CRITICAL):**
- [ ] CSS variables use `hsl()` wrapper (e.g., `hsl(220, 100%, 60%)`)
- [ ] NO raw HSL values without wrapper (e.g., `220 100% 60%`)
- [ ] No hardcoded hex colors in components
- [ ] Dark mode support (if applicable)

**Motion:**
- [ ] Entrance animations on key elements
- [ ] Hover states on interactive elements
- [ ] Reduced motion respected

**Images:**
- [ ] Use placeholder URLs when assets unavailable
- [ ] Pattern: `https://placehold.co/WxH/BG/TEXT?text=Label`
- [ ] NO broken local paths

**Layout:**
- [ ] Consistent spacing scale used
- [ ] Backgrounds have depth (gradients/patterns)

**Content:**
- [ ] ALL text content in English (translate if needed)
- [ ] Content from manifest.ts, not hardcoded
