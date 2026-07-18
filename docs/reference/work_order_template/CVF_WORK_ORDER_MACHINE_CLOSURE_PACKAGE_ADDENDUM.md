# CVF Work Order Machine Closure Package Addendum

Memory class: STANDARD_ADDENDUM

Status: ACTIVE_ADDENDUM

docType: reference

Owner: CVF orchestration and delegation surface

rawMemoryReleased: false

## Purpose

This addendum owns the Machine Closure Package table, Acceptance Receipt
Assertion Matrix, External Artifact Hash Manifest, and their associated rules
for CVF work orders.

Parent template:
`docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`

Folder index:
`docs/reference/work_order_template/README.md`

Applies to: work order section `## 6E.1 Machine Closure Package` and any work
order that scans, classifies, imports, maps, routes, closes, or hands off
governed work.

## Scope / Target / Owner Boundary

Target: work order section `## 6E.1 Machine Closure Package` and any work order
that scans, classifies, imports, maps, routes, closes, or hands off governed work.

Owner boundary: this addendum defines machine closure package structure and rules
only. It does not own runtime behavior, live proof, or public-sync scope.

## Applies To

Apply this addendum when a work order defines machine-readable outputs that turn
a worker result into the next loop's input.

Machine check:

```powershell
python governance/compat/check_machine_closure_package.py --base <baseHead> --head HEAD --enforce
```

## Machine Closure Package Table

Required closure package table:

| Closure item | Required artifact/path | Machine-readable evidence | Final status |
|---|---|---|---|
| Work order status | `docs/work_orders/<work-order>.md` | closed-equivalent status, no stale `DISPATCH_READY`, no unchecked required checklist residue, closure anchor policy recorded | `<PASS/BLOCKED/N/A with reason>` |
| Completion or reviewer artifact | `docs/reviews/<completion>.md` or `N/A with reason` | final disposition, changed-file evidence, claim boundary, gate evidence, reviewer-owned closure when `WORKER_MUST_NOT_COMMIT` | `<PASS/BLOCKED/N/A with reason>` |
| Roadmap state | `docs/roadmaps/<roadmap>.md` or `N/A with reason` | tranche row final status, next tranche dependency release state, no stale `READY_WITH_CONDITIONS` residue | `<PASS/BLOCKED/N/A with reason>` |
| Registry JSON | `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json` or `N/A with reason` | entry id, normalized paths, hashes, verdicts, gap ids, next action | `<PASS/BLOCKED/N/A with reason>` |
| Registry Markdown | `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.md` or `N/A with reason` | human quick lookup, negative-search note, next recommendation | `<PASS/BLOCKED/N/A with reason>` |
| External evidence digest | repo-local completion section or digest artifact | external path, schema/version, record count, hash, generated time, privacy boundary | `<PASS/BLOCKED/N/A with reason>` |
| System loop interlock | `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_*.json` or `N/A with reason` | upstream output, downstream input, learning/finding route, mutation boundary | `<PASS/BLOCKED/N/A with reason>` |
| Session continuity | `CVF_SESSION_MEMORY.md`, `CVF_SESSION/ACTIVE_SESSION_STATE.json`, active handoff | mode, next allowed move, handoff HEAD or accepted parent marker | `<PASS/BLOCKED/N/A with reason>` |

## Machine Closure Package Rules

- External workspace paths are evidence inputs, not source-authority rows. Do
  not put `D:\...`, local upload paths, or other non-repo paths in Source
  Verification. Record them in the External Evidence Digest with hash,
  schema/version, record count, and privacy boundary, then cite the repo-local
  digest in Source Verification if a later work order needs it.
- Corpus work that changes scan, classification, readiness, or gap state must
  update both GC-051 registry surfaces: the JSON is the machine input and the
  Markdown file is the operator/reviewer lookup. A report-only closure is not
  enough when the registry is the downstream input.
- Row names and final status tokens must follow:
  `docs/reference/CVF_WORK_ORDER_AUTHORING_HARDENING_ADDENDUM_2026-06-11.md`
- Closed-equivalent artifacts must not retain stale `DISPATCH_READY`,
  `READY_WITH_CONDITIONS`, `NOT_EXECUTED_YET`, `PRE_CLOSURE_NOT_RUN`, or
  placeholder dependency language unless the artifact is explicitly a
  pending-review worker handoff.
