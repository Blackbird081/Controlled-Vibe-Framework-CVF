# CVF GC-032 Delta - Governed Artifact Authoring Adoption

Memory class: SUMMARY_RECORD

## Purpose

- adopt one canonical authoring rule for all governed artifacts written by humans and AI agents
- turn roadmap and decision-pack drafting principles into enforced repo truth
- stop future evidence packets from drifting into narrative shorthand when contracts define typed provenance

## Implemented

- added `docs/reference/CVF_GOVERNED_ARTIFACT_AUTHORING_STANDARD.md`
- added `governance/toolkit/05_OPERATION/CVF_GOVERNED_ARTIFACT_AUTHORING_GUARD.md`
- added `governance/compat/check_governed_artifact_authoring.py`
- routed `GC-032` through policy, control matrix, session bootstrap, docs index, post-W7 drafting checklist, local pre-push hook chain, and CI
- kept typed-evidence enforcement paired with `governance/compat/check_docs_governance_compat.py`

## Outcome

- governed artifact writing now defaults to `source-truth first`
- typed evidence can no longer be downgraded into symbolic shorthand without failing governance
- future agents must route through the same canon before writing tranche packets, evidence docs, and continuity updates
