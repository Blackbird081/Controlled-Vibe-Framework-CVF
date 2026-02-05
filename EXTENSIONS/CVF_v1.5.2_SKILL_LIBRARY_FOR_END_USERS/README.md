# CVF Skill Library v1.5.2

> **Controlled Vibe Framework - Skill Library for End Users**  
> Bộ sưu tập các CVF skills cho marketing, product, SEO, security, compliance và **app development**.

## 📊 Thống kê

| Metric | Value |
|--------|-------|
| **Tổng Skills** | **53 skills** |
| **Domains** | 6 domains |
| **Legacy (skills/)** | 14 skills |
| **New (Phase 1-4)** | 39 skills |

## 🗂️ Domains

### 🚀 [App Development](app_development/) (Phase 4) ⭐ NEW!
8 skills cho việc tạo spec để **AI Agent build local apps**

| Skill | Mục đích | Difficulty |
|-------|----------|------------|
| App Requirements Spec | Thu thập requirements | Easy |
| Tech Stack Selection | Chọn công nghệ | Medium |
| Architecture Design | Thiết kế hệ thống | Hard |
| Database Schema Design | Data modeling | Medium |
| API Design Spec | Thiết kế API | Medium |
| Desktop App Spec | Windows, menus, shortcuts | Medium |
| CLI Tool Spec | Commands, arguments | Medium |
| Local Deployment | Packaging, distribution | Medium |

**Workflow đề xuất:**
```
Requirements → Tech Stack → Architecture → Database/API → App Spec → Deployment
```

---

### 📈 [Marketing & SEO](marketing_seo/) (Phase 1)
9 skills cho SEO, copywriting, content, ads, và brand

| Skill | Difficulty |
|-------|-----------|
| SEO Audit | Medium |
| Copywriting Evaluation | Easy |
| Landing Page CRO | Medium |
| Pricing Strategy Review | Advanced |
| Content Quality Checklist | Easy |
| Competitor Analysis | Medium |
| Email Campaign Review | Easy |
| Social Media Ad Review | Medium |
| Brand Voice Consistency | Medium |

---

### 🎨 [Product & UX](product_ux/) (Phase 2)
8 skills cho A/B testing, accessibility, flows, và onboarding

| Skill | Difficulty |
|-------|-----------|
| A/B Test Review | Medium |
| Accessibility Audit | Medium |
| User Flow Analysis | Medium |
| UX Heuristic Evaluation | Medium |
| Feature Prioritization | Advanced |
| User Persona Development | Easy |
| Error Handling UX | Easy |
| Onboarding Experience Review | Medium |

---

### 🔐 [Security & Compliance](security_compliance/) (Phase 3)
6 skills cho API security, GDPR, privacy, và incidents

| Skill | Difficulty |
|-------|-----------|
| API Security Checklist | Medium |
| GDPR Compliance Review | Advanced |
| Privacy Policy Audit | Easy |
| Incident Response Plan | Advanced |
| Data Handling Review | Medium |
| Terms of Service Review | Easy |

---

### 💰 [Finance & Analytics](finance_analytics/) (Phase 4) ⭐ NEW!
8 skills cho financial analysis, budgeting, và forecasting

| Skill | Difficulty |
|-------|------------|
| Budget Analysis | Easy |
| Financial Statement Review | Medium |
| ROI Calculator Review | Easy |
| KPI Dashboard Audit | Medium |
| Cash Flow Analysis | Medium |
| Investment Due Diligence | Advanced |
| Financial Risk Assessment | Medium |
| Revenue Forecast Review | Medium |

---

### 📚 [Legacy Skills](skills/) (Original)
14 skills từ version gốc - general business và coding

## 🎯 Cách sử dụng

### Option 1: CVF Web UI (Recommended) ⭐
1. Mở CVF Web UI (`npm run dev` trong `cvf-web`)
2. Chọn template từ category **App Development**
3. Điền form → Chọn **CVF Full Mode** → Export
4. Copy và paste vào AI Agent (Claude, Cursor, Copilot)
5. AI Agent build app theo CVF process!

### Option 2: Trực tiếp từ Skill Files
1. Mở skill file (`.skill.md`)
2. Đọc **Form Input** để biết cần điền gì
3. Tự tay tạo spec theo format
4. Paste vào ChatGPT/Claude/Gemini
5. Nhận output theo Expected Output

## 📝 CVF Skill Format

```markdown
# Skill Name
> Metadata (Domain, Difficulty, Version, Skill Version, Last Updated)

## 📌 Prerequisites    ← NEW!
## 🎯 Mục đích
## 📋 Form Input
## ✅ Expected Output
## 🔍 Cách đánh giá
## ⚠️ Common Failures
## 💡 Tips
## 📊 Ví dụ thực tế
## 🔗 Next Step        ← NEW!
```

## 🔗 Links

- **GitHub:** [Blackbird081/Controlled-Vibe-Framework-CVF](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF)
- **CVF Web UI:** `EXTENSIONS/CVF_v1.5_UX_PLATFORM/cvf-web`
- **DIFFICULTY_GUIDE:** [DIFFICULTY_GUIDE.md](DIFFICULTY_GUIDE.md) ← NEW!
- **ROADMAP:** [ROADMAP.md](ROADMAP.md)
- **CREDITS:** [CREDITS.md](CREDITS.md)

---

*CVF Skill Library v1.5.2 | Last Updated: 2026-02-04*
