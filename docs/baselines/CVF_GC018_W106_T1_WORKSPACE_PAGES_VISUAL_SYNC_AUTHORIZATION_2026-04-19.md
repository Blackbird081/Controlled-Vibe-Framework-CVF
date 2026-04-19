# GC-018 Authorization — W106-T1 Workspace Pages Visual Sync

**Date:** 2026-04-19
**Tranche:** W106-T1
**Class:** REALIZATION (UI-only variant)
**Lane:** Full Lane (GC-019)
**Memory class:** POINTER_RECORD (GC-022)
**Depends on:** W105-T1 CLOSED DELIVERED 2026-04-19
**Parent roadmap:** `docs/roadmaps/CVF_APP_REDESIGN_ROADMAP_V2_SYNTHESIZED_2026-04-19.md` §4

---

## 1. Scope

### 1.1 Pages — visual restyle only

| # | File | Lines (pre) | Action |
|---|------|------------|--------|
| 1 | `src/app/(dashboard)/home/page.tsx` | 485 | Restyle browse state: hero text block, filter bar container, category pill tabs, API key warning banner, governer starter path banner, search input, template grid wrapper. Zero logic changes. |
| 2 | `src/app/skills/page.tsx` | 224 | Restyle standalone page: header bar → dark `#0d0f1a` bg, feature cards, quick-task chips, section headers. Preserve `SkillLibrary` import and all callbacks. |
| 3 | `src/app/skills/search/page.tsx` | 241 | Restyle hero search block, quick-tag pills, results list, popular skills grid. Preserve `useRouter`, `SkillPlanner`, state unchanged. |
| 4 | `src/app/help/page.tsx` | 207 | Restyle standalone page: dark header (replace purple-gradient `from-slate-900 via-purple-900`), process step cards, FAQ items. Preserve `HELP_CONTENT` data + `useLanguage`. |
| 5 | `src/app/docs/page.tsx` | 255 | Restyle standalone page: sticky header → dark tokens, doc sidebar tree, content area. Preserve `DOCS` data, `activeCategory` state, `LanguageToggle`, `ThemeToggle`. |

### 1.2 Shared components — visual restyle only

| # | File | Lines (pre) | Action |
|---|------|------------|--------|
| 6 | `src/components/TemplateCard.tsx` | 97 | Restyle card: dark surface `bg-[#1a1d2e]`, border `border-white/[0.07]`, hover lift, colored icon box, reskin badges. Preserve all props and callbacks. |
| 7 | `src/components/CategoryTabs.tsx` | 45 | Restyle category pill tabs: dark bg, active = indigo accent. Preserve `activeCategory` / `onCategoryChange` props. |

### 1.3 New sub-components (if needed for GC-023)

New files may be created under `src/components/workspace/` only if a page's edited section would push it past the 700-line advisory threshold. Currently all files are well under threshold (max 485 lines), so sub-component extraction is **optional, not required**. If created, the same zero-logic contract applies.

Possible new files (if extracted):
- `src/components/workspace/HomeBrowseHeader.tsx` — hero text + filter bar section
- `src/components/workspace/HelpResourceCard.tsx` — individual resource card
- `src/components/workspace/DocSidebar.tsx` — docs tree nav (if docs page grows)

---

## 2. Binding constraints

```text
ZERO-LOGIC CONTRACT (W106-T1 specific)
---------------------------------------
FORBIDDEN EDITS:
- src/lib/**                    (business logic, i18n, analytics, governed-starter-path)
- src/app/api/**                (routes)
- src/data/**                   (help-content, docs-data, skills data — data files)
- middleware.ts, auth.ts
- package.json, package-lock.json, tsconfig.json
- vitest.config.ts, next.config.ts
- (dashboard)/layout.tsx        (W105 exception closed; not re-opened for W106)
- Any *.test.ts / *.test.tsx
- Component exported signatures (TemplateCard, CategoryTabs: no prop rename/removal)
- useEffect / useState / useMemo / useCallback and their dependency arrays
- WIZARD_MAP, handleSelectTemplate, handleFormSubmit and all workflow handlers in home/page.tsx
- workflowState enum values
- SkillLibrary.tsx, SkillPlanner.tsx (large components — visual changes only via CSS/Tailwind props if any)

ALLOWED EDITS:
- Tailwind classes, inline styles, CSS variables
- JSX structure (wrapping in containers, reordering decorative elements)
- Local-only cosmetic UI state (hover, expanded) if purely decorative
- Extracting sub-components to keep files within GC-023 thresholds
- Header bars on standalone pages (help, docs, skills) — full restyle allowed

STANDALONE PAGE HEADERS (skills, help, docs):
- These pages have their own standalone headers outside (dashboard) layout
- Header restyling allowed; ThemeToggle + LanguageToggle imports and rendering must be preserved
- Navigation links (href="/home" etc.) must not be changed
```

