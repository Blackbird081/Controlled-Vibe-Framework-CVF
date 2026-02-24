# CVF 1.7.0 – Bug Fix Roadmap
## Mục tiêu: Hoàn thiện v1.7.0, không tạo v1.8.0

> Đây là kết quả từ đánh giá chi tiết ngày 2026-02-24.  
> Không thêm tính năng mới. Chỉ fix lỗi, đồng bộ, hoàn thiện.

---

## 🔴 PHASE 1 — Fix lỗi P0 (Critical, fix trước tiên)

### P0-1: Merge 2 Role Graph thành 1 source of truth

**Vấn đề:**  
`role.graph.ts` và `transition.validator.ts` định nghĩa 2 graph khác nhau:
- `role.graph.ts`: `REVIEW → RISK`, `BUILD → TEST` (chỉ)
- `transition.validator.ts`: `REVIEW → PLAN`, `BUILD → TEST/DEBUG`

**Action:**
- [ ] Quyết định graph chính xác (khuyên dùng `transition.validator.ts` vì rõ hơn)
- [ ] Xóa `transition.policy.ts` (file cũ, dead code)
- [ ] Xóa `role.graph.ts` hoặc giữ lại chỉ phần `AgentRole` enum
- [ ] Chuyển `reasoning.mode.ts` import `AgentRole` từ `role.types.ts` thay vì `role.graph.ts`

**Files cần sửa:**
- `intelligence/role_transition_guard/role.graph.ts`
- `intelligence/role_transition_guard/transition.policy.ts` → DELETE
- `intelligence/determinism_control/reasoning.mode.ts` (sửa import)

---

### P0-2: controlled.reasoning.ts phải gọi policy.engine.ts

**Vấn đề:**  
`controlled.reasoning.ts` nhận `policyCompliant: boolean` từ caller rồi trust blind.  
Đây là bypass governance engine — caller có thể pass `true` mà không verify gì.

**Action:**
- [ ] Import `bindPolicy` từ `core/governance/policy.binding.ts`
- [ ] Thay `if (!policyCompliant)` bằng gọi `bindPolicy({ sessionId, role, riskScore })`
- [ ] Xóa `policyCompliant` khỏi `ReasoningInput` interface

**Files cần sửa:**
- `intelligence/reasoning_gate/controlled.reasoning.ts`
- `intelligence/reasoning_gate/reasoning.types.ts` (xóa field `policyCompliant`)

---

### P0-3: Import threshold từ constants, không hardcode

**Vấn đề:**  
`controlled.reasoning.ts` dòng 52 hardcode `0.85`:
```ts
if (riskScore > 0.85) { // ← không nhất quán với GOVERNANCE_HARD_RISK_THRESHOLD
```

**Action:**
- [ ] Import `GOVERNANCE_HARD_RISK_THRESHOLD` từ `core/governance/governance.constants.ts`
- [ ] Thay `0.85` bằng constant

**Files cần sửa:**
- `intelligence/reasoning_gate/controlled.reasoning.ts`

---

## 🟠 PHASE 2 — Đồng bộ Treeview & Filesystem (P1)

### P1-1: Tạo các file có trong TREEVIEW nhưng chưa tồn tại

TREEVIEW khai báo nhưng file chưa có trên disk:

| File khai báo | Thực tế |
|---|---|
| `intelligence/context_segmentation/context.segmenter.ts` | ❌ Không tồn tại |
| `intelligence/context_segmentation/context.types.ts` | ❌ Không tồn tại |
| `intelligence/introspection/self.check.ts` | ❌ Không tồn tại |
| `intelligence/introspection/reasoning.audit.ts` | ❌ Không tồn tại |

**Action:**
- [ ] Tạo `context.segmenter.ts` — wrap `context.pruner.ts` + `summary.injector.ts` thành 1 interface chính
- [ ] Tạo `context.types.ts` — export types `ContextChunk`, `PhaseSummary`
- [ ] Tạo `self.check.ts` — kiểm tra session state hợp lệ (role, entropy, riskScore trong giới hạn)
- [ ] Tạo `reasoning.audit.ts` — log + review lại từng reasoning step

---

### P1-2: Cập nhật TREEVIEW cho khớp thực tế

Các file có trên disk nhưng KHÔNG có trong TREEVIEW:

