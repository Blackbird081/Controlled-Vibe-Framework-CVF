# CVF Architecture Decisions

> **Location:** `docs/CVF_ARCHITECTURE_DECISIONS.md`
> **Format:** See `governance/toolkit/05_OPERATION/CVF_ADR_GUARD.md`
> **Rule:** Every entry must correspond to a commit using a trigger pattern (`feat(governance):`, `feat(domain):`, etc.)

---

> **Archive:** ADR-001 through ADR-010 have been archived to [`docs/CVF_ARCHITECTURE_DECISIONS_ARCHIVE_ADR001-010.md`](CVF_ARCHITECTURE_DECISIONS_ARCHIVE_ADR001-010.md). The archive is a sealed FULL_RECORD and must not be modified.

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

## ADR-016: CVF v3.0 — Core Foundation Primitives (Major Version Gate)

| Field | Value |
|---|---|
| Date | 2026-03-06 |
| Status | DRAFT — pending merge of `cvf-next` → `main` |
| Branch | `cvf-next` |
| Layer | Layer 0 — Foundation Primitives (NEW) |
| Related commits | *(local branch cvf-next, not yet merged/pushed)* |

### Context
CVF v1.x (Layers 1–2.5) addresses development governance and runtime safety. However, there is no formal model for **what AI produces** — only governance of the process. 

The De_xuat review (De_xuat_08–13 + Whitepaper) proposes a paradigm shift: CVF should define a **"Git for AI Development"** model — a set of first-class primitives that describe AI output in the same structured, traceable way that Git describes code changes.

This is a **core identity change** — from "AI process governance tool" to "AI development substrate". Per CVF Versioning Policy, a core identity change requires a MAJOR version bump.

### Decision
**CVF v3.0 — Core Foundation Primitives** on branch `cvf-next`.

| Decision Point | Choice | Rationale |
|---|---|---|
| Version | MAJOR (v3.0) | Core identity change: adds Layer 0 to the framework |
| Branch | `cvf-next` | Separate from `main` to avoid disrupting v1.1.x users |
| Scope | De_xuat_08–13 (partial: 10p, 11, 12) | Staged scope per DE_XUAT_IMPLEMENT_DECISION_MATRIX |
| De_xuat_10 status | Implemented as partial (AI Commit schema + parser) | core_id change requires this gate |
| De_xuat_03, 08full, 09-phase-branch | DEFERRED → v3.x | Too broad for Phase 2 first wave |

### Layer 0 Modules Implemented

| Module | File | Primitive |
|---|---|---|
| AI Commit Schema | `ai_commit/ai.commit.schema.ts` | Commit (AICommit interface) |
| AI Commit Parser | `ai_commit/ai.commit.parser.ts` | Commit (createCommit, verifyIntegrity) |
| AI Commit Validator | `ai_commit/ai.commit.validator.ts` | Commit (8 RULE checks) |
| Artifact Staging | `artifact_staging/artifact.staging.ts` | Staging (4-state machine) |
| Artifact Ledger | `artifact_ledger/artifact.ledger.ts` | Artifact (append-only, content-addressed) |
| Process Model | `process_model/process.model.ts` | Process (gate-required, multi-process) |
| Core Index | `index.ts` | All 3+1 Primitives export |

### Documentation Produced

- `docs/reference/CVF_ARCHITECTURE_MAP.md` — Layer diagram, module list, entry points
- `docs/reference/CVF_WHITEPAPER_GIT_FOR_AI.md` — Formal whitepaper
- `docs/reference/CVF_ADOPTION_STRATEGY.md` — 5-phase adoption model
- `docs/reference/CVF_SKILL_LIFECYCLE.md` — 6-state skill governance model

### Test coverage
- Total: 25 tests — 100% new (CVF Core tests)
- All 25/25 PASS

### Merge prerequisites (before merging cvf-next → main)
1. ADR-016 reviewed and approved
2. Backward compatibility with v1.1.x confirmed (no breaking changes to v1.1.x)
3. VERSIONING.md updated to v3.0
4. CVF_CORE_KNOWLEDGE_BASE.md updated with Layer 0 description

### Consequences
- CVF architecture expands from 6 layers to 7 (Layer 0 added)
- CVF Core and CVF Full become officially distinct scopes
- AI agents can now produce first-class CVF commits (not just trigger governance)
- Future: De_xuat_03 (Multi-State-System) and De_xuat_09 (Phase-Bound Branch) → v3.x

### Related Files
- `EXTENSIONS/CVF_v3.0_CORE_GIT_FOR_AI/` (new — branch cvf-next)
- `docs/reference/CVF_ARCHITECTURE_MAP.md` (new)
- `docs/reference/CVF_WHITEPAPER_GIT_FOR_AI.md` (new)
- `docs/reference/CVF_ADOPTION_STRATEGY.md` (new)
- `docs/reference/CVF_SKILL_LIFECYCLE.md` (new)
- `docs/VERSIONING.md` (pending update: v3.0 added)

---

## ADR-017: Operational Release Manifest Separation

| Field | Value |
|---|---|
| Date | 2026-03-07 |
| Status | Active |
| Related commits | *(local commit, not yet pushed)* |

### Context

By March 2026, CVF had a growing mismatch between:

- versioning policy (`docs/VERSIONING.md`)
- root README positioning
- review/baseline documents
- actual locally implemented extension lines (`v1.8`, `v1.9`, `v2.0`, `v3.0 draft`)

This made it harder to answer simple operational questions such as:

- Which line is the current baseline?
- Which versions are stable vs local-only?
- Which extensions are reference-only vs current upgrade targets?

The baseline review explicitly identified this as a weakness in release/version narrative and ecosystem maturity mapping.

### Decision

Separate **versioning policy** from **operational release state**.

| Concern | Canonical file |
|---|---|
| Naming/version semantics | `docs/VERSIONING.md` |
| Operational release state | `docs/reference/CVF_RELEASE_MANIFEST.md` |
| Module scope/inventory | `docs/reference/CVF_MODULE_INVENTORY.md` |
| Operational maturity view | `docs/reference/CVF_MATURITY_MATRIX.md` |

### Consequences

- `docs/VERSIONING.md` remains normative for version rules, not day-to-day release readiness.
- Release/baseline questions should now resolve through the manifest/inventory/maturity trio.
- README and review-roadmap entrypoints must point to these reference docs.
- Future version additions must update both policy and operational reference layers.

### Related Files

- `docs/reference/CVF_RELEASE_MANIFEST.md`
- `docs/reference/CVF_MODULE_INVENTORY.md`
- `docs/reference/CVF_MATURITY_MATRIX.md`
- `docs/VERSIONING.md`
- `docs/reference/CVF_ARCHITECTURE_MAP.md`
- `docs/INDEX.md`

---

## ADR-018: Enterprise Evidence Pack Canonicalization

| Field | Value |
|---|---|
| Date | 2026-03-07 |
| Status | Active |
| Related commits | *(local commit, not yet pushed)* |

### Context

CVF had strong audit habits, but enterprise-facing evidence remained distributed across:

- baseline reviews
- ADRs
- test log
- policy docs
- release-state docs
- trace files

This made ad hoc review possible, but not repeatable packet generation. The roadmap identified this as weakness `W7`.

### Decision

Create a canonical enterprise evidence pack layer under `docs/reference/`:

| Purpose | Canonical file |
|---|---|
| Evidence pack structure | `docs/reference/CVF_ENTERPRISE_EVIDENCE_PACK.md` |
| Control mapping | `docs/reference/CVF_CONTROL_TO_ARTIFACT_MAPPING.md` |
| Release approval template | `docs/reference/CVF_RELEASE_APPROVAL_PACKET_TEMPLATE.md` |

### Consequences

- enterprise/release/audit packets now have a canonical starting point
- release manifest and trace chain become packet inputs, not disconnected references
- future automation can export packets from this structure instead of inventing a new format

### Related Files

