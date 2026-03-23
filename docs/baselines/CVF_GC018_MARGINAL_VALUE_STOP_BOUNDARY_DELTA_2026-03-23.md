# CVF GC-018 Marginal Value Stop Boundary Delta

Memory class: SUMMARY_RECORD

Status: canonical receipt for extending `GC-018` from a generic depth-audit rule into an explicit stop-boundary rule for low-yield continuation classes.

## Why

- CVF already had `GC-018`, but the rule was still easy to read as a general deepening guard rather than an explicit stop-boundary for late-stage continuation waves.
- Recent validation/test expansion exposed a repeatable need: know when to stop local confidence hardening and shift laterally to a broader unresolved architecture or capability gap.
- The same pattern also applies to packaging-only continuation and truth/claim-expansion continuation.

## What changed

- expanded `governance/toolkit/05_OPERATION/CVF_DEPTH_AUDIT_GUARD.md` with explicit stop-boundary guidance for:
  - validation/test-only continuation
  - packaging/wrapper/facade-only continuation
  - truth-label / claim-expansion continuation
- updated `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md` to state that `GC-018` is the canonical stop-boundary rule for these low-yield continuation classes
- updated `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md` so the whitepaper roadmap now explicitly applies the same stop-boundary logic
- updated `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` so future-facing architectural continuation is no longer read as default-forward when marginal value has dropped

## Outcome

- CVF now has one clearer canonical rule for deciding when to stop local deepening and move laterally
- future test/validation waves should not continue by habit once confidence is already strong
- future packaging-only or claim-only continuation should not continue unless it changes a real decision boundary
