# CVF Skill Library Expansion Roadmap

> **Nguồn tham khảo:** [antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills) (626+ skills)  
> **Nguyên tắc:** CVF là GỐC — chỉ học hỏi, chuyển đổi, KHÔNG copy nguyên bản

---

## 🎯 Mục tiêu

Mở rộng CVF Skill Library từ 14 skills → **50+ skills** qua 3 giai đoạn, tập trung vào:
1. **End User Focus** — Skills cho người ĐÁNH GIÁ, không phải người code
2. **CVF Governance** — Tuân thủ cấu trúc CVF: Form + Checklist + Common Failures
3. **Practical Value** — Mỗi skill phải có ứng dụng thực tế rõ ràng

---

## 📊 Sự khác biệt: Antigravity vs CVF

| Aspect | Antigravity Skills | CVF Skills |
|--------|-------------------|------------|
| **Đối tượng** | AI Agents / Developers | End Users (không code) |
| **Mục đích** | Execute / Implement | Evaluate / Decide |
| **Format** | SKILL.md cho AI | Form + Checklist + Tips |
| **Output** | Code / Automation | Quality assessment |

### Quy trình chuyển đổi:

```
Antigravity Skill → Phân tích → Trích xuất Evaluation Criteria → CVF Format
```

---

## 📅 Phase 1: Marketing & SEO Domain (Q1 2026)

**Mục tiêu:** 8-10 skills mới

### Skills học hỏi từ Antigravity:

| Antigravity Skill | CVF Skill | Mô tả CVF |
|-------------------|-----------|-----------|
| `seo-fundamentals` | **SEO Audit** | Đánh giá website về SEO cơ bản |
| `seo-content-auditor` | **Content SEO Review** | Checklist đánh giá content SEO |
| `copywriting` | **Copywriting Evaluation** | Đánh giá chất lượng copy marketing |
| `page-cro` | **Landing Page CRO** | Checklist tối ưu conversion |
| `pricing-strategy` | **Pricing Review** | Đánh giá chiến lược giá |
| `marketing-psychology` | **Marketing Message Review** | Đánh giá thông điệp marketing |
| `competitive-landscape` | **Competitor Analysis** | Framework phân tích đối thủ |
| `content-creator` | **Content Quality Checklist** | Tiêu chí đánh giá content |

### Deliverables:
- [ ] Tạo folder `marketing_seo/` trong Skill Library
- [ ] 8 files `.skill.md` theo CVF format
- [ ] Cập nhật `_index.md` và README
- [ ] Tích hợp vào cvf-web UI

---

## 📅 Phase 2: Product & UX Domain (Q2 2026)

**Mục tiêu:** 8-10 skills mới

### Skills học hỏi từ Antigravity:

| Antigravity Skill | CVF Skill | Mô tả CVF |
|-------------------|-----------|-----------|
| `ab-test-setup` | **A/B Test Review** | Đánh giá thiết kế A/B test |
| `accessibility-compliance` | **Accessibility Audit** | Checklist WCAG cho end users |
| `startup-metrics-framework` | **Startup Metrics Review** | Đánh giá KPIs startup |
| `paywall-upgrade-cro` | **Monetization Review** | Đánh giá chiến lược monetization |
| `scroll-experience` | **UX Flow Evaluation** | Đánh giá user experience |
| `brand-guidelines` | **Brand Consistency Check** | Kiểm tra nhất quán thương hiệu |
| `user-research` | **User Feedback Analysis** | Framework phân tích feedback |
| `market-sizing-analysis` | **Market Sizing Review** | Đánh giá tính toán TAM/SAM/SOM |

### Deliverables:
- [ ] Tạo folder `product_ux/` trong Skill Library
- [ ] 8 files `.skill.md` theo CVF format
- [ ] Cập nhật navigation và search trong cvf-web

---

## 📅 Phase 3: Security & Compliance Domain (Q3 2026)

**Mục tiêu:** 6-8 skills mới

### Skills học hỏi từ Antigravity:

| Antigravity Skill | CVF Skill | Mô tả CVF |
|-------------------|-----------|-----------|
| `api-security-best-practices` | **API Security Checklist** | Checklist bảo mật API cho PM/PO |
| `auth-implementation-patterns` | **Authentication Review** | Đánh giá thiết kế auth |
| `data-privacy` | **Privacy Compliance Check** | Checklist GDPR/CCPA |
| `vulnerability-scanner` | **Security Risk Assessment** | Framework đánh giá rủi ro |
| `backend-security-coder` | **Input Validation Review** | Checklist cho security review |
| `cc-skill-security-review` | **Security Requirements Check** | Đánh giá yêu cầu bảo mật |

