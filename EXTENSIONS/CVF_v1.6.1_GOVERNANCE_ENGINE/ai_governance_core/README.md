# CVF v1.6.1 — Governance Engine

> **Version:** 1.6.1  
> **Status:** Production-ready  
> **Assessment Score:** 8.2/10  
> **Tests:** 143 passing  
> **Location:** `EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/ai_governance_core/`

Enterprise AI output governance control plane, fully integrated with the **Controlled Vibe Framework (CVF)**.

---

## 1. Overview

The Governance Engine provides **enterprise enforcement infrastructure** for AI output governance — complementing CVF's TypeScript runtime ("live guardrails") with a Python-based CI/CD enforcement, audit, and regulated-environment layer.

### What it adds to CVF

| Capability | Module | Value |
|------------|--------|-------|
| Policy-as-Code DSL | `policy_dsl/` | Declarative `RULE/WHEN/THEN` — replaces hardcoded if-else |
| Immutable Hash-Chain Ledger | `ledger_layer/` | Tamper-proof SHA256 audit trail |
| Tamper Detection | `tamper_detection/` | Registry integrity validation |
| RBAC + Identity | `identity_layer/` | User/role/permission management |
| Multi-level Approval | `approval_layer/` | SLA expiry, escalation, override, frozen states |
| Controlled Override | `override_layer/` | Project-scoped exceptions with expiry |
| Risk Telemetry & Trends | `telemetry_layer/` | Per-project health scorecards |
| Policy Simulation | `simulation_layer/` | Dry-run policy comparison |
| CI/CD Gate | `ci/` | PR enforcement with exit codes |
| Brand Drift Detection | `brand_control_layer/` | Design system compliance |
| Multi-domain AI Output Gov | `domain_layer/` | Specialized evaluators |
| Structured Reports | `reports/` | JSON, Markdown, audit compact |
| **CVF Risk Adapter** | `adapters/` | R0-R4 ↔ LOW/MEDIUM/HIGH/CRITICAL mapping |
| **CVF Quality Adapter** | `adapters/` | 4-dimension quality scoring with grades |
| **CVF Enforcement Adapter** | `adapters/` | Decision → CVF enforcement actions + phase authority |
| **CVF Role Mapper** | `identity_layer/` | CVF roles ↔ internal roles bidirectional mapping |
| **REST API** | `api/` | FastAPI server: evaluate, approve, ledger, health |

---

## 2. Quick Start

### Prerequisites

```bash
pip install -r requirements.txt
```

### Run Tests

```bash
python -m pytest tests/ -v
# 143 tests, all passing
```

### Start API Server

```bash
uvicorn api.server:app --reload --port 8000
```

### CI/CD Execution

```bash
python main_ci.py
```

| Exit Code | Meaning |
|-----------|---------|
| 0 | APPROVED |
| 2 | MANUAL_REVIEW |
| 3 | REJECTED |
| 4 | FROZEN |

---

## 3. Architecture

```
                     ┌─────────────────────────────────────┐
                     │          CoreOrchestrator            │
                     │    (Unified 8-step DI pipeline)      │
                     └─────────────┬───────────────────────┘
                                   │
     ┌─────────────────────────────┼─────────────────────────────┐
     │                             │                             │
     ▼                             ▼                             ▼
┌──────────┐              ┌──────────────┐              ┌────────────┐
│ Domain   │              │ Policy DSL   │              │ Enforcement│
│ Layer    │              │ Engine       │              │ Engine     │
│ (4 doms) │              │ RULE/WHEN/   │              │ Decision   │
│          │              │ THEN         │              │ Matrix +   │
└────┬─────┘              └──────┬───────┘              │ Action     │
     │                           │                      │ Router     │
     │                           │                      └─────┬──────┘
     │                           │                            │
     ▼                           ▼                            ▼
┌──────────┐              ┌──────────────┐              ┌────────────┐
│ RBAC +   │              │ Approval     │              │ Override   │
│ Identity │              │ Workflow     │              │ Engine     │
│ + CVF    │              │ (Enterprise) │              │ (Expiry)   │
│ Role Map │              │ SLA/Escalate │              │            │
└────┬─────┘              └──────┬───────┘              └─────┬──────┘
     │                           │                            │
     └───────────────────────────┼────────────────────────────┘
                                 │
     ┌───────────────────────────┼────────────────────────────┐
     │                           │                            │
     ▼                           ▼                            ▼
┌──────────┐              ┌──────────────┐              ┌────────────┐
│ Immutable│              │ Telemetry    │              │ Brand      │
│ Ledger   │              │ Export +     │              │ Control    │
│ (SHA256  │              │ Trend Track  │              │ Drift +    │
│  chain)  │              │              │              │ Freeze     │
└──────────┘              └──────────────┘              └────────────┘
                                 │
                   ┌─────────────┼───────────────────┐
                   │             │                   │
                   ▼             ▼                   ▼
            ┌────────────┐ ┌──────────┐ ┌──────────────────┐
            │ CVF Risk   │ │ CVF      │ │ CVF Enforcement  │
            │ Adapter    │ │ Quality  │ │ Adapter          │
            │ R0-R4      │ │ Adapter  │ │ Phase Authority  │
            └────────────┘ └──────────┘ └──────────────────┘
```

