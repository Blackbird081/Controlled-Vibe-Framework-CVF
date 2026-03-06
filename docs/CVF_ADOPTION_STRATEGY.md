# CVF Adoption Strategy — v3.0

> **Developed by Tien - Tan Thuan Port@2026**  
> **Version:** v3.0 (branch `cvf-next`)  
> **Date:** 2026-03-06

---

## Overview

CVF is designed for **non-disruptive, incremental adoption**.

No team or organization should need to restructure their entire workflow to start using CVF. Instead, CVF is deployed in **5 progressive phases**, each adding more control without removing existing capabilities.

---

## 5-Phase Adoption Model

### Phase 1 — Visibility (Observe Only)

**Goal:** Understand how AI agents develop without changing their behavior.

**Actions:**
- Install CVF Core (no enforcement)
- Wrap AI agent outputs with `createCommit()` — read-only observation
- Log `ArtifactStagingArea` entries without gating
- No rejections, no pipeline enforcement

**Artifacts produced:** Commit logs, artifact inventory

**Exit criteria:** Team understands what AI is producing and in which phases.

---

### Phase 2 — Risk Awareness (Report, Don't Block)

**Goal:** Identify governance risks without blocking development.

**Actions:**
- Run `GovernanceExecutor.run()` in dry-run mode
- Report R0–R3 risk levels without enforcing gate
- Surface `detectAnomalies()` and `checkInvariants()` findings as warnings
- Show `verifyAllHashes()` failures as alerts (not errors)

**Artifacts produced:** Risk reports, governance findings per sprint

**Exit criteria:** Team understands where R3 risks cluster and accepts remediation.

---

### Phase 3 — Policy Enforcement (Gate Critical Failures)

**Goal:** Prevent critical governance failures from reaching production.

**Actions:**
- Enable `PhaseGate.enforce()` for `critical: true` checks only
- `artifact_hashes_verified` required (Trust Boundary enforcement)
- Capability Isolation (`CapabilityViolationError`) activated
- R3 commits are blocked; R0–R2 pass with warnings

**Artifacts produced:** CHANGELOG entries per gated rejection, audit trail

**Exit criteria:** 0 R3 commits reaching production for 2+ sprints.

---

### Phase 4 — Execution Governance (Full Pipeline)

**Goal:** All AI commits pass full GOVERNANCE_PIPELINE before merge.

**Actions:**
- `GovernanceExecutor.run()` required before any `git merge`
- All 6 modules in GOVERNANCE_PIPELINE must pass
- `ArtifactLedger.commit()` called for all ACCEPTED artifacts
- `GovernanceAuditLog.recordHashLedger()` snapshot per governance run

**Artifacts produced:** Ledger entries, full audit snapshots, hash lineage

**Exit criteria:** Full governance coverage for all AI-produced commits.

---

### Phase 5 — Autonomous Governance (Self-Validating AI)

**Goal:** AI agents self-validate before producing commits.

**Actions:**
- AI agents call `validateCommit()` before submitting commit
- `ArtifactStagingArea` used natively in agent workflow
- `ProcessModel` drives agent phase transitions (agent asks for `advanceStage` approval)
- Anomaly detection integrated into agent's pre-commit check

**Artifacts produced:** Self-certified commits, governance certificates per artifact

**Exit criteria:** Human review focuses on strategy, not individual commit validation.

---

## Integration Patterns

| Pattern | When to use |
|---|---|
| **Wrapper** | Wrap existing AI tool output → CVF commit (safest, no changes to AI) |
| **Middleware** | Insert CVF validation between AI output and repo write |
| **Native** | Build AI agent with CVF Core as internal data model (most integrated) |

---

## Organizational Roles

| Role | Responsibility |
|---|---|
| **CVF Governor** | Defines governance rules, manages PhaseGate thresholds |
| **CVF Integrator** | Implements CVF in AI pipelines, maintains executor |
| **AI Developer** | Produces AICommits, registers artifacts, advances process stages |
| **Auditor** | Reviews ArtifactLedger history, GovernanceAuditLog snapshots |

---

## Breaking Change Policy

CVF Core follows strict backward compatibility:
- `createCommit()` inputs are additive-only (new fields are optional)
- `ArtifactLedger` entries are immutable — no migrations
- `GOVERNANCE_PIPELINE` order is FROZEN per minor version

Changes requiring MAJOR version bump:
- Adding new _required_ fields to `AICommit`
- Changing `commit_id` hash algorithm
- Altering `GOVERNANCE_PIPELINE` module list or order
