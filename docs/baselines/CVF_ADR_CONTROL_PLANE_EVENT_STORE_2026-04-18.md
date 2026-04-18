# CVF ADR: Admin Control Plane Event Store
*Date: 2026-04-18*
*Status: Accepted for Phase C0*

## Decision

`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/control-plane-events.ts` remains the canonical source-of-truth for admin control plane events:

- `UnifiedAuditEvent`
- `CostEvent`
- append-only policy events introduced in Phase C

`governanceLedger()` is not reused for this store.

## Why Not `governanceLedger()`

1. `governanceLedger()` is the ledger for governance workflow records such as phase transitions, knowledge compile evidence, and governance pipeline artifacts.
2. Admin control plane telemetry has different access patterns: high-frequency cost events, silent admin denials, quota enforcement evidence, and operator-facing FinOps reads.
3. Phase B already shipped `control-plane-events.ts` and the admin UI depends on it directly, so consolidating the admin surface on that store creates less operational risk than forcing an immediate migration into a different workflow ledger.

## Canonical Boundary

- `control-plane-events.ts` is the canonical store for admin control plane evidence.
- `governanceLedger` remains the canonical store for governance workflow evidence.
- Cross-linking between the two is allowed through audit payload references, but they are not treated as the same ledger.

## Deferred Migration Rule

Storage migration is deferred to Phase D2.

That later phase may consolidate backing storage only if all of the following are true:

1. both ledgers share a single durability requirement,
2. retention and export semantics are harmonized,
3. migration preserves append-only evidence guarantees,
4. admin UI read latency does not regress.

Until then, Phase C code must extend the existing admin control plane store rather than create another source-of-truth.

## GC-023 Note

`control-plane-events.ts` passed GC-023 pre-commit checks at commit `213c1961`. No exception registry entry is required because the file remained below the `general_source` threshold at that point.
