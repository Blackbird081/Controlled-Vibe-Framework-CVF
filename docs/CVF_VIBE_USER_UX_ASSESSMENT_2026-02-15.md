# CVF — Đánh Giá UX Cho Người Dùng Vibe Coding

**Auditor:** GitHub Copilot (Claude Opus 4.6)  
**Ngày:** 15/02/2026  
**Cập nhật lần cuối:** 16/02/2026 — Đối chiếu codebase thực tế, cập nhật trạng thái triển khai  
**Đối tượng:** Non-technical users (vibe coding) — người không biết code, chỉ đưa yêu cầu đầu vào và kiểm tra kết quả đầu ra  
**Phương pháp:** Kiểm tra trực tiếp source code, UX flow, i18n coverage, accessibility

---

## 1. Tổng Quan

### Đối tượng mục tiêu

**Vibe coding user** = người dùng:
- Không biết lập trình, không hiểu code
- Chỉ biết mô tả yêu cầu (ý tưởng, mục tiêu kinh doanh)
- Kiểm tra kết quả cuối cùng (accept/reject)
- Phần giữa (phân tích, thiết kế, implement) do AI/Agent tự đảm nhiệm

### Kết luận tổng thể

CVF đã có **nền tảng tốt** cho non-coder:
- Template-first approach (chọn template → điền form → nhận kết quả)
- OnboardingWizard giải thích rõ "không biết prompt → không cần!"
- TourGuide 9 bước tương tác
- 50 templates / 8 categories / 9 wizard chuyên biệt
- Accept/Reject/Retry workflow trên kết quả

Tuy nhiên **còn 7 vấn đề Critical + 8 Important** chặn hoặc gây khó cho non-coder.

> **📊 Trạng thái triển khai (16/02/2026):** Đã xử lý 24/24 tasks trong roadmap. Trong đó **15 hoàn thành đầy đủ**, **9 còn gap** cần fix tiếp (3 Critical, 3 Important, 3 Nice-to-have). Xem chi tiết ở mỗi bảng bên dưới.

---

## 2. Điểm Mạnh Hiện Tại (Đã Tốt Cho Non-Coder)

| # | Tính năng | Chi tiết |
|---|-----------|---------|
| ✅ | **Song ngữ VI/EN** | 203 i18n keys × 2 ngôn ngữ, 20/20 content files, LanguageToggle |
| ✅ | **OnboardingWizard** | 5 bước Q&A, giải thích "không cần biết prompt" |
| ✅ | **TourGuide** | `driver.js` 9 bước, nút nổi góc phải, song ngữ |
| ✅ | **QuickReference** | Widget nổi hiển thị 5-step workflow + accept/revise/reject |
| ✅ | **Template-first** | Trang chủ mặc định è template browsing, category tabs |
| ✅ | **50 templates** | 8 danh mục, form có hints (💡), tips, examples |
| ✅ | **3 export modes** | Simple / With Rules / CVF Full — non-coder chọn "Simple" |
| ✅ | **ResultViewer** | Accept/Reject/Retry rõ ràng |
| ✅ | **Help page** | 5-step workflow, DO/DON'T, tips, ví dụ correct vs wrong |
| ✅ | **ErrorBoundary** | "Oops! Something went wrong" + Retry, ẩn stack trace |
| ✅ | **ApiKeyWizard** | 3 bước, gợi ý provider |

---

## 3. Vấn Đề Phát Hiện

### Critical (7) — Chặn non-coder sử dụng

