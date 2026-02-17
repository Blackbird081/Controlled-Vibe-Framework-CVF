# Architecture Separation Diagram

> **Cập nhật 2026-02-17** — Phản ánh cấu trúc thực tế của hệ thống CVF

---

## Hệ Thống CVF — Tổng Quan Kiến Trúc

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        CVF CORE (v1.0 + v1.1)                             │
│                         🔒 FROZEN — Không thay đổi                        │
│                                                                            │
│   ✦ 4-Phase Model: Discovery → Design → Build → Review                   │
│   ✦ Governance Principles & Checklists                                     │
│   ✦ Agent Archetypes: Analysis / Execution / Orchestration                │
│   ✦ INPUT/OUTPUT Specs & Command Taxonomy                                  │
│   ✦ Execution Spine + Action Units                                         │
│                                                                            │
│   📌 Foundation — Tất cả extensions đều dựa trên đây                      │
└────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │ extends       │ extends       │ extends
                    ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────────────────────────┐
│ v1.2         │ │ v1.3         │ │ v1.4 → v1.5 → v1.5.1 → v1.5.2      │
│ Capability   │ │ Toolkit      │ │ Usage / UX / End-User / Skills      │
│ Extension    │ │ (SDKs)       │ │                                      │
│              │ │ Python + TS  │ │ 131 Reusable Skills                  │
│ Risk R0–R3   │ │ SDK          │ │ 12 Domains                           │
│ Skill Spec   │ │              │ │                                      │
└──────────────┘ └──────────────┘ └──────────────────────────────────────┘
                                    │
                                    │ extends
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                    CVF v1.6 — AGENT PLATFORM                              │
│                   ✅ Production Runtime                                    │
│                                                                            │
│   📂 cvf-web/ (Next.js 16 + React 19)                                    │
│   ✦ 1068 tests | 95.6% coverage | 79.4% branch                          │
│   ✦ AI Agent Chat (multi-provider: OpenAI, Claude, Gemini)                │
│   ✦ Governance Enforcement (3-mode: simple/governance/full)               │
│   ✦ Quality Scoring (0–100, 4 dimensions)                                │
│   ✦ Phase Gates, Risk Check (R0–R4), Spec Gate                           │
│   ✦ Multi-Agent Workflow (Orchestrator/Architect/Builder/Reviewer)        │
│   ✦ i18n (English/Vietnamese), Dark Mode, Analytics                      │
│                                                                            │
│   📌 Đây là PRODUCTION RUNTIME chính thức của CVF                         │
└────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────┐
                    │   📂 governance/                 │
                    │   Toolkit bootstrap (7 folders)  │
                    │   Skill Library (131 skills)     │
                    │   Registry + Validation Scripts  │
                    └─────────────────────────────────┘
```

---

## Reference Implementations — Ứng Dụng Mở Rộng Có Kiểm Soát

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    📘 REFERENCE IMPLEMENTATIONS                           │
│               Ví dụ minh họa — Không phải production code                 │
│                                                                            │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐ │
│  │  CVF_TOOLKIT_REFERENCE      │  │  CVF_STARTER_TEMPLATE_REFERENCE     │ │
│  │                             │  │                                     │ │
│  │  Minh họa:                  │  │  Minh họa:                          │ │
│  │  • Governance Guard Engine  │  │  • Express AI Server Template       │ │
│  │  • Risk Classifier (R1–R4) │  │  • 13-step Execution Pipeline       │ │
│  │  • Phase Controller (P0–P6)│  │  • Multi-provider AI Abstraction    │ │
│  │  • Skill Registry           │  │  • Budget/Freeze/Audit Guards       │ │
│  │  • Change Control           │  │  • DI Pattern for Governance        │ │
│  │  • AI Provider Abstraction  │  │  • Docker Deployment                │ │
│  │  • Extension Templates      │  │  • UAT & Certification              │ │
│  │                             │  │                                     │ │
│  │  Stack: TypeScript + Jest   │  │  Stack: Express + TypeScript        │ │
│  │  75 files, ~4,750 lines     │  │  63 files, ~1,650 lines             │ │
│  └─────────────────────────────┘  └─────────────────────────────────────┘ │
│                                                                            │
│  📌 Dùng để tham khảo khi xây dựng project mới dựa trên CVF principles   │
│  📌 Mỗi implementation minh họa một cách tiếp cận khác nhau              │
│  📌 KHÔNG dùng trực tiếp cho production — dùng cvf-web hoặc v1.3 SDK     │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Khi Xây Dựng Project Mới

```
YOUR NEW AI PROJECT
(ví dụ: Financial AI, HR AI, Legal AI...)
     │
     │  Tham khảo reference implementations
     │  để hiểu governance patterns
     │
     ├──→ 📘 CVF Toolkit Reference    (governance engine patterns)
     ├──→ 📘 Starter Template Reference (server template patterns)
     │
     │  Sử dụng production components
     │
     ├──→ ✅ CVF Core (v1.0/v1.1)     (governance principles)
     ├──→ ✅ v1.3 SDK                  (skill contracts, validation)
     ├──→ ✅ v1.5.2 Skill Library      (131 reusable skills)
     └──→ ✅ cvf-web platform          (web UI, agent chat)
```

### Quy Trình Đề Xuất:

1. **Đọc CVF Core** (v1.0/v1.1) — hiểu 4-phase model, governance principles
2. **Đọc Reference Implementations** — hiểu enforcement patterns, architecture
3. **Chọn stack** — Next.js (cvf-web) hoặc Express (starter template pattern)
4. **Import v1.3 SDK** — cho skill contract validation
5. **Extend** — thêm domain logic riêng, KHÔNG sửa governance core

---

## Architectural Principles (Vẫn Giữ Nguyên)

### Rule 1 — CVF Core Is Immutable
CVF v1.0/v1.1 không sửa. Mọi thay đổi qua extensions.

### Rule 2 — Production Runtime = cvf-web
cvf-web (v1.6) là runtime chính thức với 1068 tests.

### Rule 3 — Reference ≠ Production
CVF Toolkit Reference và Starter Template Reference là ví dụ minh họa, không phải production code.

### Rule 4 — Extend Without Mutation
Project mới thêm domain logic, không sửa governance.

---

## Separation Matrix (Cập Nhật)

| Layer | Purpose | Type | Tests |
|-------|---------|------|-------|
| CVF Core (v1.0/v1.1) | Governance specs | 🔒 FROZEN | N/A (specs) |
| CVF Extensions (v1.2–v1.5.2) | Capability + Skills | ✅ Production | Mixed |
| CVF Web (v1.6/cvf-web) | Production platform | ✅ Production | 1068 tests |
| v1.3 TypeScript SDK | Skill contract SDK | ✅ Production | Has tests |
| governance/toolkit | Bootstrap + Library | ✅ Production | Scripts |
| 📘 Toolkit Reference | Governance engine example | 📘 Reference | 5 test files |
| 📘 Starter Template Reference | Server template example | 📘 Reference | 0 test files |

---

## Enterprise Thinking (Vẫn Giữ Nguyên)

Xây hệ thống dùng dài hạn cho nhiều dự án sau này:

- CVF Core = giống ISO framework nội bộ
- CVF Web = production platform chính thức
- Reference Implementations = SOP tham khảo khi triển khai project mới
- Business Projects = từng hợp đồng / từng khách hàng

Đây là cách tách giúp:
- Audit rõ ràng
- Freeze version rõ ràng
- Rollback governance độc lập business
- Giảm rủi ro AI sai chính sách