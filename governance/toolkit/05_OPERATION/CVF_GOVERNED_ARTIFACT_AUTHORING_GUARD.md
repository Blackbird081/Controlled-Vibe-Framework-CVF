# CVF Governed Artifact Authoring Guard

**Control ID:** `GC-032`
**Guard Class:** `DOCS_AND_MEMORY_HYGIENE_GUARD`
**Status:** Active mandatory authoring contract for governed artifacts written by humans and AI agents.
**Applies to:** All humans and AI agents creating or materially revising governed artifacts in `docs/`, `AGENT_HANDOFF.md`, and other canonical continuity surfaces.
**Enforced by:** `governance/compat/check_governed_artifact_authoring.py`, `governance/compat/check_docs_governance_compat.py`

## Purpose

- stop agents from improvising governed artifacts away from roadmap, contract, or continuity truth
- require source-truth-first writing whenever a document claims evidence, closure, or authorization posture
- make governed artifact quality an enforceable system rule instead of reviewer preference

## Rule

When writing or materially revising a governed artifact, the author MUST follow the canonical standard in:

- `docs/reference/CVF_GOVERNED_ARTIFACT_AUTHORING_STANDARD.md`

Minimum mandatory obligations:

1. read the authoritative source truth before writing
2. do not substitute summary prose for typed evidence when upstream contracts define typed fields
3. keep planning, execution, evidence, and continuity artifact roles separate
4. move tracker, handoff, closure, and other continuity surfaces together when posture changes
5. stop and escalate when the claimed source truth does not yet exist

This rule is especially strict for:

- `GC-018` continuation packets
- governed evidence batches
- acceptance-policy or benchmark baseline docs
- closure reviews
- tracker and handoff updates

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_governed_artifact_authoring.py`
- typed evidence and placement enforcement run through `governance/compat/check_docs_governance_compat.py`
- continuation-packet semantics remain enforced by `governance/compat/check_gc018_stop_boundary_semantics.py`
- local pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py`
- CI enforcement runs through `.github/workflows/documentation-testing.yml`

`GC-032` is a coordination rule across existing gates. It does not replace specialized guards; it forces authors to route through them correctly.

## Related Artifacts

- `docs/reference/CVF_GOVERNED_ARTIFACT_AUTHORING_STANDARD.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `docs/reference/CVF_POST_W7_GC018_DRAFTING_CHECKLIST.md`
- `governance/compat/check_governed_artifact_authoring.py`
- `governance/compat/check_docs_governance_compat.py`

## Final Clause

No governed artifact may claim more truth than its source can prove.
