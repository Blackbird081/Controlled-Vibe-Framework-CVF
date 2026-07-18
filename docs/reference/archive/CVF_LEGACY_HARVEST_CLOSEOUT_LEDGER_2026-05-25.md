# CVF Legacy Harvest Closeout Ledger

Memory class: FULL_RECORD

Status: LH1_CLOSED_LEDGER

docType: reference

Date: 2026-05-25

---

## Purpose

Close the first legacy-harvest control loop by turning the WC-3 scan map into a
decision ledger.

This file is the routing answer to: "is legacy harvest complete?" The answer is
bounded:

- the WC-3 scan map is complete;
- W1-W6, C7A, and C8 absorbed several high-value slices;
- full legacy absorption is not complete;
- remaining legacy value is controlled by explicit triggers, not rediscovery.

## Scope / Target / Owner Boundary

Target: source-family disposition and future absorption steering.

Owner: CVF session-continuity and roadmap steering surface.

Source inventory baseline:

- `.private_reference/legacy/CVF 16.5/` - 100 files
- `.private_reference/legacy/CVF ADD/` - 167 files
- `.private_reference/legacy/CVF Edit/` - 10 files

Boundary: this ledger is documentation/control only. It does not change source
code, provider behavior, memory behavior, receipt envelopes, public-sync, hosted
posture, or production posture.

## Source / Predecessor Evidence

- `docs/reference/archive/CVF_LEGACY_HARVEST_SCAN_MAP_2026-05-24.md`
- `docs/reference/archive/CVF_KNOWLEDGE_ABSORPTION_BLINDSPOT_PREVENTION_STANDARD_2026-05-24.md`
- `docs/reference/archive/CVF_LEGACY_SPEC_ABSORPTION_REGISTRY_2026-05-23.md`
- `docs/audits/archive/CVF_LEGACY_SPEC_ABSORPTION_BLINDSPOT_AUDIT_2026-05-23.md`
- `docs/reviews/archive/CVF_WC_WORKFLOW_CHAIN_AND_PAIN_POINT_ROADMAP_CLOSURE_2026-05-24.md`
- `docs/reviews/archive/CVF_W1_WORKFLOW_STATE_MACHINE_ENFORCEMENT_COMPLETION_2026-05-24.md`
- `docs/reviews/archive/CVF_W2_MEMORY_EVENT_HOOKS_CONTEXT_PACKAGER_COMPLETION_2026-05-24.md`
- `docs/reviews/archive/CVF_W3_TOOL_MCP_DATABASE_ACTION_TAXONOMY_COMPLETION_2026-05-24.md`
- `docs/reviews/archive/CVF_W4_OPERATIONAL_BENCHMARK_SCORECARD_COMPLETION_2026-05-24.md`
- `docs/reviews/archive/CVF_W5_PROVIDER_METHOD_FALLBACK_NORMALIZATION_COMPLETION_2026-05-24.md`
- `docs/reviews/archive/CVF_W6_NONCODER_ARTIFACT_EXPORT_HARDENING_COMPLETION_2026-05-24.md`
- `docs/reviews/CVF_C7A_PRODUCT_SKILL_PACK_TOP10_COMPLETION_2026-05-25.md`
- `docs/reviews/CVF_C8_PRODUCT_SKILL_PACK_SELECTION_READOUT_COMPLETION_2026-05-25.md`

## Decision / Baseline

Decision: legacy harvest is not globally complete, but the first high-value
implementation wave is complete and future absorption must use this ledger.

Baseline:

- `ABSORBED_RUNTIME_PROVEN` means an implemented CVF artifact exists with tests
  or proof.
- `PARTIALLY_ABSORBED` means meaningful value was used, but the family still has
  unimplemented usable concepts.
- `ACCEPT_AS_DOCTRINE` means language or control pattern was absorbed into
  standards/roadmaps, not runtime.
- `DEFER_DEMAND_GATED` means useful but requires a concrete operator demand and
  fresh GC-018.
