# CVF ERH-DUR2 External Storage And Distributed Durability Workflow Chain

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED
Date: 2026-06-05
ERH_DUR2_DECISION: DUR3_NOT_NEEDED_NOW
ERH_DUR2_LEDGER_VERSION: 2026-06-05

## Scope

This workflow chain reference covers the ERH-DUR2 pluggable storage adapter
architecture. DUR2 introduces a `StorageAdapter` interface seam so the CVF
durable evidence store and policy snapshot registry can target different
storage backends without changing caller code.

## Applies To

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/storage-adapter.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/control-plane-events.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/policy-snapshot-registry.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/storage-adapter.test.ts`
- `governance/compat/check_erh_external_storage_adapter.py`
- `governance/compat/test_check_erh_external_storage_adapter.py`

## Purpose

ERH-DUR1 moved the control-plane event store from `os.tmpdir()` to a durable
local `.cvf/runtime` path and made `policySnapshotId` reconstructable via
`policy-snapshot-registry.ts`. DUR2 extends this by making the file I/O
backend pluggable:

- `EventListAdapter<T>` — interface for list-backed stores (event store).
- `KeyValueAdapter<T>` — interface for key-value stores (snapshot registry).
- `FileEventListAdapter` / `FileKeyValueAdapter` — wrap DUR1 file I/O with
  zero behavior change; default when `CVF_STORAGE_ADAPTER_TYPE` is unset.
- `SQLiteEventListAdapter` / `SQLiteKeyValueAdapter` — local SQLite backend
  selected only by `CVF_STORAGE_ADAPTER_TYPE=sqlite`.
- `RedisEventListAdapter` / `RedisKeyValueAdapter` — stub classes that throw
  `CVF_NOT_IMPLEMENTED`; reserved for a future DUR3 Redis backend.
- `buildEventListAdapter()` / `buildKeyValueAdapter()` — factory functions
  that read `CVF_STORAGE_ADAPTER_TYPE` and return the correct adapter.

## ERH_DUR2_DECISION

`ERH_DUR2_DECISION: DUR3_NOT_NEEDED_NOW`

DUR3 (multi-instance consensus, live Redis, distributed audit stream) is
deferred. The Redis stubs are present to confirm the interface is extensible.
The SQLite backend added on 2026-06-06 is a local durable backend only; no live
Redis connection, connection pooling, migration script, external service, or
distributed durability is provided or claimed.

## Components

| Component | Role |
|-----------|------|
| `storage-adapter.ts` | Interface definitions, File/SQLite/Redis implementations, factories |
| `control-plane-events.ts` | Uses `buildEventListAdapter<ControlPlaneEvent>()` |
| `policy-snapshot-registry.ts` | Uses `buildKeyValueAdapter<PolicySnapshotRecord>()` |
| `storage-adapter.test.ts` | focused Vitest tests covering all adapter classes and factories |
| `check_erh_external_storage_adapter.py` | machine checker including SQLite selector coverage |
| `test_check_erh_external_storage_adapter.py` | Unit tests for checker |

## Markers

- `ERH_DUR2_MARKER: EXTERNAL_STORAGE_ADAPTER_ACTIVE` — present in
  `storage-adapter.ts`, `control-plane-events.ts`, `policy-snapshot-registry.ts`,
  and `storage-adapter.test.ts`.
- `CVF_STORAGE_ADAPTER_VERSION: 2026-06-05` — in `storage-adapter.ts`.

## Environment Variable

| Variable | Default | Purpose |
|----------|---------|---------|
| `CVF_STORAGE_ADAPTER_TYPE` | `file` | Selects adapter backend: `file`, `sqlite`, or `redis` (stub) |

## Verification

| Check | Result |
|-------|--------|
| TypeScript check (`npm run check`) | PASS |
| `storage-adapter.test.ts` (SQLite addendum tests) | PASS after 2026-06-06 rerun |
| DUR1 regression tests (37 tests) | PASS |
| `check_erh_external_storage_adapter.py --enforce` | COMPLIANT |
| `test_check_erh_external_storage_adapter.py` | PASS |
| Autorun pre-implementation gate | PASS |

## Interlock Registry

Connection ID: `erh-dur2-external-storage-adapter-workflow-chain`
Registry: `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json`

## Claim Boundary

This workflow chain proves:
- Pluggable storage adapter interface is defined and wired into `control-plane-events.ts` and `policy-snapshot-registry.ts`.
- `FileEventListAdapter` and `FileKeyValueAdapter` preserve DUR1 file-backed behavior with zero behavioral change.
- `SQLiteEventListAdapter` and `SQLiteKeyValueAdapter` provide a local durable
  backend when `CVF_STORAGE_ADAPTER_TYPE=sqlite`.
- `RedisEventListAdapter` and `RedisKeyValueAdapter` stubs throw `CVF_NOT_IMPLEMENTED`.
- `buildEventListAdapter()` and `buildKeyValueAdapter()` factories route correctly based on `CVF_STORAGE_ADAPTER_TYPE`.
- Machine checker (`check_erh_external_storage_adapter.py`) enforces 18 structural checks.

This workflow chain does **not** prove:
- Live Redis connectivity or connection pooling.
- Production database, distributed durability, or external storage service.
- Multi-instance consensus (DUR3).
- Tamper-proof audit, hosted readiness, public readiness, or production-grade distributed retention.
