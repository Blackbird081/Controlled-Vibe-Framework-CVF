# Accessibility (WCAG AA) Skill

> Ensure interfaces are usable by everyone, meeting WCAG 2.1 AA standards.

## Token Budget: ~300 tokens

---

## 1. COLOR CONTRAST

### Minimum Contrast Ratios (WCAG AA)
| Text Type | Ratio | Example |
|-----------|-------|---------|
| Normal text (<18px) | 4.5:1 | #595959 on white |
| Large text (≥18px bold, ≥24px) | 3:1 | #767676 on white |
| UI components & graphics | 3:1 | Icons, borders |

### Checking Contrast
```bash
# Tools
- Chrome DevTools (Accessibility tab)
- WebAIM Contrast Checker: webaim.org/resources/contrastchecker
- Figma plugins: Stark, Contrast
```

### Safe Color Combinations
```css
/* Light mode - guaranteed AA */
--text-primary: #18181b;    /* 15.5:1 on white */
--text-secondary: #52525b;  /* 7.2:1 on white */
--text-muted: #71717a;      /* 4.7:1 on white - minimum! */

/* Dark mode */
--text-primary: #fafafa;    /* 15.5:1 on #18181b */
--text-secondary: #a1a1aa;  /* 7.0:1 on #18181b */
--text-muted: #71717a;      /* 4.5:1 on #18181b */
```

### Common Failures
```css
/* FAIL - insufficient contrast */
.bad { color: #9ca3af; }  /* Gray-400 on white = 2.9:1 ❌ */

/* PASS - sufficient contrast */
.good { color: #6b7280; } /* Gray-500 on white = 4.6:1 ✓ */
```

---

## 2. KEYBOARD NAVIGATION

### Focus Management
```css
/* Never remove focus outline without replacement */
/* BAD */
:focus { outline: none; }

/* GOOD - custom focus style */
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* Or use ring utility in Tailwind */
.focus-ring {
  @apply focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2;
}
```

### Tab Order
```tsx
// Ensure logical tab order
// Interactive elements receive focus in visual order
<nav>
  <a href="/">Home</a>        {/* Tab 1 */}
  <a href="/about">About</a>  {/* Tab 2 */}
  <a href="/contact">Contact</a> {/* Tab 3 */}
</nav>

// Skip link for keyboard users
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black"
>
  Skip to main content
</a>
```

### Keyboard Interactions
| Component | Keys |
|-----------|------|
| Buttons | Enter, Space |
| Links | Enter |
| Checkboxes | Space |
| Radio buttons | Arrow keys |
| Dropdowns | Enter, Space, Arrows |
| Modals | Escape to close |
| Tabs | Arrow keys |

---

## 3. SEMANTIC HTML

### Use Correct Elements
```tsx
// BAD - div soup
<div onClick={handleClick}>Click me</div>

// GOOD - semantic elements
<button onClick={handleClick}>Click me</button>
<a href="/page">Go to page</a>
<nav>...</nav>
<main>...</main>
<article>...</article>
<aside>...</aside>
<footer>...</footer>
```

### Heading Hierarchy
```tsx
// GOOD - logical hierarchy
<h1>Page Title</h1>
  <h2>Section Title</h2>
    <h3>Subsection</h3>
  <h2>Another Section</h2>

// BAD - skipping levels
<h1>Page Title</h1>
  <h3>Section</h3>  {/* Skipped h2! */}
```

### Landmark Regions
```tsx
<header role="banner">...</header>
<nav role="navigation">...</nav>
<main role="main">...</main>
<aside role="complementary">...</aside>
<footer role="contentinfo">...</footer>
```

---

## 4. IMAGES & MEDIA

### Alt Text
```tsx
// Informative images - describe content
<img src="chart.png" alt="Sales increased 45% from Q1 to Q2 2024" />

// Decorative images - empty alt
<img src="decorative-wave.svg" alt="" />

// Complex images - detailed description
<figure>
  <img src="diagram.png" alt="System architecture overview" />
  <figcaption>
    Detailed description of the architecture showing...
  </figcaption>
</figure>
```

### Icons
```tsx
// Icon with text - decorative
<button>
  <SearchIcon aria-hidden="true" />
  Search
</button>

// Icon-only button - needs label
<button aria-label="Search">
  <SearchIcon aria-hidden="true" />
</button>

// Or use visually hidden text
<button>
  <SearchIcon aria-hidden="true" />
  <span className="sr-only">Search</span>
</button>
```

