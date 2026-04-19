# CVF Landing Page Redesign Roadmap — V1
*Date: 2026-04-18*
*Status: APPROVED FOR BUILD*
Memory class: SUMMARY_RECORD

> **Mục tiêu:** Nâng cấp Landing Page (`/landing`) thành trang giới thiệu cấp chuyên nghiệp phục vụ **2 đối tượng đồng thời**: Non-coder (chốt sale) và Coder/Architect (thu hút dùng CVF).
>
> **Nguyên tắc:** Chỉ thay đổi tầng UI/presentation. Không chạm logic nghiệp vụ, API, middleware, admin, hay dashboard.

---

## Tiền đề: Nguồn cảm hứng thiết kế

| Nguồn | Lấy gì |
|---|---|
| Direction A — Calm Confidence (Claude Design) | Hero chat conversation → app preview, Serif typography, social proof, testimonials |
| Direction B — Friendly Studio | Card colors (mint/sky/pink), hover lift, vui nhộn nhưng không trẻ con |
| ClaudeKit Guides (VividKit) | Pathway Cards, Interactive Workflow Visualizer, Pipeline Animation, Config Hierarchy |

---

## Phase 1 — Hero & Typography Upgrade (1–2 ngày)

**Phạm vi file:** `landing/page.tsx`, `landing/components/HeroVisualizer.tsx`, `globals.css`

### Deliverables

- **1.1. Google Font Serif:** Thêm `Instrument Serif` vào `globals.css` (hoặc `layout.tsx` `<head>`). Áp dụng cho `<h1>`, `<h2>` trên landing page. Body text giữ Inter.
- **1.2. Hero Chat Conversation:** Rewrite `HeroVisualizer.tsx` — thay typing bar bằng mô phỏng cuộc trò chuyện:
  - BẠN: "Tôi muốn làm app đặt bàn cho nhà hàng nhỏ..."
  - VIBCODE: "Tuyệt! Mình đã dựng cho bạn form đặt bàn với `chọn giờ`, `số khách`..."
  - → App preview xuất hiện bên dưới (mock UI tĩnh)
  - Animation: tin nhắn xuất hiện lần lượt (delay 1.5s mỗi tin)
- **1.3. Warm Color Palette:** Chuyển nền từ `slate-50` sang tông kem ấm (`#f6f4ef` light / giữ dark mode). Accent từ `indigo-600` sang `#e6573d` (đỏ cam ấm của Direction A).

### Constraints
- Không thêm dependency npm mới
- File `HeroVisualizer.tsx` phải dưới 150 dòng (GC-023)

---

## Phase 2 — Social Proof & Testimonials (1 ngày)

**Phạm vi file:** `landing/page.tsx`

### Deliverables

- **2.1. Avatar Strip + Trust Line:** Ngay dưới Hero — dãy 4 avatar gradient circles + dòng chữ "12,000+ nhà sáng lập không-code đang dùng VibCode" (mock data giai đoạn đầu, thay bằng số thật sau).
- **2.2. Brand Logo Strip:** Dãy logos "Được tin dùng bởi..." — có thể dùng placeholder text thay logo thật ban đầu (Haravan, Tiki Labs, Topica, VNG, Got It).
- **2.3. Testimonial Cards (3 cards):** Grid 3 cột, mỗi card gồm:
  - Quote text (Serif italic)
  - Avatar circle + Tên + Role
  - Background mỗi card khác nhau (mint/sky/pink từ Direction B)
  - Nội dung testimonials có thể customize sau

### Constraints
- Testimonials là mock data rõ ràng — không giả mạo người thật
- Tổng section height không quá viewport + scroll nhẹ

---

## Phase 3 — Template Showcase (1 ngày)

**Phạm vi file:** `landing/page.tsx`, `landing/components/TemplateShowcase.tsx` (NEW)

### Deliverables

- **3.1. Template Grid (4 cards):** Hiển thị 4 template tiêu biểu:
  - App Đặt Bàn Nhà Hàng (minh hoạ từ Direction A)
  - CRM Quản Lý Đơn Hàng
  - Landing Page Builder
  - Báo Cáo Phân Tích AI
- **3.2. Card Design:** Mỗi card có:
  - Preview area với màu nền khác nhau
  - Tên template (Serif)
  - Mô tả ngắn 1 dòng
  - Hover: lift + shadow
  - Click → redirect `/login` (hoặc `/marketplace` nếu đã login)
- **3.3. Section Title:** "Không chỉ là mockup. Là phần mềm thật." (lấy từ Direction A)

### Constraints
- Component `TemplateShowcase.tsx` phải tách riêng (GC-023)
- Không import data từ `lib/templates.ts` — dùng static data riêng để tránh coupling

---

## Phase 4 — Inside VibCode: Workflow Visualizer (2–3 ngày) ⭐

**Đây là phase quan trọng nhất — tạo sự khác biệt với mọi landing page SaaS khác.**

**Phạm vi file:** `landing/components/InsideVibCode.tsx` (NEW), `landing/components/WorkflowVisualizer.tsx` (NEW), `landing/page.tsx`

