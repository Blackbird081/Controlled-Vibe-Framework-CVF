# CVF LPCI2-T11B Source Verification Report

Memory class: FULL_RECORD

Status: REVIEWED_PASS_BOUNDED

docType: source_verification_report

Date: 2026-06-07

workOrder: `docs/work_orders/CVF_AGENT_WORK_ORDER_LPCI2_T11B_POLICYLOCAL_SOURCE_VERIFICATION_FOR_CLAUDE_2026-06-07.md`

executionBaseHead: `08293726`

externalResultJson: `D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\Policy_Local\data\generated\policylocal-t11b-source-verification-result.json`

externalResultJsonSha256: `0d24870a43b0e33eecddae438d669983be508eff9ed4ca4e112ffb48870fd79d`

## Startup Acknowledgment

Startup acknowledged: current mode=lpci2_t11b_source_verification_dispatched; active handoff=AGENT_HANDOFF_V16_2026-06-06.md; next allowed move=execute T11B four-gate verification for 7 target files per amended work order; parked checkpoint=DEP2/Redis/receipt-anchor lanes remain parked.

## Purpose

Record the four-gate T11B source verification result for the 7 target files:
path fidelity, SHA-256 hash match, size match, and bundle role/lineage
reconciliation.

## Scope / Applies To

This report applies only to the 7 T11B target records named by the amended
work order. It uses local filesystem metadata, binary SHA-256 hashing, and
T11A manifest role/lineage evidence.

It does not apply to the 7 pre-CVF extracted text artifacts, 2 rendered output
variants, later document versions, online legal sources, current-law status,
extraction quality, corpus ingestion, runtime search, provider behavior,
public-sync, hosted readiness, production readiness, public readiness, or
release readiness.

## Source Inputs

| Source | Path |
|---|---|
| Candidate manifest | `D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\Policy_Local\data\generated\policylocal-t11-candidate-manifest.json` |
| Bundle manifest | `D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\Policy_Local\data\generated\policylocal-t11-real-use-case-bundle-manifest.json` |
| T11A candidate inventory | `docs/reference/CVF_LPCI2_T11_CANDIDATE_INVENTORY_2026-06-07.md` |
| T11A bundle inventory | `docs/reference/CVF_LPCI2_T11_REAL_USE_CASE_BUNDLE_INVENTORY_2026-06-07.md` |

## Verification Summary

| Metric | Value |
|---|---:|
| Total target files | 7 |
| All gates pass | 7 |
| Gate 1 path failures | 0 |
| Gate 2 hash failures | 0 |
| Gate 3 size failures | 0 |
| Gate 4 role/lineage failures | 0 |
| Read errors | 0 |

## Four-Gate Result Table

| ID | Candidate ID | Bundle ID | Gate 1 testPathResult | Fallback | Gate 2 computedHashSha256 | Gate 2 t11aManifestHashSha256 | Gate 3 observedSizeBytes | Gate 3 t11aManifestSizeBytes | sizeMatch | bundleArtifactRole | lineageParentIds | roleLineageMatch | verificationResult |
|---|---|---|---|---|---|---|---:|---:|---|---|---|---|---|
| 1 | `T11A-CAND-001` | `BNDL-001` | `true` | `false` | `61fafa4b69e9b0423c9bd3533ba6b5be531b9b73c26c6cfb62933008bfecc4d5` | `61fafa4b69e9b0423c9bd3533ba6b5be531b9b73c26c6cfb62933008bfecc4d5` | 842159 | 842159 | `true` | `source_input` | `[]` | `true` | `HASH_MATCH` |
| 2 | `T11A-CAND-002` | `BNDL-002` | `true` | `true` | `2e7ed68a7814ff04e8246dbfb179f928d4d952b30169685f73115f2702459adc` | `2e7ed68a7814ff04e8246dbfb179f928d4d952b30169685f73115f2702459adc` | 933326 | 933326 | `true` | `source_input` | `[]` | `true` | `HASH_MATCH` |
| 3 | `T11A-CAND-003` | `BNDL-003` | `true` | `true` | `265047c2ca26b13f2c6212313f550f3ce0f66f85bd7470ec9c3618d4c54cb4f6` | `265047c2ca26b13f2c6212313f550f3ce0f66f85bd7470ec9c3618d4c54cb4f6` | 45314 | 45314 | `true` | `source_input` | `[]` | `true` | `HASH_MATCH` |
| 4 | `T11A-CAND-004` | `BNDL-004` | `true` | `false` | `cf4fa584fc62ea1edc9c9d27e7396040c7036b2f313c8f5586df04d5529ee46e` | `cf4fa584fc62ea1edc9c9d27e7396040c7036b2f313c8f5586df04d5529ee46e` | 537770 | 537770 | `true` | `source_input` | `[]` | `true` | `HASH_MATCH` |
| 5 | `T11A-CAND-005` | `BNDL-005` | `true` | `true` | `47460fdfbdde10d69ae4838b711e086f4037cfd2609d6a4263caefbb1e9fabe7` | `47460fdfbdde10d69ae4838b711e086f4037cfd2609d6a4263caefbb1e9fabe7` | 1292455 | 1292455 | `true` | `source_input` | `[]` | `true` | `HASH_MATCH` |
| 6 | `T11A-CAND-006` | `BNDL-007` | `true` | `false` | `4522d37bf8da78fb41d01d97cdb2bff3f7133af2b02e146f3537132ce603bee6` | `4522d37bf8da78fb41d01d97cdb2bff3f7133af2b02e146f3537132ce603bee6` | 1076338 | 1076338 | `true` | `source_input` | `[]` | `true` | `HASH_MATCH` |
| 7 | `N/A` | `BNDL-006` | `true` | `false` | `29281becea319d5985298cd34a6a66a6b1e2a051a4f157a254d18aebfa734806` | `29281becea319d5985298cd34a6a66a6b1e2a051a4f157a254d18aebfa734806` | 15248 | 15248 | `true` | `agent_request` | `[]` | `true` | `HASH_MATCH` |

## Unicode Drift Evidence

`Test-Path -LiteralPath` was used for all filesystem path checks.

Fallback was required for `BNDL-002`, `BNDL-003`, and `BNDL-005`. The direct
candidate manifest path did not resolve literally for these three records, so
the verifier loaded the exact `relativePath` from the T11A bundle manifest,
joined it to `bundleRoot`, retested with `Test-Path -LiteralPath`, and then
computed hash/size only after fallback path resolution succeeded.

This confirms the T11A path-normalization drift risk is real. It is bounded
because the fallback files match the T11A manifest hashes and sizes exactly.

## Command Evidence

| Command / action | Result |
|---|---|
| `git rev-parse --short HEAD` | `08293726` |
| `git status --short` before verification | clean |
| `python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-implementation --base 08293726 --head HEAD` | PASS after allowed work-order override remediation |
| `Test-Path -LiteralPath` | final PASS for 7/7 records |
| SHA-256 binary stream, 65536-byte chunks | 7/7 hashes match T11A manifest |
| `Get-Item -LiteralPath .Length` | 7/7 sizes match T11A manifest |
| JSON parse check | PASS, schema `policylocal.sourceVerification.t11b.v1`, 7 file records |

## Claim Boundary

T11B proves only that the 7 resolved local files matched T11A manifest hash,
size, role, and lineage expectations at execution time. It does not prove body
readability, OCR correctness, extraction quality, source authenticity, legal
authority, current-law status, legal advice quality, corpus ingestion
eligibility, search behavior, provider behavior, hosted readiness, production
readiness, public readiness, or release readiness.
