# CVF Enterprise Admin Console Roadmap — V2 (Final)
*Date: 2026-04-17 | Supersedes: `CVF_ENTERPRISE_ADMIN_ROADMAP_2026-04-18.md`*
*Status: APPROVED FOR BUILD — pending Phase 0 hotfix gate*
Memory class: SUMMARY_RECORD

> **Mục tiêu:** Xây dựng Admin Control Plane cho Owner/Admin (CFO, CISO, System Architect) dựa trên **kiến trúc CVF hiện hữu**, không tái phát minh infrastructure đã có.
>
> **Nguyên tắc thiết kế:** (1) Reuse trước khi build mới. (2) Read-only trước khi write-action. (3) Mọi write-action R2/R3 phải có rollback path. (4) Mọi phase phải khai báo GC binding trước khi bắt đầu.

---

## Tiền đề: Kiến trúc hiện hữu cần kế thừa

Trước khi build, phải nắm rõ 4 thành phần đã tồn tại:

| Thành phần | Path | Trạng thái |
|---|---|---|
| 5-role RBAC model | `EXTENSIONS/CVF_GUARD_CONTRACT/src/enterprise/enterprise.ts:26` | ACTIVE — `owner\|admin\|developer\|reviewer\|viewer` |
| Auth mock + JWT role | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/auth.ts:31-55` | ACTIVE — role đã gắn vào JWT token |
| Middleware (auth-only, chưa có RBAC) | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/middleware.ts:21` | **GAP — chỉ check `req.auth`, không check `token.role`** |
| Approvals/HITL UI | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/approvals/page.tsx:50` | ACTIVE — pending/history/approve/reject đã có |
| Guard audit log (in-memory) | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/guards/audit-log/route.ts:22` | ACTIVE — in-memory, chưa persist |
| Governance ledger (persistent) | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/ledger/route.ts:31` | ACTIVE — persistent qua `governanceLedger()` |
| Execute path (prompt build + safety) | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts:123-127` | ACTIVE — `buildPromptFromInputs` → `applySafetyFilters` → provider |

---

## Phase 0 — Hotfix: Route-level RBAC (2–3 ngày)

**GC Binding:** GC-018 (action là R1, reversible)
**Lý do tách riêng:** Đây là **lỗ hổng security P0 đang tồn tại** — bất kỳ `developer/reviewer/viewer` nào gõ `/admin/team` cũng vào được vì `middleware.ts` không đọc `token.role`.

### Deliverables

- **0.1. Middleware role-check:** Sửa `middleware.ts` — đọc `token.role` từ JWT, chặn `/admin/*` nếu role không thuộc `{owner, admin}`. Hành vi khi bị chặn: **redirect về `/` + emit silent audit event** (không dùng 403 — tránh rò rỉ topology).
- **0.2. Admin Sidebar ẩn theo role:** Sửa `Sidebar.tsx` — chỉ render menu `/admin/*` nếu `session.user.role in {owner, admin}`.
- **0.3. Tests:** Unit test middleware với mọi 5 role. E2E test: `developer` gõ `/admin/team` → redirect, không trả 403.

### Acceptance Gate
`npm run test` + `npm run test:e2e` all pass. Không có regression trên các route hiện hữu.

---

## Phase A — Telemetry Foundation (1 tuần)

**GC Binding:** GC-022 (audit records = FULL class), GC-023 (file size check trước khi thêm code)

**Mục tiêu:** Xây data foundation cho FinOps và Audit Viewer. Không có phase này thì Phase B chỉ là mock data.

### Deliverables

- **A.1. Organization/Team/User hierarchy:** Định nghĩa schema `Organization → Team → User` trong `cvf-guard-contract/enterprise`. Mỗi `User` thuộc một `Team`, mỗi `Team` thuộc một `Organization`. Đây là anchor cho cost attribution và RAG partitioning sau.
- **A.2. Cost ledger schema:** Định nghĩa `CostEvent { userId, teamId, orgId, skillId, templateId, provider, inputTokens, outputTokens, estimatedCostUSD, timestamp }`. Emit một event sau mỗi successful call tại `execute/route.ts:387` (trước `return NextResponse.json`).
- **A.3. Audit event schema (unified):** Hợp nhất `guards/audit-log` (in-memory) và `governance/ledger` (persistent) thành một `UnifiedAuditEvent { eventType, actorId, actorRole, targetResource, action, riskLevel, phase, outcome, payload?, timestamp }`. **Không xây ledger mới** — extend `governanceLedger()` để nhận thêm event type này.
- **A.4. Cost ledger persistence:** Persist `CostEvent` vào `governanceLedger` (append-only, reuse infrastructure). Không cần DB riêng ở giai đoạn này.

