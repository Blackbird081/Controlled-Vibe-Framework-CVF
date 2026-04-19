# CVF App Redesign Remediation Roadmap

Date: 2026-04-19  
Status: Active remediation roadmap  
Source of truth for visual parity audit: `App onboarding/*.jsx`

## Goal

Bring the shipped CVF app-shell much closer to the design quality of the `App onboarding` redesign set without changing runtime behavior, API contracts, auth flows, execution paths, data flow, or governance logic.

## Audit Summary

### A. High-severity gaps

1. `Workspace shell containment` is broken.
   - `Landing Page` in the sidebar currently exits the in-app experience and opens the public `/landing` marketing route.
   - `/help`, `/docs`, `/skills`, `/skills/search`, and nested detail routes are still rendered as standalone surfaces instead of inside the redesigned dashboard shell.

2. `Workspace pages` are the furthest from the redesign source.
   - `Home` keeps the runtime logic, but the presentation is materially behind the `App onboarding/cvf-pages-home.jsx` reference in hierarchy, restraint, spacing, badge polish, and card composition.
   - `Landing` does not exist as an in-app page with parity to `App onboarding/cvf-pages-landing.jsx`.
   - `Skills`, `Skill Search`, `Help`, and `Docs` still use an older, public-page-style layout and look disconnected from the in-app shell.

3. `Navigation and copy polish` has drift.
   - New sidebar grouping keys are missing in i18n, which leads to raw keys like `nav.landing`, `nav.skillSearch`, and missing section titles in some renders.
   - Several labels still rely on emoji-era copy instead of the cleaner in-app redesign language.

### B. Medium-severity gaps

1. `Detail routes` are visually inconsistent with the shell.
   - `/docs/[slug]`
   - `/skills/[domain]/[skill]`
   - `/help/toolkit`

2. `Workspace page chrome` is inconsistent.
   - Some pages use standalone headers and footers that duplicate shell responsibilities.
   - The redesign source expects internal surface top bars and structured content cards instead.

3. `Platform / AI / Account` surfaces are closer to target than Workspace, but still need a second-pass polish review after Workspace is corrected.

## Surface-by-Surface Assessment

| Surface | Current state | Gap vs App onboarding | Priority |
|---|---|---|---|
| `Home` | Functional, but visually flatter and noisier | Missing top-bar cadence, refined filter rail, card polish, and premium hierarchy | P0 |
| `Landing Page` | Wrong route behavior; exits app shell | Must become an internal page | P0 |
| `Skills` | Functional, but not in shell parity | Needs internal top bar, stats row, richer card cadence | P0 |
| `Skill Search` | Useful logic, but looks like a utility page | Needs in-shell hero/search/result composition | P0 |
| `Help` | Content-rich, but old dark standalone guide page | Needs internal shell framing and cleaner card/FAQ composition | P0 |
| `Docs` | Works, but still looks like public docs hub | Needs shell integration and cleaner library presentation | P0 |
| `Docs Detail` | Functional | Needs shell consistency | P1 |
| `Skill Detail` | Functional | Needs shell consistency | P1 |
| `Help Toolkit` | Functional | Needs shell consistency | P1 |
| `History / Analytics / Governance / Simulation` | Already closer to redesign | Polish pass only after workspace lane | P2 |
| `AI / Account modals` | Closer to target | Verify after shell unification | P2 |

## Execution Order

### R1 — Shell Containment and Navigation Integrity

Scope:
- Route `Landing Page` to an in-app surface instead of public `/landing`
- Move workspace content routes into the dashboard shell:
  - `/help`
  - `/help/toolkit`
  - `/docs`
  - `/docs/[slug]`
  - `/skills`
  - `/skills/search`
  - `/skills/[domain]/[skill]`
- Fix sidebar app-state mapping for internal landing
- Fix missing i18n keys used by the redesigned sidebar

Acceptance:
- Clicking any workspace tab keeps the user inside the app shell
- No route opens the public marketing layout unless explicitly intended outside the app
- No raw translation keys appear in sidebar navigation

### R2 — Workspace Visual Parity Pass

Scope:
- Recompose `Home` browse state toward `App onboarding/cvf-pages-home.jsx`
- Build internal landing page based on `App onboarding/cvf-pages-landing.jsx`
- Re-skin `Skills`, `Skill Search`, `Help`, and `Docs` with:
  - in-shell top bars
  - calmer premium spacing
  - better card systems
  - stronger hierarchy and filter treatment

Acceptance:
- All workspace tabs feel like one product family
- Card density, spacing, and CTA hierarchy visibly improve
- No change to template execution, search logic, docs data, or help content semantics

### R3 — Detail Surface Consistency Pass

Scope:
- `Docs` detail
- `Skill` detail
- `Help toolkit`

Acceptance:
- Detail pages inherit the same in-shell design language
- Navigation back to parent library feels internal and consistent

### R4 — Platform / AI / Account Polish Review

Scope:
- Review already-delivered redesign tranches against the now-correct workspace baseline
- Tighten visual consistency only where needed

Acceptance:
- Cross-tab quality feels coherent, not tranche-by-tranche

## Verification Policy

This remediation remains `UI-only / zero-logic` unless a page move changes route ancestry. Verification rules:

- `npx tsc --noEmit`
- `npm run build`
- `eslint` on edited files
- Targeted `vitest` where relevant tests exist
- Manual behavior proof:
  - sidebar nav opens same intended experiences
  - template selection and execution flow unchanged
  - search/planner behavior unchanged
  - docs/help content still available
- Alibaba live runtime proof should be re-run after the tranche if AI-entry surfaces are materially touched

## Immediate Implementation Decision

Proceed now with:

1. `R1` in full
2. `R2` for the workspace lane:
   - `Home`
   - internal `Landing`
   - `Skills`
   - `Skill Search`
   - `Help`
   - `Docs`

Defer `R3/R4` to follow-on only if time remains after verification.
