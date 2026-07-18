# CVF Legacy Absorption Coverage Index - 2026-06-13

Memory class: FULL_RECORD

Status: SEED_ACTIVE_PENDING_WORKER_VERIFICATION

docType: reference

Owner: CVF Governance Control Chain

## Purpose

Track whether CVF plane upgrades, workflow-chain systems, and foundation
planning packets have resolved relevant legacy knowledge before they proceed.

This index prevents three recurring failures:

1. A plane is upgraded from current source only while matching legacy material
   remains undispositioned.
2. A worker repeats legacy absorption already completed by a prior LHW,
   CI1, MLW, MEMCON, or FPC packet.
3. A later planner cannot tell whether a legacy family was absorbed, rejected,
   deferred, or never checked for that plane.

This index is not the corpus scan registry. It is a plane/workflow-chain
coverage index that points to corpus registry entries, legacy absorption
packets, work orders, reviews, and current owner surfaces.

## Scope / Target / Owner Boundary

In scope:

- foundation planes and workflow-chain systems;
- Model Gateway, provider routing, and Execution Plane provider boundaries;
- Memory / Knowledge / Scan layer coverage;
- AOT and co-work trace supervision coverage;
- retroactive coverage status for FPC, MEMCON, MLW, CI1, DIR, DICE, DSCP, EX,
  EXA, ERH, and future foundation packets.

Out of scope:

- runtime/source/test mutation;
- provider/API or live proof;
- public-sync;
- production, public readiness, cost, quality, or benchmark claims;
- broad legacy content reading outside a fresh GC-018 or equivalent governed
  absorption packet;
- treating private provider memory files as CVF authority.

## Coverage Status Vocabulary

| Status | Meaning |
| --- | --- |
| `COVERED_SOURCE_BACKED` | Legacy relevance was checked and evidence directly supports coverage for the named plane or workflow-chain system. |
| `PARTIAL_RECHECK_REQUIRED` | Some legacy absorption exists, but the coverage is incomplete, stale, or not mapped to the current plane/workflow-chain upgrade. |
| `HOLD_PENDING_LEGACY_ABSORPTION` | Work is blocked until a fresh legacy absorption packet completes. |
| `RETROACTIVE_COVERAGE_AUDIT_REQUIRED` | The plane/workflow-chain work exists, but this index has not yet verified whether matching legacy families were checked. |
| `NOT_APPLICABLE_WITH_REASON` | No legacy check is required for the row, and the reason is explicit. |
| `BLOCKED_SOURCE_NOT_FOUND` | The claimed owner surface or legacy evidence could not be found. |

## Duplicate Prevention Keys

Future workers must use these keys before opening a new scan:

| Key | Required lookup |
| --- | --- |
| `legacyFamilyPath` | Exact legacy path or governed corpus registry entry. |
| `planeOrWorkflowId` | Stable plane/workflow-chain row ID in this index. |
| `priorAbsorptionEvidence` | GC-018, LHW/CI1/MEMCON/MLW/FPC packet, completion review, or corpus registry entry. |
| `acceptedValueKey` | Short semantic key for accepted value, such as `modelGatewayUnificationAdvisory` or `memoryLearningNoAutonomousMutation`. |
| `ownerSurface` | Current governed CVF owner surface that received, rejected, or deferred the value. |
| `nextAction` | Concrete next step or explicit `None with reason`. |

## Initial Coverage Ledger

