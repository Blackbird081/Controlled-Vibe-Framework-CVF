# CVF Publication Decision Record — 2026-04-03

Memory class: POINTER_RECORD
Status: canonical publication decision record for the first-wave shortlist.

## Decision

Distribution model: `PRIVATE_MONOREPO + PUBLIC_MODULE_EXPORTS`

- CVF monorepo remains private
- three first-wave shortlist candidates published as separate public npm packages
- no monorepo visibility change implied

## Registry

- npm public registry: `https://registry.npmjs.org`

## Package Names

| Candidate | Package Name | Initial Version |
|---|---|---|
| `CVF_v3.0_CORE_GIT_FOR_AI` | `cvf-core-git-for-ai` | `0.1.0` |
| `CVF_GUARD_CONTRACT` | `cvf-guard-contract` | `0.1.0` |
| `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` | `cvf-runtime-adapter-hub` | `0.1.0` |

## Versioning Policy

- semantic versioning (`semver`)
- `0.x.y` series: no API stability guarantee
- breaking changes permitted in minor versions during `0.x`
- `1.0.0` milestone requires a separate explicit governance decision
- patch releases `0.1.x`: non-breaking additive changes or bug fixes only
- each published version must correspond to a governance-authorized event

## GC-039 Landing Path

- Status: `HOLD`
- Reason: GC-039 semantics not yet extended to define a machine-compatible landing mechanism for isolated restructuring branches
- Publication may proceed from the restructuring lane without landing first
- Landing to `cvf-next` must be resolved in a dedicated GC-039 extension packet on the canonical lane

## License

- `CC-BY-NC-ND 4.0` — acknowledged in all three candidate READMEs
- non-commercial use only; no derivative works; attribution required
- implications must be reflected in npm registry listing

## Pre-Publish Verification Checklist

Before any package is published:

- [ ] npm package name availability verified for all three names
- [ ] `CC-BY-NC-ND 4.0` license reflected in npm listing
- [ ] `better-sqlite3` optional install behavior verified in clean install test for `cvf-guard-contract`

## Governing Packet

- Audit: `docs/audits/CVF_P4_CP14_PUBLICATION_DECISION_AUDIT_2026-04-03.md`
- Review: `docs/reviews/CVF_GC019_P4_CP14_PUBLICATION_DECISION_REVIEW_2026-04-03.md`
- Delta: `docs/baselines/CVF_P4_CP14_PUBLICATION_DECISION_DELTA_2026-04-03.md`

## Next Step

Publication implementation packet (`P4/CP15`):
- run the pre-publish verification checklist
- define concrete publishing steps per package
- produce governance artifacts for the actual publish event
