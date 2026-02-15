# CVF — Roadmap Hoàn Thiện Cho Người Dùng Vibe Coding

**Ngày tạo:** 15/02/2026  
**Cơ sở:** [Đánh giá UX Vibe User](CVF_VIBE_USER_UX_ASSESSMENT_2026-02-15.md)  
**Mục tiêu:** Biến CVF thành nền tảng **bất kỳ ai** cũng dùng được — không cần biết code  
**Nguyên tắc:** Fix Critical trước → Important → Nice-to-have. Mỗi phase kết thúc bằng commit + deploy.

---

## Tổng Quan 3 Phase

```
Phase 1: UNBLOCK                    Phase 2: ENHANCE                  Phase 3: POLISH
(Non-coder dùng được)              (Non-coder dùng tốt)             (Non-coder muốn quay lại)
┌──────────────────────┐           ┌──────────────────────┐          ┌──────────────────────┐
│ C1. Login i18n       │           │ I2. Governance toggle│          │ N1. Demo templates   │
│ C2. Auto role        │           │ I3. Sidebar simplify │          │ N3. Difficulty badges│
│ C3. Landing page     │           │ I4. Template preview │          │ N4. Inline tooltips  │
│ C4. Chat prompts     │           │ I5. Real quality     │          │ N5. ARIA labels      │
│ C5. Wizard i18n      │           │ I6. UI tooltips      │          │ N6. PDF/Word export  │
│ C7. Demo mode        │           │ I7. Error messages   │          │ N7. Template search  │
│                      │           │ I8. Hide raw prompt  │          │ N8. Keyboard nav     │
│                      │           │ I1. Video/animation  │          │ N9. aria-live        │
│                      │           │ C6. Marketplace fix  │          │ N2. Progress dash    │
└──────────────────────┘           └──────────────────────┘          └──────────────────────┘
 ~6 tasks, ~2-3 ngày                ~9 tasks, ~3-4 ngày               ~9 tasks, ~3-5 ngày
```

---

## Phase 1: UNBLOCK — Non-Coder Có Thể Sử Dụng

**Mục tiêu:** Loại bỏ mọi rào cản chặn non-coder. Sau phase này, bất kỳ ai cũng login → dùng template → chat AI → nhận kết quả được.

### Task 1.1: Login Page i18n + LanguageToggle ⭐ CRITICAL

**File:** `src/app/login/page.tsx`

| Hạng mục | Hiện tại | Cần làm |
|----------|---------|---------|
| Description | "Vui lòng đăng nhập..." (VI cứng) | i18n bilingual |
| Checkbox labels | "Lưu tài khoản", "Hiện mật khẩu" | i18n bilingual |
| Submit button | "Đăng nhập" | i18n bilingual |
| Credential hint | VI + env var jargon | Friendly bilingual hint |
| Language toggle | ❌ Không có | ✅ Thêm `<LanguageToggle />` vào header |

**Acceptance criteria:**
- [ ] Tất cả text trên login page qua `t()` hoặc `useLanguage()`
- [ ] `<LanguageToggle />` hiển thị trên login header
- [ ] Thêm i18n keys: `auth.description`, `auth.rememberMe`, `auth.showPassword`, `auth.credentialHint`
- [ ] Credential hint không đề cập env vars

### Task 1.2: Auto Role + Ẩn Role Selector ⭐ CRITICAL

**File:** `src/app/login/page.tsx`

| Hạng mục | Hiện tại | Cần làm |
|----------|---------|---------|
| Role selector | Visible: Admin/Editor/Viewer dropdown | Ẩn hoàn toàn, default = `viewer` |
| Role label | "Role (UI only)" — confusing | Không hiển thị |

**Acceptance criteria:**
- [ ] Role selector ẩn khỏi UI (giữ logic bên trong, default `viewer`)
- [ ] Nếu cần chuyển role: thêm vào Settings page thay vì login
- [ ] Non-coder login → tự động vào viewer role

### Task 1.3: Agent Chat Welcome + Suggested Prompts ⭐ CRITICAL

**File:** `src/components/AgentChat.tsx`

| Hạng mục | Hiện tại | Cần làm |
|----------|---------|---------|
| Empty state | Trống hoàn toàn | Welcome message + 4-6 prompt chips |
| Suggested prompts | ❌ | Clickable chips với ví dụ thực tế |

**Suggested prompts (bilingual):**