### Constraints
- Mỗi file mới phải check GC-023 threshold trước khi tạo.
- `enterprise.ts` hiện hữu có thể vượt threshold nếu thêm schema — tách sang `enterprise-org.ts` nếu cần.

---

## Phase B — Read-only Admin Surface (1–2 tuần)

**GC Binding:** GC-023 (mỗi page component ≤ threshold, tách sớm)

**Nguyên tắc:** Chỉ đọc data — không có write action nào trong phase này. Validate data pipeline trước khi expose control.

### Deliverables

- **B.1. Admin layout + navigation:** Tạo `src/app/admin/layout.tsx` với Admin Sidebar riêng biệt. Menu: `FinOps`, `Audit Log`, `Tool Registry`, `Approvals` (link tới `/approvals` hiện có). Layout tự động check role từ server session — không render nếu không phải `{owner, admin}`.
- **B.2. FinOps Dashboard (read-only):** Trang `/admin/finops`. Biểu đồ: tổng chi phí theo ngày/tuần/tháng. Bảng breakdown: top users/teams/skills theo cost. **Data source:** `CostEvent` ledger từ Phase A. Không có quota control ở phase này.
- **B.3. Audit Log Viewer:** Trang `/admin/audit-log`. **Reuse `governance/ledger/route.ts` và `guards/audit-log/route.ts`** — chỉ build UI viewer, không build backend mới. Hiển thị: actor, action, risk level, phase, outcome, timestamp. Filter theo date range, actor, risk level. Export CSV (unsigned ở phase này, signed CSV ở Phase D2).
- **B.4. Tool Registry Inventory (read-only):** Trang `/admin/tool-registry`. Liệt kê toàn bộ MCP tools đang đăng ký, trạng thái enabled/disabled, role nào đang được dùng. **Chỉ đọc** — không có toggle ở phase này.
- **B.5. HITL/Approvals entry point:** Không tạo queue mới. Thêm link `/admin/approvals` → redirect tới `/approvals` hiện hữu. Phase C sẽ mở rộng surface đó.

### Constraints
- Mỗi trang `/admin/*` phải có server-side role check (không chỉ dựa vào middleware).
- Mỗi component lớn phải tách file riêng (FinOpsChart, CostBreakdownTable, AuditLogTable...).

---

## Phase C — Control Plane Actions (2–3 tuần)

**GC Binding:** GC-018 (mọi write-action R2/R3 phải qua stopping rules + rollback path)

**Nguyên tắc:** Mọi action có thể affect user/team phải có: (1) preview trước khi apply, (2) rollback path, (3) audit event emit.

### Deliverables

- **C.1. Quota Engine — Soft Cap:** Trang `/admin/finops` thêm phần "Quota Rules". Admin set soft cap per team (e.g., "$100/tháng cho Marketing"). Khi chạm soft cap: gửi notification email/in-app tới team lead + Admin, **không suspend**. State lưu vào `governanceLedger` dưới dạng `QuotaPolicy` event.
- **C.2. Quota Engine — Hard Cap + Rollback:** Khi chạm hard cap: `execute/route.ts` check `QuotaPolicy` trước khi gọi provider — nếu exceeded, trả `429 Quota Exceeded`. Admin có thể "Grant Emergency Override" từ `/admin/finops` — tạo `QuotaOverride` event với TTL 24h và reason bắt buộc. Rollback: xóa `QuotaOverride` event.
- **C.3. Tool Registry — Whitelist/Blacklist per Role:** `/admin/tool-registry` thêm toggle per tool per role. Thay đổi lưu vào `ToolPolicy` event trong ledger. `guards/phase-gate.guard.ts` và `guards/risk-gate.guard.ts` đọc `ToolPolicy` tại runtime để enforce.
- **C.4. HITL/Approvals — Mở rộng `/approvals`:** Không tạo queue mới. Thêm vào `approvals/page.tsx`: (a) hiển thị full tool payload cho R3 requests, (b) timeout auto-reject sau 24h với audit event, (c) filter theo tool name + risk level. Admin menu `/admin/approvals` redirect tới `/approvals` với pre-filter `riskLevel=R3`.

### Constraints
- Mọi write action (quota set, tool toggle, override grant) phải emit `UnifiedAuditEvent` từ Phase A.
- `applySafetyFilters` ở `execute/route.ts:127` có thể cần extend thêm quota check — nếu file vượt GC-023 threshold, tách quota check sang `lib/quota-guard.ts`.

---

## Phase D1 — Egress Safety (1.5 tuần)

**GC Binding:** GC mới cần khai báo: `GC-Egress-Filter` (server-side, không bypass-able)

### Deliverables