---

## 3. Architecture note — standalone vs. dashboard pages

**Important finding**: `skills/page.tsx`, `help/page.tsx`, `docs/page.tsx` are **not** inside the `(dashboard)` layout group. They have their own standalone page headers with `ThemeToggle`, `LanguageToggle`, and navigation links. The mockup (`cvf-pages-workspace.jsx`) renders these as sidebar-framed pages, but the implementation has them as standalone — this is a pre-existing routing decision that W106-T1 does NOT change.

**Decision**: Restyle standalone page headers to match the dark `#0d0f1a` design token palette (consistent with sidebar and CompactHeader from W105-T1), but preserve:
- Existing route structure (no URL changes)
- ThemeToggle and LanguageToggle components
- All navigation hrefs
- All data imports and i18n calls

---

## 4. Baseline snapshot (pre-W106-T1)

| Metric | Value |
|--------|-------|
| tsc --noEmit | Exit 0 (0 errors) |
| npm run lint | 4 pre-existing errors (all in untouched files, unchanged) |
| vitest | 2115 pass / 2 skip / 7 pre-existing live-test failures |
| npm run build | Green |

Pre-existing lint errors (frozen, unchanged):
- `src/app/landing/components/HeroVisualizer.tsx:51` — react-hooks/set-state-in-effect
- `src/app/landing/components/WorkflowVisualizer.tsx:54` — react-hooks/set-state-in-effect
- `src/app/landing/page.tsx:154` — react-hooks/set-state-in-effect
- `src/components/TemplateSuggester.tsx` — unused-var

Pre-existing test failures (frozen — require external infra):
- `pvv.nc.benchmark.test.ts` × 6 — require localhost:3000 dev server + Alibaba API
- `providers.integration.test.ts` × 1 — requires Gemini API key

---

## 5. Line-count pre-check (GC-023)

| File | Pre-edit lines | Advisory (700) | Hard (1000) | Action |
|------|---------------|----------------|-------------|--------|
| `home/page.tsx` | 485 | Under | Under | Edit in-place; extract if needed |
| `skills/page.tsx` | 224 | Under | Under | Edit in-place |
| `skills/search/page.tsx` | 241 | Under | Under | Edit in-place |
| `help/page.tsx` | 207 | Under | Under | Edit in-place |
| `docs/page.tsx` | 255 | Under | Under | Edit in-place |
| `TemplateCard.tsx` | 97 | Under | Under | Edit in-place |
| `CategoryTabs.tsx` | 45 | Under | Under | Edit in-place |

No pre-extraction required.

---

## 6. Expected deliverables (CP3)

1. GC-018 authorization: this document
2. CP1 audit: `docs/audits/CVF_W106_T1_CP1_WORKSPACE_PAGES_VISUAL_SYNC_AUDIT_2026-04-19.md`
3. CP1 delta: `docs/baselines/CVF_W106_T1_CP1_WORKSPACE_PAGES_VISUAL_SYNC_DELTA_2026-04-19.md`
4. Closure review: `docs/reviews/CVF_W106_T1_TRANCHE_CLOSURE_REVIEW_2026-04-19.md`
5. GC-026 closure sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W106_T1_CLOSED_2026-04-19.md`
6. AGENT_HANDOFF.md row

---

## 7. Stop conditions

- Any test that was passing now fails → REVERT
- `tsc --noEmit` produces any new error → REVERT
- Any edit requires touching `src/lib/**`, `src/data/**`, `src/app/api/**`, or test files → STOP
- A file crosses 1000 lines → extract sub-component FIRST before proceeding
- `SkillLibrary.tsx` or `SkillPlanner.tsx` visual changes would require touching logic → STOP (out of scope for W106-T1)

---

## 8. Authorization

**PENDING OPERATOR SIGN-OFF.**

This document is the CP0 gate. W106-T1 CP1 (implementation) must not start until the operator confirms authorization.
