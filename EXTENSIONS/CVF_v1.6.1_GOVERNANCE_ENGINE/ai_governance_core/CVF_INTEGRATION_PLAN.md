# AI Governance Core — CVF Integration Plan

> **Date:** 2026-02-21  
> **Principle:** CVF là GỐC — ai_governance_core là enforcement runtime phụ thuộc CVF  
> **Prerequisites:** Hoàn thành Sprint 1–2 trong ASSESSMENT_2026-02-21.md trước khi tích hợp

---

## 1. Tổng quan: Hai hệ thống bổ sung nhau

```
┌──────────────────────────────────────────────────────────────────┐
│                     CVF CORE (v1.0/v1.1)                        │
│            Supreme Authority — FROZEN — IMMUTABLE               │
│   4-Phase Model • Risk R0-R4 • Phase Authority • Master Policy  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        ▼                                     ▼
┌──────────────────────┐          ┌───────────────────────────┐
│  cvf-web (TypeScript) │          │ ai_governance_core (Python)│
│  "Live Guardrails"    │          │ "Enterprise Enforcement"   │
│                       │          │                            │
│  • Browser runtime    │  ◄────► │  • CI/CD pipeline          │
│  • Quality scoring    │   API   │  • Approval workflows      │
│  • Safety filters     │         │  • Policy-as-Code DSL      │
│  • Acceptance gate    │         │  • Immutable audit ledger   │
│  • Risk check R0-R4   │         │  • RBAC + identity          │
│  • Enforcement log    │         │  • Tamper detection         │
│  • Monitoring/Sentry  │         │  • Simulation sandbox      │
└──────────────────────┘          └───────────────────────────┘
```

**CVF TS (cvf-web)** = Real-time governance trong browser, scoring AI output live  
**ai_governance_core (Python)** = Enterprise governance backend: audit, CI, approval, compliance  

Chúng **không thay thế nhau** — chúng bổ sung ở hai tầng khác nhau.

---

## 2. Vị trí kiến trúc trong CVF

Theo CVF Agent Adapter Boundary pattern:

```
1. CVF Core            ← Supreme authority (FROZEN)
2. CVF Extensions      ← Risk model, skill contracts  
3. Skill Contract      ← What's allowed
4. Skill Registry      ← What's registered
5. Agent Adapter       ← ★ ai_governance_core sits HERE ★
6. Agent / Model       ← Execution
```

### Extension Type
- **Type:** Process Extension
- **ID:** `CVF-EXT-AI-GOV-CORE`
- **Affected Phases:** All (Discovery → Design → Build → Review)
- **Scope:** Enterprise enforcement, CI/CD governance gate, audit trail
- **Status:** Development

### ai_governance_core KHÔNG ĐƯỢC:
- Override CVF Core decisions
- Định nghĩa governance principles mới (chỉ implement)
- Bypass Phase Authority Matrix
- Thay đổi risk model R0-R4 (chỉ adopt)

---

## 3. Risk Model Harmonization

### CVF Risk Model (Canonical — R0-R4):

| CVF Level | Name | Agent Authority | ai_governance_core tương đương |
|-----------|------|-----------------|-------------------------------|
| **R0** | Minimal | Auto — execute autonomously | *(below LOW — auto-approve)* |
| **R1** | Low | Auto + Audit — execute with logging | **LOW** |
| **R2** | Medium | HITL Required — recommend, human approves | **MEDIUM** |
| **R3** | High | Suggest-only — read-only, no execution | **HIGH** |
| **R4** | Critical | Blocked — disabled entirely | **CRITICAL** |

### Adapter Functions cần tạo:

```python
# File: ai_governance_core/adapters/cvf_risk_adapter.py

CVF_RISK_MAP = {
    "R0": "INFORMATIONAL",
    "R1": "LOW",
    "R2": "MEDIUM",
    "R3": "HIGH",
    "R4": "CRITICAL",
}

REVERSE_MAP = {
    "LOW": "R1",
    "MEDIUM": "R2",
    "HIGH": "R3",
    "CRITICAL": "R4",
}

def cvf_to_governance(cvf_risk: str) -> str:
    """Convert CVF R0-R4 to ai_governance_core level."""
    return CVF_RISK_MAP.get(cvf_risk, "MEDIUM")

def governance_to_cvf(level: str) -> str:
    """Convert ai_governance_core level to CVF R0-R4."""
    return REVERSE_MAP.get(level, "R2")

def risk_score_to_cvf(score: float) -> str:
    """Convert numeric risk_score (0-100) to CVF risk level."""
    if score <= 10: return "R0"
    if score <= 30: return "R1"
    if score <= 60: return "R2"
    if score <= 80: return "R3"
    return "R4"
```