- **D1.1. DLP Redaction — Server-side Egress Filter:** Implement `lib/dlp-filter.ts` — nhận `string`, trả `{ redacted: string, matches: DLPMatch[] }`. Áp dụng tại `execute/route.ts:124` (sau `buildPromptFromInputs`, trước `applySafetyFilters`). **Không đặt ở middleware** — prompt chỉ tồn tại trong execute path.
- **D1.2. DLP Admin Panel:** Trang `/admin/dlp`. Admin khai báo regex patterns (preset: credit card, API key, email, CCCD). UI preview: paste text → xem masked output. Patterns lưu vào `DLPPolicy` event trong ledger.
- **D1.3. RAG Knowledge Partitioning:** Restrict RAG context theo `orgId/teamId` của user đang thực thi. `execute/route.ts` khi query knowledge base, thêm filter `{ orgId: session.user.orgId }`. Admin có thể set override policy per team từ `/admin/tool-registry`.

### Constraints
- DLP filter phải là server-side, không expose pattern list ra client.
- `execute/route.ts` nếu vượt GC-023 threshold sau khi thêm DLP + quota check → tách egress concern sang `lib/egress-pipeline.ts`.

---

## Phase D2 — Enterprise Hardening (1 tuần)

**GC Binding:** GC-018 (break-glass là R3 action), GC-022 (audit records must be FULL class)

### Deliverables

- **D2.1. SIEM Webhook Export:** Config `/admin/audit-log` → "Export to SIEM". Emit `UnifiedAuditEvent` stream ra webhook URL (format: JSON-over-HTTPS, compatible với Splunk HEC / Elastic ingest). Admin cấu hình webhook URL + secret header trong `/admin/settings`.
- **D2.2. Signed CSV Export:** Audit log export CSV phải kèm HMAC-SHA256 signature (key = `CVF_AUDIT_SIGNING_KEY` env var). Verifier script cung cấp riêng cho CISO.
- **D2.3. Break-glass Procedure:** Khai báo document `docs/guides/CVF_BREAK_GLASS_PROCEDURE.md`. Trong hệ thống: `CVF_BREAK_GLASS_TOKEN` env var cho phép bypass session auth một lần duy nhất. Mỗi lần dùng tự động emit `BreakGlassUsed` audit event + notify toàn bộ Owner qua email. Token rotate sau mỗi lần dùng.
- **D2.4. Admin Impersonation / "View as User":** `/admin` thêm "View as" input (chỉ Owner mới dùng được, không phải Admin). Khi active: session vẫn là Owner nhưng UI render như user được chọn. Mọi action trong mode này emit `ImpersonationEvent` audit event riêng.

---

## Cross-cutting Requirements (áp dụng mọi phase)

| Yêu cầu | Chi tiết |
|---|---|
| **GC-023 pre-flight** | Trước khi thêm code vào bất kỳ file có governed: check line count + exception registry |
| **Test gate** | Mỗi phase phải pass `npm run test` + `npm run lint` (max-warnings=0) trước khi merge |
| **Evidence class** | Mọi audit record emit phải khai báo class theo GC-022: FULL / SUMMARY / POINTER |
| **GC-018 declaration** | Mọi write-action R2+ phải có GC-018 stopping rule doc trước khi deploy |
| **Role model frozen** | `TeamRole = 'owner' \| 'admin' \| 'developer' \| 'reviewer' \| 'viewer'` không được thay đổi |
| **No new queues** | HITL không tạo queue mới — luôn extend `/approvals` |
| **No new ledgers** | Audit/Cost persistence luôn qua `governanceLedger()` — không tạo DB schema mới |

---

## Timeline tổng hợp

```
Tuần 1          : Phase 0 (2-3 ngày) + Phase A bắt đầu
Tuần 1-2        : Phase A (Telemetry Foundation)
Tuần 2-4        : Phase B (Read-only Admin Surface)
Tuần 4-7        : Phase C (Control Plane Actions)
Tuần 7-8.5      : Phase D1 (Egress Safety)
Tuần 8.5-9.5    : Phase D2 (Enterprise Hardening)
```

**Tổng: ~9.5 tuần** (so với 4 tuần trong roadmap gốc V1 — scope thực tế gấp 2.5x).

---

## Governance Audit Trail

| Tài liệu | Path |
|---|---|
| Roadmap gốc (V1) | `docs/roadmaps/CVF_ENTERPRISE_ADMIN_ROADMAP_2026-04-18.md` |
| Phản biện độc lập | `docs/reviews/CVF_ENTERPRISE_ADMIN_ROADMAP_CRITICAL_REVIEW_2026-04-17.md` |
| Roadmap cuối (V2, file này) | `docs/roadmaps/CVF_ENTERPRISE_ADMIN_ROADMAP_V2_2026-04-17.md` |