| ID | Plane or workflow-chain system | Relevant legacy families or corpus entries | Prior absorption evidence | Current owner surfaces | Coverage status | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| `MGW-001` | Model Gateway / Execution Plane provider routing | `.private_reference/legacy/CVF_Important/ADDING_MODEL GATEWAY/` (12 files); `.private_reference/legacy/CVF_Important/ADDING_MODEL_ROUTER/` (6 files); `.private_reference/legacy/CVF_Important/ADDING_MINI_MODEL GATEWAY/` (7 files); `.private_reference/legacy/CVF_Important/ADDING_AI GATEWAY/` (12 files) | LHW17 T2 (`cvf.modelGatewayUnificationAdvisory.lhw17.t2.v1`) absorbed 4 source files; bounded recheck completed 2026-06-14 per `CVF_GC018_MODEL_GATEWAY_LEGACY_ABSORPTION_COVERAGE_INDEX_2026-06-13.md`; Codex reviewer remediation corrected manifest naming and added one missed mini-gateway interface row; 12 accepted value keys recorded; AI Gateway family remains deferred | `EXTENSIONS/CVF_MODEL_GATEWAY/src/` (21 governed files: provider-capability-registry.ts, routing-policy.ts, fallback-policy.ts, gateway-policy.ts, gateway-receipt.ts, provider-health.ts, provider-registry.ts, etc.); `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/` (dispatch, pipeline, feedback, streaming contracts) | `PARTIAL_RECHECK_REQUIRED` | C-02 Resume Decision: `RESUME_WITH_REWRITE`; recheck plan at `docs/reference/CVF_MODEL_GATEWAY_LEGACY_ABSORPTION_RECHECK_PLAN_2026-06-13.md`; C-02 must incorporate strategy-layer gap, routing-policy-engine gap, integration-flow boundary, and gateway-interface boundary before dispatch. AI Gateway family value (environment signal capture) remains deferred pending separate privacy/GDPR operator authorization per LHW17 T2 explicit deferral. |
| `MCP-GW-001` | MCP to Model Gateway Composition Proof and future Delta Execution Control | `.private_reference/legacy/CVF 17.05/CVF_EXTERNAL_CAPABILITY_INTAKE/` (11 files); `.private_reference/legacy/CVF ADD/CLI-Anything/` (11 files); `.private_reference/legacy/CVF ADD/cortex-hub/` (11 files); prior `MGW-001` gateway-family recheck | Bounded recheck completed 2026-06-19 per `docs/reviews/CVF_MCP_GATEWAY_EXECUTION_CONTROL_LEGACY_RECHECK_COMPLETION_2026-06-19.md`; source-verified GC-018 at `docs/baselines/CVF_GC018_MCP_GATEWAY_EXECUTION_CONTROL_LEGACY_RECHECK_2026-06-19.md`; work order at `docs/work_orders/CVF_AGENT_WORK_ORDER_MCP_GATEWAY_EXECUTION_CONTROL_LEGACY_RECHECK_FOR_CODEX_2026-06-19.md`; prior RTAD-T5 and WWU-T3B bridge boundary/adapter evidence | `docs/reference/mcp_gateway/CVF_MODEL_GATEWAY_MCP_RUNTIME_BRIDGE_BOUNDARY.md`; `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/index.ts`; `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/tools/model-gateway-execute.ts`; `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-execution-bridge.ts`; `docs/reference/CVF_LEGACY_ABSORPTION_COVERAGE_INDEX_2026-06-13.md` | `COVERED_SOURCE_BACKED` | Composition Proof may proceed only as a fresh source-verified GC-018 that injects a bounded executor, preserves Model Gateway as provider execution authority, returns receipt evidence, blocks raw secret input/output, and avoids broad runtime/control/readiness claims. Delta Execution Control must carry legacy-derived controls: pre-action governance/preflight, no direct provider bypass, no raw MCP/tool bypass, durable audit/receipt, and no governed-coding claim without CVF receipt. |
| `MEM-001` | Memory / Knowledge / MEMCON workflow-chain | `legacy-memory-learning-related-ci1-t11`; `mlw0-current-source-verification-map`; `memory-consolidation-control-plane-owner-surfaces`; memory method legacy rescan audit | CI1-T11, MLW0, MLW1-MLW6, MEMCON-T1a through MEMCON-T5, memory method audit | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/`; `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/`; MEMCON reference contracts | `PARTIAL_RECHECK_REQUIRED` | Before new memory/scan foundation work, reconcile the row against the corpus registry and MEMCON closure packets. |
| `SCAN-001` | Corpus / Scan / Extraction foundation | `private-reference-legacy-all`; EX/EXA registry entries; DSCP scan descriptor entries | Corpus scan registry, EX-T2 through EX-T9, EXA-T2, DSCP-T1/T6/T9/T10/T11 entries | `docs/corpus-intelligence/`; `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/`; CPF/DSCP surfaces | `PARTIAL_RECHECK_REQUIRED` | Add per-plane coverage rows for scan/extraction before claiming scan-layer completeness. |
| `FPC-001` | Foundation Planes Workflow-Chain System Completion | FPC roadmap; FPC-T1/T2/T3/T4 packets; legacy absorption standard | FPC-T1 through FPC-T4 packets; Model Gateway correction | FPC matrices, work-order template, system-loop interlock registry | `RETROACTIVE_COVERAGE_AUDIT_REQUIRED` | Add a mandatory legacy coverage row to future FPC-derived planning packets. |
| `AOT-001` | Agent Operation Trace / co-work supervision | Current AOT packets; possible legacy agent/audit families not yet mapped in this index | AOT-T1, AOT-T2, FPC-T3-C04+C01 | `governance/compat/check_agent_operation_trace.py`; AOT plans and completions | `RETROACTIVE_COVERAGE_AUDIT_REQUIRED` | Verify whether legacy audit-agent / multi-agent families add trace obligations before expanding AOT breadth. |
| `SLI-001` | System Loop Interlock workflow-chain | System-loop interlock standard and registry; possible legacy workflow-chain packets | GC-052, FPC-T2, FPC-T3-C04+C01 | `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json` | `RETROACTIVE_COVERAGE_AUDIT_REQUIRED` | For new interlock rows, require a legacy coverage disposition or `NOT_APPLICABLE_WITH_REASON`. |
| `DIR-DICE-001` | Document Intelligence Router and Control Envelope | Current DIR/DICE packets; no legacy document-intelligence family verified in this index | DIR-T0/T1/T2, DICE-T0/T1 | `EXTENSIONS/CVF_DOCUMENT_INTELLIGENCE/`; DIR/DICE roadmaps and completions | `RETROACTIVE_COVERAGE_AUDIT_REQUIRED` | Keep downstream use-case adapters out; add legacy coverage only if a matching foundation family is source-found. |
| `ERH-001` | External Review Hardening workflow-chain | ERH workflow-chain packets and public-surface drift ledgers | ERH-CI1, ERH-PD1, ERH-DEP1, ERH-SAF1/SAF2, ERH-DUR1/DUR2 | ERH reference chains and guards | `RETROACTIVE_COVERAGE_AUDIT_REQUIRED` | Do not reopen ERH now; require this index in future ERH expansion packets. |

## Model Gateway Recheck Status

`MGW-001` hold resolved to `PARTIAL_RECHECK_REQUIRED` after bounded recheck
completed 2026-06-14. The recheck found:

- LHW17 T2 covered 4 source files (Routing Layer + Strategy Layer advisory).
- 12 accepted value keys were recorded beyond the narrow LHW17 T2 absorption:
  architecture boundary, execution strategy taxonomy, execution planner,
  execution engine lifecycle, feedback loop scoring, observability layering,
  integration-flow responsibility boundary, full routing context, routing policy
  pipeline, dynamic model registry, mini-gateway component architecture, and
  gateway execution/streaming/embedding/health interface boundary.
- 16 files deferred (AI Gateway family: environment signal capture, privacy/GDPR
  risk; remaining repetitive files already covered by accepted set).
- C-02 Resume Decision: `RESUME_WITH_REWRITE`; C-02 must incorporate strategy-layer
  gap (Execution Planner, Feedback Loop, Strategy Registry) and routing-policy-engine
  gap (PolicyDecision pipeline, escalation logic, A/B routing) not previously
  addressed by LHW17 T2 or current source.

Detail at: `docs/reference/CVF_MODEL_GATEWAY_LEGACY_ABSORPTION_RECHECK_PLAN_2026-06-13.md`

## Memory / Scan Layer Recheck Boundary

`MEM-001` and `SCAN-001` are intentionally marked `PARTIAL_RECHECK_REQUIRED`,
not failed. There is substantial registry-backed and audit-backed evidence for
memory/learning/scan work, including CI1-T11, MLW0, MEMCON, and EX/EXA entries.
The gap is that those closures are not yet visible in a single plane-upgrade
coverage ledger.

The first worker pass must reconcile evidence; it must not open broad legacy
content reading unless a fresh GC-018 row explicitly authorizes that source
family.

## Source Authority Table

| Source | Authority use | Disposition |
| --- | --- | --- |
| `docs/reference/CVF_KNOWLEDGE_ABSORPTION_BLINDSPOT_PREVENTION_STANDARD_2026-06-01.md` | Requires blind-spot controls for legacy absorption and scoping | ACCEPT |
| `docs/reference/CVF_CORPUS_SCAN_REGISTRY_STANDARD_2026-06-02.md` | Defines corpus registry and `priorAbsorption` lookup | ACCEPT |
| `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.md` | Human companion for corpus status, findings, and next scan recommendations | ACCEPT |
| `docs/reference/archive/CVF_LHW17_T2_MODEL_GATEWAY_UNIFICATION_ADVISORY_CONNECTOR_SPEC_2026-05-30.md` | Prior Model Gateway legacy advisory evidence | ACCEPT |
| `docs/reviews/CVF_MODEL_GATEWAY_LEGACY_ABSORPTION_GAP_DISPATCH_CORRECTION_2026-06-13.md` | Current hold and path-level gateway family gap | ACCEPT |
| `docs/audits/CVF_MEMORY_METHOD_LEGACY_RESCAN_AUDIT_2026-06-01.md` | Memory/knowledge legacy method audit boundary | ACCEPT |
| `docs/roadmaps/CVF_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_COMPLETION_ROADMAP_2026-06-13.md` | FPC plane/workflow-chain target set | ACCEPT |
| `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json` | Current system-loop registry owner surface | ACCEPT |

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| EXISTS: Knowledge absorption blind-spot standard governs legacy scoping | `docs/reference/CVF_KNOWLEDGE_ABSORPTION_BLINDSPOT_PREVENTION_STANDARD_2026-06-01.md` | `## Mandatory Blind-Spot Control Block` | `Knowledge Absorption Blind-Spot Control Block` | knowledge absorption standard | ACCEPT |
| EXISTS: corpus registry has a `priorAbsorption` field | `docs/reference/CVF_CORPUS_SCAN_REGISTRY_STANDARD_2026-06-02.md` | `## Required Registry Entry Fields` | `priorAbsorption` | corpus scan registry standard | ACCEPT |
| EXISTS: Model Gateway legacy advisory is closed bounded | `docs/reference/archive/CVF_LHW17_T2_MODEL_GATEWAY_UNIFICATION_ADVISORY_CONNECTOR_SPEC_2026-05-30.md` | header | `Status` | LHW17 T2 connector spec | ACCEPT |
| EXISTS: Model Gateway advisory used legacy gateway source paths | `docs/reference/archive/CVF_LHW17_T2_MODEL_GATEWAY_UNIFICATION_ADVISORY_CONNECTOR_SPEC_2026-05-30.md` | `## Source` | `ADDING_MODEL GATEWAY`; `ADDING_MODEL_ROUTER`; `ADDING_MINI_MODEL GATEWAY` | LHW17 T2 connector spec | ACCEPT |
| EXISTS: current C-02 is held pending legacy absorption | `docs/reviews/CVF_MODEL_GATEWAY_LEGACY_ABSORPTION_GAP_DISPATCH_CORRECTION_2026-06-13.md` | `## Corrective Decision` | `Corrective Decision status` | C-02 dispatch correction | ACCEPT |
| EXISTS: memory method audit is partial and not complete legacy absorption | `docs/audits/CVF_MEMORY_METHOD_LEGACY_RESCAN_AUDIT_2026-06-01.md` | header and `## Purpose` | `Status` | memory method audit | ACCEPT |
| EXISTS: corpus registry companion is active | `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.md` | header | `Status` | corpus scan registry companion | ACCEPT |
| EXISTS: FPC roadmap targets foundation planes and workflow-chain systems | `docs/roadmaps/CVF_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_COMPLETION_ROADMAP_2026-06-13.md` | `## Purpose` | `foundation planes workflow-chain systems` | FPC roadmap | ACCEPT |

