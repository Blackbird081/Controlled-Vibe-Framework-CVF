# CVF Legacy Harvest Scan Map

Memory class: FULL_RECORD

Status: WC3_CLOSED_MAPPING

docType: reference

Date: 2026-05-24

---

## LH1 Closeout Pointer

This WC-3 scan map is closed as a source inventory, not as complete legacy
absorption.

The current closeout ledger is:

`docs/reference/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md`

LH1 completion:

`docs/reviews/CVF_LH1_LEGACY_HARVEST_CLOSEOUT_LEDGER_COMPLETION_2026-05-25.md`

Future agents must use the LH1 ledger before reopening any WC-3 source family.

## Purpose

Preserve the combined WC-3 scan across CVF 16.5, CVF ADD, and CVF Edit so the
next tranche can choose high-value implementation work from existing legacy
knowledge instead of rediscovering it through isolated audits.

## Scope / Target / Owner Boundary

Target: legacy harvest mapping for future work-order selection.

Owner: CVF session-continuity and roadmap steering surface.

Scanned roots:

- `.private_reference/legacy/CVF 16.5/` — 100 files
- `.private_reference/legacy/CVF ADD/` — 167 files
- `.private_reference/legacy/CVF Edit/` — 10 files

Boundary: this is a documentation map. It does not change source code, provider
behavior, memory behavior, receipt envelopes, public-sync, or hosted posture.

## Source / Predecessor Evidence

Primary sources:

- `docs/reference/archive/CVF_LEGACY_SPEC_ABSORPTION_REGISTRY_2026-05-23.md`
- `docs/audits/archive/CVF_LEGACY_SPEC_ABSORPTION_BLINDSPOT_AUDIT_2026-05-23.md`
- `docs/reviews/archive/CVF_REVIEW_CVF_POST_BC_REMAINING_PAIN_POINTS_ASSESSMENT_2026-05-22.md`
- `.private_reference/legacy/CVF 17.05/Review CVF.md`

Scan evidence:

```text
rg --files ".private_reference/legacy/CVF 16.5" ".private_reference/legacy/CVF ADD" ".private_reference/legacy/CVF Edit"
PowerShell Get-ChildItem -Recurse -File counts by root and first-level family
PowerShell first-heading/interface extraction for source-family orientation
rg cross-reference for Review-CVF pain keywords across CVF Edit and Review CVF.md
```

## Decision / Baseline

WC-3 confirms that the highest-value next work should be selected from existing
legacy families already present in the repo. The current best sequence is:

1. workflow/state-machine enforcement from CVF Edit plus Human System Harness;
2. runtime memory event hooks and context packaging from agentmemory/tolaria;
3. tool/MCP/database action governance from CLI-Anything, OpenAgentd,
   pancake-pos-mcp, gridex, and cortex-hub;
4. operational benchmark and observability from abtop plus CVF Edit failure
   simulation;
5. provider gateway method normalization from freellmapi, free Claude Code, and
   openrouter-cli.

Post-WC3 control: before any candidate below becomes implementation, the work
order must complete the Knowledge Absorption Blind-Spot Control Block in
`docs/reference/CVF_KNOWLEDGE_ABSORPTION_BLINDSPOT_PREVENTION_STANDARD_2026-05-24.md`.
WC-3 is a map, not implementation authorization.

Mandatory GC-018 control: every future `GC-018` packet that touches memory,
graph, or intelligence work must include the Knowledge Absorption Blind-Spot
Control Block. If the block is missing, the packet is incomplete and must not
dispatch implementation.

## Pain-Point Mapping

| Pain point | Current status | Legacy source families | WC-3 judgment |
| --- | --- | --- | --- |
| D - Provider gateway maturity | Partial real gap | `free Claude Code`, `freellmapi`, `openrouter-cli.git`, `cortex-hub` | Medium-high value; do after workflow/memory unless a public provider claim needs it. |
| E - Operational benchmark | Partial real gap | `abtop`, `CVF Edit` failure simulation/audit log, `AI-first vs Human-first` overconstraint signals | High value; should become a first-class operational scorecard tied to real failure classes. |
| F - Noncoder outcome surface | Mostly closed core, hardening remains | `CVF Edit`, `CVF 17.05 Review CVF.md`, `md2html`, `Human System Harness` | High product value, but mostly UX/workflow packaging rather than kernel work. |
| G - Execution identity | Partial real gap | `Claude Kit`, `Agent Harnesses`, `deepagents`, `AGENT ENGINEER`, `Human System Harness` | Highest governance/runtime value after WC-1; needs runtime state/authority model, not another role catalog. |
| H - Runtime memory hierarchy | Partial with real progress | `agentmemory`, `tolaria`, `Agent Harnesses`, `Workflow GoClaw` | Highest continuity value; next work should add event-hook capture/read packaging without raw reinjection. |

