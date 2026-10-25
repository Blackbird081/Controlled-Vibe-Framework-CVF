# Onboarding Experience Review

> **Domain:** Product & UX  
> **Difficulty:** Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07
> **Inspired by:** antigravity-awesome-skills/onboarding

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Đánh giá và tối ưu first-time user experience (onboarding). Good onboarding drives activation và reduces churn in early days.

**Khi nào nên dùng:**

- High signup-to-active drop-off
- Users không reach "Aha moment"
- Redesign onboarding flow
- Add new user segments

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

- UAT Record: [onboarding_experience_review](../../../governance/skill-library/uat/results/UAT-onboarding_experience_review.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **Product Type** | ✅ | SaaS, Mobile app, E-commerce, etc. |
| **Current Onboarding Steps** | ✅ | List từng step |
| **Activation Metric** | ✅ | What defines "activated user" |
| **Time to Value** | ❌ | How long until first value |
| **Drop-off Data** | ❌ | Where users leave |
| **User Feedback** | ❌ | Complaints, requests |

---

## ✅ Checklist Đánh giá

### First Impression (0-30 seconds)

- [ ] Welcome có warm và clear?
- [ ] Value proposition visible ngay?
- [ ] Có set expectations (what's next)?
- [ ] Có personalization cues?
- [ ] Not overwhelming với information?

### Registration

- [ ] Minimal fields required (email only lý tưởng)?
- [ ] Social login options?
- [ ] Progress indicator nếu multi-step?
- [ ] Clear privacy/terms?
- [ ] Email verification không block?

### First Experience

- [ ] Có quick win trong first session?
- [ ] Core value visible sớm?
- [ ] Có guided tour/tooltips (optional)?
- [ ] Có sample data/templates?
- [ ] Not forcing users to explore everything?

### Guidance

- [ ] Có checklist/progress (what's done/todo)?
- [ ] Có contextual help?
- [ ] Có empty states với CTAs?
- [ ] Có video/docs nếu complex?
- [ ] Có skip options cho power users?

### Activation

- [ ] Có clear definition của "success"?
- [ ] Path to first value < 5 minutes?
- [ ] Có celebrate milestones?
- [ ] Có email nurture sequence?
- [ ] Có in-app prompts to continue?

---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Impact | Fix |
|-----|--------|-----|
| **Too many steps** | Drop-off | Reduce to essentials |
| **No quick win** | Low activation | Show value early |
| **Forced tours** | Annoyance | Make optional |
| **No personalization** | Generic feel | Ask key preference |
| **Feature dump** | Overwhelmed | Progressive disclosure |
| **Long time-to-value** | Churn | Simplify path |
| **No follow-up** | Forgotten | Email nurture |

---

## 💡 Tips & Examples

### Onboarding Patterns

| Pattern | Best For | Example |
|---------|----------|---------|
| **Self-serve** | Simple products | Spotify |
| **Guided wizard** | Complex setup | Salesforce |
| **Interactive demo** | Data products | Airtable |
| **Templates** | Creative tools | Canva |
| **Checklist** | Multi-step value | Notion |

### Time-to-Value Benchmarks

```
Great:    < 2 minutes
Good:     2-5 minutes
Okay:     5-15 minutes
Poor:     > 15 minutes
```

### Onboarding Email Sequence

```
Day 0: Welcome + quick start guide
Day 1: Feature highlight #1
Day 3: Social proof + case study
Day 5: Feature highlight #2
Day 7: Check-in + offer help
Day 14: Last chance engagement
```

### Onboarding Metrics

| Metric | Description |
|--------|-------------|
| **Signup-to-activation** | % complete setup |
| **Time-to-value** | Duration to first value |
| **Feature adoption** | % using key features |
| **D1/D7/D30 retention** | Return rate |
| **Onboarding completion** | % finish onboarding |

### Progressive Onboarding Example

```
Level 1: Immediate (first session)
├── Create account
├── Complete profile
└── First action (quick win)

Level 2: First week
├── Explore feature A
├── Try feature B
└── Invite team member

Level 3: First month
├── Advanced features
├── Integrations
└── Power user tips
```

### Aha Moment Examples

| Product | Aha Moment | Time |
|---------|------------|------|
| Slack | First team message | 10 min |
| Dropbox | First file sync | 5 min |
| Facebook | 7 friends in 10 days | 10 days |
| Zoom | First meeting | 15 min |
| Canva | First design exported | 5 min |

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI, bạn sẽ nhận được:

1. **Onboarding Score** - Overall effectiveness
2. **Drop-off Analysis** - Where users leave
3. **Time-to-Value Assessment** - Is it fast enough?
4. **Quick Wins** - Easy improvements
5. **Redesign Suggestions** - Flow optimization
6. **Email Sequence** - Nurture recommendations
7. **Metrics to Track** - KPIs for improvement

---

## 🔗 Next Step

Sau khi hoàn thành **Onboarding Experience Review**, tiếp tục với:
→ [Error Handling UX](./error_handling_ux.skill.md)

---

*CVF Skill Library v1.5.2 | Product & UX Domain*

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Onboarding: 5 bước, yêu cầu import CSV
Drop-off: 48% tại bước 3 (import)
Time-to-Value: 18 phút
```

### Output mẫu

```markdown
# Onboarding Improvements

## Issues
- Import CSV quá sớm, user chưa hiểu value
- Không có mẫu file

## Changes
- Chuyển import sang step 4
- Thêm "Use sample data" 1 click
- Thêm video 60s ở step 1

## Target
Time-to-Value < 8 phút
Drop-off step 3 < 20%
```

### Đánh giá

- ✅ Dựa trên số liệu drop-off
- ✅ Thay đổi cụ thể, có mục tiêu
- ✅ Dễ A/B test
- **Kết quả: ACCEPT**

## 🔗 Related Skills

- [Error Handling UX](./error_handling_ux.skill.md)
- [Feature Prioritization (RICE/ICE)](./feature_prioritization.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step: Feature Prioritization (RICE/ICE)

Sau khi hoàn thành **Onboarding Experience Review**, tiếp tục với:
→ [Feature Prioritization (RICE/ICE)](./feature_prioritization.skill.md)

---

*CVF Skill Library v1.5.2 | Product & UX Domain*

<!-- Text Encoding Exception: pre-existing localized text and symbols are retained; this repair changes only navigation or Markdown structure. -->
