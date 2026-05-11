# QBS-38 Runtime Governance-Family Mapper

Status: `QBS38_RUNTIME_GOVERNANCE_FAMILY_MAPPER_READY_NO_NEW_SCORE`

QBS-38 implements runtime metadata for the QBS family context exposed by the
QBS-37 family diagnostics. It does not execute a live scored run, does not
change historical scores, and does not make an L4/L5 quality claim.

## Scope

QBS-38 targets the three chronic underperformance families found in QBS-37:

- `normal_productivity_app_planning`
- `builder_handoff_technical_planning`
- `cost_quota_provider_selection`

It also accepts all eight QBS corpus families when supplied by the benchmark
runner as explicit `qbsFamily` metadata. This covers all 48 QBS corpus tasks
without relying on natural-language guessing.

## Runtime Changes

- `src/lib/governance-family.ts` adds the bounded family taxonomy and resolver.
- `/api/execute` resolves `body.governanceFamily` before prompt construction
  and includes it in successful governance evidence receipts.
- `buildExecutionPrompt()` includes a governance-family line in the governance
  context when the family is known.
- `scripts/run_qbs_powered_single_provider.py` sends top-level `qbsFamily` for
  every benchmark task while preserving the existing `inputs.family` field.

## Boundary

The family value is metadata only. It is not a decision, score, reviewer label,
hard-gate override, provider-routing directive, or claim-ladder shortcut.

Full template-corpus family coverage remains deferred. QBS-38 maps trusted and
most-used templates for the three chronic families plus QBS runner-supplied
metadata for benchmark tasks.

## Verification

```bash
npm run test:run -- src/lib/governance-family.test.ts src/lib/execute-prompt-contract.test.ts
python -m py_compile scripts/run_qbs_powered_single_provider.py
python scripts/check_public_surface.py
git diff --check
```