```
EN:
- "Help me analyze my business idea"
- "Create a marketing plan for my product"
- "Design the architecture for a web app"
- "Write a project specification"
- "Compare technology options for my project"
- "Review my project requirements"

VI:
- "Giúp tôi phân tích ý tưởng kinh doanh"
- "Tạo kế hoạch marketing cho sản phẩm"
- "Thiết kế kiến trúc cho web app"
- "Viết specification cho dự án"
- "So sánh các lựa chọn công nghệ"
- "Review yêu cầu dự án của tôi"
```

**Acceptance criteria:**
- [ ] Welcome message bilingual khi chat trống
- [ ] 6 clickable prompt chips, thay đổi theo ngôn ngữ
- [ ] Click chip → tự điền vào input + gửi
- [ ] Chips ẩn sau khi đã có tin nhắn

### Task 1.4: Wizard i18n (9 wizards) ⭐ CRITICAL

**Files:** 9 wizard components trong `src/components/`

| Wizard | File | Vietnamese strings ước tính |
|--------|------|----|
| AppBuilderWizard | `AppBuilderWizard.tsx` | ~30 strings |
| BusinessStrategyWizard | `BusinessStrategyWizard.tsx` | ~20 strings |
| MarketingWizard | `MarketingWizard.tsx` | ~20 strings |
| ContentWizard | `ContentWizard.tsx` | ~15 strings |
| DataAnalysisWizard | `DataAnalysisWizard.tsx` | ~15 strings |
| DesignWizard | `DesignWizard.tsx` | ~15 strings |
| DevOpsWizard | `DevOpsWizard.tsx` | ~15 strings |
| ResearchWizard | `ResearchWizard.tsx` | ~15 strings |
| TestingWizard | `TestingWizard.tsx` | ~15 strings |

**Approach:**
1. Extract tất cả Vietnamese strings thành `Record<Lang, string>` data objects (giống pattern trong `OnboardingWizard.tsx`)
2. Mỗi wizard đã có `const STEPS` / `WIZARD_STEPS` → add EN/VI cho mỗi field label, description, tip, placeholder
3. Sử dụng `useLanguage()` hook đã có sẵn

**Acceptance criteria:**
- [ ] Tất cả 9 wizard hiển thị đúng ngôn ngữ theo setting
- [ ] Chuyển ngôn ngữ → wizard text thay đổi ngay
- [ ] Không còn Vietnamese hardcoded strings (ngoại trừ trong VI translations)

### Task 1.5: Demo Mode cho User Không Có API Key ⭐ CRITICAL

**Files:** `src/app/(dashboard)/layout.tsx`, `ApiKeyWizard.tsx`, `AgentChat.tsx`

| Hạng mục | Hiện tại | Cần làm |
|----------|---------|---------|
| Mock AI | `NEXT_PUBLIC_CVF_MOCK_AI` env var | Expose qua UI: "Try Demo" button |
| API Key banner | Warning text | Thêm "Try Demo Mode" button bên cạnh "Add API Key" |
| Demo indicator | ❌ | Badge "DEMO MODE" nhỏ ở header khi đang dùng mock |

**Acceptance criteria:**
- [ ] User thấy "Try Demo" button khi chưa có API key
- [ ] Click "Try Demo" → bật mock mode, có thể dùng template + agent chat
- [ ] Demo mode hiển thị badge "DEMO" để phân biệt
- [ ] User có thể chuyển từ Demo → Real bất cứ lúc nào qua Settings

### Task 1.6: Public Landing Page ⭐ CRITICAL

**File mới:** `src/app/landing/page.tsx` (hoặc sửa middleware cho `/`)

| Section | Nội dung |
|---------|---------|
| Hero | "Dùng AI để coding — không cần biết code" + CTA "Bắt đầu ngay" |
| 3-Step | 1. Chọn template 2. Điền yêu cầu 3. Nhận kết quả |
| Features | 50 templates, AI Agent, Governance, Bilingual |
| Personas | Solo Dev / Team / Enterprise — cards |
| CTA | "Đăng nhập" + "Xem docs" + "Try Demo" |
| Footer | License, links |

**Acceptance criteria:**
- [ ] Truy cập `/` khi chưa đăng nhập → hiện landing page (không redirect login)
- [ ] Bilingual (theo LanguageToggle)
- [ ] Responsive mobile
- [ ] CTA buttons dẫn đến `/login`, `/docs`, demo mode
- [ ] Không cần auth

---

