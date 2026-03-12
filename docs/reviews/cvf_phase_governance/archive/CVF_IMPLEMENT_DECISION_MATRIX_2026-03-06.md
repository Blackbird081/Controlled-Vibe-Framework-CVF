# Decision Matrix - Implement / No-Implement (13 De_xuat)

Date: 2026-03-06  
Purpose: Scope control before major upgrade

Legend:
- Priority: P0 (highest) -> P3 (lowest)
- Effort: S / M / L / XL
- Risk: Low / Medium / High
- Decision:
  - `IMPLEMENT-NOW`: include in near-term scoped execution
  - `IMPLEMENT-LATER`: accepted, but deferred to next track/version
  - `HOLD`: concept valid but blocked by dependency/contract gaps

## Matrix

| ID | Title (short) | Decision | Priority | Effort | Risk | Primary Dependencies | Notes |
|---|---|---|---|---|---|---|---|
| 01 | Governance Auto-Executor | IMPLEMENT-NOW | P1 | M | Medium | execution order contract | Place executor outside immutable governance module tree |
| 02 | Pipeline Execution Order | IMPLEMENT-NOW | P0 | S | Low | none | Deterministic pipeline is mandatory foundation |
| 03 | Multi-State-System Governance | IMPLEMENT-LATER | P2 | L | Medium | 02, state registry model | Valuable for scale; not first-wave critical |
| 04 | Self-Debugging Architecture | IMPLEMENT-NOW | P1 | M | Medium | execution trace normalization | Strong pre-runtime defect reduction |
| 05 | System Invariant Verification | IMPLEMENT-NOW | P1 | M | Medium | invariant specification | Define invariants before enforcement |
| 06 | Artifact Consistency + Trust Boundary + Hash Ledger | IMPLEMENT-NOW | P0 | L | High | artifact identity + hash policy | Highest security/integrity impact |
| 07 | Self-Policing + Capability Isolation | IMPLEMENT-NOW | P0 | M | Medium | phase-capability map | Critical for phase boundary control |
| 08 | AI Process Model + Resource Governance + Recovery + Deterministic Build + AI Commit | IMPLEMENT-LATER | P1 | XL | High | 09, 10, migration ADR | Too broad for hardening wave |
| 09 | Git Mapping + Phase-Bound Branch | IMPLEMENT-LATER | P2 | L | High | 10, artifact ledger | Requires core-model formalization first |
| 10 | AI-COMMIT SPEC + Minimal Core Definition | HOLD | P1 | L | High | ADR + versioning decision | Core identity change; major-version gate required |
| 11 | 3 Architecture Risks + Evolution Governance + 3 Primitives | IMPLEMENT-NOW (partial) | P1 | M | Medium | governance policy update | Implement governance principles now; primitives full rollout later |
| 12 | Design Invariants + Mental Model + Adoption Strategy | IMPLEMENT-NOW (partial) | P1 | S | Low | docs governance baseline | Adopt invariants/docs now; full adoption program can be staged |
| 13 | Architecture Map | IMPLEMENT-LATER | P3 | S | Low | core/full boundary finalized | Publish after model freeze |

## Scope Recommendation

### Near-term execution scope (recommended)
- 02, 06, 07, 04, 05, 01
- 11 (principles/enforcement parts only)
- 12 (invariants/docs parts only)

### Deferred scope (next track/major wave)
- 03, 08, 09, 13
- 10 remains HOLD until ADR/version gate is approved

## Gating Policy Before Any Item Moves to IMPLEMENT-NOW

1. Clear dependency closure for item.
2. Compatibility statement against current extension baseline.
3. Test gate defined (`check`, `test:coverage`, compat doc checks).
4. Traceability (`requestId`, trace batch, remediation log).

## Operational Addendum (2026-03-07)

- `docs/**/*.md` governance enforcement is now **implemented locally** via `governance/compat/check_docs_governance_compat.py`.
- This hardening is considered **local-ready support infrastructure**, not the primary implementation target.
- Priority rule for upcoming execution:
  1. close independent-assessment findings first
  2. preserve local readiness without pushing prematurely
  3. extend governance enforcement beyond `docs/` only after higher-priority remediation items are stable

## Implementation Progress Addendum (2026-03-07)

The matrix below remains the planning baseline. Actual execution progress must be recorded incrementally:

| ID | Execution progress | Current status note |
|---|---|---|
| 01 | Advanced in current wave | `GovernanceExecutor` exists outside `/governance/`, now hardened with plugin registry, optional audit persistence, shared control-plane policy binding, `cvf-web` route-backed governance binding resolution inside the async enforcement path, and a canonical exported governance state registry that is now populated with a first operational agent entry. |
| 02 | Advanced in current wave | Deterministic `GOVERNANCE_PIPELINE` is enforced, tested, and now runs `artifact_integrity` first as fail-fast trust boundary. |
| 04 | Started | Self-debugging signals (`detectAnomalies`) already wired into executor and covered by focused tests. |
| 05 | Started | Built-in invariants are enforced in scenario simulation; invariant catalog can still expand later. |
| 06 | Partially implemented | Hash ledger + trust boundary exist; executor now persists ledger snapshots when audit logging is provided. |
| 07 | Advanced in current wave | Capability isolation exists in phase protocol and now also flows into a unified `cvf-web` governance snapshot with explicit registry/UAT binding points that can be resolved from canonical local records, consumed by async enforcement, and anchored to a canonical exported state registry; data completeness remains open, but the registry is no longer template-only. |
| 11 | Partially implemented | Evolution governance principles are now reflected both in policy docs, executor boundary design, and control-plane-based policy binding. |
| 12 | Partially implemented | Design invariants/docs baseline has been adopted and kept synchronized with implementation updates. |

Remaining near-term priority after current batch:
- validate whether `02` now needs any further ordering refinement beyond the current trust-boundary-first model
- continue closing `W1/W2` from the roadmap, not just extension-local hardening
