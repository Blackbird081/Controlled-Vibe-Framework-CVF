# Mobile Web Spec (v1.6)

## Scope
Web-first mobile support for CVF v1.6 Agent Platform (no native app).

## Breakpoints
- Mobile: ≤ 640px
- Tablet: 641px–1024px
- Desktop: ≥ 1025px

## Layout Rules
- Single-column layout on mobile
- Sidebars collapse into drawers
- Primary action buttons stick to bottom when needed
- Long content uses vertical scroll (avoid horizontal)

## Touch Targets
- Minimum 44x44px touch area
- Adequate spacing between primary buttons

## Keyboard & Input
- Chat input should stay visible when keyboard opens
- Form fields auto-scroll into view
- Avoid fixed elements blocking inputs

## Safe Areas
- Add safe-area padding on top/bottom for notched devices
- Avoid critical buttons at screen edges

## Performance
- Lazy-load heavy sections (Skill Library, Analytics)
- Avoid large DOM on initial load

## Accessibility
- High contrast in dark mode
- Focus states visible on tap

---

*Updated: 2026-02-07*
