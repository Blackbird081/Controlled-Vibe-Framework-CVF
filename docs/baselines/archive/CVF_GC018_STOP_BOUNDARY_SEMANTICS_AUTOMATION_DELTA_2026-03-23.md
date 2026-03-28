# CVF GC-018 Stop-Boundary Semantics Automation Delta

Memory class: SUMMARY_RECORD
Status: canonical receipt for converting the new GC-018 marginal-value stop-boundary clarification into an enforced repository guard.

## Why

- `GC-018` already existed as the continuation gate, but the newly clarified low-yield continuation classes still depended on human interpretation.
- CVF needed machine enforcement so validation/test-only, packaging-only, and truth/claim-expansion continuation cannot continue by habit once marginal value becomes too small.

## What changed

- added `governance/compat/check_gc018_stop_boundary_semantics.py`
- extended `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md` with required semantic fields:
  - `Continuation class`
  - `Lateral alternative considered`
  - `Why not lateral shift`
  - `Real decision boundary improved`
- updated `governance/toolkit/05_OPERATION/CVF_DEPTH_AUDIT_GUARD.md` and `governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md`
- updated `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- added the new checker to:
  - local pre-push hook chain
  - GitHub Actions documentation workflow

## Outcome

- `GC-018` now has both a continuation-checkpoint gate and a stop-boundary semantics gate
- low-yield continuation classes must now justify why continuation still beats a lateral move
- CVF no longer relies only on manual review to detect low-value expansion patterns