### Video/Audio
```tsx
// Provide captions and transcripts
<video controls>
  <source src="demo.mp4" type="video/mp4" />
  <track kind="captions" src="captions.vtt" srclang="en" label="English" />
</video>
```

---

## 5. FORMS

### Labels
```tsx
// Every input needs a label
<label htmlFor="email">Email address</label>
<input id="email" type="email" />

// Or aria-label for icon inputs
<input
  type="search"
  aria-label="Search products"
  placeholder="Search..."
/>
```

### Error Messages
```tsx
// Associate errors with inputs
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>
{hasError && (
  <p id="email-error" className="text-red-600" role="alert">
    Please enter a valid email address
  </p>
)}
```

### Required Fields
```tsx
// Indicate required fields
<label htmlFor="name">
  Name <span aria-hidden="true" className="text-red-500">*</span>
  <span className="sr-only">(required)</span>
</label>
<input id="name" required aria-required="true" />
```

### Form Instructions
```tsx
<form>
  <p id="form-instructions">Fields marked with * are required</p>
  <fieldset aria-describedby="form-instructions">
    ...
  </fieldset>
</form>
```

---

## 6. ARIA ATTRIBUTES

### When to Use ARIA
```
First rule of ARIA: Don't use ARIA if you can use native HTML.
<button> > <div role="button">
```

### Common ARIA Patterns
```tsx
// Expandable content
<button
  aria-expanded={isOpen}
  aria-controls="panel-1"
>
  Show details
</button>
<div id="panel-1" hidden={!isOpen}>
  Content...
</div>

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// Current page in navigation
<nav>
  <a href="/" aria-current={isHomePage ? "page" : undefined}>Home</a>
  <a href="/about" aria-current={isAboutPage ? "page" : undefined}>About</a>
</nav>

// Loading states
<button aria-busy={isLoading} disabled={isLoading}>
  {isLoading ? "Saving..." : "Save"}
</button>
```

### Dialog/Modal
```tsx
<dialog
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <h2 id="dialog-title">Confirm Delete</h2>
  <p id="dialog-description">This action cannot be undone.</p>
  <button onClick={onClose}>Cancel</button>
  <button onClick={onConfirm}>Delete</button>
</dialog>
```

---

## 7. MOTION & ANIMATION

### Reduced Motion
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

### Avoid Seizure Triggers
- No flashing content > 3 times per second
- No large areas of high-contrast flashing

---

## 8. RESPONSIVE & ZOOM

### Support 200% Zoom
- Text must remain readable
- Layout should not break
- No horizontal scrolling at 320px viewport

### Touch Targets
```css
/* Minimum 44x44px for touch targets */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* Or use Tailwind */
.btn {
  @apply min-h-[44px] min-w-[44px];
}
```

---

## 9. TESTING CHECKLIST

### Automated Testing
```bash
# Tools
- axe DevTools (browser extension)
- Lighthouse accessibility audit
- eslint-plugin-jsx-a11y
- @axe-core/react (runtime checks)
```

### Manual Testing
- [ ] Tab through entire page - logical order?
- [ ] Focus visible on all interactive elements?
- [ ] Screen reader announces content correctly?
- [ ] Page works at 200% zoom?
- [ ] Color isn't only indicator of meaning?
- [ ] Forms have proper labels and errors?
- [ ] Images have appropriate alt text?

### Screen Reader Testing
```bash
# Free screen readers
- VoiceOver (macOS: Cmd+F5)
- NVDA (Windows)
- TalkBack (Android)
```

---

## ACCESSIBILITY CHECKLIST

### Must-Have (WCAG AA)
- [ ] Color contrast 4.5:1 for text, 3:1 for large text
- [ ] Keyboard accessible (all interactions)
- [ ] Focus indicator visible
- [ ] Form inputs have labels
- [ ] Images have alt text
- [ ] Semantic HTML structure
- [ ] Heading hierarchy (h1 → h2 → h3)
- [ ] Skip link for keyboard users
- [ ] Error messages associated with inputs
- [ ] Reduced motion respected

### Nice-to-Have (Enhanced)
- [ ] ARIA live regions for dynamic content
- [ ] Focus trapping in modals
- [ ] Roving tabindex for complex widgets
- [ ] High contrast mode support
- [ ] Screen reader announcements for loading states
