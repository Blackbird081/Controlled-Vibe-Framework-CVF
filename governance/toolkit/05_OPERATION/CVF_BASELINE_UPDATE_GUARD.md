# CVF Baseline Update Guard

**Effective date:** 2026-03-19  
**Scope:** All CVF-governed fixes, updates, remediation waves, and governance changes  
**Status:** Active  
**Enforced by:** `governance/compat/check_baseline_update_compat.py`

---

## 1. Purpose

This guard makes baseline maintenance mandatory after every accepted fix/update.

Reason:

- future reconciliation must compare against a known stable reference
- post-fix verification should not rely on memory or scattered logs only
- repeated re-audit cost must decrease over time
- policy-to-runtime drift must be easier to detect

---

## 2. Mandatory Rule

After every fix/update, a baseline update MUST be performed.

Acceptable baseline update forms:

1. new baseline snapshot
2. baseline delta/addendum linked to the active baseline
3. post-fix assessment explicitly closing findings against a named pre-fix baseline

Plain logging alone is NOT sufficient.

`docs/CVF_INCREMENTAL_TEST_LOG.md` remains required, but it does not replace baseline update.

---

## 3. Trigger Conditions

Baseline update is mandatory when any of the following is true:

1. Code behavior changed
2. Governance rules changed
3. Test/conformance expectations changed
4. Phase/risk/authority model changed
5. Runtime wiring changed
6. A previously identified finding is partially or fully fixed
7. A release/readiness claim is updated

This means the default assumption after a real fix/update is:

- update the baseline record

The only common exception:

- purely cosmetic text edits with no behavior, governance, evidence, scope, or decision impact

---

## 4. Minimum Required Contents

Every baseline update record must include:

- date
- scope
- changed area/module
- baseline reference being updated
- verification evidence used
- impact on previous findings
- current verdict or status
- next comparison anchor

Recommended fields:

- commit or commit range
- test/build/conformance commands
- open risks not yet closed
- whether this is a full snapshot or delta-only update

---

## 5. Storage Rule

Choose the record type by intent:

- `docs/baselines/`
  - when creating or refreshing a canonical comparison anchor
- `docs/assessments/`
  - when recording pre-fix/post-fix closure against a baseline
- `docs/reviews/`
  - when the baseline update is attached to an independent review chain

Important:

- do not overwrite historical baseline files
- prefer addendum or delta when a full snapshot is unnecessary
- every delta must point back to the active baseline it updates

---

## 6. Operational Rule

For each accepted fix/update, perform this sequence:

1. Update code/docs/tests
2. Run required verification
3. Update active test log
4. Create or append baseline update artifact
5. Link the new artifact from the related roadmap/review/assessment when applicable

If step 4 is skipped, the fix/update is governance-incomplete.

---

## 7. Decision Matrix

Use this matrix:

- Small fix, limited scope, no baseline boundary shift:
  - create baseline delta/addendum
- Medium fix, closes explicit findings:
  - create post-fix assessment linked to prior baseline
- Large upgrade wave, new architecture/runtime posture, or changed release claim:
  - create new formal baseline snapshot

---

## 8. Non-Compliance

If a fix/update has no baseline update artifact:

- reconciliation quality = degraded
- release/readiness narrative = incomplete
- future independent review must treat the change as weakly anchored

Recommended governance status:

- `PARTIAL` until baseline update is added

---

## 9. Relationship to Existing Records

This guard extends, not replaces:

- `docs/CVF_INCREMENTAL_TEST_LOG.md`
- `docs/baselines/CVF_CORE_COMPAT_BASELINE.md`
- pre-fix / post-fix assessments
- release gate and conformance evidence

The rule is:

- logs record execution history
- baselines record comparison anchors

Both are required when behavior actually changes.

---

## 10. Enforcement

### Automated Check

```bash
# Standard check (advisory)
python governance/compat/check_baseline_update_compat.py

# Strict enforcement (blocks on violation)
python governance/compat/check_baseline_update_compat.py --enforce
```

### Exit Codes

| Code | Meaning |
|:----:|---------|
| 0 | Baseline update rule satisfied or no substantive update detected |
| 1 | Script/runtime error |
| 2 | Substantive update found without baseline update artifact |

### Integration Points

- pre-push hook
- CI/CD documentation/governance workflow
- release-readiness review chain

### Recommended Local Activation

Use the provided installer to activate repository-managed hooks:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-cvf-git-hooks.ps1
```

This configures:

- `core.hooksPath = .githooks`
- local `pre-commit` enforcement chain for:
  - docs governance compatibility
- local `pre-push` enforcement chain for:
  - docs governance compatibility
  - bug documentation compatibility
  - test documentation compatibility
  - baseline update compatibility
- wrapper entrypoint: `governance/compat/run_local_governance_hook_chain.py --hook pre-commit`
- wrapper entrypoint: `governance/compat/run_local_governance_hook_chain.py --hook pre-push`
