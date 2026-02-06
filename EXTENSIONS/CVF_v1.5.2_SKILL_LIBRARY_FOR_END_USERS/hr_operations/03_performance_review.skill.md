# Performance Review

> **Domain:** HR & Operations  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-06

---

## 📌 Prerequisites

> Không yêu cầu

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Đánh giá hiệu suất định kỳ (quarterly/annually)
- Chuẩn bị cho salary review/promotion
- Document performance cho HR records
- Feedback 360 cho nhân viên

**Không phù hợp khi:**
- Feedback nhanh daily/weekly — Dùng 1-on-1 notes
- Đánh giá trong probation — Cần format riêng
- PIP (Performance Improvement Plan) — Cần legal review

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Tên nhân viên** | Người được đánh giá | ✅ | "Nguyễn Thị C" |
| **Vị trí** | Role hiện tại | ✅ | "Senior Developer" |
| **Review period** | Khoảng thời gian | ✅ | "Q1 2026" |
| **Goals/OKRs** | Mục tiêu đã đặt ra | ✅ | "Complete 3 features, reduce bugs 20%" |
| **Achievements** | Những gì đã đạt được | ✅ | "Completed 4 features, bugs giảm 25%" |
| **Areas for improvement** | Điểm cần cải thiện | ✅ | "Communication với PM cần better" |
| **Peer feedback** | Feedback từ đồng nghiệp | ❌ | "Helpful, good code quality" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**
- Performance review hoàn chỉnh
- Rating theo các dimensions
- Development recommendations
- Goals cho next period

**Cấu trúc output:**
```
PERFORMANCE REVIEW

1. Overview & Rating Summary
2. Goals Achievement
   - Goal 1: Met/Exceeded/Not Met + Notes
   - Goal 2: ...
3. Strengths
4. Areas for Development
5. Feedback from Peers (if available)
6. Overall Rating
7. Recommendations
8. Goals for Next Period
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Balanced — cả strengths và areas to improve
- [ ] Specific examples cho mỗi point
- [ ] Rating consistent với evidence
- [ ] Development suggestions actionable
- [ ] Tone constructive, không harsh
- [ ] Goals cho next period SMART

**Red flags (cần Reject):**
- ⚠️ Chỉ có negatives hoặc chỉ positives
- ⚠️ Generic phrases không có examples
- ⚠️ Rating không match với content
- ⚠️ Personal attacks thay vì work feedback

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Recency bias (chỉ nhớ gần đây) | Track achievements suốt period |
| Quá positive/negative | Balance với evidence |
| Vague feedback | Dùng specific examples |
| No forward-looking actions | Luôn có development plan |

---

## 💡 Tips

1. **Collect notes throughout period** — Đừng đợi cuối kỳ
2. **Use SBI framework** — Situation-Behavior-Impact
3. **Focus on behaviors, not personality** — "Code reviews chậm" vs "Lười biếng"
4. **Include peer feedback** — Đa chiều hơn
5. **End with growth plan** — Positive, forward-looking

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Tên nhân viên: Lê Văn D
Vị trí: Product Designer
Review period: H1 2026
Goals: 
  1. Redesign checkout flow (increase conversion 10%)
  2. Build design system v2
  3. Mentor 1 junior
Achievements:
  - Checkout conversion tăng 15% (exceed)
  - Design system 70% complete (partial)
  - Junior đã có thể làm độc lập
Areas for improvement:
  - Deadline management cần better
  - Document designs cho handoff
Peer feedback:
  - "Great creativity, sometimes communication unclear"
```

### Output mẫu:
```
PERFORMANCE REVIEW: LÊ VĂN D
Position: Product Designer | Period: H1 2026

OVERALL RATING: ⭐⭐⭐⭐ Exceeds Expectations

GOALS ACHIEVEMENT:
┌────────────────────────┬──────────┬─────────────────────┐
│ Goal                   │ Status   │ Notes               │
├────────────────────────┼──────────┼─────────────────────┤
│ Checkout redesign      │ EXCEEDED │ 15% vs target 10%   │
│ Design system v2       │ PARTIAL  │ 70% complete        │
│ Mentor junior          │ MET      │ Junior now autonomous│
└────────────────────────┴──────────┴─────────────────────┘

STRENGTHS:
• Strong execution on high-impact projects
  (Checkout redesign created $50K additional revenue)
• Effective mentorship — junior D grew from support to 
  independent in 6 months
• Creative problem-solving, brings fresh ideas

AREAS FOR DEVELOPMENT:
• Deadline management: Design system delayed 2 sprints
  → Suggestion: Break large projects into milestones
• Documentation: Dev team reported unclear specs
  → Suggestion: Use Figma annotation consistently

PEER FEEDBACK SUMMARY:
"Creative và helpful, nhưng cần communicate clearer 
về timeline và changes"

RECOMMENDATIONS:
1. Continue lead role on major redesigns
2. Complete design system trong Q3
3. Work với PM on better scoping

GOALS FOR H2 2026:
1. Complete design system v2 (July)
2. Reduce design-to-dev handoff issues by 50%
3. Present at 1 team knowledge sharing session
```

### Đánh giá:
- ✅ Balanced strengths + improvements
- ✅ Specific examples với numbers
- ✅ Rating matches evidence
- ✅ Actionable development plan
- **Kết quả: ACCEPT**

---

## 🔗 Next Step

> Cần tài liệu chính sách → [Policy Documentation](./05_policy_documentation.skill.md)

---

*Performance Review Skill — CVF v1.5.2 Skill Library*
