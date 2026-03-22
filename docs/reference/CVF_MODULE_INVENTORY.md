# CVF Module Inventory

Status: canonical module inventory for the current repo baseline.

## Purpose

- provide one scan-friendly list of module families and their operational role
- make it easy to identify current baseline vs historical/reference-only lines
- support Phase 5 roadmap work on release and maturity discipline

## Inventory

| Path / Family | Scope | Layer / Function | Operational status | Notes |
|---|---|---|---|---|
| `v1.0/` | foundation docs | core process baseline | frozen | original learning/baseline entry |
| `v1.1/` | governance docs | governance refinement | frozen | policy lineage root |
| `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/` | development governance runtime | layer 1.5 | stable + local hardening | current hardening target |
| `EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/` | capability model | layer 2 | frozen | capability governance root |
| `EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/` | external integration | layer 2 | active | independently reassessed |
| `EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/` | skill governance runtime | layer 2 | local-ready | part of current operational track |
| `EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/` | sdk/cli/tooling | layer 2 | frozen | implementation baseline |
| `EXTENSIONS/CVF_v1.3.1_OPERATOR_EDITION/` | operator guidance | historical operator line | legacy-reference | retained for lineage |
| `EXTENSIONS/CVF_v1.4_USAGE_LAYER/` | usage/operator family | historical usage layer | legacy-reference | not current upgrade focus |
| `EXTENSIONS/CVF_v1.5_UX_PLATFORM/` | ux platform | pre-web UI line | legacy-reference | historical/reference |
| `EXTENSIONS/CVF_v1.5.1_END_USER_ORIENTATION/` | end-user orientation | reference | legacy-reference | reference line |
| `EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/` | skill library | end-user skills | active-reference | operational content library |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/` | web platform | layer 2.5 app/runtime | active | current main UI line |
| `EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/` | governance engine | layer 2.5 | active | enforcement/runtime support |
| `EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE/` | intelligence controls | safety line root | stable | current safety family root |
| `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/` | safety runtime | runtime governance | stable | tested kernel runtime line |
| `EXTENSIONS/CVF_v1.7.2_SAFETY_DASHBOARD/` | dashboard | safety visibility | stable | non-coder UI layer |
| `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/` | adapter hub | multi-runtime adapter | active | current adapter line |
| `EXTENSIONS/CVF_v1.8_SAFETY_HARDENING/` | safety hardening | runtime hardening | local-ready | implemented local line |
| `EXTENSIONS/CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME/` | observability runtime | safety/observability | local-ready | current local line |
| `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/` | reproducibility | deterministic replay | local-ready | implemented local line |
| `EXTENSIONS/CVF_v2.0_NONCODER_SAFETY_RUNTIME/` | non-coder safety | simplified runtime | local-ready | implemented local line |
| `EXTENSIONS/CVF_GUARD_CONTRACT/` | cross-channel guard contract | shared runtime guard contract | active | active helper line for mandatory gateway, governed execution runtime, and now `GC-020` transition + handoff checkpoint surfacing |
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/` | control-plane foundation shell + usable intake baseline + unified retrieval contract + deterministic packaging contract + real consumer path proof | whitepaper completion `W1-T1 / CP1-CP5`, `W1-T2 / CP1-CP4` | local-ready | closed first control-plane tranche preserving lineage for intent, knowledge, reporting, context freeze, tranche-local evidence surfacing, selected controlled-intelligence wrappers, one bounded usable-intake contract baseline, one unified knowledge retrieval contract, one deterministic context packaging contract, and now one real consumer path proof with governed consumption receipts |
| `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/` | execution-plane coordination shell | whitepaper completion `W2-T1 / CP1-CP5` | local-ready | closed first execution-plane tranche preserving lineage for MCP bridge, gateway, adapter, memory, prompt-preview, explainability, authorization-boundary surfacing, and explicit closure/defer posture |
| `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/` | governance-expansion coordination shell | whitepaper completion `W3-T1 / CP1` | local-ready | closed governance-expansion tranche for operational governance modules with explicit defer of concept-only `Watchdog` and `Audit / Consensus` targets |
| `EXTENSIONS/CVF_v3.0_CORE_GIT_FOR_AI/` | core primitives | layer 0 | draft | branch-track / future-facing |
| `docs/reference/` | canonical reference | source-of-truth docs | active | long-lived authoritative docs |
| `docs/assessments/` | assessment archive | audit/reassessment | active | evidence archive |
| `docs/baselines/` | baseline archive | snapshots/freeze | active | baseline chain |
| `docs/roadmaps/` | roadmap archive | remediation/planning | active | roadmap chain |
| `docs/reviews/` | scoped review archive | review evidence | active | module-specific review archive |

## Inventory Rules

- any new top-level extension line must be added here
- release status changes must also update `CVF_RELEASE_MANIFEST.md`
- maturity changes must also update `CVF_MATURITY_MATRIX.md`