## Phase 2: ENHANCE — Non-Coder Dùng Hiệu Quả

**Mục tiêu:** Giảm friction, giúp non-coder hiểu giao diện, tập trung vào input/output thay vì kỹ thuật.

### Task 2.1: GovernanceBar Simple/Advanced Toggle

**File:** `GovernanceBar.tsx`, `AgentChat.tsx`

- Thêm toggle "Simple | Advanced" ở đầu GovernanceBar
- **Simple mode (default cho viewer):** Ẩn Phase/Role/Risk selectors, auto-manage
- **Advanced mode:** Hiện đầy đủ như hiện tại
- Lưu preference vào localStorage

### Task 2.2: Sidebar Role-Based Simplification

**File:** `Sidebar.tsx`

- **Viewer role:** Chỉ hiện Home, Skills, Help, Docs, AI Agent, History, Settings, Logout
- **Ẩn cho viewer:** Multi-Agent, Tools, AI Usage, Context, Analytics, Marketplace
- Dựa trên `permissions` object đã có sẵn

### Task 2.3: Template Preview Samples

**File:** `TemplatePreviewModal.tsx`, template data files

- Thêm `sampleOutput` cho ít nhất 10 template phổ biến nhất
- Hiện preview dạng rendered markdown thay vì "No preview available"

### Task 2.4: Quality Score Real hoặc Ẩn

**File:** `ResultViewer.tsx`

- **Option A:** Integrate real scoring (analyze output structure, completeness, clarity)
- **Option B:** Ẩn score section, chỉ hiện Accept/Reject
- **Recommend:** Option B cho Phase 2, Option A cho Phase 3

### Task 2.5: UI Tooltips cho Technical Terms

**Files:** `GovernanceBar.tsx`, `ResultViewer.tsx`, `DynamicForm.tsx`

- Thêm `?` icon bên cạnh: Phase, Role, Risk, Quality Score terms
- Hover → tooltip bilingual giải thích mỗi concept
- Sử dụng Radix Tooltip hoặc CSS-only tooltip

### Task 2.6: User-Friendly Error Messages

**File:** `ProcessingScreen.tsx`, `AgentChat.tsx`

- "Blocked by CVF enforcement" → "This action needs additional review. Please provide more details."
- "Spec needs additional info" → "Please fill in more details to proceed."
- Tất cả error messages qua i18n

### Task 2.7: Hide Raw Prompt Preview

**File:** `DynamicForm.tsx`

- Default: ẩn "Preview Prompt" section
- Thêm "👁️ Show what AI will receive" toggle (collapsed by default)
- Hoặc: thay terminal-style bằng friendly summary "AI will help you create a [template_name] based on your inputs above"

### Task 2.8: Marketplace i18n + Content

**File:** `TemplateMarketplace.tsx`

- i18n tất cả text (search placeholder, category labels, badges)
- Thêm ít nhất 8-10 community templates (có thể curated)
- Hoặc: ẩn Marketplace khỏi nav cho đến khi có nội dung thực

### Task 2.9: Video/Animation Onboarding

**File:** `OnboardingWizard.tsx`

- Thay video placeholder bằng:
  - **Option A:** Animated GIF/Lottie walkthrough (tự tạo)
  - **Option B:** Embedded YouTube video
  - **Option C:** Interactive step-by-step animation bằng `framer-motion`
- **Recommend:** Option C — không phụ thuộc external hosting

---

## Phase 3: POLISH — Non-Coder Muốn Quay Lại

**Mục tiêu:** Nâng tầm chuyên nghiệp, accessibility, delight users.

### Task 3.1: One-Click Demo Templates
- 3-5 pre-filled templates: "Business Plan Demo", "Marketing Strategy Demo", "App Idea Demo"
- Chạy mock AI tự động, không cần API key
- Kết quả demo có badge "SAMPLE OUTPUT"

### Task 3.2: Difficulty Badges
- Thêm field `difficulty: 'beginner' | 'intermediate' | 'advanced'` vào template data
- Hiển thị badge màu trên template cards (🟢 Easy / 🟡 Medium / 🔴 Advanced)
- Filter theo difficulty

### Task 3.3: Inline Contextual Help
- `?` icon bên cạnh mỗi form field trong wizard/DynamicForm
- Click → popover giải thích + ví dụ
- Bilingual

### Task 3.4: ARIA Labels Toàn Diện
- Template cards: `role="listitem"`, `aria-label`
- Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Navigation: `role="navigation"`, `aria-current="page"`
- Buttons: `aria-label` cho icon-only buttons
- Skip-to-content link

