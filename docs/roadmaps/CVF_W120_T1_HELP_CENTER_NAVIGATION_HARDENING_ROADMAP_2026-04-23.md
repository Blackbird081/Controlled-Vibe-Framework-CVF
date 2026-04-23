<!-- Memory class: SUMMARY_RECORD -->

# CVF W120-T1 Help Center Navigation Hardening Roadmap

> Date: 2026-04-23
> Status: IN PROGRESS — CP1 DELIVERED
> Scope class: UX / NONCODER ADOPTION HARDENING
> Predecessor: W119-T1 CLOSED DELIVERED 2026-04-23
> Wave ID: W120

---

## 0. Why This Is Next

W119 proved a non-coder can complete a first useful governed workflow. Post-closure, a live inspection of the Help Center (`/help`) revealed 3 navigation bugs that directly break the noncoder's first self-guided session:

1. **Agent Chat card** → clicks to `/?open=agent` (root `app/page.tsx` = public LandingPage). The `?open=agent` query param is consumed by the dashboard layout (`(dashboard)/layout.tsx`), which `app/page.tsx` does not use. Noncoder gets a dead-end landing page instead of the chat modal.
2. **Self-UAT card** → no `link` property. Rendered as a non-clickable `<div>`. Noncoder cannot discover or launch Self-UAT from Help Center.
3. **Multi-Agent Workflow card** → no `link` property. Same issue.

These are not cosmetic gaps — they are entry-point failures for a noncoder who uses the Help Center as their first navigation layer.

---

## 1. Root Cause

`help-content.ts` `features[]` entries for Self-UAT and Multi-Agent Workflow were never given a `link`. The Agent Chat entry had a link pointing to the root route (`/?open=agent`) instead of the dashboard route (`/home?open=agent`).

The dashboard layout reads `useSearchParams().get('open')` and initialises `activeModal` accordingly:
```ts
// layout.tsx
const [activeModal, setActiveModal] = useState(() => {
    if (openParam === 'agent') return 'agent';
    if (openParam === 'multi-agent') return 'multi-agent';
    ...
});
```

The root `app/page.tsx` is outside the `(dashboard)` layout group and ignores query params entirely.

**Note:** The sidebar "AI Agent" and "Multi-Agent" nav items are NOT broken — they use `setActiveModal()` directly and work correctly.

---

## 2. CP1 — Immediate Fix (DELIVERED 2026-04-23)

### Delivered

Applied direct fix to `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/data/help-content.ts`:

| Card | Before | After |
|---|---|---|
| Agent Chat | `link: '/?open=agent'` | `link: '/home?open=agent'` |
| Self-UAT | no link (non-clickable) | `link: '/home?open=agent'` |
| Multi-Agent Workflow | no link (non-clickable) | `link: '/home?open=multi-agent'` |

Fix applied to both `vi` and `en` locale entries.

### Rationale — Self-UAT link target

Self-UAT is not a standalone page — it is a button inside `GovernancePanel.tsx` within the AgentChat modal. Directing the user to `/home?open=agent` opens the AgentChat modal where Self-UAT is accessible. This is the correct shallow-link target until a dedicated Self-UAT route exists.

### Acceptance

- [x] Agent Chat card navigates to `/home?open=agent` → dashboard layout opens AgentChat modal
- [x] Self-UAT card navigates to `/home?open=agent` → user lands in AgentChat where Self-UAT button is visible
- [x] Multi-Agent card navigates to `/home?open=multi-agent` → dashboard layout opens MultiAgentPanel modal
- [x] Fix applied in both `vi` and `en`

---

## 3. CP2 — Test Coverage for Help Content Links

### Deliver

Add a test file `src/data/help-content.test.ts` that asserts:

- Every `features[]` entry that is shown as a Help Center card (`features[0]`, `features[2]`, `features[5]`, `features[6]`) has a defined `link`.
- All `link` values that target modals follow the `/home?open=<modal>` pattern (not `/?open=<modal>`).
- No `link` points to the root `/` path with a query param (bypasses dashboard layout).
- Both `vi` and `en` locale entries have consistent link values.

This guard prevents future regression when help-content entries are updated.

### Acceptance

- Tests exist in `src/data/help-content.test.ts`.
- `npx vitest run src/data/help-content.test.ts` passes clean.
- Test failure message clearly names which feature entry and locale has the bad link.

---

## 4. CP3 — Help Center Navigation Audit

### Deliver

Audit all `href` / `link` values in the Help Center surface for similar issues:

- `help/page.tsx` `supportCards` — all 4 cards verified post-fix.
- `help/toolkit/page.tsx` — any internal links checked.
- Any `docs` data (`docs-data.ts`) that exposes internal navigation links.
- Confirm no other location uses `/?open=<modal>` instead of `/home?open=<modal>`.

### Acceptance

- No remaining `/?open=` patterns in navigable help/docs surfaces.
- Audit note filed in this document (see §7).

---

## 5. Verification Plan

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web

# CP2: link correctness unit tests
npx vitest run src/data/help-content.test.ts

# Regression: full unit suite
npx vitest run

# CP3: grep audit
grep -rn '/?open=' src/ --include="*.ts" --include="*.tsx"
```

---

## 6. Exit Criteria

W120-T1 closes when:

- CP1 fix is committed and live at vibcode.netlify.app/help.
- CP2 test file exists and passes.
- CP3 audit finds no remaining `/?open=` dead-link pattern.
- Full unit suite regression-clean.

---

## 7. Audit Log

### 2026-04-23 — CP1 hotfix applied

- Discovered during live Help Center inspection post-W119.
- `help-content.ts` patched for all 3 broken cards in both locales.
- Sidebar `AI Agent` and `Multi-Agent` items confirmed working (use `setActiveModal()` directly — not affected).
- No other `/?open=` patterns found in a quick grep of `src/`.
- CP2 test file and full CP3 audit are pending.
