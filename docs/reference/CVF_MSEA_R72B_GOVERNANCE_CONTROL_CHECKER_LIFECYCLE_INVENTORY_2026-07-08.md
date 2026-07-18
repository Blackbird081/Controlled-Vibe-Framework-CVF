# CVF MSEA-R72B Governance Control Checker Lifecycle Inventory

Memory class: governed-reference

Status: DRAFT_PENDING_REVIEW

Batch ID: MSEA_R72B_GOVERNANCE_CONTROL_INDEX_AND_CHECKER_LIFECYCLE_INVENTORY

executionBaseHead: 7f7bf1a0f

EPISTEMIC_PROCESS_NA_WITH_REASON: this is a checker-lifecycle inventory and
classification artifact; it records observed wiring evidence and
recommendations against a fixed schema, not an experimental prediction
compared against a live behavioral result.

## Purpose

Inventory the 186 direct `governance/compat/check_*.py` scripts, map each to
the Governance Control Index (GCI) family spine where source-backed, and
recommend a lifecycle candidate per the assessment's `harmIfIgnored`
question. This artifact classifies and recommends only. It performs no
checker deletion, disablement, retirement, consolidation, rename, or hook
edit.

## Scope

**Applies to:** the 186 files matching `governance/compat/check_*.py` at
`executionBaseHead=7f7bf1a0f`. Does not apply to `run_*.py` orchestrators,
`test_check_*.py` test files, or support modules, per the GCI Metric
Boundary. Does not apply to checker implementation, hook-chain edits, or
severity behavior change.

## Methodology And Evidence-Limit Disclosure

This inventory does not read all 186 checker source files line-by-line.
Given the tranche's no-commit, no-implementation scope, it uses a two-layer
method:

1. **Wiring evidence (mechanical, reproducible):** a Python scan of every
   `.py` file under `governance/compat/` for literal filename-stem
   occurrences of each checker, to determine whether the checker is
   referenced by any orchestrator, hook chain, autorun catalog, or sibling
   checker (submodule import). This scan was run three times with
   corrections after two methodology bugs were caught mid-inventory (see
   Finding-To-Governance Learning Disposition): a Windows path-separator
   bug that produced false 0/186 wired, and a `run_*.py`-only glob that
   missed `agent_*.py` catalog files and produced false negatives against
   checkers known to run (`check_mineru_receipt_boundary`,
   `check_adif_defect_registry_disclosure`). The corrected, final scan
   checks every `.py` file in `governance/compat/` against every other
   `.py` file in the same directory.
2. **Source-read evidence (qualitative, sampled):** direct reading of
   representative checker source in each family, plus targeted `grep`
   against `.github/workflows/` and `scripts/` for checkers not found wired
   inside `governance/compat/`, since some checkers run only via CI
   workflow or a standalone conformance script rather than the local hook
   chain.

Evidence limit: a checker found in this inventory's "wired" set is
confirmed to be referenced by name somewhere in the call graph, but this
inventory did not execute every checker to confirm it currently passes or
that its logic is still correct. A checker found "orphan" is confirmed
absent from every scanned call-graph surface (`governance/compat/*.py`,
`.github/workflows/*.yml`, `scripts/*.py`), but this inventory did not
check `governance/toolkit/`, IDE-integration configs, or undocumented
manual-run runbooks a human operator might still use by hand.

## Wiring Summary (Reproducible Count)

| Metric | Value | Command |
| --- | --- | --- |
| Total direct checkers | 186 | count of `governance/compat/check_*.py` |
| Wired (referenced by another `.py` in `governance/compat/`) | 134 | scan script comparing every checker filename stem against every other `.py` file's text in the same directory |
| Candidate orphan (not found in `governance/compat/*.py`) | 52 | same scan, complement set |
| Of the 52: referenced in `.github/workflows/*.yml` or `scripts/*.py` | 5 (`check_core_compat`, `check_enterprise_evidence_pack`, `check_release_manifest_consistency`, `check_conformance_release_grade`, `check_runtime_evidence_manifest`) | targeted `grep` against `.github/` and `scripts/` |
| Of the 52: true orphan (not found anywhere scanned) | 47 | same, complement |
| `cross_family_approval_artifact*` family total | 42 | `governance/compat/check_cross_family*.py` count |
| Of the 42: referenced only by a standalone, CI-unwired conformance script (`scripts/run_cvf_cross_family_packet_coverage_conformance.py`) | 33 | grep of that script's source for each family member's filename stem |
| Of the 42: referenced nowhere at all (not even the coverage script) | 9 | complement; all 9 are the deepest `..._provenance_attestation_provenance_freshness_proof...` chain members |
| Is `scripts/run_cvf_cross_family_packet_coverage_conformance.py` itself wired into any `.github/workflows/*.yml`? | No | `grep -rl` returned no match |