| # | Vấn đề | File | Chi tiết | Trạng thái (16/02) |
|---|--------|------|--------|:------------------:|
| **C1** | Login page tiếng Việt cứng | `login/page.tsx` | "Đăng nhập", "Lưu tài khoản", "Hiện mật khẩu" hardcoded VI. Không có LanguageToggle. Credential hint đề cập env vars | ✅ **Done** — 100% bilingual: title, Username/Password, buttons, hints. LanguageToggle added |
| **C2** | Role selector gây bối rối | `login/page.tsx#L132` | "Admin/Editor/Viewer — Role (UI only)" — non-coder không hiểu, không biết chọn gì | ✅ **Done** — Role selector ẩn, default = viewer |
| **C3** | Không có landing page công khai | — | URL gốc → redirect `/login`. Không giải thích CVF là gì cho người mới đến | ✅ **Done** — `/landing` page created + middleware redirects `/` → `/landing` |
| **C4** | Agent Chat trống trơn | `AgentChat.tsx#L130` | Mở chat → trống hoàn toàn. Không welcome message, không suggested prompts, không ví dụ | ✅ **Done** — Welcome message + 6 bilingual chips + **auto-send** |
| **C5** | 9 Wizard tiếng Việt cứng | `AppBuilderWizard.tsx` + 8 khác | Step descriptions, tips, field labels — Vietnamese hardcoded, không qua i18n | ✅ **Done** — All 9 wizards bilingual + shared `wizard-i18n.ts` utility |
| **C6** | Marketplace không hoạt động | `TemplateMarketplace.tsx` | 4 template "Coming Soon", UI tiếng Việt, search trên 4 items | ✅ **Done** — 10 templates (4 Official + 6 Community), enabled "View Details" buttons |
| **C7** | API Key bắt buộc, không demo | `ApiKeyWizard.tsx` | Non-coder phải tự lấy API key. Mock mode (`NEXT_PUBLIC_CVF_MOCK_AI`) tồn tại nhưng không expose cho user | ✅ **Done** — "Try Demo" button in API key banner |

### Important (8) — Cải thiện đáng kể trải nghiệm

| # | Vấn đề | File | Chi tiết | Trạng thái (16/02) |
|---|--------|------|--------|:------------------:|
| **I1** | Video onboarding placeholder | `OnboardingWizard.tsx#L96` | "Tutorial video (coming soon)" — thiếu trải nghiệm trực quan | ✅ **Done** — 3-step visual guide thay thế video placeholder |
| **I2** | GovernanceBar hiện cho tất cả | `GovernanceBar.tsx` | Phase/Role/Risk selector quá kỹ thuật, non-coder không hiểu | ✅ **Done** — Simple/Advanced toggle + **persisted to localStorage** |
| **I3** | Sidebar quá nhiều menu | `Sidebar.tsx` | Multi-Agent, Tools, AI Usage, Context — nên ẩn cho viewer role | ✅ **Done** — Data/Analytics group hidden for viewer |
| **I4** | Template Preview rỗng | `TemplatePreviewModal.tsx#L44` | Hầu hết template không có `sampleOutput` → "No preview" | ✅ **Done** — Rich placeholder preview thay "No preview" |
| **I5** | Quality Score giả (luôn 8.2) | `ResultViewer.tsx#L101` | Hardcode `{ overall: 8.2, structure: 9.0, ... }` — gây hiểu nhầm | ✅ **Done** — Mock score & Technical Details section **removed entirely** |
| **I6** | Không có tooltip giải thích | GovernanceBar, ResultViewer | Phase, Role, Risk, Quality Score terms không có `?` icon | ✅ **Done** — Bilingual `title` attrs on Phase/Role/Risk labels |
| **I7** | Error messages kỹ thuật | `ProcessingScreen.tsx` | "Blocked by CVF enforcement", "Spec needs additional info" | ✅ **Done** — ProcessingScreen fully bilingual |
| **I8** | Preview Prompt hiện raw code | `DynamicForm.tsx#L203` | Green monospace terminal-style prompt — intimidating cho non-coder | ✅ **Done** — Collapsed by default, neutral card style |

### Nice-to-Have (9) — Nâng tầm chuyên nghiệp

| # | Vấn đề | Chi tiết | Trạng thái (16/02) |
|---|--------|--------|:------------------:|
| **N1** | One-click demo templates | 3-5 template pre-filled chạy mock data, không cần API key | ⚠️ **Partial** — 4 templates có sampleOutput. Flow auto-run one-click chưa implement |
| **N2** | Progress dashboard | Theo dõi "3/10 analyses done", visual progress | ✅ **Done** — AnalyticsDashboard fully bilingual |
| **N3** | Difficulty ratings | Beginner/Intermediate/Advanced badge trên template cards | ✅ **Done** — **50/50 templates** có difficulty field. Colored pills render |
| **N4** | Inline contextual help | Interactive `?` tooltips bên cạnh mỗi field | ✅ **Done** — `title` attrs on template cards, form submit, chat send |
| **N5** | ARIA labels (chỉ 6 hiện tại) | Thiếu cho template cards, modals, buttons, navigation | ✅ **Done** — 26 ARIA labels across 11 files |
| **N6** | Export PDF/Word | Hiện chỉ Markdown + clipboard | ⚠️ **Partial** — Print/PDF button via `window.print()`. jsPDF/docx chưa install |
| **N7** | Template search bar | Tìm kiếm keyword trên trang chính | ✅ **Done** — Search input filtering by name/description |
| **N8** | Keyboard shortcuts | ESC close modal, Tab navigation chưa nhất quán | ✅ **Done** — Enter/Space on cards, Escape on modals, focus traps |
| **N9** | `aria-live` regions | Chat messages, processing status không announce cho screen reader | ✅ **Done** — ProcessingScreen + AgentChat message areas |

