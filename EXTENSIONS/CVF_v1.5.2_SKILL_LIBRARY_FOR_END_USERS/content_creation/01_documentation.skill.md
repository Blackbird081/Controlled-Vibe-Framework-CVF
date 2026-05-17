# Documentation

> **Domain:** Content Creation  
> **Difficulty:** ⭐ Easy  
> **CVF Version:** v1.5.2
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Viết technical documentation
- Tạo user guides/manuals
- API documentation
- Knowledge base articles
- Process documentation

**Không phù hợp khi:**
- Báo cáo với phân tích → Report Writing
- Slides/presentations → Presentation
- Marketing content → Landing Page skill

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R0 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Design |
| Authority Scope | Informational |
| Autonomy | Auto |
| Audit Hooks | Input completeness, Output structure, Scope guard |

---

## ⛔ Execution Constraints

- Không thực thi ngoài phạm vi được khai báo
- Tự động dừng nếu thiếu input bắt buộc
- Với rủi ro R0: auto
- Không ghi/đổi dữ liệu hệ thống nếu chưa được xác nhận

---

## ✅ Validation Hooks

- Check đủ input bắt buộc trước khi bắt đầu
- Check output đúng format đã định nghĩa
- Check không vượt scope và không tạo hành động ngoài yêu cầu
- Check output có bước tiếp theo cụ thể

---

## 🧪 UAT Binding

- UAT Record: [01_documentation](../../../governance/skill-library/uat/results/UAT-01_documentation.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---
## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Loại docs** | Document type | ✅ | "User guide cho mobile app" |
| **Đối tượng** | Ai sẽ đọc? | ✅ | "End users, non-technical" |
| **Phạm vi** | Phần nào của sản phẩm? | ✅ | "Onboarding + core features" |
| **Tone** | Formal hay casual? | ❌ | "Friendly, easy to follow" |
| **Existing docs** | Có sẵn gì chưa? | ❌ | "Có rough outline" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**
- Structured documentation
- Clear sections với headings
- Step-by-step instructions
- Code examples (nếu technical)
- FAQs section

**Cấu trúc output:**
```
1. Overview
   - Purpose
   - Who should read this
   - Prerequisites

2. Getting Started
   - Quick start guide
   - Installation/Setup

3. Core Concepts
   - Key terms
   - How it works

4. How-to Guides
   - Step-by-step instructions
   - Screenshots/diagrams

5. Reference
   - API/Configuration details
   - Troubleshooting

6. FAQs
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Có clear structure với headings
- [ ] Prerequisites stated upfront
- [ ] Steps numbered và sequential
- [ ] No assumptions about reader knowledge
- [ ] Consistent terminology
- [ ] Includes troubleshooting

**Red flags (cần Reject):**
- ⚠️ Missing prerequisites
- ⚠️ Steps không logical order
- ⚠️ Jargon không explained
- ⚠️ No clear next steps

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Quá technical | Specify audience level |
| Missing context | Add "Before you begin" section |
| No examples | Request với sample code/screenshots |
| Outdated | Specify version/date |

---

## 💡 Tips

1. **Start với user goal** — "How to [do X]"
2. **Number all steps** — Dễ follow
3. **Include examples** — Concrete > abstract
4. **Add troubleshooting** — Anticipated FAQs
5. **Keep it scannable** — Bullets, bold, headings

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Loại docs: User guide cho CVF template system
Đối tượng: End users, có hiểu biết cơ bản về AI
Phạm vi: Chọn template → Điền form → Đánh giá output
Tone: Friendly, practical
```

### Output mẫu:
```
# CVF Template User Guide

## Overview
This guide helps you use CVF templates to work effectively with AI.

**Who is this for:** Anyone working with AI tools
**Time needed:** 10 minutes to read, practice as you go

## Before You Begin
- Access to an AI tool (ChatGPT, Claude, etc.)
- Clear goal for what you want to create

## Step-by-Step Guide

### Step 1: Choose Your Template
1. Go to Template Gallery
2. Browse by category (Strategy, Content, Technical)
3. Click template to see details
4. Check "When to use" section

💡 **Tip:** Start with simple templates before complex ones.

### Step 2: Fill the Form
1. Open selected template
2. Fill required fields (marked with *)
3. Add optional context if available
4. Review before submitting

⚠️ **Important:** More context = better results

### Step 3: Evaluate Output

Use this checklist:
- [ ] Addresses your goal?
- [ ] Factually accurate?
- [ ] Appropriate tone?
- [ ] Actionable?

If YES to all → Accept
If NO to any → Request revision

## Troubleshooting

**Q: Output too generic?**
A: Add more context in form fields.

**Q: Wrong format?**
A: Specify format explicitly in input.
```

### Đánh giá:
- ✅ Clear structure
- ✅ Prerequisites stated
- ✅ Steps numbered
- ✅ Includes tips và troubleshooting
- **Kết quả: ACCEPT**

---

---

## 🔗 Related Skills
- [Report Writing](./02_report_writing.skill.md)
- [Presentation](./03_presentation.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: flow alignment + metadata |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Documentation**, tiếp tục với:
→ [Report Writing](./02_report_writing.skill.md)

---

*CVF Skill Library v1.5.2 | Content Creation Domain*