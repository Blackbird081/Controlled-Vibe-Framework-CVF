# CVF Markdown Structural Completeness Guard

Memory class: POINTER_RECORD

**Control ID:** `GC-045`
**Guard Class:** `DOCS_AND_MEMORY_HYGIENE_GUARD`
**Status:** Active mandatory structure guard for new governed Markdown files.
**Applies to:** Humans and AI agents creating new governed Markdown files in
`docs/`, `governance/toolkit/`, `AGENT_HANDOFF*.md`, or repository-root
`CVF_*.md`.
**Enforced by:** `governance/compat/check_markdown_structural_completeness.py`

## Purpose

- make governed CVF documents consistently scannable and professional
- enforce required sections by artifact type before new Markdown enters canon
- stop agents from producing long but under-structured reports, specs, policies,
  contracts, roadmaps, or reviews

## Rule

New governed Markdown files must follow:

- `docs/reference/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_STANDARD.md`

At minimum, each new governed Markdown file must declare:

1. title
2. memory class
3. status
4. purpose
5. scope, target, owner, or applicability boundary
6. claim boundary, final clause, invariant, verification, or approval gate

The document must also satisfy the required section set for its artifact type.

## Enforcement Surface

- local pre-commit and pre-push hook chains run
  `governance/compat/check_markdown_structural_completeness.py`
- CI runs the same checker in the documentation workflow
- legacy dense documents are not retroactively blocked unless a later migration
  roadmap promotes or materially rewrites them

## Related Artifacts

- `docs/reference/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_STANDARD.md`
- `governance/compat/check_markdown_structural_completeness.py`
- `docs/reference/CVF_GOVERNED_ARTIFACT_AUTHORING_STANDARD.md`
- `governance/toolkit/05_OPERATION/CVF_GOVERNED_ARTIFACT_AUTHORING_GUARD.md`
- `governance/compat/check_governed_artifact_authoring.py`

## Final Clause

New governed Markdown without a clear structure is not ready to become CVF
truth, even when its claims are directionally correct.
