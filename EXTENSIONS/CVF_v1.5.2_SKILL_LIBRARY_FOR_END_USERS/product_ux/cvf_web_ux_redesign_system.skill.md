# CVF Web UX Redesign System

> **Domain:** Product & UX  
> **Difficulty:** ⭐⭐⭐ Advanced  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-04-20

---

## 📌 Prerequisites

Nên chuẩn bị trước:
- Danh sách pages / modals / flows cần build hoặc redesign
- Những logic phải giữ nguyên: route, auth, API, state, data contracts
- 1-3 references thể hiện đúng gu giao diện mong muốn

---

## 🎯 Mục đích

Biến một lần redesign UX thành **hệ thống tái sử dụng** cho các web app sau này. Skill này giúp đóng gói "design DNA" của CVF web redesign thành một spec có thể đem dùng lại cho dashboard, workspace, landing, docs, admin surface, hoặc product shell mới.

Người dùng **không cần** biết framework, stack, hay kỹ thuật ẩn phía sau. Phần đó phải được CVF/agent tự suy ra khi tạo packet handoff.

**Khi nào nên dùng:**
- Muốn áp dụng lại tinh thần giao diện của CVF web redesign cho dự án khác
- Cần chuyển từ "mood đẹp" sang spec UX/UI có thể implement
- Cần giữ logic cũ nhưng thay toàn bộ presentation layer
- Muốn tạo design brief thống nhất cho designer, AI, và frontend team

**Không phù hợp khi:**
- Chỉ sửa 1 component nhỏ hoặc fix spacing đơn lẻ
- Đã có design system production hoàn chỉnh và chỉ cần follow system đó
- Cần invention hoàn toàn mới, không muốn reuse ngôn ngữ giao diện từ CVF

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer, Lead |
| Allowed Phases | Discovery, Design, Build, Review |
| Authority Scope | Tactical |
| Autonomy | Auto + Audit |
| Audit Hooks | Input completeness, Output structure, Preservation guard, UX quality check |

---

## ⛔ Execution Constraints

- Không được tự ý thay đổi logic, API, auth, data flow nếu input ghi rõ "presentation-only"
- Không được dùng style đẹp để che mất CTA, state, hoặc thông tin quan trọng
- Nếu có xung đột giữa visual ambition và usability, ưu tiên usability
- Phải tách rõ: phần nào là design decision, phần nào là implementation guardrail
- Không được bắt non-coder chọn framework hoặc hidden technical pattern nếu các lựa chọn đó không làm thay đổi business intent hay risk

---

## ✅ Validation Hooks

- Check đủ input bắt buộc: surface list, user type, must-preserve logic, visual direction
- Check output có đủ 8 khối: vision, visual DNA, layout system, component language, surface blueprint, motion, responsive/a11y, implementation guardrails
- Check output không chỉ mô tả cảm tính mà phải chuyển thành rule/action cụ thể
- Check mỗi decision đều có lý do UX hoặc vận hành đi kèm

---

## 🧪 UAT Binding

- UAT Record: [cvf_web_ux_redesign_system](../../../governance/skill-library/uat/results/UAT-cvf_web_ux_redesign_system.md)
- UAT Objective: Skill phải biến một redesign style thành spec tái sử dụng, có thể handoff cho web build tiếp theo mà không làm mờ ranh giới giữa UX và logic

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả | Ví dụ |
|-------|----------|-------|-------|
| **Project / Surface** | ✅ | Sản phẩm hoặc khu vực web cần áp dụng | "B2B AI workspace cho team operations" |
| **Users / Roles** | ✅ | Ai dùng hệ thống này | "Ops lead, analyst, admin" |
| **Core Flows** | ✅ | 3-5 luồng quan trọng nhất | "Search skill, run workflow, review result, manage settings" |
| **Pages / Modals** | ✅ | Danh sách surfaces cần build/redesign | "Home, Skills, Search, Docs, Settings modal" |
| **Must Preserve** | ✅ | Logic không được đổi | "Routes, API payloads, auth, Zustand store, action names" |
| **Visual Direction** | ✅ | Ngôn ngữ thị giác mong muốn | "Dark-primary, premium, operational, confident, editorial headings" |
| **Content Density** | ❌ | Mức độ dày đặc của thông tin | "Balanced to dense" |
| **Motion Budget** | ❌ | Cường độ animation | "Intentional only, no noisy motion" |
| **Theme Strategy** | ❌ | Dark/light ưu tiên ra sao | "Dark is hero, light must still work" |
| **References / Notes** | ❌ | File, URL, hoặc ghi chú style | "Use CVF redesign patterns: stat strip, pill filters, structured cards" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

