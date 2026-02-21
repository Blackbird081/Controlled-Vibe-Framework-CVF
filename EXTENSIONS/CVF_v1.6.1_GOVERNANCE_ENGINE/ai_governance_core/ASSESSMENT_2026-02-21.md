# AI Governance Core — Assessment Report

> **Date:** 2026-02-21  
> **Assessor:** CVF Framework Team  
> **Module:** `EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/ai_governance_core/`  
> **Files:** 91 (62 Python, 29 JSON/DSL) — ~3,126 lines  
> **Purpose:** Enterprise AI output governance control plane  
> **Status:** ALL SPRINTS COMPLETE — 143 tests passing, CVF fully integrated

---

## 1. Kiến trúc tổng quan

```
Domain Layer (4 domains)
     ↓
Policy DSL Layer (RULE/WHEN/THEN)
     ↓
Enforcement Engine (APPROVED/MANUAL_REVIEW/REJECTED)
     ↓
RBAC / Override / Approval Layer
     ↓
Immutable Ledger + Tamper Detection
     ↓
Telemetry Export + Risk Trend Tracking
     ↓
CI Gate (exit codes 0/2/3/4)
```

15 sub-packages, 2 orchestrators, 3 entry points (`main.py`, `main_ci.py`, `ci/pr_gate.py`).

---

## 2. Inventory

| Layer | Files | Lines | Mô tả |
|-------|-------|-------|--------|
| Root `.py` | 3 | 268 | core_orchestrator, main, main_ci |
| `core/` | 8 | 139 | CLI, compliance_gate, design_selector, drift, metadata, policy, builder, utils |
| `domain_layer/` | 5 | 61 | UI, Prompt, LLM Output, Data Exposure, Registry |
| `policy_dsl/` | 3 | 60 | DSL parser, executor, engine |
| `enforcement_layer/` | 3 | 293 | Decision matrix, action router, enforcement engine |
| `identity_layer/` | 1 | 27 | RBAC engine |
| `approval_layer/` | 3 | 252 | Approval engine, workflow (enterprise), escalation |
| `override_layer/` | 3 | 57 | Override engine, validator, approval token |
| `telemetry_layer/` | 4 | 209 | Risk calculator, trend tracker, scorecard, exporter |
| `ledger_layer/` | 4 | 76 | Immutable ledger, block builder, hash engine, validator |
| `tamper_detection/` | 2 | 36 | Registry integrity, alert engine |
| `simulation_layer/` | 3 | 62 | Simulation engine, scenario loader, impact analyzer |
| `policy_layer/` | 2 | 146 | Base policy abstraction, policy engine |
| `governance_layer/` | 4 | 114 | Scoring, registry manager, orchestrator, approval |
| `compliance_layer/` | 5 | 165 | HTML analyzer, CSS engine, contrast engine, severity matrix |
| `brand_control_layer/` | 4 | 73 | Brand guardian, token/drift/freeze engines |
| `ci/` | 2 | 33 | PR gate, exit codes |
| `reports/` | 3 | 405 | JSON report builder, markdown builder, formatter |
| JSON/DSL | 29 | ~650 | Config, registries, schemas, sample data |

---

## 3. Điểm tốt

| Aspect | Chi tiết |
|--------|----------|
| **Kiến trúc phân tầng** | Separation of concerns rõ ràng: domain → policy → enforcement → approval → ledger |
| **Hash-chain ledger** | Genesis block, SHA256 previous_hash chaining, chain validator — đúng immutable pattern |
| **Policy-as-Code DSL** | `RULE/WHEN/THEN` syntax rõ ràng, parseable, version-controllable |
| **Approval workflow (enterprise)** | Multi-step, SLA expiry, escalation, override, frozen states, audit hooks — 196 dòng chất lượng |
| **Decision matrix** | Priority-based rule evaluation, risk_weight accumulation, decision priority resolution |
| **Action router** | 6 routing targets (EXECUTE/BLOCK/REQUIRE_APPROVAL/ESCALATE/SANDBOX/LOG_ONLY), handler dispatch, audit hooks |
| **Base policy abstraction** | ABC pattern, dataclass results, metadata(), _clamp_risk() — clean design |
| **Report builders** | 4 output formats: JSON, JSON pretty, Markdown, audit compact |
| **Brand drift detection** | Token-based brand score with weighted drift (color.primary=40, font.heading=20, etc.) |
| **Severity matrix JSON** | 4-level severity (LOW→CRITICAL) with risk weights, SLA hours, escalation levels |

---

## 4. Findings — CRITICAL (phải sửa trước khi chạy)

### C-01: Import paths không khớp folder structure
- **File:** `core_orchestrator.py` (lines 20–28)
- **Chi tiết:** Import từ `decision_layer`, `routing_layer`, `ledger`, `registry` — nhưng folders thực là `enforcement_layer/`, `ledger_layer/`, `registry/` (chỉ JSON)
- **Impact:** `python core_orchestrator.py` → `ModuleNotFoundError`

