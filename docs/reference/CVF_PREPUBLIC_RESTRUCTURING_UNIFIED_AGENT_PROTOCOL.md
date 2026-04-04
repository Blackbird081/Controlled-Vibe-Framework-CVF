# CVF Pre-Public Restructuring — Unified Agent Protocol

Memory class: POINTER_RECORD
Status: binding restructuring governance protocol — all agents must follow when touching CVF repository structure, publication, or folder organization.

## Purpose

- unify restructuring rules into one canonical reference that all agents read before restructuring-related work
- prevent governance drift when different agents handle different sessions
- ensure the GC-027 intake review → rebuttal → decision-pack chain is respected as settled canon

## Binding Authority

This protocol was established through the canonical GC-027 multi-agent review chain:

1. Intake Review: `docs/reviews/CVF_MULTI_AGENT_INTAKE_REVIEW_PREPUBLIC_RESTRUCTURING_2026-04-02.md`
2. Rebuttal: `docs/reviews/CVF_MULTI_AGENT_REBUTTAL_PREPUBLIC_RESTRUCTURING_2026-04-02.md`
3. Decision Pack: `docs/reviews/CVF_MULTI_AGENT_DECISION_PACK_PREPUBLIC_RESTRUCTURING_2026-04-02.md`

Decision summary:

- `GO` for `P0-P2` preparation baseline and `GC-039` readiness baseline
- `GO` for one bounded `P3/CP1` retired-reference-root cleanup wave
- `HOLD` for any further `P3` physical relocation until a fresh `GC-019` packet is opened and `GC-039` passes for that concrete move set
- `HOLD` for any further `P3` physical relocation unless it also runs on a dedicated `restructuring/p3-*` branch and secondary git worktree
- `HOLD` for relocating `v1.0/` or `v1.1/`; current operator posture is to keep those dense frozen-reference roots in place

Commit lineage begins at `65a73a62` on `cvf-next` and remains canonically governed by the artifacts above.

## Rule 1: Phased Approach — No Skipping

| Phase | Status | What it does |
|---|---|---|
| `P0` | `CLOSED` | Inventory and lifecycle/exposure registry creation |
| `P1` | `CLOSED` | Root-level folder review and lifecycle posture |
| `P2` | `CLOSED` | Extension lifecycle cleanup and exposure tagging |
| `P3` | `PER-MOVE ONLY` | `P3/CP1` retired-root wave is delivered; any further relocation still requires fresh `GC-019` + `GC-039` |
| `P4` | **BLOCKED** | Public navigation + packaging + publication model selection |
| `P5` | **BLOCKED** | Retirement and archive closure |

Machine-readable source of truth:

- `governance/compat/CVF_PREPUBLIC_PHASE_GATE_REGISTRY.json`

No agent may authorize further P3 physical moves without a separate `GC-019` approval packet.
`GC-039` is also required, but it verifies readiness; it does not replace `GC-019`.
No agent may execute a further P3 physical move directly on `cvf-next`.

Executed move set already in canon:

- `P3 / CP1` — retire `CVF Edit/`, `CVF_Important/`, and `CVF_Restructure/` from the visible repo root while preserving optional local recovery under `.private_reference/legacy/`
- audit/review chain:
  - `docs/audits/CVF_P3_CP1_RETIRED_REFERENCE_ROOT_RETIREMENT_AUDIT_2026-04-02.md`
  - `docs/reviews/CVF_GC019_P3_CP1_RETIRED_REFERENCE_ROOT_RETIREMENT_REVIEW_2026-04-02.md`
- explicit freeze-in-place exclusions:
  - `v1.0/`
  - `v1.1/`

## Rule 2: Private by Default

CVF publication posture is `private-by-default, selective-publication-only`.

- do not assume the repository will become public
- do not push to any public mirror without explicit publication decision
- folder cleanup alone does not create selective download control
- if one GitHub repository is public, the repository contents can be cloned as a whole

Four publication models are ranked in priority order:

1. `PRIVATE_CORE + PUBLIC_DOCS_MIRROR` — recommended
2. `PRIVATE_MONOREPO + PUBLIC_MODULE_EXPORTS`
3. `PUBLIC_CORE_REDUCED + PRIVATE_ENTERPRISE_ADDONS`
4. `FULL_PUBLIC_MONOREPO` — highest risk, avoid as default

Canonical source: `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`

## Rule 3: Classification Must Be Respected

Every visible repository root directory, extension root, and root-level file is classified on two independent axes:

- **lifecycle class**: what is this root architecturally?
  - `ACTIVE_CANONICAL` | `MERGED_RETAINED` | `FROZEN_REFERENCE` | `RETIRE_CANDIDATE`
- **exposure class**: how may this root be published?
  - `PUBLIC_DOCS_ONLY` | `PUBLIC_EXPORT_CANDIDATE` | `INTERNAL_ONLY` | `PRIVATE_ENTERPRISE_ONLY`

