# CVF LSC-T3 Fast Helper Readout

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-21

Path policy: stable reference-family file retained at an undated path; dated
closure evidence lives in the worker-return and completion-review artifacts.

EPISTEMIC_PROCESS_NA_WITH_REASON: reference contract - it defines readout
shape, signal source mapping, and blocking boundary; it makes no evidence
comparison claim requiring the full epistemic process block.

## Purpose

LSC-T4 defined when captured signals remain readout-only and when they cross
into governance action. Without a helper surface, agents cannot quickly see
which helper-detectable issues are present before spending time on deeper gates
or retrospective search.

LSC-T3 adds a read-only `signalReadout` list to the AAF Agent Automation Assist
helper so that any internal agent or future CLI/MCP-connected external agent can
quickly see:

- there are no helper-detectable signals in the current changed set; or
- the current changed set has advisory signals with source path, source surface,
  severity, repeat risk, LSC-T4 recommended outcome, next suggested action,
  blocker flag, and reason.

This keeps the LSC promise: fast capture, slow promotion. The readout surfaces
helper-detectable signals without running full gates or creating a durable ledger.

## Scope

**Applies to:** `governance/compat/run_agent_automation_assist.py` helper output
only. The `signalReadout` list is emitted at JSON and human output time from the
already-computed helper diagnostics inside `build_report`. It does not apply to
ledger store, generator, drift checker, durable store, CLI/MCP adapter,
read-receipt enforcement, or runtime Learning Plane mutation, which remain future,
separately authorized tranches per the Claim Boundary section.

## Readout Principles

| Principle | Rule |
|---|---|
| Read-only | The helper never writes, stages, commits, pushes, deletes, or runs provider/live calls. |
| Fast | Readout items are built from diagnostics already computed in `build_report`. The helper does not run full gates internally to produce the readout. |
| Advisory | Readout items recommend next actions. They do not block closure or execute promotion. |
| Local | The helper surfaces only changed-set helper-detectable signals. It does not query a historical ledger or global signal store. |
| LSC-T4 vocabulary | Each item uses one of the seven LSC-T4 outcome terms. Routine low/medium issues default away from `CLOSURE_BLOCKER`. |
| JSON-visible | `--json` output includes a stable `signalReadout` list. |
| Human-visible | Non-JSON output includes a concise Learning Signal Readout section. |
| No-signal cheap path | If no helper-detectable signal exists, the output shows a single no-signal line and `defects` remains unaffected. |
| No autonomous mutation | `autonomousMutationAuthorized=false` remains invariant. |

## Readout Item Shape

Each `SignalReadoutItem` carries these fields:

| Field | Type | Required behavior |
|---|---|---|
| `sourcePath` | string | changed path or `N/A_WITH_REASON` when not path-specific |
| `sourceSurface` | string | helper diagnostic surface: `work-order`, `corpus-completeness`, or `worker-experience` |
| `severity` | string | `low`, `medium`, `high`, or `critical`; defaults to `low` unless existing diagnostic severity is source-backed |
| `repeatRisk` | string | always `POSSIBLE` in LSC-T3 helper; `OBSERVED_REPEATED` must not be claimed without ledger/de-dup proof |
| `recommendedOutcome` | string | one of the seven LSC-T4 outcome vocabulary values |
| `nextSuggestedAction` | string | concise advisory text for the operator/reviewer/worker |
| `blocking` | boolean | `true` only if LSC-T4 blocker rules are satisfied; `false` for all routine helper-detectable items |
| `reason` | string | concise source-backed reason |

The `SignalReadoutItem` dataclass is defined in
`governance/compat/run_agent_automation_assist.py` as a helper-local frozen
dataclass. It is not a runtime API schema, ledger schema, or CLI/MCP adapter
field definition.

## Signal Source Mapping

The helper builds readout items from three existing diagnostic surfaces:

| Diagnostic source | Signal surface label | Default severity | Notes |
|---|---|---|---|
| `WorkOrderDiagnostic` (missing packet-shape contract) | `work-order` | `medium` | produced when a `WORKER_MUST_NOT_COMMIT` work order lacks the packet-shape contract section |
| `WorkOrderDiagnostic` (missing required terms) | `work-order` | `medium` | produced when required terms are absent from the packet-shape contract section |
| `WorkOrderDiagnostic` (missing conditional terms) | `work-order` | `low` | produced when conditional terms are absent and no N/A-with-reason is present |
| `CorpusDiagnostic` (missing corpus section) | `corpus-completeness` | `medium` | produced when an applicable output file lacks the corpus completeness section |
| `CorpusDiagnostic` (defective corpus section) | `corpus-completeness` | `low` | produced when the corpus section has missing fields, invalid verdict, or violations |
| Worker-experience retro diagnostic (missing or malformed token) | `worker-experience` | `low` | produced when an eligible worker-return artifact lacks the `WORKER_EXPERIENCE_RETRO` token |