### Decision Mapping:

| ai_governance_core Decision | CVF Enforcement Action |
|----------------------------|----------------------|
| `APPROVED` | `ALLOW` |
| `MANUAL_REVIEW` | `NEEDS_APPROVAL` / `CLARIFY` |
| `REJECTED` | `BLOCK` |
| `FROZEN` | `BLOCK` (permanent) |

---

## 4. Chồng lấn vs Bổ sung

### 4.1 Overlapping — cần align về CVF

| Capability | CVF đã có (TS) | ai_governance_core (Python) | Resolution |
|------------|-----------------|---------------------------|------------|
| Risk evaluation | `risk-check.ts` R0-R4 | `risk_calculator.py` 0-100 | **Adopt CVF R0-R4** — thêm adapter |
| Safety filters | `safety.ts` regex PII/injection | *(không có riêng)* | **Dùng CVF patterns** |
| Quality scoring | `governance.ts` 4-dim 0-100 | *(khác format)* | **Adopt CVF 4-dimension model** |
| Enforcement decision | `enforcement.ts` ALLOW/CLARIFY/BLOCK | `decision_matrix.py` APPROVED/REJECTED | **Map sang CVF verbs** |
| Audit logging | `enforcement-log.ts` analytics | `ledger_layer/` hash-chain | **Bổ sung** — ledger > analytics |

### 4.2 ai_governance_core thêm mới (additive — CVF chưa có)

| New Capability | Module | Giá trị cho CVF | Priority |
|----------------|--------|------------------|----------|
| **Policy-as-Code DSL** | `policy_dsl/` | Declarative rules thay hardcoded if-else | P0 — Core value |
| **Immutable Hash-Chain Ledger** | `ledger_layer/` | Tamper-proof audit trail cho compliance | P0 — Core value |
| **Tamper Detection** | `tamper_detection/` | Registry integrity validation | P1 |
| **RBAC + Identity** | `identity_layer/` | User/role/permission management | P1 |
| **Multi-level Approval Workflow** | `approval_layer/` | SLA, escalation, override, expiry | P0 — Core value |
| **Controlled Override** | `override_layer/` | Project-scoped exceptions with expiry | P1 |
| **Risk Telemetry & Trends** | `telemetry_layer/` | Per-project health scorecards over time | P2 |
| **Policy Simulation** | `simulation_layer/` | Dry-run policy before enforcement | P2 |
| **CI/CD Gate** | `ci/` | PR enforcement with exit codes | P0 — Core value |
| **Brand Drift Detection** | `brand_control_layer/` | Design system compliance scoring | P2 |
| **Multi-domain Evaluation** | `domain_layer/` | Specialized evaluators per output type | P1 |
| **Structured Reports** | `reports/` | JSON/MD/audit compact output formats | P1 |

---

## 5. Integration Architecture

### 5.1 Deployment Model

```
┌─────────────────────────────────────────────────────────┐
│                    CVF Repository                        │
│                                                          │
│ ┌─────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│ │  v1.0/v1.1  │  │   EXTENSIONS/    │  │  governance/ │ │
│ │   (Core)    │  │  v1.2 → v1.6     │  │  (Toolkit)   │ │
│ └─────────────┘  │  ┌─────────────┐ │  └──────────────┘ │
│                  │  │  cvf-web    │ │                    │
│                  │  │  (TS/Next)  │ │                    │
│                  │  └─────────────┘ │                    │
│                  └──────────────────┘                    │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐  │
│ │  ai_governance_core/  (Python enforcement runtime)  │  │
│ │  Position: Agent Adapter / Process Extension        │  │
│ │  Depends on: CVF Core specs + Risk Model R0-R4     │  │
│ └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Communication Pattern

```
cvf-web (Browser)                 ai_governance_core (Server/CI)
     │                                      │
     │  1. User submits AI output           │
     │──────────────────────────────────────►│
     │                                      │
     │  2. Python evaluates:                │
     │     • Policy DSL rules               │
     │     • Domain-specific checks         │
     │     • Risk score calculation         │
     │     • RBAC authorization             │
     │                                      │
     │  3. Returns CVF-compatible result:   │
     │     { risk: "R2",                    │
     │       action: "NEEDS_APPROVAL",      │
     │       score: 72,                     │
     │       ledger_hash: "abc123..." }     │
     │◄─────────────────────────────────────│
     │                                      │
     │  4. cvf-web renders decision         │
     │     using existing enforcement UI    │
     │                                      │
