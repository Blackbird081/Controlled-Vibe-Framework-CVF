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

Skill này **không phụ thuộc Claude Design ở runtime**. Claude Design chỉ là nguồn prototype ban đầu. Agent dùng skill này phải tự tạo được giao diện theo CVF redesign DNA khi người dùng yêu cầu dựng web/app/dashboard mới.

`DESIGN.md` ở root CVF là **canonical visual contract**. Skill này triển khai và diễn giải contract đó cho web build handoff. Nếu có xung đột giữa prototype, repo tham khảo, hoặc gu brand bên ngoài với `DESIGN.md`, ưu tiên `DESIGN.md`.

**Khi nào nên dùng:**
- Muốn áp dụng lại tinh thần giao diện của CVF web redesign cho dự án khác
- Cần chuyển từ "mood đẹp" sang spec UX/UI có thể implement
- Cần giữ logic cũ nhưng thay toàn bộ presentation layer
- Muốn tạo design brief thống nhất cho designer, AI, và frontend team
- CVF Web cần tự xuất build spec khi user yêu cầu dựng một web app mới
- Agent cần dựng UI cùng phong cách CVF redesign mà không có prototype Claude Design đi kèm

**Không phù hợp khi:**
- Chỉ sửa 1 component nhỏ hoặc fix spacing đơn lẻ
- Đã có design system production hoàn chỉnh và chỉ cần follow system đó
- Cần invention hoàn toàn mới, không muốn reuse ngôn ngữ giao diện từ CVF

---

## 🧬 CVF Redesign DNA (Extracted)

Nguồn gốc DNA này được rút từ prototype Claude Design trong `App onboarding/`:
`CVF Redesign.html`, `CVF Redesign v2.html`, `cvf-theme.jsx`, `cvf-sidebar.jsx`, `cvf-pages-*.jsx`, `browser-window.jsx`.

Không copy nguyên prototype vào sản phẩm. Dùng các rule dưới đây để tái tạo phong cách bằng framework hiện tại.

### Experience Tone

- Cảm giác như một **professional command workspace**, không phải landing page trang trí.
- Giao diện tối, tập trung, có chiều sâu, nhưng vẫn đủ sáng để scan nhanh.
- Nội dung nghiệp vụ phải đứng trước hiệu ứng: data, actions, filters, status là first-class UI.
- Visual tone: premium, operational, calm, precise, slightly futuristic.

### Color System

- Primary accent mặc định: indigo `#5b5cf6`; có thể đổi theo domain nhưng vẫn dùng một accent chính.
- Dark shell: `#0d0f1a` / `#0d0e18`.
- Content background dark: `#111218`; card dark: `#1c1d27`.
- Light mode nếu có: content bg `#f4f5fa`, card `#ffffff`, topbar `#ffffff`.
- Border mảnh dùng alpha: dark `rgba(255,255,255,0.06-0.10)`, light `rgba(0,0,0,0.06-0.10)`.
- Accent overlays dùng opacity thấp: `accent + 1a`, `accent + 22`, `accent + 30`, `accent + 44`.
- Semantic colors chỉ dùng cho trạng thái: success `#10b981`, warning `#f59e0b`, danger `#f43f5e`, info/indigo/violet cho metadata.

### Typography

- Ưu tiên `DM Sans` hoặc system sans tương đương; dùng `DM Mono` chỉ cho version, technical id, hoặc compact metadata.
- Heading: 24-26px, 700, letter spacing khoảng `-0.03em`.
- Section title: 13-14px, 600, letter spacing nhẹ `-0.01em`.
- Body/table/card text: 12-13.5px, line-height 1.45-1.65.
- Metadata label: 9-11px, uppercase, 700, letter spacing `0.06em-0.10em`.
- Số KPI: 26px+, 700, line-height 1, letter spacing `-0.03em`.

### Shell & Navigation

- App shell mặc định: fixed left sidebar + topbar/action strip + scrollable content area.
- Sidebar width chuẩn: 220px; compact vẫn phải giữ icon + label đọc được.
- Sidebar nền tối riêng biệt với content, border-right alpha mảnh.
- Sidebar gồm: logo block, user block, grouped nav, footer actions/language.
- Nav group label uppercase nhỏ, muted, letter-spaced.
- Active nav item dùng accent-tinted bg, active text sáng hơn, có dot indicator 5px ở cuối.
- Hover nav dùng alpha white rất nhẹ; transition 130-150ms.
- Topbar cao 44-52px, border-bottom mảnh, title/subtitle bên trái hoặc action/tweak bên phải.

### Layout Rhythm

- Page content padding chuẩn: 26-28px; compact: 20-22px.
- Section spacing: 18-24px.
- Card grid gap: 10-13px.
- Cards dùng radius 12-14px; icon containers radius 8-10px.
- Dùng `repeat(auto-fill, minmax(255px, 1fr))` cho browse/card grids; compact có thể 220px.
- Dashboard nên theo thứ tự: header/action strip → KPI/stat strip → chart/detail grid → table/activity log.
- Form page nên group theo panel, primary action rõ, không chia wizard nếu luồng ngắn.

### Component Recipes

