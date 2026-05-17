# Claude Design → Code Handoff

> **Domain:** Product & UX  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-04-25

---

## 📌 Prerequisites

- Tài khoản Claude Pro/Max/Team/Enterprise (Claude Design yêu cầu Opus 4.7)
- Dự án web đang dùng React/Next.js + Tailwind CSS
- Biết design system hiện tại của app (màu sắc, font, CSS variables)

---

## 🎯 Mục đích

Khai thác **Claude Design** (`claude.ai/design`) để thiết kế UI visual đẹp, sau đó chuyển prototype/handoff sang code thật — không mất đi logic, không phá design system.

Claude Design có thể trả về **prototype code trực tiếp** (`.html`, `.jsx`, inline CSS) thay vì spec. Skill này hỗ trợ cả hai dạng:
- Handoff/spec text từ Claude Design
- Prototype HTML/JSX/CSS được Claude Design tạo trên canvas

**Khi nào dùng:**
- Muốn thiết kế lại giao diện đẹp hơn mà không code tay từ đầu
- Cần prototype nhanh rồi chuyển thành React/Next.js production UI
- Muốn tạo pitch deck / slide / one-pager rồi export
- Muốn rút design DNA từ prototype Claude Design thành skill/spec tái sử dụng

**Không phù hợp khi:**
- Chỉ sửa 1 class CSS nhỏ — dùng trực tiếp Edit tool
- App chưa có design system rõ ràng — dùng `design_system_generator.skill.md` trước

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Designer, Frontend Dev |
| Allowed Phases | Design, Build, Review |
| Authority Scope | Tactical |
| Autonomy | Auto + Audit |
| Audit Hooks | Design token mapping, Logic preservation, No new deps |

---

## 📋 Workflow Tổng quan

```
[1] Chuẩn bị context       →  Thu thập design system, screenshot, app info
[2] Prompt Claude Design    →  claude.ai/design tạo coded visual prototype
[3] Tinh chỉnh iterative    →  Chat, inline comment, direct edit trong Design
[4] Export/copy artifact    →  Lấy HTML/JSX/CSS hoặc handoff text
[5] Extract design DNA      →  Rút layout, token, component recipes, motion
[6] Implement production UI →  Map vào code thật, giữ logic/data flow
```

Nếu Claude Design không có nút handoff/spec, dùng prototype code làm source of truth. Không yêu cầu Claude Design xuất spec trước.

`DESIGN.md` ở root CVF là canonical visual contract. Prototype Claude Design chỉ được dùng để trích xuất visual intent; nếu prototype xung đột với `DESIGN.md`, ưu tiên `DESIGN.md`.

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| App type | Loại ứng dụng, đối tượng dùng | ✅ | "B2B internal tool, port staff" |
| Design system | Màu nền, accent, text, CSS variables | ✅ | `#0b1d35 bg, #0ea5e9 accent` |
| Pages | Danh sách trang cần redesign | ✅ | "Dashboard, Login, Settings" |
| Style goal | Hướng thẩm mỹ muốn đạt | ✅ | "Glassmorphism, enterprise dark" |
| Reference | App tham khảo | ❌ | "Linear, Vercel Dashboard" |
| Screenshot | Ảnh chụp UI hiện tại | ❌ | Đính kèm vào Claude Design |
| Tech stack | Framework, CSS lib | ✅ | "Next.js 16 + Tailwind v4" |
| Artifact type | Prototype code hay handoff text | ❌ | "HTML prototype from Claude Design" |

---

## ✅ Expected Output

**Từ Claude Design:**
- Visual prototype tương tác đẹp
- Có thể export/copy: HTML · JSX · ZIP · PDF · PPTX · Canva, tùy tính năng hiện có

**Sau khi đưa về codebase:**
- Nếu artifact là handoff text: map trực tiếp sang code thật
- Nếu artifact là prototype code: trích xuất design DNA trước, sau đó implement
- Code thật giữ nguyên logic, hooks, route, auth, data flow, API/Dexie/parser

---

## 🧩 Prototype Code Extraction

Khi input là `.html`, `.jsx`, hoặc inline CSS từ Claude Design:

1. **Treat prototype as visual source, not production source.**
   Không copy tag-for-tag vào app thật.
2. **Extract reusable DNA:**
   - color roles
   - surface hierarchy
   - typography scale
   - shell/sidebar/topbar pattern
   - card/filter/table/form recipes
   - hover/focus/motion rules
   - empty/loading/error state style