### Pipeline Flow (8 steps)

1. **Domain evaluation** — 4 specialized domains analyze AI output
2. **DSL policy engine** — Declarative rules determine actions
3. **Decision matrix** — Priority-based rule evaluation with risk weighting
4. **Action routing** — Route to EXECUTE/BLOCK/REQUIRE_APPROVAL/ESCALATE/SANDBOX/LOG_ONLY
5. **RBAC check** — Role-based permission verification
6. **Override/Approval** — Multi-level approval with SLA and escalation
7. **Ledger append** — Immutable hash-chain record
8. **Telemetry export** — Risk metrics + CVF adapter enrichment

---

## 4. CVF Integration

### Risk Model (R0-R4)

| CVF Level | Internal | Score Range | Description |
|-----------|----------|-------------|-------------|
| R0 | LOW | 0.0 – 0.2 | No risk — auto-approve |
| R1 | LOW | 0.2 – 0.4 | Minimal risk |
| R2 | MEDIUM | 0.4 – 0.6 | Moderate — review recommended |
| R3 | HIGH | 0.6 – 0.8 | High — requires reviewer approval |
| R4 | CRITICAL | 0.8 – 1.0 | Critical — blocked, escalation required |

### Quality Scoring (4 dimensions)

| Dimension | Weight | Source |
|-----------|--------|--------|
| Correctness | 1.0x | Compliance result |
| Safety | 2.0x | Risk score (inverted) |
| Alignment | 1.0x | Brand compliance |
| Quality | 1.0x | Overall status |

Grades: **A** (≥0.9) → **B** (≥0.8) → **C** (≥0.7) → **D** (≥0.6) → **F** (<0.6)

### Phase Authority Matrix

| Phase | Can Approve | Can Override | Max Risk |
|-------|-------------|--------------|----------|
| A (Discovery) | No | No | R1 |
| B (Design) | No | No | R2 |
| C (Development) | Yes | No | R3 |
| D (Testing) | Yes | Yes | R3 |
| E (Production) | Yes | Yes | R4 |

### Role Mapping

| CVF Role | Internal Role | Hierarchy |
|----------|---------------|-----------|
| Observer | — | Level 0 |
| Operator | DEVELOPER | Level 1 |
| Lead | TEAM_LEAD | Level 2 |
| Reviewer | SECURITY_OFFICER | Level 3 |

---

## 5. API Reference

Base URL: `http://localhost:8000`

### `GET /health`
Health check — returns `{"status": "ok", "timestamp": "..."}`

### `POST /evaluate`
Evaluate AI output through governance pipeline.

```json
{
  "artifact_type": "llm_output",
  "content": "Generated text to evaluate",
  "user_role": "DEVELOPER",
  "project_id": "my-project",
  "cvf_phase": "C",
  "cvf_risk_level": "R2"
}
```

### `POST /approve`
Submit approval for a pending decision.

```json
{
  "request_id": "req-123",
  "approver": "security_lead",
  "decision": "APPROVED"
}
```

### `GET /ledger`
Retrieve the full immutable audit ledger.

### `POST /risk-convert`
Convert between CVF and internal risk levels.

```json
{
  "level": "R3",
  "direction": "to_internal"
}
```

---

## 6. Policy DSL

Write governance rules as declarative code:

```dsl
RULE RejectPromptInjection
WHEN violation == "PROMPT_INJECTION"
THEN action = "REJECT"

RULE HighRiskBlock
WHEN risk_score > 75
THEN action = "REJECT"

RULE CVF_PhaseC_Authority
WHEN cvf_phase == "C" AND cvf_risk_level == "R3"
THEN action = "MANUAL_REVIEW"

RULE CVF_R4_Block
WHEN cvf_risk_level == "R4"
THEN action = "REJECT"
```