- If findings are recorded, use checker-accepted Finding-To-Governance defect
  classes only. `EVIDENCE_GAP` is not a defect class; use `RULE_GAP`,
  `MACHINE_GATE_GAP`, `ORCHESTRATOR_PACKET_GAP`, or
  `PHASE_GATE_PLACEMENT_GAP`. `N/A_WITH_REASON` is a disposition, not a defect
  class.
- The closure package must be updated after final gate reruns, not copied from
  pre-implementation or pending-worker evidence.
- If any roadmap path is cited in Authority Chain, Source Verification, Trace
  Matrix, or closure evidence, the Roadmap state row must name that roadmap and
  its final state. Do not mark Roadmap state `N/A with reason` when a roadmap
  path appears anywhere in the artifact.
- Receipt-based PASS claims must include an Acceptance Receipt Assertion Matrix
  comparing each required receipt value against the observed value. A query
  cannot pass if a required value and observed value differ.
- External evidence from a sibling workspace, local data folder, provider
  receipt, browser artifact, or generated file must include an External Artifact
  Hash Manifest with sha256 for every external artifact used as closure evidence.
- External evidence digest hash rules are defined in:
  `docs/reference/CVF_WORK_ORDER_AUTHORING_HARDENING_ADDENDUM_2026-06-11.md`
- When material closure and session-sync closure use different commits, record
  both ranges separately. Do not use a combined range that includes files outside
  Allowed scope unless explicitly authorized.

## Acceptance Receipt Assertion Matrix Template

| Query ID | Receipt artifact | JSON path | Required value | Observed value | Status |
|---|---|---|---|---|---|
| <AQ-id> | <path or digest section> | <receipt JSON path> | <required> | <observed> | <PASS/BLOCKED> |

## External Artifact Hash Manifest Template

| Artifact | Evidence role | sha256 | Generated or verified at | Status |
|---|---|---|---|---|
| <path or redacted path> | <script/receipt/data/etc.> | `sha256:<hex>` | <timestamp/command> | <PASS/BLOCKED> |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Claude worker |
| Provider or surface | Claude Code / IDE session |
| Session or invocation | 2026-06-16 CCLV-T1A work order template pointer refactor |
| Working directory | `d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | Write tool |
| Target paths | `docs/reference/work_order_template/CVF_WORK_ORDER_MACHINE_CLOSURE_PACKAGE_ADDENDUM.md` |
| Allowed scope source | CCLV-T1A work order; GC-023 maintainability extraction from template |
| Before status evidence | base `71b4f2ce`; file did not exist |
| After status evidence | file created; WORKER_MUST_NOT_COMMIT pending Codex review |
| Diff evidence | new file; no prior content |
| Approval boundary | GC-023 extraction; no runtime/provider/live/public scope |
| Claim boundary | repo-local trace only; no OS/user attribution |
| Agent type | Claude worker |
| Invocation ID | cclv-t1a-machine-closure-addendum-2026-06-16 |
| Expected manifest | `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`; `docs/reference/work_order_template/README.md`; `docs/reference/work_order_template/CVF_WORK_ORDER_SOURCE_VERIFICATION_ADDENDUM.md`; `docs/reference/work_order_template/CVF_WORK_ORDER_MACHINE_CLOSURE_PACKAGE_ADDENDUM.md`; `docs/baselines/CVF_GC018_CCLV_T1A_WORK_ORDER_TEMPLATE_POINTER_REFACTOR_2026-06-16.md`; `docs/reviews/CVF_CCLV_T1A_WORK_ORDER_TEMPLATE_POINTER_REFACTOR_WORKER_RETURN_2026-06-16.md` |
| Actual changed set | `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`; `docs/reference/work_order_template/README.md`; `docs/reference/work_order_template/CVF_WORK_ORDER_SOURCE_VERIFICATION_ADDENDUM.md`; `docs/reference/work_order_template/CVF_WORK_ORDER_MACHINE_CLOSURE_PACKAGE_ADDENDUM.md`; `docs/baselines/CVF_GC018_CCLV_T1A_WORK_ORDER_TEMPLATE_POINTER_REFACTOR_2026-06-16.md`; `docs/reviews/CVF_CCLV_T1A_WORK_ORDER_TEMPLATE_POINTER_REFACTOR_WORKER_RETURN_2026-06-16.md` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Claim Boundary

This addendum defines machine closure package structure and rules only. It does
not authorize runtime behavior, provider calls, live proof, public-sync, legacy
absorption, or autonomous mutation.