```markdown
# Web Build Handoff Packet

## 1. Experience North Star
- Product promise
- Emotional tone
- Operational constraints

## 2. Visual DNA
- Typography strategy
- Color roles
- Surface hierarchy
- Accent usage
- Anti-patterns to avoid

## 3. Layout & Navigation System
- Shell pattern
- Sidebar / topbar rules
- Section rhythm
- Card / panel spacing model

## 4. Component Language
- Buttons
- Inputs
- Filters
- Cards
- Tables / charts
- Modals / drawers
- Empty / loading / error states

## 5. Surface Blueprint
- Page-by-page structure
- Priority content per surface
- Primary CTA / secondary CTA
- Mobile adaptations

## 6. Motion & Feedback
- Hover
- Focus
- Reveal
- Progress / success / failure feedback

## 7. Responsive & Accessibility Rules
- Breakpoints
- Touch targets
- Contrast
- Keyboard / reduced motion behavior

## 8. Implementation Guardrails
- What must stay unchanged
- What can be restyled
- Tokenization plan
- QA checklist before ship
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Có vision rõ ràng, không chỉ là danh sách style adjectives
- [ ] Có visual DNA đủ cụ thể để frontend team implement
- [ ] Tách bạch rõ presentation changes và logic preservation
- [ ] Mỗi surface đều có priority hierarchy + CTA
- [ ] Có rule cho states: empty, loading, success, error
- [ ] Có responsive + accessibility guidance
- [ ] Có anti-patterns để tránh drift khỏi style gốc

**Red flags (cần Reject):**
- ⚠️ Chỉ nói "làm đẹp hơn / hiện đại hơn"
- ⚠️ Không ghi rõ phần nào bắt buộc giữ nguyên
- ⚠️ Design system quá generic, app nào cũng giống nhau
- ⚠️ Chỉ có visual mà thiếu component/state behavior

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Chỉ copy mood của giao diện cũ | Bắt buộc rút ra rules: typography, spacing, hierarchy, state handling |
| Đẹp nhưng không implement được | Output phải có token roles, pattern names, và implementation guardrails |
| Redesign làm lệch sản phẩm | Luôn khai báo `Must Preserve` trước khi mô tả style |
| Quá nhiều motion / effect | Giới hạn motion budget và định nghĩa exact use cases |
| Mỗi page một style | Bắt buộc có shell pattern + component language dùng chung |

---

## 💡 Tips

1. **Design DNA trước, page detail sau** — nếu không, output sẽ rơi vào "mockup by mockup"
2. **Viết anti-patterns rõ ràng** — ví dụ: không AI-purple mặc định, không flat one-layer dashboard, không icon/emojis lẫn hệ
3. **Luôn mô tả state behavior** — loading, empty, error, disabled, success mới là UX thật
4. **Dark-first không có nghĩa là light bỏ mặc** — phải ghi rõ mức chất lượng light mode
5. **Dùng spec này như contract** — designer, AI, và frontend đều phải đọc cùng một bản

---

## 📊 Ví dụ thực tế

### Input:
```text
Project / Surface: AI operations dashboard
Users / Roles: Ops manager, analyst, reviewer
Core Flows: review alerts, search knowledge, run workflows, inspect reports
Pages / Modals: Home, Alerts, Search, Reports, Settings modal
Must Preserve: existing routes, auth, APIs, data tables, live execution logic
Visual Direction: dark-primary, structured, premium, data-aware, bold headings
Content Density: balanced-dense
Motion Budget: subtle reveal + clear hover feedback only
Theme Strategy: dark-primary, light-supporting
```

### Output tóm tắt:
```markdown
1. Experience North Star
- Feel like a high-trust command center, not a generic SaaS admin.

2. Visual DNA
- Editorial heading + compact operational body text
- Indigo accent reserved for actions and active state
- Layered dark surfaces with crisp border separation

3. Layout System
- Fixed left navigation
- Top summary strip for metrics
- Card grid for browsable modules
- Detail panels for dense operational views

8. Implementation Guardrails
- Preserve route structure, API calls, auth gates
- Restyle shell/components only
- Validate 375px, keyboard focus, empty/loading/error states before ship
```

### Đánh giá:
- ✅ Có style DNA cụ thể
- ✅ Có preservation guard
- ✅ Có page + component rules
- **Kết quả: ACCEPT**

---

## 🔗 Related Skills

- [Design System Generator](./design_system_generator.skill.md)
- [Interaction Design Review](./interaction_design_review.skill.md)
- [UX Heuristic Evaluation](./ux_heuristic_evaluation.skill.md)
- [UI Pre-Delivery Checklist](../app_development/ui_pre_delivery_checklist.skill.md)

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-20 | Initial skill derived from CVF web redesign patterns for reusable web UX system design |

---

*CVF Skill Library v1.5.2 | Product & UX Domain*
