# CVF P4 CP14 Publication Decision Audit — 2026-04-03

Memory class: FULL_RECORD
Status: approved publication decision for the first-wave shortlist after P4/CP13 readiness uplift.

## Scope

- choose the distribution model for the three `READY_FOR_EXPORT` shortlist candidates
- define the registry target for the chosen model
- define the versioning policy for first-wave publication
- record the GC-039 canonical landing path status

## Source Truth Reviewed

- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_P3_READINESS.md`
- `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
- `docs/baselines/CVF_P4_CP13_SHORTLIST_SECOND_READINESS_REASSESSMENT_DELTA_2026-04-03.md`

## Distribution Model Selection

The publication decision memo defines four options. This audit evaluates each against the current state of the three shortlist candidates.

**Option 1: `PRIVATE_CORE + PUBLIC_DOCS_MIRROR`**
Strengths: strongest IP protection; no code exposure. Weaknesses: no direct public code download of the three shortlist candidates. Assessment: does not serve the shortlist goal — the three candidates are module exports, not docs.

**Option 2: `PRIVATE_MONOREPO + PUBLIC_MODULE_EXPORTS`**
Strengths: keeps monorepo private; publishes only the three curated module packages; aligns directly with the first-wave shortlist and `PUBLIC_EXPORT_CANDIDATE` exposure classification; supports staged adoption without full-core disclosure. Weaknesses: requires ongoing release hygiene per package. Assessment: best fit for the current state — three packages with explicit export maps, documented boundaries, and `READY_FOR_EXPORT` status.

**Option 3: `PUBLIC_CORE_REDUCED + PRIVATE_ENTERPRISE_ADDONS`**
Assessment: requires a mature open-core product strategy not yet defined. Too broad for the current shortlist scope.

**Option 4: `FULL_PUBLIC_MONOREPO`**
Assessment: explicitly rejected by the publication decision memo as a first step. The monorepo contains internal governance density, lineage surfaces, and enterprise-private candidates that must not be exposed. Not considered.

**Selected model: `PRIVATE_MONOREPO + PUBLIC_MODULE_EXPORTS`**

Rationale: aligns with the second recommendation in the memo, directly supports the three `READY_FOR_EXPORT` shortlist candidates, and keeps the monorepo private.

## Registry Target

The three shortlist candidates are Node.js packages with standard `package.json` metadata. The natural public registry for this model is the npm public registry (`https://registry.npmjs.org`).

**Registry target: npm public registry**

Package names (from `package.json`):

| Candidate | Package Name |
|---|---|
| `CVF_v3.0_CORE_GIT_FOR_AI` | `cvf-core-git-for-ai` |
| `CVF_GUARD_CONTRACT` | `cvf-guard-contract` |
| `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` | `cvf-runtime-adapter-hub` |

Note: package name availability on npm must be verified before any publication attempt. Name conflicts require resolution before publishing.

## Versioning Policy

The three candidates are pre-stability releases. No API stability guarantee is appropriate at this stage.

**Versioning policy: semantic versioning (`semver`), initial version `0.1.0`**

- `0.x.y` series: no API stability guarantee; breaking changes are allowed in minor versions
- `1.0.0` milestone: requires an explicit separate governance decision
- patch releases (`0.1.x`): for non-breaking additive changes or bug fixes only
- all published versions must correspond to a governance-authorized publication event

Pre-release labels may be used for controlled rollout before `0.1.0` if desired, but no pre-release version is authorized by this packet.

## GC-039 Canonical Landing Path

The `restructuring/p3-cp2-retained-internal-root-relocation` branch holds structural changes (P3/CP2 relocation + P4 implementation) that are not yet on `cvf-next`. Bringing this branch onto `cvf-next` requires GC-039 to define a machine-compatible landing path for isolated restructuring branches.

**Status: HOLD**

Rationale:

- `P3/CP4` re-assessment concluded HOLD on the landing-path question for the same reason
- GC-039 semantics have not been extended to define an explicit landing mechanism
- no landing is authorized without a formal GC-039 extension packet on the canonical `cvf-next` lane

Impact on publication:

- publication of npm packages can be executed from the restructuring branch without requiring a landing to `cvf-next` first
- however, a landing must eventually happen to close the structural divergence between the two branches
- publication implementation is authorized only after an explicit publication authorization packet documents the publishing steps and governance artifacts

## Verification Checks

- [ ] npm package names must be checked for availability before any publish attempt
- [ ] `CC-BY-NC-ND 4.0` license implications must be acknowledged in the npm registry listing and package README (already done in P4/CP12)
- [ ] `better-sqlite3` optional dependency behavior must be verified in a clean install test before `cvf-guard-contract` is published

## Audit Result

`APPROVED`

## Consequence

`P4/CP14` establishes the publication decision baseline. Distribution model is `PRIVATE_MONOREPO + PUBLIC_MODULE_EXPORTS`. Registry is npm public. Versioning policy is `semver 0.x`. GC-039 landing path remains HOLD. A publication implementation packet (`P4/CP15`) may now proceed to define the concrete publishing steps.
