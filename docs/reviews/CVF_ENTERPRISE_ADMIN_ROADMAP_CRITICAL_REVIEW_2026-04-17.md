# CVF Enterprise Admin Console Roadmap — Phản biện & Bổ sung
*Review Date: 2026-04-17*
*Subject: `docs/roadmaps/CVF_ENTERPRISE_ADMIN_ROADMAP_2026-04-18.md`*
*Reviewer: Claude Opus 4.7 (AI Review)*
Memory class: FULL_RECORD

---

## Tóm tắt nhanh

Roadmap có **ý tưởng đúng hướng** (FinOps + MCP Governance + HITL + DLP là 4 trụ cột chuẩn cho Enterprise AI Control Plane), nhưng **còn rời rạc khỏi kiến trúc CVF hiện có**, **thiếu ràng buộc governance**, và **đang phát minh lại nhiều thứ đã tồn tại**. Cần tái neo (re-anchor) vào CVF canon trước khi build.

---

## 1. Những điểm phản biện nghiêm túc

### 1.1. Xung đột/trùng lặp với cấu trúc RBAC hiện hữu (quan trọng nhất)

**Roadmap nói:** "Bổ sung thuộc tính `role: 'admin' | 'user'` vào hệ thống Authen."

**Thực tế repo:** `EXTENSIONS/CVF_GUARD_CONTRACT/src/enterprise/enterprise.ts:26` đã định nghĩa 5 role:
```ts
export type TeamRole = 'owner' | 'admin' | 'developer' | 'reviewer' | 'viewer';
```
Và `src/auth.ts:32-46` đã mock đủ 4 role này trong NextAuth.

→ **Đề xuất `admin | user` là một bước lùi**, sẽ phá vỡ `phase-gate.guard.ts` và `risk-gate.guard.ts` vốn đang dùng `TeamRole`. Phải giữ nguyên 5-role model, chỉ cần thêm middleware check `role in {owner, admin}` cho `/admin/*`.

---

### 1.2. Trùng lặp với `/approvals` đã tồn tại

**Roadmap 3.3 (HITL Queue)** mô tả y hệt những gì `src/app/approvals/page.tsx` đã làm (pending/approved/rejected, payload view, approve/reject với reason).

→ Không nên tạo HITL Queue mới. Phải là **kế thừa và mở rộng** `/approvals` (thêm tool-payload view, MCP tool binding, timeout policy). Nếu không, sẽ có 2 hàng đợi phê duyệt song song — một anti-pattern.

---

### 1.3. Middleware hiện tại không có khái niệm route-level RBAC

`middleware.ts` hiện chỉ check `req.auth` (authenticated/not). **Chưa đọc `token.role`** để filter route. Đồng thời `src/app/admin/team/page.tsx` đã tồn tại nhưng **không có rào chắn role nào**.

→ Đây chính là **lỗ hổng security hiện tại** mà roadmap nên khai báo rõ là "P0 bugfix", không phải "Phase 1 mới". Bất kỳ developer/viewer nào gõ `/admin/team` cũng vào được.

---

### 1.4. "403 hoặc redirect" — phải chọn một, và có lý do

Roadmap viết "reject 403 hoặc redirect về trang chủ". **Ngữ nghĩa khác nhau hoàn toàn:**
- `403` → xác nhận route tồn tại (rò rỉ thông tin kiến trúc cho attacker do trinh sát).
- `redirect` → tàng hình hoá admin surface (khuyến nghị cho enterprise).

→ Phải **chốt là redirect + log silent audit event**, không để "hoặc". Đây là quyết định CISO-level chứ không phải detail UI.

---

### 1.5. FinOps Dashboard thiếu data source ground truth

Roadmap 2.1/2.2 giả định có sẵn số liệu "token đốt theo user/phòng ban/skill". **Nhưng repo chưa có:**
- Token accounting ledger
- User/department mapping
- Skill/template cost attribution

