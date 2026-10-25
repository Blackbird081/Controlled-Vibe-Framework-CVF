# Feature Prioritization (RICE/ICE)

> **Domain:** Product & UX  
> **Difficulty:** Advanced  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07
> **Inspired by:** antigravity-awesome-skills/feature-prioritization

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Đánh giá và prioritize features/initiatives dựa trên frameworks như RICE, ICE, hoặc Value vs Effort. Giúp product team focus vào high-impact work.

**Khi nào nên dùng:**

- Quarterly/Sprint planning
- Backlog grooming
- Roadmap prioritization
- Resource allocation decisions
- Stakeholder discussions

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

- UAT Record: [feature_prioritization](../../../governance/skill-library/uat/results/UAT-feature_prioritization.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **Feature List** | ✅ | Danh sách features cần prioritize |
| **Company Goals** | ✅ | OKRs hoặc objectives |
| **Framework** | ✅ | RICE, ICE, Value/Effort, MoSCoW |
| **Time Horizon** | ✅ | Quarter, Half-year, Year |
| **Team Capacity** | ❌ | Resource constraints |
| **Dependencies** | ❌ | Feature dependencies |

---

## ✅ RICE Framework Checklist

### Reach (R)

- [ ] Bao nhiêu users/customers sẽ affected?
- [ ] Per week? Per month? Per quarter?
- [ ] Data-backed hoặc estimated?
- [ ] Có consider all segments?

### Impact (I)

- [ ] Impact level defined (0.25 = low, 3 = massive)?
- [ ] Aligned với company goals?
- [ ] Có quantifiable outcome?
- [ ] Conservative estimate?

### Confidence (C)

- [ ] Có user research backing?
- [ ] Có data supporting?
- [ ] Team agreement on estimates?
- [ ] % confidence realistic?

### Effort (E)

- [ ] Estimated in person-months?
- [ ] All disciplines included (dev, design, QA)?
- [ ] Có buffer cho unknowns?
- [ ] Có consider dependencies?

---

## ✅ ICE Framework Checklist

### Impact (I)

- [ ] Score 1-10 cho potential impact?
- [ ] Có align với metrics/goals?
- [ ] Realistic expectations?

### Confidence (C)

- [ ] Score 1-10 cho certainty?
- [ ] Có evidence backing?
- [ ] Team consensus?

### Ease (E)

- [ ] Score 1-10 cho implementation ease?
- [ ] Có consider all work involved?
- [ ] Có include testing, rollout?

---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Impact | Fix |
|-----|--------|-----|
| **HiPPO** | Best ideas ignored | Use data, not opinions |
| **Overconfidence** | Wrong priorities | Be conservative |
| **Ignoring effort** | Resource mismatch | Accurate estimation |
| **No alignment** | Scattered focus | Tie to company goals |
| **One-time scoring** | Stale priorities | Revisit regularly |
| **Averaging scores** | Lose nuance | Use framework properly |

---

## 💡 Tips & Examples

### RICE Score Calculation

```
RICE Score = (Reach × Impact × Confidence) / Effort

Example:
- Reach: 5,000 users/month
- Impact: 2 (high impact)
- Confidence: 80%
- Effort: 3 person-months

Score = (5000 × 2 × 0.8) / 3 = 2,667
```

### Impact Scale (RICE)

| Score | Description | Example |
|-------|-------------|---------|
| 3 | Massive | Complete game-changer |
| 2 | High | Significant improvement |
| 1 | Medium | Notable improvement |
| 0.5 | Low | Small improvement |
| 0.25 | Minimal | Slight improvement |

### Confidence Scale (RICE)

| % | Description | Evidence |
|---|-------------|----------|
| 100% | High | Data from A/B tests |
| 80% | Medium | User research |
| 50% | Low | Intuition, anecdotes |

### ICE Quick Scoring

```
Feature A: Impact=8, Confidence=9, Ease=7 → Score = 8×9×7 = 504
Feature B: Impact=6, Confidence=7, Ease=9 → Score = 6×7×9 = 378
Feature C: Impact=9, Confidence=5, Ease=4 → Score = 9×5×4 = 180

Priority: A > B > C
```

### Prioritization Matrix

```
           High Value
               ↑
    Quick Wins │ Big Bets
               │
Low ←──────────┼──────────→ High
Effort         │          Effort
               │
    Fill-Ins   │ Time Sinks
               ↓
           Low Value
```

### MoSCoW Alternative

- **Must have:** Critical, non-negotiable
- **Should have:** Important, not vital
- **Could have:** Nice to have
- **Won't have:** Not now, maybe later

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI, bạn sẽ nhận được:

1. **Scored Feature List** - Rankings by framework
2. **Priority Tiers** - High/Medium/Low groupings
3. **Goal Alignment** - How each maps to objectives
4. **Trade-off Analysis** - Quick wins vs big bets
5. **Resource Allocation** - Suggested distribution
6. **Roadmap Suggestion** - Timeline proposal
7. **Risk Assessment** - What could go wrong

---

## 🔗 Next Step

Sau khi hoàn thành **Feature Prioritization (RICE/ICE)**, tiếp tục với:
→ [UX Heuristic Evaluation](./ux_heuristic_evaluation.skill.md)

---

*CVF Skill Library v1.5.2 | Product & UX Domain*

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Features: offline sync, barcode batch import, low-stock alert, role permissions
Reach (Q): 1200 / 600 / 900 / 400
Impact: 3 / 2 / 2 / 1
Confidence: 0.7 / 0.6 / 0.8 / 0.5
Effort (person-weeks): 6 / 3 / 2 / 4
```

### Output mẫu

```markdown
# RICE Scoring

| Feature | R | I | C | E | Score |
|---|---:|---:|---:|---:|---:|
| Low-stock alert | 900 | 2 | 0.8 | 2 | 720 |
| Barcode batch import | 600 | 2 | 0.6 | 3 | 240 |
| Offline sync | 1200 | 3 | 0.7 | 6 | 420 |
| Role permissions | 400 | 1 | 0.5 | 4 | 50 |

Top 2: Low-stock alert, Offline sync
```

### Đánh giá

- ✅ Score minh bạch, dễ audit
- ✅ Ưu tiên dựa trên data
- ✅ Dễ chuyển roadmap
- **Kết quả: ACCEPT**

## 🔗 Related Skills

- [Onboarding Experience Review](./onboarding_experience_review.skill.md)
- [A/B Test Review](./ab_test_review.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step: A/B Test Review

Sau khi hoàn thành **Feature Prioritization (RICE/ICE)**, tiếp tục với:
→ [A/B Test Review](./ab_test_review.skill.md)

---

*CVF Skill Library v1.5.2 | Product & UX Domain*

<!-- Text Encoding Exception: pre-existing localized text and symbols are retained; this repair changes only navigation or Markdown structure. -->
