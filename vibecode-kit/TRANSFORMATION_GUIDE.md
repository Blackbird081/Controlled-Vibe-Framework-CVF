# TRANSFORMATION GUIDE: v3.0 → v4.0

## Hướng dẫn chuyển đổi các file prompt còn lại

---

## 1. TỔNG QUAN THAY ĐỔI

### Cấu trúc file mới (v4.0)

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER                                                             │
│  • Tên Kit + Version                                                │
│  • Hướng dẫn sử dụng nhanh                                         │
├─────────────────────────────────────────────────────────────────────┤
│  THIẾT LẬP VAI TRÒ                                                  │
│  • Kiến trúc sư (AI) - đã có vision                                │
│  • Chủ nhà (Human) - có context                                    │
│  • Partnership declaration                                          │
├─────────────────────────────────────────────────────────────────────┤
│  NGUYÊN TẮC VÀNG                                                    │
│  • Đề xuất trước, hỏi sau                                          │
│  • Vision + Context = Sản phẩm                                     │
│  • Blueprint là khế ước                                             │
├─────────────────────────────────────────────────────────────────────┤
│  QUY TRÌNH 6 BƯỚC                                                   │
│  • Vision → Context → Blueprint → Contract → Build → Refine        │
├─────────────────────────────────────────────────────────────────────┤
│  BƯỚC 1: VISION                                                     │
│  • Template vision đề xuất ngay khi nhận yêu cầu                   │
│  • Layout mẫu cho loại product đó                                  │
│  • Style + Tech stack suggestions                                   │
├─────────────────────────────────────────────────────────────────────┤
│  BƯỚC 2: CONTEXT                                                    │
│  • Câu hỏi context (không phải requirements)                       │
│  • Template điều chỉnh sau khi nhận context                        │
├─────────────────────────────────────────────────────────────────────┤
│  BƯỚC 3: BLUEPRINT                                                  │
│  • Template blueprint chi tiết                                      │
│  • Checkpoint xác nhận                                              │
├─────────────────────────────────────────────────────────────────────┤
│  BƯỚC 4: CONTRACT                                                   │
│  • Template contract                                                │
│  • Scope rõ ràng (có gì, không có gì)                              │
├─────────────────────────────────────────────────────────────────────┤
│  BƯỚC 5: BUILD                                                      │
│  • CODER PACK template                                              │
│  • Quy tắc cho Thợ xây                                             │
├─────────────────────────────────────────────────────────────────────┤
│  BƯỚC 6: REFINE                                                     │
│  • Giới hạn refine                                                  │
│  • Cách yêu cầu refine                                             │
├─────────────────────────────────────────────────────────────────────┤
│  PHỤ LỤC                                                            │
│  • Formulas, patterns, resources cho loại product đó               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. BẢNG CHUYỂN ĐỔI NGÔN NGỮ

### Mở đầu (Role Setup)

| v3.0 | v4.0 |
|------|------|
| `Bạn là "Ông Thầu [Type]" - chuyên gia tạo [product]` | `Bạn là KIẾN TRÚC SƯ [Type]. Bạn đã thiết kế hàng triệu [product]. Bạn CÓ VISION SẴN.` |
| `Tôi là "Chủ đầu tư" - người có ý tưởng cần hiện thực hóa` | `Tôi là CHỦ NHÀ. Tôi có mục tiêu và context mà bạn không có.` |
| (không có) | `Chúng ta là CỘNG SỰ: Bạn dẫn dắt chuyên môn, tôi dẫn dắt mục tiêu.` |

### Bắt đầu tương tác

| v3.0 | v4.0 |
|------|------|
| `Chào bạn! Để tạo [product] ấn tượng, tôi cần biết:` | `Chào Chủ nhà! Với [product type], tôi đề xuất VISION này:` |
| `1. Bạn [làm gì]? 2. [Yêu cầu]? 3. [Tham khảo]?` | `[VISION CHI TIẾT] ... Để customize, tôi cần CONTEXT:` |
| `Trả lời xong tôi sẽ bắt đầu thiết kế!` | `Đây là template tốt cho 80%. Context của bạn là gì?` |

### Khi cần thông tin

| v3.0 | v4.0 |
|------|------|
| `Cho tôi biết [requirement]` | `Context về [aspect] để tôi điều chỉnh vision` |
| `Bạn muốn [A] hay [B]?` | `Tôi suggest [A] vì [lý do]. Có phù hợp context không?` |
| `Mô tả chi tiết [yêu cầu]` | `Khách hàng của bạn như thế nào?` |

### Khi hoàn thành phase

| v3.0 | v4.0 |
|------|------|
| `OK, tôi sẽ làm theo yêu cầu` | `OK, tôi điều chỉnh vision theo context của bạn` |
| `Xác nhận thông tin trên đúng chưa?` | `Đây có phù hợp với context không?` |
| `Đây là Blueprint theo yêu cầu của bạn` | `Đây là Blueprint sau khi kết hợp chuyên môn của tôi + context của bạn` |

### CODER PACK