Only items where the diagnostic is `not is_clean` produce signal readout entries.
Clean diagnostics produce no readout item. The no-signal path (empty `signalReadout`) is
the expected output when all diagnostics are clean or when no relevant files are changed.

## LSC-T4 Outcome Mapping

Each helper diagnostic surface maps to a fixed LSC-T4 recommended outcome based on
control gap kind (LSC-T4 Rule/Checker/Work-Order Candidate Split policy):

| Source surface | Condition | LSC-T4 recommended outcome | Rationale |
|---|---|---|---|
| `work-order` | missing packet-shape contract section | `CHECKER_CANDIDATE` | deterministic machine-verifiable gap; the AAF helper and dispatch-quality gate already catch it |
| `work-order` | missing required terms | `CHECKER_CANDIDATE` | deterministic machine-verifiable gap |
| `work-order` | missing conditional terms only | `READOUT_ONLY` | low-impact advisory gap; no governance action needed immediately |
| `corpus-completeness` | missing corpus section | `CHECKER_CANDIDATE` | deterministic machine-verifiable gap |
| `corpus-completeness` | defective corpus section | `READOUT_ONLY` | low-impact field-level advisory; gate will catch if submission |
| `worker-experience` | missing or malformed retro token | `READOUT_ONLY` | low-severity; gate already tracks; readout is advisory reminder |

All LSC-T3-generated readout items have `repeatRisk=POSSIBLE` and `blocking=False`.

## Blocking Boundary

LSC-T3 readout items must not block closure. This rule is non-negotiable.

| Condition | Blocking behavior |
|---|---|
| `severity=critical` from a helper-detectable surface | `blocking=True` is allowed; currently no helper surface reaches critical severity |
| `repeatRisk=OBSERVED_REPEATED` from ledger/de-dup confirmation | `blocking=True` is allowed; ledger does not exist yet; LSC-T3 cannot assert OBSERVED_REPEATED |
| All current LSC-T3 helper surfaces | `blocking=False`; readout is advisory only |

The `blocking=True` field exists in the shape for forward-compatibility when a future
LSC-T7 Latency Guard or operator-defined tightening condition is introduced. It must
not be set to `True` by the LSC-T3 helper for any currently-reachable diagnostic surface.

Routine `READOUT_ONLY` accumulation must not increase gate latency or be treated as
a closure risk.

## JSON And Human Output Contract

### JSON output (`--json` flag)

The `signalReadout` key is stable in the `AssistReport.to_dict()` output:

```json
"signalReadout": [
  {
    "sourcePath": "<changed-path>",
    "sourceSurface": "<surface>",
    "severity": "<low|medium|high|critical>",
    "repeatRisk": "POSSIBLE",
    "recommendedOutcome": "<LSC-T4-outcome>",
    "nextSuggestedAction": "<advisory text>",
    "blocking": false,
    "reason": "<source-backed reason>"
  }
]
```

When there are no signals, `signalReadout` is an empty list `[]`.

### Human output (no `--json` flag)

The human output includes a `Learning Signal Readout (LSC-T3)` section after
the defects section:

- **No signals:** `Learning Signal Readout (LSC-T3): no helper-detectable signals for current changed set.`
- **With signals:** prints count header and per-item severity, path, surface, outcome, and next action.

## Latency Budget

| Stage | LSC-T3 behavior |
|---|---|
| Readout item construction | reuses diagnostics already computed in `build_report`; no additional file reads or gate calls |
| No-signal path | one `tuple()` constructor call; zero additional computation |
| With-signal path | one pass over three existing diagnostic lists; O(n) where n = number of changed files |
| JSON serialization | list comprehension over `signal_readout` tuple; no additional I/O |
| Human output | print statements only; no additional I/O |

LSC-T3 adds zero gate delay. It does not run full governance gates internally.

## Parking Ledger

