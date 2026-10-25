# User Persona Development

> **Domain:** Product & UX  
> **Difficulty:** Easy  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07
> **Inspired by:** antigravity-awesome-skills/user-personas

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Tạo hoặc review user personas dựa trên data và research. Personas giúp team align về target users và make better product decisions.

**Khi nào nên dùng:**

- Launch sản phẩm mới
- Không có personas hoặc personas cũ
- Team không align về target users
- Before user research planning

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Design, Review |
| Authority Scope | Tactical |
| Autonomy | Auto + Audit |
| Audit Hooks | Input completeness, Output structure, Scope guard |

---

## ⛔ Execution Constraints

- Không thực thi ngoài phạm vi được khai báo
- Tự động dừng nếu thiếu input bắt buộc
- Với rủi ro R1: auto + audit
- Không ghi/đổi dữ liệu hệ thống nếu chưa được xác nhận

---

## ✅ Validation Hooks

- Check đủ input bắt buộc trước khi bắt đầu
- Check output đúng format đã định nghĩa
- Check không vượt scope và không tạo hành động ngoài yêu cầu
- Check output có bước tiếp theo cụ thể

---

## 🧪 UAT Binding

- UAT Record: [user_persona_development](../../../governance/skill-library/uat/results/UAT-user_persona_development.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **Product/Service** | ✅ | Mô tả offering |
| **Market/Industry** | ✅ | Ngành nghề |
| **Existing User Data** | ❌ | Analytics, surveys, interviews |
| **Number of Personas** | ❌ | Thường 3-5 personas |
| **Existing Personas** | ❌ | Nếu đang review |
| **Business Goals** | ❌ | Revenue, growth, retention |

---

## ✅ Checklist Xây dựng Persona

### Demographics

- [ ] Name và photo (realistic)?
- [ ] Age range?
- [ ] Location/Region?
- [ ] Job title/Role?
- [ ] Income level?
- [ ] Education?
- [ ] Family status?

### Psychographics

- [ ] Goals và motivations?
- [ ] Pain points và frustrations?
- [ ] Values và beliefs?
- [ ] Hobbies và interests?
- [ ] Personality traits?

### Behaviors

- [ ] Technology usage?
- [ ] Preferred channels (mobile/desktop)?
- [ ] Information sources?
- [ ] Decision-making process?
- [ ] Brand preferences?

### Context

- [ ] Day in the life?
- [ ] How they'd use your product?
- [ ] Current solutions/alternatives?
- [ ] Buying triggers?
- [ ] Objections/concerns?

### Data Validation

- [ ] Based on real data (not assumptions)?
- [ ] Validated through research?
- [ ] Representative of significant segment?
- [ ] Different enough from other personas?

---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Impact | Fix |
|-----|--------|-----|
| **Too many personas** | Diluted focus | Max 3-5 personas |
| **Based on assumptions** | Wrong targeting | Use real data |
| **Too similar** | Redundant | Merge or differentiate |
| **Too detailed** | Hard to remember | Focus on key traits |
| **Not actionable** | Unused | Include usage scenarios |
| **Static** | Outdated | Review quarterly |
| **No buy-in** | Ignored | Involve stakeholders |

---

## 💡 Tips & Examples

### Persona Template

```markdown
# [Persona Name]
![Photo](placeholder.jpg)

## Quick Bio
"Quote that captures their essence"

**Age:** 32 | **Location:** HCMC | **Job:** Product Manager
**Income:** $$$$ | **Education:** MBA | **Status:** Married, 1 kid

---

## Goals
1. Primary goal
2. Secondary goal
3. Aspirational goal

## Pain Points
1. Main frustration
2. Secondary frustration
3. Fear/concern

## Behaviors
- Uses [tools/apps]
- Prefers [channels]
- Researches via [sources]

## How They Use Our Product
- Primary use case
- Frequency
- Key features used

## Quote
"What they'd say about our product/problem"
```

### Persona Types

| Type | Description |
|------|-------------|
| **Primary** | Main target, drive most decisions |
| **Secondary** | Important but not primary focus |
| **Negative** | Who we're NOT building for |
| **Served** | Who uses but doesn't buy |
| **Customer** | Who buys but doesn't use |

### Data Sources for Personas

```
Quantitative:
✅ Analytics (demographics, behavior)
✅ CRM data (sales, segments)
✅ Surveys (large sample)
✅ Market research

Qualitative:
✅ User interviews (5-10 per persona)
✅ Customer support tickets
✅ Sales call notes
✅ Social media listening
```

### Red Flags - Bad Personas

```
❌ "Mary is a 28-year-old who likes yoga and coffee"
   (Too generic, not actionable)

✅ "Startup Sarah is a first-time founder who needs 
   quick wins to prove to investors. She checks 
   metrics daily but lacks data analysis skills."
   (Actionable, specific behaviors)
```

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI, bạn sẽ nhận được:

1. **Persona Profiles** - 3-5 complete personas
2. **Demographic Summary** - Key characteristics
3. **Goals & Pains Matrix** - Needs mapping
4. **Journey Context** - How they'd use product
5. **Differentiation** - What makes each unique
6. **Prioritization** - Primary vs secondary
7. **Usage Scenarios** - Practical applications

---

## 🔗 Next Step

Sau khi hoàn thành **User Persona Development**, tiếp tục với:
→ [Feature Prioritization (RICE/ICE)](./feature_prioritization.skill.md)

---

*CVF Skill Library v1.5.2 | Product & UX Domain*

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Sản phẩm: StockFlow (SaaS quản lý kho)
Thị trường: SMB retail
Nguồn dữ liệu: 6 phỏng vấn + 120 survey + log 30 ngày
Mục tiêu: tăng activation tuần 1 từ 32% lên 45%
```

### Output mẫu

```markdown
# Persona 1: Mai — Store Manager
Goals: giảm thất thoát, báo cáo nhanh
Pains: dữ liệu sai, thiếu thời gian training
Behaviors: dùng web dashboard mỗi sáng, kiểm mobile cuối ngày

# Persona 2: Anh — Warehouse Staff
Goals: nhập/xuất nhanh, ít lỗi
Pains: mạng yếu, barcode chậm
JTBD: "Khi nhận hàng, tôi cần nhập trong 30s để không trễ giao ca."
```

### Đánh giá

- ✅ Persona dựa trên dữ liệu thật
- ✅ Goals/Pains rõ ràng, đo được
- ✅ Có JTBD áp dụng cho thiết kế
- **Kết quả: ACCEPT**

## 🔗 Related Skills

- [User Flow Analysis](./user_flow_analysis.skill.md)
- [Feature Prioritization (RICE/ICE)](./feature_prioritization.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step: User Flow Analysis

Sau khi hoàn thành **User Persona Development**, tiếp tục với:
→ [User Flow Analysis](./user_flow_analysis.skill.md)

---

*CVF Skill Library v1.5.2 | Product & UX Domain*

<!-- Text Encoding Exception: pre-existing localized text and symbols are retained; this repair changes only navigation or Markdown structure. -->