3. **Map artifact sections to existing app components:**
   - prototype sidebar → existing layout/nav
   - prototype cards → existing cards/stat panels
   - prototype filters → existing search/date/category controls
   - prototype tables → existing data table structure
4. **Preserve behavior:**
   Không đổi hook names, handlers, route names, data types, API calls, auth gates, local DB schema, parser logic.
5. **Tokenize:**
   Hardcoded hex từ prototype phải map sang CSS variables/theme tokens nếu codebase đã có token.
6. **Create a short page-level implementation plan** trước khi edit nếu page phức tạp.

### Optional Extraction Output

Nếu cần lưu lại để reuse/audit, tạo file:

```text
docs/design-extractions/<page-or-flow>-v1.md
```

Nội dung tối thiểu:

```markdown
Source artifact:
Visual intent:
Layout pattern:
Component recipes:
Token mapping:
Motion/effects:
Implementation guardrails:
```

---

## 🔤 Prompt Templates

### Template A — Redesign toàn bộ app

```
I'm redesigning a [app type] web app — "[App Name]".

**App context:**
- Users: [mô tả người dùng, context dùng]
- Language: [ngôn ngữ UI]
- Pages: [liệt kê các trang]

**Current design system:**
- Background: [mã hex]
- Surface/card: [mã hex]
- Accent: [mã hex]
- Text primary/secondary: [mã hex]
- Success/Warning/Danger: [mã hex]

**Design direction:**
[Mô tả style goal — ví dụ: "Modern glassmorphism, enterprise dark, 
maritime feel, similar aesthetic to Linear or Vercel Dashboard"]

**Prototype output:** Please create a working coded visual prototype in Claude Design.
If a "Handoff to Claude Code" option is available, include it. If not, the HTML/JSX prototype is enough.
**Tech target:** [framework + CSS lib]

Start with [trang ưu tiên cao nhất] first.
```

### Template B — Một trang cụ thể (nhanh hơn)

```
Redesign this single page: [Tên trang]

**App:** [Tên app ngắn gọn]
**Design system:** [màu key: bg, surface, accent]
**Current state:** [mô tả hoặc paste code / đính kèm screenshot]
**Style goal:** [1-2 câu]
**Keep:** [logic/data structure cần giữ]
**Tech target:** [framework + CSS lib]
Please create the visual prototype directly. If handoff export is available, include it; otherwise the coded prototype is enough.
```

### Template B điền sẵn cho Tan Thuan Port

```
Redesign this single page for "Cảng Tân Thuận" port operations app:

**Page:** [tên trang — ví dụ: Dashboard]
**Users:** ~50 port staff, daily use, desktop + tablet, Vietnamese UI
**Design system:**
  bg #0b1d35 · surface #0f2847 · elevated #1a3a62
  accent #0ea5e9 · text-primary #f0f6ff · text-secondary #94a3b8
  success #10b981 · warning #f59e0b · danger #f43f5e
**Current state:** [mô tả hoặc đính kèm screenshot]
**Style goal:** [ví dụ: "Cleaner KPI hierarchy, subtle glow on cards, 
more breathing room, professional maritime dashboard feel"]
**Keep:** Vietnamese labels, same data structure, same navigation
**Tech target:** Next.js 16 + Tailwind CSS v4 + Lucide icons
→ Create a coded visual prototype. If "Handoff to Claude Code" is available, include it; otherwise the HTML/JSX prototype is enough.
```

---

## 🗺️ Design Token Mapping (cho bước Implement)

Khi Claude Design output dùng màu generic → map sang CSS variables của project:

| Claude Design output | CSS Variable | Hex |
|---|---|---|
| dark background | `var(--color-bg)` | `#0b1d35` |
| card / surface | `var(--color-surface)` hoặc `.cvf-card` | `#0f2847` |
| elevated panel | `var(--color-elevated)` | `#1a3a62` |
| primary blue / accent | `var(--color-accent)` | `#0ea5e9` |
| accent hover | `var(--color-accent-hover)` | `#38bdf8` |
| accent dim / bg glow | `var(--color-accent-dim)` | `#0ea5e920` |
| border default | `var(--color-border)` | `#1e4d8c33` |
| border strong | `var(--color-border-strong)` | `#2563eb55` |
| primary text | `var(--color-text-primary)` | `#f0f6ff` |
| secondary text | `var(--color-text-secondary)` | `#94a3b8` |
| muted / hint text | `var(--color-text-muted)` | `#64748b` |
| success / green | `var(--color-success)` | `#10b981` |
| warning / amber | `var(--color-warning)` | `#f59e0b` |
| danger / red | `var(--color-danger)` | `#f43f5e` |
| info / violet | `var(--color-info)` | `#818cf8` |
| input field | `.cvf-input` class | — |
| page bg gradient | `.cvf-shell-surface` class | — |

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Claude Design output trông đẹp hơn UI hiện tại một cách rõ ràng
- [ ] Màu sắc đã được map sang CSS variables, không có hardcode hex
- [ ] Logic component (hooks, handlers, data flow) không thay đổi
- [ ] Không có thư viện mới nào được thêm vào
- [ ] Labels tiếng Việt giữ nguyên
- [ ] Tailwind v4 syntax (`@import "tailwindcss"`, không dùng `tailwind.config.js`)
- [ ] Lucide icons dùng xuyên suốt, không mix icon library khác