- `docs/reference/CVF_ENTERPRISE_EVIDENCE_PACK.md`
- `docs/reference/CVF_CONTROL_TO_ARTIFACT_MAPPING.md`
- `docs/reference/CVF_RELEASE_APPROVAL_PACKET_TEMPLATE.md`
- `docs/reference/CVF_RELEASE_MANIFEST.md`

---

## ADR-019: Branch Strategy for Comprehensive Upgrade Wave (2026-03-06 → 2026-03-08)

| Field | Value |
|---|---|
| Date | 2026-03-08 |
| Status | Active |
| Related commits | *(local, not yet pushed)* |

### Context

Sau đợt nâng cấp toàn diện CVF (Phase 0–6: conformance pipeline, governance automation, enterprise evidence pack, durable execution, skill governance, release discipline), trạng thái local có divergence lớn so với `origin/main` trên GitHub:

| Metric | Value |
|---|---|
| Uncommitted changes trên `cvf-next` | **260 files** (173 mới, 57 sửa, 30 xóa) |
| Thư mục bị ảnh hưởng | `docs/`, `EXTENSIONS/`, `governance/`, `scripts/`, `.github/`, `README.md`, `CHANGELOG.md` |
| Local `main` vs `origin/main` | 1 commit chưa push (`f11355a` — v1.1.2 Phase Governance Hardening) |
| `cvf-next` vs local `main` | 2 commits riêng (v3.0 Core Foundation) + 260 uncommitted files |
| Conformance scenarios | 84/84 PASS (local) |

Câu hỏi cần quyết định: **push trực tiếp lên `main` (overwrite) hay giữ branch tách biệt?**

### Decision

**Giữ `cvf-next` làm branch tách biệt. Push `main` chỉ với commit v1.1.2 đã sẵn sàng. Không force-push.**

Lý do:

1. **260 files là quá nhiều cho một lần push thẳng** — nếu có regression, rollback cực khó vì không có mốc đối chiếu trên remote.
2. **`cvf-next` chứa v3.0 DRAFT** — đây là core identity change (Layer 0), chưa đủ mature để merge vào `main`. CVF roadmap và ADR-016 đều quy định v3.0 phải trải qua merge prerequisites.
3. **CVF tự quy định: "Không trộn hardening current line với major-version innovation line"** (Roadmap Section 9, Final Recommendation).
4. **Branch tách biệt bảo toàn lịch sử Git** — khi merge qua Pull Request, toàn bộ commit cũ trên `origin/main` vẫn tồn tại trong lịch sử (git append-only). Đây là khác biệt then chốt so với force-push.

### Phương án thực hiện

| Bước | Hành động | Mục đích |
|---|---|---|
| 1 | `git checkout main && git push origin main` | Đẩy v1.1.2 hardening (đã committed, backward-compatible) |
| 2 | `git checkout cvf-next && git add -A && git commit && git push origin cvf-next` | Đẩy toàn bộ upgrade wave lên branch riêng |
| 3 | Tạo Pull Request `cvf-next → main` khi sẵn sàng | Review diff, CI validation, merge có record chính thức |

### Git history giải thích

```
Trước merge:
  origin/main:  A → B → C          (bản cũ, stable)
  cvf-next:     A → B → C → D → E  (bản mới, upgrade wave)

Sau merge (PR):
  main:         A → B → C → D → E → M (merge commit)
                          ↑               ↑
                  bản cũ VẪN CÒN     bản mới chính thức
                  (git checkout C)   (HEAD)
```

Bản cũ trên origin không bị xóa — Git chỉ thêm lịch sử mới, không bao giờ xóa lịch sử cũ (trừ force-push).

### Rationale

- **Discipline nhất quán:** CVF governance chính nó yêu cầu tách biệt innovation line khỏi stable baseline — ADR-019 tuân thủ nguyên tắc này.
- **Risk mitigation:** 260 files thay đổi trong 1 push = single point of failure. Branch + PR = review gate trước khi merge.
- **Audit trail:** PR trên GitHub tạo record chính thức: ai review, khi nào approve, diff summary — phù hợp với CVF audit mindset.
- **Rollback dễ dàng:** Nếu merge gặp vấn đề, `git revert <merge-commit>` hoàn tác trong 1 lệnh.

### Consequences

- `origin/main` tiếp tục là stable baseline (v1.1.2 sau push bước 1).
- `origin/cvf-next` sẽ chứa toàn bộ upgrade wave, visible trên GitHub cho review.
- Merge chỉ được thực hiện sau khi CI chạy và owner review trên PR.
- Quyết định này áp dụng cho đợt upgrade hiện tại; các đợt sau nên áp dụng cùng pattern nếu divergence > 50 files.

### Independent Assessment Reference

- `docs/assessments/CVF_INDEPENDENT_EXPERT_REVIEW_UPGRADE_WAVE_2026-03-08.md` — Bản đánh giá độc lập toàn đợt nâng cấp, cho điểm 8.5/10, khuyến nghị push qua branch tách biệt.

### Related Files

- `docs/assessments/CVF_INDEPENDENT_EXPERT_REVIEW_UPGRADE_WAVE_2026-03-08.md`
- `docs/reviews/cvf_phase_governance/CVF_ROADMAP_HOAN_THIEN_TOAN_DIEN_2026-03-06.md`
- `docs/reviews/cvf_phase_governance/CVF_DANH_GIA_DOC_LAP_TOAN_DIEN_2026-03-06.md`

---

## ADR-020: Workspace Restructuring — Downstream Projects out of CVF Root
| Field | Value |
|---|---|
| Date | 2026-03-08 |
| Status | Active |
| Related commits | *(local, not yet pushed)* |
### Context
CVF root chứa 2 folders `Mini_Game/` và `XD_App/` — đây là 2 app thử nghiệm để đánh giá hiệu quả áp dụng quy tắc CVF. Tuy nhiên, theo Workspace Isolation Guard (đã ghi trong `CVF_CORE_KNOWLEDGE_BASE.md` Section VII), **không nên phát triển project trong CVF root**. CVF là governance layer, không phải monorepo cho downstream projects.
Independent Review (ADR-019 reference) xác nhận CVF cần phân biệt rõ hơn giữa "governance cho CVF contributors" vs "governance cho downstream project dùng CVF".
### Decision
**Di chuyển `Mini_Game/` và `XD_App/` ra khỏi CVF root vào `CVF-Workspace`.**
| Folder | Source | Destination |
|---|---|---|
| `Mini_Game/` | `CVF root/Mini_Game/` | `D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\Mini_Game` |
| `XD_App/` | `CVF root/XD_App/` | `D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\XD_App` |
**Workspace layout sau di chuyển:**
```
D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\
├── .Controlled-Vibe-Framework-CVF/   ← CVF clone (dot prefix = governance layer ưu tiên)
├── Mini_Game/                         ← Downstream project 1
├── XD_App/                            ← Downstream project 2
└── Trading-Tools/                     ← Downstream project 3
```
### Rationale
- **Workspace Isolation Guard compliance:** CVF root phải chứa governance code, không phải application code.
- **Dot-prefix convention:** `.Controlled-Vibe-Framework-CVF` có dấu `.` → Agent đọc CVF trước khi đọc project → CVF trở thành tầng kiểm soát cao nhất.
- **Evidence preservation:** Các app này vẫn dùng làm bằng chứng đánh giá hiệu quả CVF, chỉ thay đổi vị trí lưu trữ.
- **Giảm complexity cho CVF repo:** Bớt folders không liên quan trong CVF root → onboarding dễ hơn.
### Consequences
- `Mini_Game/` và `XD_App/` không còn trong CVF git repo (đã có trong `.gitignore` từ trước).
- Future downstream projects phải nằm trong `CVF-Workspace/`, không phải CVF root.
- CVF-Workspace trở thành reference workspace layout cho adoption guide (`docs/guides/CVF_QUICK_ORIENTATION.md`).
### Related Files
- `docs/guides/CVF_QUICK_ORIENTATION.md` (references workspace layout)
- `governance/toolkit/05_OPERATION/CVF_WORKSPACE_ISOLATION_GUARD.md`
- `docs/CVF_CORE_KNOWLEDGE_BASE.md` (Section VII — Workspace Isolation Guard)

