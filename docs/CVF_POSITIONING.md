# CVF Positioning — Bản Sắc & Định Vị

> **Created:** Feb 08, 2026  
> **Purpose:** Trả lời câu hỏi "CVF là gì?" một cách rõ ràng, tránh nhầm lẫn

---

## 1. CVF Là Gì?

**CVF (Controlled Vibe Framework)** là một **governance framework** cho AI-assisted development.

```
CVF = Bộ quy tắc + Quy trình + Công cụ
      để kiểm soát chất lượng khi làm việc với AI
```

### Định nghĩa chính xác

| Aspect | CVF là | CVF KHÔNG là |
|--------|--------|-------------|
| Type | Governance framework | AI model / AI tool |
| Scope | Quy trình + chuẩn mực | Code library / SDK |
| Target | Con người + AI cùng làm việc | Pure AI automation |
| Output | Quy tắc, specs, checklists | App / Software product |
| Dependency | Agent-agnostic | Tied to specific AI |

---

## 2. Lớp Kiến Trúc

CVF có 3 lớp rõ ràng (không phải 1 monolith):

```
┌──────────────────────────────────────────────┐
│           Layer 3: PLATFORM                  │
│  Agent Platform (v1.6), Web UI, Dashboard    │
│  → Reference implementation, KHÔNG bắt buộc  │
├──────────────────────────────────────────────┤
│           Layer 2: TOOLS                     │
│  Scoring, UAT, Validation, Version Lock      │
│  → Tiện ích hỗ trợ, dùng khi cần            │
├──────────────────────────────────────────────┤
│           Layer 1: CORE ← Đây là CVF        │
│  Principles, Phases, Risk Model, Skills      │
│  → Bộ quy tắc cốt lõi, LUÔN cần            │
└──────────────────────────────────────────────┘
```

### Layer 1: Core (Bắt buộc)
- **Principles:** Outcome > Code, Spec-first, Risk-aware
- **Phases:** Discovery → Design → Build → Review → Ship
- **Risk Model:** R0 (Auto) → R1 (Audit) → R2 (Review) → R3 (Manual)
- **Skill Library:** 124 skills với spec chuẩn

### Layer 2: Tools (Tùy chọn)
- `report_spec_metrics.py` — Chấm điểm spec quality
- `score_uat.py` — Chấm điểm UAT
- `check_version_sync.py` — Kiểm tra version drift
- `inject_spec_scores.py` — Inject scores vào governance
- `validate_registry.py` — Validate CI/CD

### Layer 3: Platform (Reference)
- Web app (Next.js) — demo implementation
- Agent adapters — integration examples
- Dashboard — visualization

---

## 3. Use Cases Phù Hợp

### ✅ Phù hợp
| Scenario | Dùng CVF như thế nào |
|----------|--------------------|
| 1 dev dùng AI hàng ngày | Layer 1: Skills + Risk awareness |
| Team 3-5 người | Layer 1 + 2: Skills + governance + scoring |
| Code review với AI | Skill `tech_review/01_code_review.skill.md` |
| Viết spec | Skill `application_development/05_api_design_spec.skill.md` |
| Đánh giá AI output | UAT process + evaluation checklist |

### ❌ Không phù hợp
| Scenario | Lý do |
|----------|-------|
| Thay thế AI model | CVF không phải AI, chỉ quản lý quy trình |
| Real-time API | CVF không có runtime component |
| Customer-facing product | CVF là internal tool/process |
| Enterprise compliance (SOC2, etc.) | Cần framework chuyên dụng |

---

## 4. So Sánh Với Các Framework Khác

| Feature | CVF | DORA | SAFe | Custom Prompts |
|---------|-----|------|------|----------------|
| AI governance | ✅ Core focus | ❌ | ❌ | ❌ |
| Risk-based phases | ✅ R0-R3 | ❌ | ✅ | ❌ |
| Skill library | ✅ 124 skills | ❌ | ❌ | Partial |
| Agent-agnostic | ✅ | N/A | N/A | ❌ Usually locked |
| Quality scoring | ✅ | ✅ Metrics | ✅ Metrics | ❌ |
| Lightweight | ✅ | ✅ | ❌ Heavy | ✅ |

---

## 5. Tagline Options

Dùng một trong các tagline sau khi giới thiệu CVF:

1. **"Governance framework for AI-assisted development"** ← Chính xác nhất
2. **"Kiểm soát chất lượng khi làm việc với AI"** ← Tiếng Việt
3. **"Rules, not code. Process, not product."** ← Phân biệt rõ
4. **"Make AI work YOUR way"** ← Marketing-friendly

---

## 6. Elevator Pitch

> CVF là bộ quy tắc giúp bạn kiểm soát AI khi phát triển phần mềm.  
> Thay vì để AI tự do, CVF cung cấp 124 skill templates có sẵn,  
> hệ thống risk levels (R0-R3), và quality scoring tự động.  
> Dùng được với bất kỳ AI nào: Copilot, ChatGPT, Claude, Gemini.  
> 5 phút để bắt đầu. Zero dependencies.

---

## 7. Anti-Patterns (Tránh)

| Nói | Thay vì | Vì sao |
|-----|---------|--------|
| "CVF platform" | "CVF framework" | CVF là quy tắc, không phải platform |
| "CVF v1.6" | "CVF Core + Agent Platform v1.6" | v1.6 là platform layer, không phải core |
| "Install CVF" | "Apply CVF" | CVF không install, copy skill files là đủ |
| "CVF AI" | "CVF governance" | CVF quản lý AI, không phải là AI |
