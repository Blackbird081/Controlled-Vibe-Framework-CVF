# CVF Maturity Matrix

Status: operational maturity view for current CVF lines.

## Maturity Legend

| Level | Meaning |
|---|---|
| `reference` | historical or learning line kept mainly for lineage/reference |
| `baseline` | frozen or stable baseline line |
| `candidate` | active line with meaningful evidence, suitable for controlled use |
| `local-implemented` | implemented and locally verified, but still under current upgrade discipline |
| `draft` | exploratory or branch track, not current baseline |

## Matrix (2026-03-20)

| Version / Family | Maturity | Test / evidence posture | Release posture |
|---|---|---|---|
| v1.0 / v1.1 | baseline | historical baseline docs | frozen |
| v1.1.1 | candidate | integrated runtime + workflow realism hardening evidence | stable |
| v1.1.2 | local-implemented | focused remediation tests + delta chain | local-ready |
| v1.2 | baseline | policy lineage baseline | frozen |
| v1.2.1 | candidate | reassessed on 2026-03-06 | active |
| v1.2.2 | local-implemented | local implementation/evidence chain | local-ready |
| v1.3 | baseline | toolkit baseline | frozen |
| v1.3.1 / v1.4.x / v1.5.x | reference | lineage/reference only | legacy-reference |
| v1.5.2 | candidate | content library / active reference use | active-reference |
| v1.6 / v1.6.1 | candidate | active app/runtime line with canonical phase alignment evidence | active |
| v1.7 / v1.7.1 / v1.7.2 / v1.7.3 | candidate | stable safety family with test evidence | stable/active |
| v1.8 / v1.8.1 / v1.9 / v2.0 | local-implemented | implemented locally, not yet normalized into a single release narrative | local-ready |
| v2.5 | candidate | 476 tests across 14 files, 0 failures | active |
| v2.5.1 | candidate | 49 tests passed, unified governance types | active |
| v2.5.2 | candidate | 49 tests passed, programmatic enforcement | active |
| v3.0 | draft | branch-track evidence only | draft |

## Key Interpretation

- `candidate` means the line has enough evidence to be treated seriously in current baseline work
- `local-implemented` means the code/docs exist and may pass local verification, but whole-system closure and release narrative are not fully normalized yet
- this matrix is intentionally operational, not marketing-oriented
- the current active reference path should now be read together with the release-readiness checkpoint and the governed continuation roadmap, because the present wave is materially delivered and depth-frozen rather than broadly open-ended
