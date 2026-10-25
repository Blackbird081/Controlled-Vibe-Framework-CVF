# Model Selection

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

- Chọn LLM cho dự án mới
- So sánh các options (GPT vs Claude vs Gemini)
- Cân nhắc cost vs performance

**Không phù hợp khi:**

- Highly specialized ML models → Cần ML engineer
- Real-time inference critical → Cần benchmark riêng

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

- UAT Record: [01_model_selection](../../../governance/skill-library/uat/results/UAT-01_model_selection.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Use case** | Bạn muốn làm gì | ✅ | "Customer support chatbot" |
| **Volume** | Số lượng requests | ✅ | "1000 requests/day" |
| **Budget** | Ngân sách | ✅ | "$500/month" |
| **Quality needs** | Yêu cầu chất lượng | ✅ | "High accuracy, formal tone" |
| **Latency** | Yêu cầu tốc độ | ❌ | "Under 3 seconds" |

---

## ✅ Expected Output

- So sánh các model options
- Recommendation với justification
- Cost estimation
- Trade-offs

---

## 🔍 Cách đánh giá

**Checklist:**

- [ ] Cover major options
- [ ] Cost calculation realistic
- [ ] Trade-offs explained
- [ ] Recommendation fits use case

**Red flags:**

- ⚠️ Miss major model options
- ⚠️ Cost calculation wrong

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|---|---|
| Thiếu dữ liệu đầu vào quan trọng | Bổ sung đầy đủ thông tin theo Form Input |
| Kết luận chung chung | Yêu cầu nêu rõ tiêu chí và hành động cụ thể |

---

## 💡 Tips

1. **Start with use case** — Not model hype
2. **Consider latency** — Real-time vs batch
3. **Test before commit** — Free tiers exist
4. **Plan for scale** — Costs change

---

## 🔗 Next Step

Sau khi hoàn thành **Model Selection**, tiếp tục với:
→ [Prompt Evaluation](./02_prompt_evaluation.skill.md)

---

*Model Selection Skill — CVF v1.5.2*

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Task: Viết draft trả lời ticket hỗ trợ bằng tiếng Việt
Constraints: latency < 2s, cost < $300/tháng
Volume: 50k requests/tháng
Quality: không được hallucinate giá/khuyến mãi
```

### Output mẫu

```markdown
# Model Selection

Recommendation: Hybrid
- Model A (small) cho routing + FAQ match
- Model B (medium) cho draft trả lời

Reasoning
- Draft cần ngữ cảnh tốt → model B
- Routing số lượng lớn → model A tiết kiệm

Estimated Cost
- Model A: $60/mo
- Model B: $180/mo
Total: ~$240/mo
```

### Đánh giá

- ✅ Đáp ứng latency + cost
- ✅ Quality control bằng hybrid
- ✅ Tính toán chi phí rõ
- **Kết quả: ACCEPT**

## 🔗 Related Skills

- [AI Use Case Fit](./06_ai_use_case_fit.skill.md)
- [Prompt Evaluation](./02_prompt_evaluation.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

---

*CVF Skill Library v1.5.2 | AI/ML Evaluation Domain*
