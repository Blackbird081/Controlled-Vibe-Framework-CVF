# Output Quality Check

> **Domain:** AI/ML Evaluation  
> **Difficulty:** ⭐ Easy  
> **CVF Version:** v1.5.2  

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

## 💡 Tips

1. **Verify facts** — AI can hallucinate
2. **Check completeness** — All requirements met?
3. **Look for conflicts** — Internal consistency
4. **Cross-reference** — Multiple sources

---

*Output Quality Check Skill — CVF v1.5.2*