- `REJECT_DIRECT` means do not import directly; keep only as contrast/evidence.
- `CITE_ONLY` means historical evidence only.

LHW scope-rejection rule:

- In LHW connector waves, do not use a bare `rejected: requires live route`
  label for a family that is excluded only because the current wave is
  documentation-only.
- Use the explicit wording: `rejected from this LHW wave (doc-only scope) -
  requires live route; eligible for separate live-proof roadmap post-LHW.`
- This applies especially to `abtop` and `gridex`: API/key availability can make
  them live-testable, but a doc-only LHW connector wave is the wrong scope.
- Sequence: finish LHW connector absorption for remaining
  `PARTIALLY_ABSORBED` families before opening live-proof roadmaps. Live proof
  for `abtop`, `gridex`, or similar families starts only after the Orchestrator
  confirms no additional connector value remains.

## Knowledge Absorption Blind-Spot Control Block

- Standard read:
  `docs/reference/archive/CVF_KNOWLEDGE_ABSORPTION_BLINDSPOT_PREVENTION_STANDARD_2026-05-24.md`
- Source inventory:
  - CVF 16.5 family inventory from WC-3
  - CVF ADD family inventory from WC-3
  - CVF Edit file inventory from WC-3
- Prior absorption evidence resolved:
  - WC-3 scan map
  - WC roadmap W1-W6 closures
  - C7A/C8 completion packets
  - legacy absorption registry and blindspot audit
- Detailed source files used:
  - WC-3 scan map
  - Review CVF product-skill-pack pain point
  - C7A/C8 completion packets
- Source families skipped:
  - none at disposition level
- File-level accepted value:
  - recorded per family below
- Owner-surface normalization:
  - each accepted value maps to an existing CVF owner surface or a future
    demand-gated trigger
- Accept/defer/reject matrix:
  - recorded in the three source-family ledgers below
- Adversarial roles completed:
  - Implementer: do not implement another runtime surface until the ledger
    prevents duplicate/forgotten absorption.
  - Skeptic/Auditor: "complete scan" must not become "complete absorption."
  - Product/Operator Advocate: next work must reduce agent/user choice
    confusion, not just add more archived knowledge.
  - Safety/Boundary Owner: external model/skill ingestion, MCP/database action
    execution, provider changes, and raw memory reinjection remain unavailable.
- Thin proof target:
  - closeout ledger plus session-state update
- Blind-spot verdict: CLEAR.

## CVF 16.5 Ledger

| Family | Disposition | Absorbed value / owner surface | Remaining trigger |
| --- | --- | --- | --- |
| `abtop` + observability plane | PARTIALLY_ABSORBED | W4 operational benchmark scorecard absorbed event/metric/readout concepts into Governance CLI offline evidence reporting. | Reopen only for runtime observability dashboard or live failure-class trend readout. |
| `agentmemory` | PARTIALLY_ABSORBED | W2 memory event hooks and context package metadata; M1/R2 durable memory boundaries preserve `canReinject=false`. | Reopen for capture/read packaging improvements; raw reinjection remains blocked. |
| `Claude Kit` | PARTIALLY_ABSORBED | Role/handoff/audit concepts absorbed through active handoff guards, execution identity work, and W1/W3 owner boundaries. | Reopen only for a concrete identity/runtime authority gap, not another role catalog. |
| `free Claude Code` | PARTIALLY_ABSORBED | W5 provider method/fallback clarity used provider proxy/error-contract lessons. | Reopen only for a selected provider method or public claim; no broad proxy import. |
| `freellmapi` | PARTIALLY_ABSORBED | W5 and live diagnostic standard absorbed fallback/error/health concepts. | Reopen for credential/quota/health UX only with provider-specific GC-018. |
| `md2html` + artifact renderer | PARTIALLY_ABSORBED | W6 artifact verification and deliverable export hardening absorbed renderer verification value. | Reopen for actual renderer/product export expansion; no new renderer by default. |
| `Memento-Skills` | DEFER_DEMAND_GATED | Skill evolution/mutation ideas are recognized but not needed for current certified static packs. | Reopen only when pack mutation/evaluation is required after stable skill pack use. |
| `OpenAgentd` | PARTIALLY_ABSORBED | W3 tool/MCP/database action taxonomy absorbed local sandbox/tool-trace risk boundaries. | Reopen only for read-only tool runtime bridge design; execution remains blocked. |
| `OpenSpec` | PARTIALLY_ABSORBED | Spec-change grammar remains useful for governed change packets and archive sync concepts. | Reopen only if spec-change workflow is selected. |
| `pancake-pos-mcp` | PARTIALLY_ABSORBED | W3 absorbed business tool registry, approval gate, and action-risk concepts into taxonomy. | Reopen only for MCP approval proof; no transport/runtime execution yet. |
| `REVIEW FOLDER` | CITE_ONLY | Historical intake review supports provenance. | Cite when reopening CVF 16.5 families. |
| `tolaria` | PARTIALLY_ABSORBED | W2/AIF memory/graph work absorbed provenance, context package, drift/snapshot themes. | Reopen for governed memory snapshot packaging or graph context readout; no reinjection. |

