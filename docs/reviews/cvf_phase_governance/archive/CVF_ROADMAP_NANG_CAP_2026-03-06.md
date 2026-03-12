# 🗺️ ROADMAP NÂNG CẤP CVF — Dựa Trên 5 Bản Đánh Giá

> **Developed by Tien - Tan Thuan Port@2026**  
> **Ngày lập:** 2026-03-06  
> **Trạng thái:** CHƯA PUSH GITHUB — Chờ lệnh từ Author  
> **Nguồn tổng hợp:** 5 files trong `De_xuat/Review/` + `docs/assessments/CVF_INDEPENDENT_TESTER_ASSESSMENT_2026-03-06.md`

> **Update 2026-03-07:** Docs governance gate for `docs/**/*.md` is now local-ready, but remains **deferred for push** and is **not the top execution priority** versus independent-assessment remediation items.

---

## I. BẢN SO SÁNH 3 ĐÁNH GIÁ ĐỘC LẬP

> Mục đích: cơ sở khách quan để ra quyết định, tránh ý kiến chủ quan.

| Tiêu chí | 🔵 Antigravity Self-Audit | 🟠 Independent Reviewer | 🟡 Decision Matrix |
|---|---|---|---|
| **Verdict tổng** | GO — 2 giai đoạn | GO with staged scope | Near-term: 01-07, 11p, 12p |
| **GĐ1 scope** | De_xuat 01-07 + 11p/12p | Track A: hardening | P0/P1: 02, 06, 07, 04, 05, 01 |
| **GĐ2 scope** | branch cvf-next → v3.0 | Track B: major-version gate | IMPLEMENT-LATER: 03, 08, 09, 13 |
| **De_xuat 10** | MAJOR (v3.0 riêng) | major-version gate | **HOLD** — ADR required |
| **Code drift risk** | Chưa đề cập | ⚠️ HIGH RISK | ⚠️ High |
| **Source of truth** | EXTENSIONS/ | EXTENSIONS/ (rõ ràng) | EXTENSIONS/ |
| **Gating policy** | requestId + trace | requestId + trace | requestId + trace + compat check |

### Điểm đồng thuận tuyệt đối (3/3 đánh giá):
1. ✅ **Phải chia 2 tracks** — không thực hiện 1 lần
2. ✅ **De_xuat 01-07** = thực hiện trước
3. ✅ **De_xuat 10** = không được nhét vào v1.1.x, cần major-version gate
4. ✅ **Source of truth = `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/`** — không dùng proposal folder
5. ✅ **Mọi upgrade phải có requestId + trace batch**

### Điểm bổ sung từ Independent Reviewer (chưa có trong self-audit):
> **⚠️ CODE DRIFT RISK cao:** Folder `CVF_Phase Governance Protocol/governance/` là phiên bản cũ (pre-fix). Nếu nhầm source khi tích hợp GĐ1 → regression.  
> **→ Quy tắc bắt buộc:** Mọi thay đổi GĐ1 phải apply vào `EXTENSIONS/CVF_v1.1.1_PATH.../`, không phải proposal folder.

---

## II. ROADMAP NÂNG CẤP

### 🔴 GIAI ĐOẠN 1 — `v1.1.2 Phase Governance Hardening`

**Version:** v1.1.2  
**Branch:** trực tiếp trên `main`  
**Source:** `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/`  
**Ưu tiên:** Bắt đầu sớm nhất

| Bước | De_xuat | Nội dung | Priority | Effort | File target |
|---|---|---|---|---|---|
| 1 | 02 | **Pipeline Execution Order** — fixed pipeline const | P0 | S | `gate.rules.ts` |
| 2 | 06 | **Trust Boundary** — artifact hash verify trước governance | P0 | L | `artifact.registry.ts` |
| 3 | 06 | **Hash Ledger** — SHA256 per artifact, detect silent rewrite | P0 | L | `governance.audit.log.ts` |
| 4 | 07 | **Capability Isolation** — phase capabilities map | P0 | M | `phase.protocol.ts` |
| 5 | 04 | **Self-Debugging** — anomaly detection, dead path, loop trap | P1 | M | `execution.trace.ts` |
| 6 | 05 | **System Invariants** — cross-state invariant check | P1 | M | `scenario.generator.ts` |
| 7 | 01 | **Governance Executor** — runtime pipeline orchestrator | P1 | M | `runtime/governance.executor.ts` (FILE MỚI ngoài /governance) |
| 8 | 11p | **Evolution Governance rules** — Core/Verification/Observability split | P1 | S | KB + README |
| 9 | 12p | **5 Design Invariants** — framework governance rules | P1 | S | KB + docs |

**Gates bắt buộc trước khi merge:**
```
□ requestId mới + trace batch mới
□ npm run check (toàn bộ extension)
□ npm run test:coverage (≥ threshold 90/80/90/90)
□ python governance/compat/check_bug_doc_compat.py --enforce
□ python governance/compat/check_test_doc_compat.py --enforce
□ python governance/compat/check_docs_governance_compat.py --enforce (nếu batch có đổi docs)
□ ADR-015 được tạo
□ CHANGELOG.md cập nhật
```

