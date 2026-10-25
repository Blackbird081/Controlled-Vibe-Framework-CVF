# CVF Architecture Decisions Archive - ADR011-015

Memory class: FULL_RECORD
Status: ARCHIVED_REFERENCE
docType: reference
Date: 2026-10-26

## Purpose

Preserve the complete ADR011-015 payload while keeping the active index within its size bound.

## Scope / Owner / Source

Owner: CVF architecture decision custodian. Source: the existing active decision record before this storage rotation. The docsroot location retains the original relative-link base.

## Contract / Requirements

This is a sealed record. Storage rotation does not revoke or change any recorded decision, status or authority.

## Enforcement / Verification

Canonical UTF-8/LF source payload SHA256: `ef003099c9ba2e74e5a60fe6fa5f8ad56fc4480d1de7a44f3eef9728282fc180`. Pre-split active source SHA256: `6700bd79bcc7ea42a75061778bfeddbe272a462e60cf18b5017deaa2f3a2c254`. The complete payload below is retained without textual edits.

## Related Artifacts

[Active architecture decisions](CVF_ARCHITECTURE_DECISIONS.md).

## Claim Boundary

Historical decision preservation only; no new runtime, provider, release or product acceptance claim.

Text Encoding Exception: existing Unicode in the sealed historical decision payload is preserved.

---

## ADR-011: CVF v1.2.1 External Integration — Skill Supply Chain Pipeline

| Field | Value |
|---|---|
| Date | 2026-03-05 |
| Status | Active |
| Related commits | *(this commit)* |

### Context
A `CVF_external_integration/` folder was developed at CVF root containing a skill supply chain pipeline: intake → adapter → validator → certifier → publisher. It included models (raw/draft/certified), policies (trust/risk/domain/phase), governance hooks, and a blockchain-style audit ledger.

Architecture Check Guard (9 questions) was completed. Results: 6/9 PASS, 3 needed work.

### Decision
**1. Integration as `EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/`**

- Placed in **Layer 2 (Tools)** — this is pipeline tooling, not governance rules (Layer 1) or runtime (Layer 2.5)
- Version `1.2.1` = direct extension of v1.2 (Skill Governance: Registry, Risk model R0–R3)
- Naming follows CVF convention: `CVF_v[MAJOR].[MINOR]_[NAME]`

**2. Issues Fixed During Integration**

| Issue | Fix |
|-------|-----|
| Folder outside `EXTENSIONS/` | Moved to `EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/` |
| 4 broken import paths | Fixed `../policy/` → `./policies/`, `../external_integration/models/` → `../models/` |
| TS strict errors (`'current' possibly undefined`) | Added null guard in `verifyIntegrity()` loop |
| `ExternalSkillSource` key mismatch (`skills_sh` vs `"skills.sh"`) | Fixed to quoted key `"skills.sh"`, removed non-existent `internal_repo` |
| No R0–R3 mapping | Added canonical mapping: `low→R0, medium→R1, high→R2, critical→R3` |
| No tests | Created 29-test suite covering state machine, risk mapping, audit ledger, policy engine |
| No project config | Added `package.json`, `tsconfig.json`, `vitest.config.ts` |

**3. Test-only: `GovernanceAuditLedger.reset()` added for test isolation** (static state shared across tests)

### Rationale
- v1.2 defines Skill Governance (registry, R0–R3 risk model). v1.2.1 adds the *mechanism* to ingest external skills through that governance.
- Blockchain-style chained hash audit ledger provides enterprise-grade forensic trail.
- Policy Decision Engine with 6-layer precedence + absolute reject layers (domain/phase) aligns with CVF's layered governance model.
- State machine (raw → draft → validated → under_review → certified → promoted → production) enforces no-shortcut certification.

### Consequences
- `CVF_external_integration/` folder at root is deleted after migration.
- External skill ingestion now has a formal governance pipeline with 29 passing tests.
- Future skill imports must go through this pipeline — no direct insertion into Skill Library.
- `REVIEW/CVF_EXTERNAL_INTEGRATION_REVIEW.md` contains the full Architecture Check Guard assessment.

### Related Files
- `EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/` (new, this commit)
- `REVIEW/CVF_EXTERNAL_INTEGRATION_REVIEW.md` (Architecture Check Guard assessment)

---

## ADR-012: CVF v1.2.2 Skill Governance Engine — Integration Decision

