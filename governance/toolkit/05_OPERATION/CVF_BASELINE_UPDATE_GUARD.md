# CVF Baseline Update Guard

**Control ID:** `GC-015`
**Guard Class:** `QUALITY_AND_CONFORMANCE_GUARD`
**Status:** Active baseline-maintenance rule for every substantive CVF fix, update, or governance change.
**Applies to:** All substantive CVF fixes, updates, remediation waves, release-readiness changes, and governance changes that alter behavior, evidence posture, or comparison truth.
**Enforced by:** `governance/compat/check_baseline_update_compat.py`

## Purpose

- keep every accepted fix or update tied to a stable comparison anchor
- reduce future reconciliation cost by preserving an explicit before or after checkpoint
- stop release, review, or remediation claims from relying on memory or scattered logs alone

## Rule

After every accepted substantive fix or update, a baseline update MUST be performed.

Acceptable baseline update forms:

1. new baseline snapshot
2. baseline delta or addendum linked to the active baseline
3. post-fix assessment explicitly closing findings against a named pre-fix baseline

Plain logging alone is not sufficient. `docs/CVF_INCREMENTAL_TEST_LOG.md` remains required, but it does not replace baseline update.

### Trigger Conditions

Baseline update is mandatory when any of the following is true:

1. code behavior changed
2. governance rules changed
3. test or conformance expectations changed
4. phase, risk, or authority model changed
5. runtime wiring changed
6. a previously identified finding is partially or fully fixed
7. a release or readiness claim is updated

The common exception is a purely cosmetic text edit with no behavior, governance, evidence, scope, or decision impact.

### Minimum Required Contents

Every baseline update record must include:

- date
- scope
- changed area or module
- baseline reference being updated
- verification evidence used
- impact on previous findings
- current verdict or status
- next comparison anchor

Recommended fields:

- commit or commit range
- test, build, or conformance commands
- open risks not yet closed
- whether the record is a full snapshot or delta-only update

### Storage Rule

Choose the record type by intent:

- `docs/baselines/` for canonical comparison anchors
- `docs/assessments/` for pre-fix or post-fix closure against a baseline
- `docs/reviews/` when the baseline update is attached to an independent review chain

Do not overwrite historical baseline files. Prefer addendum or delta when a full snapshot is unnecessary, and make every delta point back to the active baseline it updates.

### Operational Rule

For each accepted fix or update, follow this sequence:

1. update code, docs, or tests
2. run required verification
3. update the active test log
4. create or append the baseline update artifact
5. link the new artifact from the related roadmap, review, or assessment when applicable

If step 4 is skipped, the change is governance-incomplete.

### Decision Matrix

- small fix with limited scope and no baseline boundary shift: create a baseline delta or addendum
- medium fix that closes explicit findings: create a post-fix assessment linked to the prior baseline
- large upgrade wave, new architecture posture, or changed release claim: create a new formal baseline snapshot

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_baseline_update_compat.py`
- local pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py`
- CI and documentation-governance workflows should block substantive changes that lack a matching baseline artifact

Strict command:

```bash
python governance/compat/check_baseline_update_compat.py --enforce
```

Exit codes:

| Code | Meaning |
|---|---|
| `0` | baseline update rule satisfied or no substantive update detected |
| `1` | script or runtime error |
| `2` | substantive update found without baseline update artifact |

## Related Artifacts

- `governance/compat/check_baseline_update_compat.py`
- `governance/compat/run_local_governance_hook_chain.py`
- `docs/CVF_INCREMENTAL_TEST_LOG.md`
- `docs/baselines/`
- `docs/assessments/`
- `docs/reviews/`

## Final Clause

If CVF claims a substantive change without updating its comparison anchor, the repository is asking future reviewers to trust narrative instead of evidence.
