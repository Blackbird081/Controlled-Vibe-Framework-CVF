# QBS-39 Family-Conditional ALLOW Output Contract

Status: `QBS39_FAMILY_CONDITIONAL_ALLOW_OUTPUT_CONTRACT_READY_NO_NEW_SCORE`

QBS-39 completes Track F2 after the QBS-38 runtime governance-family mapper.
It adds family-conditional output requirements for the three chronic
underperformance families found in QBS-37. It does not execute a live scored
run, mutate historical scores, or make a QBS quality claim.

## Scope

QBS-39 reads the resolved `governanceFamily` metadata from QBS-38 and adds a
bounded `Family Output Contract` prompt section for:

- `builder_handoff_technical_planning`
- `cost_quota_provider_selection`
- `normal_productivity_app_planning`

The contract is additive. It only guides the model when CVF proceeds to allowed
generation; it does not override BLOCK, CLARIFY, or NEEDS_APPROVAL decisions.

## Contract Additions

`builder_handoff_technical_planning` requires:

- files/modules likely to touch
- tests to add or run
- rollback step
- verification step
- security/data consideration
- explicit `unknown - requires repo inspection` when repo inspection is needed

`cost_quota_provider_selection` requires:

- no invented provider/model names
- no invented latency, accuracy, benchmark, quota, or cost numbers
- qualitative criteria and verification plan when measured data is missing

`normal_productivity_app_planning` requires:

- user-language preservation
- purpose, audience/users, scope, workflow
- minimum useful features or steps
- success measures, risks/constraints, and next actions
- non-technical framing unless implementation details are requested

## Verification

```bash
npm run test:run -- src/lib/execute-prompt-contract.qbs-allow-output.test.ts src/lib/governance-family.test.ts src/lib/execute-prompt-contract.test.ts
python scripts/check_public_surface.py
git diff --check
```

## Boundary

QBS-39 is output-contract remediation only. It adds no new scoring result, no
provider-parity claim, no family-level claim, and no L4/L5 claim. R10 remains
blocked until a separate pre-registration/checkpoint decision, and any live R10
execution still requires explicit `--confirm-live-cost`.
