# CVF Pre-Public Curated Front-Door Navigation — 2026-04-02

Memory class: POINTER_RECORD
Status: canonical navigation map for the current pre-public front-door planning lane.

## Purpose

- define the intended entry flow for readers approaching CVF from the repository front door
- reduce structural noise without pretending private-core anchors should disappear
- separate mirror-compatible entry surfaces from private-core-only depth surfaces

## Core Rule

Curated front-door navigation means:

- a small set of intentional entrypoints becomes the preferred reading path
- deeper surfaces remain reachable, but not all of them should be first-click navigation

It does not mean:

- public mirror execution
- package publication
- hiding `v1.0/` or `v1.1/`

## Ring 1 — Root Front-Door Entry

These are the preferred first-click repository entrypoints.

- `README.md`
  - role:
    - primary repo landing page
    - audience triage
    - high-level product and governance framing
- `START_HERE.md`
  - role:
    - shortest redirect for first-time readers
    - fast handoff into `docs/GET_STARTED.md`
- `ARCHITECTURE.md`
  - role:
    - system-shape front door for architecture-minded readers
    - visual explanation before deeper internal references

## Ring 2 — Guided Orientation Paths

These are the preferred next-click destinations after the root front door.

### New Reader / General Evaluator

- `docs/GET_STARTED.md`
- `docs/guides/CVF_QUICK_ORIENTATION.md`

### Builder / Integrator

- `docs/concepts/controlled-execution-loop.md`
- `docs/reference/CVF_REFERENCE_GOVERNED_LOOP.md`
- `docs/guides/solo-developer.md`
- `docs/guides/team-setup.md`

### Non-Coder / Operator

- `docs/GET_STARTED.md`
- `docs/reference/CVF_NONCODER_REFERENCE_GOVERNED_PACKET.md`
- `docs/tutorials/agent-platform.md`

### Architecture Reader

- `ARCHITECTURE.md`
- `docs/reference/CVF_ARCHITECTURE_MAP.md`
- `CVF_ECOSYSTEM_ARCHITECTURE.md`

## Ring 3 — Support And Context Surfaces

These are valid support surfaces, but they should not dominate the first-click front door.

- `CVF_LITE.md`
  - short alternative redirect / lightweight orientation
- `CVF_ECOSYSTEM_ARCHITECTURE.md`
  - meta-vs-engineering separation and structural checkpoint view
- `CHANGELOG.md`
  - release/history support
- `LICENSE`
  - legal support
- learning zones:
  - `docs/guides/`
  - `docs/concepts/`
  - `docs/tutorials/`
  - `docs/cheatsheets/`
  - `docs/case-studies/`

## Private-Core-Only Depth Ring

These surfaces may remain important inside the private monorepo, but they are not first-wave front-door targets.

- `docs/INDEX.md`
- `docs/audits/`
- `docs/reviews/`
- `docs/baselines/`
- `docs/logs/`
- `docs/roadmaps/`
- `docs/CVF_ARCHITECTURE_DECISIONS.md`
- `docs/CVF_CORE_KNOWLEDGE_BASE.md`
- `AGENT_HANDOFF.md`
- `governance/compat/`
- `governance/toolkit/`

## Foundation Anchor Handling

- `v1.0/` and `v1.1/` remain visible private-core anchors
- they should stay discoverable through intentional depth navigation, not through first-click front-door emphasis
- front-door curation should reduce accidental attention on these roots without rewriting history or forcing relocation

## Mirror Compatibility Rule

The following front-door surfaces are the most mirror-compatible subset:

- `README.md`
- `START_HERE.md`
- `ARCHITECTURE.md`
- `CVF_LITE.md`
- `CVF_ECOSYSTEM_ARCHITECTURE.md`
- `docs/GET_STARTED.md`
- selected learning-zone docs already covered by the docs-mirror boundary

Private-core-only depth links must not be treated as public mirror defaults.

## Implementation Consequences

Any later front-door implementation packet should:

- keep `README.md` as the main landing page
- keep `START_HERE.md` and `CVF_LITE.md` as short redirect-style entrypoints rather than full duplicate explanations
- keep `ARCHITECTURE.md` as the visual architecture front door
- avoid linking first-time readers directly into audits, reviews, baselines, or dense internal registries
- keep foundation-anchor discovery explicit but one level deeper than the first-click path

## Related Artifacts

- `docs/reference/CVF_PREPUBLIC_DOCS_MIRROR_BOUNDARY_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_RESTRUCTURING_UNIFIED_AGENT_PROTOCOL.md`
- `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
- `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