Policies are version-controlled, reviewable, testable, and hashable.

---

## 7. Security

| Feature | Implementation |
|---------|----------------|
| No `eval()` | AST-based safe parser with `operator` module |
| Thread safety | `threading.Lock` in utils, ledger, telemetry, audit |
| Immutable audit | SHA256 hash-chain, tamper detection before every evaluation |
| Controlled override | Registry entry + expiry + approved_by + scope + hash |
| RBAC enforcement | Permission matrix, role hierarchy, escalation |
| Specific exceptions | No bare `except:` — all handlers specify exception types |

---

## 8. Testing

```
143 tests across 11 files:

tests/test_approval.py               — 12 tests (create, approve, reject, multi-step, override)
tests/test_cvf_enforcement_adapter.py — 15 tests (actions, phase authority, enrichment)
tests/test_cvf_quality_adapter.py     — 10 tests (scoring, grades, from_governance_result)
tests/test_cvf_risk_adapter.py        — 16 tests (bidirectional mapping, score thresholds)
tests/test_dsl.py                     — 12 tests (value parsing, condition evaluation, edge cases)
tests/test_enforcement.py            — 13 tests (DecisionMatrix, ActionRouter, enums)
tests/test_integration.py            —  7 tests (end-to-end pipeline, CVF metadata in ledger)
tests/test_ledger.py                 — 10 tests (HashEngine, BlockBuilder, ImmutableLedger)
tests/test_role_mapper.py            — 12 tests (bidirectional mapping, authority, permissions)
tests/test_utils.py                  — 11 tests (load, save, atomic writes, thread safety)
tests/conftest.py                    — Shared fixtures
```

---

## 9. Project Structure

See [TREEVIEW.md](TREEVIEW.md) for the complete file tree.

Key directories:

| Directory | Purpose |
|-----------|---------|
| `adapters/` | CVF integration adapters (risk, quality, enforcement) |
| `api/` | FastAPI REST server |
| `domain_layer/` | 4 domain evaluators |
| `policy_dsl/` | Declarative RULE/WHEN/THEN engine |
| `enforcement_layer/` | Decision matrix + action router |
| `identity_layer/` | RBAC + CVF role mapper |
| `approval_layer/` | Enterprise approval workflow |
| `override_layer/` | Controlled override with expiry |
| `ledger_layer/` | Immutable SHA256 hash-chain |
| `telemetry_layer/` | Risk metrics + trend tracking |
| `brand_control_layer/` | Brand drift + freeze detection |
| `compliance_layer/` | HTML/CSS/contrast compliance |
| `tamper_detection/` | Registry integrity validation |
| `simulation_layer/` | Policy simulation sandbox |
| `reports/` | JSON/Markdown/audit report builders |
| `ci/` | GitHub Action + pre-commit hook |
| `tests/` | 143 tests across 11 files |
| `core/` | Shared utilities (thread-safe JSON I/O) |

---

## 10. CI/CD Integration

### GitHub Action

The included `ci/github_action.yml` runs on push/PR to `main` and `develop`:

1. Install Python 3.11 + dependencies
2. Run `python -m pytest tests/ -v`
3. Execute `python main_ci.py` with governance config
4. Upload governance artifacts

### Pre-commit Hook

`ci/pre_commit_hook.py` validates:
- `governance_config.json` exists and is valid JSON
- Freeze mode is not active
- Ledger integrity is intact

---

## 11. Enterprise Readiness

Suitable for:

- **Fintech** — Policy-as-Code compliance, immutable audit trail
- **Healthcare** — Role-based access, multi-level approval workflow
- **Logistics AI** — Risk telemetry, trend tracking, project scorecards
- **Enterprise AI Copilots** — Domain-specific governance, controlled override
- **Regulated Industries** — Tamper detection, hash-chain ledger, escalation
- **Multi-agent Orchestration** — Thread-safe I/O, CI/CD gates, API server

---

## 12. Related Documents

| Document | Description |
|----------|-------------|
| [TREEVIEW.md](TREEVIEW.md) | Complete file tree |
| [ASSESSMENT_2026-02-21.md](ASSESSMENT_2026-02-21.md) | Full assessment report (8.2/10) |
| [CVF_INTEGRATION_PLAN.md](CVF_INTEGRATION_PLAN.md) | Integration roadmap (completed) |

---

*CVF v1.6.1 — Governance Engine | Assessment: 8.2/10 | 143 tests passing | 2026-02-21*