---

## ADR-021: Phase 1 Governance Runtime Hardening Integration
| Field | Value |
|---|---|
| Date | 2026-03-19 |
| Status | Active |
| Branch | `cvf-next` (then merged to `main`) |
| Layer | Layer 1 / 1.5 — Governance Platform |
| Related commits | `0d1937a` |
### Context
Phase 1 of the CVF Edit Integration Roadmap mandated strict Governance Runtime Hardening. Before this, CVF had theoretical governance guards, but lacked an enforceable strict perimeter at runtime. Agents could bypass phase conditions if the simulator wasn't called manually. A strict `PipelineOrchestrator` and a set of `MANDATORY_GUARD_IDS` needed to be anchored into the runtime.
### Decision
**Implement a centralized `GuardRuntimeEngine` with unbypassable `MANDATORY_GUARD_IDS` and a `PipelineOrchestrator` that enforces state machine rules.**
- Included 15 distinct guards (including ContextFreeze, AuthorityGate, ConceptAlignment).
- Defined `authority_gate`, `phase_gate`, and `ai_commit` as non-bypassable even in "permissive" settings.
- Integrated SDK (`cvf.evaluate()`) to expose this runtime engine to external tools.
### Rationale
- Theoretical governance is insufficient for achieving Governance Level 4.0. Without unbypassable chokepoints in the runtime, the framework acts only as an advisory linter.
- The `PipelineOrchestrator` guarantees that transition phases completely rollback if any single mandatory guard fails.
- Consolidating into the `GuardRuntimeEngine` prevents distributed, brittle checks spread across different agent prompt logic.
### Consequences
- CVF immediately shifts to **Governance Level 4.0 (Enforceable Framework)**.
- Any tool missing `authority` context or attempting illegal phase transitions will systematically crash rather than proceed silently.
- 602 tests explicitly validate these chokepoints across scenarios.
### Related Files
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/guard.runtime.engine.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/pipeline.orchestrator.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/guard.runtime.types.ts`
- `docs/roadmaps/archive/CVF_EDIT_INTEGRATION_ROADMAP_2026-03-19.md`

---

## ADR-022: Foundational Guard Surfaces Must Be Machine-Enforced
| Field | Value |
|---|---|
| Date | 2026-03-28 |
| Status | Active |
| Branch | `cvf-next` |
| Layer | Governance Platform |
| Related commits | *(local, current automation batch)* |
### Context
Recent hardening closed registry-driven bypasses and standardized all guard docs under `GC-030`, but six foundational guards still depended too heavily on reviewer discipline: `CVF_ADR_GUARD`, `CVF_ARCHITECTURE_CHECK_GUARD`, `CVF_EXTENSION_VERSIONING_GUARD`, `CVF_STRUCTURAL_CHANGE_AUDIT_GUARD`, `CVF_TEST_DEPTH_CLASSIFICATION_GUARD`, and `CVF_WORKSPACE_ISOLATION_GUARD`. That left architecture truth, naming, structural evidence, test-depth reporting, and workspace boundaries too advisory for an automated agent environment.
### Decision
**Automate the remaining foundational guard family through `governance/compat/check_foundational_guard_surfaces.py`, enforced in both local pre-push and CI.** The gate blocks missing ADR updates, missing Knowledge Base refresh, invalid extension naming, missing GC-019 evidence, incomplete test-depth reporting, and suspicious workspace-isolation violations.
### Rationale
Foundational guards are too important to remain review-by-memory, one shared diff-range gate is more reliable than fragmented manual checks, and pre-push plus CI keeps enforcement symmetric for local agents and shared branches.
### Consequences
CVF governance is closer to an executable repo-governance perimeter, future changes in these surfaces fail faster and more visibly, and remaining hardening can focus on automation precision and regression depth instead of legacy format cleanup.
### Related Files
`governance/compat/check_foundational_guard_surfaces.py`, `governance/compat/run_local_governance_hook_chain.py`, `.github/workflows/documentation-testing.yml`, `docs/CVF_CORE_KNOWLEDGE_BASE.md`, `docs/reference/CVF_GUARD_SURFACE_CLASSIFICATION.md`

---

## ADR-023: Dedicated Active Trace Windows Are Permanent Inputs To Generic Archive Cleanup
| Field | Value |
|---|---|
| Date | 2026-03-28 |
| Status | Active |
| Branch | `cvf-next` |
| Layer | Governance Platform |
| Related commits | *(local, current archive-hardening batch)* |
### Context
CVF already governs long-lived active evidence windows through dedicated rotation guards, but generic archive cleanup still treated them like ordinary dated documents unless screening happened to save them. That meant a canonical active trace could look old enough to archive even while still being the current working window.
### Decision
**Treat every canonical active window owned by a dedicated rotation guard as a registered, classified, and permanently protected path in generic archive cleanup.** The protected set is no longer maintained as ad-hoc hard-coded paths; it is governed through `governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json`, `docs/reference/CVF_ACTIVE_WINDOW_CLASSIFICATION.md`, and `governance/compat/check_active_window_registry.py`.
Current registered active windows: `docs/CVF_INCREMENTAL_TEST_LOG.md` and `docs/reviews/cvf_phase_governance/CVF_CONFORMANCE_TRACE_2026-03-07.md`.
These files are excluded up front from generic archive eligibility, and future dedicated rotation guards must register their own active windows in the same model.
### Rationale
Canonical active windows are operational inputs, not ordinary dated historical documents, and a generic archive utility must not reinterpret the lifecycle of a file that already has a dedicated rotation policy.
### Consequences
Archive cleanup is easier to trust because high-value active windows are protected by rule, active windows are grouped canonically instead of managed as a one-off list, and future dedicated rotation guards must register their active window in the same model.
### Related Files
`scripts/cvf_active_archive.py`, `governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json`, `governance/compat/check_active_window_registry.py`, `docs/reference/CVF_ACTIVE_WINDOW_CLASSIFICATION.md`, `scripts/test_cvf_active_archive.py`, `governance/toolkit/05_OPERATION/CVF_ACTIVE_ARCHIVE_GUARD.md`, `governance/toolkit/05_OPERATION/CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md`, `governance/toolkit/05_OPERATION/CVF_CONFORMANCE_TRACE_ROTATION_GUARD.md`

---
## ADR-024: Archive Cleanup Must Be Registry-Driven And Incremental
| Field | Value |
|---|---|
| Date | 2026-03-28 |
| Status | Active |
| Branch | `cvf-next` |
| Layer | Governance Platform |
| Related commits | *(local, current cleanup batch)* |
**Context** CVF had already introduced active-window protection for generic archive cleanup, but the broader archive workflow still depended too much on broad repo scans and ad-hoc judgement about which historical `audits` and `reviews` should stay live. Once the repository accumulated hundreds of dated evidence documents, "scan everything every time" became both expensive and easier to get wrong.
**Decision** Move archive cleanup to a registry-driven, incremental model. `scripts/cvf_active_archive.py` now uses `governance/compat/CVF_ACTIVE_ARCHIVE_BASELINE.json` as the canonical checkpoint for normal runs, while audit/review evidence retention is governed by `governance/compat/CVF_AUDIT_RETENTION_REGISTRY.json` and `governance/compat/CVF_REVIEW_RETENTION_REGISTRY.json`. Normal cleanup re-evaluates only incremental deltas and registry-protected candidates; full scans remain bootstrap/recovery only.
**Rationale** Archive safety should be determined by explicit governance state, incremental cleanup is the right default once historical backlog has been classified, and archive automation must preserve evidence-bearing documents without forcing a full-repo sweep every run.
**Consequences** `docs/audits/` and `docs/reviews/` can now be cleaned without losing protected evidence chains, pre-push and CI enforce retention-registry truth before archive moves are valid, and foundational test-depth enforcement now applies to active report surfaces instead of archived historical records.
**Related Files** `scripts/cvf_active_archive.py`, `governance/compat/CVF_ACTIVE_ARCHIVE_BASELINE.json`, `governance/compat/CVF_AUDIT_RETENTION_REGISTRY.json`, `governance/compat/CVF_REVIEW_RETENTION_REGISTRY.json`, `governance/compat/check_audit_retention_registry.py`, `governance/compat/check_review_retention_registry.py`, `governance/compat/check_foundational_guard_surfaces.py`
---
## ADR-025: Governed Artifact Writing Must Be Source-Truth-First And Machine-Enforced
| Field | Value |
|---|---|
| Date | 2026-03-29 |
| Status | Active |
| Branch | `cvf-next` |
| Layer | Governance Platform |
| Related commits | *(local, current GC-032 hardening batch)* |
**Context** Post-W7 planning had already stated that performance evidence could not be promoted into baseline truth before real measurement evidence existed, and the drafting discipline for the next wave had been documented in roadmap/checklist form. In practice, that still left too much room for governed artifacts to be written as plausible narrative instead of contract-shaped truth, especially when an agent was translating roadmap intent or harness output into reviews, baselines, and continuity records.
**Decision** Adopt one canonical governed-artifact authoring standard and enforce it through bootstrap, policy, CI, and local hooks. `GC-032` now requires source-truth-first writing, forbids summary substitution for typed evidence, keeps planning/execution/evidence/continuity artifact roles separate, and requires continuity surfaces to move together when tranche posture changes. Typed evidence enforcement remains layered: `governance/compat/check_governed_artifact_authoring.py` keeps the chain aligned, while `governance/compat/check_docs_governance_compat.py` blocks symbolic shorthand in governed evidence batches when the harness contract requires explicit provenance fields.
**Rationale** If governed writing is not constrained like code, agents can silently drift away from roadmap truth even while the surrounding governance system looks complete. Source-truth-first writing turns documentation quality into an executable part of CVF rather than a reviewer expectation.
**Consequences** Future agents must route through a shared writing standard before drafting governed artifacts, post-W7 packets now have an explicit authoring front door in session bootstrap, and evidence-bearing docs are harder to degrade into ambiguous shorthand without tripping a repo gate.
**Related Files** `docs/reference/CVF_GOVERNED_ARTIFACT_AUTHORING_STANDARD.md`, `governance/toolkit/05_OPERATION/CVF_GOVERNED_ARTIFACT_AUTHORING_GUARD.md`, `governance/compat/check_governed_artifact_authoring.py`, `governance/compat/check_docs_governance_compat.py`, `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`, `docs/reference/CVF_POST_W7_GC018_DRAFTING_CHECKLIST.md`
## ADR-026: GC-020 Handoff Must Track The Remote Branch, Not Chase The Remote Tip SHA
| Field | Value |
|---|---|
| Date | 2026-03-30 |
| Status | Active |
| Branch | `cvf-next` |
| Layer | Governance Platform |
| Related commits | *(local, current GC-020 loop-fix batch)* |
**Context** `GC-020` already required governed pause/resume truth, and the handoff template had drifted into recording the exact latest pushed remote SHA inside `AGENT_HANDOFF.md`. In practice that created a self-update loop: a commit that updated handoff to match the current remote tip would itself move the remote tip again after push, immediately making the newly committed handoff stale by one step.
**Decision** Treat the tracked remote branch as the required handoff truth, and treat the exact remote tip SHA as live git state that must be derived when needed rather than hand-maintained inside the handoff packet. `AGENT_HANDOFF.md` must now record the tracked upstream ref such as `origin/cvf-next`, while `check_agent_handoff_guard_compat.py` enforces tracked remote branch presence instead of exact tip equality.
**Rationale** An exact remote tip SHA is not a stable continuity field at the push boundary, because the commit carrying that field changes the very value it is trying to freeze. Continuity docs should store stable routing truth, while volatile live state should be derived from the authoritative tool that owns it.
**Consequences** Governed handoff remains strict, but now has a fixed point that can stay true across pushes. Agents must stop treating external memory or hand-edited SHA strings as a substitute for live git inspection. Resume and push decisions still depend on exact remote SHA when relevant, but they must derive that value live from git rather than requiring it as a durable handoff field.
**Related Files** `AGENT_HANDOFF.md`, `docs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md`, `docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md`, `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`, `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_GUARD.md`, `governance/compat/check_agent_handoff_guard_compat.py`, `governance/compat/test_check_agent_handoff_guard_compat.py`
## ADR-027: CPF Public Surface Must Stay Thin And Shared Batch Semantics Must Stay Centralized
Date: `2026-04-01` | Status: `Active` | Branch: `cvf-next` | Layer: `Control Plane Foundation` | Related commits: *(local, current maintainability hardening batch)*
**Context** CPF continuation delivery has expanded the public barrel, barrel smoke suite, and batch-contract family steadily through `W13-T1` to `W32-T1`. That growth improved coverage, but it also created a maintainability hotspot: public exports, smoke coverage, and repeated batch identity/tie-break logic were starting to drift toward copy-heavy maintenance and a larger blast radius for every new tranche.
**Decision** Keep CPF public entry surfaces intentionally thin, centralize repeated batch identity/tie-break mechanics in shared helpers, and keep detailed behavior in owned tranche/domain tests rather than letting `index.test.ts` become a second behavioral test surface. This decision is enforced through `GC-033` through `GC-036` and anchored by the canonical maintainability standard.
**Rationale** A large barrel and smoke suite create hidden coordination tax even when correctness remains high. Central helpers and ownership boundaries reduce duplication, make tranche additions cheaper, and preserve the readability of public-surface review.
**Consequences** New CPF batch work must adopt shared batch helpers and shared fixtures where governed, barrel smoke must stay shallow, and summary canon docs must not absorb typed evidence payload responsibilities. Maintainability becomes an enforced architectural property instead of a one-off cleanup.
**Related Files** `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/batch.contract.shared.ts`, `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/helpers/cpf.batch.contract.fixtures.ts`, `docs/reference/CVF_MAINTAINABILITY_STANDARD.md`, `governance/compat/check_cpf_public_surface_maintainability.py`, `governance/compat/check_cpf_batch_helper_adoption.py`, `governance/compat/check_canon_summary_evidence_separation.py`
## ADR-028: Pre-Public Repository Cleanup Must Be Lifecycle-Classified Before Relocation
Date: `2026-04-02` | Status: `Active` | Branch: `cvf-next` | Layer: `Governance Platform` | Related commits: *(local, current pre-public classification batch)*
**Context** CVF is moving toward a pre-public packaging phase where repository structure needs to become easier to read from the outside. The visible root contains a mix of active architectural roots, lineage-retained roots, frozen references, and likely retirement candidates. Without an explicit classification layer, any cleanup wave would risk moving or retiring folders based only on appearance rather than architectural ownership truth.
**Decision** Introduce lifecycle classification as a mandatory precondition for any pre-public repository restructuring wave. Visible repository roots and extension roots must first be classified as `ACTIVE_CANONICAL`, `MERGED_RETAINED`, `FROZEN_REFERENCE`, or `RETIRE_CANDIDATE`, and that classification is enforced by `GC-037` before any later relocation decision proceeds.
**Rationale** Physical movement is a structural act, not a naming cleanup. Even when folder names stay unchanged, path changes can affect imports, package/workspace resolution, scripts, hooks, CI, docs links, release manifests, registries, and public packaging.
**Consequences** `P0-P2` can proceed safely as classification-only work, while `P3` remains the earliest phase where folder relocation may happen. Legacy-looking roots such as `CVF_ECO*` are no longer presumed delete candidates; they must be evaluated against lifecycle truth first.
**Related Files** `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`, `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`, `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json`, `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json`, `governance/toolkit/05_OPERATION/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION_GUARD.md`, `governance/compat/check_repository_lifecycle_classification.py`
## ADR-029: Pre-Public Repository Planning Must Stay Private-By-Default Until Selective Publication Is Explicitly Authorized
Date: `2026-04-02` | Status: `Active` | Branch: `cvf-next` | Layer: `Governance Platform`
Lifecycle cleanup alone cannot control publication exposure. CVF therefore adopts explicit exposure classification (`GC-038`) and `GC-039` readiness as mandatory preconditions before any `P3` relocation is even discussable, keeping the repository private-by-default until a later distribution decision explicitly authorizes something narrower or broader.
Related Files: `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`, `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`, `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json`, `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json`, `governance/toolkit/05_OPERATION/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION_GUARD.md`, `governance/compat/check_repository_exposure_classification.py`
## ADR-030: Future P3 Relocation Waves Must Execute On Dedicated Branches And Secondary Worktrees
Date: `2026-04-02` | Status: `Active` | Branch: `cvf-next` | Layer: `Governance Platform`
After `P3/CP1`, future physical `P3` relocation waves must execute on a dedicated `restructuring/p3-*` branch and from a secondary git worktree. This is now a machine-enforced addition to fresh `GC-019` and `GC-039`, keeping `cvf-next` as the canonical integration branch while large path moves remain isolated and reviewable.
Related Files: `docs/reference/CVF_PREPUBLIC_P3_READINESS.md`, `docs/reference/CVF_PREPUBLIC_RESTRUCTURING_UNIFIED_AGENT_PROTOCOL.md`, `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`, `governance/toolkit/05_OPERATION/CVF_PREPUBLIC_P3_READINESS_GUARD.md`, `governance/compat/check_prepublic_p3_readiness.py`, `AGENT_HANDOFF.md`

---

## ADR-031: Batch Determinism And Surface Scan Continuity Must Be Canonical Guarded Inputs
| Field | Value |
|---|---|
| Date | 2026-04-05 |
| Status | Active |
| Branch | `cvf-next` |
| Layer | Governance Platform |
| Related commits | *(local, current governance hardening batch)* |

### Context
Recent quality review exposed two recurring failure modes that were still too dependent on reviewer memory. First, governed `*.batch.contract.ts` surfaces could drift on deterministic identity semantics or stop threading the same injectable clock into nested contract creation, even while tests still looked green. Second, tranche-opening and repo-scan work had no canonical machine-readable inheritance layer, which meant a later agent could reopen broad repo scans or reclassify already-scanned surfaces without first loading prior scan state.

### Decision
**Promote both concerns into mandatory canonical governance inputs.**

1. `GC-040` now enforces batch determinism across governed CPF and EPF batch contracts:
   - `batchId` must derive from `batchHash` only
   - legacy `batchIdParts` semantics are disallowed on governed batch surfaces
   - batch wrappers that own `now` must propagate the same clock into nested governed contract creation where supported
2. `GC-041` now establishes `governance/compat/CVF_SURFACE_SCAN_REGISTRY.json` as the canonical continuity surface for tranche and repo-scan inheritance:
   - agents must consult the registry before opening a fresh tranche or repeating broad scan work
   - scan continuity is carried as machine-readable state, not informal handoff memory
   - bootstrap, handoff, progress tracking, and guard routing must all point to the same registry truth

### Rationale
- Deterministic contract semantics should be machine-enforced, not inferred from style or reviewer familiarity.
- Shared injectable clocks lose value if nested contract paths silently fall back to real time.
- Repo-scan continuity is part of governance state, not disposable exploration context.
- A canonical scan registry lowers token cost and reduces accidental re-scan churn for later agents.

### Consequences
- Governed batch work now fails fast if it deviates from the canonical identity or nested-clock rules.
- Later agents inherit already-scanned tranche and surface state through one registry instead of re-walking the repo by default.
- Session bootstrap, handoff, maintainability canon, and progress tracking all treat scan continuity as a first-class governed input.
- Incremental test-log rotation became part of the same hardening wave because the active testing window must remain readable when continuity records expand.

### Related Files
- `governance/toolkit/05_OPERATION/CVF_BATCH_CONTRACT_DETERMINISM_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_SURFACE_SCAN_CONTINUITY_GUARD.md`
- `governance/compat/check_batch_contract_determinism.py`
- `governance/compat/check_surface_scan_registry.py`
- `governance/compat/CVF_SURFACE_SCAN_REGISTRY.json`
- `docs/reference/CVF_MAINTAINABILITY_STANDARD.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `AGENT_HANDOFF.md`
- `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`

