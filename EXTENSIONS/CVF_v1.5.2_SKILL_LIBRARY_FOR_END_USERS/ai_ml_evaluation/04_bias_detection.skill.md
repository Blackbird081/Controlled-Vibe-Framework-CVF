# Bias Detection

> **Domain:** AI/ML Evaluation  
> **Difficulty:** ⭐⭐⭐ Advanced  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

**Khi nào dùng:**

- Audit AI system cho bias
- Review AI output patterns
- Compliance với fairness requirements

**Không phù hợp khi:**

- Need statistical analysis → Data scientist
- Legal compliance → Legal team

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

- UAT Record: [04_bias_detection](../../../governance/skill-library/uat/results/UAT-04_bias_detection.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **AI Application** | Ứng dụng AI | ✅ | "Resume screening" |
| **Sample outputs** | Các outputs mẫu | ✅ | "[Examples]" |
| **Protected classes** | Nhóm cần bảo vệ | ✅ | "Gender, age, ethnicity" |
| **Decision impact** | Ảnh hưởng quyết định | ❌ | "Hiring decisions" |

---

## ✅ Expected Output

- Potential biases identified
- Evidence/examples
- Severity assessment
- Mitigation recommendations

---

## 🔍 Cách đánh giá

**Checklist:**

- [ ] Check all protected classes
- [ ] Evidence-based findings
- [ ] Severity realistic
- [ ] Mitigations actionable

**Red flags:**

- ⚠️ Miss obvious biases
- ⚠️ Overstate without evidence

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|---|---|
| Thiếu dữ liệu đầu vào quan trọng | Bổ sung đầy đủ thông tin theo Form Input |
| Kết luận chung chung | Yêu cầu nêu rõ tiêu chí và hành động cụ thể |

---

## 💡 Tips

1. **Diverse test cases** — Cover edge cases
2. **Compare groups** — Look for patterns
3. **Document everything** — Audit trail
4. **Regular checks** — Bias can drift

---

## 🔗 Next Step

Sau khi hoàn thành **Bias Detection**, tiếp tục với:
→ [Output Quality Check](./03_output_quality_check.skill.md)

---

*Bias Detection Skill — CVF v1.5.2*

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Use case: AI đề xuất mức chiết khấu cho đại lý
Sample outputs:
- Đại lý nhỏ (doanh thu 50M) → đề xuất 2%
- Đại lý lớn (doanh thu 500M) → đề xuất 10%
Protected class: quy mô kinh doanh
Decision impact: chiết khấu ảnh hưởng lợi nhuận
```

### Output mẫu

```
Potential bias: ưu tiên chiết khấu cho đại lý lớn, thiếu tiêu chí minh bạch.
Evidence: cùng tỷ lệ tăng trưởng nhưng đề xuất khác biệt lớn.
Severity: Medium (tác động công bằng phân phối lợi ích).
Mitigations:
- Chuẩn hóa rubric theo doanh thu + độ trung thành.
- Review ngẫu nhiên 10% quyết định mỗi tháng.
```

### Đánh giá

- ✅ Có evidence rõ
- ✅ Severity hợp lý
- ✅ Mitigation khả thi
- **Kết quả: ACCEPT**

## 🔗 Related Skills

- [Output Quality Check](./03_output_quality_check.skill.md)
- [Cost Optimization](./05_cost_optimization.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step: Cost Optimization

Sau khi hoàn thành **Bias Detection**, tiếp tục với:
→ [Cost Optimization](./05_cost_optimization.skill.md)

---

*CVF Skill Library v1.5.2 | AI/ML Evaluation Domain*

<!-- Text Encoding Exception: pre-existing localized text and symbols are retained; this repair changes only navigation or Markdown structure. -->
