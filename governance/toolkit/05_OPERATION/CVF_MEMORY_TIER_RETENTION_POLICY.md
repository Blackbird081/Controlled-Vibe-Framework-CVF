# CVF Memory Tier Retention Policy

Memory class: GOVERNANCE_POLICY

Status: ACTIVE_POLICY

Date: 2026-05-22

Owner: CVF Governance Kernel

## Purpose

Define the bounded memory retention rule for the T5 runtime memory wiring
tranche and prevent ephemeral task memory from being mistaken for durable,
archive, provider, or external memory.

## Scope / Target / Owner Boundary

This policy applies to task-tier runtime memory records created under T5 in
`EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/task-memory/` and surfaced in
cvf-web audit-memory readout payloads.

T5 authorizes only the Ephemeral tier. Durable storage, external memory
services, provider-side memory, archive tiers, retrieval flows, and prompt
reinjection remain outside this policy's authorized implementation scope.

## Rule

CVF memory tiers for the T5 context are:

- **Ephemeral** — in-process and in-memory only; lost on process exit; no disk
  write, no network call, no database, no provider memory, and no archive.
  This is the only tier authorized by T5.
- **Durable** — file-backed or database-backed memory. This requires separate
  authorization beyond T5 and is not authorized in this tranche.
- **External** — third-party or provider-side memory service. This requires
  separate authorization beyond T5 and is not authorized in this tranche.

Ephemeral task memory retention lasts only within a single process lifetime and
only until the entry expiry timestamp. There is no cross-session persistence.

## Allowed / Forbidden

Allowed:

- in-memory `Map` storage for task-tier entries;
- explicit `expiresAt` checks on read and list operations;
- deterministic rejection of non-task tiers;
- audit readout fields that describe the task-memory decision.

Forbidden:

- file writes or file-backed storage;
- database reads or writes;
- external HTTP calls or third-party memory services;
- provider-side memory;
- archive or long-term memory tiers;
- memory retrieval or prompt reinjection expansion.

## Exceptions

No durable-memory exception is granted by T5.

Any write beyond the ephemeral tier requires a new GC-018 baseline with a fresh
blocked-work override and operator authorization. Generic continuation language
does not authorize durable task memory.

## Enforcement Surface

Primary enforcement surfaces:

- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/task-memory/`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/audit-memory-receipt.ts`
- `docs/baselines/archive/CVF_GC018_T5_RUNTIME_MEMORY_WIRING_2026-05-22.md`
- `docs/reviews/archive/CVF_T5_RUNTIME_MEMORY_WIRING_COMPLETION_2026-05-22.md`

Verification must confirm that the task-memory store imports no filesystem,
network, database, or provider client.

## Related Artifacts

- `docs/roadmaps/archive/CVF_REVIEW_CVF_PAIN_POINT_DELIVERY_GAP_ROADMAP_V2_2026-05-22.md`
- `docs/work_orders/archive/CVF_WO_T5_RUNTIME_MEMORY_WIRING_2026-05-22.md`
- `docs/baselines/archive/CVF_GC018_T5_RUNTIME_MEMORY_WIRING_2026-05-22.md`
- `docs/reviews/archive/CVF_T5_RUNTIME_MEMORY_WIRING_COMPLETION_2026-05-22.md`

## Final Clause

T5 task memory is ephemeral only. `CAPTURED` means an in-process task entry was
present at readout time; it does not imply durability, replay, retrieval,
archive storage, provider memory, or reinjection.