---

## ADR-032: Product Value Proof Must Be Governed Before Heavy Capability Expansion
| Field | Value |
|---|---|
| Date | 2026-04-11 |
| Status | Active |
| Branch | `main` |
| Layer | Governance Platform |
| Related commits | *(local, current GC-042 adoption batch)* |

### Context
CVF had accumulated strong correctness and governance evidence, but product-value claims still lived mainly in roadmap/planning language. That left two recurring risks: agents could improvise their own scoring formats when asked to "prove value", and heavyweight capability ideas such as Docker sandbox could start feeling urgent because the architecture looked incomplete rather than because evidence showed they were needed.

### Decision
Promote product-value proof into a governed control. `GC-042` now requires one canonical comparative evidence chain before CVF may claim user-facing value or use that claim to justify heavyweight capability work:

1. frozen corpus
2. frozen rubric
3. governed run manifest
4. final no-spin assessment

`Docker sandbox` remains deferred-by-default unless this chain or an explicit external requirement shows a real trigger.

### Rationale
- Value proof should be comparable, falsifiable, and skeptical by default.
- Technical depth is not the same thing as user value.
- Heavy capability work should be opened because evidence demands it, not because roadmap symmetry feels attractive.
- A shared guard makes future value-validation waves reusable across later CVF expansion.