```

### 5.3 Dual-Mode Operation

| Mode | Trigger | Pipeline |
|------|---------|----------|
| **Web Mode** | User interaction in cvf-web | cvf-web TS enforcement → *(optional)* Python API for advanced checks |
| **CI Mode** | `git push` / PR | `ci/pr_gate.py` → full Python pipeline → exit code |
| **Standalone** | `python main.py` | CLI evaluation without web UI |

---

## 6. Concrete Integration Steps (sau khi fix bugs)

### Phase 1: CVF Compliance (cần làm đầu tiên)

1. **Tạo Extension Register entry**
```markdown
# EXTENSION_REGISTER.md entry
| CVF-EXT-AI-GOV-CORE | ai_governance_core | Process | Enterprise AI governance enforcement | CI/CD, Audit, Approval | All Phases | Development |
```

2. **Tạo `adapters/cvf_risk_adapter.py`** — mapping R0-R4 ↔ LOW/MEDIUM/HIGH/CRITICAL

3. **Tạo `adapters/cvf_quality_adapter.py`** — output CVF 4-dimension quality scores

4. **Tạo `adapters/cvf_enforcement_adapter.py`** — map decisions → CVF ALLOW/CLARIFY/BLOCK/NEEDS_APPROVAL

5. **Declare own risk level** — `ai_governance_core` as R2-Medium capability (has execution authority)

### Phase 2: API Layer

6. **Tạo `api/` folder** — FastAPI/Flask endpoints cho cvf-web integration:
   - `POST /evaluate` — evaluate AI output against policies
   - `POST /approve` — trigger approval workflow
   - `GET /ledger/{project_id}` — query audit trail
   - `GET /health` — service health + CVF version compatibility

7. **Response format** — CVF-compatible JSON:
```json
{
  "cvf_risk_level": "R2",
  "cvf_enforcement": "NEEDS_APPROVAL",
  "cvf_quality_score": {
    "completeness": 85,
    "clarity": 78,
    "actionability": 90,
    "compliance": 65,
    "overall": 79.5
  },
  "governance": {
    "risk_score": 62,
    "decision": "MANUAL_REVIEW",
    "policies_evaluated": 12,
    "policies_violated": 2,
    "ledger_hash": "sha256:abc123..."
  }
}
```

### Phase 3: Shared Data

8. **Policy DSL loads CVF policies** — convert CVF Master Policy rules → DSL format:
```
RULE cvf_phase_authority
WHEN phase = "BUILD" AND role = "JUNIOR" AND risk >= "R3"
THEN action = "BLOCK" reason = "Phase Authority Matrix: Junior cannot execute R3+ in Build phase"
```

9. **Identity layer syncs CVF roles** — map CVF roles (Operator/Lead/Reviewer/Observer) → RBAC permissions

10. **Ledger entries include CVF metadata** — phase, risk level, skill ID in every audit record

### Phase 4: CI/CD Integration

11. **Exit codes aligned** (đã đúng):
    - `0` = APPROVED (CVF: ALLOW)
    - `2` = MANUAL_REVIEW (CVF: NEEDS_APPROVAL)
    - `3` = REJECTED (CVF: BLOCK)
    - `4` = FROZEN (CVF: BLOCK permanent)

12. **GitHub Action wrapper** — pre-built action calling `ci/pr_gate.py` with CVF config

13. **Pre-commit hook** — optional local enforcement

---

## 7. Folder Structure sau tích hợp

```
ai_governance_core/
├── adapters/                    ← NEW: CVF compatibility layer
│   ├── __init__.py
│   ├── cvf_risk_adapter.py     ← R0-R4 ↔ LOW/MEDIUM/HIGH/CRITICAL
│   ├── cvf_quality_adapter.py  ← 4-dimension scoring output
│   └── cvf_enforcement_adapter.py  ← Decision verb mapping
│
├── api/                         ← NEW: REST API for cvf-web
│   ├── __init__.py
│   ├── server.py               ← FastAPI app
│   ├── routes/
│   │   ├── evaluate.py
│   │   ├── approve.py
│   │   └── ledger.py
│   └── middleware/
│       └── cvf_auth.py         ← CVF role-based auth
│
├── core_orchestrator.py         ← Existing (after fixes)
├── domain_layer/                ← Existing
├── policy_dsl/                  ← Existing — loads CVF policies too
├── enforcement_layer/           ← Existing — outputs CVF verbs via adapter
├── identity_layer/              ← Existing — syncs CVF roles
├── approval_layer/              ← Existing
├── override_layer/              ← Existing
├── ledger_layer/                ← Existing — includes CVF metadata
├── tamper_detection/            ← Existing
├── telemetry_layer/             ← Existing
├── simulation_layer/            ← Existing
├── compliance_layer/            ← Existing (remove ui_governance_engine dependency)
├── brand_control_layer/         ← Existing
├── ci/                          ← Existing — exit codes aligned
├── reports/                     ← Existing — add CVF format
├── tests/                       ← NEW: Required
│   ├── test_adapters.py
│   ├── test_enforcement.py
│   ├── test_ledger.py
│   ├── test_dsl.py
│   ├── test_approval.py
│   └── test_integration.py
└── config/
    ├── cvf_config.json          ← CVF version, risk thresholds, API endpoints
    └── policies/                ← CVF-derived policy DSL files
