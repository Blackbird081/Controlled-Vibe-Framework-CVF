# CVF — Đánh Giá UX Cho Người Dùng Vibe Coding

**Auditor:** GitHub Copilot (Claude Opus 4.6)  
**Ngày:** 15/02/2026  
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

| # | Vấn đề | File | Chi tiết |
|---|--------|------|---------|
| **C1** | Login page tiếng Việt cứng | `login/page.tsx` | "Đăng nhập", "Lưu tài khoản", "Hiện mật khẩu" hardcoded VI. Không có LanguageToggle. Credential hint đề cập env vars |
| **C2** | Role selector gây bối rối | `login/page.tsx#L132` | "Admin/Editor/Viewer — Role (UI only)" — non-coder không hiểu, không biết chọn gì |
| **C3** | Không có landing page công khai | — | URL gốc → redirect `/login`. Không giải thích CVF là gì cho người mới đến |
| **C4** | Agent Chat trống trơn | `AgentChat.tsx#L130` | Mở chat → trống hoàn toàn. Không welcome message, không suggested prompts, không ví dụ |
| **C5** | 9 Wizard tiếng Việt cứng | `AppBuilderWizard.tsx` + 8 khác | Step descriptions, tips, field labels — Vietnamese hardcoded, không qua i18n |
| **C6** | Marketplace không hoạt động | `TemplateMarketplace.tsx` | 4 template "Coming Soon", UI tiếng Việt, search trên 4 items |
| **C7** | API Key bắt buộc, không demo | `ApiKeyWizard.tsx` | Non-coder phải tự lấy API key. Mock mode (`NEXT_PUBLIC_CVF_MOCK_AI`) tồn tại nhưng không expose cho user |

### Important (8) — Cải thiện đáng kể trải nghiệm

| # | Vấn đề | File | Chi tiết |
|---|--------|------|---------|
| **I1** | Video onboarding placeholder | `OnboardingWizard.tsx#L96` | "Tutorial video (coming soon)" — thiếu trải nghiệm trực quan |
| **I2** | GovernanceBar hiện cho tất cả | `GovernanceBar.tsx` | Phase/Role/Risk selector quá kỹ thuật, non-coder không hiểu |
| **I3** | Sidebar quá nhiều menu | `Sidebar.tsx` | Multi-Agent, Tools, AI Usage, Context — nên ẩn cho viewer role |
| **I4** | Template Preview rỗng | `TemplatePreviewModal.tsx#L44` | Hầu hết template không có `sampleOutput` → "No preview" |
| **I5** | Quality Score giả (luôn 8.2) | `ResultViewer.tsx#L101` | Hardcode `{ overall: 8.2, structure: 9.0, ... }` — gây hiểu nhầm |
| **I6** | Không có tooltip giải thích | GovernanceBar, ResultViewer | Phase, Role, Risk, Quality Score terms không có `?` icon |
| **I7** | Error messages kỹ thuật | `ProcessingScreen.tsx` | "Blocked by CVF enforcement", "Spec needs additional info" |
| **I8** | Preview Prompt hiện raw code | `DynamicForm.tsx#L203` | Green monospace terminal-style prompt — intimidating cho non-coder |

### Nice-to-Have (9) — Nâng tầm chuyên nghiệp

| # | Vấn đề | Chi tiết |
|---|--------|---------|
| **N1** | One-click demo templates | 3-5 template pre-filled chạy mock data, không cần API key |
| **N2** | Progress dashboard | Theo dõi "3/10 analyses done", visual progress |
| **N3** | Difficulty ratings | Beginner/Intermediate/Advanced badge trên template cards |
| **N4** | Inline contextual help | Interactive `?` tooltips bên cạnh mỗi field |
| **N5** | ARIA labels (chỉ 6 hiện tại) | Thiếu cho template cards, modals, buttons, navigation |
| **N6** | Export PDF/Word | Hiện chỉ Markdown + clipboard |
| **N7** | Template search bar | Tìm kiếm keyword trên trang chính |
| **N8** | Keyboard shortcuts | ESC close modal, Tab navigation chưa nhất quán |
| **N9** | `aria-live` regions | Chat messages, processing status không announce cho screen reader |

---

## 4. So Sánh: Developer vs Non-Coder Experience

| Tiêu chí | Developer (hiện tại) | Non-Coder (hiện tại) | Non-Coder (mục tiêu) |
|----------|:---:|:---:|:---:|
| Onboarding | ✅ Rõ ràng | 🟡 Tốt nhưng thiếu video | ✅ Video + interactive demo |
| Login | ✅ OK | ❌ Tiếng Việt, role selector | ✅ Bilingual, auto-role |
| Chọn template | ✅ Hiểu categories | 🟡 OK nhưng không biết bắt đầu đâu | ✅ Difficulty badge + "Start here" |
| Điền form | ✅ Hiểu fields | 🟡 Tips giúp, nhưng wizard VI cứng | ✅ Bilingual wizard + tooltips |
| Agent Chat | ✅ Tự biết hỏi gì | ❌ Trống, không biết gõ gì | ✅ Suggested prompts + examples |
| Xem kết quả | ✅ OK | 🟡 Score giả, prompt preview rối | ✅ Real score, simplified view |
| Governance | ✅ Hiểu Phase/Risk | ❌ Không hiểu | ✅ Auto/hidden cho Simple mode |
| Demo/Try | ✅ Có API key | ❌ Cần API key mới dùng được | ✅ Demo mode built-in |

---

## 5. Metrics Đề Xuất Theo Dõi

| Metric | Hiện tại | Mục tiêu Phase 1 | Mục tiêu Phase 3 |
|--------|:--------:|:-----------------:|:-----------------:|
| i18n coverage (login) | 30% | 100% | 100% |
| i18n coverage (wizards) | 40% | 90% | 100% |
| ARIA labels count | 6 | 20+ | 50+ |
| Demo mode available | ❌ | ✅ | ✅ |
| Suggested prompts in chat | 0 | 6+ | 10+ |
| Template with sampleOutput | ~10% | 30% | 80% |
| Real quality scoring | ❌ | 🟡 | ✅ |
| Public landing page | ❌ | ✅ | ✅ |

---

*Đánh giá này là cơ sở cho [CVF Vibe User Roadmap](CVF_VIBE_USER_ROADMAP_2026-02-15.md).*