| Field | Value |
|---|---|
| Date | 2026-03-05 |
| Status | Active |
| Related commits | *(this commit)* |

### Context
A `CVF_Skill Specification` folder was developed at CVF root containing a complete Skill Governance & Evolution Engine (CVF-SGE v2.0). It comprised 8 sub-directories and 60+ files spanning: Skill Spec Schema (CSS-1.0), Constitution layer, Governance Kernel, Phase Manager, Skill Fusion Intelligence, Evolution Engine (Acontext-style), Internal Ledger, and Policy system.

Architecture Check Guard (9 questions) was completed. The primary design question: **Version placement — new MAJOR/MINOR version or sub-extension of existing version?**

A Decision Framework (3 criteria) was established to prevent version sprawl:
1. **Scope**: New concept vs extension of existing domain
2. **Dependency**: Standalone vs natural extension of specific version
3. **User Impact**: Mandatory to know vs optional

### Decision
**Integration as `EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/`**

- **Version**: v1.2.2 (sub-extension of v1.2 Skill Governance, following v1.2.1 External Integration)
- **Layer**: 2 (Tools/Governance Tooling)
- **NOT v2.1**: CVF v2.x territory is Non-Coder UX (Safety UI Layer 4). Placing technical governance tooling in v2.x would mislead users.

**Rationale for v1.2.2 over new MAJOR/MINOR:**
| Criterion | Result |
|---|---|
| Scope | Core domain is Skill Governance (Schema, Validator, Risk) — same domain as v1.2 |
| Dependency | Natural extension of v1.2 (Skill Registry + R0–R3). v1.2.1 already is a sub-extension of v1.2 |
| User Impact | Optional — basic CVF users can skip entirely |

**Issues Fixed During Integration**

| Issue | Fix |
|---|---|
| Risk threshold conflict: policy=80 vs code=70 | Aligned `global.policy.yaml` to 70 |
| Phase transition had no governance gate | Added `GovernanceKernel.evaluate()` check in `PhaseManager.transition()` for critical phases |
| `skill.schema.yaml` missing `evaluation` block | Added `success_metrics`, `failure_conditions`, `rollback_strategy` |
| No R0–R3 canonical mapping | Added `risk_r_level` field with R0–R3 enum + numeric mapping documentation |
| `/fusion` appeared at both root and `/skill_system/fusion/` | Rewrote `TREEVIEW.md`, fusion is only in `/skill_system/fusion/` |
| Folder outside `EXTENSIONS/` | Moved to `EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/` |

### New Decision Framework (Permanent Rule)
```
MỞ VERSION MỚI khi:          MỞ RỘNG LAYER CŨ khi:
- Scope hoàn toàn mới         - Extension của domain đã có
- Cần tất cả versions làm nền  - Natural PATCH của version cụ thể
- User PHẢI biết để dùng CVF  - User có thể bỏ qua

Ví dụ đúng version mới:       Ví dụ đúng mở rộng:
  v1.6 = Agent Platform (Web)    v1.2.1 = External Integration
  v1.7 = Controlled Intelligence  v1.7.1 = Safety Runtime
  v2.0 = Non-Coder Safety Runtime v1.2.2 = Skill Governance Engine (this)
```

### Consequences
- `CVF_Skill Specification/` folder at root deleted after migration.
- Decision Framework (3 criteria) is now a permanent versioning governance rule.
- Future additions to Skill Governance domain should extend v1.2.x (v1.2.3+).
- `VERSIONING.md` and `CVF_CORE_KNOWLEDGE_BASE.md` updated with v1.2.2.

### Related Files
- `EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/` (new, this commit)
- `docs/CVF_CORE_KNOWLEDGE_BASE.md` (updated: Section II Layer 2, Section III table)
- `docs/VERSIONING.md` (updated: v1.2.2 added to Current Status)

---

## ADR-013: CVF_Layer AI Stack — Refactoring & Integration Decision

| Field | Value |
|---|---|
| Date | 2026-03-05 |
| Status | Active |
| Related commits | *(this commit)* |

### Context
A `CVF_Layer AI Stack` folder was added at CVF root containing a **compound system** — 3 external repos (Skill Evolver, AgentVeil, SkillsEntry) + 1 new Adaptive Governance layer, all mixed in a single folder with 6 subdirectories.