## Negative Search And Collision Discipline

| Search query | Search roots | Result summary | Disposition |
| --- | --- | --- | --- |
| `rg --files docs/reference docs/baselines docs/work_orders docs/reviews docs/roadmaps \| rg "(FPC|AOT|MEMCON|MODEL_GATEWAY|LEGACY|ABSORPTION|SYSTEM_LOOP|WORKFLOW_CHAIN|FOUNDATION_PLANES)"` | governed docs | Existing packets found across FPC, AOT, MEMCON, Model Gateway, legacy, system-loop, and workflow-chain surfaces | COLLISION_RECORDED_AS_INDEX_SEED_INPUT |
| `rg -n "CVF_Important|Model Gateway|memory|scan|legacy|priorAbsorption|LHW17|LHW20" docs/corpus-intelligence/registry/entries -g "*.json"` | corpus registry entries | Memory/learning and legacy registry entries found; Model Gateway-specific registry row not found in current active entries | GAP_RECORDED_FOR_WORKER_RECHECK |
| `Get-ChildItem docs/reference -Filter "*LEGACY*INDEX*.md"` | `docs/reference` | No active legacy coverage index found before this artifact | NEW_INDEX_JUSTIFIED |

## Epistemic Process Block

Epistemic Process Applicability: HIGH_EVIDENCE