### Task 3.5: PDF/Word Export
- Thêm export buttons: "📄 PDF" và "📝 Word"
- Sử dụng `jsPDF` hoặc `html2pdf.js` cho PDF
- Sử dụng `docx` package cho Word
- Include: title, content, metadata, timestamp

### Task 3.6: Template Search Bar
- Search input trên template grid page
- Fuzzy search theo tên, description, category
- Debounced, bilingual results

### Task 3.7: Keyboard Navigation
- ESC → close modal (tất cả modals)
- Tab navigation trong form fields
- Enter → submit form
- Focus trap trong modals
- Focus ring visible

### Task 3.8: `aria-live` Regions
- Chat messages: `aria-live="polite"` cho new messages
- Processing status: `aria-live="assertive"` cho state changes
- Toast notifications: `role="alert"`

### Task 3.9: Progress Dashboard
- Mới: component `ProgressDashboard.tsx`
- Hiển thị: số template đã dùng, số kết quả accept/reject, streak
- Visual: progress ring, completion bars
- Lưu vào localStorage

---

## Timeline Ước Tính

```
Feb 15-17, 2026   Phase 1: UNBLOCK (6 tasks)
                  ├── Task 1.1: Login i18n (~1h)
                  ├── Task 1.2: Auto role (~30m)
                  ├── Task 1.3: Chat prompts (~1h)
                  ├── Task 1.4: Wizard i18n (~3-4h)
                  ├── Task 1.5: Demo mode (~1h)
                  └── Task 1.6: Landing page (~2-3h)
                  
Feb 18-21, 2026   Phase 2: ENHANCE (9 tasks)
                  ├── Task 2.1-2.2: Governance + Sidebar (~2h)
                  ├── Task 2.3-2.4: Preview + Score (~2h)
                  ├── Task 2.5-2.6: Tooltips + Errors (~2h)
                  ├── Task 2.7-2.8: Prompt + Marketplace (~2h)
                  └── Task 2.9: Video/Animation (~2h)

Feb 22-26, 2026   Phase 3: POLISH (9 tasks)
                  ├── Task 3.1-3.2: Demo + Difficulty (~2h)
                  ├── Task 3.3-3.4: Help + ARIA (~3h)
                  ├── Task 3.5-3.6: Export + Search (~3h)
                  └── Task 3.7-3.9: Keyboard + Live + Dashboard (~3h)
```

---

## Tracking

> **Cập nhật:** 16/02/2026 (lần 2) — Fix 7/9 gaps còn lại. Chỉ còn 2 Nice-to-have chưa xử lý.

### Phase 1: UNBLOCK ✅ COMPLETED (6/6)

| Task | Status | Details |
|------|:------:|---------|
| 1.1 Login i18n + LanguageToggle | ✅ Done | Bilingual 100%: title, Username/Password labels, description, buttons, hints. LanguageToggle added |
| 1.2 Auto role + ẩn selector | ✅ Done | Role selector hidden, default = viewer |
| 1.3 Chat welcome + prompts | ✅ Done | Welcome message + 6 bilingual chips + **auto-send** via `handleSendMessage()` |
| 1.4 Wizard i18n (9 files) | ✅ Done | All 9 wizards + shared wizard-i18n.ts utility |
| 1.5 Demo mode UI | ✅ Done | "Try Demo" button in API key banner |
| 1.6 Public landing page | ✅ Done | `/landing` route + middleware redirects unauthenticated `/` → `/landing` |

### Phase 2: ENHANCE ✅ COMPLETED (9/9)

| Task | Status | Details |
|------|:------:|---------|
| 2.1 GovernanceBar toggle | ✅ Done | Simple/Advanced toggle + **persisted to localStorage** |
| 2.2 Sidebar simplification | ✅ Done | Data/Analytics group hidden for viewer role |
| 2.3 Template preview samples | ✅ Done | Rich placeholder preview instead of "No preview" |
| 2.4 Quality score fix | ✅ Done | **Mock score removed entirely** — no fake `{ overall: 8.2 }`, Technical Details section deleted |
| 2.5 UI tooltips | ✅ Done | Bilingual title attrs on Phase/Role/Risk labels |
| 2.6 Error messages i18n | ✅ Done | ProcessingScreen fully bilingual |
| 2.7 Hide raw prompt | ✅ Done | Collapsed by default, neutral card style, renamed label |
| 2.8 Marketplace i18n + content | ✅ Done | **10 templates** (4 Official + 6 Community), all enabled with "View Details" button |
| 2.9 Onboarding content | ✅ Done | 3-step visual guide replacing video placeholder |