## CVF ADD Ledger

| Family | Disposition | Absorbed value / owner surface | Remaining trigger |
| --- | --- | --- | --- |
| `AGENT ENGINEER` | ACCEPT_AS_DOCTRINE | Agent engineering contracts and binding concepts support Candidate 7 caution and actor-boundary thinking. | Reopen only with concrete external skill/source binding. |
| `Agent Harnesses` | PARTIALLY_ABSORBED | W1 workflow recovery and handoff/session continuity absorbed checkpoint and restore ideas. | Reopen for workflow resume/recovery runtime proof on one existing workflow. |
| `AI-first vs Human-first` | PARTIALLY_ABSORBED | W4 and C8 absorbed friction/overconstraint as readout caveats and no-match behavior. | Reopen for noncoder friction scoring or anti-overconstraint UX. |
| `caveman` | DEFER_DEMAND_GATED | Context budgeting, compaction, relevance filtering are valuable but not yet productized after C8. | Reopen for request-context budget/readout quality when selector or memory context grows. |
| `CLI-Anything` | PARTIALLY_ABSORBED | W3 absorbed command/tool surface registry and sandboxed-action taxonomy. | Reopen for CLI tool onboarding only after action governance proof. |
| `code-review-graph` | ABSORBED_RUNTIME_PROVEN | AIF-B/PBR-04 delivered graph knowledge schema, AST parser, symbol index, task query mapper, and optional SQLite persistence. | Reopen only for graph scoring/authority with fresh GC-018. |
| `cortex-hub` | PARTIALLY_ABSORBED | W3/W5 absorbed capability-matrix and MCP/provider boundary concepts. | Reopen only for code-intelligence adapter boundary, not engine import. |
| `deepagents` | ACCEPT_AS_DOCTRINE | Delegation and subagent boundary ideas inform active role separation and future workflow orchestration. | Reopen only for bounded worker delegation proof; no autonomous queues now. |
| `gridex` | PARTIALLY_ABSORBED | W3 absorbed database action model and policy binding into planned-action taxonomy. | Reopen only for read-only database action proof; mutation remains blocked. |
| `Hermes Agent` | DEFER_DEMAND_GATED | Cron, approval/redaction, sandbox, memory recall, and skill ingestion are high-risk useful concepts. | Reopen only after action governance and concrete scheduled-task use case. |
| `Hugging Face` | DEFER_DEMAND_GATED | External model/skill normalization remains valuable for Candidate 7. | Reopen only with concrete model/source, sandbox boundary, and no direct execution by default. |
| `Human System Harness` | PARTIALLY_ABSORBED | W1/C7A/C8 absorbed reverse brief, phase integrity, and outcome-first skill pack concepts. | Reopen for noncoder request clarification or workflow recovery proof. |
| `openrouter-cli.git` | DEFER_DEMAND_GATED | Provider config doctor, adapter, async job, retry, and trace records remain useful. | Reopen only when OpenRouter is selected; no async execution now. |
| `REVIEW FOLDER` | ACCEPT_AS_DOCTRINE | ADD acceptance/rejection maps and source trace are canonical prior absorption evidence. | Cite before reopening ADD families. |
| `Workflow GoClaw` | PARTIALLY_ABSORBED | Context profile/cache/session classification informed memory/context boundaries. | Reopen for context profile packaging after selector/memory traffic exists. |