### Consequences
- Future agents should not create ad hoc value-score packets or demo-led proof narratives.
- Product-value validation now has a single bootstrap route, hook-chain gate, CI job, and template family.
- Docker-trigger decisions become easier to audit because they now depend on one governed evidence model.

### Related Files
- `governance/toolkit/05_OPERATION/CVF_PRODUCT_VALUE_VALIDATION_GUARD.md`
- `governance/compat/check_product_value_validation_guard_compat.py`
- `docs/roadmaps/CVF_PRODUCT_VALUE_VALIDATION_WAVE_ROADMAP_2026-04-11.md`
- `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_CORPUS_TEMPLATE.md`
- `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_RUBRIC_TEMPLATE.md`
- `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_RUN_MANIFEST_TEMPLATE.md`
- `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_ASSESSMENT_TEMPLATE.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`

---

## ADR-033: CVF Product Value Must Be Proven As A Governed Provider Hub
| Field | Value |
|---|---|
| Date | 2026-04-11 |
| Status | Active |
| Branch | `main` |
| Layer | Product / Architecture Doctrine |
| Related commits | *(local documentation alignment batch)* |

### Context
The web product and the master architecture already point toward a provider-agnostic model gateway, but Product Value Validation was still easy to misread as a single-provider experiment. That created a mismatch between the real CVF proposition and the way future agents might design proof packets.

### Decision
CVF product-value proof must distinguish two surfaces:

1. **Provider-Hub Validation (`CP3A`)**
   - prove that CVF remains governable and useful across governed `provider + model` run lanes derived from enabled user/operator keys
2. **Controlled Value Test (`CP3B`)**
   - prove that the value delta comes from CVF governance by comparing direct vs governed execution inside the same matched run lane

A **run lane** is now the canonical product-truth unit for validation: one admitted governed `provider + model` configuration.

### Rationale
- CVF is not supposed to win by binding users to one model vendor.
- User-controlled provider choice and CVF-controlled governance are separate responsibilities and should stay separate in the proof model too.
- Multi-lane validation is the honest way to support a model-agnostic hub claim.
- Same-lane comparison is still required so provider switching does not masquerade as CVF value.

### Consequences
- Future product-value packets must not market a single-provider result as full hub truth.
- Existing controlled-lane packets remain useful, but only as `CP3B` evidence unless multiple governed lanes are also validated.
- README, handoff, roadmap, guard, and architecture references should all use the same `run lane` vocabulary.
- Docker sandbox decisions remain downstream of measured need; provider-hub validation alone does not require Docker.