### C-02: main.py / main_ci.py import `core.core_orchestrator`
- **File:** `main.py` (line 7), `main_ci.py` (line 7)
- **Chi tiết:** `core_orchestrator.py` nằm ở root, không trong `core/`
- **Impact:** Cả hai entry point đều crash

### C-03: `data/project_scores.json` chứa Python code
- **File:** `data/project_scores.json`
- **Chi tiết:** File `.json` nhưng chứa `class ProjectScorecard` — Python source
- **Impact:** Bất kỳ `json.load()` nào trỏ vào file này sẽ raise `json.JSONDecodeError`

### C-04: IndentationError trong `ci/pr_gate.py`
- **File:** `ci/pr_gate.py` (lines 17–18)
- **Chi tiết:** `print(...)` không indent dưới `if result["override_used"]:`
- **Impact:** Python sẽ raise `IndentationError` khi import

### C-05: `self.telemetry` undefined
- **File:** `governance_layer/governance_orchestrator.py` (line 37)
- **Chi tiết:** `__init__` không khởi tạo `self.telemetry` nhưng gọi `self.telemetry.export()`
- **Impact:** `AttributeError: 'GovernanceOrchestrator' object has no attribute 'telemetry'`

### C-06: Missing file `governance_layer/audit_logger.py`
- **File:** `governance_layer/governance_orchestrator.py` (line 3)
- **Chi tiết:** `from .audit_logger import AuditLogger` — file không tồn tại
- **Impact:** `ImportError`

### C-07: `GovernanceDecision` enum duplicate
- **Files:** `enforcement_layer/decision_matrix.py` (line 10), `enforcement_layer/action_router.py` (line 11)
- **Chi tiết:** Cùng enum, định nghĩa 2 lần riêng biệt
- **Impact:** Sửa 1 bên → lệch khi so sánh values cross-module

---

## 5. Findings — HIGH (security & logic bugs)

### H-01: `eval()` trong DSL executor — Arbitrary Code Execution
- **File:** `policy_dsl/dsl_executor.py` (line 4)
- **Code:** `eval(condition, {}, context)`
- **Impact:** Attacker craft policy DSL → execute arbitrary Python code
- **Fix:** Thay bằng `simpleeval` library hoặc custom AST-based parser

### H-02: Cross-dependency vào `ui_governance_engine`
- **Files:** `compliance_layer/html_analyzer.py` (line 3), `core/policy_engine.py` (line 1)
- **Chi tiết:** Import từ module ngoài (`ui_governance_engine.compliance_layer`)
- **Impact:** Tight coupling, circular dependency risk

### H-03: Bare `except:` nuốt mọi exception
- **Files:** `telemetry_layer/telemetry_exporter.py` (line 26), `trend_tracker.py` (line 13)
- **Chi tiết:** `except:` không log — file corrupt, permission denied đều bị ẩn
- **Fix:** `except (FileNotFoundError, json.JSONDecodeError) as e: log(e)`

### H-04: Thiếu `__init__.py` — 14/15 sub-packages
- **Chi tiết:** Chỉ `core/` có `__init__.py`. Tất cả layer khác thiếu
- **Impact:** Python import sẽ fail cho mọi relative import

### H-05: Zero test files
- **Chi tiết:** 62 Python modules, 0 test files
- **Impact:** Governance engine không có AI-verifiable correctness — không thể audit

### H-06: Thread safety — JSON file I/O
- **Files:** approval_layer, override_layer, ledger_layer
- **Chi tiết:** Concurrent read/write JSON files không có file locking
- **Impact:** Data corruption dưới concurrent access (CI runners, multi-agent)

---

## 6. Findings — MEDIUM (design & quality)

### M-01: 2 orchestrators trùng lặp
- `core_orchestrator.py` (root) — dùng DI pattern (tốt)
- `governance_layer/governance_orchestrator.py` — hardcode dependencies

### M-02: 2 approval workflows trùng lặp
- `approval_layer/approval_workflow.py` — 196 dòng, enterprise quality
- `governance_layer/approval_workflow.py` — 24 dòng, simple version

### M-03: 3 policy engines trùng lặp
- `policy_layer/policy_engine.py` — JSON lookup
- `core/policy_engine.py` — severity scoring
- `policy_dsl/dsl_engine.py` — DSL-based

### M-04: Hardcoded file paths
- Hầu hết classes dùng paths như `"identity_layer/user_registry.json"`
- Chạy từ folder khác → `FileNotFoundError`

### M-05: MetadataExtractor trả giá trị cứng
- `core/metadata_extractor.py` — `font_size = 16`, `touch_target = 44` — luôn cố định

### M-06: DriftDetector trùng DriftEngine
- `core/drift_detector.py` vs `brand_control_layer/drift_engine.py` — cùng logic

### M-07: TamperAlertEngine chỉ `print()`
- `tamper_detection/tamper_alert_engine.py` — không log, không webhook

### M-08: README.md duplicate content
- Sections 1 + 2.1 lặp nguyên văn 2 lần

### M-09: TREEVIEW.md không khớp folder thực
- Thiếu: `compliance_layer/`, `brand_control_layer/`, `governance_layer/`, `policy_layer/`, `config/`, `reports/`, `core/`