---

### 🟡 GIAI ĐOẠN 2 — Branch `cvf-next` → merge `v3.0`

**Version:** v3.0 (MAJOR — thêm Layer 0 Foundation Primitives)  
**Branch:** `cvf-next` tách từ `main` sau khi GĐ1 ổn định  
**Điều kiện kích hoạt:** GĐ1 merge xong + ADR-016 được approve

| Bước | De_xuat | Nội dung | Priority | Effort |
|---|---|---|---|---|
| 1 | 10p | **AI-COMMIT SPEC** — schema + parser + validator | P1 | L |
| 2 | 08p | **Artifact Staging** — candidate → governance → accepted | P1 | M |
| 3 | 08p | **Artifact Ledger** — version tracking + hash + lineage | P1 | M |
| 4 | 09p | **Process Model** — phase transition rules formal | P2 | L |
| 5 | 11 | **3+1 Primitives** — Commit + Artifact + Process + Staging | P1 | M |
| 6 | 12 | **CVF Core vs Full** — formal identity definition | P1 | S |
| 7 | WP | **Whitepaper** — Git for AI Development | P2 | S |
| 8 | 13 | **Architecture Map** — entry point document | P3 | S |
| 9 | docs | **Adoption Strategy** — 5-phase deployment | P2 | S |
| 10 | docs | **Skill Lifecycle** — 6-state formal model | P2 | S |
| 11 | 03 | **Multi-State-System Governance** | P2 | L |
| 12 | 08p | **Resource Governance + System Recovery** | P2 | L |
| 13 | 09p | **Phase-Bound Branch Model** | P2 | L |

**HOLD (chờ ADR + versioning decision):**
- De_xuat 10 (AI-COMMIT SPEC) — core identity change, không tự ý làm

**Gates bắt buộc trước khi merge về main (v3.0):**
```
□ ADR-016 approved (major version gate)
□ Tất cả 3+1 Primitives tested
□ CVF Core vs CVF Full boundary documented
□ Backward compatibility statement
□ python governance/compat/check_docs_governance_compat.py --enforce (nếu batch có đổi docs)
□ Whitepaper reviewed
□ VERSIONING.md updated (v3.0)
□ KB updated (Layer 0 added)
```

---

## III. BẢN ĐỒ PHỤ THUỘC

```
02 Pipeline Order ─────────────────────────── P0 (foundation)
       │
       ├── 06 Trust Boundary + Hash Ledger ── P0 (security)
       ├── 07 Capability Isolation ─────────── P0 (phase boundary)
       ├── 04 Self-Debugging ────────────────── P1
       ├── 05 System Invariants ─────────────── P1
       └── 01 Governance Executor ──────────── P1 (cần 02 trước)

                    ↓ GĐ1 complete
       
10 AI-COMMIT SPEC (HOLD) ─── cần ADR-016
       │
       ├── 08 Artifact Staging + Ledger
       ├── 09 Phase-Bound Branch
       ├── 11 3+1 Primitives ← phụ thuộc 10
       └── 12 CVF Core vs Full ← phụ thuộc 11
                    │
                    └── 13 Architecture Map (sau cùng)
```

---

## IV. CẢNH BÁO QUAN TRỌNG

> [!WARNING]
> **CODE DRIFT:** Folder `CVF_Phase Governance Protocol/governance/` là **PROPOSAL WORKSPACE** — không phải active source. Không được dùng làm source khi implement GĐ1.
>
> **Active source:** `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/`

> [!IMPORTANT]
> **GITHUB:** Chưa push bất kỳ thay đổi nào lên GitHub. Tất cả commits hiện tại là LOCAL. Chờ lệnh từ Author trước khi push.

---

## V. TRẠNG THÁI HIỆN TẠI

| Hạng mục | Trạng thái |
|---|---|
| CVF v1.1.1 (Layer 1.5) | ✅ Locally committed — chưa push |
| CVF Baseline (9 modules) | ✅ Frozen + All tests PASS |
| 3 LR risks (LR-001/002/003) | ✅ CLOSED |
| 5 Layer 1.5 findings | ✅ FIXED + verified |
| GĐ1 v1.1.2 | ⬜ Chưa bắt đầu |
| GĐ2 cvf-next | ⬜ Chưa bắt đầu |
| ADR-015 (v1.1.2) | ⬜ Chưa tạo |
| ADR-016 (v3.0 gate) | ⬜ Chưa tạo |
| Docs governance gate (`docs/**/*.md`) | ✅ Local-ready, chưa push |

## VI. ƯU TIÊN THỰC THI NGẮN HẠN (Updated 2026-03-07)

1. Ưu tiên số 1: fix các vấn đề/weakness đã được independent assessment chỉ ra.
2. Ưu tiên số 2: giữ baseline, trace, compat evidence sạch và nhất quán trong local.
3. Ưu tiên số 3: chỉ sau đó mới mở rộng governance enforcement Phase 2A sang `governance/toolkit/`.