### Related Files
- `README.md`
- `AGENT_HANDOFF.md`
- `docs/roadmaps/CVF_PRODUCT_VALUE_VALIDATION_WAVE_ROADMAP_2026-04-11.md`
- `docs/roadmaps/CVF_POST_W64_NEXT_CAPABILITY_WAVE_ROADMAP_2026-04-10.md`
- `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- `governance/toolkit/05_OPERATION/CVF_PRODUCT_VALUE_VALIDATION_GUARD.md`

---

## ADR-034: Repo-Derived Knowledge Uplift Must Stay Doctrine-First Before Native Expansion
| Field | Value |
|---|---|
| Date | 2026-04-13 |
| Status | Active |
| Branch | `main` |
| Layer | Governance / Knowledge Intake Doctrine |
| Related commits | *(local, current GC-043 adoption batch)* |

### Context
CVF now absorbs more useful outside knowledge from external repos, skill systems, and post-closure synthesis packets than earlier baselines. That creates a new scaling risk: future agents may correctly identify valuable doctrine, but still jump too quickly from `accepted design input` to `native implementation`, creating new surfaces before CVF owner mapping and governance fit are explicit.

The recent `Graphify / LLM-Powered / Palace` lane demonstrated the healthier sequence: synthesis and owner-surface mapping produced more value than implementation would have at that point. That pattern needed to become a governed default rather than a one-off good decision.

### Decision
Promote knowledge-absorption priority into a governed control. `GC-043` now requires future repo-derived knowledge uplift work to default to:

1. doctrine-first absorption
2. governance-first absorption
3. owner-surface mapping into existing CVF canon and existing CVF owner surfaces
4. only then, if freshly justified and explicitly authorized, bounded implementation

`implementation-first expansion` is forbidden by default unless a fresh operator decision and explicit fresh `GC-018` state reopen it.

### Rationale
- CVF keeps its core value only if outside knowledge is subordinated to CVF doctrine rather than allowed to redefine it by momentum.
- Absorption discipline produces narrower, safer, higher-leverage implementation waves later.
- A repo gate is necessary because handoff and policy text alone do not stop future agents from skipping straight to surface creation.
- The Graphify lane is the strongest current exemplar of the right sequencing discipline.

### Consequences
- Future knowledge-absorption roadmaps must explicitly cite the priority standard and preserve implementation-blocking boundaries.
- Hook-chain and CI now fail if this doctrine/governance-first sequencing drifts out of canonical knowledge-uplift roadmaps.
- `Graphify / LLM-Powered / Palace` remains the exemplar lane, but not an automatic implementation trigger.
- CVF can keep absorbing outside knowledge aggressively without weakening the rule that CVF itself remains the governing root.

### Related Files
- `governance/toolkit/05_OPERATION/CVF_KNOWLEDGE_ABSORPTION_PRIORITY_GUARD.md`
- `governance/compat/check_knowledge_absorption_priority_compat.py`
- `docs/reference/CVF_KNOWLEDGE_ABSORPTION_AND_EXTENSION_PRIORITY_STANDARD_2026-04-13.md`
- `docs/assessments/archive/CVF_EXECUTIVE_VALUE_PRIORITIZATION_NOTE_2026-04-13.md`
- `docs/roadmaps/archive/CVF_GRAPHIFY_LLM_POWERED_PALACE_SYNTHESIS_ONLY_ROADMAP_2026-04-13.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`

## ADR-GC045: Markdown Structural Completeness Guard Becomes Mandatory For New Governed Markdown

### Status
ACCEPTED — 2026-05-16

### Context
CVF documentation had no automated structural completeness guard. New governed Markdown could enter canon without `Memory class`, `Status`, `Purpose`, `Scope`, `Claim Boundary`, or artifact-type-specific sections, producing files that pass lint but fail reviewer attention. The 2026-05-16 public Markdown quality program also surfaced 7 Tier 1 files that had passed a manual common-elements rubric but failed full automated artifact-type templates. A guard that runs at commit time on new governed Markdown files is the right enforcement surface for this gap.

### Decision
Introduce GC-045 (Markdown Structural Completeness Guard) with:
- canonical standard at `docs/reference/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_STANDARD.md`;
- guard descriptor at `governance/toolkit/05_OPERATION/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_GUARD.md`;
- automated checker at `governance/compat/check_markdown_structural_completeness.py`;
- wiring into the local pre-commit and pre-push hook chains and into the documentation CI workflow.

The guard enforces full artifact-type templates (spec / baseline / handoff / review / policy / contract / roadmap / adr / guard) automatically. Legacy dense files are grandfathered.

### Alternatives
- **Manual rubric review.** Rejected: the Tier 1 closure proved manual rubric drifts away from the published standard under time pressure.
- **Front-matter-only checker.** Rejected: classifier-by-content match handles existing files without forcing a wholesale front-matter rewrite of every legacy file.
- **No automated checker.** Rejected: GC-032 covered source-truth placement but not structural completeness; documentation quality drift accumulated without enforcement.

### Consequences
- Every new governed Markdown file must include the common required elements plus its artifact-type sections.
- Future agents save time by using the checker before committing rather than after push rejection.
- Public-sync workspace gained a `--no-bootstrap` portable mode so the checker runs without requiring the full hook chain.
- Each future `GC-NN_GUARD.md` introduction must record one short ADR entry here and one `docs/reviews/CVF_GC019_*_STRUCTURAL_REVIEW_*.md` artifact so the foundational guard audit stays green.

### Related Files
- `governance/toolkit/05_OPERATION/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_GUARD.md`
- `governance/compat/check_markdown_structural_completeness.py`
- `docs/reference/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_STANDARD.md`
- `docs/reviews/archive/CVF_GC045_MARKDOWN_STRUCTURAL_COMPLETENESS_IMPLEMENTATION_REVIEW_2026-05-16.md`
- `docs/reviews/archive/CVF_GC019_GC045_GUARD_INTRODUCTION_STRUCTURAL_REVIEW_2026-05-16.md`

## ADR-046: Session Memory Front Door Becomes The Agent Startup Entry Point

### Status
ACCEPTED — 2026-05-17

### Context
Root handoff files accumulated into multiple competing startup surfaces. Agents
could enter through `AGENT_HANDOFF.md`, V2-V8, Claude-oriented memory, or review
folders and reach different conclusions about active state. That directly
contributed to 17.05 review drift, duplicated governance semantics, and repeated
operator reminders.

### Decision
Introduce `CVF_SESSION_MEMORY.md` as the single session startup front door and
`CVF_SESSION/ACTIVE_SESSION_STATE.json` as the machine-readable active-state
registry. Keep only the current active handoff at root. Move historical and
side-channel handoffs into `CVF_SESSION/handoffs/archive/` without rewriting
their contents.

### Consequences
- New and resumed agents must resolve active state before trusting any handoff.
- Future `cvf-cli` and `cvf-mcp-server` startup can read one JSON registry
  instead of scraping root files.
- Historical handoffs remain provenance records but are no longer root-level
  startup candidates.
- Guard compatibility checks must route current truth through session state and
  use archived handoffs only as historical evidence.

### Related Files
- `CVF_SESSION_MEMORY.md`
- `CVF_SESSION/ACTIVE_SESSION_STATE.json`
- `CVF_SESSION/REQUIRED_STARTUP_GUARDS.md`
- `governance/compat/check_active_session_state.py`
- `governance/compat/check_agent_handoff_guard_compat.py`
- `governance/compat/check_surface_scan_registry.py`

## ADR-047: Agent Work Orders Become The Mandatory Tactical Dispatch Layer

### Status
ACCEPTED — 2026-05-19

### Context
CVF had clear high-level coordination artifacts: active session state, handoff,
decision packs, roadmaps, GC-018 baselines, reviews, and completion packets.
However, agent-to-agent implementation still relied on free-form prompts or
long roadmap prose. The 17.05 governance kernel owner map explicitly records
that ORCHESTRATOR-as-CEO semantics and worker-lane mandatory delegation remain
gaps: role strings, delegation contracts, and handoff records exist, but the
tactical dispatch packet between final roadmap and worker execution was not a
first-class document class.

This left a practical break in the company-style workflow: strategy and
authorization existed above, implementation existed below, but the step-by-step
work order that binds scope, owner, allowed paths, forbidden paths, evidence,
review gate, and stop conditions was not standardized.

### Decision
Introduce `docs/work_orders/` as a first-class documentation taxonomy folder
and `CVF Agent Work Order` as the mandatory tactical dispatch artifact after a
final roadmap or operator lane decision delegates work to another agent or a
later session.

The architecture relationship is:

```text
Operator / CEO intent
  -> Decision pack / final roadmap
  -> Agent Work Order
  -> Implementer execution
  -> Reviewer disposition
  -> Evidence / completion / handoff sync
