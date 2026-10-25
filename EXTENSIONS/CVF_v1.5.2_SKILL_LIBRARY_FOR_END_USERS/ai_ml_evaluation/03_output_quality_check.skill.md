# Output Quality Check

> **Domain:** AI/ML Evaluation  
> **Difficulty:** ⭐ Easy  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

**Khi nào dùng:**

- Review AI output trước khi dùng
- Check cho errors và hallucinations
- Validate against requirements

**Không phù hợp khi:**

- Need domain expert validation → Hỏi expert
- Critical decisions → Human review required

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

- UAT Record: [03_output_quality_check](../../../governance/skill-library/uat/results/UAT-03_output_quality_check.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **AI Output** | Output cần check | ✅ | "[AI response]" |
| **Requirements** | Yêu cầu ban đầu | ✅ | "Summary of document" |
| **Context** | Thông tin thêm | ❌ | "Document về finance" |
| **Quality criteria** | Tiêu chí | ❌ | "Accurate, concise" |

---

## ✅ Expected Output

- Quality score
- Issues found
- Fact-check notes
- Accept/Reject recommendation

---

## 🔍 Cách đánh giá

**Checklist:**

- [ ] Accuracy checked
- [ ] Completeness verified
- [ ] Hallucinations flagged
- [ ] Recommendation clear

**Red flags:**

- ⚠️ Miss obvious errors
- ⚠️ Over-trust AI output

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|---|---|
| Thiếu dữ liệu đầu vào quan trọng | Bổ sung đầy đủ thông tin theo Form Input |
| Kết luận chung chung | Yêu cầu nêu rõ tiêu chí và hành động cụ thể |

---

## 💡 Tips

1. **Verify facts** — AI can hallucinate
2. **Check completeness** — All requirements met?
3. **Look for conflicts** — Internal consistency
4. **Cross-reference** — Multiple sources

---

## 🔗 Next Step

Sau khi hoàn thành **Output Quality Check**, tiếp tục với:
→ [Prompt Evaluation](./02_prompt_evaluation.skill.md)

---

*Output Quality Check Skill — CVF v1.5.2*

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Task: AI tạo báo cáo "low-stock" hàng ngày
Sample outputs: 10 báo cáo gần nhất
Ground truth: dữ liệu tồn kho từ DB
```

### Output mẫu

```markdown
# Output Quality Summary

Accuracy: 8/10
Hallucination: 1/10
Completeness: 7/10

Issues
- 2/10 báo cáo thiếu warehouse B
- 1/10 báo cáo thêm SKU không tồn tại

Actions
- Bổ sung schema output bắt buộc
- Thêm validation với DB trước khi gửi
```

### Đánh giá

- ✅ Có tiêu chí rõ (accuracy/hallucination)
- ✅ Nêu lỗi cụ thể
- ✅ Có hành động khắc phục
- **Kết quả: ACCEPT**

## 🔗 Related Skills

- [Prompt Evaluation](./02_prompt_evaluation.skill.md)
- [Bias Detection](./04_bias_detection.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step: Bias Detection

Sau khi hoàn thành **Output Quality Check**, tiếp tục với:
→ [Bias Detection](./04_bias_detection.skill.md)

---

*CVF Skill Library v1.5.2 | AI/ML Evaluation Domain*

<!-- Text Encoding Exception: pre-existing localized text and symbols are retained; this repair changes only navigation or Markdown structure. -->