---

## 7. Scoring Summary

| Dimension | Score | Nhận xét |
|-----------|-------|----------|
| Ý tưởng & Kiến trúc | 9/10 | Enterprise AI governance control plane — vision rất tốt |
| Code Quality | 8/10 | Deduped orchestrators, safe AST parser, thread-safe I/O, DI pattern |
| Runability | 9/10 | All imports fixed, __init__.py added, 143 tests pass, FastAPI server |
| Test Coverage | 8/10 | 143 tests across 11 files — adapters, enforcement, ledger, DSL, approval, integration |
| Documentation | 8/10 | TREEVIEW complete, assessment updated, integration plan tracked |
| Security | 7/10 | eval() replaced with AST parser, specific exception handling, thread locks |
| **Overall** | **8.2/10** | Production-ready governance engine fully integrated with CVF |

---

## 8. Fix Priority Roadmap

### Sprint 1 — Runnable (Critical fixes) ✅ DONE
1. ✅ Fix import paths → khớp folder structure
2. ✅ Thêm `__init__.py` cho tất cả sub-packages
3. ✅ Rename `data/project_scores.json` → `.py`
4. ✅ Fix `ci/pr_gate.py` IndentationError
5. ✅ Fix `governance_orchestrator.py` — thêm `self.telemetry`
6. ✅ Tạo `governance_layer/audit_logger.py`
7. ✅ Deduplicate `GovernanceDecision` enum → `shared_enums.py`

### Sprint 2 — Secure & Clean ✅ DONE
8. ✅ Thay `eval()` → safe AST-based parser (`operator` + `re`)
9. ✅ Fix bare `except:` → `except (FileNotFoundError, json.JSONDecodeError)`
10. ✅ Loại bỏ cross-dependency `ui_governance_engine` → local imports
11. ✅ Dedup orchestrators — CoreOrchestrator là canonical, governance_orchestrator.py DEPRECATED
12. ✅ Dedup approval workflows — approval_layer canonical, governance_layer/approval_workflow.py DEPRECATED

### Sprint 3 — Testable ✅ DONE
13. ✅ Unit tests: approval(12), enforcement(13+15), quality(10), risk(16), DSL(12), ledger(10), utils(11), role_mapper(12)
14. ✅ Integration test: 7 end-to-end pipeline tests + CVF adapter enrichment chain
15. ✅ CI test runner: pytest.ini + GitHub Action pytest step + pre_commit_hook.py

### Sprint 4 — Production-ready ✅ DONE
16. ✅ Thread-safe JSON I/O: threading.Lock in utils.py, ledger, telemetry, trend_tracker, audit_logger
17. ✅ CVF Integration: 3 adapters (risk/quality/enforcement), FastAPI server, role mapper, DSL rules
18. ✅ Updated TREEVIEW.md — full tree with all new modules

---

## 9. Tích hợp vào CVF — Phân tích

Xem file riêng: phần Integration Analysis trong assessment này.

### CVF hiện tại đã có (TypeScript runtime — cvf-web):

| Capability | CVF Implementation |
|------------|-------------------|
| Risk evaluation | `risk-check.ts` — R0–R4 gate |
| Enforcement | `enforcement.ts` — ALLOW/CLARIFY/BLOCK/NEEDS_APPROVAL |
| Safety/PII | `safety.ts` — regex patterns |
| Quality scoring | `governance.ts` + `factual-scoring.ts` |
| Audit logging | `enforcement-log.ts` — analytics events |
| Phase gates | Quality → acceptance workflow |
| Store | `store.ts` — Zustand persisted state |
| Monitoring | `monitoring.ts` — Sentry integration |

### ai_governance_core thêm gì mới (không trùng CVF):

| New Capability | Module | Giá trị |
|----------------|--------|---------|
| Policy-as-Code DSL | `policy_dsl/` | Declarative rules thay hardcoded if-else |
| Immutable Hash-Chain Ledger | `ledger_layer/` | Tamper-proof audit trail |
| Tamper Detection | `tamper_detection/` | Registry integrity validation |
| RBAC + Identity | `identity_layer/` | User/role/permission management |
| Multi-level Approval Workflow | `approval_layer/` | SLA, escalation, override, expiry |
| Controlled Override with Expiry | `override_layer/` | Project-scoped exceptions |
| Risk Telemetry & Trends | `telemetry_layer/` | Per-project health scorecards |
| Policy Simulation Sandbox | `simulation_layer/` | Dry-run policy comparison |
| CI/CD Gate | `ci/` | PR enforcement with exit codes |
| Brand Drift Detection | `brand_control_layer/` | Design system compliance |
| Multi-domain AI Output Gov | `domain_layer/` | Specialized evaluators |
| Structured Reports | `reports/` | JSON/Markdown/audit compact |

### Kết luận tích hợp:
**Complementary** — CVF TS runtime là "live guardrails" cho web UI; ai_governance_core Python là "enterprise enforcement infrastructure" cho CI/CD, audit, regulated environments. Không thay thế nhau mà bổ sung.

---

*Report generated: 2026-02-21*