### Deliverables:
- [ ] Tạo folder `security_compliance/` trong Skill Library
- [ ] 6 files `.skill.md` theo CVF format
- [ ] Cập nhật documentation

---

## 🔄 Quy trình chuyển đổi Skill

### Bước 1: Phân tích Antigravity Skill
```markdown
- Đọc SKILL.md gốc
- Xác định WHAT it does (mục đích)
- Trích xuất EVALUATION criteria ẩn
```

### Bước 2: Chuyển đổi sang CVF Format
```markdown
# [Tên Skill]

> **Domain:** [Category]
> **Difficulty:** [Easy/Medium/Advanced]
> **CVF Version:** v1.5.2
> **Inspired by:** antigravity-awesome-skills/[skill-name]

## 🎯 Mục đích
[Khi nào End User cần skill này]

## 📋 Form Input
[Những gì cần điền để AI giúp đánh giá]

## ✅ Checklist Đánh giá
[Trích từ Antigravity → chuyển thành câu hỏi Yes/No]

## ⚠️ Lỗi Thường Gặp
[Common failures khi không đạt checklist]

## 💡 Tips & Examples
[Ví dụ thực tế cho End Users]
```

### Bước 3: Review & Integrate
```markdown
- Code review nội bộ
- Test với End User thật
- Tích hợp vào cvf-web
- Cập nhật documentation
```

---

## 📁 Cấu trúc thư mục sau mở rộng

```
CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/
├── README.md
├── SKILL_TEMPLATE.md
├── ROADMAP.md                    ← File này
├── CREDITS.md                    ← Ghi nhận nguồn tham khảo
│
├── web_development/              ← 5 skills (hiện có)
├── business_analysis/            ← 3 skills (hiện có)
├── content_creation/             ← 3 skills (hiện có)
├── technical_review/             ← 3 skills (hiện có)
│
├── marketing_seo/                ← Phase 1: 8 skills (mới)
├── product_ux/                   ← Phase 2: 8 skills (mới)
└── security_compliance/          ← Phase 3: 6 skills (mới)

TỔNG CỘNG: 36 skills
```

---

## 📝 Ghi nhận nguồn (Credits)

Để đảm bảo tính minh bạch và không lẫn lộn:

### Trong mỗi skill file:
```markdown
> **Inspired by:** [antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills)
> **Original skill:** [skill-name]
> **Transformation:** Converted to CVF End User format
```

### Trong CREDITS.md:
- Liệt kê tất cả skills đã học hỏi
- Link đến repo gốc
- Giải thích sự khác biệt về format và mục đích

---

## ✅ Tiêu chí hoàn thành

### Mỗi Phase:
- [ ] Tất cả skills đã được chuyển đổi sang CVF format
- [ ] Có Form Input rõ ràng
- [ ] Có Checklist đánh giá với ít nhất 5 items
- [ ] Có Common Failures với ít nhất 3 items
- [ ] Đã tích hợp vào cvf-web UI
- [ ] Documentation đã cập nhật

### Tổng thể:
- [ ] 36+ skills hoàn chỉnh
- [ ] Search functionality trong cvf-web
- [ ] CREDITS.md đầy đủ
- [ ] README cập nhật với skill count mới

---

## � AI Integration Options (Phase 4+)

> **Hiện trạng:** cvf-web hiện chỉ generate prompt từ form, chưa có AI thực thi.
> **Cần quyết định:** Chọn hướng integration phù hợp với mục tiêu dự án.

### Luồng hiện tại:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Form Input    │ →  │  Generate Prompt │ →  │  ???            │
│   (User điền)   │    │  (CVF Template)  │    │  (Chưa có AI)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Option 1: Manual Export (Hiện tại + Cải tiến) ⭐ RECOMMENDED

```
Form → Generate Complete Spec → User Copy → Paste vào ChatGPT/Claude/Gemini
```

**Ưu điểm:**
- Không cần API key, không chi phí
- User tự chọn AI yêu thích
- Dễ maintain, không dependency

**Cần làm:**
- [ ] **Export to Clipboard** — Nút copy 1-click
- [ ] **Export to File** — Download `.md` hoặc `.txt`
- [ ] **Complete Spec Format** — Prompt hoàn chỉnh bao gồm:
  - Context từ Skill
  - User input từ Form
  - Instructions cho AI
  - Expected output format
