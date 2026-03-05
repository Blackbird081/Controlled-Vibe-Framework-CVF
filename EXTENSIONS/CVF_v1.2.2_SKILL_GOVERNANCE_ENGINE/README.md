# CVF v1.2.2 — Skill Governance Engine

> **CVF Version:** v1.2.2 — Sub-extension of v1.2 (Skill Governance)  
> **Layer:** 2 (Tools / Governance Tooling)  
> **Status:** Implemented ✅  
> **Integrated:** 2026-03-05 | **ADR:** ADR-012

---

## 1. Mục tiêu

CVF v1.2.2 mở rộng Skill Governance của v1.2 (Registry, Risk R0–R3) bằng:

- Chuẩn hóa skill theo **CVF Skill Spec Schema (CSS-1.0)**
- Đánh giá risk và cost trước khi thực thi (R0–R3 canonical mapping)
- Tự xếp hạng và chọn skill tối ưu qua **Fusion Intelligence**
- Ghi nhận đầy đủ execution, cost và audit trail vào **Internal Ledger**
- Tự tiến hóa an toàn qua **Evolution Engine** (có probation gate)

Đây không phải skill repository.  
Đây là **Skill Governance & Selection Engine** xây trên CVF Constitution.

---

## 2. Kiến trúc tổng thể

```
/core          → Constitution + Governance Kernel + Phase Manager (với gate)
/skill_system  → Spec / Governance / Fusion / Execution / Static / Dynamic / Adapter
/evolution_engine → Trace → Pattern → Draft Skill → Probation → Governance Approve
/intent        → Intent Classifier + Domain Mapper
/policy        → global / domain / risk.matrix / cost.control
/internal_ledger → skill_usage / risk_decision / dynamic_promotion / execution_trace
```

Luồng chính:

```
User Request → Intent Classifier
→ Skill Search (static + dynamic)
→ Fusion Ranking (semantic 35% + historical 20% + maturity 15% − risk 15% − cost 15%)
→ GovernanceKernel.evaluate() ← Constitution + Risk + Integrity
→ Phase Gate (critical phases require approval)
→ Execution Runtime
→ Ledger Logging → Evolution Engine
```

---

## 3. Nguồn Skill được hỗ trợ

| Nguồn | Loại | Vị trí |
|---|---|---|
| AI Research Skills | Static | `/skill_system/static/ai_research/` |
| Application Skills | Static | `/skill_system/static/application/` |
| Dynamic (Evolution) | Dynamic | `/skill_system/dynamic/approved/` |
| External (skills.sh, GitHub) | External | Pull qua `/skill_system/external_adapter/` |

Dynamic skill không bao giờ tự động được approve — phải qua probation.

---

## 4. Governance Model

Governance phân 4 tầng:

- **Constitution** (core/constitution.ts) — 5 STRICT rules, tối cao tuyệt đối
- **Global Policy** (policy/global.policy.yaml) — Risk threshold ≤70, execution rules
- **Domain Policy** (policy/domain.policy.yaml) — Domain-specific constraints
- **Risk Matrix** (policy/risk.matrix.yaml) — Weighted risk factors

Mọi execution phải đi qua:

- Risk threshold check (≤70 = eligible)
- Skill verification + integrity check
- Phase Gate (GOVERNANCE_DECISION / EXECUTION phải được approve)
- Không có execution trực tiếp.

---

## 5. Skill Spec Schema (CSS-1.0)

Tất cả skill phải tuân theo schema tại `/skill_system/spec/skill.schema.yaml`:

**Các trường bắt buộc:** `id`, `name`, `description`, `version`, `type`, `domain`, `owner`, `maturity`, `risk_r_level`, `risk_profile`, `evaluation`

**R0–R3 Canonical Mapping:**

| R Level | Numeric Score | Nghĩa |
|---|---|---|
| R0 | 0–20 | Passive — no side effects |
| R1 | 21–40 | Controlled — small bounded changes |
| R2 | 41–60 | Elevated — has authority |
| R3 | 61–70 | Critical — hard gate required |

---

## 6. Maturity Model

```
EXPERIMENTAL → PROBATION → STABLE → DEPRECATED
```

| Level | Điều kiện |
|---|---|
| EXPERIMENTAL | Import/generate, chưa test |
| PROBATION | 5+ runs, success rate ≥ 70%, risk ≤ 60 |
| STABLE | 20+ runs, success rate ≥ 85%, risk ≤ 80 |
| DEPRECATED | Không còn execute được |

---

## 7. Fusion Intelligence

Công thức chọn skill:

```
Final Score =
  (0.35 × semantic relevance)
+ (0.20 × historical success rate)
+ (0.15 × maturity level weight)
− (0.15 × risk penalty)
− (0.15 × cost penalty)
```

Fusion chỉ quyết định — không thực thi.

---

## 8. Evolution Engine

```
Execution → Trace (experience.collector.ts)
→ Analysis (trace.analyzer.ts)
→ Pattern Distill (pattern.distiller.ts)
→ Draft Skill (dynamic_skill.generator.ts)
→ Probation (skill.probation.manager.ts)
→ Governance Submit (governance.submitter.ts)
→ Approved / Rejected
```

Dynamic skill KHÔNG bao giờ auto-approved.

---

## 9. CVF Compatibility

| Nguyên tắc CVF | Tuân thủ |
|---|---|
| Human authority — con người quyết định cuối | ✅ Constitution không thể override |
| Safety over speed | ✅ Risk gate trước mọi execution |
| No silent mutation | ✅ Internal Ledger log mọi thứ |
| Backward compatibility | ✅ Không phá v1.2 hay v1.2.1 |
| Audit trail mandatory | ✅ 4 log files trong /internal_ledger/ |

---

## 10. Versioning

**Current:** CVF v1.2.2 (Skill Governance Engine)

**Chuỗi v1.2.x:**

| Version | Tên | Nội dung |
|---|---|---|
| v1.2 | Skill Governance | Registry + Risk R0–R3 |
| v1.2.1 | External Integration | Supply chain pipeline |
| v1.2.2 | Skill Governance Engine | Schema + Fusion + Evolution ← bạn đang ở đây |

Nếu cần bổ sung (multi-agent governance, external compliance layer) → mở `v1.2.3`.  
Không bao giờ bump lên v2.x vì CVF v2.x là territory của Non-Coder Safety UI.

---

*Updated: 2026-03-05 | See [ADR-012](../../docs/CVF_ARCHITECTURE_DECISIONS.md) for integration rationale.*