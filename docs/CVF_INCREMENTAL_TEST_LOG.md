# CVF Incremental Test Log

Memory class: SUMMARY_RECORD
docType: reference

Status: CURRENT

## Purpose

Record public-sync test activity for changed source/test batches. This public
log is intentionally compact and does not mirror private provenance logs.

## Scope / Target / Owner Boundary

Scope: public-sync verification summaries for changed public source, test,
guard, and documentation batches.

Target repository: `https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git`

Owner boundary: public command results and claim boundaries only. Raw provider
transcripts, private handoffs, and private provenance logs remain outside this
public log.

## Source / Predecessor Evidence

The 2026-05-31 entry is derived from commands run in this public-sync clone
after exporting the runtime-source subset from the private provenance
repository.

## Protocol / Contract / Requirements

Public-sync batches that add or modify test files must record the relevant
public verification commands here or in an archive linked from this log.

## Batch: Public Runtime Source Sync - 2026-05-31

Scope: exported runtime-source subset for Learning Plane route readouts,
finding-to-learning intake, provider-method support contracts, and governed
file-size guard hardening.

## Evidence / Verification

Commands:

- `npm run check` - PASS
- `npm run lint -- --quiet` - PASS with 0 errors and 3 warnings
- `npm run build` - PASS
- `npx vitest run src/app/api/learning-plane/readout/route.test.ts src/lib/finding-to-learning-bridge.test.ts src/app/api/execute/route.test.ts --reporter=dot` - PASS, 3 files / 48 tests
- `python governance/compat/test_check_governed_file_size.py` - PASS, 6 tests
- `python governance/compat/check_governed_file_size.py --enforce` - PASS
- `python governance/compat/check_docs_governance_compat.py --base d06e7e34a --head HEAD --enforce` - PASS
- `python governance/compat/check_markdown_structural_completeness.py --base d06e7e34a --head HEAD --enforce` - PASS
- `python governance/compat/check_public_export_disposition.py --base d06e7e34a --head HEAD --enforce` - PASS
- `git diff --check` - PASS with CRLF normalization warning for `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json`

Boundary: no new live provider call was made in the public-sync clone. Live
governance proof remains bounded to the private provenance receipts cited by
the matching public evidence packet.

## Enforcement / Verification

Current public compact-log structure and size are checked by `governance/compat/check_incremental_test_log_rotation.py --profile public`. Exact public change traceability is checked through the export manifest and current-candidate preflight. Historical commands below retain their original scope.

## Claim Boundary

This log records public-sync verification, including explicitly identified Local source/TEMP checks and public commit CI. It does not
claim production readiness, hosted readiness, provider parity, or new live
governance proof.

## Decision

Retain this compact public test log as the public-sync evidence index required
by the local test documentation guard for source/test-bearing public batches.

## Related Artifacts

- `docs/evidence/cvf-31-05-public-runtime-source-sync-2026-05-31.md`
- `docs/assessments/CVF_PUBLIC_RUNTIME_SOURCE_SYNC_ASSESSMENT_2026-05-31.md`
- `governance/compat/run_local_governance_hook_chain.py`

## Batch: Remaining Foundation Source Repair - 2026-10-26

Scope: the selected public software/doc profile repair. The following evidence came from Local source or disposable TEMP verification, not execution in the real public-sync worktree.

- Strict source ESLint:0errors/0warnings across1084candidates; TypeScript PASS.
- Affected Web behavior:565distinct targeted tests across38suites passed; SQLite native binding was rebuilt before its40-test verification.
- Windows private-profile/file-store/API:53synthetic NTFS tests in3suites passed without ACL-policy relaxation. This is host-bounded software proof.
- Native SDK integration: `PYTHONPATH=EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT python -m pytest EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/sdk/tests/integration -q` passed8cases.
- Existing checker public/private profiles: core45, retention/log/conformance37 and Enterprise8focused tests passed. Private defaults and missing-public-normative failure cases were retained.
- QBS CLI/helper/preflight: offline compilation, six existing completeness tests, helper parity and CLI help parity passed. Historical R10 remains reviewer-agreement failure with no public QBS claim; no new provider score was run.

Current source/change ownership is recorded in `docs/EXPORT_MANIFEST.md`. The exact public commit's GitHub checks carry final CI results. This entry does not anticipate their result, assert live AI governance, or declare a new GA or NCR product acceptance.