**Problem:** The folder spanned 4 CVF layers (2, 2.5, 3, 4) in one place. README self-identified as "CVF v1.8" but contained content far beyond v1.8 scope. This caused:
- Layer confusion (where does each component belong?)
- Version ambiguity (is this v1.8? v3.0? something else?)
- Naming violation (not following `CVF_v[X].[Y]_[NAME]` convention)

### Decision
**Refactor the compound system into 3 separate destinations:**

| Component | Source | Destination | Version | Rationale |
|---|---|---|---|---|
| Adaptive Governance + Observability | `governance/adaptive*` + `observability/` + `storage/` + `ui/` + `sdk/` | `EXTENSIONS/CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME/` | v1.8.1 | Tight coupling (skill.risk.score.ts imports from both observability/ and storage/). Natural extension of v1.8 Safety Hardening. |
| Edge Security | `runtime/edge_security/` | `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/edge_security/` | merge into v1.7.3 | Pre-kernel network layer = natural extension of v1.7.3 adapter hub. Not a new version. |
| Security Scanner | `governance/security_scanner/` | `tools/skill_security_scanner/` | n/a (tool) | Pre-install static analysis tool = Layer 2 (Tools). Was incorrectly placed under governance/. |

**Why NOT v3.0?** Applying Decision Framework (3 criteria from ADR-012):

| Criterion | Test Result |
|---|---|
| Scope | Adaptive Governance = extension of v1.8; Observability = new but coupled to adaptive; Edge Security = extension of v1.7.3; Scanner = tool |
| Dependency | Each part naturally extends a specific existing version |
| User Impact | All optional — basic CVF users can skip |

**All 3 criteria point to "extend existing versions" — no new MAJOR version needed.**

### Consequences
- `CVF_Layer AI Stack/` folder at root to be removed after integration
- v1.8.1 inherits v1.8's Layer 2.5 placement, extends into Layer 3 (observability)
- v1.7.3 gains edge_security subfolder — backward compatible, additive only
- tools/ gains skill_security_scanner — standalone Layer 2 tool
- Future observability improvements should extend v1.8.x chain
- Future edge security improvements should extend v1.7.x chain

### Related Files
- `EXTENSIONS/CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME/` (new)
- `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/edge_security/` (new subfolder)
- `tools/skill_security_scanner/` (new)
- `docs/CVF_CORE_KNOWLEDGE_BASE.md` (updated: Section II Layer 2.5+5, Section III table)
- `docs/VERSIONING.md` (updated: v1.8.1 added)

---

## ADR-014: CVF_Phase Governance Protocol — Layer 1.5 Integration

| Field | Value |
|---|---|
| Date | 2026-03-06 |
| Status | Active |
| Related commits | *(local commit, not yet pushed)* |

### Context
CVF controls **runtime execution** through Safety Runtime (v1.7.x), Safety Hardening (v1.8), and Deterministic Reproducibility (v1.9). However, there is a **critical gap**: CVF does not control the **development lifecycle** — the process of building AI-generated systems before they enter runtime.

`CVF_Phase Governance Protocol` addresses this gap by introducing a **9-stage deterministic development pipeline** with state machine verification, architecture drift detection, and phase gate enforcement.

**Uniqueness assessment:**
- Zero overlap with any existing CVF version
- Does NOT modify runtime (pre-runtime only)
- Complements all existing layers without dependency

### Decision
**Integrate as `CVF v1.1.1 — Phase Governance Protocol` (Layer 1.5)**

| Decision Point | Choice | Rationale |
|---|---|---|
| New version vs extend | Sub-extension of v1.1 | v1.1 defined governance principles; v1.1.1 implements development lifecycle enforcement |
| New layer | Layer 1.5 (Development Governance) | Sits between Core (Layer 1) and Tools (Layer 2) — pre-code verification |
| Naming | `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL` | Follows CVF convention |

**Decision Framework applied:**
| Criterion | Result |
|---|---|
| Scope | New concept, but closely related to v1.1 governance principles |
| Dependency | No dependency on specific versions — works independently |
| User Impact | Must know if using structured AI development |

→ **Sub-extension** (not new MAJOR version) — extends governance principles into development lifecycle.

### Technical fixes during integration
1. `scenario.generator.ts` — Added MAX_SCENARIOS=100, MAX_DEPTH=50, cycle-safe DFS with visited tracking
2. `mermaid.parser.ts` — Added `toStateMachine()` converter to bridge Set/Map ↔ array/Record data structures
3. `gate.result.ts` — Added R0–R3 canonical CVF risk level mapping with `deriveRiskLevel()`

