# CVF Evolution Governance Rules — v1.1.2

> **Developed by Tien - Tan Thuan Port@2026**  
> **Layer:** 1.5 — Development Governance  
> **Version:** v1.1.2 Phase Governance Hardening  
> **Source:** De_xuat_11 (Evolution Governance) + De_xuat_12 (Design Invariants)

---

## I. FRAMEWORK EVOLUTION PRINCIPLES

CVF modules phải được phân loại trong **3 layers** trước khi thêm vào:

| Layer | Thuộc nếu module | Ví dụ |
|---|---|---|
| **CORE** | Định nghĩa process / phase / primitive | `phase.protocol.ts`, `artifact.registry.ts` |
| **VERIFICATION** | Xác minh correctness của artifacts | `state_enforcement/`, `scenario_simulator/` |
| **OBSERVABILITY** | Audit / log / report / dashboard | `reports/`, `governance.audit.log.ts` |

> **Quy tắc vàng:** Module không thuộc 3 loại này → **không được thêm vào CVF**.

---

## II. 5 DESIGN INVARIANTS (Bất Biến)

### INV-A — AI must produce commits
> AI không được thay đổi repo trực tiếp. Mọi thay đổi phải thông qua AI Commit (phase-tracked, governance-validated).

### INV-B — Artifact identity must be stable  
> Artifact không được định danh bằng path. Path có thể rename/move. Artifact phải có `artifact_id` path-independent.

### INV-C — Process transitions must be deterministic
> AI không được nhảy phase tùy ý. Transitions phải đi đúng thứ tự: `SPEC → STATE_MACHINE → ... → COMPLETE`. Phase gate phải chặn nếu vi phạm.

### INV-D — Governance must be deterministic
> Pipeline governance phải chạy theo `GOVERNANCE_PIPELINE` cố định. Thứ tự khác nhau → kết quả validation không nhất quán → không cho phép.

Operational refinement (2026-03-07):
- `artifact_integrity` phải chạy trước các verification module còn lại để thiết lập trust boundary fail-fast.
- Deterministic không chỉ là "fixed order", mà còn là "fixed order with trusted inputs first".

### INV-E — Verification must be pluggable
> Verification modules (`state_enforcement`, `diagram_validation`, `structural_diff`, `scenario_simulator`) KHÔNG được hardcode trong core. Core chỉ load và gọi plugins.

Implementation note (2026-03-07):
- `runtime/governance.executor.ts` phải resolve module theo plugin registry, rồi iterate bằng `GOVERNANCE_PIPELINE`.
- Override module được phép ở executor boundary, nhưng không được phép đổi thứ tự pipeline canon.
- Nếu executor được truyền `GovernanceAuditLog`, phase report và hash ledger phải được persist tự động sau `reports`.
- Với major remediation batch, audit persistence nên mang theo forensic metadata tối thiểu: `requestId`, `traceBatch`, `traceHash`.
- `policyVersion` và default `auditPhase` nên được bind từ một control-plane contract dùng chung, không rải rác ở từng caller.

---

## III. DECISION MATRIX — Module Mới

Trước khi thêm bất kỳ module mới vào CVF:

| Câu hỏi | Nếu YES |
|---|---|
| Module định nghĩa process/phase? | → **CORE** |
| Module xác minh correctness? | → **VERIFICATION** |
| Module audit/log/report? | → **OBSERVABILITY** |
| Module không phù hợp 3 loại? | → **REJECT** |

---

## IV. GOVERNANCE EXECUTOR RULE

> `runtime/governance.executor.ts` là **EXECUTOR** — nằm NGOÀI `/governance/`.  
> `/governance/` modules là **logic thuần túy** — không chứa orchestration.  
> Không bao giờ thêm pipeline-order logic vào bên trong `/governance/`.

---

## V. VERSION GATE RULES

| Loại thay đổi | Version tăng |
|---|---|
| Mở rộng logic files hiện có | PATCH (v1.1.2) |
| Thêm module mới trong layer hiện tại | MINOR |
| Thêm layer mới hoặc thay đổi core identity | MAJOR (v3.0) |
| Core philosophy thay đổi | MAJOR |