| v3.0 | v4.0 |
|------|------|
| `Bạn là "Ông Thợ" trong hệ thống Vibecode` | `Bạn là THỢ XÂY trong hệ thống Vibecode Kit v4.0` |
| `Làm ngay, KHÔNG hỏi thêm gì` | `Kiến trúc sư và Chủ nhà đã THỐNG NHẤT. CODE CHÍNH XÁC theo Blueprint.` |
| (không có) | `KHÔNG thay đổi kiến trúc. KHÔNG thêm features. BÁO CÁO khi có conflict.` |

---

## 3. VISION TEMPLATES CHO TỪNG LOẠI

### SAAS-APP Vision Template

```
Với SaaS app [loại], tôi đề xuất VISION:

📐 ARCHITECTURE:
┌─────────────────────────────────────────────────────────────┐
│  PUBLIC PAGES                                               │
│  • Landing page (convert visitors)                          │
│  • Pricing page                                             │
│  • Login / Register                                         │
├─────────────────────────────────────────────────────────────┤
│  AUTHENTICATED AREA                                         │
│  • Dashboard (overview)                                     │
│  • Main feature pages                                       │
│  • Settings / Profile                                       │
├─────────────────────────────────────────────────────────────┤
│  ADMIN (nếu cần)                                           │
│  • User management                                          │
│  • Analytics                                                │
└─────────────────────────────────────────────────────────────┘

🎯 CORE FEATURES (phổ biến cho SaaS):
1. Authentication (email/password, OAuth)
2. User profiles
3. [Core feature 1 dựa trên loại app]
4. [Core feature 2]
5. [Core feature 3]

💻 TECH STACK SUGGEST:
• Frontend: Next.js 14 + Tailwind
• Backend: Next.js API Routes
• Database: Supabase / Prisma + PostgreSQL
• Auth: NextAuth.js

Đây là foundation cho 80% SaaS apps.
Context của bạn để customize?
```

### DASHBOARD Vision Template

```
Với Dashboard [loại], tôi đề xuất VISION:

📐 LAYOUT:
┌─────────────────────────────────────────────────────────────┐
│  ┌──────┐ ┌──────────────────────────────────────────────┐ │
│  │      │ │                  HEADER                      │ │
│  │      │ │  Search | Notifications | Profile           │ │
│  │      │ └──────────────────────────────────────────────┘ │
│  │  S   │ ┌──────────────────────────────────────────────┐ │
│  │  I   │ │                                              │ │
│  │  D   │ │              MAIN CONTENT                    │ │
│  │  E   │ │                                              │ │
│  │  B   │ │  • Stats cards (top)                        │ │
│  │  A   │ │  • Charts / Tables (middle)                 │ │
│  │  R   │ │  • Actions / Details (bottom)               │ │
│  │      │ │                                              │ │
│  └──────┘ └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

📊 DATA VISUALIZATION PATTERNS:
• KPI Cards: 4-6 metrics chính
• Charts: Line (trends), Bar (comparison), Pie (distribution)
• Tables: Sortable, filterable, paginated

🎨 STYLE:
• Clean, data-focused
• High contrast for readability
• Dark mode support (recommended)

Đây là pattern cho 80% dashboards.
Data nào bạn cần visualize?
```

### BLOG-DOCS Vision Template

```
Với [Blog/Docs], tôi đề xuất VISION:

📐 STRUCTURE:

FOR BLOG:
┌─────────────────────────────────────────────────────────────┐
│  Homepage: Featured + Recent + Categories                   │
│  Post page: Content + TOC + Related posts                  │
│  Category page: Filtered posts                              │
│  Author page: Bio + Posts                                   │
└─────────────────────────────────────────────────────────────┘

FOR DOCS:
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────┐ ┌────────────────────────┐ ┌──────────┐      │
│  │ Sidebar  │ │     Main Content       │ │  TOC     │      │
│  │ (nav)    │ │     (MDX)              │ │ (right)  │      │
│  └──────────┘ └────────────────────────┘ └──────────┘      │
│  Search (global) + Version selector (if needed)            │
└─────────────────────────────────────────────────────────────┘

📝 TYPOGRAPHY (optimized for reading):
• Font: 18px body, 1.8 line-height
• Headings: Clear hierarchy
• Code blocks: Syntax highlighting

Đây là pattern cho 80% [blog/docs].
Content type của bạn là gì?
```

### PORTFOLIO Vision Template

```
Với Portfolio [Personal/Agency], tôi đề xuất VISION:

📐 STYLE OPTIONS:

OPTION A - MINIMAL (cho Developers, Writers)
┌─────────────────────────────────────────────────────────────┐
│  Clean, whitespace-heavy                                    │
│  Focus on content                                           │
│  Subtle animations                                          │
│  Typography-driven                                          │
└─────────────────────────────────────────────────────────────┘

OPTION B - BOLD (cho Designers, Creatives)
┌─────────────────────────────────────────────────────────────┐
│  Strong visual impact                                       │
│  Large imagery                                              │
│  Creative layouts                                           │
│  Expressive animations                                      │
└─────────────────────────────────────────────────────────────┘

OPTION C - EDITORIAL (cho Agencies, Studios)
┌─────────────────────────────────────────────────────────────┐
│  Magazine-style                                             │
│  Case study focused                                         │
│  Professional tone                                          │
│  Balanced text/image                                        │
└─────────────────────────────────────────────────────────────┘

📐 SECTIONS (typical):
• Hero (name + tagline + CTA)
• About (story + skills)
• Work (3-6 featured projects)
• Services (if applicable)
• Contact

Nghề của bạn là gì? Tôi sẽ suggest style phù hợp.
```

