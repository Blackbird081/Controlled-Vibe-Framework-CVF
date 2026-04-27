<!-- Memory class: SUMMARY_RECORD -->

# CVF W126-T1 Trusted Form-Template Routing Expansion Roadmap

> Date: 2026-04-27
> Status: CLOSED DELIVERED — trusted form subset shipped; vitest 28/28 pass; release gate bundle PASS 7/7 on 2026-04-27
> Scope class: ROUTING COVERAGE EXPANSION / TRUSTED FORM ACTIVATION
> Predecessor: W122-T1 CLOSED DELIVERED 2026-04-27
> Intended follow-on: W124-T1 once clarification recovery is stable
> Authorization: `docs/reviews/CVF_W126_GC018_HANDOFF_2026-04-27.md`
> Wave ID: W126

---

## 0. Why This Is Next

W122 intentionally limited intent-first routing to the trusted wizard family.
That was the right move for a safe first wave.

The next routing expansion should happen only after the front door and recovery
story are stable. When it does happen, the highest-value expansion is not "all
templates"; it is a carefully selected trusted subset of form templates whose
activation can be made equally legible to non-coders.

> W126 expands routing coverage beyond the 9 wizards, but only into a bounded
> trusted form-template subset with explicit intent mapping and auditability.

---

## 1. Product Claim Target

W126 should make this bounded claim true:

> A non-coder can be routed not only to a trusted wizard, but also to a bounded
> trusted form-template path when that path is the better fit and the routing
> rationale is explicit.

This is bounded to:

- a selected trusted form-template subset
- explicit intent-to-template mapping
- no free expansion to the entire 42-form corpus

---

## 2. Current State Readout

After template canonicalization and W122:

- template quality is no longer the blocker
- routing currently knows only the 9 wizard-family targets
- the full form corpus still lacks a trusted noncoder routing contract

The gap is not template quality alone; it is controlled activation quality for
form templates.

---

## 3. Non-Goals

- No full-corpus form routing
- No ML ranking system
- No hidden heuristic expansion without explicit mapping review
- No trust downgrade on public front door

---

## 4. Checkpoints

### CP0 — Trusted Form Subset Audit

**Deliver**

Produce `docs/reviews/W126_TRUSTED_FORM_SUBSET_AUDIT.md` with:

- candidate forms
- exclusion reasons
- explicit trusted subset for W126

### CP1 — Intent Mapping Contract

**Deliver**

Define an explicit mapping layer for trusted forms:

- form target id
- activation rationale
- ambiguity boundaries
- when a wizard should still win

### CP2 — Routing Precedence Rules

**Deliver**

Lock precedence between:

- wizard-family route
- trusted form route
- clarification loop
- guided browse fallback

### CP3 — UI Activation And Explanation

**Deliver**

Ensure the user can understand why CVF routed them to:

- a wizard
- a direct form
- or browse/clarify instead

### CP4 — Coverage Evidence Pack

**Deliver**

Publish live evidence that trusted form routing expands coverage without
weakening safety.

---

## 5. Verification Plan

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web

npx vitest run \
  src/lib/intent-router.test.ts \
  src/lib/form-routing.test.ts

npx playwright test tests/e2e/trusted-form-routing.live.spec.ts

python scripts/run_cvf_release_gate_bundle.py --json
```

---

## 6. Exit Criteria

W126 closes only when:

- a trusted form subset is explicitly audited
- routing precedence is fixed and tested
- noncoder UI explains direct-form activation clearly
- live evidence proves the added coverage safely

---

## 7. Execution Locks

1. trusted form routing is opt-in by explicit audit only
2. wizard-family safety bar must not regress
3. unclear cases still prefer clarify/browse over speculative routing
