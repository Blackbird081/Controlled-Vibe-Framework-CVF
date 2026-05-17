# Cost Optimization

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
- AI costs đang cao
- Scale up usage
- Optimize existing implementation

**Không phù hợp khi:**
- Need infrastructure changes → DevOps
- Complex ML pipelines → ML engineer

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

- UAT Record: [05_cost_optimization](../../../governance/skill-library/uat/results/UAT-05_cost_optimization.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---
## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Current usage** | Cách dùng hiện tại | ✅ | "GPT-4, 10K requests/day" |
| **Current cost** | Chi phí | ✅ | "$3000/month" |
| **Use case breakdown** | Các tasks | ✅ | "50% support, 30% content" |
| **Quality requirements** | Yêu cầu quality | ❌ | "Support cần high, content OK" |

---

## ✅ Expected Output

- Cost analysis
- Optimization strategies
- Projected savings
- Implementation steps

---

## 🔍 Cách đánh giá

**Checklist:**
- [ ] Understand current usage
- [ ] Savings realistic
- [ ] Quality trade-offs explained
- [ ] Implementation practical

**Red flags:**
- ⚠️ Unrealistic savings
- ⚠️ Ignore quality impact

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|---|---|
| Thiếu dữ liệu đầu vào quan trọng | Bổ sung đầy đủ thông tin theo Form Input |
| Kết luận chung chung | Yêu cầu nêu rõ tiêu chí và hành động cụ thể |

---

## 💡 Tips

1. **Tier models** — Smaller for simple tasks
2. **Cache responses** — Avoid duplicate calls
3. **Batch requests** — Reduce overhead
4. **Monitor usage** — Track and optimize

---

## 🔗 Next Step

Sau khi hoàn thành **Cost Optimization**, tiếp tục với:
→ [Bias Detection](./04_bias_detection.skill.md)

---

*Cost Optimization Skill — CVF v1.5.2*

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Volume: 60k requests/tháng
Avg tokens: 1,200
Model cost: $5 / 1M tokens
Latency target: < 2s
```

### Output mẫu:
```markdown
# Cost Optimization Plan

Current Cost
- 60k * 1,200 = 72M tokens/mo → ~$360/mo

Optimizations
1. Cache FAQ (20% traffic) → -$72/mo
2. Route low-risk to small model (30%) → -$90/mo
3. Prompt shortening (-15% tokens) → -$54/mo

New Estimated Cost: ~$144/mo (60% reduction)
```

### Đánh giá:
- ✅ Có baseline + savings rõ
- ✅ Không ảnh hưởng SLA
- ✅ Dễ triển khai theo bước
- **Kết quả: ACCEPT**

## 🔗 Related Skills
- [Bias Detection](./04_bias_detection.skill.md)
- [AI Use Case Fit](./06_ai_use_case_fit.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Cost Optimization**, quay lại đánh giá use case:
→ [AI Use Case Fit](./06_ai_use_case_fit.skill.md)

---

*CVF Skill Library v1.5.2 | AI/ML Evaluation Domain*