## CVF Edit Ledger

| File | Disposition | Absorbed value / owner surface | Remaining trigger |
| --- | --- | --- | --- |
| `CVF_EDIT_ANALYSIS.md` | PARTIALLY_ABSORBED | W1-W6 used Level 2.5 gap, workflow/context/observability weaknesses as roadmap drivers. | Reopen when selecting next runtime workflow hardening tranche. |
| `De_xuat.md` | PARTIALLY_ABSORBED | Workflow transition and deterministic engineering pipeline informed W1 and C8 deterministic readout. | Reopen for integration SDK/runtime readiness only with concrete user flow. |
| `CVF AUDIT LOG_md` | PARTIALLY_ABSORBED | W4 scorecard and live diagnostic standard absorbed audit trace methodology. | Reopen for user-facing audit timeline/readout. |
| `Failure Simulation cho CVF.md` | PARTIALLY_ABSORBED | W4 absorbed failure class and scorecard concepts. | Reopen for failure-simulation harness over existing evidence. |
| `Review CVF.md` | PARTIALLY_ABSORBED | C7A/C8 directly absorbed product skill pack gap and 10-workflow priority. | Reopen for next pack only after usage evidence or operator demand. |
| `Review CVF_1.md` | PARTIALLY_ABSORBED | Workflow enforcement and project/decision/knowledge memory concepts informed W1/W2/AIF. | Reopen for project memory readout or workflow recovery proof. |
| `Review CVF_2.md` | PARTIALLY_ABSORBED | Agent-framework governance layer and policy/audit modules informed W3/W5. | Reopen for integration-layer packaging only after tool/MCP boundary proof. |
| `Review CVF_3.md` | PARTIALLY_ABSORBED | Runtime enforceability audit informed W1 boundary. | Reopen for route-level invalid-transition enforcement. |
| `Review CVF_4.md` | PARTIALLY_ABSORBED | Layer audit questions informed benchmark/identity surfaces. | Reopen for structured runtime maturity review. |
| `Review CVF_5.md` | PARTIALLY_ABSORBED | Code-level runtime enforcement themes informed W1/W4. | Reopen when a concrete enforcement owner file is selected. |

## Absorbed Implementation Map

