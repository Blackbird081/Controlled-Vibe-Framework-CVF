# Feature Prioritization (RICE/ICE)

> **Domain:** Product & UX  
> **Difficulty:** Advanced  
> **CVF Version:** v1.5.2  
> **Inspired by:** antigravity-awesome-skills/feature-prioritization

## 🎯 Mục đích

Đánh giá và prioritize features/initiatives dựa trên frameworks như RICE, ICE, hoặc Value vs Effort. Giúp product team focus vào high-impact work.

**Khi nào nên dùng:**
- Quarterly/Sprint planning
- Backlog grooming
- Roadmap prioritization
- Resource allocation decisions
- Stakeholder discussions

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

### RICE Score Calculation:
```
RICE Score = (Reach × Impact × Confidence) / Effort

Example:
- Reach: 5,000 users/month
- Impact: 2 (high impact)
- Confidence: 80%
- Effort: 3 person-months

Score = (5000 × 2 × 0.8) / 3 = 2,667
```

### Impact Scale (RICE):
| Score | Description | Example |
|-------|-------------|---------|
| 3 | Massive | Complete game-changer |
| 2 | High | Significant improvement |
| 1 | Medium | Notable improvement |
| 0.5 | Low | Small improvement |
| 0.25 | Minimal | Slight improvement |

### Confidence Scale (RICE):
| % | Description | Evidence |
|---|-------------|----------|
| 100% | High | Data from A/B tests |
| 80% | Medium | User research |
| 50% | Low | Intuition, anecdotes |

### ICE Quick Scoring:
```
Feature A: Impact=8, Confidence=9, Ease=7 → Score = 8×9×7 = 504
Feature B: Impact=6, Confidence=7, Ease=9 → Score = 6×7×9 = 378
Feature C: Impact=9, Confidence=5, Ease=4 → Score = 9×5×4 = 180

Priority: A > B > C
```

### Prioritization Matrix:
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

### MoSCoW Alternative:
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

*CVF Skill Library v1.5.2 | Product & UX Domain*
