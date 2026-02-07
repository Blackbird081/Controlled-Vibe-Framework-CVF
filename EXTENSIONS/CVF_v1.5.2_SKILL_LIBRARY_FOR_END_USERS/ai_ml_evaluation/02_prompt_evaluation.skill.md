# Prompt Evaluation

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
- Review prompt trước khi deploy
- Debug prompt kém hiệu quả
- Optimize prompt quality

**Không phù hợp khi:**
- Need to create new prompt → Use prompt templates
- Complex prompt engineering → Need specialist

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Prompt** | Prompt cần review | ✅ | "[Your prompt text]" |
| **Expected output** | Output mong muốn | ✅ | "JSON với 5 fields" |
| **Current issues** | Vấn đề hiện tại | ❌ | "Output không consistent" |
| **Model** | Đang dùng model nào | ❌ | "GPT-4" |

---

## ✅ Expected Output

- Prompt analysis
- Issues identified
- Improvement suggestions
- Revised prompt

---

## 🔍 Cách đánh giá

**Checklist:**
- [ ] Identify real issues
- [ ] Suggestions actionable
- [ ] Revised prompt better
- [ ] Explains why changes help

**Red flags:**
- ⚠️ Generic suggestions
- ⚠️ Revised worse than original

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|---|---|
| Thiếu dữ liệu đầu vào quan trọng | Bổ sung đầy đủ thông tin theo Form Input |
| Kết luận chung chung | Yêu cầu nêu rõ tiêu chí và hành động cụ thể |

---

## 💡 Tips

1. **Be specific** — Clear instructions
2. **Give examples** — Few-shot helps
3. **Set constraints** — Format, length
4. **Test variations** — A/B test prompts

---

## 🔗 Next Step

Sau khi hoàn thành **Prompt Evaluation**, tiếp tục với:
→ [Model Selection](./01_model_selection.skill.md)

---

*Prompt Evaluation Skill — CVF v1.5.2*

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Prompt: "Tóm tắt ticket và đề xuất hướng xử lý"
Context: ticket lỗi đồng bộ tồn kho
```

### Output mẫu:
```markdown
# Prompt Review

Issues
- Không yêu cầu format cố định
- Thiếu guardrails cho thông tin nhạy cảm

Improved Prompt
"Bạn là CS agent. Hãy trả lời theo format:
1) Summary (1-2 câu)
2) Root cause giả định (nêu rõ là giả định)
3) Next steps (3 bullet)
Không đưa ra giá/khuyến mãi."
```

### Đánh giá:
- ✅ Nêu rõ lỗ hổng prompt
- ✅ Prompt mới có format + guardrails
- ✅ Phù hợp use case CS
- **Kết quả: ACCEPT**

## 🔗 Related Skills
- [Model Selection](./01_model_selection.skill.md)
- [Output Quality Check](./03_output_quality_check.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Prompt Evaluation**, tiếp tục với:
→ [Output Quality Check](./03_output_quality_check.skill.md)

---

*CVF Skill Library v1.5.2 | AI/ML Evaluation Domain*