## Ranked Absorption Candidates

| Rank | Candidate | Source families | Why it matters | Risk | Recommended next gate |
| --- | --- | --- | --- | --- | --- |
| 1 | Workflow state-machine enforcement and recovery | `CVF Edit`, `Human System Harness`, `Agent Harnesses` | Directly attacks the operator's workflow-chain concern: phases must be runtime transitions, not prose. | Medium | Fresh GC-018 for a bounded state-machine proof on one existing workflow. |
| 2 | Memory event hooks + context packager hardening | `agentmemory`, `tolaria`, `Agent Harnesses` | Turns WC-1 from manual proof into a governed loop pattern while preserving `canReinject=false`. | Medium-high | Fresh GC-018 for capture/read receipts and summary-only packaging; no raw reinjection. |
| 3 | Tool/MCP/database action governance map | `CLI-Anything`, `OpenAgentd`, `pancake-pos-mcp`, `gridex`, `cortex-hub` | Bridges CLI/MCP/API-key user pain: action failures need policy, approval, trace, and diagnostic class. | High | Fresh GC-018 for read-only tool-action taxonomy first. |
| 4 | Operational benchmark scorecard | `abtop`, `CVF Edit`, `AI-first vs Human-first` | Converts live receipts and diagnostics into user-facing reliability evidence. | Medium | Fresh GC-018 for a bounded scorecard over existing evidence logs. |
| 5 | Provider method and fallback normalization | `freellmapi`, `free Claude Code`, `openrouter-cli.git` | Improves D without repeating broad soak loops; focus on method/error contracts. | Medium-high | Fresh GC-018 only when tied to a specific provider method or public claim. |
| 6 | Noncoder artifact/export product hardening | `md2html`, `CVF Edit`, `Human System Harness` | Useful for end-user value, but lower governance leverage than state/memory/tool loops. | Low-medium | UX/product work order after runtime loop stabilizes. |
| 7 | External skill/model ingestion | `Hugging Face`, `Hermes Agent`, `AGENT ENGINEER` | Valuable later, but expands external tool/provider surface. | High | Demand-gated; do not start until action governance exists. |

## Source Family Coverage

### CVF 16.5

| Family | Files | Pre-existing knowledge | Absorption status | Pain-point fit | Next action |
| --- | ---: | --- | --- | --- | --- |
| `abtop` + observability plane | 11 | session monitor, event stream, dashboard, port/rate/token meters | partial/runtime-owned | E | Candidate 4 |
| `agentmemory` | 11 | memory gateway, access/capture/hooks/context/lifecycle/privacy/retrieval/reinjection policies | partial | H | Candidate 2 |
| `Claude Kit` | 9 | agent registry, role catalog, permission, risk, handoff, audit receipt | partial/runtime-owned | G | Candidate 1 or 3 |
| `free Claude Code` | 7 | provider proxy, protocol translation, routing, proxy security, audit trace | partial/runtime-owned | D | Candidate 5 |
| `freellmapi` | 10 | credential vault, fallback policy, gateway receipt, health, quota, sticky session | partial/runtime-owned | D/E | Candidate 5 |
| `md2html` + artifact renderer | 9 | document artifact renderer, templates, rendering policy, verification | active/deferred productization | F | Candidate 6 |
| `Memento-Skills` | 9 | skill mutation, reflection, verification, reinjection receipts | partial/runtime-owned | F/G/H | Hold until skill mutation demand |
| `OpenAgentd` | 11 | local sandbox, MCP boundary, mailbox, telemetry, scheduled execution, tool trace | partial/runtime-owned | G/D | Candidate 3 |
| `OpenSpec` | 4 | delta spec grammar, change packet mapping, archive sync boundary | runtime-owned | A/E | Hold unless spec-change workflow is selected |
| `pancake-pos-mcp` | 9 | business tool registry, risk classifier, approval gate, transport, receipt | partial/runtime-owned | D/G | Candidate 3 |
| `REVIEW FOLDER` | 1 | historical intake review | archived evidence | all | cite only |
| `tolaria` | 9 | knowledge vault intake, provenance receipt, drift, graph, reinjection, snapshot packaging | partial/runtime-owned | H/E | Candidate 2 |

### CVF ADD

