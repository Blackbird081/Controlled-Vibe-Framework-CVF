# CVF – Controlled Intelligence Extension
## Integration Guide: How Extension Fits Into Base CVF

> **Nguyên tắc:** CVF gốc (v1.0–v1.6) là chuẩn tuyệt đối.  
> Extension chỉ là tầng automation bên dưới — không thay thế, không mâu thuẫn với CVF gốc.

---

## 1. Quan hệ Extension ↔ CVF Gốc

```
┌──────────────────────────────────────────────────────────┐
│  CVF Gốc (v1.0–v1.6)  — HUMAN PROCESS LAYER             │
│  4-Phase: Discovery → Design → Build → Review            │
│  Risk: R0–R3                                             │
│  Skills: 124 skills across 12 domains                    │
│  Governance: Phase gates + checklists                    │
└──────────────┬─────────────────────────────┬────────────┘
               │ maps to                     │ maps to
               ▼                             ▼
┌──────────────────────────────────────────────────────────┐
│  CVF Extension (v1.7.0)  — AGENT RUNTIME LAYER          │
│  AgentRole: PLAN→RESEARCH→DESIGN→BUILD→TEST→REVIEW       │
│  riskScore: 0.0–1.0                                      │
│  Lessons: versioned, persisted                           │
│  Governance: automated policy.engine                     │
└──────────────────────────────────────────────────────────┘
```

**Extension không thay thế CVF gốc.** Nó tự động hóa phần agent execution bên trong mỗi CVF phase.

---

## 2. Risk Level Mapping

| CVF Gốc | Ý nghĩa | riskScore | Policy Effect |
|---|---|---|---|
| **R0** | Low — standard tasks | 0.0–0.34 | → ALLOW |
| **R1** | Medium — lead review | 0.35–0.69 | → ALLOW + log |
| **R2** | High — senior approval | 0.70–0.89 | → ESCALATE |
| **R3** | Critical — board sign-off | 0.90–1.0 | → BLOCK |

**File:** `core/governance/risk.mapping.ts`

```ts
import { riskLevelToScore, scoreToRiskLevel } from "./core/governance/risk.mapping"

// Khi human set R2:
const score = riskLevelToScore("R2")  // → 0.72

// Khi agent trả về riskScore 0.85:
const level = scoreToRiskLevel(0.85)  // → "R2"
```

---

## 3. Phase → AgentRole Mapping

| CVF Phase | Tên | AgentRoles được phép | Primary Role |
|---|---|---|---|
| **Phase A** | Discovery | PLAN, RESEARCH | RESEARCH |
| **Phase B** | Design | PLAN, RESEARCH, DESIGN | DESIGN |
| **Phase C** | Build | BUILD, TEST, DEBUG | BUILD |
| **Phase D** | Review | REVIEW, RISK | REVIEW |

**File:** `core/governance/role.mapping.ts`

```ts
import { isRoleAllowedInPhase, getPrimaryRoleForPhase } from "./core/governance/role.mapping"

// Kiểm tra: agent có được dùng BUILD trong Phase A không?
isRoleAllowedInPhase(AgentRole.BUILD, "A")  // → false → không cho phép

// Khi bắt đầu Phase C:
const role = getPrimaryRoleForPhase("C")  // → AgentRole.BUILD
```

---

## 4. Skill System Mapping

CVF gốc có **124 skills** trong `CVF_SKILL_LIBRARY/`. Extension registry phục vụ việc lookup skill theo tên và phase:

```ts
import { registerSkill, getSkillsByPhase } from "./core/registry/skill.registry"

registerSkill({
  name: "systematic-debugging",
  version: "1.0",
  category: "debugging",
  cvfPhase: "C"  // belongs to Phase C (Build)
})

// Get all skills for Phase C
getSkillsByPhase("C")
```

---

## 5. Dữ liệu Persistent — Paths mặc định

| Store | File | Env override |
|---|---|---|
| Governance audit | `cvf_audit.jsonl` | `CVF_AUDIT_LOG_PATH` |
| Lesson store | `cvf_lessons.json` | `CVF_LESSONS_PATH` |
| Rollback snapshots | `cvf_rollback.jsonl` | `CVF_ROLLBACK_PATH` |

Tất cả tạo ra relative to `process.cwd()` — khuyến nghị đặt trong thư mục project.

---

## 6. Governance Constants — Alignment với CVF R-levels

`core/governance/governance.constants.ts` phải tuân theo risk.mapping:

| Constant | Giá trị | CVF Risk |
|---|---|---|
| `GOVERNANCE_ESCALATION_THRESHOLD` | 0.7 | R2 boundary |
| `GOVERNANCE_HARD_RISK_THRESHOLD` | 0.9 | R3 boundary |

---

## 7. Những gì Extension KHÔNG làm

- ❌ Không thay thế Phase gates của CVF gốc (vẫn cần human approval)
- ❌ Không thay thế checklists governance
- ❌ Không quyết định architecture (vẫn cần Phase B của CVF)
- ❌ Không auto-approve R3 — BLOCK cứng, chuyển về human governance

---

> **Extension là công cụ của CVF, không phải thay thế CVF.**
