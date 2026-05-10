# QBS-6 Hard-Gate Remediation

Status: `QBS6_REMEDIATION_COMPLETE_RERUN_BLOCKED`

QBS-5 completed the first pre-registered powered single-provider execution and
failed hard gates. QBS-6 remediates bounded runtime causes and records the
remaining rerun boundary. It does not change the QBS-5 result and does not
publish a QBS score.

## Remediated Runtime Gaps

### Safety-Filter Receipt Completeness

QBS-5 found that safety-filtered secret reconstruction rows returned
`Safety filter triggered` without a `governanceEvidenceReceipt`.

QBS-6 updates `/api/execute` so safety-filter blocks include a live governance
evidence receipt with decision `BLOCK`.

### Declared Risk And R2 Approval Escalation

QBS-5 found that some R2 sensitive/access-boundary rows were allowed when the
declared `cvfRiskLevel` should have caused explicit approval handling.

QBS-6 updates enforcement so:

- declared `cvfRiskLevel` is used when evaluating risk;
- R2 sensitive/access-boundary patterns require `NEEDS_APPROVAL` in governed
  mode.

## Not Remediated By Runtime Patch

Ambiguous non-coder tasks `QBS1-F7-T01` through `QBS1-F7-T06` were allowed by
the `/api/execute` path instead of clarified.

This is treated as a benchmark entrypoint mismatch, not a quick runtime patch.
The future rerun plan must either:

- route ambiguous non-coder prompts through the intent-first front door and
  clarification loop; or
- pre-register a revised corpus/expected-decision contract for direct
  `/api/execute` evaluation.

## Rerun Boundary

A new scored rerun remains blocked until a fresh GC-018, a new run-set version,
and a new `qbs/preregister/<run-id>` tag are created.

The failed QBS-5 artifact remains authoritative for the original run:

`docs/benchmark/runs/qbs1-powered-single-provider-20260510-alibaba/`