```

Work orders do not authorize work by themselves. They inherit authority from
active session state, roadmap, GC-018, and handoff. Their purpose is to prevent
scope drift during implementation.

### Consequences
- Final roadmaps that delegate implementation must produce a work order before
  implementation begins.
- `docs/work_orders/` is now an approved taxonomy folder with
  `POINTER_RECORD` default memory role.
- `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md` is the reusable
  template for future dispatch packets.
- `governance/compat/check_docs_governance_compat.py` accepts the new taxonomy.
- `governance/compat/check_markdown_structural_completeness.py` recognizes
  `Work Order` as a separate artifact type, distinct from review.
- Existing delegation and handoff contracts remain canonical for typed worker
  boundaries; Work Orders are the human/agent-readable tactical dispatch layer
  above those contracts.

### Related Files
- `docs/work_orders/CVF_AGENT_WORK_ORDER_LANE_BCH_2026-05-19.md`
- `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`
- `docs/reference/CVF_AGENT_EXECUTION_WORKFLOW_SOP_2026-05-19.md`
- `docs/INDEX.md`
- `governance/toolkit/05_OPERATION/CVF_DOCUMENT_STORAGE_GUARD.md`
- `governance/compat/check_docs_governance_compat.py`
- `governance/compat/check_markdown_structural_completeness.py`
- `docs/reviews/archive/CVF_17_05_GOVERNANCE_KERNEL_OWNER_MAP_2026-05-17.md`

## ADR-048: Agent Execution Workflow SOP Becomes The Standard Operating Procedure

### Status
ACCEPTED — 2026-05-19

### Context
Agent Work Orders define the tactical dispatch packet, but CVF still needs the
larger operating workflow that explains when work orders are required and how
they connect to intake, decision packs, final roadmaps, GC-018, implementation,
review, closure, catalog updates, and handoff sync.

This is the same missing layer as a company SOP: the organization may have
strategy and job roles, but execution still fails unless the handoff between
roles is procedural, repeatable, and auditable.

### Decision
Adopt `docs/reference/CVF_AGENT_EXECUTION_WORKFLOW_SOP_2026-05-19.md` as the
canonical roadmap-to-agent execution SOP.

The SOP makes this chain mandatory:

```text
Operator / CEO intent
  -> Intake or review packet
  -> Decision pack when needed
  -> Final roadmap
  -> Agent Work Order
  -> Lane-specific GC-018 when required
  -> Implementation
  -> Evidence and tests
  -> Reviewer disposition
  -> Completion packet
  -> Catalog update when applicable
  -> GC-020 handoff sync
```

### Consequences
- Future final roadmaps that delegate implementation must produce an Agent Work
  Order before implementation begins.
- Reviewers should review implementation against the work order and SOP, not
  free-form memory.
- Implementers must return to orchestrator on scope conflict instead of
  widening scope.
- The SOP remains procedural; runtime enforcement of every actor role still
  requires future scoped implementation and evidence.

### Related Files
- `docs/reference/CVF_AGENT_EXECUTION_WORKFLOW_SOP_2026-05-19.md`
- `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`
- `docs/work_orders/CVF_AGENT_WORK_ORDER_LANE_BCH_2026-05-19.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md`
- `AGENT_HANDOFF_V9_2026-05-18.md`

## ADR-049: GC-045 Reference Classification And Operator Checkpoint Hardening

### Status
ACCEPTED — 2026-05-21

### Context
GC-045 structural completeness correctly protects new governed Markdown files,
but the checker could misclassify a long-lived `docs/reference/` file as a
baseline when the text contained baseline wording and no explicit `docType`.
Claude's post-tranche audit also identified a real process gap: fast multi-role
work-order execution should expose whether an operator checkpoint is required
or explicitly waived.

### Decision
Extend GC-045 with two bounded hardening rules:

- `docType: reference` is now a supported artifact type for durable reference
  surfaces that need purpose, scope/applicability, and claim/final boundary
  checks without being forced into baseline or review structure.
- New work orders must include `## Operator Checkpoint` or
  `operator.checkpoint.waiver`; work orders already present at adoption commit
  `c043fa33` are grandfathered.

