# CVF Agent Defect Intelligence Foundation (ADIF) - Front Door

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-22

Index classification: GOVERNED_DOC (not an INDEX_ARTIFACT). This front door
points to the ADIF owner-reconciliation contract; it does not itself
enumerate, map, or project CVF state.

**Applies to:** any agent or operator working on a future ADIF tranche
(ADIF-T1 through T5).

## Purpose

ADIF is a planned, bounded, task-scoped defect-intelligence lookup layer.
Before any ADIF schema, source, resolver, or integration code is authored,
read the ADIF-T0 owner-reconciliation contract linked below. It defines
which fields ADIF must reuse from existing canonical owners and which fields
ADIF itself owns.

## Current State

| Tranche | Output | Status |
|---|---|---|
| ADIF-T0 | Owner reconciliation and taxonomy contract | committed (this folder) |
| ADIF-T1 | Entry schema, source layout, seed dictionary | committed (`CVF_ADIF_ENTRY_TEMPLATE.md` and `entries/`) |
| ADIF-T2 | Task/role/phase defect packet resolver | committed (`CVF_ADIF_T2_RESOLVER_CONTRACT.md`; `governance/compat/run_adif_defect_resolver.py`) |
| ADIF-T3 | Early preflight integration | committed (joint with T4; `governance/compat/run_adif_preflight_readout.py`) |
| ADIF-T4 | Reviewer finding intake and de-dup bridge | committed (joint with T3; `governance/compat/run_adif_finding_intake_bridge.py`) |
| ADIF-T5 | Promotion lifecycle, drift, and quality guard | committed (`governance/compat/check_adif_entry_integrity.py`) |

## Read This First

1. `docs/roadmaps/CVF_AGENT_DEFECT_INTELLIGENCE_FOUNDATION_ROADMAP_2026-06-22.md`
   - the full tranche sequence and design principles.
2. `docs/reference/agent_defect_intelligence/CVF_ADIF_T0_OWNER_RECONCILIATION_TAXONOMY_CONTRACT.md`
   - the binding ownership and taxonomy contract.
3. `docs/reference/agent_defect_intelligence/CVF_ADIF_ENTRY_TEMPLATE.md`
   - the fixed entry field template every entry must follow.
4. `docs/reference/agent_defect_intelligence/entries/` - eight seed entries
   (`ADIF-0001` through `ADIF-0008`), each citing canonical evidence and an
   `enforcementLevel`.
5. `docs/reference/agent_defect_intelligence/CVF_ADIF_T2_RESOLVER_CONTRACT.md`
   - the read-only resolver's input/output contract.
6. `docs/baselines/CVF_GC018_ADIF_CONTINUOUS_EXECUTION_AUTHORIZATION_2026-06-22.md`
   - the continuous-execution authorization governing T0 through T5.

## Reading An Entry

Each file under `entries/` opens with a fenced field block (`defectId`,
`defectCategory`, `defectClass`, `enforcementLevel`, etc.) followed by a bad
example, a good example, canonical sources, and remediation.

## Using The Resolver

`governance/compat/run_adif_defect_resolver.py` provides
`resolve_defect_packet(...)`, a deterministic, read-only function callable
by any internal agent. It accepts task class, role, lifecycle phase,
surface selector, and an optional risk ceiling, then returns a bounded,
ordered defect packet. No CLI or MCP adapter exists yet.

## Preflight Readout And Finding Intake

`governance/compat/run_adif_preflight_readout.py` formats a bounded,
human-readable readout of the resolver's output for pre-implementation
context, without duplicating its matching logic.
`governance/compat/run_adif_finding_intake_bridge.py` classifies one
reviewer finding into exactly one of five bounded outcomes (link, propose
update, propose new guidance-only candidate, propose machine-check
candidate, reject as non-reusable) without ever auto-promoting it.

## Entry Integrity Guard

`governance/compat/check_adif_entry_integrity.py` is a standalone,
read-only diagnostic that detects dangling canonical source paths and checker
bindings, dangling supersession references, duplicate IDs, stale supersession
cycles, invalid enums, and dishonest enforcement-level claims across the
committed entry set. It is not wired into any autorun phase or hook chain.

## Canonical Owners ADIF Must Not Duplicate

| Concern | Owner |
|---|---|
| `defectClass`, learning lane, disposition | `docs/reference/CVF_FINDING_TO_GOVERNANCE_LEARNING_TRIGGER_STANDARD.md` |
| `defectRole`, root-cause grouping | `docs/reference/CVF_FINDING_PROPAGATION_AND_ROOT_CAUSE_GROUPING_STANDARD_2026-06-16.md` |
| Worker friction capture | `docs/reference/worker_experience_retrospective/README.md` |
| Task-class / role guard map | `docs/reference/guard_orientation/README.md` |
| INDEX artifact classification | `docs/reference/CVF_INDEX_CLASSIFICATION_STANDARD_2026-06-21.md` |

## Claim Boundary

This front door is a navigation pointer only. It does not implement any
ADIF tranche, change any canonical standard, or claim defect-prevention
effectiveness.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reference front door. No public-sync repository
work or public catalog claim is authorized.