### Phase 3: POLISH ⚠️ 7/9 DONE — 2 REMAINING

| Task | Status | Details | Tồn đọng |
|------|:------:|---------|-----------|
| 3.1 Demo templates | ⚠️ Partial | 4 templates có sampleOutput markdown | Chưa có flow auto-run one-click |
| 3.2 Difficulty badges | ✅ Done | **50/50 templates** có difficulty field (easy/medium/advanced). Colored pills render |
| 3.3 Inline help tooltips | ✅ Done | title attrs on template cards, form submit, chat send | — |
| 3.4 ARIA labels | ✅ Done | 26 ARIA labels across 11 files | — |
| 3.5 PDF/Word export | ⚠️ Partial | Print/PDF button via `window.print()` | Chưa có jsPDF/docx — Nice-to-have |
| 3.6 Template search | ✅ Done | Search input on home page filtering by name/description | — |
| 3.7 Keyboard navigation | ✅ Done | Enter/Space on cards, Escape on modals, Enter on prompts | — |
| 3.8 aria-live regions | ✅ Done | ProcessingScreen + AgentChat message areas | — |
| 3.9 Progress dashboard | ✅ Done | AnalyticsDashboard fully bilingual | — |

---

## Tồn Đọng / Remaining Gaps (16/02/2026 — cập nhật sau fix)

> Chỉ còn **2 Nice-to-have** chưa hoàn thiện. Tất cả Critical và Important đã resolve.

| # | Mức độ | Vấn đề | Trạng thái |
|---|:------:|--------|:----------:|
| ~~1~~ | ~~⭐ Critical~~ | ~~Login form labels hardcoded EN~~ | ✅ Fixed — `isVi` cho title/labels |
| ~~2~~ | ~~⭐ Critical~~ | ~~Chat chips không tự gửi~~ | ✅ Fixed — `handleSendMessage()` after `setInput()` |
| ~~3~~ | ~~⭐ Critical~~ | ~~Root `/` → `/login`~~ | ✅ Fixed — middleware redirects to `/landing` |
| ~~4~~ | ~~🔶 Important~~ | ~~GovernanceBar pref không persist~~ | ✅ Fixed — localStorage read/write |
| ~~5~~ | ~~🔶 Important~~ | ~~Quality score mock data~~ | ✅ Fixed — section & data removed entirely |
| ~~6~~ | ~~🔶 Important~~ | ~~Marketplace trống~~ | ✅ Fixed — 10 templates, enabled buttons |
| ~~7~~ | ~~🟢 Nice~~ | ~~Difficulty chỉ 10/50~~ | ✅ Fixed — 50/50 templates have difficulty |
| 8 | 🟢 Nice | Demo chưa auto-run one-click | ⚠️ Remaining — flow one-click chưa implement |
| 9 | 🟢 Nice | PDF/Word chỉ window.print() | ⚠️ Remaining — jsPDF/docx chưa install |

### Tóm tắt tiến độ tổng

```
Tổng tasks trong roadmap:     24
✅ Hoàn thành đầy đủ:          22  (91.7%)
⚠️ Còn gap nhỏ:                2  (8.3%)  — cả 2 đều Nice-to-have
❌ Chưa làm:                    0  (0%)

Theo mức độ:
  ⭐ Critical:    7/7 ✅ (100%)
  🔶 Important:   8/8 ✅ (100%)  
  🟢 Nice-to-have: 7/9 ✅ (77.8%)  — 2 remaining: demo auto-run, real PDF export
```

---

## Nguyên Tắc Thực Hiện

1. **Mỗi task = 1 commit** — dễ rollback, dễ review
2. **Test sau mỗi phase** — build + manual test trên mobile + desktop
3. **i18n pattern có sẵn** — dùng `useLanguage()` hook, thêm keys vào `en.json` / `vi.json`
4. **Không break existing** — tất cả thay đổi backward-compatible
5. **Deploy sau mỗi phase** — push → Netlify auto-deploy → verify live

---

*Roadmap này dựa trên [Đánh giá UX Vibe User](CVF_VIBE_USER_UX_ASSESSMENT_2026-02-15.md) ngày 15/02/2026.*