---

## 4. So Sánh: Developer vs Non-Coder Experience

| Tiêu chí | Developer (hiện tại) | Non-Coder (ban đầu 15/02) | Non-Coder (sau fix 16/02) | Non-Coder (mục tiêu) |
|----------|:---:|:---:|:---:|:---:|
| Onboarding | ✅ Rõ ràng | 🟡 Tốt nhưng thiếu video | ✅ 3-step visual guide | ✅ Done |
| Login | ✅ OK | ❌ Tiếng Việt, role selector | ✅ 100% bilingual, auto-role | ✅ Done |
| Chọn template | ✅ Hiểu categories | 🟡 Không biết bắt đầu đâu | ✅ 50/50 difficulty badges + search | ✅ Done |
| Điền form | ✅ Hiểu fields | 🟡 Wizard VI cứng | ✅ 9 wizard bilingual + tooltips | ✅ Done |
| Agent Chat | ✅ Tự biết hỏi gì | ❌ Trống, không biết gõ gì | ✅ 6 prompt chips + **auto-send** | ✅ Done |
| Xem kết quả | ✅ OK | 🟡 Score giả, prompt preview rối | ✅ Mock score xóa hẳn, simplified view | ✅ Done |
| Governance | ✅ Hiểu Phase/Risk | ❌ Không hiểu | ✅ Simple/Advanced + persist localStorage | ✅ Done |
| Demo/Try | ✅ Có API key | ❌ Cần API key mới dùng được | ✅ "Try Demo" button built-in | ✅ Done |
| Landing page | ✅ Hiểu CVF | ❌ Redirect → login | ✅ `/` → `/landing` page | ✅ Done |
| Marketplace | ✅ Hiểu concept | ❌ 4 disabled stubs | ✅ 10 templates, enabled | ✅ Done |

---

## 5. Metrics Đề Xuất Theo Dõi

| Metric | Ban đầu (15/02) | Sau fix (16/02) | Mục tiêu |
|--------|:--------:|:--------:|:---------:|
| i18n coverage (login) | 30% | **100%** ✅ | 100% |
| i18n coverage (wizards) | 40% | **100%** ✅ | 100% |
| ARIA labels count | 6 | **26** ✅ | 50+ |
| Demo mode available | ❌ | **✅** | ✅ |
| Suggested prompts in chat | 0 | **6 + auto-send** ✅ | 6+ |
| Template with sampleOutput | ~10% | **~10%** (5/50) | 80% |
| Template with difficulty | 0% | **100%** (50/50) ✅ | 100% |
| Quality score | Fake 8.2 | **Removed** ✅ | Real or hidden |
| Public landing page | ❌ | **✅** (`/` → `/landing`) | ✅ |
| GovernanceBar persist | ❌ | **✅** localStorage | ✅ |
| PDF/Word export | ❌ | **⚠️** (window.print only) | jsPDF/docx |
| Marketplace content | 0 real | **10 templates** ✅ | 20+ |

---

## 6. Tổng Kết Triển Khai (16/02/2026 — cập nhật sau fix lần 2)

```
                        Tổng Issues     Đã Fix      Partial     Chưa Fix
  Critical (C1-C7):        7              7 ✅        0 ⚠️         0 ❌
  Important (I1-I8):       8              8 ✅        0 ⚠️         0 ❌
  Nice-to-Have (N1-N9):    9              7 ✅        2 ⚠️         0 ❌
  ─────────────────────────────────────────────────────────────────────
  TỔNG:                   24             22 ✅        2 ⚠️         0 ❌
```

### 2 Items còn lại (Nice-to-have)

| # | Gốc | Vấn đề | Mức |
|---|------|---------|:---:|
| 1 | N1 | Demo chưa có flow one-click auto-run | 🟢 Nice |
| 2 | N6 | PDF/Word chỉ `window.print()`, chưa có jsPDF/docx | 🟢 Nice |

---

*Đánh giá này là cơ sở cho [CVF Vibe User Roadmap](CVF_VIBE_USER_ROADMAP_2026-02-15.md).*