### Consequences
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md` now declares
  `docType: reference` and exposes explicit scope and claim boundary text.
- Retrospective GC-045 scans no longer produce the control-matrix false
  positive.
- Future work orders make checkpoint cadence visible without retroactively
  invalidating already-closed tranches.

### Related Files
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `docs/reference/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_STANDARD.md`
- `governance/toolkit/05_OPERATION/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_GUARD.md`
- `governance/compat/check_markdown_structural_completeness.py`
- `docs/reviews/archive/CVF_WO_MULTI_ROLE_QUALITY_HARDENING_COMPLETION_2026-05-21.md`

- 2026-05-24: Active archive hygiene run — 61 stale docs moved to archive; guard authoring fix on `CVF_AGENT_REVIEW_ANTI_COLLUSION_GUARD.md` (pre-existing Enforced-by path format issue). No architecture change.

- 2026-05-24: Active archive hygiene run — 61 stale docs moved to archive; guard authoring fix on CVF_AGENT_REVIEW_ANTI_COLLUSION_GUARD.md (pre-existing  path format). No architecture change.

## ADR-050: Work Order Source Verification Becomes Mandatory

### Status
ACCEPTED — 2026-05-27

### Context
LHW1-T3 exposed a work-order quality gap: the original instruction allowed a
worker to carry uncertain runtime field names with "confirm later" language.
That let incorrect names reach a closed connector draft before review caught
the mismatch. The defect was not the connector idea; it was an under-specified
dispatch packet.

### Decision
Future work orders must include a Source Verification Block before
implementation whenever they depend on source-level facts: runtime fields,
interfaces, functions, types, schema keys, receipt fields, diagnostic classes,
role values, route states, template IDs, pack IDs, policy enums, config keys,
CLI/MCP tool names, or existing source paths.

The required table columns are:

- `Claimed item`
- `Source file`
- `Verified path or symbol`
- `Owning interface/function/schema`
- `Disposition`

Valid dispositions are `ACCEPT`, `REJECT`, and `BLOCKED_SOURCE_NOT_FOUND`.
`BLOCKED_SOURCE_NOT_FOUND` blocks implementation and returns to Orchestrator.

### Consequences
- Work-order authors must verify fields before dispatch instead of making the
  worker discover invented or stale instructions.
- Reviewers must fail work orders that rely on guessed, inferred, placeholder,
  memory-only, or "confirm later" source vocabulary.
- `UNVERIFIED`, `TBD`, `TODO`, `confirm field name`, and
  `verify during implementation` are forbidden closeout vocabulary for
  source facts. They may appear only as explicit blocking defect notes.
- `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`,
  `docs/reference/CVF_AGENT_EXECUTION_WORKFLOW_SOP_2026-05-19.md`,
  `docs/reference/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_STANDARD.md`, and
  `AGENTS.md` carry the binding rule.
- Previously closed work orders are not retroactively failed, but any reuse,
  amendment, continuation, or template promotion must satisfy the rule.

## ADR-051: Work Order Closure Quality Gate Becomes Mandatory

### Status
ACCEPTED — 2026-05-28

### Context
The LHW5 quality review found closure defects that were not source-verification
defects alone: roadmap reproducibility requirements were weakened before final
artifact closure, front-door state was stale, checklist residue remained open,
and a file-change claim overstated the actual diff. The failure pattern was
mixed: the work order did not make all closure checks machine-like enough, and
the worker closed without running a strict final comparison.

### Decision
CVF adopts a mandatory Work Order Closure Quality Gate for all new or amended
delegated work:

- roadmap-derived work orders must carry a Roadmap-to-Work-Order Trace Matrix;
- closure must compare roadmap requirements, work-order instructions, final
  artifacts, and completion claims;
- file-change and boundary claims must be backed by command/path/receipt
  evidence, not memory;
- fail conditions must be explicit and checked;
- open checkbox residue is a closure defect;
- front-door, state registry, and active handoff must be synchronized when
  mode, roadmap status, next allowed move, or public-sync status changes.

### Consequences
- Work-order authors are responsible for making dispatch requirements
  traceable and closure-checkable.
- Implementers remain responsible for detecting roadmap/work-order/artifact
  mismatches before closure.
- Reviewers must treat stale continuity state, unsupported file-change claims,
  missing trace rows, ambiguous thresholds, and unchecked closure items as
  blocking closure defects.
- The new standard is canonical at
  `docs/reference/archive/CVF_WORK_ORDER_CLOSURE_QUALITY_GATE_STANDARD_2026-05-28.md`.

### Related Files
- `AGENTS.md`
- `docs/reference/archive/CVF_WORK_ORDER_CLOSURE_QUALITY_GATE_STANDARD_2026-05-28.md`
- `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`
- `docs/reference/CVF_AGENT_EXECUTION_WORKFLOW_SOP_2026-05-19.md`
- `docs/reference/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_STANDARD.md`
- `docs/reference/CVF_QUALITY_ASSESSMENT_STANDARD.md`

## ADR-052: Governed File Maintainability Planning Becomes Mandatory

### Status
ACCEPTED — 2026-05-28

### Context
LHW6 rule hardening exposed a governance failure mode where agents tried to
compress oversized session, handoff, review, or work-order files late in the
workflow instead of planning maintainable file boundaries from the start. That
behavior preserves line-count compliance on paper but makes future review,
testing, and defect isolation harder.

### Decision
CVF adopts governed file maintainability planning as a mandatory rule. When an
active governed Markdown or JSON file is touched near its hard line threshold,
the agent must rotate, archive, split, or materially shrink the file in the
same maintainability domain before closing the work. Minimal prose compression
only to satisfy a numeric guard is not acceptable.

### Consequences
- Agents must plan maintainability boundaries during roadmap and work-order
  design, not only during final guard cleanup.
- Testers can rely on smaller, purpose-bounded files when isolating closure and
  governance defects.
- The governed file-size guard now fails touched near-threshold files without
  a same-domain rotation/split artifact or meaningful line-count reduction.
- The current session front door was rotated to a compact pointer record, with
  the previous full snapshot archived under
  `CVF_SESSION/handoffs/archive/`.

### Related Files
- `AGENTS.md`
- `CLAUDE.md`
- `CVF_SESSION_MEMORY.md`
- `CVF_SESSION/handoffs/archive/CVF_SESSION_MEMORY_PRE_ROTATION_ARCHIVE_2026-05-28.md`
- `governance/toolkit/05_OPERATION/CVF_GOVERNED_FILE_SIZE_GUARD.md`
- `governance/compat/check_governed_file_size.py`
- `governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json`

## ADR-053: SOT Three-Layer Absorption Becomes A Bounded Contract-To-Runtime Architecture Owner

### Status
ACCEPTED - 2026-07-18

### Context
The SOT Three-Layer (SOT3) family absorbed an external Source-of-Truth
architecture pattern into CVF across a multi-tranche 2026-07 roadmap: a
canonical contract chain (SOT3-T2), four bounded runtime owners (Refinery,
Truth Kernel, Truth Flow, and a vertical-slice orchestrator), a ratified A0
product-activation seam, an accepted A1-A5 live-governance proof ladder, and
one accepted downstream application proof at a bounded product seam. No ADR
entry recorded this absorption, so `ARCHITECTURE.md`,
`CVF_ECOSYSTEM_ARCHITECTURE.md`, and `docs/reference/CVF_ARCHITECTURE_MAP.md`
had no architecture-decision anchor to cite when they were updated to project
this accepted work, unlike every other major architecture addition documented
in this file.

### Decision
CVF records SOT3 as a bounded contract-to-runtime architecture owner:

- Refinery prepares deterministic source-bound material and holds no truth
  authority (`EXTENSIONS/CVF_REFINERY/`).
- Truth Kernel alone owns evaluation, decision, receipt, and truth-reference
  authority (`EXTENSIONS/CVF_TRUTH_KERNEL/`).
- Truth Flow manages post-Kernel distribution and lifecycle without
  recreating upstream authority (`EXTENSIONS/CVF_TRUTH_FLOW/`).
- A vertical-slice orchestrator proves real cross-package composition through
  a fixed scenario lifecycle (`EXTENSIONS/CVF_SOT_THREE_LAYER_SLICE/`).
- Provider output remains downstream content, never truth authority.
- Activation is bounded to one ratified product seam
  (`docs/reference/sot_three_layer/CVF_SOT3_ACTIVATION_ARCHITECTURE_DECISION.md`)
  and one accepted live-governance proof ladder
  (`docs/roadmaps/CVF_SOT3_ACTIVATION_AND_OPERATIONAL_PROOF_ROADMAP_2026-07-13.md`,
  claim `LIVE_GOVERNANCE_PROVEN_BOUNDED`).
- Downstream application proof is bounded to one accepted product seam
  (`docs/reviews/CVF_SOT3_APP_T5_COMPLETION_REVIEW_2026-07-18.md`), not
  universal SOT3 availability.

### Rejected Overclaims

- SOT3 is not globally activated or always invoked by any CVF Web or
  production request path.
- SOT3 is not a provider boundary and does not certify a provider lane.
- SOT3 is not publicly exported or production-ready.
- SOT3 does not redefine, widen, or supersede the frozen L0-L6 doctrine
  layer model; it is projected using the existing contract-to-runtime plane
  vocabulary from the as-built system architecture catalog.
- SOT3 does not replace or narrow `docs/reference/truth_foundation/`'s
  upstream doctrine ownership of source authority, provenance labels, and
  claim-movement semantics.

### Consequences

- `ARCHITECTURE.md`, `CVF_ECOSYSTEM_ARCHITECTURE.md`, and
  `docs/reference/CVF_ARCHITECTURE_MAP.md` gained SOT3 architecture pointers
  in the same tranche that authored this ADR, closing the documented-practice
  gap this file's own ADR history otherwise showed.
- `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` and
  `docs/reference/CVF_ARCHITECTURE_DIAGRAMS.md` remain deliberately unchanged:
  the whitepaper is frozen at snapshot `v3.7-W46T1` with `NONE` as its active
  tranche, and the diagram set is explicitly scoped to `v1.0` through
  `v1.7.2`; both predate SOT3 by design, not by oversight.
- Future SOT3 tranches (public export, additional activation seams, or
  production-readiness claims) require their own dependency-released work
  order and, where applicable, a superseding or additive ADR; this entry does
  not pre-authorize them.

### Related Files

- `docs/reference/sot_three_layer/README.md`
- `docs/reference/sot_three_layer/CVF_SOT3_ACTIVATION_ARCHITECTURE_DECISION.md`
- `docs/reference/system_architecture_catalog/entries/module.sot3_refinery_runtime.v1.json`
- `docs/reference/system_architecture_catalog/entries/module.sot3_truth_kernel_runtime.v1.json`
- `docs/reference/system_architecture_catalog/entries/module.sot3_truth_flow_runtime.v1.json`
- `docs/reference/system_architecture_catalog/entries/module.sot3_three_layer_slice.v1.json`
- `docs/roadmaps/CVF_SOT3_ACTIVATION_AND_OPERATIONAL_PROOF_ROADMAP_2026-07-13.md`
- `docs/reviews/CVF_SOT3_APP_T5_COMPLETION_REVIEW_2026-07-18.md`
- `ARCHITECTURE.md`
- `CVF_ECOSYSTEM_ARCHITECTURE.md`
- `docs/reference/CVF_ARCHITECTURE_MAP.md`
