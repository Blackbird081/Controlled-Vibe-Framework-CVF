# CVF P4 CP14 Publication Decision Delta — 2026-04-03

Memory class: SUMMARY_RECORD
Status: summary delta for P4/CP14 publication decision packet.

## Packet

- `P4/CP14` — publication decision for the first-wave shortlist
- Governing audit: `docs/audits/CVF_P4_CP14_PUBLICATION_DECISION_AUDIT_2026-04-03.md`
- Governing review: `docs/reviews/CVF_GC019_P4_CP14_PUBLICATION_DECISION_REVIEW_2026-04-03.md`

## Changes

- No implementation changes.
- No source file, export map, or package.json changes.

New docs only:
- `docs/audits/CVF_P4_CP14_PUBLICATION_DECISION_AUDIT_2026-04-03.md`
- `docs/reviews/CVF_GC019_P4_CP14_PUBLICATION_DECISION_REVIEW_2026-04-03.md`
- `docs/reference/CVF_PUBLICATION_DECISION_RECORD_2026-04-03.md`
- `docs/baselines/CVF_P4_CP14_PUBLICATION_DECISION_DELTA_2026-04-03.md` (this file)

## Decisions Made

| Decision | Value |
|---|---|
| Distribution model | `PRIVATE_MONOREPO + PUBLIC_MODULE_EXPORTS` |
| Registry | npm public registry |
| `CVF_v3.0_CORE_GIT_FOR_AI` package name | `cvf-core-git-for-ai` |
| `CVF_GUARD_CONTRACT` package name | `cvf-guard-contract` |
| `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` package name | `cvf-runtime-adapter-hub` |
| Initial version | `0.1.0` for all three |
| Versioning policy | semver `0.x`, no stability guarantee |
| GC-039 landing path | `HOLD` |

## Repo Truth After P4/CP14

| Candidate | exportReadiness | Distribution Model | Registry |
|---|---|---|---|
| `CVF_v3.0_CORE_GIT_FOR_AI` | `READY_FOR_EXPORT` | `PRIVATE_MONOREPO + PUBLIC_MODULE_EXPORTS` | npm |
| `CVF_GUARD_CONTRACT` | `READY_FOR_EXPORT` | `PRIVATE_MONOREPO + PUBLIC_MODULE_EXPORTS` | npm |
| `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` | `READY_FOR_EXPORT` | `PRIVATE_MONOREPO + PUBLIC_MODULE_EXPORTS` | npm |

## Next Safe Lane

- `P4/CP15` — publication implementation packet
- must run the pre-publish verification checklist (npm name availability, license, `better-sqlite3` optional install test)
- must define concrete npm publishing steps per package
- must produce governance artifacts for the actual publish event

## Related Artifacts

- `docs/reference/CVF_PUBLICATION_DECISION_RECORD_2026-04-03.md`
- `docs/baselines/CVF_P4_CP13_SHORTLIST_SECOND_READINESS_REASSESSMENT_DELTA_2026-04-03.md`
- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