---

## 4. CHECKLIST TRANSFORM CHO TỪNG FILE

### SAAS-APP.txt → SAAS-APP-v4.txt

- [ ] Header: Thêm version + hướng dẫn nhanh
- [ ] Role setup: Kiến trúc sư + Chủ nhà + Partnership
- [ ] Nguyên tắc vàng: 3 nguyên tắc mới
- [ ] Quy trình: 5 bước → 6 bước (thêm Vision)
- [ ] BƯỚC 1: Thêm VISION template cho SaaS
- [ ] BƯỚC 2: Đổi từ "hỏi requirements" → "hỏi context"
- [ ] BƯỚC 3-4: Update ngôn ngữ Blueprint + Contract
- [ ] BƯỚC 5: Update CODER PACK với quy tắc Thợ xây
- [ ] BƯỚC 6: Thêm giới hạn refine
- [ ] Phụ lục: Giữ nguyên formulas, patterns

### DASHBOARD.txt → DASHBOARD-v4.txt

- [ ] Tất cả items như SAAS-APP
- [ ] BƯỚC 1: Vision template cho Dashboard layouts
- [ ] Phụ lục: Thêm data visualization patterns
- [ ] Giữ nguyên: WCAG guidelines, dark mode support

### BLOG-DOCS.txt → BLOG-DOCS-v4.txt

- [ ] Tất cả items như SAAS-APP
- [ ] BƯỚC 1: Vision template cho Blog vs Docs
- [ ] Phụ lục: Typography system, SEO guidelines

### PORTFOLIO.txt → PORTFOLIO-v4.txt

- [ ] Tất cả items như SAAS-APP
- [ ] BƯỚC 1: 3 style options (Minimal/Bold/Editorial)
- [ ] Logic: Suggest style dựa trên nghề
- [ ] Phụ lục: Animation patterns, layout options

---

## 5. FILE HỖ TRỢ CẦN UPDATE

### 00_CORE/

| File | Hành động |
|------|-----------|
| 00_Overview.md | Rewrite với Partnership philosophy |
| 01_Philosophy.md | Thay bằng PHILOSOPHY_V4.md |
| 02_Roles.md | Update: Chủ nhà, Kiến trúc sư, Thợ xây |
| 03_Lifecycle_5Steps.md | Đổi thành 6 bước |

### 10_PROMPTS/

| File | Hành động |
|------|-----------|
| 01_master_prompt_architect.txt | Update ngôn ngữ Partnership |
| 02_master_prompt_coder.txt | Update quy tắc Thợ xây |
| 03_quick_commands.md | Update với commands mới |

### 20_TEMPLATES/

| File | Hành động |
|------|-----------|
| TEMPLATE_INTAKE.md | Đổi thành TEMPLATE_CONTEXT.md |
| TEMPLATE_BLUEPRINT.md | Thêm Partnership checkpoints |
| TEMPLATE_CONTRACT.md | Update ngôn ngữ |
| Thêm mới | TEMPLATE_VISION.md |

---

## 6. TESTING CHECKLIST

Sau khi transform, test với real project:

### Test 1: First Interaction
- [ ] AI đề xuất vision TRƯỚC khi hỏi
- [ ] Vision có layout, style, tech stack
- [ ] Câu hỏi context (không phải requirements)

### Test 2: Context → Blueprint
- [ ] AI điều chỉnh vision sau khi nhận context
- [ ] Blueprint phản ánh cả vision + context
- [ ] Có checkpoint xác nhận

### Test 3: CODER PACK
- [ ] Thợ xây hỏi DUY NHẤT nơi lưu
- [ ] Code đúng theo Blueprint
- [ ] Không tự thêm features

### Test 4: Refine
- [ ] Giới hạn refine được tôn trọng
- [ ] Thay đổi lớn → yêu cầu quay lại Vision

---

## 7. TIMELINE ĐỀ XUẤT

```
Day 1:
├── Review PHILOSOPHY_V4.md (done)
├── Review LANDING-PAGE-v4.txt (done)
└── Test LANDING-PAGE với real project

Day 2:
├── Transform SAAS-APP.txt
└── Transform DASHBOARD.txt

Day 3:
├── Transform BLOG-DOCS.txt
└── Transform PORTFOLIO.txt

Day 4:
├── Update 00_CORE/
├── Update 10_PROMPTS/
└── Update 20_TEMPLATES/

Day 5:
├── Test tất cả với real projects
├── Collect feedback
└── Final adjustments
```

---

*Transformation Guide - Vibecode Kit v3.0 → v4.0*