### Deliverables

- **4.1. Pathway Cards (2x2 grid):** Lấy cảm hứng từ VividKit Guides Homepage
  - Card 1: "🚀 Mới dùng VibCode?" → Giải thích 3 bước, link `/docs`
  - Card 2: "🔧 Đang dùng?" → Khám phá templates, link `/marketplace`
  - Card 3: "🏗️ Muốn hiểu CVF?" → Governance Pipeline, link `/docs`
  - Card 4: "⚡ Mẹo hay & Tính năng mới" → Tips, link `/help`
  - Design: Dark cards trên nền sáng (tương phản), border gradient, icon có màu riêng

- **4.2. CVF Governance Pipeline Visualizer:** Lấy cảm hứng từ ClaudeKit `/ck:brainstorm` pipeline animation
  - Hiển thị luồng: `Template → Form Input → Safety Filter → AI Execute → Governance Check → Output`
  - Mỗi step là 1 node dọc với icon + label + mô tả ngắn
  - Badge: "User Action", "AI Engine", "Guard Gate", "Output"
  - Animation: step-by-step reveal (tùy chọn auto-play hoặc click Next)
  - Click vào step → expand chi tiết (accordion)

- **4.3. CVF Architecture Quick Ref:** Lấy cảm hứng từ ClaudeKit "Config Hierarchy"
  - Sơ đồ: `Template Store → Skill Library → Governance Guards (45) → AI Providers → Export`
  - Step 1→2→3→4 dạng thanh ngang (giống Config Hierarchy)
  - Giải thích: "CVF đọc template, áp dụng governance rules, gọi AI provider, rồi xuất kết quả"

- **4.4. Tab Switcher cho Workflows:** Lấy cảm hứng từ `/ck:brainstorm | /ck:plan | /ck:cook | /ck:fix`
  - Tab 1: "Template → Output" (luồng Non-coder)
  - Tab 2: "AI Agent Chat" (luồng chat)
  - Tab 3: "App Builder Wizard" (luồng 8 bước)
  - Mỗi tab hiển thị pipeline riêng

### Constraints
- Tất cả component phải tách file riêng (GC-023: mỗi file < 350 dòng frontend_component)
- Dữ liệu pipeline là static JSON inline — không import từ lib logic
- Animation dùng CSS transitions + React state — không thêm thư viện animation
- Section này nằm **sau** Testimonials, **trước** Final CTA — chỉ Coder cuộn đến đây

---

## Phase 5 — Polish & Responsiveness (1 ngày)

### Deliverables

- **5.1. Mobile Responsive:** Đảm bảo tất cả sections xuống 1 cột trên mobile (< 768px)
- **5.2. Dark Mode Consistency:** Kiểm tra toàn bộ sections trong dark mode
- **5.3. Performance:** Lazy load sections dưới fold (IntersectionObserver nếu cần)
- **5.4. SEO Meta Tags:** Update `<title>` và `<meta description>` cho landing page
- **5.5. Smooth Scroll:** Anchor link "Xem cách hoạt động ↓" → cuộn mượt đến section #how-it-works

---

## Tổng kết file ảnh hưởng

| File | Hành động | Phase |
|---|---|---|
| `src/app/globals.css` | Thêm Google Font import | P1 |
| `src/app/landing/page.tsx` | Rewrite giao diện | P1–P5 |
| `src/app/landing/components/HeroVisualizer.tsx` | Rewrite chat conversation | P1 |
| `src/app/landing/components/TemplateShowcase.tsx` | NEW | P3 |
| `src/app/landing/components/InsideVibCode.tsx` | NEW | P4 |
| `src/app/landing/components/WorkflowVisualizer.tsx` | NEW | P4 |

**Tổng: 6 file (2 sửa, 4 mới). Zero logic files touched.**

---

## Danh sách KHÔNG ĐƯỢC CHẠM

- ❌ `src/lib/*` — logic nghiệp vụ
- ❌ `src/app/api/*` — API routes
- ❌ `src/app/(dashboard)/*` — dashboard
- ❌ `src/app/admin/*` — Admin Control Plane
- ❌ `src/components/*` — components nghiệp vụ
- ❌ `middleware.ts`, `auth.ts` — bảo mật
- ❌ `package.json` — không thêm dependency

---

## Timeline

```
Phase 1 (Hero + Typography)      : 1–2 ngày
Phase 2 (Social Proof)           : 1 ngày  
Phase 3 (Template Showcase)      : 1 ngày
Phase 4 (Inside VibCode) ⭐      : 2–3 ngày
Phase 5 (Polish)                 : 1 ngày
```

**Tổng: ~6–8 ngày làm việc**

---

## Verification Plan

1. `npm run build` pass 100% sau mỗi phase
2. CVF governance pre-commit hooks pass (GC-023 file size)
3. Kiểm tra trên browser: `/landing` hiển thị đúng
4. Kiểm tra: `/home`, `/admin/*`, `/approvals` — không thay đổi
5. Mobile responsive check (Chrome DevTools)
6. Dark mode check