→ Cần thêm một **Phase 0 (hoặc 2.0)**: *Cost Telemetry Pipeline* — define schema, emit từ `execute/route.ts`, persist vào ledger. Không có telemetry thì dashboard chỉ là mock data.

---

### 1.6. Quota Engine "auto-suspend" là R3 hành động, chưa có governance binding

"Hệ thống sẽ auto-suspend quyền gọi LLM của phòng ban" là hành động ở **risk tier R2/R3** (cắt quyền production user). Theo CVF canon:
- Phải qua **GC-018 (Continuation Governance)** stopping rules
- Phải có **reversible action** + audit trail
- Nên có **grace period / soft-cap notification trước khi hard-cap**

→ Roadmap hiện chỉ nói "auto-suspend", không nói rollback path, không nói notification protocol. Đây là điểm CFO sẽ thích nhưng CISO sẽ phản đối.

---

### 1.7. DLP Regex — Redaction phía client hay server?

Roadmap 4.1 không nói rõ **điểm chặn**:
- Nếu redact ở client → bypass được bằng cách gọi API trực tiếp.
- Nếu redact ở server middleware → phải đi qua **execute route** có đã tồn tại (`src/app/api/execute/route.ts`).

→ Bắt buộc phải là **server-side egress filter**, áp trong `api/execute/route.ts` trước khi gửi LLM provider. Regex-based redaction cũng **không đủ an toàn** cho production — nên đề xuất Presidio-style NER hoặc layered (regex → NER → allowlist).

---

### 1.8. Thiếu ràng buộc tới File Size Guard (GC-023) và Canon

Tất cả các trang mới (`/admin/finops`, `/admin/mcp-tools`, `/admin/audit-logs`) đều là governed frontend file → phải tuân GC-023. Roadmap không đề cập:
- Thresholds mỗi trang (khuyến nghị chia sớm thành component-per-section)
- Exception registry entry nếu vượt
- Test coverage gate (Phase 4 tuần cuối mới nói đến giao diện, không nói tests)

---

### 1.9. Timeline "4 tuần" là unrealistic cho scope này

- Phase 2 (FinOps) một mình đã cần: telemetry pipeline + DB schema + aggregation job + 3 dashboard + quota engine + suspension workflow → **tối thiểu 3–4 tuần**.
- Phase 3 (MCP Tool Registry + Audit Log + HITL) là **nguyên một module** cỡ `CVF_v1.7.3` (Adapter Hub).

→ Khuyến nghị giãn lên **8–10 tuần** hoặc **deliver MVP từng trụ cột** (Admin skeleton → FinOps read-only → Audit log read-only → Tool registry → Quota → HITL → DLP). Đừng deliver theo Phase 1-2-3-4 tuyến tính.

---

## 2. Những điểm vắng mặt (bổ sung)

### 2.1. Thiếu binding tới Canon Truth & Control Matrix

Mọi module CVF mới phải khai báo mapping vào `CVF_GOVERNANCE_CONTROL_MATRIX.md`. Roadmap không mention GC nào.

**Đề xuất mapping:**
| Module | GC Binding |
|---|---|
| FinOps | GC mới: GC-FinOps-Accounting |
| Tool Registry | GC-018 (Continuation) + new GC-MCP-Authorization |
| Audit Logs | GC-022 (Memory Classification — logs là FULL class) |
| HITL | GC-018 + GC-021 (Fast Lane exclusion cho R3) |
| DLP | new GC-Egress-Filter |

---

### 2.2. Thiếu Immutability & Tamper-evidence cho Audit Logs

"Bể chứa Log không thể xoá" cần cụ thể:
- Append-only storage (WORM, Postgres + delete trigger block, hay event-sourcing)
- Hash chain (mỗi record hash block trước → detect tampering)
- Retention policy (legal/compliance): 1 năm? 7 năm?
- Export CSV phải có **digital signature** để đảm bảo evidence integrity

---

### 2.3. Thiếu Break-Glass (Emergency Admin) procedure