Expected Result / Prediction: If CVF plane/workflow-chain upgrades lack a
single legacy coverage index, then current governed packets should show partial
coverage evidence split across FPC, LHW, CI1, MLW, MEMCON, AOT, and corpus
registry artifacts.

Evidence Comparison: The prediction is supported. Model Gateway has LHW17 T2
prior absorption evidence and a C-02 hold correction, while memory/scan work
has CI1-T11, MLW0, MEMCON, memory method audit, and corpus registry evidence.
Those sources were not previously tied together in a single plane/workflow
coverage ledger.

Contradiction Or Gap Disposition: GAP_CONFIRMED. The gap is index and
pre-dispatch coverage visibility, not proof that all legacy absorption is
missing. Rows therefore use `PARTIAL_RECHECK_REQUIRED`,
`RETROACTIVE_COVERAGE_AUDIT_REQUIRED`, or `HOLD_PENDING_LEGACY_ABSORPTION`
instead of false complete/failed claims.

Claim Update: C-02 remains held for `MGW-001`; memory/scan layers require
evidence reconciliation before additional broad legacy reread; future
foundation work should cite this index or record `NOT_APPLICABLE_WITH_REASON`.

## Worker Update Protocol

When a worker updates this index, the worker must:

1. Add or update only rows in `## Initial Coverage Ledger`.
2. Preserve prior evidence instead of replacing it.
3. Use one of the status vocabulary values above.
4. Add a `Source Verification Block` row for every new evidence path.
5. Mark duplicate absorption attempts with the duplicate prevention key.
6. Avoid broad legacy content reading unless the active GC-018 authorizes it.

## Evidence / Verification

This seed index is expected to be verified by the dispatch work order:

| Gate | Expected result |
| --- | --- |
| Markdown structural completeness | PASS |
| Work-order dispatch quality | PASS |
| Reviewer-fast | PASS |
| Diff hygiene | PASS |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance governance index. Public-sync is not authorized.

## Claim Boundary

This index is a governed coverage ledger seed. It does not prove complete
legacy absorption, runtime behavior, provider routing, production readiness,
public readiness, cost optimization, quality improvement, or hidden
cross-agent memory transfer.