**Card**
- Background surface, 1px border, radius 12-14px, padding 16-20px.
- Hover: border chuyển sang accent alpha, translateY(-2px), shadow `0 8px 28px accentAlpha + 0 2px 8px rgba(0,0,0,0.07)`.
- Không dùng card lồng card trừ khi item lặp nằm trong panel nghiệp vụ rõ ràng.

**Stat/KPI Card**
- Label uppercase 11px muted, icon pill 28px, value 26px bold, optional subtext 11px.
- Icon bg dùng semantic/accent alpha 18%.
- KPI quan trọng nhất đặt trước, không để chart cạnh tranh với số chính.

**Filter Bar**
- Surface riêng với border, radius 14px, padding 13-16px.
- Input search cao 36px, radius 9px, icon left 13px.
- Category pills radius 20px, padding 6px 13px, active bg accent, inactive bg tab alpha.
- Count chip bên trong pill: 9px, bold, alpha bg.

**Button**
- Radius 7-8px, font 11-12px, medium weight.
- Primary: solid accent + white.
- Soft: accent alpha bg + accent text.
- Outline: transparent + accent border 44 alpha.
- Ghost: transparent, hover tab bg.
- Icon size 11-13px; không dùng text-only khi icon rõ nghĩa.

**Badge**
- Uppercase 9px, 700, letter spacing `0.04em`, padding 2px 7px, radius 4px.
- Dark mode dùng text color làm bg alpha và light bg color làm text.

**Input**
- Height 36px, radius 9px, bg input surface, border alpha.
- Focus border đổi sang accent, không thêm glow lớn.

**Empty / Loading / Error**
- Empty state nằm đúng grid/table area, text muted, padding 48-52px.
- Loading dùng skeleton/pulse nhẹ hoặc muted text; không dùng spinner to quá.
- Error dùng danger semantic + action khôi phục.

### Motion & Effects

- Page enter: fade + translateY(6px), 0.2s ease.
- Card enter: fade + translateY(8px), 0.22s ease, có thể stagger 35ms cho grid.
- Hover lift tối đa 2px.
- Transition thông dụng: 0.13-0.18s cho hover, 0.2-0.3s cho theme/layout.
- Scrollbar rất mảnh 3px, thumb alpha thấp.
- Không dùng animation looping, parallax, bokeh/orb decoration, hoặc motion làm giảm khả năng scan.

### Anti-Patterns

- Không biến dashboard thành landing/hero marketing.
- Không dùng một màu tím/xanh phủ toàn bộ giao diện; accent phải có vai trò.
- Không hardcode prototype inline style nếu codebase đã có token/CSS variables.
- Không thêm UI library chỉ để đạt style.
- Không copy Chrome/browser frame vào production app, trừ khi đang làm portfolio/demo/presentation.
- Không để visual effect che mất table, filter, CTA, empty/error state.

### Reference Absorption Policy

- Repo ngoài, `DESIGN.md` brand-inspired, screenshot, hoặc prototype chỉ là nguyên liệu học.
- Hấp thụ layout archetype, component recipe, spacing rhythm, state behavior, anti-pattern hữu ích.
- Không hấp thụ nguyên brand identity, proprietary visual signature, hoặc trend trang trí làm giảm usability.
- Không tạo thêm skill UI/UX mới nếu capability đã thuộc skill này hoặc `claude_design_handoff`.
- Nếu cần biến reference ngoài thành chuẩn dùng lâu dài, cập nhật `DESIGN.md` trước rồi mới cập nhật skill.

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

Khi người dùng yêu cầu dựng web/app mới, agent phải tự xuất spec trước khi build nếu chưa có spec. Spec này không cần người dùng biết thuật ngữ kỹ thuật; agent suy luận từ business intent và hỏi lại chỉ khi thiếu thông tin gây rủi ro.

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

## 🔁 Execution Workflow

1. **Collect intent:** xác định app type, users, core flows, pages, must-preserve logic, content density.
2. **Choose surface archetype:** dashboard, workspace, admin console, landing, docs, settings, data table, form workflow.
3. **Generate packet:** dùng 8 khối output ở trên và CVF Redesign DNA để tạo spec đủ implement.
4. **Map to codebase:** dùng token/CSS variables/component system hiện có; nếu không có, tạo token tối thiểu.
5. **Implement presentation:** restyle shell, page layout, components, states; giữ route/auth/API/state/data contracts.
6. **Verify:** desktop/tablet/mobile, focus, contrast, empty/loading/error, no new deps unless approved.

Nếu input là prototype Claude Design/HTML/JSX, không đưa toàn bộ prototype vào app. Trích xuất visual intent thành packet trước, sau đó mới implement.

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

- [Claude Design Handoff](./claude_design_handoff.skill.md)
- [Accessibility Audit](./accessibility_audit.skill.md)
- [UX Heuristic Evaluation](./ux_heuristic_evaluation.skill.md)
- [UI Pre-Delivery Checklist](../app_development/ui_pre_delivery_checklist.skill.md)

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-20 | Initial skill derived from CVF web redesign patterns for reusable web UX system design |

---

*CVF Skill Library v1.5.2 | Product & UX Domain*