```

---

## 8. Precedent trong CVF

Python module trong CVF **đã có tiền lệ**:

1. **v1.3 Implementation Toolkit** — chứa cả TypeScript SDK và Python SDK
2. **governance/skill-library/registry/** — nhiều Python scripts (`generate_user_skills.py`, `validate_registry.py`, `import_skillsmp.py`)
3. **Architecture Separation Diagram** — explicitly lists "Python + TS SDK" trong v1.3
4. **Agent Adapter Boundary** — adapters phải swappable và language-agnostic

→ **ai_governance_core hoàn toàn phù hợp** với CVF architecture.

---

## 9. Timeline ước tính

| Phase | Effort | Prerequisites |
|-------|--------|---------------|
| Fix CRITICAL bugs (Sprint 1) | 2-3 ngày | Trước mọi thứ |
| Fix HIGH bugs (Sprint 2) | 2-3 ngày | Sprint 1 done |
| CVF Compliance adapters | 1-2 ngày | Sprint 1-2 done |
| Extension Register entry | 0.5 ngày | Sprint 1-2 done |
| Basic tests | 3-4 ngày | Sprint 1-2 done |
| API layer | 2-3 ngày | Adapters done |
| cvf-web integration | 2-3 ngày | API done |
| CI/CD pipeline | 1-2 ngày | Tests done |
| **Total** | **~14-20 ngày** | |

---

## 10. Kết luận

| Aspect | Assessment |
|--------|-----------|
| **Tương thích kiến trúc** | ✅ Hoàn toàn tương thích — CVF đã support multi-language, Agent Adapter pattern |
| **Giá trị bổ sung** | ✅ Cao — thêm 12 capabilities CVF chưa có (DSL, ledger, RBAC, approval, CI gate...) |
| **Rủi ro** | ⚠️ Trung bình — cần fix 7 CRITICAL bugs + 6 HIGH bugs trước khi tích hợp |
| **CVF authority** | ✅ CVF giữ quyền supreme — ai_governance_core chỉ implement, không override |
| **Effort** | 14-20 ngày cho full integration |

**ai_governance_core sẽ nâng CVF từ "web governance framework" lên "enterprise governance platform"** — với audit trail bất biến, CI/CD enforcement, và policy-as-code.

---

*Plan generated: 2026-02-21*