| File thực tế | Trong TREEVIEW |
|---|---|
| `intelligence/context_segmentation/session.fork.ts` | ❌ Thiếu |
| `intelligence/context_segmentation/context.pruner.ts` | ❌ Thiếu |
| `intelligence/context_segmentation/summary.injector.ts` | ❌ Thiếu |
| `intelligence/context_segmentation/memory.boundary.ts` | ❌ Thiếu |
| `intelligence/role_transition_guard/loop.detector.ts` | ❌ Thiếu |
| `intelligence/role_transition_guard/depth.limiter.ts` | ❌ Thiếu |

**Action:**
- [ ] Cập nhật `TREEVIEW – CVF 1.7.0.md` cho đúng với thực tế
- [ ] Quyết định giữ hay xóa từng file dư

---

### P1-3: Bổ sung lesson.schema.ts cho đúng MODULE SPECIFICATIONS

**Vấn đề:**  
MODULE SPECIFICATIONS.md yêu cầu:
```ts
interface Lesson {
  rootCause: string       // ← thiếu
  preventionRule: string  // ← thiếu  
  riskLevel: string       // ← thiếu
  severity: 'low' | 'medium' | 'high'  // ← thiếu
}
```

**Action:**
- [ ] Bổ sung các fields thiếu vào `lesson.schema.ts`
- [ ] Cập nhật `lesson.store.ts` nếu cần
- [ ] Cập nhật `lesson.injector.ts` để inject cả `preventionRule`

---

### P1-4: Entropy nên block khi kết hợp với risk cao

**Vấn đề:**  
`controlled.reasoning.ts` chỉ log khi entropy unstable, không block.

**Action:**
- [ ] Nếu `entropyAssessment.unstable && riskScore >= GOVERNANCE_ESCALATION_THRESHOLD` → return block
- [ ] Cập nhật `governance_audit_log` với event type `ENTROPY_BLOCK`

---

## 🟡 PHASE 3 — Code Quality (P2)

### P2-1: Dependency cleanup

- [ ] `transition.policy.ts` → **Xóa** (trùng với `transition.validator.ts`)
- [ ] Kiểm tra toàn bộ import path: không import từ file sẽ bị xóa

### P2-2: `reasoning.mode.ts` import nhất quán

- [ ] Đổi `import { AgentRole } from "../role_transition_guard/role.graph"` 
  thành `import { AgentRole } from "../role_transition_guard/role.types"`

### P2-3: `deviation.report.ts` severity logic

- [ ] Severity không nên chỉ dựa trên số lượng issues
- [ ] Thêm tham số `severityHints?: string[]` hoặc dùng lookup map theo issue type

### P2-4: `correction.plan.ts` luôn return `requiresGovernanceApproval: true`

- [ ] Phân biệt: LOW deviation → không cần governance approval
- [ ] HIGH deviation → bắt buộc

---

## 📋 Thứ tự thực hiện

```
PHASE 1 (P0) → PHASE 2: P1-1 + P1-3 → PHASE 2: P1-2 (treeview) → P1-4 → PHASE 3
```

| Bước | Nội dung | Files | Ưu tiên |
|------|----------|-------|---------|
| 1 | Merge role graph | `role.graph.ts`, `transition.validator.ts`, `transition.policy.ts` | 🔴 P0 |
| 2 | Fix governance bypass | `controlled.reasoning.ts`, `reasoning.types.ts` | 🔴 P0 |
| 3 | Fix hardcode threshold | `controlled.reasoning.ts` | 🔴 P0 |
| 4 | Tạo 4 file thiếu | `context.segmenter.ts`, `context.types.ts`, `self.check.ts`, `reasoning.audit.ts` | 🟠 P1 |
| 5 | Fix lesson.schema | `lesson.schema.ts`, `lesson.injector.ts` | 🟠 P1 |
| 6 | Entropy block logic | `controlled.reasoning.ts` | 🟠 P1 |
| 7 | Cập nhật TREEVIEW | `TREEVIEW – CVF 1.7.0.md` | 🟠 P1 |
| 8 | Import cleanup | `reasoning.mode.ts` | 🟡 P2 |
| 9 | Xóa dead code | `transition.policy.ts` | 🟡 P2 |
| 10 | Refine introspection logic | `deviation.report.ts`, `correction.plan.ts` | 🟡 P2 |

---

> **Kết quả mong đợi sau khi hoàn thành:**  
> CVF 1.7.0 sẽ là một bản hoàn chỉnh — governance đúng nơi, code nhất quán, treeview khớp filesystem, lesson schema đầy đủ.  
> Không cần tạo v1.8.0 cho đến khi 1.7.0 thực sự solid.