| Absorbed slice | Primary legacy roots | CVF owner surface | Evidence |
| --- | --- | --- | --- |
| Workflow state-machine projection | CVF Edit, Human System Harness, Agent Harnesses | `cvf-web` Product Brief workflow projection | `docs/reviews/archive/CVF_W1_WORKFLOW_STATE_MACHINE_ENFORCEMENT_COMPLETION_2026-05-24.md` |
| Memory event hooks/context package metadata | `agentmemory`, `tolaria`, Workflow GoClaw | LPF memory event hooks | `docs/reviews/archive/CVF_W2_MEMORY_EVENT_HOOKS_CONTEXT_PACKAGER_COMPLETION_2026-05-24.md` |
| Tool/MCP/database planned-action taxonomy | CLI-Anything, OpenAgentd, pancake-pos-mcp, gridex | governance/contracts | `docs/reviews/archive/CVF_W3_TOOL_MCP_DATABASE_ACTION_TAXONOMY_COMPLETION_2026-05-24.md` |
| Operational benchmark scorecard | `abtop`, CVF Edit audit/failure simulation, AI-first vs Human-first | Governance CLI | `docs/reviews/archive/CVF_W4_OPERATIONAL_BENCHMARK_SCORECARD_COMPLETION_2026-05-24.md` |
| Provider method/fallback normalization | freellmapi, free Claude Code, openrouter-cli | Model Gateway | `docs/reviews/archive/CVF_W5_PROVIDER_METHOD_FALLBACK_NORMALIZATION_COMPLETION_2026-05-24.md` |
| Artifact verification/export hardening | md2html, CVF Edit, Human System Harness | cvf-web DeliverablePack | `docs/reviews/archive/CVF_W6_NONCODER_ARTIFACT_EXPORT_HARDENING_COMPLETION_2026-05-24.md` |
| Product skill pack top-10 inventory | Review CVF, Human System Harness, existing governed skill packs | certified skill pack registry | `docs/reviews/CVF_C7A_PRODUCT_SKILL_PACK_TOP10_COMPLETION_2026-05-25.md` |
| Product skill pack selection readout | Review CVF, C7A inventory, Governance CLI runtime plans | Governance CLI `cvf skill select` | `docs/reviews/CVF_C8_PRODUCT_SKILL_PACK_SELECTION_READOUT_COMPLETION_2026-05-25.md` |
| Graph knowledge baseline | code-review-graph, tolaria, cortex-hub | AIF Graph Knowledge / PBR-04 SQLite | `docs/reviews/archive/CVF_AIF_B_GRAPH_KNOWLEDGE_PHASE1_COMPLETION_2026-05-24.md`, `docs/reviews/archive/CVF_PBR04_GRAPH_SQLITE_PERSIST_COMPLETION_2026-05-24.md` |

## Remaining High-Value Absorption Queue

1. **Context-budget and request-shaping readout** from `caveman`, Human System
   Harness, and Workflow GoClaw.
   - Why: C8 can choose a pack, but future agents still need to know whether a
     request has enough context, too much noisy context, or missing constraints.
   - Boundary: deterministic readout only; no LLM scoring, memory reinjection,
     or route execution.
2. **Workflow recovery state proof** from Agent Harnesses, deepagents, and CVF
   Edit.
   - Why: W1 projects state, but route-level recovery/invalid-transition handling
     remains a future proof.
   - Boundary: one existing workflow only.
3. **Tool/action approval proof** from CLI-Anything, OpenAgentd,
   pancake-pos-mcp, and gridex.
   - Why: W3 taxonomy exists; next value is a read-only approval/readout proof
     before any execution.
   - Boundary: no real MCP/tool/database execution.
4. **External skill intake screening packet** from Hugging Face, Hermes Agent,
   AGENT ENGINEER, and Memento-Skills.
   - Why: Candidate 7 is valuable but high-risk.
   - Boundary: screening and normalization only; no import, no model execution,
     no marketplace claim.

## Candidate 7 Control

Candidate 7 is not open. The practical product-skill-pack slice is closed by
C7A/C8, but external skill/model ingestion remains demand-gated.

Minimum future unlock packet:

- concrete source or model family;
- concrete noncoder use case;
- no direct runtime execution by default;
- sandbox/authority boundary;
- accept/defer/reject map against existing skill-pack registry;
- live run diagnostic plan if any provider/API/key proof is requested.

## Verification

LH1 verification is documentation-only:

- WC-3 families were dispositioned;
- absorbed slices were linked to closure packets;
- remaining high-value queue is explicit;
- no source code changes are part of this ledger;
- no live proof is claimed.

## Claim Boundary

LH1 claims only a closeout ledger for legacy-harvest disposition. It does not
claim full legacy absorption, external skill/model ingestion, runtime behavior,
provider stability, memory reinjection, hosted readiness, production readiness,
public release readiness, or freeze release.
