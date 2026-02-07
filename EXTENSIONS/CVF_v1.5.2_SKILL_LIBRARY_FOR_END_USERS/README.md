# CVF Skill Library v1.5.2

> **Controlled Vibe Framework - Skill Library for End Users**  
> Bộ sưu tập các CVF skills cho marketing, product, SEO, security, compliance, **HR**, **Legal**, và **AI/ML**.

**Policy Note:** v1.5 UX Platform đã **FROZEN** (maintenance-only). Skill Library v1.5.2 **tiếp tục mở rộng** và được **v1.6 thừa hưởng** để dùng chung.

## 📊 Thống kê

| Metric | Value |
|--------|-------|
| **Tổng Skills** | **69 skills** |
| **Domains** | 12 domains |
| **Phase 5 (NEW)** | 16 skills |

## 🚀 Bắt đầu nhanh

### Cách sử dụng Skill Library

**Bước 1:** Chọn domain phù hợp với nhu cầu
**Bước 2:** Mở file `.skill.md` trong domain đó
**Bước 3:** Đọc **Form Input** để biết cần điền gì
**Bước 4:** Copy template và điền thông tin
**Bước 5:** Paste vào AI (ChatGPT, Claude, Gemini)
**Bước 6:** Đánh giá output theo **Checklist**

---

## 🗂️ Domains

### 👔 [HR & Operations](hr_operations/) (Phase 5) ⭐ NEW!
5 skills cho quản lý nhân sự và vận hành

| Skill | Mục đích | Difficulty |
|-------|----------|------------|
| Job Description | Tạo JD chuẩn | Easy |
| Interview Evaluation | Đánh giá ứng viên | Medium |
| Performance Review | Đánh giá hiệu suất | Medium |
| Onboarding Checklist | Checklist nhân viên mới | Easy |
| Policy Documentation | Viết chính sách nội bộ | Medium |

---

### ⚖️ [Legal & Contracts](legal_contracts/) (Phase 5) ⭐ NEW!
5 skills cho hợp đồng và pháp lý

| Skill | Mục đích | Difficulty |
|-------|----------|------------|
| Contract Review | Review hợp đồng | Medium |
| NDA Template | Tạo NDA | Medium |
| Terms of Service | Viết ToS | Advanced |
| Compliance Checklist | Checklist tuân thủ | Medium |
| IP Protection | Bảo vệ sở hữu trí tuệ | Medium |

---

### 🤖 [AI/ML Evaluation](ai_ml_evaluation/) (Phase 5) ⭐ NEW!
6 skills cho đánh giá và tối ưu AI

| Skill | Mục đích | Difficulty |
|-------|----------|------------|
| Model Selection | Chọn model phù hợp | Medium |
| Prompt Evaluation | Đánh giá prompt | Medium |
| Output Quality Check | Kiểm tra output | Easy |
| Bias Detection | Phát hiện bias | Advanced |
| Cost Optimization | Tối ưu chi phí | Medium |
| AI Use Case Fit | Đánh giá AI có fit không | Medium |

---

### 🚀 [App Development](app_development/) (Phase 4)
8 skills cho việc tạo spec để AI Agent build local apps

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

---

### 📈 [Marketing & SEO](marketing_seo/) (Phase 1)
9 skills cho SEO, copywriting, content, ads, và brand

---

### 🎨 [Product & UX](product_ux/) (Phase 2)
8 skills cho A/B testing, accessibility, flows, và onboarding

---

### 🔐 [Security & Compliance](security_compliance/) (Phase 3)
6 skills cho API security, GDPR, privacy, và incidents

---

### 💰 [Finance & Analytics](finance_analytics/) (Phase 4)
8 skills cho financial analysis, budgeting, và forecasting

---

### Các Domains khác
- [Web Development](web_development/) - 6 skills
- [Business Analysis](business_analysis/) - 3 skills
- [Content Creation](content_creation/) - 3 skills
- [Technical Review](technical_review/) - 3 skills

---

## 📝 Hướng dẫn sử dụng chi tiết

### Cấu trúc skill file

```markdown
# Skill Name
> Metadata (Domain, Difficulty, CVF Version, Skill Version, Last Updated)

## 🎯 Mục đích        ← Khi nào dùng skill này
## 📋 Form Input      ← Điền gì vào đây
## ✅ Expected Output ← Kết quả mong đợi
## 🔍 Cách đánh giá   ← Checklist Accept/Reject
## ⚠️ Common Failures ← Lỗi cần tránh
## 💡 Tips            ← Mẹo sử dụng
## 📊 Ví dụ thực tế   ← Input/Output mẫu
## 🔗 Related Skills  ← Skills liên quan
## 📜 Version History ← Lịch sử phiên bản
```

### Ví dụ sử dụng

**Tình huống:** Cần tạo JD cho vị trí mới

1. Mở `hr_operations/01_job_description.skill.md`
2. Đọc phần **Form Input**:
   - Vị trí: Senior Developer
   - Level: 5+ năm
   - Department: Engineering
   - Responsibilities: [...]
3. Paste thông tin vào AI
4. Nhận JD draft
5. Check theo **Checklist đánh giá**
6. Accept nếu pass, Reject nếu fail

---

## 🔗 Links

- **GitHub:** [Blackbird081/Controlled-Vibe-Framework-CVF](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF)
- **CVF Web UI:** `EXTENSIONS/CVF_v1.5_UX_PLATFORM/cvf-web`
- **DIFFICULTY_GUIDE:** [DIFFICULTY_GUIDE.md](DIFFICULTY_GUIDE.md)
- **SKILL_TEMPLATE:** [SKILL_TEMPLATE.md](SKILL_TEMPLATE.md)

---

## 🧪 Automated Validation

Chạy script để kiểm tra metadata + section bắt buộc trong tất cả `.skill.md`:

```bash
cd EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS
python scripts/validate_skills.py
```

Xuất report JSON (tuỳ chọn):

```bash
python scripts/validate_skills.py --json reports/skill_validation.json
```

---

*CVF Skill Library v1.5.2 | Last Updated: 2026-02-07*