Machine-readable registries:

| Registry | Path |
|---|---|
| Root directories | `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json` |
| Extensions | `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json` |
| Root files | `governance/compat/CVF_ROOT_FILE_EXPOSURE_REGISTRY.json` |
| Phase gates | `governance/compat/CVF_PREPUBLIC_PHASE_GATE_REGISTRY.json` |

## Rule 4: Export Readiness Is Not Export Approval

Extensions tagged `PUBLIC_EXPORT_CANDIDATE` have a secondary `exportReadiness` field:

| Level | Meaning | Current count |
|---|---|---:|
| `READY_FOR_EXPORT` | Ready to publish as standalone package | `0` |
| `NEEDS_PACKAGING` | Candidate but requires packaging work first | `13` |
| `CONCEPT_ONLY` | Thin facade or concept-level only | `1` |

No extension is currently `READY_FOR_EXPORT`. The tag `PUBLIC_EXPORT_CANDIDATE` means "possible candidate later", not "ship now".

## Rule 5: PUBLIC_DOCS_ONLY Requires Curation

Roots tagged `PUBLIC_DOCS_ONLY` are **not** mirror-safe as-is:

- `docs`: `CURATION_REQUIRED` — contains internal test logs (173KB), dense ADRs, governance records
- `public`: `CURATION_REQUIRED`

Before any public docs mirror is created, a content audit pass must confirm that only appropriate material goes into the mirror.

For dense frozen-reference roots:

- do not mirror `v1.0/` or `v1.1/` directly as public-orientation material
- use extracted docs such as `docs/reference/CVF_PUBLIC_STRUCTURE_OVERVIEW.md`

## Rule 6: Governance Enforcement Chain

Three controls enforce restructuring governance:

| Control | Guard | Checker | Scope |
|---|---|---|---|
| `GC-037` | Lifecycle Classification | `check_repository_lifecycle_classification.py` | Every root + extension must be lifecycle-classified |
| `GC-038` | Exposure Classification | `check_repository_exposure_classification.py` | Every root + extension must be exposure-classified |
| `GC-039` | P3 Readiness | `check_prepublic_p3_readiness.py` | Phase gates, root files, export readiness, content audit, timeline |

All three run in:

- local pre-push hook chain (`governance/compat/run_local_governance_hook_chain.py`)
- CI workflow (`.github/workflows/documentation-testing.yml`)

## Rule 7: What Agents Must NOT Do

1. move, rename, or relocate folders without `GC-019` structural audit
2. assume the repository will become public
3. treat `PUBLIC_EXPORT_CANDIDATE` as "ready to export"
4. treat `PUBLIC_DOCS_ONLY` as "safe to mirror as-is"
5. push to `main` — work on `cvf-next` only
6. create new root directories without lifecycle + exposure classification
7. skip governance checks when changing root or extension structure
8. decide publication model without reading `CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
9. execute future `P3` physical relocation directly on `cvf-next`
10. execute future `P3` physical relocation without a dedicated secondary git worktree
11. propose relocation of `v1.0/` or `v1.1/` under the current posture; these roots are freeze-in-place unless a separate preservation override is approved

## Rule 8: Re-assessment Timeline

- `Re-assessment-By: 2026-05-01`
- if a P3 proposal is drafted before that date, run `GC-039` first
- if no decision by that date, classification data needs re-assessment to avoid staleness

## When to Read This Protocol

Read this protocol when the current task involves:

- repository structure, folder organization, or cleanup
- public/private publication decisions
- packaging, export, or open-source strategy
- creating new root directories or extension roots
- proposing archive or retirement of any root
- P3 authorization discussion

## Canonical Artifact Chain

| Document | Path |
|---|---|
| Restructuring Roadmap | `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md` |
| Lifecycle Classification | `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md` |
| Exposure Classification | `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md` |
| Publication Decision Memo | `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md` |
| P3 Readiness | `docs/reference/CVF_PREPUBLIC_P3_READINESS.md` |
| GC-027 Intake Review | `docs/reviews/CVF_MULTI_AGENT_INTAKE_REVIEW_PREPUBLIC_RESTRUCTURING_2026-04-02.md` |
| GC-027 Rebuttal | `docs/reviews/CVF_MULTI_AGENT_REBUTTAL_PREPUBLIC_RESTRUCTURING_2026-04-02.md` |
| GC-027 Decision Pack | `docs/reviews/CVF_MULTI_AGENT_DECISION_PACK_PREPUBLIC_RESTRUCTURING_2026-04-02.md` |
| This Protocol | `docs/reference/CVF_PREPUBLIC_RESTRUCTURING_UNIFIED_AGENT_PROTOCOL.md` |

## Final Clause

Restructuring governance is settled canon. Agents may propose changes through a new GC-027 review chain, but may not bypass the current protocol unilaterally.