**Red flags (cần Reject):**
- ⚠️ Claude Design dùng màu hardcode hex thay vì map sang variables
- ⚠️ Import thêm `framer-motion`, `@radix-ui`, hoặc bất kỳ UI lib nào không có trong dự án
- ⚠️ Xóa hoặc thay đổi tên props, hooks, hoặc data structures
- ⚠️ Output dùng Tailwind v3 config style (`tailwind.config.js`, `theme.extend`)

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Claude Design không hiểu design system | Paste đầy đủ hex values vào prompt, đính kèm screenshot |
| Không có handoff spec | Dùng HTML/JSX prototype làm source, extract design DNA trước khi implement |
| Prototype đẹp nhưng khó copy vào app | Không copy nguyên markup; map visual intent sang component hiện có |
| Color token bị mất sau khi implement | Luôn dùng mapping table ở trên, không accept hardcode hex |
| Next.js specific code bị xóa | Verify `useRouter`, `"use client"`, `Link` còn nguyên sau khi edit |
| Tailwind v4 bị viết theo v3 syntax | Kiểm tra không có `tailwind.config.js` content trong output |

---

## 💡 Tips

1. **Đính kèm screenshot:** Attach ảnh chụp trang hiện tại vào Claude Design → kết quả chính xác hơn nhiều so với mô tả text
2. **Reference mạnh hơn description:** "Feel like Linear dashboard" > "modern and clean"
3. **Iterate trong Design trước:** Chat nhiều lần trong Claude Design để hoàn thiện prototype — đừng mang prototype còn mơ hồ về codebase
4. **Làm từng trang:** Đừng redesign cả app cùng lúc — từng trang một dễ kiểm soát hơn
5. **Claude Code + `/ui-from-design`:** Paste handoff hoặc prototype code — Claude Code sẽ extract visual intent, map token và implement

---

## 📊 Ví dụ thực tế

### Input mẫu (Template B — Tan Thuan Port):
```
Page: Dashboard
Design system: bg #0b1d35, accent #0ea5e9
Current state: [screenshot đính kèm]
Style goal: Cleaner KPI cards với subtle blue glow, chart section 
có more whitespace, sidebar compact hơn
Keep: Vietnamese labels, recharts data, session-based auth display
Tech target: Next.js 16 + Tailwind v4 → coded prototype or handoff text
```

### Output mẫu:
```
Claude Design tạo ra prototype dashboard với:
- KPI cards có glassmorphism border + blue glow
- Chart section layout 2-col với breathing room
- Sidebar compact với icon+label minimal
→ Copy/export prototype HTML/JSX hoặc handoff text → Claude Code extract DNA → implement
```

### Đánh giá:
- ✅ Design đẹp hơn rõ ràng
- ✅ Màu đã map sang CSS variables
- ✅ Logic giữ nguyên
- ✅ Không có dep mới
- **Kết quả: ACCEPT**

---

## 🔗 Related Skills

- [CVF Web UX Redesign System](./cvf_web_ux_redesign_system.skill.md) — Redesign toàn hệ thống, không phụ thuộc Claude Design
- [CVF Web UX Redesign System](./cvf_web_ux_redesign_system.skill.md) — Chuẩn hóa design system và implementation guardrails trước/sau khi hấp thụ prototype
- [Dashboard](../web_development/03_dashboard.skill.md) — Build dashboard từ đầu

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-25 | Initial release — workflow Claude Design → Claude Code |

---

## 🔗 Next Step

> Sau khi prototype/handoff ổn → mở Claude Code → paste spec hoặc HTML/JSX artifact → `/ui-from-design`

---

*Claude Design Handoff — CVF v1.5.2 Skill Library*