Nếu Admin bị khoá tài khoản (MFA fail), ai là người vào được? Enterprise Control Plane luôn phải có **break-glass account** + procedure được audit riêng.

---

### 2.4. Thiếu SIEM/SOAR integration path

Real-time Audit Log phải export ra được Splunk/Elastic/Sentinel qua syslog hoặc webhook. Đừng xây silo.

---

### 2.5. Thiếu đề cập Multi-tenancy / Organization boundary

"Phòng ban" trong roadmap chưa có data model. Cần `Organization → Team → User` hierarchy. Enterprise thật sẽ có nhiều tenant.

---

### 2.6. Thiếu GDPR / Data Residency

DLP là egress filter, nhưng còn **Data Residency** (prompt/response lưu ở đâu? EU/US?) và **Right to be Forgotten** cho audit logs (xung đột với immutability — phải giải quyết).

---

### 2.7. Thiếu Admin Impersonation / "View as User"

CFO/CISO cần debug vấn đề của user → cần "view as" với chữ ký audit event riêng. Thiếu hoàn toàn.

---

### 2.8. Thiếu liên kết với OperatingModel / Doctrine

Roadmap không dẫn chiếu `ECOSYSTEM/operating-model/` hoặc `ECOSYSTEM/doctrine/`. Bất kỳ Enterprise module nào cũng phải check xem có conflict với doctrine FROZEN không.

---

## 3. Đề xuất tái cấu trúc roadmap

Thay vì Phase 1-2-3-4 theo tuần, đề xuất **cấu trúc stacked**:

```
Phase 0 (P0 bugfix — 2 ngày)
  └── Fix /admin/* hole trong middleware.ts hiện tại
      (đọc token.role, reject non-admin, log silent)

Phase A (Telemetry Foundation — 1 tuần)
  └── Cost ledger schema + emit từ execute route
  └── Audit event schema (append-only, hash-chained)
  └── Organization/Team/User hierarchy

Phase B (Read-only Admin Surface — 2 tuần)
  └── FinOps Dashboard (chỉ đọc telemetry)
  └── Audit Log viewer (chỉ đọc ledger)
  └── Tool Registry Inventory (chỉ đọc, không toggle)

Phase C (Control Plane Actions — 3 tuần)
  └── Quota Engine + Soft/Hard cap với rollback path
  └── Tool Registry whitelist/blacklist + Role binding
  └── HITL mở rộng từ /approvals (không build mới)

Phase D (Egress Safety — 2 tuần)
  └── DLP Redaction tại api/execute/route.ts (server-side)
  └── RAG Knowledge Partitioning với tenant model

Phase E (Enterprise Hardening — 1 tuần)
  └── Break-glass procedure
  └── SIEM webhook export
  └── Signed CSV export
  └── GC mapping + Control Matrix update
```

**Tổng: ~9–10 tuần** (so với 4 tuần trong roadmap gốc)

---

## 4. Kết luận

| Khía cạnh | Đánh giá |
|---|---|
| Tầm nhìn chiến lược | ✅ Đúng (4 trụ cột chuẩn Enterprise AI) |
| Độ chín (maturity) | ⚠️ Thiếu — đang ở tầm ý tưởng, chưa phải spec |
| Neo vào CVF canon | ❌ Gần như không có |
| Nhận diện rủi ro | ⚠️ Chỉ nhận diện security boundary, bỏ sót immutability, break-glass, egress path |
| Timeline | ❌ Không thực tế (4 tuần quá gắt) |
| Xung đột với code hiện có | ⚠️ Có 3 điểm (role model, /approvals, middleware) |

**Khuyến nghị:** Cần một **pre-revision cycle**: re-anchor vào `CVF_GOVERNANCE_CONTROL_MATRIX.md`, `enterprise.ts`, `middleware.ts`, `approvals/page.tsx` trước khi ký phê duyệt. Đồng thời, **P0 fix** lỗ hổng `/admin/team` không check role **phải tách ra làm hotfix ngay**, không chờ Phase 1.
