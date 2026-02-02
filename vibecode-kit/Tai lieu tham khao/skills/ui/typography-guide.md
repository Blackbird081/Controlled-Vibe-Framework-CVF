# Typography Skill

> Detailed typography guidance for creating distinctive, readable interfaces.

## Token Budget: ~250 tokens

---

## 1. FONT SELECTION MATRIX

### By Product Type

| Product Type | Display Font | Body Font | Mood |
|--------------|--------------|-----------|------|
| Landing | Cal Sans, Fraunces | Plus Jakarta Sans | Bold, confident |
| SaaS | Space Grotesk | Inter (exception) | Tech, modern |
| Dashboard | Geist, Manrope | Geist Mono | Data-focused |
| Docs | Instrument Serif | Source Serif Pro | Editorial |
| Branding | Playfair Display | Lora | Elegant, premium |
| E-commerce | DM Sans | DM Sans | Clean, trustworthy |

### Font Pairing Rules
1. **Contrast** - Pair serif with sans-serif
2. **Consistency** - Same x-height for harmony
3. **Limit** - Maximum 2 font families
4. **Hierarchy** - Display for headlines only

---

## 2. RESPONSIVE TYPOGRAPHY

### Fluid Type Scale (clamp)
```css
:root {
  /* Fluid typography using clamp() */
  --font-size-sm: clamp(0.875rem, 0.8rem + 0.25vw, 1rem);
  --font-size-base: clamp(1rem, 0.9rem + 0.35vw, 1.125rem);
  --font-size-lg: clamp(1.125rem, 1rem + 0.5vw, 1.25rem);
  --font-size-xl: clamp(1.25rem, 1rem + 1vw, 1.5rem);
  --font-size-2xl: clamp(1.5rem, 1rem + 1.5vw, 2rem);
  --font-size-3xl: clamp(1.875rem, 1rem + 2.5vw, 2.5rem);
  --font-size-4xl: clamp(2.25rem, 1rem + 4vw, 3.5rem);
  --font-size-5xl: clamp(3rem, 1rem + 6vw, 5rem);
}
```

### Mobile-First Breakpoints
```css
/* Base (mobile) */
h1 { font-size: 2.25rem; }  /* 36px */
h2 { font-size: 1.875rem; } /* 30px */
h3 { font-size: 1.5rem; }   /* 24px */
p  { font-size: 1rem; }     /* 16px */

/* Tablet (md: 768px) */
@media (min-width: 768px) {
  h1 { font-size: 3rem; }    /* 48px */
  h2 { font-size: 2.25rem; } /* 36px */
  h3 { font-size: 1.875rem; }/* 30px */
}

/* Desktop (lg: 1024px) */
@media (min-width: 1024px) {
  h1 { font-size: 3.75rem; } /* 60px */
  h2 { font-size: 3rem; }    /* 48px */
  h3 { font-size: 2.25rem; } /* 36px */
}
```

---

## 3. LINE HEIGHT & SPACING

### Line Height by Context
```css
/* Headings - tighter */
h1, h2, h3 {
  line-height: 1.1;
  letter-spacing: -0.02em;
}

/* Body text - comfortable */
p, li {
  line-height: 1.6;
  letter-spacing: 0;
}

/* Small text - looser */
.text-sm {
  line-height: 1.5;
  letter-spacing: 0.01em;
}

/* Captions/labels */
.caption {
  line-height: 1.4;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
```

### Paragraph Spacing
```css
/* Prose content */
.prose p + p {
  margin-top: 1.5em;
}

.prose h2 {
  margin-top: 2.5em;
  margin-bottom: 1em;
}

.prose h3 {
  margin-top: 2em;
  margin-bottom: 0.75em;
}
```

---

## 4. TEXT COLORS & CONTRAST

### Semantic Text Colors
```css
:root {
  /* Light mode */
  --text-primary: #18181b;      /* Gray 900 - main content */
  --text-secondary: #52525b;    /* Gray 600 - supporting */
  --text-muted: #a1a1aa;        /* Gray 400 - disabled/hints */
  --text-inverse: #fafafa;      /* Gray 50 - on dark bg */
  --text-brand: #2563eb;        /* Blue 600 - links/brand */
}

.dark {
  --text-primary: #fafafa;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;
  --text-inverse: #18181b;
}
```

### Contrast Requirements
- **Body text**: Minimum 4.5:1 (WCAG AA)
- **Large text (18px+)**: Minimum 3:1
- **UI components**: Minimum 3:1
- **Target**: 7:1 for documentation/reading

---

## 5. SPECIAL TEXT TREATMENTS

### Gradient Text
```css
.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Text Shadow for Depth
```css
.hero-title {
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Glow effect */
.glow-text {
  text-shadow: 0 0 40px rgba(99, 102, 241, 0.5);
}
```

### Highlighted Text
```css
.highlight {
  background: linear-gradient(
    180deg,
    transparent 60%,
    rgba(99, 102, 241, 0.3) 60%
  );
}
```

---

## 6. TAILWIND TYPOGRAPHY CLASSES

### Recommended Utility Combinations

```tsx
// Hero headline
<h1 className="
  text-4xl md:text-5xl lg:text-6xl
  font-bold
  tracking-tight
  text-gray-900 dark:text-white
">

// Section headline
<h2 className="
  text-3xl md:text-4xl
  font-semibold
  tracking-tight
  text-gray-900 dark:text-white
">

// Card title
<h3 className="
  text-xl md:text-2xl
  font-semibold
  text-gray-900 dark:text-white
">

// Body text
<p className="
  text-base md:text-lg
  text-gray-600 dark:text-gray-300
  leading-relaxed
">

// Caption/label
<span className="
  text-xs
  font-medium
  uppercase
  tracking-wider
  text-gray-500 dark:text-gray-400
">
```

---

## 7. FONT LOADING BEST PRACTICES

### Next.js Font Optimization
```tsx
// app/layout.tsx
import { Plus_Jakarta_Sans } from 'next/font/google';
import localFont from 'next/font/local';

// Google Font
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

// Local font (for custom/premium fonts)
const calSans = localFont({
  src: './fonts/CalSans-SemiBold.woff2',
  variable: '--font-display',
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html className={`${jakarta.variable} ${calSans.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

### CSS Variable Usage
```css
/* tailwind.config.js */
theme: {
  fontFamily: {
    sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
    display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
    mono: ['var(--font-mono)', 'Menlo', 'monospace'],
  },
}
```

---

## TYPOGRAPHY CHECKLIST

- [ ] Display font is distinctive (not Inter/Arial/Roboto)
- [ ] Body font is readable (16px minimum)
- [ ] Font pairing has contrast (serif + sans or display + body)
- [ ] Line heights appropriate (1.1 headings, 1.6 body)
- [ ] Responsive sizes using clamp() or breakpoints
- [ ] Contrast meets WCAG AA (4.5:1 minimum)
- [ ] Font loading optimized (display: swap)
- [ ] Dark mode text colors defined
- [ ] Letter-spacing adjusted for headings (-0.02em)
- [ ] Maximum 2 font families used