### Consequences
- CVF architecture **expands from 5 layers to 6** (Layer 1.5 added)
- Development governance = separate from runtime governance (no interference)
- Future development tooling should extend v1.1.x chain
- Phase Gate validation integrates with CVF audit trail

### Related Files
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/` (new)
- `docs/CVF_CORE_KNOWLEDGE_BASE.md` (updated: Layer 1.5 added, Section III table)
- `docs/VERSIONING.md` (updated: v1.1.1 added)

---

## ADR-015: CVF v1.1.2 — Phase Governance Hardening

| Field | Value |
|---|---|
| Date | 2026-03-06 |
| Status | Active |
| Layer | 1.5 — Development Governance |
| Related commits | *(local commit, not yet pushed)* |

### Context
CVF v1.1.1 established the Phase Governance Protocol but had architectural gaps identified by independent testers (LR-002) and the De_xuat review:

1. No deterministic pipeline order → inconsistent governance results
2. No trust boundary for artifacts → silent rewrites undetected
3. Capability isolation absent → agents could inject artifacts in wrong phases
4. Deadlock detector was actually a cycle detector (LR-002) → dead-end states missed
5. Scenario generator only explored `states[0]` → partial coverage
6. No system-level invariants → cross-state logic violations undetected
7. No runtime executor → pipeline order not enforced at runtime

### Decision
**Implement as v1.1.2 — Phase Governance Hardening** on `main` branch (sub-extension of v1.1.1).

| Decision Point | Choice | Rationale |
|---|---|---|
| Version | PATCH (v1.1.2) | All changes extend v1.1.1 logic, no new modules in /governance |
| Branch | main | Backward compatible, no structural break |
| Executor placement | `runtime/` outside `/governance/` | De_xuat_01: executor ≠ engine. Keep /governance pure. |

### Changes (9 items)

| # | De_xuat | File changed | Type |
|---|---|---|---|
| 1 | 02 | `gate.rules.ts` | Added `GOVERNANCE_PIPELINE` const (6-module deterministic order) |
| 2 | 06 | `artifact.registry.ts` | Added Trust Boundary: `verifyAllHashes()`, `contentHash` per artifact |
| 3 | 06 | `artifact.registry.ts` | Added Hash Ledger: `getHashLedger()`, `detectTampering()` |
| 4 | 07 | `phase.protocol.ts` | Added Capability Isolation: `PHASE_CAPABILITIES`, `CapabilityViolationError` |
| 5 | 04 | `execution.trace.ts` | Added Self-Debugging: `detectAnomalies()` — DEAD_PATH, UNREACHABLE_STATE, LOOP_TRAP |
| 6 | 05 | `scenario.generator.ts` | Added System Invariants: `checkInvariants()`, `BUILT_IN_INVARIANTS` (INV-01/02/03) |
| 7 | 01 | `runtime/governance.executor.ts` | NEW — Runtime pipeline orchestrator (6 modules in PIPELINE order) |
| 8 | 11p | `governance.audit.log.ts` | Added Hash Ledger audit: `recordHashLedger()`, `HashLedgerSnapshot` |
| 9 | 11p+12p | `docs/CVF_EVOLUTION_GOVERNANCE_RULES.md` | NEW — 5 Design Invariants + Evolution Governance (3-layer model) |

### Test coverage
- Total: 22 tests (previously 12) — 10 new tests for v1.1.2 features
- All 22/22 PASS
- Coverage threshold maintained (90/80/90/90)

### Consequences
- `registerArtifact()` now accepts optional `content` param for hash generation
- Gate rule `artifact_hashes_verified` added as `critical: true`
- Agents without hashed artifacts will receive R3 rejection (by design)
- `runtime/` folder introduced as executor layer (outside governance modules)

### Related Files
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/phase_gate/gate.rules.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/phase_protocol/artifact.registry.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/phase_protocol/phase.protocol.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/scenario_simulator/execution.trace.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/scenario_simulator/scenario.generator.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/reports/governance.audit.log.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/runtime/governance.executor.ts` (new)
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/docs/CVF_EVOLUTION_GOVERNANCE_RULES.md` (new)
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/v1.1.1.test.ts` (updated)
- `docs/VERSIONING.md` (updated: v1.1.2 added)

---

<!-- End of sealed ADR011-015 payload. -->
