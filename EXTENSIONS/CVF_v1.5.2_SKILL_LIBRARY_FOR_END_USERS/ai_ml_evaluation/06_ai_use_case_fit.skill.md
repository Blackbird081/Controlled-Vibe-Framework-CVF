# AI Use Case Fit

> **Domain:** AI/ML Evaluation  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

**Khi nào dùng:**
- Đánh giá có nên dùng AI không
- Compare AI vs traditional solutions
- Estimate ROI of AI implementation

**Không phù hợp khi:**
- Already decided → Move to implementation
- Need detailed ROI → Financial analyst

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Problem** | Vấn đề cần giải | ✅ | "Reply customer emails" |
| **Current solution** | Đang làm thế nào | ✅ | "Manual, 4 staff" |
| **Volume** | Số lượng | ✅ | "500 emails/day" |
| **Quality bar** | Yêu cầu chất lượng | ✅ | "95% accuracy needed" |
| **Budget** | Ngân sách | ❌ | "$2000/month" |

---

## ✅ Expected Output

- Fit assessment (High/Medium/Low)
- Pros and cons
- ROI estimate
- Recommendation

---

## 🔍 Cách đánh giá

**Checklist:**
- [ ] Honest assessment
- [ ] Consider alternatives
- [ ] ROI realistic
- [ ] Risks identified

**Red flags:**
- ⚠️ Always recommend AI
- ⚠️ Ignore risks/limitations

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|---|---|
| Thiếu dữ liệu đầu vào quan trọng | Bổ sung đầy đủ thông tin theo Form Input |
| Kết luận chung chung | Yêu cầu nêu rõ tiêu chí và hành động cụ thể |

---

## 💡 Tips

1. **Start with problem** — Not technology
2. **Consider total cost** — Dev + maintenance
3. **Pilot first** — Test before full rollout
4. **Human in loop** — For critical decisions

---

## 🔗 Next Step

Sau khi hoàn thành **AI Use Case Fit**, tiếp tục với:
→ [Cost Optimization](./05_cost_optimization.skill.md)

---

*AI Use Case Fit Skill — CVF v1.5.2*

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Use case: Tự động phân loại ticket hỗ trợ (Billing/Inventory/Tech)
Volume: 800 tickets/tuần, SLA 4h
Data: 2 năm ticket + tag chuẩn
Rủi ro: sai routing gây trễ xử lý
```

### Output mẫu:
```markdown
# AI Use Case Fit Assessment

Suitability: HIGH
Reason: text classification rõ ràng, có dữ liệu label lịch sử

Proposed Approach
- AI gợi ý tag + confidence
- Auto-route nếu confidence > 0.85
- Human review nếu < 0.85

Success Metrics
- Top-1 accuracy >= 90%
- SLA giảm từ 4h xuống 2h
```

### Đánh giá:
- ✅ Use case phù hợp AI, rủi ro kiểm soát được
- ✅ Có human-in-the-loop rõ ràng
- ✅ Có metrics đo hiệu quả
- **Kết quả: ACCEPT**

## 🔗 Related Skills
- [Model Selection](./01_model_selection.skill.md)
- [Cost Optimization](./05_cost_optimization.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **AI Use Case Fit**, tiếp tục với:
→ [Model Selection](./01_model_selection.skill.md)

---

*CVF Skill Library v1.5.2 | AI/ML Evaluation Domain*
