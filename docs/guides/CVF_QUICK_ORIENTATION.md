# CVF Quick Orientation — Hiểu CVF trong 15 phút

> **Mục đích:** Một trang duy nhất giúp người mới hiểu CVF là gì, dùng như thế nào, và đi đâu tiếp.
> **Thời gian đọc:** ~15 phút
> **Cập nhật:** 2026-03-08 (RC nav added 2026-04-21)
>
> **Trạng thái hiện tại (2026-04-21):** CVF đã đạt Release Candidate. Các mốc lớn đã đóng:
> non-coder value proven · Alibaba CERTIFIED · DeepSeek CERTIFIED · provider UX delivered · front-door product proof passed.
> Xem: [RC Truth Packet](../reference/CVF_RELEASE_CANDIDATE_TRUTH_PACKET_2026-04-21.md) · [Demo Script](CVF_DEMO_SCRIPT_2026-04-21.md) · [Known Limitations](../reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md)

---

## Phần 1 — CVF Là Gì? (5 phút)

### Một câu tóm tắt

**CVF (Controlled Vibe Framework)** là bộ quy tắc kiểm soát quá trình phát triển phần mềm khi có AI tham gia. Nó đảm bảo **con người kiểm soát chất lượng**, còn **AI thực thi theo khuôn khổ**.

### CVF IS / IS NOT

| CVF **là** | CVF **không phải** |
|---|---|
| Bộ quy tắc + quy trình | Một AI model hay AI tool |
| Framework quản trị phát triển | SDK hay code library |
| Cộng tác Human + AI | Tự động hóa hoàn toàn |
| Hoạt động với mọi AI (Claude, GPT, Gemini...) | Gắn riêng với một AI nào |

### 5-Phase Controlled Loop — Trái tim của CVF

```
Phase A: Intake     → Làm rõ yêu cầu, scope, assumptions
Phase B: Design     → Chốt hướng đi và kế hoạch
Phase C: Build      → AI thực thi trong phạm vi đã duyệt
Phase D: Review     → Kiểm tra kết quả và acceptance
Phase E: Freeze     → Chốt trạng thái cuối và khóa phạm vi
```

**Quy tắc cứng:** Không skip phase, không merge phase. Con người luôn là authority cuối cùng.

### Risk Model R0–R3

| Level | Tên | Ý nghĩa | Kiểm soát bắt buộc |
|---|---|---|---|
| R0 | Passive | Chỉ đọc/phân tích | Logging |
| R1 | Controlled | Thay đổi nhỏ, single file | Logging + Scope Guard |
| R2 | Elevated | Có quyền, có thể chain | + Approval + Audit |
| R3 | Critical | Thay đổi hệ thống | + Hard Gate + Human-in-the-loop |

---

## Phần 2 — Dùng CVF Như Thế Nào? (5 phút)

### Nếu bạn muốn *dùng CVF cho project của mình* (Downstream User)

1. **Clone CVF** làm tầng kiểm soát (đặt cùng workspace, dùng tên có dấu `.` để ưu tiên):
   ```
   D:\MyWorkspace\
   ├── .Controlled-Vibe-Framework-CVF/   ← CVF (governance layer)
   ├── MyApp/                             ← Project của bạn
   └── AnotherApp/                        ← Project khác
   ```

2. **Cho AI đọc CVF rules** khi bắt đầu phiên làm việc — AI sẽ tự tuân thủ 5-phase controlled loop, risk model, governance guards.

3. **Dùng Skill Library** (141 skills, 12 domains) — chọn skill phù hợp trước khi code.

4. **Tuân thủ Workspace Isolation** — không phát triển project trong CVF root.

### Nếu bạn muốn *đóng góp vào CVF* (Contributor)

1. Đọc `docs/CVF_CORE_KNOWLEDGE_BASE.md` — đây là bản đồ kiến trúc chính thức.
2. Hoàn thành **9 câu hỏi Architecture Check** (Section XII trong KB) trước khi propose.
3. Tuân thủ **11 nguyên tắc bất biến** (Section XI trong KB).
4. Mọi quyết định kiến trúc → viết ADR trong `docs/CVF_ARCHITECTURE_DECISIONS.md`.

### Nếu bạn muốn *đánh giá CVF* (Reviewer/Auditor)

1. Bắt đầu từ `docs/reviews/cvf_phase_governance/CVF_EXECUTIVE_REVIEW_BASELINE_2026-03-06.md`
2. Xem conformance: 84 scenarios PASS, release-grade gate, golden baseline
3. Xem evidence: `docs/assessments/` chứa các bản đánh giá độc lập

---

## Phần 3 — Phase Status Dashboard (2 phút)

Quick glance vào trạng thái hệ thống hiện tại:

| Phase | Mục tiêu | Trạng thái | Ý nghĩa |
|---|---|---|---|
| Phase 0 | Baseline freeze | ✅ Done | Mốc đối soát đã ổn |
| Phase 1 | Unified control plane | 🟡 Mostly done | Có nhưng chưa toàn hệ |
| Phase 2 | E2E conformance | 🟡 Strong baseline | 84/84 PASS, chưa full gate |
| Phase 3 | Skill governance | 🟡 Mostly done | Runtime blocking hoạt động |
| Phase 4 | Durable execution | 🟡 Mostly done | Rollback/replay/recovery có |
| Phase 5 | Release discipline | ✅ Done | Manifest/inventory/matrix rõ |
| Phase 6 | Enterprise evidence | 🟡 Depth-frozen | 4 postures, 8 families, đủ dùng |

---

## Phần 4 — Đi Đâu Tiếp? (3 phút)

| Bạn muốn gì? | Đọc gì? |
|---|---|
| Hiểu cấu trúc repo đúng và nhanh | [`CVF_PUBLIC_STRUCTURE_OVERVIEW.md`](../reference/CVF_PUBLIC_STRUCTURE_OVERVIEW.md) |
| Hiểu kiến trúc CVF đầy đủ | [`CVF_CORE_KNOWLEDGE_BASE.md`](../CVF_CORE_KNOWLEDGE_BASE.md) |
| Bắt đầu dùng CVF cho project | [`GET_STARTED.md`](../GET_STARTED.md) |
| Hướng dẫn chi tiết solo/team/enterprise | [`docs/guides/`](./) |
| Xem danh sách 141 skills | [`EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/`](../../EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/) |
| Xem quyết định kiến trúc | [`CVF_ARCHITECTURE_DECISIONS.md`](../CVF_ARCHITECTURE_DECISIONS.md) |
| Xem roadmap nâng cấp | [`CVF_ROADMAP_HOAN_THIEN_TOAN_DIEN_2026-03-06.md`](../reviews/cvf_phase_governance/CVF_ROADMAP_HOAN_THIEN_TOAN_DIEN_2026-03-06.md) |
| Xem Web UI | [`CVF_v1.6_AGENT_PLATFORM`](../../EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/) |

---

> **Cập nhật file này khi:** Phase status thay đổi, hoặc sau mỗi đợt nâng cấp lớn.
