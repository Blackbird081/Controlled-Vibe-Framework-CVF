# CVF GC-018 — W69-T1 Governed Registry Lifecycle + Read Model Authorization

Date: 2026-04-13
Wave: W69-T1
Class: REALIZATION
Authorization: **AUTHORIZED — proceed with CP1 immediately**

---

## Decision

`W69-T1 Governed Registry Lifecycle + Read Model` is authorized to proceed.

Operator has explicitly directed implementation per the execution plan at
`docs/roadmaps/CVF_W69_T1_GOVERNED_REGISTRY_LIFECYCLE_READMODEL_EXECUTION_PLAN_2026-04-13.md`
and the binding protocol at
`docs/reference/CVF_W69_T1_GOVERNED_REGISTRY_LIFECYCLE_READMODEL_AGENT_PROTOCOL_2026-04-13.md`.

W68-T1 Governed Registry Hardening is CLOSED DELIVERED as of commit `d34a1a4e`.
This wave follows directly and stays within the same governed registry scope.

---

## Scope Boundary

**Allowed**: lifecycle semantics, retire/re-register behavior, filtered read model,
docs/handoff alignment.

**Not allowed**: `/api/execute`, provider adapters, PVV/API-key lanes, sandbox posture,
external storage migration, historical JSONL mutation.

---

## Control Points

| CP | Description |
|----|-------------|
| CP1 | Lifecycle semantics — active/retired model; retire action; duplicate gate aligned to active state |
| CP2 | Read/query model — filtered list by status/source_ref/type; detail distinguishes active vs retired |
| CP3 | Docs/handoff closure |

---

*Authorized: 2026-04-13*
*Wave: W69-T1 — follows W68-T1 CLOSED DELIVERED*