Note on the 5-count scope: `check_conformance_release_grade` is referenced by
`scripts/run_cvf_conformance_release_gate.py` and
`scripts/run_cvf_wave1_authoritative_sequence.py` (both `scripts/`, not
`.github/`), and `check_runtime_evidence_manifest` is referenced by four
`scripts/run_cvf_*_packet_conformance.py` files. Both are therefore "wired to
a script" but this inventory did not verify whether those scripts are
themselves invoked by CI, a documented command, or only by hand.

## Checker Family Inventory

Grouped by family/prefix where the GCI already owns a row, or by the
family's own naming convention where no GCI row exists yet. Family-level
rows are used per the R72 Routing instruction to expand to checker-level
child rows "only where cost/value evidence justifies it" - the
`cross_family_approval_artifact` family gets checker-level treatment below
because its internal cost/value variance (some members reachable via a
script, most not) is itself the finding.

| checkerPath (family or representative) | gciControlId | ownerSurface | enforcementPhase | riskClass | costClass | valueClass | overlapGroup | harmIfIgnored | recommendedSeverityPosture | evidenceLimit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `check_active_session_state.py` | GCI-001 | `CVF_SESSION_MEMORY.md`; `CVF_SESSION/ACTIVE_SESSION_STATE.json` | startup; session-sync; pre-commit | session-continuity | C2 | V4 | continuity | Yes: agents lose the ability to resolve current mode/handoff, causing wrong-context work across sessions (this exact class of harm occurred in the R72A tranche as a real, disclosed finding) | PROTECTED_KEEP_BLOCKING | none; GCI-001 already assigns PROTECTED |
| `check_agent_handoff_boundary.py`; `check_agent_handoff_guard_compat.py` | GCI-003 | `docs/reference/agent_handoff/README.md` | pre-dispatch; pre-implementation | session-continuity | C2 | V3 | continuity | Yes: an agent could act outside its authorized handoff boundary, silently expanding scope | KEEP_BLOCKING | none |
| `check_public_export_disposition.py` | GCI-004 | `docs/reference/CVF_AGENTS_CRITICAL_REPOSITORY_BOUNDARY_2026-06-23.md` | public-sync; pre-push; closure | public-boundary | C3 | V4 | public-boundary | Yes: this exact checker is the one whose citation gap in public-sync `AGENTS.md` R72A classified as the tranche's one real `GOVERNANCE_LOAD` finding, showing it protects a genuine public/private seam | PROTECTED_KEEP_BLOCKING | none; GCI-004 already assigns PROTECTED |
| `check_adif_defect_registry_disclosure.py`; `check_adif_entry_integrity.py` | GCI-006 | `docs/reference/agent_defect_intelligence/README.md` | pre-dispatch; pre-implementation | artifact-shape; repeated-defect | C2 | V3 | defect-memory | Yes, moderately: without disclosure, repeated defect patterns silently re-occur per-tranche instead of being tracked (this session's own R72A false positives are now ADIF-tracked evidence of the value) | KEEP_BLOCKING | none |
| `check_markdown_structural_completeness.py` | GCI-008 | `docs/reference/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_STANDARD.md` | pre-implementation; pre-commit | artifact-shape | C2 | V2 | authoring-shape | Partial: missing a heading synonym does not itself create a governance defect, but a genuinely incomplete review (no findings, no risk section) is a real gap this control catches; R72A hit this checker as a pure-ceremony false block (assessment Finding 2, round 2) on a document whose content was already complete | ADVISORY_CANDIDATE | GCI already marks this WATCH, eligible for calibration; this inventory's R72A evidence supports the same direction but does not itself change severity |
| `check_worker_experience_retrospective.py` | (no GCI row; new candidate GCI-016) | `governance/compat/check_worker_experience_retrospective.py` (self-contained, no separate standard) | pre-implementation (worker-return fast gate) | artifact-shape | C1 | V2 | authoring-shape; defect-memory | Partial: the retrospective's declared purpose (surfacing repeated friction into ADIF) has real value, and this exact checker's own bullet-prefix regex bug was the R72A round-7 false positive, now fixed at commit `ee8d2a605` | KEEP_BLOCKING with the false-positive already repaired; consider ADVISORY only if repeated false positives recur after the fix | fix verified independently in this tranche (see Finding-To-Governance Learning Disposition); no GCI row exists yet for this checker family, candidate for a future GCI update |
| `check_external_absorption_core.py`; `check_external_absorption_overlap_discipline.py`; `check_external_absorption_value_conversion.py` | GCI-009 | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` | pre-implementation; review | source-fidelity; product-value | C3 | V3 | external-intake | Partial: the underlying concern (do not silently absorb unreviewed external content) is real value, but this exact family's `github.com/`+`absorption` heuristic false-triggered on benign internal remote-URL evidence during R72A (assessment Finding 3, round 8), now fixed at commit `ee8d2a605` | KEEP_BLOCKING with the false-positive already repaired; GCI-009 already marks WATCH pending R72E risk-tier routing | fix verified independently in this tranche |
| `check_work_order_dispatch_quality.py` (+ 6 submodules: `_core`, `_artifacts`, `_lifecycle`, `_range`, `_source`, `_tables`) | GCI-002 | `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md` | pre-dispatch | source-fidelity | C3 | V4 | source-fidelity | Yes: this family is what caught the R72A work order's missing `Required Artifact Manifest` table before dispatch (assessment Finding 2, round 1), a real evidence-completeness gap, not cosmetic | PROTECTED_KEEP_BLOCKING | GCI-002 already assigns PROTECTED; the 6 submodules are correctly modularized implementation of one control family, not 6 independent controls, and should not be counted as separate GCI child rows |
| `check_worker_return_quality_gate.py` | (no GCI row; new candidate GCI-017) | `docs/reference/work_order_authoring/CVF_WORKER_RETURN_QUALITY_GATE_STANDARD.md` | pre-implementation (worker-return fast gate) | artifact-shape; source-fidelity | C3 | V2 | authoring-shape | Partial: requires 21 sections in a worker return; several (Source Verification, Command Evidence with PASS/FAIL disposition, No-Commit Statement) are evidence-integrity load-bearing, but several others (`Rescan Intelligence Hardening`, `Corpus Completeness And Report Integrity` on a tranche that is neither a rescan nor a corpus scan) are structurally required even when `NOT_APPLICABLE_WITH_REASON`, adding fixed per-return ceremony cost regardless of tranche size (directly observed cost in the R72A tranche, assessment Finding 2 round 6) | CONSOLIDATION_CANDIDATE for the always-N/A conditional sections; KEEP_BLOCKING for Source Verification, Command Evidence, and No-Commit Statement | recommend a future R72C-style routing where a no-commit `DOCUMENTATION_AND_EVIDENCE_ONLY` tranche below a size/risk threshold is not required to carry sections it will only ever mark N/A; no GCI row exists yet, candidate for a future GCI update |
| `check_cross_family_approval_artifact_*.py` (7 checker-level rows below) | (no GCI row) | none found: no standard, matrix, or README cites this family by name anywhere in `docs/` | none confirmed | unknown | unknown | unknown | approval-artifact-ceremony (self-contained, single-origin commit `7a6f909ef`) | See per-checker-level breakdown below | See per-checker-level breakdown below | No owning standard found; this is itself an evidence limit, not a confirmed absence, since this inventory did not exhaustively search every `docs/` file for an unindexed mention |

## Cross-Family Approval Artifact: Checker-Level Breakdown (42 files)

This family gets checker-level treatment because its internal cost/value
variance is the finding itself: the same 42-file family spans from
"referenced by a real coverage script" to "referenced nowhere at all,"
which a single family-level row would hide.

| Tier | Count | Definition | Representative harmIfIgnored | recommendedSeverityPosture |
| --- | --- | --- | --- | --- |
| Tier 1: referenced by `scripts/run_cvf_cross_family_packet_coverage_conformance.py`, which is itself not wired into any `.github/workflows/*.yml` | 33 | e.g. `check_cross_family_approval_artifact_authority.py`, `check_cross_family_approval_artifact_binding.py` | No: this inventory found no hook chain, autorun catalog, or CI workflow that runs these on any real dispatch/commit/push path; the coverage script that references them is itself not automatically triggered | CONSOLIDATION_CANDIDATE or R72F_RETIREMENT_REVIEW_CANDIDATE, pending confirmation of whether the coverage script is run manually by an operator (`HOLD_SOURCE_GAP` on that specific question) |
| Tier 2: referenced by nothing at all, not even the coverage script | 9 | the deepest chain members, e.g. `check_cross_family_approval_artifact_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness_proof_verification.py` | No: same as Tier 1, plus not referenced by the one script that does call most siblings | R72F_RETIREMENT_REVIEW_CANDIDATE (strongest candidate class in this entire inventory) |

Source-read evidence for the family's cost profile: `check_cross_family_approval_artifact_authority.py` (80 lines read) implements two output fields (`issuer`, `state`) over 3 packet-type branches. Its sibling
`check_cross_family_approval_artifact_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness_proof_verification.py`
(80 lines read) implements the same 3-branch structure but with field names and
prose notes that concatenate roughly 10 chained qualifier words (e.g.
`issuer_proof_authority_provenance_attestation_provenance_freshness_proof_verification`),
producing a longer file for materially the same decision logic. Both files
read the identical `DEFAULT_MANIFEST`/`DEFAULT_PACKET` pair
(`docs/reviews/cvf_phase_governance/CVF_W4_MULTI_RUNTIME_EVIDENCE_MANIFEST_2026-03-07.json`
and `CVF_RELEASE_APPROVAL_PACKET_LOCAL_BASELINE_2026-03-07.md`) across all 42
files (confirmed by `grep -l` returning all 42 paths for that manifest
filename). Git history shows all 42 files were introduced in a single commit
(`7a6f909ef`, a large March 2026 upgrade wave) and have never been modified
since.

## Other Notable Orphan-Candidate Checkers (Sampled, Not Exhaustive)

| checkerPath | ownerSurface found? | harmIfIgnored | recommendedSeverityPosture |
| --- | --- | --- | --- |
| `check_qbs_claim_gate.py` | Yes: `docs/work_orders/CVF_WO_QBS_METHOD_RELIABILITY_REMEDIATION_2026-06-06.md` and public-sync benchmark methodology docs cite it by role, though this inventory did not confirm an automated trigger path | Yes, if QBS claims are ever published: it is the only guard preventing an under-powered benchmark result from being presented as a stronger claim than its statistics support | KEEP_BLOCKING; owner surface exists, absence from `governance/compat/*.py` wiring appears to be a benchmark-release-time manual gate rather than an abandoned control |
| `check_dir_disposition_no_scan_overlap.py` | Yes: `docs/reference/CVF_DOCUMENT_INTELLIGENCE_ROUTER_CONTRACT_MATRIX_2026-06-13.md` and multiple `docs/reviews/CVF_DIR_T1/T2_...` artifacts cite it | Yes, if the two enum value-sets it compares (`AuthorizationGate`, `ScanRouteDisposition`) are ever allowed to silently overlap, routing logic could become ambiguous | KEEP_BLOCKING; owned control, evidence limit is automation wiring only, not value |
| `check_conformance_release_grade.py` | Yes: `scripts/run_cvf_conformance_release_gate.py`, `scripts/run_cvf_wave1_authoritative_sequence.py` | Not assessed in depth this tranche; has a real caller script, unlike the cross-family orphans | HOLD_SOURCE_GAP: recommend confirming whether the caller script itself runs in CI or only by hand before any severity recommendation |
| `check_core_compat.py`; `check_enterprise_evidence_pack.py`; `check_release_manifest_consistency.py` | Yes: all three appear in `.github/workflows/cvf-web-ci.yml` or `.github/workflows/documentation-testing.yml` | Not assessed in depth this tranche; these run in CI, which this inventory's `governance/compat`-only first-pass scan missed entirely | HOLD_SOURCE_GAP: this is itself a methodology finding - the initial wiring scan undercounted "wired" checkers by omitting `.github/workflows/` as a call-graph surface; a future R72B follow-up or R72D metric definition should include CI workflow files in the wiring scope, not just `governance/compat/*.py` |

## R72D Direct-Checker Metric Carry-Forward Guardrail

This inventory does not recompute or challenge the `checkerCount=186`
baseline recorded in the Governance Control Index `## Baseline Measurement`
section at commit `778adb4c3`. The wiring counts above (134 wired / 52
candidate-orphan / 42 cross-family / etc.) are a new, separate metric
layered on top of that baseline count, not a replacement for it. Any future
R72D monthly readout should treat "wired vs. candidate-orphan" as an
additional column, not a redefinition of the direct-checker baseline.

## R72F No-Silent-Zero-Retirement Guardrail

This inventory makes no retirement, deletion, disablement, or consolidation
claim. It recommends candidates only. Per the R72F closure rule, if a
future R72F tranche finds no `PROTECTED`-excluded candidate passes full
retirement criteria, that closure must still name at least one `WATCH` row
and the exact missing evidence. This inventory pre-stages that requirement
by naming the Tier 2 cross-family checkers (9 files, referenced nowhere at
all in this repository) as the strongest available `R72F_RETIREMENT_REVIEW_CANDIDATE`
class, with the missing evidence being: confirmation that
`scripts/run_cvf_cross_family_packet_coverage_conformance.py` (which does
not reference these 9) and any undocumented manual runbook are truly not
in use.

## Finding-To-Governance Learning Disposition

Two methodology defects were found and corrected during this inventory's own
authoring, both `MACHINE_GATE_GAP`-adjacent in spirit but actually
**agent-methodology** defects, not checker defects, since no CVF checker
enforces this inventory's own internal counting logic:

1. A Windows path-separator bug (`str.replace('governance/compat/', '')`
   against a `glob.glob()` result that used backslashes) silently zeroed out
   every match, producing a false "0/186 wired" result before being caught by
   cross-checking against a checker already known to run
   (`check_mineru_receipt_boundary.py`, observed executing live in the R72A
   session).
2. A `run_*.py`-only glob for orchestrator files missed `agent_*.py` catalog
   files (e.g. `agent_autorun_command_catalog.py`), producing a second false
   undercount, again caught by the same cross-check technique.

Both are recorded here as disclosure, not as a proposed new ADIF entry: they
are errors in this inventory's own one-off Python analysis script, not a
repeated CVF-checker-authoring pattern that would recur across future
governed artifacts. If a future R72B-style inventory is repeated and hits
the same two script-counting bugs again, that repetition would justify
promoting this to an ADIF entry per the standard's own bar for repeated
patterns.

## Public/Provenance Boundary

This inventory was authored entirely in the private provenance workspace.
No public-sync file was read, created, edited, staged, committed, or
pushed. All checker source reads were of files already present in the
provenance repository's `governance/compat/` directory.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance checker-lifecycle inventory. It does not change
public-sync, push public branches, or publish public artifacts.

## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | Claude (delegated worker) |
| Provider or surface | Claude Code CLI, local workspace |
| Session or invocation | R72B no-commit worker execution at `executionBaseHead=7f7bf1a0f` |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | Bash (git, ls, grep, python governance checkers, custom wiring-scan script), Read, Write |
| Target paths | this R72B inventory artifact only |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_MSEA_R72B_GOVERNANCE_CONTROL_INDEX_AND_CHECKER_LIFECYCLE_INVENTORY_2026-07-08.md` Write Ownership row for this exact path |
| Before status evidence | path did not exist before this worker execution; confirmed via `Test-Path`-equivalent check before authoring |
| After status evidence | this inventory artifact created uncommitted; HEAD unchanged |
| Diff evidence | `git status --short --untracked-files=all` shows this path as untracked |
| Approval boundary | worker-owned documentation output only; no implementation, merge, push, public-sync mutation, checker edit, hook edit |
| Claim boundary | repo-local worker trace only; no OS/user attribution, runtime behavior, public-release posture, or provider behavior claim |
| Agent type | Claude |
| Invocation ID | r72b-governance-control-index-checker-lifecycle-inventory-worker-2026-07-08 |
| Expected manifest | `docs/reference/CVF_MSEA_R72B_GOVERNANCE_CONTROL_CHECKER_LIFECYCLE_INVENTORY_2026-07-08.md` |
| Actual changed set | `docs/reference/CVF_MSEA_R72B_GOVERNANCE_CONTROL_CHECKER_LIFECYCLE_INVENTORY_2026-07-08.md` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Claim Boundary

This artifact records inventory, wiring evidence, and lifecycle
recommendations only. It does not implement, authorize, or claim checker
deletion, checker disablement, checker retirement, checker consolidation,
hook-chain severity split, public-sync mutation, merge, push, provider/live
proof, runtime/source/test/checker edit, product extraction, onboarding
changes, or release claims. All recommended severity postures are inputs
for a future R72C/R72F tranche with fresh operator authorization, not
implemented state.
