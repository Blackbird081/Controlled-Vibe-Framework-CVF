# CVF Golden Downstream Bootstrap — Work Order Amendment 1

- Work order: `CVF-BSL-T1-WO`
- Amendment: `CVF-BSL-T1-WO-A1`
- Date: 2026-07-23
- Status: AUTHORIZED
- Authority: independent REVIEWER finding BSL-R7

## Finding

The new bootstrap and doctor depend on catalog/helper surfaces that must be
part of the public workspace kit. The public-core reconciler owns the
post-clone completeness list, but its path was not in the original changed-set
ceiling. Without that path, the worker cannot close BSL-R7.

## Amendment

Add exactly this path to the changed-set ceiling:

```text
scripts/update_cvf_workspace_public_core.ps1
```

Authorized changes in that file are limited to public-kit completeness for
the new golden downstream catalog surfaces and directly related testable error
detail. No reconciliation algorithm, backup behavior, Git history handling or
manifest-update behavior may change.

No other scope, exclusion, role, evidence, provider or commit authority
changes.