| Lane | Status | Relationship to LSC-T3 |
|---|---|---|
| LSC-T5 Learning Plane Bridge | parked; future operator-selected tranche | LSC-T3 readout items can seed LSC-T5 bridge when a later tranche implements it; LSC-T3 does not implement or reopen LSC-T5. |
| LSC-T6 External Agent CLI/MCP Signal Contract | parked; future operator-selected tranche | LSC-T3 `signalReadout` shape is a candidate input to LSC-T6 schema design; LSC-T6 is not implemented or reopened by LSC-T3. |
| LSC-T7 Latency Guard And Fast Path | parked; future operator-selected tranche | LSC-T7 enforces capture-fast/promotion-slow budget; LSC-T3 demonstrates the pattern by reusing existing diagnostics. |
| AAF-T6 Guard Orientation Read-Receipt Gate | parked | Not reopened by LSC-T3. |
| AAF-T7 friction-finding hardening | parked | Not reopened by LSC-T3. |
| CGE-T3 external knowledge ledger | parked | Not reopened by LSC-T3. |
| ACE-R1 Agent Coding Evidence Replay | parked | Not reopened by LSC-T3. |
| MLW7 / MLW8 | parked | Not reopened by LSC-T3. |
| Ledger store, generator, drift checker, durable store | not started | Not implemented or authorized by LSC-T3. |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reference contract for Learning Signal Chain work. No
public-sync remote, public commit, public artifact path, or public claim is
authorized.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | LSC-T3 fast helper readout reference contract and helper/test implementation only |
| claimDisposition | N/A with reason: no Delta execution-control claim is made |
| receiptEvidence | N/A with reason: no Delta receipt evidence is created or consumed |
| actionEvidence | N/A with reason: no runtime action is executed or observed |
| invocationBoundary | read-only local helper diagnostics only |
| interceptionBoundary | no direct IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | helper readout, unresolved local signal visibility, and next suggested action only |
| forbiddenExpansion | wrapper/proxy enforcement, arbitrary-command execution, EDIT/COMMIT execution, provider/live, public-sync, queue/daemon, watcher, readiness, full-hook equivalence, and universal control remain out of scope |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | worker role |
| Provider or surface | local workspace |
| Session or invocation | LSC-T3 worker execution, 2026-06-21 |
| Working directory | repository root |
| Command or tool surface | direct file read/write/edit tools |
| Target paths | `governance/compat/run_agent_automation_assist.py`; `governance/compat/test_run_agent_automation_assist.py`; `docs/reference/learning_signal_chain/README.md`; `docs/reference/learning_signal_chain/CVF_LSC_T3_FAST_HELPER_READOUT.md`; `docs/reviews/CVF_LSC_T3_FAST_HELPER_READOUT_WORKER_RETURN_2026-06-21.md` |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_LSC_T3_FAST_HELPER_READOUT_FOR_WORKER_2026-06-21.md`; `docs/baselines/CVF_GC018_LSC_T3_FAST_HELPER_READOUT_2026-06-21.md` |
| Before status evidence | HEAD `07f66934`; clean worktree before worker execution |
| After status evidence | five worker artifacts created/updated; uncommitted |
| Diff evidence | helper extended with SignalReadoutItem and readout logic; tests added; README updated; reference contract created; worker-return created |
| Approval boundary | worker role: update/create only the five required paths; no commit |
| Claim boundary | read-only helper readout and reference contract only; no runtime, ledger, or public-sync claim |
| Agent type | worker role |
| Invocation ID | `lsc-t3-worker-2026-06-21` |
| Expected manifest | `governance/compat/run_agent_automation_assist.py` (update); `governance/compat/test_run_agent_automation_assist.py` (update); `docs/reference/learning_signal_chain/README.md` (update); `docs/reference/learning_signal_chain/CVF_LSC_T3_FAST_HELPER_READOUT.md` (create); `docs/reviews/CVF_LSC_T3_FAST_HELPER_READOUT_WORKER_RETURN_2026-06-21.md` (create) |
| Actual changed set | same as expected manifest |
| Manifest delta | MATCH |

## Related Surfaces

- `docs/reference/learning_signal_chain/README.md` - reference front door
- `docs/reference/learning_signal_chain/CVF_LSC_T1_SIGNAL_LEDGER_SOURCE_LAYOUT_AND_DEDUP_CONTRACT.md` - field ownership and de-dup contract
- `docs/reference/learning_signal_chain/CVF_LSC_T2_MULTI_ROLE_CAPTURE_CONTRACT_AND_ELIGIBILITY_MATRIX.md` - role capture and eligibility contract
- `docs/reference/learning_signal_chain/CVF_LSC_T4_PROMOTION_THRESHOLD_POLICY.md` - promotion outcome vocabulary and blocking boundary
- `docs/roadmaps/CVF_LSC_T0_LEARNING_SIGNAL_CHAIN_RECONCILIATION_ROADMAP_2026-06-20.md` - chain reconciliation roadmap and LSC-T3 work plan row
- `governance/compat/run_agent_automation_assist.py` - helper implementation owner (`SignalReadoutItem`, `_build_signal_readout`, `AssistReport.signal_readout`)
- `governance/compat/test_run_agent_automation_assist.py` - focused tests for signal readout shape and output

## Claim Boundary

This contract defines the helper readout shape, signal source mapping, LSC-T4
outcome mapping, blocking boundary, and JSON/human output contract for the
LSC-T3 implementation in `run_agent_automation_assist.py` only. It does not
implement a ledger store, generator, drift checker, durable store, CLI/MCP
adapter schema, runtime Learning Plane mutation, provider/live proof, read-receipt
enforcement, public-sync, direct interception, wrapper/proxy enforcement,
queue/daemon, watcher, readiness, cost optimization, full-hook equivalence, or
universal governed-coding control.

`signalReadout` items are advisory labels. They do not authorize autonomous
mutation, rule changes, checker creation, or work order dispatch.
`autonomousMutationAuthorized=false` remains invariant.
