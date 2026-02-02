# CTA Optimization Skill

> Maximize conversion with strategically crafted calls-to-action.

## Token Budget: ~200 tokens

---

## 1. CTA HIERARCHY

### Primary CTA (One per screen)
- Most important action
- High contrast, prominent placement
- Action verb + clear outcome

### Secondary CTA
- Alternative action (lower commitment)
- Subdued styling (ghost/outline button)
- Often paired with primary

### Tertiary CTA
- Links, not buttons
- Navigation or info-seeking
- Minimal visual weight

```tsx
// Visual hierarchy example
<div className="flex items-center gap-4">
  {/* Primary - solid, high contrast */}
  <Button variant="primary">Start free trial</Button>

  {/* Secondary - outline or ghost */}
  <Button variant="outline">Watch demo</Button>
</div>

{/* Tertiary - text link */}
<a href="/pricing" className="text-sm text-gray-600 hover:underline">
  See pricing →
</a>
```

---

## 2. CTA COPY FORMULAS

### High-Converting Patterns

**Action + Benefit:**
```
✓ "Start building free"
✓ "Get instant access"
✓ "Launch your site now"
✓ "Claim your discount"
```

**Action + Timeframe:**
```
✓ "Try free for 14 days"
✓ "Get started in 60 seconds"
✓ "Deploy in 5 minutes"
```

**Action + Risk Reversal:**
```
✓ "Try risk-free"
✓ "Start free—no credit card"
✓ "Cancel anytime"
```

**First Person:**
```
✓ "Start my free trial"
✓ "Create my account"
✓ "Get my discount"
```

### Weak CTAs to Avoid
```
✗ "Submit"
✗ "Click here"
✗ "Sign up"
✗ "Learn more"
✗ "Get started" (overused)
✗ "Buy now" (too aggressive for SaaS)
```

---

## 3. CTA PLACEMENT

### Above the Fold
- Primary CTA visible without scrolling
- Pair with value proposition
- Repeat in sticky header for long pages

### After Value Sections
- Place CTA after features, testimonials
- Reinforce after proving value
- Match CTA to section context

### Final CTA Section
- Dedicated section before footer
- Summarize value proposition
- Largest CTA on page

```tsx
// Final CTA section pattern
<section className="py-24 bg-primary-600 text-white text-center">
  <h2 className="text-4xl font-bold mb-4">
    Ready to ship faster?
  </h2>
  <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
    Join 10,000+ developers who've simplified their workflow.
  </p>
  <div className="flex justify-center gap-4">
    <Button size="lg" variant="white">Start free trial</Button>
    <Button size="lg" variant="outline-white">Talk to sales</Button>
  </div>
  <p className="text-sm text-primary-200 mt-4">
    No credit card required • Cancel anytime
  </p>
</section>
```

---

## 4. CTA BUTTON DESIGN

### Size Guidelines
- **Large (lg)**: Hero sections, final CTA
- **Medium (md)**: Feature sections, cards
- **Small (sm)**: Inline, secondary actions

### Visual Weight
```css
/* Primary - maximum visual weight */
.btn-primary {
  background: var(--color-primary-600);
  color: white;
  box-shadow: 0 4px 14px -3px rgba(var(--color-primary-rgb), 0.4);
}

/* Secondary - medium weight */
.btn-secondary {
  background: transparent;
  border: 1px solid var(--color-gray-300);
  color: var(--color-gray-700);
}

/* Ghost - minimal weight */
.btn-ghost {
  background: transparent;
  color: var(--color-primary-600);
}
```

### Hover States (Required)
```css
.btn-primary:hover {
  background: var(--color-primary-700);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px -3px rgba(var(--color-primary-rgb), 0.5);
}

.btn-primary:active {
  transform: translateY(0);
}
```

---

## 5. CTA SUPPORTING ELEMENTS

### Trust Indicators Below CTA
```tsx
<Button>Start free trial</Button>
<div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
  <span>✓ No credit card required</span>
  <span>✓ Cancel anytime</span>
  <span>✓ 14-day free trial</span>
</div>
```

### Social Proof Near CTA
```tsx
<Button>Join 10,000+ developers</Button>
// or
<div className="flex items-center gap-2 mt-3">
  <div className="flex -space-x-2">
    {/* Avatar stack */}
    <img className="w-8 h-8 rounded-full ring-2 ring-white" />
    <img className="w-8 h-8 rounded-full ring-2 ring-white" />
    <img className="w-8 h-8 rounded-full ring-2 ring-white" />
  </div>
  <span className="text-sm text-gray-600">
    Trusted by 10,000+ teams
  </span>
</div>
```

### Urgency/Scarcity (Use Sparingly)
```tsx
<Button>Claim your spot</Button>
<p className="text-sm text-orange-600 mt-2">
  🔥 Only 12 spots left at this price
</p>
```

---

## 6. A/B TESTING PRIORITIES

### High Impact Tests
1. **CTA Copy**: Action verb variations
2. **Button Color**: Primary vs. contrasting
3. **Placement**: Above fold vs. after proof
4. **Size**: Large vs. medium

### Test One Variable
```
Control: "Start free trial"
Variant A: "Try free for 14 days"
Variant B: "Start building free"
Variant C: "Get instant access"
```

### Metrics to Track
- Click-through rate (CTR)
- Conversion rate (signups)
- Time to click
- Scroll depth before click

---

## 7. CTA BY PAGE TYPE

### Landing Page
```
Primary: "Start free trial" / "Get started free"
Secondary: "Watch demo" / "See how it works"
Final: "Ready to [benefit]? Start your free trial"
```

### Pricing Page
```
Free tier: "Get started" (no credit card)
Paid tier: "Start 14-day trial" (reduced commitment)
Enterprise: "Contact sales" / "Book a demo"
```

### Product Page (Logged Out)
```
Primary: "Sign up free"
Secondary: "See demo workspace"
```

### Blog/Content
```
Inline: "Try [feature] free →"
End of post: "Ready to [solve problem]?"
Sidebar: Newsletter signup
```

---

## CTA CHECKLIST

- [ ] One primary CTA per screen/section
- [ ] Action verb starts the CTA text
- [ ] Benefit or outcome is clear
- [ ] Visual hierarchy: primary > secondary > tertiary
- [ ] Hover state provides feedback
- [ ] Trust indicator near primary CTA
- [ ] CTA visible above the fold
- [ ] Final CTA section before footer
- [ ] Copy matches user's stage (awareness → consideration → decision)
- [ ] Mobile: Full-width buttons, thumb-reachable