- [ ] **Quick Copy Templates** — Preset cho ChatGPT, Claude, Gemini

**Mẫu Complete Spec Output:**
```markdown
---
# CVF Task Specification
Generated: 2026-02-02
Skill: Landing Page Review
---

## Context
[Skill description và evaluation criteria từ CVF]

## User Input
[Dữ liệu user đã điền trong form]

## Task
[Instructions rõ ràng cho AI]

## Expected Output
[Format mong muốn: checklist, report, etc.]

---
Copy this entire spec and paste into your preferred AI (ChatGPT, Claude, Gemini, etc.)
```

---

### Option 2: Direct API Integration

```
Form → Generate Prompt → Call API → Show Result
```

| Provider | Model | Chi phí | Free Tier |
|----------|-------|---------|-----------|
| **OpenAI** | GPT-4o | $15/1M tokens | ❌ |
| **Anthropic** | Claude 4 | $15/1M tokens | ❌ |
| **Google** | Gemini Pro | $1.25/1M tokens | ✅ 15 RPM |
| **Groq** | Llama 3.1 | $0.20/1M tokens | ✅ 30 RPM |

**Ưu điểm:**
- Seamless UX, không cần copy/paste
- Có thể chain nhiều calls

**Nhược điểm:**
- Cần API key, chi phí cho mỗi request
- Phải quản lý rate limits, errors
- Dependency vào third-party

**Cần làm:**
- [ ] API key management UI
- [ ] Provider selector (OpenAI/Claude/Gemini/Groq)
- [ ] Streaming response UI
- [ ] Error handling & retry logic
- [ ] Usage tracking & limits

---

### Option 3: Self-Hosted với Ollama

```
Form → Generate Prompt → Local Ollama API → Result
```

**Ưu điểm:**
- Hoàn toàn miễn phí
- Private, không gửi data ra ngoài
- Không rate limits

**Nhược điểm:**
- Cần GPU tốt (8GB+ VRAM)
- Setup phức tạp hơn
- Quality models local < cloud

**Cần làm:**
- [ ] Ollama integration guide
- [ ] Model selection (Llama 3.1, Mistral, etc.)
- [ ] Local API endpoint config

---

### Option 4: Webhook/n8n Integration

```
Form → POST to Webhook → n8n/Make/Zapier → AI → Callback
```

**Ưu điểm:**
- Flexible, user tự cấu hình backend
- Có thể kết hợp nhiều services
- Enterprise-ready

**Nhược điểm:**
- Phức tạp nhất
- Cần technical knowledge để setup

**Cần làm:**
- [ ] Webhook endpoint config UI
- [ ] n8n template workflow
- [ ] Callback handling

---

### 📊 So sánh Options

| Criteria | Option 1 | Option 2 | Option 3 | Option 4 |
|----------|----------|----------|----------|----------|
| **Chi phí** | Free | Pay per use | Free (HW) | Free/Pay |
| **Setup** | None | API key | Ollama | Webhook |
| **UX** | Manual | Seamless | Seamless | Seamless |
| **Privacy** | User choice | Cloud | Local | Depends |
| **Maintenance** | Low | Medium | Medium | High |
| **Recommended for** | MVP/Launch | SaaS | Enterprise | Power users |

### 🎯 Quyết định

**Giai đoạn 1 (Hiện tại):** Implement **Option 1** trước
- Zero dependency, ship nhanh
- Spec export hoàn chỉnh, user tự dùng AI

**Giai đoạn 2 (Future):** Xem xét thêm Options 2-4 dựa trên feedback

---

## �🚀 Bắt đầu ngay

**Phase 1 Priority Skills (thực hiện trước):**

1. **SEO Audit** ← `seo-fundamentals`
2. **Copywriting Evaluation** ← `copywriting`
3. **Landing Page CRO** ← `page-cro`

Đây là 3 skills có ứng dụng rộng nhất và dễ chuyển đổi nhất.

**Immediate Task (Option 1 Implementation):**
- [ ] Cải tiến Generate Prompt → Complete Spec
- [ ] Thêm nút Copy to Clipboard
- [ ] Thêm nút Export to File (.md)

---

*Roadmap version 1.1 — Updated 2026-02-02*
*CVF v1.5.2 Skill Library Expansion Plan*
*Added: AI Integration Options*