| Family | Files | Pre-existing knowledge | Absorption status | Pain-point fit | Next action |
| --- | ---: | --- | --- | --- | --- |
| `AGENT ENGINEER` | 10 | agent engineering contracts, guard, execution, evaluation, binding | doctrine/partial | G | Candidate 7 later |
| `Agent Harnesses` | 11 | session, checkpoint, recovery, handoff, execution restore, artifact memory | doctrine/partial | G/H | Candidate 1 or 2 |
| `AI-first vs Human-first` | 9 | anti-overconstraint, minimal policy response, friction audit, lightweight runtime | doctrine/partial | E/F | Candidate 4 |
| `caveman` | 11 | context budgeting, compaction, relevance filtering, verbosity, model selection | deferred | E/F/H | Fold into Candidate 4/6 only if needed |
| `CLI-Anything` | 11 | tool surface registry, onboarding, evaluation, sandboxed execution, command adapter | deferred | D/G | Candidate 3 |
| `code-review-graph` | 7 | graph knowledge, context resolution, implementation plan, integration surface | runtime-owned | H/E | Already covered by AIF-B/PBR-04; future scoring demand-gated |
| `cortex-hub` | 11 | code intelligence adapter, MCP bridge, capability matrix, knowledge memory adapter | boundary absorbed, engine missing | D/H | Candidate 3 |
| `deepagents` | 8 | async work ticket, worker delegation, subagent boundary, trace enrichment | doctrine/partial | G | Candidate 1 later |
| `gridex` | 9 | database action model, audit trace, execution surface, policy binding | deferred | D/G | Candidate 3 after taxonomy |
| `Hermes Agent` | 11 | cron execution, approval/redaction, sandbox, memory recall, skill ingestion | deferred | G/H/D | Demand-gated |
| `Hugging Face` | 11 | external model execution, sandbox, skill normalization, risk, trace | deferred | D/F | Demand-gated |
| `Human System Harness` | 11 | reverse brief, brief normalization, orchestrator delegation, phase integrity, solution-bias guard | doctrine/partial | F/G | Candidate 1 |
| `openrouter-cli.git` | 28 | OpenRouter command runtime, config doctor, adapter, async job, retry, trace records | deferred | D/E | Candidate 5 only if OpenRouter is selected |
| `REVIEW FOLDER` | 13 | accepted/rejected ADD doctrine, owner-surface maps, source trace | doctrine absorbed | all | cite before ADD-family reopen |
| `Workflow GoClaw` | 11 | context profile, cache boundary, guardrail, packaging, session classification | doctrine/partial | H/G | Candidate 2 |

### CVF Edit

| File | Pre-existing knowledge | Absorption status | Pain-point fit | Next action |
| --- | --- | --- | --- | --- |
| `CVF_EDIT_ANALYSIS.md` | consolidated nine-file analysis; Level 2.5 gap; workflow/state/context/observability weaknesses | partial | E/F/G/H | steer Candidate 1/4 |
| `De_xuat.md` | workflow transition, deterministic engineering pipeline, integration SDK, runtime readiness proposals | partial | D/E/G | Candidate 1 first |
| `CVF AUDIT LOG_md` | audit log and execution trace methodology | partial | E/G | Candidate 4 |
| `Failure Simulation cho CVF.md` | failure scenarios and before/after scoring | partial | E/F/G | Candidate 4 |
| `Review CVF.md` | 8-layer architecture review; non-bypassable workflow and memory concepts | partial | F/G/H | Candidate 1/2 |
| `Review CVF_1.md` | architecture gap map; workflow enforcement runtime; project/decision/knowledge memory | partial | G/H | Candidate 1/2 |
| `Review CVF_2.md` | CVF as governance/safety layer for agent frameworks; integration layer/policy/audit modules | partial | D/G | Candidate 3/5 |
| `Review CVF_3.md` | runtime enforceability audit; workflow enforcement partial | partial | G | Candidate 1 |
| `Review CVF_4.md` | layer-by-layer audit framework; identity and workflow enforcement questions | partial | E/G | Candidate 1/4 |
| `Review CVF_5.md` | deeper code-level audit themes for runtime enforcement | partial | G/E | Candidate 1/4 |

## Implementation Do-Not-Start List

Do not start these directly from WC-3:

- broad provider soak expansion;
- raw memory reinjection or `canReinject=true`;
- hosted/cloud persistence;
- external model/skill ingestion from Hugging Face or Hermes;
- OpenRouter async execution;
- database mutation runtime;
- global freeze release;
- public claim expansion.

## Verification

WC-3 verification is document-only:

- all three requested roots were scanned by file count;
- 277 files were covered through source-family inventory;
- existing registry and blindspot audit were reconciled;
- remaining Review-CVF pain points were mapped to candidate families;
- no source code changes are part of this map.

## Claim Boundary

WC-3 claims only a combined legacy harvest map and ranked candidate list. It
does not claim implementation, runtime behavior, provider stability, memory
reinjection, hosted readiness, production readiness, or public capability
graduation.
